const http = require('http');

function fetchUrl(port) {
  return new Promise((resolve) => {
    http.get(`http://localhost:${port}/api/shop-order`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ port, status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ port, status: res.statusCode, error: 'Failed to parse JSON' });
        }
      });
    }).on('error', (err) => {
      resolve({ port, error: err.message });
    });
  });
}

async function run() {
  const ports = [3000, 3001, 3002, 5000, 8080];
  console.log('Testing local API endpoints across common dev ports...');
  for (const port of ports) {
    const res = await fetchUrl(port);
    if (!res.error) {
      console.log(`Port ${port} responded with status ${res.status}:`);
      console.log('isDemo:', res.body.isDemo);
      console.log('warning:', res.body.warning);
      console.log('First Item in Data:', res.body.data?.[0]);
      console.log('Total Items:', res.body.data?.length);
      return;
    } else {
      console.log(`Port ${port} error: ${res.error}`);
    }
  }
}

run();
