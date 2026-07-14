import time
import urllib.request
import json
import hmac
import hashlib
import base64

# Secret key from gateway .env
SECRET = "1630cfa92123bb3a9149703161f295064421147c22963ce75bcf717304b1b22f"

# Function to encode base64url
def base64url_encode(payload):
    return base64.urlsafe_b64encode(payload).rstrip(b'=').decode('utf-8')

# Generate JWT Token manually using standard library to avoid dependency issues
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
print(f"Generated Admin Token: {token}\n")

headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json"
}

# Request system status
try:
    url = "https://smarket-api.duckdns.org/api/v1/admin/system-status"
    print(f"Requesting system status from {url}...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"Status: {response.getcode()}")
        body = response.read().decode('utf-8')
        print(f"Response: {json.dumps(json.loads(body), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"Failed to get system status: {e}")

# Request audit logs
try:
    url = "https://smarket-api.duckdns.org/api/v1/admin/audit?page=1&limit=5"
    print(f"\nRequesting audit logs from {url}...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"Status: {response.getcode()}")
        body = response.read().decode('utf-8')
        print(f"Response: {json.dumps(json.loads(body), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"Failed to get audit logs: {e}")
