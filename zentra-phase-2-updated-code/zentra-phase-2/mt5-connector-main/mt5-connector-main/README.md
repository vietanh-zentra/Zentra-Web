# MT5 Service

Production-ready Python microservice for MetaTrader 5 integration. This Flask API service provides endpoints to connect to MT5 accounts and retrieve trade history with proper pairing of open and close deals.

## Features

- 🔐 API key authentication
- 🔄 MT5 account connection management
- 📊 Trade history retrieval with open/close deal pairing
- ✅ Input validation and error handling
- 🛡️ Production-ready error handling and logging
- 🧹 Automatic resource cleanup

## Prerequisites

- Python 3.8+
- MetaTrader 5 terminal installed
- MT5 account credentials

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

- **Windows**: `venv\Scripts\activate`
- **Linux/Mac**: `source venv/bin/activate`

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables:

Set the following environment variables (or create a `.env` file):

```bash
# MT5 Terminal Path (Windows default)
MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe

# API Key for authentication (REQUIRED - change in production!)
MT5_API_KEY=your-secret-api-key-change-in-production

# Logs endpoint password (REQUIRED for /logs endpoint - separate from API key)
LOGS_PASSWORD=your-secure-logs-password-here

# Optional: Server port (default: 4000)
PORT=4000

# Optional: Server host (default: 0.0.0.0)
HOST=0.0.0.0

# Optional: Number of workers (default: 4)
WORKERS=4

# Optional: Debug mode (default: False) - NEVER use True in production!
FLASK_DEBUG=False

# Optional: MT5 Connect Button Coordinates for UI automation
# Use get_coordinates.py script to find the exact coordinates of the "Connect to existing account" button
MT5_CONNECT_BUTTON_X=682
MT5_CONNECT_BUTTON_Y=621

# Optional: Logging configuration
LOG_LEVEL=INFO                    # Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_DIR=logs                      # Directory for log files
LOG_FILE=mt5_service.log          # Log file name
LOG_MAX_BYTES=10485760           # Max log file size before rotation (10MB)
LOG_BACKUP_COUNT=5                # Number of backup log files to keep
```

## Running

### Development Mode

For development and testing, use Flask's built-in server:

```bash
python app.py
```

**Note:** Flask's development server shows a warning and should NOT be used in production.

### Production Mode

For production deployment, use a proper WSGI server:

#### Option 1: Using the Production Script (Recommended)

The easiest way is to use the provided production script:

```bash
python run_production.py
```

This script uses **Waitress** (production-ready, Windows-compatible WSGI server) and automatically configures workers based on your settings.

#### Option 2: Manual WSGI Server Setup

**Windows (Waitress):**

```bash
pip install waitress
waitress-serve --host=0.0.0.0 --port=4000 wsgi:app
```

#### Production Configuration

You can configure the production server using environment variables:

```bash
# Server port (default: 4000)
PORT=4000

# Server host (default: 0.0.0.0)
HOST=0.0.0.0

# Number of worker threads/processes (default: 4)
WORKERS=4
```

#### Production Best Practices

1. **Use Environment Variables**: Set all configuration via environment variables or `.env` file
2. **Set FLASK_DEBUG=False**: Never run with debug mode enabled in production
3. **Use HTTPS**: Configure a reverse proxy (IIS, nginx, Apache) with SSL/TLS certificates
4. **Monitor Logs**: Set up log aggregation and monitoring
5. **Process Management**: Use a process manager like:
   - **Windows**: NSSM (Non-Sucking Service Manager) or Windows Service

The service will run on `http://localhost:4000` by default (or your configured PORT).

## API Endpoints

