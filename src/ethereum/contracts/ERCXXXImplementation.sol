interface ERCXXX /* is ERC165 */ {
    
    // @dev This emits when the Domain of the endorsement changes by any mechanism
    event DomainChanged(string domain);
    
    // @dev This emits when the Expriy Date of the endorsement changes by any mechanism
    event ExpiryChanged(uint64 expiry);
    
    // @dev This emits when the Flags of the endorsement changes by any mechanism
    event FlagsChanged(bytes24 flags);
    
    // @dev This emits when the Signature of the endorsement changes
    // Signature signed the claim {addr|domain|expiry|flags}
    event SignatureChanged(string signature);
    
    // @notice Returns the domain for the given Smart Contract
    // @dev The domain is a fully-qualified domain name (e.g. "in.tum.de")
    // @return The domain of the contract
    function getDomain() external view returns (string memory);

    // @notice Returns the signature for the given Smart Contract
    // @dev The signature contains the claim {addr|domain|expiry|flags} and is signed with the private key from the certificate
    // @return The signature of the contract
    function getSignature() external view returns (string memory);

    // @notice Returns the expiry of the endorsement
    // @dev The timestamp is given in seconds since the epoch
    // @return The expiry of the contract
    function getExpiry() external view returns (uint64);

    // @notice Returns the flags as bytes24
    // @dev The Flags are set in this order: DOMAIN_HASHED, ALLOW_SUBENDORSEMENT, EXCLUSIVE, TRUST_AFTER_EXPIRY
    // @return The flags of the contract in the order as described in @dev
    function getFlags() external view returns (bytes24);

    // @notice Allows to set the fully-qualified domain name (FQDN)
    // @dev Check if sender is allowed to change information
    // @param _domain The fully-qualified domain name (e.g. "in.tum.de")
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate. Can be an empty string if signature should not be updated.
    function setDomain(string calldata _domain, string calldata _signature) external;

    // @notice Sets the expiry unix timestamp in seconds since the epoch
    // @dev Check if sender is allowed to change information
    // @param _expiry the unix epoch timestamp when the contract signature expires. Default if unset is 1 year
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate. Can be an empty string if signature should not be updated.
    function setExpiry(uint64 _expiry, string calldata _signature) external;

    // @notice Sets the flags as bytes24
    // @dev The Flags are set in this order: DOMAIN_HASHED, ALLOW_SUBENDORSEMENT, EXCLUSIVE, TRUST_AFTER_EXPIRY
    // @param _flags The flags of the Smart Contract in bytes24 in the order as described in @dev
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate. Can be an empty string if signature should not be updated.
    function setFlags(bytes24 _flags, string calldata _signature) external;
    
    // @notice Sets the signature (which signs the claim {addr|domain|expiry|flags})
    // @dev Check if sender is allowed to change information
    // @param _signature The signature of the claim {addr|domain|expiry|flags}
    function setSignature(string calldata _signature) external;
    
    // @notice Sets all endorsement attributes, i.e., claim information domain, expiry and flags as well as signature
    // @dev Check if sender is allowed to change information
    // @param _domain The fully-qualified domain name (e.g. "in.tum.de")
    // @param _expiry the unix epoch timestamp when the contract signature expires. Default if unset is 1 year
    // @param _flags The flags of the Smart Contract in bytes24 in the order as described in @dev
    // @param _signature The signature of the Smart Contract address, public key from current SSL certificate
    function setEndorsement(string calldata _domain, uint64 _expiry, bytes4 _flags, string calldata _signature) external;

}

interface ERC165 {
    /// @notice Query if a contract implements an interface
    /// @param interfaceID The interface identifier, as specified in ERC-165
    /// @dev Interface identification is specified in ERC-165. This function
    ///  uses less than 30,000 gas.
    /// @return `true` if the contract implements `interfaceID` and
    ///  `interfaceID` is not 0xffffffff, `false` otherwise
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
}


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

    constructor (string memory _domain, uint64 _expiry, bytes24 _flags, string memory _signature) {
        owner = msg.sender;

        setExpiryInternal(_expiry);
        setDomainInternal(_domain);
        setFlagsInternal(_flags);
        setSignatureInternal(_signature);
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
    
    function setSignature(string calldata _signature) external override isOwner {
        setSignatureInternal(_signature);
    }
    
    function setEndorsement(string calldata _domain, uint64 _expiry, bytes4 _flags, string calldata _signature) external override isOwner {
        if (keccak256(bytes(domain)) != keccak256(bytes(_domain))) setDomainInternal(_domain);
        if (expiry != _expiry) setExpiryInternal(_expiry);
        if (flags != _flags) setFlagsInternal(_flags);
        if (bytes(_signature).length > 0) setSignatureInternal(_signature);
    }
}