pragma solidity ^0.7.0;

import "./ERCXXX.sol";

contract ERCXXXImplementation is ERCXXX {
    address public owner;
    string private domain;
    uint64 private expiry;
    bytes24 private flags;
    
    /* 
        Claim C = {addr|domain|expiry|flags}
        Signature S = {sign(hash(C), privateKey)}
    */
    bytes32 private fingerprint;
    string private signature;

    address[] private subendorsements;

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

    /*
        Internal Functions
    */

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

    /*
        Getter-Functions
    */

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

    /*
        Setter-Functions
    */

    // @notice Allows to set the fully-qualified domain name (FQDN)
    // @dev Check if sender is allowed to change information
    // @param _domain The fully-qualified domain name (e.g. "in.tum.de")
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate. Can be an empty string if signature should not be updated.
    function setDomain(string calldata _domain, string calldata _signature) external isOwner {
        if (keccak256(bytes(domain)) != keccak256(bytes(_domain))) setDomainInternal(_domain);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    // @notice Sets the expiry unix timestamp in seconds since the epoch
    // @dev Check if sender is allowed to change information
    // @param _expiry the unix epoch timestamp when the contract signature expires. Default if unset is 1 year
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate. Can be an empty string if signature should not be updated.
    function setExpiry(uint64 _expiry, string calldata _signature) external isOwner {
        if (expiry != _expiry) setExpiryInternal(_expiry);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    // @notice Sets the flags as bytes24
    // @dev The Flags are set in this order: DOMAIN_HASHED, ALLOW_SUBENDORSEMENT, EXCLUSIVE, TRUST_AFTER_EXPIRY
    // @param _flags The flags of the Smart Contract in bytes24 in the order as described in @dev
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate. Can be an empty string if signature should not be updated.
    function setFlags(bytes24 _flags, string calldata _signature) external isOwner {
        if (flags != _flags) setFlagsInternal(_flags);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    // @notice Sets the certificate-fingerprint of the endorsement
    function setFingerprint(bytes32 _fingerprint, string calldata _signature) external isOwner {
        if (fingerprint != _fingerprint) setFingerprintInternal(_fingerprint);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }
    
    // @notice Sets the signature (which signs the claim {addr|domain|expiry|flags})
    // @dev Check if sender is allowed to change information
    // @param _signature The signature of the claim {addr|domain|expiry|flags}
    function setSignature(string calldata _signature) external isOwner {
        setSignatureInternal(_signature);
    }
        
    // @notice Sets all endorsement attributes, i.e., claim information domain, expiry and flags as well as signature
    // @dev Check if sender is allowed to change information
    // @param _domain The fully-qualified domain name (e.g. "in.tum.de")
    // @param _expiry the unix epoch timestamp when the contract signature expires. Default if unset is 1 year
    // @param _flags The flags of the Smart Contract in bytes24 in the order as described in @dev
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate
    function setEndorsement(string calldata _domain, uint64 _expiry, bytes24 _flags, bytes32 _fingerprint, string calldata _signature) external isOwner {
        if (keccak256(bytes(domain)) != keccak256(bytes(_domain))) setDomainInternal(_domain);
        if (expiry != _expiry) setExpiryInternal(_expiry);
        if (flags != _flags) setFlagsInternal(_flags);
        if (fingerprint != _fingerprint) setFingerprintInternal(_fingerprint);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }

    /*
        Subendorsements
    */
    
    function getSubendorsements() external override view returns (address[] memory) {
        return subendorsements;
    }
    
    // @notice Adds an address to the array of subendorsements
    // @param subendorsementAddress The address to be added from the subendorsements
    function addSubendorsement(address subendorsementAddress) external isOwner {
        subendorsements.push(subendorsementAddress);
        emit SubendorsementsChanged(subendorsementAddress, EventType.Add);
    }
    
    // @notice Removes an address at a specific index from the array of subendorsements
    // @param index of address which should be removed
    function removeSubendorsementAtIndex(uint index) external isOwner {
        require(index < subendorsements.length, "Invalid Index");
        address addr = subendorsements[index];
        subendorsements[index] = subendorsements[subendorsements.length-1];
        subendorsements.pop();
        emit SubendorsementsChanged(addr, EventType.Remove);
    }
    
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return interfaceID == 0xd7de9043;
    }
    
}
