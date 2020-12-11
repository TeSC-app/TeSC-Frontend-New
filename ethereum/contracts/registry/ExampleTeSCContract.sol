/** SPDX-License-Identifier: MIT */
//USED FOR TESTING PURPOSES
pragma solidity ^0.7.4;

contract ExampleTeSCContract {
    address public owner;
    string private domain;
    string private signature;
    bytes16 private flags;
    uint64 private expiry;
    bytes4 private interfaceId;

    // @dev This emits when the domain of the Smart Contract changes by any mechanism
    event DomainChanged(string indexed domain);

    // @dev This emits when the signature of the Smart Contract changes
    // Signature signed the Smart Contract address
    event SignatureChanged(string signature);

    modifier isOwner() {
        require(
            msg.sender == owner,
            "Sender not authorized."
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        domain = "customdomain.com";
        signature = "customsignatureBEGINEND";
        flags = 0x00000000000000000000000000000001;
        expiry = uint64(block.timestamp) + 31536000;
        interfaceId = 0x1141f2a9;
    }

    function getInterfaceId() external view returns (bytes4) {
        return interfaceId;
    }

    function getDomain() external view returns (string memory) {
        return domain;
    }

    function getExpiry() external view returns (uint64) {
        return expiry;
    }

    function getSignature() external view returns (string memory) {
        return signature;
    }

    function getFlags() external view returns (bytes16) {
        return flags;
    }

    function setDomain(string calldata _domain) external isOwner {
        domain = _domain;
        emit DomainChanged(_domain);
    }

    function setSignature(string calldata _signature) external isOwner {
        signature = _signature;
        emit SignatureChanged(_signature);
    }

    function setExpiry(uint64 _expiry) external isOwner {
        expiry = _expiry;
    }

    function setFlags(bytes4 _flags) external isOwner {
        flags = _flags;
    }

    function setInterfaceId(bytes4 _interfaceId) external isOwner {
        interfaceId = _interfaceId;
    }

    //this is a pure function according to the ERC-165 but for testing purposes here we read the state which is initially the same as the value in the first check
    function supportsInterface(bytes4 interfaceID) external view returns (bool) {
        return interfaceID == interfaceId;
    }
}