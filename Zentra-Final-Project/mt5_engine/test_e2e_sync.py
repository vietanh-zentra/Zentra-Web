import urllib.request, json

req = urllib.request.Request(
    "http://localhost:5000/sync",
    data=json.dumps({
        "accountId": 5049421223,
        "server": "MetaQuotes-Demo",
        "password": "1l!zBdGv",
        "fromDate": "2020-01-01T00:00:00Z"
    }).encode(),
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "your-secret-api-key-change-in-production"
    }
)
r = urllib.request.urlopen(req)
d = json.loads(r.read())

print("success:", d.get("success"))
print("trades:", len(d.get("trades", [])))
if d.get("trades"):
    for t in d["trades"]:
        print("  ticket=%s type=%s symbol=%s vol=%s profit=%s" % (
            t.get("ticket"), t.get("tradeType"), t.get("mt5Symbol"), 
            t.get("volume"), t.get("profitLoss")
        ))
