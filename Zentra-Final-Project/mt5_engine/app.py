"""
MT5 Service - Flask API for MetaTrader 5 integration

"""
import os
import logging
import time
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, List, Any
from logging.handlers import RotatingFileHandler
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import MetaTrader5 as mt5
from mt5_automation import ensure_account_logged_in, check_account_logged_in

load_dotenv()

# Logging configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_DIR = os.getenv('LOG_DIR', 'logs')
LOG_FILE = os.getenv('LOG_FILE', 'mt5_service.log')
LOG_MAX_BYTES = int(os.getenv('LOG_MAX_BYTES', 10 * 1024 * 1024))  # 10MB default
LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', 5))  # Keep 5 backup files

# Create logs directory if it doesn't exist
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE_PATH = os.path.join(LOG_DIR, LOG_FILE)

# Configure logging with both file and console handlers
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # Console handler (for local viewing)
        logging.StreamHandler(),
        # File handler with rotation (for remote access)
        RotatingFileHandler(
            LOG_FILE_PATH,
            maxBytes=LOG_MAX_BYTES,
            backupCount=LOG_BACKUP_COUNT,
            encoding='utf-8'
        )
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
# Default MT5 path - Windows
DEFAULT_MT5_PATH = 'C:\\Program Files\\MetaTrader 5\\terminal64.exe'
MT5_PATH = os.getenv('MT5_PATH', DEFAULT_MT5_PATH)
API_KEY = os.getenv('MT5_API_KEY', 'your-secret-api-key-change-in-production')
LOGS_PASSWORD = os.getenv('LOGS_PASSWORD', None)  # Separate password for logs endpoint
DEFAULT_TRADE_HISTORY_DAYS = 30
DEFAULT_PORT = 5000

# Constants
DEAL_TYPES_TRADE = [mt5.DEAL_TYPE_BUY, mt5.DEAL_TYPE_SELL]
DEAL_ENTRY_IN = mt5.DEAL_ENTRY_IN
DEAL_ENTRY_OUT = mt5.DEAL_ENTRY_OUT
VOLUME_MULTIPLIER = 100000


class MT5ConnectionError(Exception):
    """Custom exception for MT5 connection errors"""
    pass


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


def validate_api_key():
    """Validate API key from request headers"""
    api_key = request.headers.get('X-API-Key')
    if not api_key or api_key != API_KEY:
        logger.warning(f'Unauthorized access attempt from {request.remote_addr}')
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid or missing API key'}), 401
    return None


def validate_logs_password():
    """Validate logs password from request headers or query parameters"""
    if not LOGS_PASSWORD:
        logger.error('LOGS_PASSWORD not configured. Logs endpoint is disabled.')
        return jsonify({
            'error': 'Service error',
            'message': 'Logs endpoint is not configured'
        }), 503
    
    # Check header first (more secure)
    password = request.headers.get('X-Logs-Password')
    
    # Fallback to query parameter (less secure but more convenient)
    if not password:
        password = request.args.get('password')
    
    if not password or password != LOGS_PASSWORD:
        logger.warning(f'Unauthorized logs access attempt from {request.remote_addr}')
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Invalid or missing logs password'
        }), 401
    
    return None


def validate_request_data(required_fields: List[str]) -> Tuple[Optional[Dict], Optional[Tuple]]:
    """
    Validate request JSON data contains required fields
    
    Args:
        required_fields: List of required field names
        
    Returns:
        Tuple of (data dict, error response) or (None, None) if validation fails
    """
    if not request.is_json:
        return None, (jsonify({'error': 'Invalid request', 'message': 'Request must be JSON'}), 400)
    
    data = request.get_json()
    if not data:
        return None, (jsonify({'error': 'Invalid request', 'message': 'Request body is empty'}), 400)
    
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        return None, (jsonify({
            'error': 'Validation error',
            'message': f'Missing required fields: {", ".join(missing_fields)}'
        }), 400)
    
    return data, None


