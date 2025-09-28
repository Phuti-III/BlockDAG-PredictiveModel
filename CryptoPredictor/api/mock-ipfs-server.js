// mock-ipfs-server.js
// A simple mock IPFS server for development when you can't run actual IPFS

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = 3000;

// In-memory storage for mock IPFS
const mockStorage = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// Generate mock IPFS hash
function generateMockHash(data) {
  return 'Qm' + crypto.createHash('sha256').update(data).digest('hex').substring(0, 44);
}

// Mock IPFS API endpoints

// Add file (POST /api/v0/add)
app.post('/api/v0/add', upload.single('file'), (req, res) => {
  try {
    let fileData;
    let fileName = 'unknown';

    if (req.file) {
      fileData = req.file.buffer;
      fileName = req.file.originalname || 'uploaded-file';
    } else if (req.body && req.body.data) {
      fileData = Buffer.from(req.body.data);
    } else {
      return res.status(400).json({ error: 'No file data provided' });
    }

    const hash = generateMockHash(fileData);
    
    // Store in mock storage
    mockStorage.set(hash, {
      data: fileData,
      name: fileName,
      size: fileData.length,
      addedAt: new Date().toISOString()
    });

    console.log(`📁 Mock IPFS: Added file "${fileName}" with hash ${hash}`);

    res.json({
      Name: fileName,
      Hash: hash,
      Size: fileData.length.toString()
    });

  } catch (error) {
    console.error('Mock IPFS add error:', error);
    res.status(500).json({ error: 'Failed to add file' });
  }
});

// Get file (GET /api/v0/cat)
app.get('/api/v0/cat', (req, res) => {
  const hash = req.query.arg;
  
  if (!hash) {
    return res.status(400).json({ error: 'Hash parameter required' });
  }

  const file = mockStorage.get(hash);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': file.size
  });
  
  res.send(file.data);
});

// Pin file (POST /api/v0/pin/add) - just acknowledge
app.post('/api/v0/pin/add', (req, res) => {
  const hash = req.query.arg;
  res.json({
    Pins: [hash],
    Progress: hash
  });
});

// List pins (POST /api/v0/pin/ls)
app.post('/api/v0/pin/ls', (req, res) => {
  const pins = {};
  for (const hash of mockStorage.keys()) {
    pins[hash] = { Type: 'recursive' };
  }
  res.json({ Keys: pins });
});

// Stats (POST /api/v0/stats/repo)
app.post('/api/v0/stats/repo', (req, res) => {
  const totalSize = Array.from(mockStorage.values())
    .reduce((sum, file) => sum + file.size, 0);
  
  res.json({
    RepoSize: totalSize,
    StorageMax: 10 * 1024 * 1024 * 1024, // 10GB mock limit
    NumObjects: mockStorage.size,
    RepoPath: './mock-ipfs-data',
    Version: '0.22.0-mock'
  });
});

// Version info (POST /api/v0/version)
app.post('/api/v0/version', (req, res) => {
  res.json({
    Version: '0.22.0-mock',
    Commit: 'mock-commit-hash',
    Repo: '15',
    System: 'amd64/linux',
    Golang: 'go1.19.1'
  });
});

// CORS for browser access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    type: 'mock-ipfs',
    files: mockStorage.size,
    uptime: process.uptime()
  });
});

// List all stored files (for debugging)
app.get('/debug/files', (req, res) => {
  const files = [];
  for (const [hash, file] of mockStorage.entries()) {
    files.push({
      hash,
      name: file.name,
      size: file.size,
      addedAt: file.addedAt
    });
  }
  res.json({ files, count: files.length });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock IPFS Server running on port ${PORT}`);
  console.log(`📝 This is a development mock - not real IPFS!`);
  console.log(`🔗 API endpoints:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Debug:  http://localhost:${PORT}/debug/files`);
  console.log(`   IPFS:   http://localhost:${PORT}/api/v0/*`);
  console.log(`📁 Files stored in memory (will be lost on restart)`);
});

module.exports = app;