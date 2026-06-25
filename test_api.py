import urllib.request, json
try:
    req = urllib.request.Request("http://157.180.74.21:8080/api/v1/cart/")
    req.add_header('Authorization', 'Bearer 1')
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode())
    print(json.dumps(data, indent=2))
except Exception as e:
    print(e)
