"""
MT5 Automation Module

Provides UI automation capabilities for MetaTrader 5 login when manual login is required.
This module automates the MT5 login dialog to bypass the need for manual intervention.
"""
import os
import time
import logging
import subprocess
import threading
from typing import Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Thread lock to prevent concurrent automation attempts
# Only one automation can run at a time since there's only one MT5 terminal
automation_lock = threading.Lock()
AUTOMATION_TIMEOUT = 120  # Maximum wait time (2 minutes) for automation to complete

# Configuration: Button coordinates from environment variables
MT5_CONNECT_BUTTON_X = os.getenv('MT5_CONNECT_BUTTON_X', None)
MT5_CONNECT_BUTTON_Y = os.getenv('MT5_CONNECT_BUTTON_Y', None)


def get_connect_button_coords() -> Optional[Tuple[int, int]]:
    """
    Get connect button coordinates from environment variables
    
    Returns:
        Tuple of (x, y) coordinates or None if not set
    """
    if MT5_CONNECT_BUTTON_X is None or MT5_CONNECT_BUTTON_Y is None:
        return None
    
    try:
        x = int(MT5_CONNECT_BUTTON_X.strip())
        y = int(MT5_CONNECT_BUTTON_Y.strip())
        return (x, y)
    except (ValueError, AttributeError) as e:
        logger.warning(f'Failed to parse button coordinates: X="{MT5_CONNECT_BUTTON_X}", Y="{MT5_CONNECT_BUTTON_Y}": {e}')
        return None

# Try to import pyautogui, but make it optional
try:
    import pyautogui
    # CRITICAL: Disable fail-safe globally at import time for VPS/headless environments
    # Fail-safe triggers if mouse is in screen corner, which breaks automation on VPS
    pyautogui.FAILSAFE = False
    # Small pause between actions for stability
    pyautogui.PAUSE = 0.1
    logger.info('PyAutoGUI loaded with FAILSAFE=False for VPS automation')
    AUTOMATION_AVAILABLE = True
except ImportError:
    AUTOMATION_AVAILABLE = False
    logger.warning("pyautogui not installed. UI automation will not be available.")


