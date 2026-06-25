const http = require('http');

const options = {
  hostname: '157.180.74.21',
  port: 8080,
  path: '/api/v1/products',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});
req.end();
