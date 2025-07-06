const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle API requests first
  if (handleApiRequest(req, res)) {
    return;
  }
  
  let filePath = '.' + req.url;
  
  // Default to index.html
  if (filePath === './' || filePath === './') {
    filePath = './dist/index.html';
  }
  
  // Handle root path
  if (filePath === '.' || filePath === './') {
    filePath = './dist/index.html';
  }
  
  // Handle examples directory requests (only for directory, not specific files)
  if (filePath === './examples' || filePath === './examples/') {
    filePath = './examples/index.html';
  }
  
  // Handle cdn-test.html directly from root
  if (filePath === './cdn-test.html') {
    filePath = './examples/cdn-test.html';
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Test server running at http://localhost:${PORT}\n`);
  console.log('Available test pages:');
  console.log(`  📄 Widget Test Page: http://localhost:${PORT}/examples/`);
  console.log(`  📄 Built HTML: http://localhost:${PORT}/dist/`);
  console.log(`  🔧 Widget JS: http://localhost:${PORT}/dist/visual-feedback-widget.min.js`);
  console.log(`  🎨 Widget CSS: http://localhost:${PORT}/dist/visual-feedback-widget.min.css`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down test server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Mock API endpoints for testing
const handleApiRequest = (req, res) => {
  if (req.url.startsWith('/api/')) {
    // Mock API responses
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/api/tickets' && req.method === 'POST') {
      // Mock ticket creation
      const mockTicket = {
        id: 'ticket_' + Date.now(),
        ticket_number: 'TK-' + Math.floor(Math.random() * 10000),
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: mockTicket
      }));
      return true;
    }
    
    if (req.url === '/api/upload' && req.method === 'POST') {
      // Mock file upload
      const mockUpload = {
        id: 'upload_' + Date.now(),
        filename: 'test-file.txt',
        url: 'https://example.com/uploads/test-file.txt',
        size: 1024,
        type: 'text/plain'
      };
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: mockUpload
      }));
      return true;
    }
    
    if (req.url === '/api/widget/analytics' && req.method === 'POST') {
      // Mock analytics endpoint
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Analytics tracked'
      }));
      return true;
    }
    
    if (req.url === '/api/test-endpoint' && req.method === 'POST') {
      // Mock test endpoint for visual feedback widget
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Visual feedback received',
        ticket_id: 'VF-' + Date.now(),
        timestamp: new Date().toISOString()
      }));
      return true;
    }
    
    // Default API response
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: { message: 'API endpoint not found' }
    }));
    return true;
  }
  return false;
}; 