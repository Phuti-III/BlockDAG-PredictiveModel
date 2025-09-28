BlockDAG File Storage API Documentation
Overview
This API provides RESTful endpoints to interact with the BlockDAG File Storage System smart contract. It enables file upload, sharing, deletion, and retrieval operations with role-based access control.

Base URL
http://localhost:3000/api
Demo Accounts
User: 0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c
Law Enforcement: 0x0a213702b6050FbF645925dAb4a143F0002a4B97
Endpoints
1. Health Check
GET /health

Check API health status.

Response:

json
{
  "status": "healthy",
  "timestamp": "2025-08-24T12:00:00.000Z",
  "contract": "0xf5ea995aEE58B09dD9fbe2f8228a97c74129685A",
  "network": "BlockDAG Primordial"
}
2. Upload File
POST /files/upload

Upload a file to the blockchain and IPFS.

Content-Type: multipart/form-data

Parameters:

file (file, required): The file to upload
userAddress (string, required): User's blockchain address
isPrivate (boolean, optional): Whether the file is private (default: false)
encryptionKey (string, optional): Encryption key for private files
Example Request:

bash
curl -X POST \
  -F "file=@document.pdf" \
  -F "userAddress=0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c" \
  -F "isPrivate=false" \
  http://localhost:3000/api/files/upload
Response:

json
{
  "success": true,
  "fileId": "1",
  "ipfsHash": "QmTest123456789abcdef",
  "transactionHash": "0x...",
  "message": "File uploaded successfully"
}
3. Get User Files
GET /files/user/:address

Get all files owned by a specific user.

Parameters:

address (path parameter): User's blockchain address
Example Request:

bash
curl http://localhost:3000/api/files/user/0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c
Response:

json
{
  "success": true,
  "files": [
    {
      "id": "1",
      "ipfsHash": "QmTest123456789abcdef",
      "fileName": "public-document.pdf",
      "owner": "0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c",
      "uploadTime": "2025-08-24T12:00:00.000Z",
      "fileSize": "2048",
      "fileType": "application/pdf"
    }
  ],
  "count": 1
}
5. Get File Details
GET /files/:fileId

Get details of a specific file by ID.

Parameters:

fileId (path parameter): The file ID
userAddress (query parameter, optional): User address for authorization
Example Request:

bash
curl "http://localhost:3000/api/files/1?userAddress=0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c"
Response:

json
{
  "success": true,
  "file": {
    "id": "1",
    "ipfsHash": "QmTest123456789abcdef",
    "fileName": "document.pdf",
    "owner": "0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c",
    "uploadTime": "2025-08-24T12:00:00.000Z",
    "isPrivate": false,
    "isDeleted": false,
    "fileSize": "1024",
    "fileType": "application/pdf"
  }
}
6. Share File
POST /files/:fileId/share

Share a file with another user.

Parameters:

fileId (path parameter): The file ID to share
userAddress (body): Owner's blockchain address
recipientAddress (body): Recipient's blockchain address
Example Request:

bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c",
    "recipientAddress": "0x0a213702b6050FbF645925dAb4a143F0002a4B97"
  }' \
  http://localhost:3000/api/files/1/share
Response:

json
{
  "success": true,
  "transactionHash": "0x...",
  "message": "File shared successfully"
}
7. Delete File
DELETE /files/:fileId

Delete (mark as deleted) a file.

Parameters:

fileId (path parameter): The file ID to delete
userAddress (body): Owner's blockchain address
Example Request:

bash
curl -X DELETE \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c"
  }' \
  http://localhost:3000/api/files/1
Response:

json
{
  "success": true,
  "transactionHash": "0x...",
  "message": "File deleted successfully"
}
8. Get Files Shared By User
GET /files/shared-by/:address

Get all files shared by a user and their recipients.

Parameters:

address (path parameter): User's blockchain address
Example Request:

bash
curl http://localhost:3000/api/files/shared-by/0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c
Response:

json
{
  "success": true,
  "sharedFiles": [
    {
      "id": "1",
      "fileName": "shared-document.pdf",
      "ipfsHash": "QmTest123456789abcdef",
      "fileType": "application/pdf",
      "fileSize": "1024",
      "uploadTime": "2025-08-24T12:00:00.000Z",
      "sharedWith": [
        "0x0a213702b6050FbF645925dAb4a143F0002a4B97"
      ]
    }
  ],
  "count": 1
}
9. Get Files Shared With User
GET /files/shared-with/:address

