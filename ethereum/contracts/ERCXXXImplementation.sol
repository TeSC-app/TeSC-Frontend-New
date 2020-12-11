pragma solidity ^0.7.0;

import "./ERCXXX.sol";

contract ERCXXXImplementation is ERCXXX {
    address public owner;
    string private domain;
    uint64 private expiry;
    bytes24 private flags;

    // Claim C = {addr|domain|expiry|flags}
    // Signature S = {sign(hash(C), privateKey)}
    string private signature;

    modifier isOwner() {
        require(
            msg.sender == owner,
            "Sender not authorized."
        );
        _;
    }

    constructor (string memory _domain) {
        owner = msg.sender;
        setExpiryInternal();
        setDomainInternal(_domain);
        setFlagsInternal();
    }

    function setDomainInternal(string memory _domain) internal {
        domain = _domain;
        emit DomainChanged(_domain);
    }

    function setSignatureInternal(string memory _signature) internal {
        signature = _signature;
        emit SignatureChanged(_signature);
    }

    function setExpiryInternal() internal {
        uint64 oneYear = 31536000;
        expiry = uint64(block.timestamp) + oneYear;
    }

    function setFlagsInternal() internal {
        flags = 0x00;
    }

    function getDomain() external override view returns (string memory) {
        return domain;
    }

    function getSignature() external override view returns (string memory) {
        return signature;
    }

    function getExpiry() external override view returns (uint64) {
        return expiry;
    }

    function getFlags() external override view returns (bytes24) {
        return flags;
    }

    function setDomain(string calldata _domain, string calldata _signature) external override isOwner {
        setDomainInternal(_domain);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    function setExpiry(uint64 _expiry, string calldata _signature) external override isOwner {
        expiry = _expiry;
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    function setFlags(bytes24 _flags, string calldata _signature) external override isOwner {
        flags = _flags;
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }
    
    function setSignature(string calldata _signature) external override isOwner {
        setSignatureInternal(_signature);
    }
    
    function setEndorsement(string calldata _domain, uint64 _expiry, bytes4 _flags, string calldata _signature) external override isOwner {
        setDomainInternal(_domain);
        expiry = _expiry;
        flags = _flags;
        setSignatureInternal(_signature);
    }
    
}