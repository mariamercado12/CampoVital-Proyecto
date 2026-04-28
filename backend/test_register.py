import urllib.request
import json

data = {
    "nombreCompleto": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "rol": "AGRICULTOR"
}
req = urllib.request.Request('http://localhost:9000/api/auth/register', method='POST')
req.add_header('Content-Type', 'application/json')
try:
    response = urllib.request.urlopen(req, data=json.dumps(data).encode('utf-8'))
    print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