Get all files that have been shared with a user.

Parameters:

address (path parameter): User's blockchain address
Example Request:

bash
curl http://localhost:3000/api/files/shared-with/0x0a213702b6050FbF645925dAb4a143F0002a4B97
Response:

json
{
  "success": true,
  "files": [
    {
      "id": "1",
      "ipfsHash": "QmTest123456789abcdef",
      "fileName": "shared-document.pdf",
      "owner": "0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c",
      "uploadTime": "2025-08-24T12:00:00.000Z",
      "isPrivate": true,
      "fileSize": "1024",
      "fileType": "application/pdf"
    }
  ],
  "count": 1
}
10. Populate Demo Data
POST /demo/populate

Populate the blockchain with demo files and sharing relationships for testing.

Example Request:

bash
curl -X POST http://localhost:3000/api/demo/populate
Response:

json
{
  "success": true,
  "message": "Demo data populated successfully",
  "results": [
    {
      "user": "demo_user",
      "fileName": "Personal_Document.pdf",
      "txHash": "0x...",
      "status": "success"
    },
    {
      "user": "law_enforcement",
      "fileName": "Case_File_001.pdf",
      "txHash": "0x...",
      "status": "success"
    }
  ]
}
Error Responses
All endpoints return consistent error responses:

json
{
  "error": "Error message",
  "details": "Detailed error description"
}
Common HTTP status codes:

200 - Success
400 - Bad Request (missing parameters, validation errors)
403 - Forbidden (unauthorized user)
404 - Not Found
500 - Internal Server Error
Setup Instructions
Prerequisites
Node.js (version 16 or higher)
IPFS node running locally on port 5001
BlockDAG network access
Private keys for demo accounts
Installation
Clone the repository and navigate to the API directory:
bash
cd api
npm install
Create .env file with your configuration:
bash
cp .env.example .env
# Edit .env with your private keys and configuration
Start IPFS daemon:
bash
ipfs daemon
Start the API server:
bash
npm run dev
The API will be available at http://localhost:3000

Demo Data Population
After starting the server, populate with demo data:

bash
npm run populate-demo
Or manually:

bash
curl -X POST http://localhost:3000/api/demo/populate
Demo Files Created
The demo population creates the following files:

User Files (0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c)
Personal_Document.pdf (Public)
Private_Contract.docx (Private)
Public_Report.txt (Public)
Confidential_Data.xlsx (Private)
Law Enforcement Files (0x0a213702b6050FbF645925dAb4a143F0002a4B97)
Case_File_001.pdf (Private)
Public_Notice.txt (Public)
Evidence_Log.csv (Private)
Sharing Relationships
User shares Personal_Document.pdf with Law Enforcement
Law Enforcement shares Public_Notice.txt with User
Security Considerations
⚠️ Important Security Notes:

Private Keys: Never commit actual private keys to version control
Production: Use proper key management systems in production
HTTPS: Always use HTTPS in production
Authentication: Implement proper authentication/authorization
Rate Limiting: Add rate limiting for production use
Input Validation: All inputs are validated, but additional validation may be needed
File Size Limits: Current limit is 50MB per file
Testing
Test the API using the provided examples or tools like Postman. Each endpoint includes curl examples for easy testing.

Quick Test Sequence
Check health: GET /api/health
Populate demo data: POST /api/demo/populate
Get public files: GET /api/files/public
Get user files: GET /api/files/user/0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c
Test file sharing and access
Support
For issues or questions, please check:

IPFS daemon is running
Environment variables are correctly set
Network connectivity to BlockDAG
Contract deployment status
License
MIT License "id": "1", "ipfsHash": "QmTest123456789abcdef", "fileName": "document.pdf", "owner": "0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c", "uploadTime": "2025-08-24T12:00:00.000Z", "isPrivate": false, "fileSize": "1024", "fileType": "application/pdf" } ], "count": 1 }


### 4. Get Public Files

**GET** `/files/public`

Get all public files available to everyone.

**Example Request:**
```bash
curl http://localhost:3000/api/files/public
Response:

json
{
  "success": true,
  "files": [
    {
