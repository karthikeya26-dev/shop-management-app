import urllib.request
import urllib.error
import json

try:
    req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', 
        data=json.dumps({'username': 'admin', 'password': 'admin'}).encode('utf-8'), 
        headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['access_token']
    
    req2 = urllib.request.Request('http://127.0.0.1:5000/api/expenses', 
        data=json.dumps({'description': 'test', 'amount': 100}).encode('utf-8'), 
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    print(res2.read())
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
