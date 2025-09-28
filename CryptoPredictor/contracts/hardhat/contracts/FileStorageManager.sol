// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract FileStorageManager is AccessControl,ReentrancyGuard, Pausable{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LAW_ENFORCEMENT_ROLE = keccak256("LAW_ENFORCEMENT_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    
    //File information Structure
    struct FileInfo{
        uint256 id;
        string ipfsHash;
        string fileName;
        address owner;
        uint256 uploadTime;
        bool isPrivate;
        bool isDeleted;
        uint256 fileSize;
        string fileType;
        string encryptionKey;// for private encrypted files
    }

    //Acccess log structure for law enforcement
    struct AccessLog{
        address accessor;
        uint256 timestamp;
        string action; // e.g., "view", "download", "share","delete"
        uint256 fileId;
    }

    //Storage mappings
    mapping(uint256 => FileInfo) public  files;
    mapping(uint256 => address[]) public fileSharedWith;
    mapping(address => uint256[]) public userFiles;
    mapping(address => uint256[]) public sharedWithUser;
    mapping(uint256 => AccessLog[]) public accessLogs;
    
    //Counters
    uint256 public fileCounter;
    uint256 public totalStorageUsed;
    
    //Events
    event FileUploaded(
        uint256 indexed fileId,
        address indexed owner,
        string ipfsHash,
        string fileName,
        bool isPrivate
    );
    event FileShared(
        uint256 indexed fileId,
        address indexed owner,
        address indexed recipient
    );
    event FileDeleted(
        uint256 indexed fileId,
        address indexed owner
    );
    event FileAccessed(
        uint256 indexed fileId,
        address indexed accessor,
        string action
    );
    event LawEnforcementAccess(
        uint256 indexed fileId,
        address indexed leUser,
        string action
    );

    //Modifiers
    modifier onlyFileOwner(uint256 fileId){
        require(files[fileId].owner == msg.sender, "Not file owner");
        _;
    }
    modifier fileExists(uint256 fileId){
        require (fileId > 0 && fileId <= fileCounter,"File does not exist");
        require(!files[fileId].isDeleted,"File has been deleted");
        _;
    }
    modifier onlyAuthorizedAccess(uint256 fileId){
        FileInfo storage file = files[fileId];
        require(
            file.owner == msg.sender||
            hasRole(LAW_ENFORCEMENT_ROLE, msg.sender) ||
            isSharedWith(fileId,msg.sender) ||
            (!file.isPrivate && !file.isDeleted),
            "Unauthorized access"
        );
        _;
    }

    constructor(){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
//Functions 
    //Upload a new file to the system
    function uploadFile(
        string memory ipfsHash,
        string memory fileName,
        bool isPrivate,
        uint256 fileSize,
        string memory fileType,
        string memory encryptionKey
    ) external whenNotPaused returns (uint256){
        require(bytes(ipfsHash).length > 0, "IFPS hash cannot be empty");
        require(bytes(fileName).length > 0, "File name cannot be empty");
        require(fileSize > 0,"File size must be greater than 0");

        fileCounter++;
        uint256 fileId = fileCounter;
        files[fileId] = FileInfo({
            id: fileId,
            ipfsHash: ipfsHash,
            fileName: fileName,
            owner: msg.sender,
            uploadTime: block.timestamp,
            isPrivate: isPrivate,
            isDeleted: false,
            fileSize: fileSize,
            fileType: fileType,
            encryptionKey: encryptionKey
        });
        userFiles[msg.sender].push(fileId);
        totalStorageUsed += fileSize;

        _logAccess(fileId, msg.sender, "upload");
        emit FileUploaded(fileId, msg.sender, ipfsHash, fileName, isPrivate);
        return fileId;
    }
    //Gets file information
    function getFile(uint256 fileId) external view fileExists(fileId) onlyAuthorizedAccess(fileId) returns (FileInfo memory){
        return files[fileId];
    }
    //Share a file with another user
    function shareFile(uint256 fileId,address recipient) external fileExists(fileId) onlyFileOwner(fileId){
        require(recipient != address(0),"Invalid recipient");
        require(recipient != msg.sender,"Cannot share with self");
        require(!isSharedWith(fileId, recipient),"File already shared with recipient");

        fileSharedWith[fileId].push(recipient);
        sharedWithUser[recipient].push(fileId);

        _logAccess(fileId, msg.sender, "share");
        emit FileShared(fileId, msg.sender, recipient);
    }
    //Delete a file (mark as deleted)
    function deleteFile(uint256 fileId) external fileExists(fileId) onlyFileOwner(fileId){
        files[fileId].isDeleted = true;
        totalStorageUsed -= files[fileId].fileSize;
        _logAccess(fileId, msg.sender, "delete");
        emit FileDeleted(fileId, msg.sender);
    }
    //Get all files owned by the user
    function getUserFiles(address user) external view returns (uint256[] memory){
        return userFiles[user];
    }
    //Get all files shared with the user
    function getSharedFiles(address user) external view returns (uint256[] memory){
        return sharedWithUser[user];
    }
    //Law Enforcement: Get all files in the system
    function getAllFiles() external view onlyRole(LAW_ENFORCEMENT_ROLE) returns (FileInfo[] memory){
        FileInfo[] memory allFiles = new FileInfo[](fileCounter);
        for (uint256 i = 1; i <= fileCounter; i++) {
            allFiles[i - 1] = files[i];
        }
        return allFiles;
    }
    //Law enforcement: Get access logs for a file
    function getFileAccessLogs(uint256 fileId) external view onlyRole(LAW_ENFORCEMENT_ROLE) returns (AccessLog[] memory){
        return accessLogs[fileId];
    }
    //Law Enforcement: Get system statistics 
    function getSystemStats() external view onlyRole(LAW_ENFORCEMENT_ROLE) returns (uint256 totalFiles, uint256 totalStorage, uint256 activeFiles){
        uint256 activeCount = 0;
        for (uint256 i=1; i<=fileCounter ;i++){
            if (!files[i].isDeleted){
                activeCount++;
            }
        }
        return(fileCounter,totalStorageUsed,activeCount);
    }

    //Admin Functions
    function grantLawEnforcementRole(address account) external onlyRole(ADMIN_ROLE){
        _grantRole(LAW_ENFORCEMENT_ROLE,account);
    }
    function revokeLawEnforcementRole(address account) external onlyRole(ADMIN_ROLE){
        _revokeRole(LAW_ENFORCEMENT_ROLE,account);
    }
    function pause() external onlyRole(ADMIN_ROLE){
        _pause();
    }
    function unpause() external onlyRole(ADMIN_ROLE){
        _unpause();
    }

    //Internal helper functions
    function isSharedWith(uint256 fileId, address user) public view returns (bool){
        address[] memory shared = fileSharedWith[fileId];
        for (uint256 i = 0; i < shared.length; i++) {
            if (shared[i] == user) {
                return true;
            }
        }
        return false;
    }
    function _logAccess(uint256 fileId, address accessor, string memory action) internal {
        accessLogs[fileId].push(AccessLog({
            accessor: accessor,
            timestamp: block.timestamp,
            action: action,
            fileId: fileId
        }));
        emit FileAccessed(fileId, accessor, action);
        if (hasRole(LAW_ENFORCEMENT_ROLE, accessor)) {
            emit LawEnforcementAccess(fileId, accessor, action);
        }
    }

    //Emergency functions
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    function getPublicFiles() external view returns (FileInfo[] memory){
        uint256 publicCount = 0;
        for (uint256 i = 1; i<= fileCounter;i++){
            if (!files[i].isPrivate && !files[i].isDeleted){
                publicCount++;
            }
        }
        FileInfo[] memory publicFiles = new FileInfo[](publicCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= fileCounter; i++) {
            if (!files[i].isPrivate && !files[i].isDeleted) {
                publicFiles[index] = files[i];
                index++;
            }
        }
        return publicFiles;
    }


}