def initialize_mt5_connection(account_id: int, password: str, server: str, manual_login: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Initialize MT5 connection with account credentials
    
    Args:
        account_id: MT5 account ID
        password: MT5 account password
        server: MT5 server name
        manual_login: If True, attempt UI automation to handle login dialog
        
    Returns:
        Tuple of (success: bool, error_message: str or None)
    """
    logger.info(f'Initializing MT5 connection for account: {account_id} on server: {server}')
    logger.info(f'Manual login requested: {manual_login}')
    
    # Diagnostic logging for troubleshooting NSSM/service issues
    logger.info(f'MT5_PATH configured: {MT5_PATH}')
    logger.info(f'MT5 path exists: {os.path.exists(MT5_PATH)}')
    logger.info(f'Current user (USERNAME env): {os.getenv("USERNAME", "NOT_SET")}')
    logger.info(f'Current user (USERPROFILE env): {os.getenv("USERPROFILE", "NOT_SET")}')
    logger.info(f'Current working directory: {os.getcwd()}')
    logger.info(f'Python executable: {os.sys.executable}')
    
    # Check if running in a session with desktop access
    import ctypes
    try:
        session_id = ctypes.windll.kernel32.WTSGetActiveConsoleSessionId()
        logger.info(f'Active console session ID: {session_id}')
    except Exception as e:
        logger.warning(f'Could not get session ID: {e}')
    
    try:
        # Step 1: Check if account is already logged in
        if mt5.initialize(path=MT5_PATH, login=account_id, password=password, server=server, timeout=10000, portable=False):
            if check_account_logged_in(account_id):
                logger.info(f'Account {account_id} is already logged in, reusing connection')
                return True, None
            else:
                logger.error(f'Account {account_id} is not logged in, reinitializing...')
                mt5.shutdown()
                mt5.initialize(path=MT5_PATH, login=account_id, password=password, server=server, timeout=10000, portable=False)
        
        # Step 2: If manual_login is requested, try automation first
        if manual_login:
            logger.info('Manual login requested. Attempting automated login...')
            auto_success, auto_error = ensure_account_logged_in(
                account_id=account_id,
                password=password,
                server=server,
                mt5_path=MT5_PATH,
                use_automation=True
            )
            
            if auto_success:
                logger.info('Automated login process completed. Verifying login...')
                time.sleep(2)  # Additional wait for login to fully complete
                
                # Verify login was successful by checking MT5 connection
                try:
                    # Try to initialize MT5 (without credentials since we're now logged in via UI)
                    if mt5.initialize(path=MT5_PATH, login=account_id, password=password, server=server, timeout=10000, portable=False):
                        account_info = mt5.account_info()
                        if account_info and int(account_info.login) == account_id:
                            logger.info(f'Login verified successfully. Account {account_id} is connected.')
                            return True, None
                        else:
                            if account_info:
                                error_msg = f'Login completed but wrong account connected: {account_info.login} (expected {account_id})'
                            else:
                                error_msg = 'Login completed but could not retrieve account info'
                            logger.error(error_msg)
                            mt5.shutdown()
                            return False, error_msg
                    else:
                        error_code = mt5.last_error()
                        error_msg = f'Login completed but MT5 initialization failed: {error_code}'
                        logger.error(error_msg)
                        return False, error_msg
                except Exception as e:
                    error_msg = f'Failed to verify login after automation: {str(e)}'
                    logger.error(error_msg, exc_info=True)
                    return False, error_msg
            else:
                logger.warning(f'Automated login failed: {auto_error}. Falling back to direct login...')
        
        # Step 3: Try direct initialization with credentials
        logger.info(f'Attempting direct MT5 initialization with path: {MT5_PATH}')
        if not mt5.initialize(path=MT5_PATH, login=account_id, password=password, server=server, timeout=10000, portable=False):
            error_code = mt5.last_error()
            error_msg = f'MT5 initialization failed: {error_code}'
            logger.error(error_msg)
            logger.error(f'MT5 terminal path attempted: {MT5_PATH}')
            
            if error_code[0] == -10005:
                logger.error('IPC timeout error. This usually means:')
                logger.error('  - Account needs to be logged in manually at least once')
                logger.error('  - Or set manual_login=true in request body to attempt automated login')
            else:
                logger.error('This error typically means:')
                logger.error('  - MT5 terminal cannot be launched (no desktop session)')
                logger.error('  - Running as SYSTEM/service account without desktop access')
                logger.error('  - MT5 path is incorrect or inaccessible')
                logger.error('  - Insufficient permissions to launch terminal64.exe')
            
            return False, error_msg
        
        logger.info('MT5 initialized successfully')
        
        # Step 4: Verify account info is accessible
        account_info = mt5.account_info()
        if account_info is None:
            error_code = mt5.last_error()
            error_msg = f'Failed to retrieve account info: {error_code}'
            logger.error(error_msg)
            mt5.shutdown()
            return False, error_msg
        
        logger.info(f'Successfully connected to MT5 account: {account_info.login}')
        return True, None
        
    except Exception as e:
        error_msg = f'Exception during MT5 initialization: {str(e)}'
        logger.error(error_msg, exc_info=True)
        try:
            mt5.shutdown()
        except Exception:
            pass
        return False, error_msg


def ensure_mt5_shutdown():
    """Ensure MT5 connection is properly shut down"""
    try:
        mt5.shutdown()
    except Exception as e:
        logger.warning(f'Error during MT5 shutdown: {str(e)}')


def determine_session(timestamp: datetime) -> str:
    """
    Determine trading session based on timestamp (UTC)
    
    Args:
        timestamp: Datetime object
        
    Returns:
        Session name: 'NY', 'LONDON', or 'ASIA'
    """
    hour = timestamp.hour
    if 13 <= hour < 21:  # UTC 13-21 = NY session
        return 'NY'
    elif 8 <= hour < 16:  # UTC 8-16 = London session
        return 'LONDON'
    else:  # Asia session
        return 'ASIA'


def calculate_target_percent_achieved(
    entry_price: float,
    exit_price: float,
    target_price: Optional[float],
    deal_type: int
) -> float:
    """
    Calculate target percent achieved based on actual vs intended price movement
    
    Args:
        entry_price: Entry price of the trade
        exit_price: Exit price of the trade
        target_price: Target profit price (TP). If None, returns 0
        deal_type: DEAL_TYPE_BUY (long) or DEAL_TYPE_SELL (short)
        
    Returns:
        Target percent achieved (can be >100% if exceeded target, negative if stopped out)
    """
    if target_price is None or entry_price is None or exit_price is None:
        return 0.0
    
    if deal_type == mt5.POSITION_TYPE_BUY:  # Long position
        actual_move = exit_price - entry_price
        target_move = target_price - entry_price
    else:  # Short position
        actual_move = entry_price - exit_price
        target_move = entry_price - target_price
    
    if target_move == 0:
        return 0.0
    
    target_percent_achieved = (actual_move / target_move) * 100

    return target_percent_achieved


def get_tp_sl_from_order(order_ticket: int) -> Tuple[Optional[float], Optional[float]]:
    """
    Get target price (TP) and stop loss (SL) from order history
    
    Args:
        order_ticket: Order ticket number
        
    Returns:
        Tuple of (target_price, stop_loss) or (None, None) if not found
    """
    if not order_ticket:
        return (None, None)
    
    try:
        # history_orders_get returns a tuple/list of orders, not a single order
        orders = mt5.history_orders_get(ticket=order_ticket)
        if orders and len(orders) > 0:
            # Get the first order (should be the one matching the ticket)
            order = orders[0]
            tp = getattr(order, 'price_tp', None) or getattr(order, 'tp', None)
            sl = getattr(order, 'price_sl', None) or getattr(order, 'sl', None)
            return (tp, sl)
    except Exception as e:
        logger.debug(f'Could not retrieve TP/SL for order {order_ticket}: {str(e)}')
    return (None, None)


class SyntheticTrade:
    """Synthetic trade object aggregating open and close deals"""
    
    def __init__(self, trade_data: Dict, open_deal: Any, close_deal: Any, position_id: int):
        """
        Initialize synthetic trade from trade data and deals
        
        Args:
            trade_data: Dictionary containing trade metadata
            open_deal: Open deal object
            close_deal: Close deal object
            position_id: Position ID
        """
        self.deal = position_id
        self.time = trade_data['open_time']
        self.time_update = trade_data['close_time']
        self.symbol = trade_data['symbol']
        self.profit = trade_data['total_profit']
        self.volume = open_deal.volume * VOLUME_MULTIPLIER
        self.reason = close_deal.reason
        self.entry_price = getattr(open_deal, 'price', None)
        self.exit_price = getattr(close_deal, 'price', None)
        self.deal_type = open_deal.type
        self.target_price = None
        self.stop_loss = None


def transform_mt5_trade(trade: SyntheticTrade, account_info: Any) -> Dict[str, Any]:
    """
    Transform MT5 trade to API response format
    
    Args:
        trade: SyntheticTrade object
        account_info: MT5 account info object
    Returns:
        Dictionary with transformed trade data
    """
    open_time = datetime.fromtimestamp(trade.time)
    close_time = datetime.fromtimestamp(trade.time_update)
    
    # Calculate risk percent using stop loss from order history
    # Note: For archived trades, we use current balance as an approximation
    # The actual balance at trade time would require historical balance tracking
    balance = account_info.balance if account_info and account_info.balance > 0 else 10000
    if trade.entry_price and trade.stop_loss and trade.volume and balance > 0:
        risk_amount = abs(trade.entry_price - trade.stop_loss) * trade.volume
        risk_percent = (risk_amount / balance) * 100
    else:
        risk_percent = 0.0
    
    # Determine exit reasons from archived deal
    stop_loss_hit = trade.reason == mt5.DEAL_REASON_SL
    exited_early = trade.reason != mt5.DEAL_REASON_TP
    
    # Calculate target percent achieved for archived trade
    # Shows what % of the intended target was actually achieved based on actual entry/exit prices
    target_percent_achieved = calculate_target_percent_achieved(
        entry_price=trade.entry_price,
        exit_price=trade.exit_price,
        target_price=trade.target_price,
        deal_type=trade.deal_type
    )

    # Calculate risk-reward ratio for archived trade
    # Risk-reward = actual profit achieved / actual risk taken
    if trade.entry_price and trade.stop_loss and trade.volume and trade.volume > 0:
        # Calculate actual risk amount using archived trade data
        risk_amount = abs(trade.entry_price - trade.stop_loss) * trade.volume
        risk_reward = trade.profit / risk_amount
    else:
        risk_reward = 0.0
    
    return {
        'entryTime': open_time.isoformat(),
        'exitTime': close_time.isoformat(),
        'riskPercentUsed': round(risk_percent, 2),
        'profitLoss': round(trade.profit, 2),
        'riskRewardAchieved': round(risk_reward, 2),
        'session': determine_session(open_time),
        'stopLossHit': stop_loss_hit,
        'exitedEarly': exited_early,
        'targetPercentAchieved': round(target_percent_achieved, 2),
        'notes': f'MT5 Trade #{account_info.login} - {trade.symbol}',
        'mt5DealId': trade.deal,
        'mt5Symbol': trade.symbol,
    }


def pair_open_close_deals(deals: List[Any]) -> Dict[int, Dict[str, Any]]:
    """
    Pair open and close deals by position_id
    
    Args:
        deals: List of MT5 deal objects
        
    Returns:
        Dictionary mapping position_id to complete trade data
    """
    # Filter trade deals (exclude balance, commission, charge deals)
    trade_deals = [deal for deal in deals if deal.type in DEAL_TYPES_TRADE]
    
    logger.info(f'Found {len(trade_deals)} trade deals out of {len(deals)} total deals')
    
    # Separate open and close deals
    open_deals = [deal for deal in trade_deals if deal.entry == DEAL_ENTRY_IN]
    close_deals = [deal for deal in trade_deals if deal.entry == DEAL_ENTRY_OUT]
    
    logger.info(f'Found {len(open_deals)} open deals and {len(close_deals)} close deals')
    
    trades_dict = {}
    
    # First, collect all open deals
    for deal in open_deals:
        position_id = deal.position_id
        if position_id not in trades_dict:
            trades_dict[position_id] = {
                'open_deal': deal,
                'close_deals': [],
                'total_profit': 0,
                'open_time': deal.time,
                'close_time': None,
                'symbol': deal.symbol,
            }
        else:
            # If multiple open deals for same position, use the earliest one
            if deal.time < trades_dict[position_id]['open_time']:
                trades_dict[position_id]['open_deal'] = deal
                trades_dict[position_id]['open_time'] = deal.time
                trades_dict[position_id]['symbol'] = deal.symbol
    
    # Then, match close deals to positions
    for deal in close_deals:
        position_id = deal.position_id
        if position_id in trades_dict:
            trades_dict[position_id]['close_deals'].append(deal)
            net_profit = deal.profit + deal.commission + deal.swap + deal.fee
            trades_dict[position_id]['total_profit'] += net_profit
            # Set close_time to the latest close deal time
            if trades_dict[position_id]['close_time'] is None or deal.time > trades_dict[position_id]['close_time']:
                trades_dict[position_id]['close_time'] = deal.time
    
    # Filter out trades that don't have both open and close deals
    complete_trades = {
        position_id: trade_data 
        for position_id, trade_data in trades_dict.items()
        if trade_data['close_time'] is not None
    }
    
    logger.info(f'Found {len(complete_trades)} complete trades (with both open and close)')
    return complete_trades


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'mt5-service',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/logs', methods=['GET'])
def get_logs():
    """Retrieve application logs (requires logs password only, no API key needed)"""
    # Require only logs password (no API key needed)
    password_error = validate_logs_password()
    if password_error:
        return password_error
    
    try:
        # Get query parameters
        lines = request.args.get('lines', default=100, type=int)  # Number of lines to retrieve
        level = request.args.get('level', default=None, type=str)  # Filter by level (INFO, ERROR, etc.)
        search = request.args.get('search', default=None, type=str)  # Search term
        
        # Limit max lines to prevent memory issues
        max_lines = 1000
        if lines > max_lines:
            lines = max_lines
        
        # Read log file
        if not os.path.exists(LOG_FILE_PATH):
            return jsonify({
                'error': 'Log file not found',
                'path': LOG_FILE_PATH
            }), 404
        
        with open(LOG_FILE_PATH, 'r', encoding='utf-8') as f:
            log_lines = f.readlines()
        
        # Get last N lines
        log_lines = log_lines[-lines:]
        
        # Filter by level if specified
        if level:
            log_lines = [line for line in log_lines if f' - {level.upper()} - ' in line]
        
        # Search if specified
        if search:
            log_lines = [line for line in log_lines if search.lower() in line.lower()]
        
        # Join lines
        log_content = ''.join(log_lines)
        
        logger.info(f'Logs accessed by {request.remote_addr} - {len(log_lines)} lines retrieved')
        
        return jsonify({
            'logs': log_content,
            'total_lines': len(log_lines),
            'file_path': LOG_FILE_PATH,
            'filters': {
                'lines': lines,
                'level': level,
                'search': search
            }
        }), 200
        
    except Exception as e:
        logger.error(f'Error retrieving logs: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Failed to retrieve logs',
            'message': str(e)
        }), 500


@app.route('/connect', methods=['POST'])
def connect_account():
    """Connect to MT5 account and retrieve account information"""
    auth_error = validate_api_key()
    if auth_error:
        return auth_error
    
    # Validate request data
    data, error_response = validate_request_data(['accountId', 'password', 'server'])
    if error_response:
        return error_response
    
    try:
        account_id = int(data.get('accountId'))
        password = data.get('password')
        server = data.get('server')
        manual_login = data.get('manualLogin', False)  # Optional, defaults to False
        
        # Convert to boolean if string
        if isinstance(manual_login, str):
            manual_login = manual_login.lower() in ('true', '1', 'yes')
        
        logger.info(f'Connecting to MT5 account: {account_id} on server: {server}')
        logger.info(f'Manual login requested: {manual_login}')
        
        # Initialize MT5 connection
        success, error_msg = initialize_mt5_connection(account_id, password, server, manual_login=manual_login)
        if not success:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 500
        
        try:
            # Get account info
            account_info = mt5.account_info()
            if account_info is None:
                error_code = mt5.last_error()
                logger.error(f'Failed to get account info: {error_code}')
                return jsonify({
                    'success': False,
                    'error': f'Failed to retrieve account info: {error_code}'
                }), 500
            
            return jsonify({
                'success': True,
                'accountId': account_info.login,
                'server': account_info.server,
                'balance': account_info.balance,
                'equity': account_info.equity,
                'margin': account_info.margin,
                'currency': account_info.currency,
            })
        finally:
            ensure_mt5_shutdown()
            
    except ValueError as e:
        logger.error(f'Invalid account ID format: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Invalid account ID format: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f'Error connecting to MT5: {str(e)}', exc_info=True)
        ensure_mt5_shutdown()
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500


@app.route('/trades', methods=['POST'])
def get_trades():
    """Get trades from MT5 account within specified date range"""
    auth_error = validate_api_key()
    if auth_error:
        return auth_error
    
    # Validate request data
    data, error_response = validate_request_data(['accountId', 'password', 'server'])
    if error_response:
        return error_response
    
    try:
        account_id = int(data.get('accountId'))
        password = data.get('password')
        server = data.get('server')
        manual_login = data.get('manualLogin', False)  # Optional, defaults to False
        
        # Convert to boolean if string
        if isinstance(manual_login, str):
            manual_login = manual_login.lower() in ('true', '1', 'yes')
        
        # Parse dates with defaults
        try:
            from_date = datetime.fromisoformat(
                data.get('fromDate', (datetime.now() - timedelta(days=DEFAULT_TRADE_HISTORY_DAYS)).isoformat())
            )
            to_date = datetime.fromisoformat(
                data.get('toDate', datetime.now().isoformat())
            )
        except ValueError as e:
            logger.error(f'Invalid date format: {str(e)}')
            return jsonify({
                'success': False,
                'error': f'Invalid date format: {str(e)}'
            }), 400
        
        # Validate date range
        if from_date > to_date:
            return jsonify({
                'success': False,
                'error': 'fromDate must be before toDate'
            }), 400
        
        logger.info(f'Fetching trades for account: {account_id} from {from_date} to {to_date}')
        logger.info(f'Manual login requested: {manual_login}')
        
        # Initialize MT5 connection
        success, error_msg = initialize_mt5_connection(account_id, password, server, manual_login=manual_login)
        if not success:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 500
        
        try:
            # Get account info
            account_info = mt5.account_info()
            if account_info is None:
                error_code = mt5.last_error()
                logger.error(f'Failed to get account info: {error_code}')
                return jsonify({
                    'success': False,
                    'error': f'Failed to retrieve account info: {error_code}'
                }), 500
            
            # Get deals history
            from_timestamp = int(from_date.timestamp())
            to_timestamp = int(to_date.timestamp())
            
            deals = mt5.history_deals_get(from_timestamp, to_timestamp, group="*")
            
            if deals is None:
                error_code = mt5.last_error()
                logger.warning(f'No deals found or error: {error_code}')
                return jsonify({
                    'success': True,
                    'trades': [],
                    'count': 0
                })
            
            # Pair open and close deals
            complete_trades = pair_open_close_deals(deals)
            
            # Transform trades
            transformed_trades = []
            for position_id, trade_data in complete_trades.items():
                open_deal = trade_data['open_deal']
                main_close_deal = trade_data['close_deals'][-1] if trade_data['close_deals'] else open_deal
                
                synthetic_trade = SyntheticTrade(trade_data, open_deal, main_close_deal, position_id)

                # Get TP/SL from order history (works for archived trades)
                order_ticket = getattr(open_deal, 'order', None) or getattr(open_deal, 'ticket', None)
                if order_ticket:
                    target_price, stop_loss = get_tp_sl_from_order(order_ticket)
                    if target_price:
                        synthetic_trade.target_price = target_price
                    if stop_loss:
                        synthetic_trade.stop_loss = stop_loss
                
                transformed_trade = transform_mt5_trade(synthetic_trade, account_info)
                transformed_trades.append(transformed_trade)
            
            logger.info(f'Successfully fetched {len(transformed_trades)} trades')
            
            return jsonify({
                'success': True,
                'trades': transformed_trades,
                'count': len(transformed_trades)
            })
            
        finally:
            ensure_mt5_shutdown()
            
    except ValueError as e:
        logger.error(f'Invalid account ID format: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Invalid account ID format: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f'Error fetching trades: {str(e)}', exc_info=True)
        ensure_mt5_shutdown()
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found', 'message': 'The requested endpoint does not exist'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f'Internal server error: {str(error)}', exc_info=True)
    return jsonify({'error': 'Internal server error', 'message': 'An unexpected error occurred'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', DEFAULT_PORT))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info('='*80)
    logger.info(f'Starting MT5 Service on port {port}')
    logger.info(f'PORT env var: {os.getenv("PORT", "not set")}')
    logger.info(f'MT5_PATH: {MT5_PATH}')
    logger.info(f'MT5 executable exists: {os.path.exists(MT5_PATH)}')
    logger.info(f'Running as user: {os.getenv("USERNAME", "NOT_SET")}')
    logger.info(f'User profile: {os.getenv("USERPROFILE", "NOT_SET")}')
    logger.info(f'Working directory: {os.getcwd()}')
    logger.info('='*80)
    
    if debug_mode:
        logger.warning('Running in DEBUG mode - not recommended for production')
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
