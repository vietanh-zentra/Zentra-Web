import urllib.request, json, time, urllib.error
import random

def post_json(url, payload, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers
    )
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f'HTTP Error {e.code}: {e.read().decode()}')
        return None

def get_json(url, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers)
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f'HTTP Error {e.code}: {e.read().decode()}')
        return None

# 0. Register User
email = f"test_{random.randint(1000,9999)}@example.com"
print(f'Registering user {email}...')
user_res = post_json('http://localhost:3000/v1/auth/register', {
    'email': email,
    'password': 'Password123!',
    'name': 'Viet Anh Zentra'
})

if not user_res:
    print('Failed to register user. Try logging in?')
    user_res = post_json('http://localhost:3000/v1/auth/login', {
        'email': 'test@example.com', 'password': 'Password123!'
    })

if user_res and 'tokens' in user_res:
    token = user_res['tokens']['access']['token']
    print('Got JWT Token:', token[:15] + '...')
    
    # 1. Register Account
    print('\nRegistering MT5 account...')
    account = post_json('http://localhost:3000/v1/accounts', {
        'accountId': '5049421223',
        'server': 'MetaQuotes-Demo',
        'password': '1l!zBdGv',
        'status': 'active'
    }, token)
    
    if account:
        _id = account.get('id') or account.get('_id')
        print('Account registered:', _id)
        
        # Wait for DB to settle
        time.sleep(1)
        
        # 2. Trigger Sync
        print('\nTriggering sync...')
        sync_result = post_json('http://localhost:3000/v1/accounts/' + _id + '/sync', {}, token)
        if sync_result:
            print('Sync complete:', json.dumps(sync_result, indent=2))
            
            # 3. Get Trades from DB
            print('\nFetching trades from DB...')
            trades = get_json('http://localhost:3000/v1/trades?accountId=' + _id, token)
            if trades:
                results = trades.get('results', [])
                print('Total trades in DB:', len(results))
                for t in results:
                    print('  %s %s %s profit=%s' % (
                        t.get('ticket'), t.get('tradeType'), t.get('mt5Symbol'), t.get('profitLoss')))
