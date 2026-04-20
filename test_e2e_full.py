import urllib.request, json, time, urllib.error
import random

def req_json(url, payload=None, token=None, method='POST'):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    if method == 'GET':
        req = urllib.request.Request(url, headers=headers)
    else:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f'HTTP Error {e.code} to {url}:\n{e.read().decode()}')
        return None

email = f"test_{random.randint(1000,9999)}@example.com"
print('1. Registering user', email)
user = req_json('http://localhost:3000/v1/auth/register', {
    'email': email, 'password': 'Password123!', 'name': 'Tester'
})
if not user:
    user = req_json('http://localhost:3000/v1/auth/login', {
        'email': 'test_auth@example.com', 'password': 'Password123!'
    })

token = user['tokens']['access']['token']
print('   -> Token generated')

print('\n2. Connect MT5 credentials (via Node API)...')
connect = req_json('http://localhost:3000/v1/mt5/connect', {
    'accountId': '5049421223',
    'server': 'MetaQuotes-Demo',
    'password': '1l!zBdGv'
}, token)
if connect: print('   -> MT5 Connected to user profile!')

print('\n3. Creating MT5 Account in Database...')
acc = req_json('http://localhost:3000/v1/accounts', {
    'accountId': '5049421223',
    'brokerServer': 'MetaQuotes-Demo',
    'accountName': 'Zentra Demo'
}, token)

if acc:
    _id = acc['account']['id']
    print('   -> Account created, ID:', _id)
    time.sleep(1)
    
    print('\n4. Triggering E2E Full Sync...')
    sync = req_json(f'http://localhost:3000/v1/accounts/{_id}/sync', {}, token)
    if sync:
        print('   -> Sync completed in Node.js server:', sync)
        
        print('\n5. Verifying Trades via Node.js...')
        trades = req_json(f'http://localhost:3000/v1/accounts/{_id}/trades', token=token, method='GET')
        if trades:
            for t in trades.get('trades', []):
                print(f"      [Trade ID {t.get('id')}] {t.get('ticket')} {t.get('tradeType')} {t.get('mt5Symbol')} {t.get('volume')} lot - Profit: {t.get('profitLoss')} GBP")