All endpoints require the `X-API-Key` header for authentication.

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "service": "mt5-service",
  "timestamp": "2024-01-15T10:30:00"
}
```

### GET /logs

Retrieve application logs. **Requires logs password only (no API key needed).**

**Headers:**

```
X-Logs-Password: your-logs-password
```

**Query Parameters:**

- `lines` (optional): Number of lines to retrieve (default: 100, max: 1000)
- `level` (optional): Filter by log level (INFO, ERROR, WARNING, DEBUG, etc.)
- `search` (optional): Search term to filter logs
- `password` (optional): Alternative way to provide logs password (less secure than header)

**Examples:**

```bash
# Get last 100 lines
GET /logs?lines=100
Headers:
  X-Logs-Password: your-logs-password

# Get only ERROR logs
GET /logs?lines=50&level=ERROR
Headers:
  X-Logs-Password: your-logs-password

# Search for specific term
GET /logs?lines=200&search=automation
Headers:
  X-Logs-Password: your-logs-password

# Using query parameter for password (less secure)
GET /logs?lines=100&password=your-logs-password
```

**Success Response (200):**

```json
{
  "logs": "2024-01-15 10:30:00 - app - INFO - Starting MT5 Service...\n...",
  "total_lines": 100,
  "file_path": "logs/mt5_service.log",
  "filters": {
    "lines": 100,
    "level": null,
    "search": null
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing logs password
- `404 Not Found`: Log file not found
- `503 Service Unavailable`: Logs endpoint not configured (LOGS_PASSWORD not set)

**Security Notes:**

- The logs endpoint requires **only** logs password (no API key needed)
- Use the `X-Logs-Password` header instead of query parameter when possible (more secure)
- Access attempts are logged for security monitoring
- If `LOGS_PASSWORD` environment variable is not set, the endpoint returns 503

### POST /connect

Connect to an MT5 account and retrieve account information.

**Headers:**

```
X-API-Key: your-api-key
Content-Type: application/json
```

**Request Body:**

```json
{
  "accountId": 12345678,
  "password": "your-password",
  "server": "Broker-Demo",
  "manualLogin": false
}
```

**Request Parameters:**

- `accountId` (required): MT5 account ID
- `password` (required): MT5 account password
- `server` (required): MT5 server name
- `manualLogin` (optional): If `true`, attempts UI automation to handle login dialog. Default: `false`

**Success Response (200):**

```json
{
  "success": true,
  "accountId": 12345678,
  "server": "Broker-Demo",
  "balance": 10000.0,
  "equity": 10050.0,
  "margin": 0.0,
  "currency": "USD"
}
```

**Error Response (400/500):**

```json
{
  "success": false,
  "error": "Error message description"
}
```

### POST /trades

Get trade history from an MT5 account within a specified date range.

**Headers:**

```
X-API-Key: your-api-key
Content-Type: application/json
```

**Request Body:**

```json
{
  "accountId": 12345678,
  "password": "your-password",
  "server": "Broker-Demo",
  "fromDate": "2024-01-01T00:00:00",
  "toDate": "2024-01-31T23:59:59",
  "manualLogin": false
}
```

**Request Parameters:**

- `accountId` (required): MT5 account ID
- `password` (required): MT5 account password
- `server` (required): MT5 server name
- `fromDate` (optional): Start date in ISO format. Default: 30 days ago
- `toDate` (optional): End date in ISO format. Default: current date/time
- `manualLogin` (optional): If `true`, attempts UI automation to handle login dialog. Default: `false`

**Success Response (200):**

```json
{
  "success": true,
  "trades": [
    {
      "entryTime": "2024-01-15T10:00:00",
      "exitTime": "2024-01-15T12:00:00",
      "riskPercentUsed": 1.5,
      "profitLoss": 50.0,
      "riskRewardAchieved": 0.5,
      "session": "LONDON",
      "stopLossHit": false,
      "exitedEarly": false,
      "targetPercentAchieved": 100.0,
      "notes": "MT5 Trade #123456 - EURUSD",
      "mt5DealId": 123456,
      "mt5Symbol": "EURUSD"
    }
  ],
  "count": 1
}
```

**Error Response (400/500):**

```json
{
  "success": false,
  "error": "Error message description"
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (validation errors, invalid input)
- **401**: Unauthorized (missing or invalid API key)
- **404**: Not Found (invalid endpoint)
- **500**: Internal Server Error

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional details (optional)"
}
```

## Trade Data Processing

The service automatically:

1. Retrieves all deals from MT5 within the specified date range
2. Filters trade deals (excludes balance, commission, and charge deals)
3. Separates open deals (`DEAL_ENTRY_IN`) and close deals (`DEAL_ENTRY_OUT`)
4. Pairs open and close deals by `position_id`
5. Aggregates profit from multiple close deals for the same position
6. Transforms data into a standardized format

Only complete trades (with both open and close deals) are returned.

## Trade Metrics Explained

All metrics are calculated from **archived/completed trades** using historical deal and order data. This ensures accurate analysis of past trading performance.

### Available Metrics

#### 1. `entryTime` and `exitTime`

- **Type**: ISO 8601 datetime strings
- **Description**: Timestamps when the trade was opened and closed
- **Source**: From open deal (`DEAL_ENTRY_IN`) and close deal (`DEAL_ENTRY_OUT`) timestamps
- **Example**: `"2024-01-15T10:00:00"`

#### 2. `riskPercentUsed`

- **Type**: Float (percentage)
- **Description**: Percentage of account balance that was at risk for this trade
- **Calculation**:

  ```
  For LONG positions:
    risk_amount = |entry_price - stop_loss| × volume
  For SHORT positions:
    risk_amount = |stop_loss - entry_price| × volume

  riskPercentUsed = (risk_amount / account_balance) × 100
  ```

- **Volume Adjustment**: MT5 volume is multiplied by `100,000` to get actual volume
- **Note**: Uses current account balance as approximation (historical balance tracking would require additional implementation)
- **Example Values**:
  - `1.5` = 1.5% of account balance was at risk
  - `5.0` = 5% of account balance was at risk
- **Interpretation**: Lower values indicate more conservative risk management

#### 3. `profitLoss`

- **Type**: Float (currency amount)
- **Description**: Actual profit or loss achieved from the trade
- **Source**: Aggregated profit from all close deals for the position
- **Example Values**:
  - `50.0` = $50 profit
  - `-25.0` = $25 loss
- **Interpretation**: Positive = profit, Negative = loss

#### 4. `riskRewardAchieved`

- **Type**: Float (ratio)
- **Description**: Actual risk-reward ratio achieved (profit ÷ risk)
- **Calculation**:

  ```
  risk_amount = |entry_price - stop_loss| × volume (for LONG)
  risk_amount = |stop_loss - entry_price| × volume (for SHORT)

  riskRewardAchieved = profit / risk_amount
  ```

- **Example Values**:
  - `0.5` = Made 50% of the risk amount (0.5:1 ratio)
  - `1.0` = Made exactly the risk amount (1:1 ratio)
  - `2.0` = Made double the risk amount (2:1 ratio)
  - `3.0` = Default value when TP/SL not available
- **Interpretation**:
  - `< 1.0`: Risk was greater than reward
  - `= 1.0`: Break-even risk-reward
  - `> 1.0`: Reward exceeded risk (good trade)
  - `> 2.0`: Excellent risk-reward ratio

#### 5. `targetPercentAchieved`

- **Type**: Float (percentage)
- **Description**: Percentage of the intended target price that was actually achieved
- **Calculation**:

  ```
  For LONG positions:
    actual_move = exit_price - entry_price
    target_move = target_price - entry_price
    targetPercentAchieved = (actual_move / target_move) × 100

  For SHORT positions:
    actual_move = entry_price - exit_price
    target_move = entry_price - target_price
    targetPercentAchieved = (actual_move / target_move) × 100
  ```

- **Source**: Target price (TP) retrieved from order history
- **Example Values**:
  - `50.0` = Exited halfway to target (50% of target achieved)
  - `100.0` = Hit full target exactly
  - `150.0` = Exceeded target by 50% (runner trade)
  - `-20.0` = Exited in loss direction (stopped out before target)
  - `3.0` = Default value when target price not available
- **Interpretation**:
  - `100%` = Perfect execution, hit target
  - `> 100%` = Exceeded target (good runner)
  - `< 100%` = Exited before target
  - `< 0%` = Stopped out or reversed

#### 6. `session`

- **Type**: String
- **Description**: Trading session when the trade was opened
- **Calculation**: Based on UTC hour of entry time
  - `"NY"`: 13:00-21:00 UTC (New York session)
  - `"LONDON"`: 08:00-16:00 UTC (London session)
  - `"ASIA"`: All other hours (Asia session)
- **Example**: `"LONDON"`

#### 7. `stopLossHit`

- **Type**: Boolean
- **Description**: Whether the trade was closed by hitting stop loss
- **Source**: From close deal reason (`DEAL_REASON_SL`)
- **Example Values**:
  - `true` = Trade hit stop loss
  - `false` = Trade did not hit stop loss
- **Interpretation**: `true` indicates the stop loss was triggered

#### 8. `exitedEarly`

- **Type**: Boolean
- **Description**: Whether the trade was exited before reaching take profit
- **Source**: From close deal reason (not `DEAL_REASON_TP`)
- **Example Values**:
  - `true` = Exited before reaching TP (manual close, SL hit, etc.)
  - `false` = Exited at TP (take profit hit)
- **Interpretation**: `true` means the trade didn't reach its intended target

#### 9. `mt5DealId` and `mt5Symbol`

- **Type**: Integer and String
- **Description**: MT5 position ID and trading symbol
- **Source**: From deal data
- **Example**: `123456` and `"EURUSD"`

### How Metrics Are Calculated

The service follows this process for each archived trade:

1. **Retrieve Historical Data**:

   - Gets all deals from MT5 history within the date range
   - Retrieves order history to get TP/SL prices

2. **Pair Open/Close Deals**:

   - Matches open deals (`DEAL_ENTRY_IN`) with close deals (`DEAL_ENTRY_OUT`) by `position_id`
   - Aggregates multiple close deals if position was partially closed

3. **Extract Prices**:

   - Entry price: From open deal execution price
   - Exit price: From close deal execution price
   - Target price: From order history (`price_tp`)
   - Stop loss: From order history (`price_sl`)

4. **Calculate Metrics**:
   - All calculations use actual archived trade data
   - Volume is adjusted (multiplied by 100,000) to reflect actual volume
   - Metrics reflect what actually happened, not what was planned

### Example Trade Analysis

Consider this trade response:

```json
{
  "entryTime": "2024-01-15T10:00:00",
  "exitTime": "2024-01-15T12:00:00",
  "riskPercentUsed": 2.0,
  "profitLoss": 100.0,
  "riskRewardAchieved": 2.0,
  "session": "LONDON",
  "stopLossHit": false,
  "exitedEarly": false,
  "targetPercentAchieved": 100.0,
  "mt5Symbol": "EURUSD"
}
```

**Analysis**:

- ✅ **Risk Management**: Used 2% of account balance (conservative)
- ✅ **Profit**: Made $100 profit
- ✅ **Risk-Reward**: Achieved 2:1 ratio (excellent)
- ✅ **Execution**: Hit full target (100% of TP achieved)
- ✅ **Exit**: Did not hit stop loss, exited at take profit
- ✅ **Timing**: Opened during London session

This represents a well-executed trade that hit its target with good risk management.

### Metric Relationships

Understanding how metrics relate to each other:

- **High `targetPercentAchieved` + Low `exitedEarly`** = Good execution
- **High `riskRewardAchieved` + Low `riskPercentUsed`** = Efficient risk management
- **`stopLossHit: true`** = Risk management worked (limited loss)
- **`targetPercentAchieved > 100%`** = Trade exceeded expectations (runner)

### Data Sources

All metrics are calculated from **archived trade data**, ensuring:

- ✅ Accuracy: Based on actual executed prices
- ✅ Completeness: Includes all closed trades
- ✅ Reliability: Uses historical MT5 data
- ✅ Consistency: Same calculation method for all trades

**Note**: The service retrieves TP/SL from order history, which may not be available for very old trades or trades without explicit TP/SL orders. In such cases, default values are used (`3.0` for target percent and risk-reward).

## Security Considerations

- **API Key**: Always use a strong, unique API key in production. Never commit API keys to version control.
- **HTTPS**: Use HTTPS in production to encrypt API communications.
- **Credentials**: MT5 credentials are sent in request bodies. Ensure secure transmission.
- **Error Messages**: Production error messages don't expose internal system details.

## Development

### Running Tests

```bash
pytest
```

### Code Structure

- `app.py`: Main application file with all endpoints and business logic
- `requirements.txt`: Python dependencies
- `test_app.py`: Unit tests

### Key Functions

- `initialize_mt5_connection()`: Handles MT5 connection initialization
- `pair_open_close_deals()`: Pairs open and close deals by position
- `transform_mt5_trade()`: Transforms MT5 trade data to API format
- `validate_request_data()`: Validates incoming request data
- `ensure_mt5_shutdown()`: Ensures proper cleanup of MT5 connections

## Troubleshooting

### MT5 Initialization Fails

- Ensure MetaTrader 5 terminal is installed
- Verify `MT5_PATH` environment variable points to the correct terminal executable
- Check that the MT5 terminal is not already running with a different account

### IPC Timeout Error (-10005)

The IPC timeout error typically occurs when trying to login to an account that hasn't been manually logged in before. MT5 requires manual login at least once per account to register the server and account configuration.

**Solutions:**

1. **Manual Login (Recommended for Production):**

   - Open MT5 terminal manually
   - Login to your account once
   - After this one-time setup, automated logins will work permanently
   - This is the most reliable approach for production environments

2. **Use Manual Login Parameter:**
   - Set `manualLogin: true` in your API request body
   - Requires `pyautogui` and `psutil` packages (already in requirements.txt)
   - Requires desktop session (won't work in headless environments)
   - The service will attempt UI automation to handle the login dialog
   - **Note:** UI automation is fragile and may break if MT5 UI changes
   - Example request:
     ```json
     {
       "accountId": 12345678,
       "password": "your-password",
       "server": "Broker-Demo",
       "manualLogin": true
     }
     ```

**Important:** After manual login once, automation is no longer needed for that account.

### Concurrent Manual Login Requests

The service uses a thread-safe locking mechanism to prevent concurrent automation attempts. Since there's only one MT5 terminal instance, only one automation can run at a time.

**Behavior:**

- If two requests with `manualLogin: true` arrive simultaneously, one will wait (up to 2 minutes) for the other to complete
- If the lock cannot be acquired within the timeout period, the request will return an error
- This prevents race conditions and ensures reliable automation

**Error Message:**
If you see: `"Could not acquire automation lock within 120 seconds. Another automation may be in progress."`

- Wait a moment and retry the request
- Check logs to see if another automation is still running
- Consider reducing concurrent requests or increasing `AUTOMATION_TIMEOUT` if needed

### No Trades Returned

- Verify the date range includes periods with closed trades
- Ensure the account has completed trades (not just open positions)
- Check that trades were closed within the specified date range

### Authentication Errors

- Verify the `X-API-Key` header is included in requests
- Ensure the API key matches the `MT5_API_KEY` environment variable
- Check for typos or extra whitespace in the API key

## License

[Add your license here]

## Support

[Add support contact information here]
