pragma solidity ^0.7.0;

import "./ERCXXX.sol";

contract ERCXXXImplementation is ERCXXX {
    address public owner;
    string private domain;
    uint64 private expiry;
    bytes24 private flags;
    
    // Claim C = {addr|domain|expiry|flags}
    // Signature S = {sign(hash(C), privateKey)}
    bytes32 private fingerprint;
    string private signature;

    modifier isOwner() {
        require(
            msg.sender == owner,
            "Sender not authorized."
        );
        _;
    }

    constructor (string memory _domain, uint64 _expiry, bytes24 _flags, bytes32 _fingerprint, string memory _signature) {
        owner = msg.sender;

        setExpiryInternal(_expiry);
        setDomainInternal(_domain);
        setFlagsInternal(_flags);
        setSignatureInternal(_signature);
        setFingerprintInternal(_fingerprint);
    }

    function setDomainInternal(string memory _domain) internal {
        domain = _domain;
        emit DomainChanged(_domain);
    }

    function setSignatureInternal(string memory _signature) internal {
        signature = _signature;
        emit SignatureChanged(_signature);
    }

    function setExpiryInternal(uint64 _expiry) internal {
        expiry = _expiry;
        emit ExpiryChanged(_expiry);
    }

    function setFlagsInternal(bytes24 _flags) internal {
        flags = _flags;
        emit FlagsChanged(_flags);
    }
    
    function setFingerprintInternal(bytes32 _fingerprint) internal {
        fingerprint = _fingerprint;
        emit FingerprintChanged(_fingerprint);
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
    
    function getFingerprint() external override view returns (bytes32) {
        return fingerprint;
    }

    function setDomain(string calldata _domain, string calldata _signature) external override isOwner {
        if (keccak256(bytes(domain)) != keccak256(bytes(_domain))) setDomainInternal(_domain);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    function setExpiry(uint64 _expiry, string calldata _signature) external override isOwner {
        if (expiry != _expiry) setExpiryInternal(_expiry);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    function setFlags(bytes24 _flags, string calldata _signature) external override isOwner {
        if (flags != _flags) setFlagsInternal(_flags);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }
    
    function setFingerprint(bytes32 _fingerprint, string calldata _signature) external override isOwner {
        if (fingerprint != _fingerprint) setFingerprintInternal(_fingerprint);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }
    
    function setSignature(string calldata _signature) external override isOwner {
        setSignatureInternal(_signature);
    }
    
    function setEndorsement(string calldata _domain, uint64 _expiry, bytes24 _flags, bytes32 _fingerprint, string calldata _signature) external override isOwner {
        if (keccak256(bytes(domain)) != keccak256(bytes(_domain))) setDomainInternal(_domain);
        if (expiry != _expiry) setExpiryInternal(_expiry);
        if (flags != _flags) setFlagsInternal(_flags);
        if (fingerprint != _fingerprint) setFingerprintInternal(_fingerprint);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }
}