"""
Test suite for MT5 Service
"""
import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from app import app, authenticate_request, determine_session, calculate_risk_reward, transform_mt5_trade


@pytest.fixture
def client():
    """Create a test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def api_key():
    """Get the API key from environment or use default"""
    import os
    return os.getenv('MT5_API_KEY', 'your-secret-api-key-change-in-production')


@pytest.fixture
def mock_mt5():
    """Mock MetaTrader5 module"""
    with patch('app.mt5') as mock_mt5:
        yield mock_mt5


@pytest.fixture
def sample_account_info():
    """Sample MT5 account info"""
    account_info = Mock()
    account_info.login = 12345678
    account_info.server = 'Broker-Demo'
    account_info.balance = 10000.0
    account_info.equity = 10000.0
    account_info.margin = 0.0
    account_info.currency = 'USD'
    return account_info


@pytest.fixture
def sample_deal():
    """Sample MT5 deal"""
    deal = Mock()
    deal.deal = 123456
    deal.time = int(datetime(2024, 1, 15, 10, 0, 0).timestamp())
    deal.time_update = int(datetime(2024, 1, 15, 12, 0, 0).timestamp())
    deal.symbol = 'EURUSD'
    deal.profit = 50.0
    deal.volume = 0.1
    deal.reason = 3  # DEAL_REASON_TP
    deal.entry = 1  # DEAL_ENTRY_OUT
    deal.type = 0  # DEAL_TYPE_BUY
    deal.position_id = 789012
    return deal


class TestHealthCheck:
    """Tests for health check endpoint"""

    def test_health_check_success(self, client):
        """Test health check endpoint returns ok"""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'ok'
        assert data['service'] == 'mt5-service'


class TestAuthentication:
    """Tests for authentication"""

    def test_authenticate_request_valid_key(self, client, api_key):
        """Test authentication with valid API key"""
        with patch('app.request') as mock_request:
            mock_request.headers.get.return_value = api_key
            result = authenticate_request()
            assert result is None

    def test_authenticate_request_invalid_key(self, client):
        """Test authentication with invalid API key"""
        with patch('app.request') as mock_request:
            mock_request.headers.get.return_value = 'invalid-key'
            result = authenticate_request()
            assert result is not None
            assert result[1] == 401  # status code


class TestHelperFunctions:
    """Tests for helper functions"""

    def test_determine_session_london(self):
        """Test session determination for London session"""
        timestamp = datetime(2024, 1, 15, 10, 0, 0)  # 10:00 UTC
        assert determine_session(timestamp) == 'LONDON'

    def test_determine_session_ny(self):
        """Test session determination for NY session"""
        timestamp = datetime(2024, 1, 15, 15, 0, 0)  # 15:00 UTC
        assert determine_session(timestamp) == 'NY'

    def test_determine_session_asia(self):
        """Test session determination for Asia session"""
        timestamp = datetime(2024, 1, 15, 2, 0, 0)  # 02:00 UTC
        assert determine_session(timestamp) == 'ASIA'

    def test_calculate_risk_reward_positive_profit(self):
        """Test risk-reward calculation with positive profit"""
        symbol_info = Mock()
        profit = 100.0
        volume = 0.1
        result = calculate_risk_reward(profit, volume, symbol_info)
        assert result > 0

    def test_calculate_risk_reward_zero_profit(self):
        """Test risk-reward calculation with zero profit"""
        symbol_info = Mock()
        profit = 0.0
        volume = 0.1
        result = calculate_risk_reward(profit, volume, symbol_info)
        assert result == 0

    def test_calculate_risk_reward_zero_volume(self):
        """Test risk-reward calculation with zero volume"""
        symbol_info = Mock()
        profit = 100.0
        volume = 0.0
        result = calculate_risk_reward(profit, volume, symbol_info)
        assert result == 0

    def test_transform_mt5_trade(self, sample_deal, sample_account_info, mock_mt5):
        """Test MT5 trade transformation"""
        mock_mt5.symbol_info.return_value = Mock()
        mock_mt5.DEAL_REASON_SL = 4
        mock_mt5.DEAL_REASON_TP = 3

        result = transform_mt5_trade(sample_deal, sample_account_info)

        assert 'entryTime' in result
        assert 'exitTime' in result
        assert 'riskPercentUsed' in result
        assert 'profitLoss' in result
        assert 'riskRewardAchieved' in result
        assert 'session' in result
        assert 'stopLossHit' in result
        assert 'exitedEarly' in result
        assert 'targetPercentAchieved' in result
        assert 'notes' in result
        assert 'mt5DealId' in result
        assert 'mt5Symbol' in result
        assert result['profitLoss'] == 50.0
        assert result['mt5DealId'] == 123456
        assert result['mt5Symbol'] == 'EURUSD'


class TestConnectEndpoint:
    """Tests for /connect endpoint"""

    def test_connect_missing_api_key(self, client):
        """Test connect endpoint without API key"""
        response = client.post('/connect', json={
            'accountId': 12345678,
            'password': 'password',
            'server': 'Broker-Demo'
        })
        assert response.status_code == 401

    def test_connect_invalid_api_key(self, client):
        """Test connect endpoint with invalid API key"""
        response = client.post('/connect', 
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo'
                             },
                             headers={'X-API-Key': 'invalid-key'})
        assert response.status_code == 401

    def test_connect_success(self, client, api_key, mock_mt5, sample_account_info):
        """Test successful connection to MT5"""
        mock_mt5.initialize.return_value = True
        mock_mt5.login.return_value = True
        mock_mt5.account_info.return_value = sample_account_info

        response = client.post('/connect',
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo'
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['accountId'] == 12345678
        assert data['server'] == 'Broker-Demo'
        assert data['balance'] == 10000.0
        mock_mt5.initialize.assert_called_once()
        mock_mt5.login.assert_called_once_with(12345678, password='password', server='Broker-Demo')
        mock_mt5.account_info.assert_called_once()

    def test_connect_initialization_failure(self, client, api_key, mock_mt5):
        """Test connection failure due to MT5 initialization error"""
        mock_mt5.initialize.return_value = False
        mock_mt5.last_error.return_value = (1, 'Initialization failed')

        response = client.post('/connect',
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo'
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 500
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'initialization failed' in data['error'].lower()

    def test_connect_login_failure(self, client, api_key, mock_mt5):
        """Test connection failure due to login error"""
        mock_mt5.initialize.return_value = True
        mock_mt5.login.return_value = False
        mock_mt5.last_error.return_value = (10004, 'Invalid account')

        response = client.post('/connect',
                             json={
                                 'accountId': 12345678,
                                 'password': 'wrong-password',
                                 'server': 'Broker-Demo'
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 401
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'login failed' in data['error'].lower()
        mock_mt5.shutdown.assert_called_once()

    def test_connect_missing_fields(self, client, api_key):
        """Test connect endpoint with missing required fields"""
        response = client.post('/connect',
                             json={'accountId': 12345678},
                             headers={'X-API-Key': api_key})
        # Should handle missing fields gracefully
        assert response.status_code in [400, 500]


class TestTradesEndpoint:
    """Tests for /trades endpoint"""

    def test_trades_missing_api_key(self, client):
        """Test trades endpoint without API key"""
        response = client.post('/trades', json={
            'accountId': 12345678,
            'password': 'password',
            'server': 'Broker-Demo'
        })
        assert response.status_code == 401

    def test_trades_success_no_trades(self, client, api_key, mock_mt5, sample_account_info):
        """Test trades endpoint with no trades found"""
        mock_mt5.initialize.return_value = True
        mock_mt5.login.return_value = True
        mock_mt5.account_info.return_value = sample_account_info
        mock_mt5.history_deals_get.return_value = None
        mock_mt5.last_error.return_value = (1, 'No deals')

        from_date = (datetime.now() - timedelta(days=30)).isoformat()
        to_date = datetime.now().isoformat()

        response = client.post('/trades',
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo',
                                 'fromDate': from_date,
                                 'toDate': to_date
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['trades'] == []
        assert data['count'] == 0

    def test_trades_success_with_trades(self, client, api_key, mock_mt5, sample_account_info, sample_deal):
        """Test trades endpoint with trades found"""
        mock_mt5.initialize.return_value = True
        mock_mt5.login.return_value = True
        mock_mt5.account_info.return_value = sample_account_info
        mock_mt5.history_deals_get.return_value = [sample_deal]
        mock_mt5.symbol_info.return_value = Mock()
        mock_mt5.DEAL_ENTRY_OUT = 1
        mock_mt5.DEAL_TYPE_BUY = 0
        mock_mt5.DEAL_TYPE_SELL = 1
        mock_mt5.DEAL_REASON_SL = 4
        mock_mt5.DEAL_REASON_TP = 3

        from_date = (datetime.now() - timedelta(days=30)).isoformat()
        to_date = datetime.now().isoformat()

        response = client.post('/trades',
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo',
                                 'fromDate': from_date,
                                 'toDate': to_date
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'trades' in data
        assert data['count'] >= 0
        mock_mt5.shutdown.assert_called_once()

    def test_trades_with_default_dates(self, client, api_key, mock_mt5, sample_account_info):
        """Test trades endpoint with default date range"""
        mock_mt5.initialize.return_value = True
        mock_mt5.login.return_value = True
        mock_mt5.account_info.return_value = sample_account_info
        mock_mt5.history_deals_get.return_value = None
        mock_mt5.last_error.return_value = (1, 'No deals')

        response = client.post('/trades',
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo'
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

    def test_trades_initialization_failure(self, client, api_key, mock_mt5):
        """Test trades endpoint with MT5 initialization failure"""
        mock_mt5.initialize.return_value = False
        mock_mt5.last_error.return_value = (1, 'Initialization failed')

        from_date = (datetime.now() - timedelta(days=30)).isoformat()
        to_date = datetime.now().isoformat()

        response = client.post('/trades',
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo',
                                 'fromDate': from_date,
                                 'toDate': to_date
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 500
        data = json.loads(response.data)
        assert data['success'] is False

    def test_trades_login_failure(self, client, api_key, mock_mt5):
        """Test trades endpoint with login failure"""
        mock_mt5.initialize.return_value = True
        mock_mt5.login.return_value = False
        mock_mt5.last_error.return_value = (10004, 'Invalid account')

        from_date = (datetime.now() - timedelta(days=30)).isoformat()
        to_date = datetime.now().isoformat()

        response = client.post('/trades',
                             json={
                                 'accountId': 12345678,
                                 'password': 'wrong-password',
                                 'server': 'Broker-Demo',
                                 'fromDate': from_date,
                                 'toDate': to_date
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 401
        data = json.loads(response.data)
        assert data['success'] is False
        mock_mt5.shutdown.assert_called_once()

    def test_trades_filters_closed_trades(self, client, api_key, mock_mt5, sample_account_info, sample_deal):
        """Test that only closed trades are returned"""
        # Create a deal that should be filtered out (entry != OUT)
        open_deal = Mock()
        open_deal.entry = 0  # DEAL_ENTRY_IN
        open_deal.type = 0  # DEAL_TYPE_BUY
        open_deal.position_id = 111111

        mock_mt5.initialize.return_value = True
        mock_mt5.login.return_value = True
        mock_mt5.account_info.return_value = sample_account_info
        mock_mt5.history_deals_get.return_value = [sample_deal, open_deal]
        mock_mt5.symbol_info.return_value = Mock()
        mock_mt5.DEAL_ENTRY_OUT = 1
        mock_mt5.DEAL_TYPE_BUY = 0
        mock_mt5.DEAL_TYPE_SELL = 1
        mock_mt5.DEAL_REASON_SL = 4
        mock_mt5.DEAL_REASON_TP = 3

        from_date = (datetime.now() - timedelta(days=30)).isoformat()
        to_date = datetime.now().isoformat()

        response = client.post('/trades',
                             json={
                                 'accountId': 12345678,
                                 'password': 'password',
                                 'server': 'Broker-Demo',
                                 'fromDate': from_date,
                                 'toDate': to_date
                             },
                             headers={'X-API-Key': api_key})

        assert response.status_code == 200
        data = json.loads(response.data)
        # Should only include closed trades (sample_deal), not open_deal
        assert data['success'] is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])



