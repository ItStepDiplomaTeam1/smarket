import time
import urllib.request
import json
import hmac
import hashlib
import base64

SECRET = "1630cfa92123bb3a9149703161f295064421147c22963ce75bcf717304b1b22f"

def base64url_encode(payload):
    return base64.urlsafe_b64encode(payload).rstrip(b'=').decode('utf-8')

def generate_jwt(user_id, role):
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": int(time.time()) + 3600
    }
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload).encode('utf-8'))
    signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"

token = generate_jwt(1, "admin")
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json"
}

url = "https://smarket-api.duckdns.org/api/v1/admin/audit-health"
print(f"Requesting audit health from {url}...")
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"Status: {response.getcode()}")
        body = response.read().decode('utf-8')
        print(f"Response: {json.dumps(json.loads(body), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"Failed to get audit health: {e}")
