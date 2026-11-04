const http = require('http');

http.get('http://127.0.0.1:9007/sales/pos/select-products', (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const jsonStart = b.indexOf('{"props":');
    if (jsonStart !== -1) {
      try {
        const jsonEnd = b.indexOf('</script>', jsonStart);
        const data = JSON.parse(b.slice(jsonStart, jsonEnd));
        console.log('POS Error:', data.err?.message || data.err);
      } catch (e) {
        console.log('Error parsing POS JSON:', e.message);
      }
    } else {
      console.log('No props found, body slice:', b.slice(0, 500));
    }
  });
});

