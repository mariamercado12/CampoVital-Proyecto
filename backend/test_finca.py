import urllib.request
import json

data = {
  "nombre": "Finca Test",
  "areaTotal": 10.5,
  "unidadArea": "HECTAREAS",
  "municipio": "Santa Marta",
  "latitud": 10.4195,
  "longitud": -74.1502,
  "vereda": "La Esperanza",
  "descripcion": "Finca de prueba"
}

# 1. Login to get token
login_data = {"email": "test@example.com", "password": "password123"}
req_login = urllib.request.Request('http://localhost:9000/api/auth/login', method='POST')
req_login.add_header('Content-Type', 'application/json')
try:
    res_login = urllib.request.urlopen(req_login, data=json.dumps(login_data).encode('utf-8'))
    login_resp = json.loads(res_login.read().decode('utf-8'))
    token = login_resp['datos']['token']
    usuario_id = login_resp['datos']['usuarioId']
    print(f"Logged in. Usuario ID: {usuario_id}, Token: {token[:20]}...")
except Exception as e:
    print("Login failed:", e)
    if hasattr(e, 'read'): print(e.read().decode('utf-8'))
    exit(1)

# 2. Create Finca
req_finca = urllib.request.Request(f'http://localhost:9000/api/fincas/productor/{usuario_id}', method='POST')
req_finca.add_header('Content-Type', 'application/json')
req_finca.add_header('Authorization', f'Bearer {token}')
try:
    res_finca = urllib.request.urlopen(req_finca, data=json.dumps(data).encode('utf-8'))
    print("Finca Created:")
    print(res_finca.read().decode('utf-8'))
except Exception as e:
    print("Finca creation failed:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))

