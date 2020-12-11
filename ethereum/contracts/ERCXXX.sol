pragma solidity ^0.7.0;

interface ERCXXX /* is ERC165 */ {
    // @dev This emits when the domain of the Smart Contract changes by any mechanism
    event DomainChanged(string indexed domain);

    // @dev This emits when the signature of the Smart Contract changes
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