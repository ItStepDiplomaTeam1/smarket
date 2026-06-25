const http = require('http');

const req = http.get('http://157.180.74.21:8080/api/v1/products/1', res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", data.substring(0, 1000));
  });
});
req.on('error', e => console.error(e));