def is_mt5_running() -> bool:
    """
    Check if MT5 terminal process is running
    
    Returns:
        True if terminal64.exe process is found, False otherwise
    """
    try:
        try:
            import psutil
        except ImportError:
            # Fallback to tasklist if psutil not available
            try:
                result = subprocess.run(
                    ['tasklist', '/FI', 'IMAGENAME eq terminal64.exe'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                return 'terminal64.exe' in result.stdout
            except Exception:
                return False
        
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                proc_name = proc.info['name'].lower() if proc.info['name'] else ''
                if 'terminal64.exe' in proc_name:
                    logger.info(f'MT5 terminal process found: PID {proc.info["pid"]}')
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return False
    except ImportError:
        # Fallback: try using tasklist on Windows
        try:
            result = subprocess.run(
                ['tasklist', '/FI', 'IMAGENAME eq terminal64.exe'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return 'terminal64.exe' in result.stdout
        except Exception as e:
            logger.warning(f'Could not check MT5 process: {e}')
            return False


def launch_mt5_terminal(mt5_path: str) -> bool:
    """
    Launch MT5 terminal if not already running
    
    Args:
        mt5_path: Path to terminal64.exe
        
    Returns:
        True if terminal was launched or already running, False otherwise
    """
    if is_mt5_running():
        logger.info('MT5 terminal is already running')
        return True
    
    if not os.path.exists(mt5_path):
        logger.error(f'MT5 terminal not found at: {mt5_path}')
        return False
    
    try:
        logger.info(f'Launching MT5 terminal: {mt5_path}')
        subprocess.Popen(
            [mt5_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
        )
        
        # Wait for terminal to start
        max_wait = 15
        waited = 0
        while waited < max_wait:
            time.sleep(1)
            waited += 1
            if is_mt5_running():
                logger.info(f'MT5 terminal started successfully after {waited}s')
                time.sleep(3)  # Give it time to fully initialize
                return True
        
        logger.error(f'MT5 terminal did not start within {max_wait} seconds')
        return False
    except Exception as e:
        logger.error(f'Failed to launch MT5 terminal: {e}', exc_info=True)
        return False


def get_mouse_position_helper() -> Tuple[int, int]:
    """
    Helper function to get current mouse position.
    Useful for finding coordinates of UI elements.
    
    Returns:
        Tuple of (x, y) coordinates
    """
    if not AUTOMATION_AVAILABLE:
        return (0, 0)
    return pyautogui.position()


def capture_coordinates_after_delay(delay_seconds: int = 5) -> Tuple[int, int]:
    """
    Capture mouse coordinates after a delay.
    Useful for positioning mouse manually before capturing.
    
    Args:
        delay_seconds: Number of seconds to wait before capturing
        
    Returns:
        Tuple of (x, y) coordinates
    """
    if not AUTOMATION_AVAILABLE:
        logger.error("pyautogui not available")
        return (0, 0)
    
    logger.info(f"Move your mouse to the desired location. Capturing coordinates in {delay_seconds} seconds...")
    for i in range(delay_seconds, 0, -1):
        print(f"Capturing in {i} seconds... (move mouse to target location)", end='\r')
        time.sleep(1)
    
    x, y = pyautogui.position()
    print(f"\nCaptured coordinates: ({x}, {y})")
    return (x, y)


def automate_mt5_login(
    account_id: int,
    password: str,
    server: str,
    mt5_path: str,
    timeout: int = 30,
    connect_button_coords: Optional[Tuple[int, int]] = None
) -> Tuple[bool, Optional[str]]:
    """
    Automate MT5 login through UI automation
    
    This function automates the MT5 login dialog by:
    1. Launching MT5 terminal if not running
    2. Opening the account dialog (Ctrl+O)
    3. Searching for the server
    4. Entering account credentials
    5. Completing the login
    
    Thread-safe: Only one automation can run at a time using a global lock.
    If another automation is in progress, this will wait up to AUTOMATION_TIMEOUT seconds.
    
    Args:
        account_id: MT5 account ID
        password: MT5 account password
        server: MT5 server name
        mt5_path: Path to terminal64.exe
        timeout: Maximum time to wait for login completion (seconds)
        
    Returns:
        Tuple of (success: bool, error_message: str or None)
    """
    if not AUTOMATION_AVAILABLE:
        return False, "UI automation not available. Install pyautogui: pip install pyautogui"
    
    # Ensure fail-safe is disabled (should already be from module import, but double-check)
    try:
        if pyautogui.FAILSAFE:
            logger.warning('FAILSAFE was True, disabling it now...')
            pyautogui.FAILSAFE = False
        logger.info(f'PyAutoGUI FAILSAFE={pyautogui.FAILSAFE} (should be False)')
    except Exception as e:
        logger.error(f'Error checking/setting FAILSAFE: {e}')
    
    # Acquire lock before starting automation to prevent concurrent attempts
    logger.info(f'Waiting for automation lock (timeout: {AUTOMATION_TIMEOUT}s)...')
    lock_acquired = automation_lock.acquire(timeout=AUTOMATION_TIMEOUT)
    if not lock_acquired:
        error_msg = f"Could not acquire automation lock within {AUTOMATION_TIMEOUT} seconds. Another automation may be in progress."
        logger.error(error_msg)
        return False, error_msg
    
    try:
        logger.info('Automation lock acquired. Starting automated MT5 login...')
        logger.info(f'Starting automated MT5 login for account: {account_id} on server: {server}')
        
        # Step 1: Ensure MT5 terminal is running
        if not launch_mt5_terminal(mt5_path):
            return False, "Failed to launch MT5 terminal"
        
        # Step 2: Wait a moment for terminal to be ready
        time.sleep(2)
        
        # Step 3: Open account dialog
        logger.info('Opening account dialog...')
        pyautogui.press('alt')
        pyautogui.press('f')
        pyautogui.press('a')
        time.sleep(0.5)
        
        # Step 4: Search for server
        logger.info(f'Searching for server: {server}...')
        for _ in range(3):
            pyautogui.press('tab')
            time.sleep(0.5)
        pyautogui.write(server, interval=0.1)
        time.sleep(0.5)
        
        # Press Enter to select the server
        pyautogui.press('tab')
        time.sleep(0.5)
        pyautogui.press('enter')
        time.sleep(2)
        pyautogui.hotkey('alt', 'n')
        time.sleep(1)
        
        # Step 5: Select "Connect to existing account" option
        # Using mouse click instead of keyboard navigation
        logger.info('Selecting "Connect to existing account"...')
        
        if connect_button_coords:
            # Use provided coordinates
            connect_button_x, connect_button_y = connect_button_coords
            logger.info(f'Using provided coordinates: ({connect_button_x}, {connect_button_y})')
        else:
            # Use relative positioning based on screen size
            # These are approximate - you may need to adjust based on your MT5 window
            screen_width, screen_height = pyautogui.size()
            connect_button_x = int(screen_width * 0.6)
            connect_button_y = int(screen_height * 0.55)
            logger.info(f'Using relative coordinates: ({connect_button_x}, {connect_button_y})')
            logger.info('Tip: To find exact coordinates, use get_mouse_position_helper() or move mouse to button and check position')
        
        logger.info(f'Clicking "Connect to existing account" at coordinates: ({connect_button_x}, {connect_button_y})')
        pyautogui.click(connect_button_x, connect_button_y)
        time.sleep(0.5)
        
        # Step 6: Enter account number
        logger.info(f'Entering account number: {account_id}...')
        pyautogui.press('tab')
        time.sleep(0.5)
        pyautogui.press('tab')
        time.sleep(0.5)
        pyautogui.write(str(account_id), interval=0.05)
        time.sleep(0.5)
        pyautogui.press('tab')
        time.sleep(0.5)
        
        # Step 7: Enter password
        logger.info('Entering password...')
        pyautogui.write(password, interval=0.05)
        time.sleep(0.5)
        
        # Step 8: Submit login
        logger.info('Submitting login...')
        for _ in range(3):
            pyautogui.press('tab')
            time.sleep(0.5)
        pyautogui.press('enter')
        
        # Step 9: Wait for login to complete
        logger.info('Waiting for login to complete...')
        time.sleep(3)  # Increased wait time for login to complete
        
        # Step 10: Automation completed - verification will be done by caller
        logger.info('Automated login process completed. Verification will be done by caller.')
        return True, None
        
    except Exception as e:
        # Check if this is a FailSafeException (shouldn't happen since we disabled it)
        is_failsafe_error = (
            'FailSafeException' in str(type(e).__name__) or 
            'fail-safe' in str(e).lower() or
            'failsafe' in str(e).lower()
        )
        
        if is_failsafe_error:
            error_msg = f'PyAutoGUI fail-safe triggered despite being disabled: {str(e)}'
            logger.error(error_msg)
            logger.error(f'Current FAILSAFE value: {pyautogui.FAILSAFE}')
            # Force disable again
            pyautogui.FAILSAFE = False
            return False, error_msg
        else:
            error_msg = f'Automation failed: {str(e)}'
            logger.error(error_msg, exc_info=True)
            return False, error_msg
    finally:
        # Always release the lock when done
        automation_lock.release()
        logger.info('Automation lock released')


def check_account_logged_in(account_id: int) -> bool:
    """
    Check if a specific account is already logged in to MT5
    
    Args:
        account_id: Account ID to check
        
    Returns:
        True if account is logged in, False otherwise
    """
    try:
        import MetaTrader5 as mt5
        
        # Try to get account info without initializing
        # If MT5 is already initialized, this will work
        account_info = mt5.account_info()
        if account_info and account_info.login == account_id:
            logger.info(f'Account {account_id} is already logged in')
            return True
        
        return False
    except Exception:
        return False


def ensure_account_logged_in(
    account_id: int,
    password: str,
    server: str,
    mt5_path: str,
    use_automation: bool = True
) -> Tuple[bool, Optional[str]]:
    """
    Ensure account is logged in, using automation if needed
    
    Args:
        account_id: MT5 account ID
        password: MT5 account password
        server: MT5 server name
        mt5_path: Path to terminal64.exe
        use_automation: Whether to use UI automation if login fails
        
    Returns:
        Tuple of (success: bool, error_message: str or None)
    """
    # First check if already logged in
    if check_account_logged_in(account_id):
        return True, None
    
    # If automation is enabled and available, try it
    if use_automation and AUTOMATION_AVAILABLE:
        logger.info('Account not logged in. Attempting automated login...')
        # Get coordinates from environment variable
        button_coords = get_connect_button_coords()
        if button_coords:
            logger.info(f'Using connect button coordinates from environment: {button_coords}')
        else:
            logger.info('No connect button coordinates in environment, using default relative positioning')
        return automate_mt5_login(account_id, password, server, mt5_path, connect_button_coords=button_coords)
    
    return False, "Account not logged in and automation is disabled or unavailable"

