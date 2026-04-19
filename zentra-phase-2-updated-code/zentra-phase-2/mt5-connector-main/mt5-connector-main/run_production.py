"""
Production server startup script

This script starts the MT5 service using Waitress (Windows-compatible WSGI server).
"""
import os
import logging
from dotenv import load_dotenv

# Load environment variables FIRST (before importing app)
load_dotenv()

# Import app - this will set up logging with file handler
from app import app, LOG_FILE_PATH

# Get logger for this module (will use the same handlers configured in app.py)
logger = logging.getLogger(__name__)

# Get configuration
port = int(os.getenv('PORT', 5000))
host = os.getenv('HOST', '0.0.0.0')
workers = int(os.getenv('WORKERS', 4))
mt5_path = os.getenv('MT5_PATH', 'C:\\Program Files\\MetaTrader 5\\terminal64.exe')

if __name__ == '__main__':
    # Use Waitress for Windows
    from waitress import serve
    
    logger.info('='*80)
    logger.info('MT5 Service - Production Startup')
    logger.info('='*80)
    logger.info(f'Host: {host}')
    logger.info(f'Port: {port}')
    logger.info(f'Workers: {workers}')
    logger.info(f'MT5_PATH: {mt5_path}')
    logger.info(f'MT5 executable exists: {os.path.exists(mt5_path)}')
    logger.info(f'Running as user: {os.getenv("USERNAME", "NOT_SET")}')
    logger.info(f'User profile: {os.getenv("USERPROFILE", "NOT_SET")}')
    logger.info(f'Working directory: {os.getcwd()}')
    logger.info(f'Python executable: {os.sys.executable}')
    logger.info('='*80)
    
    serve(app, host=host, port=port, threads=workers)

