import urllib.request
import json

urls = [
    "https://smarket-api.duckdns.org/api/v1/health",
    "https://smarket-api.duckdns.org/health",
    "https://smarket-api.duckdns.org/api/v1/auth/health",
]

for url in urls:
    try:
        print(f"Probing {url}...")
        with urllib.request.urlopen(url, timeout=5) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"-> Success! Status: {status}, Body: {body}")
    except Exception as e:
        print(f"-> Failed: {e}")
