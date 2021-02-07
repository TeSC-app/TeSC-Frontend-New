pragma solidity ^0.7.0;

interface ERCXXX /* is ERC165 */ {

    /*
        Events
    */
    
    // @dev This emits when the Domain of the endorsement changes by any mechanism
    event DomainChanged(string domain);
    
    // @dev This emits when the Expriy Date of the endorsement changes by any mechanism
    event ExpiryChanged(uint64 expiry);
    
    // @dev This emits when the Flags of the endorsement changes by any mechanism
    event FlagsChanged(bytes24 flags);
    
    // @dev This emits when the Signature of the endorsement changes by any mechanism
    // Signature signed the claim {addr|domain|expiry|flags}
    event SignatureChanged(string signature);
    
    // @dev This emits when the certificate-fingerprint of the endorsement changes by any mechanism
    event FingerprintChanged(bytes32 fingerprint);

    // @dev This enum specifies whether an array-element was added or removed
    enum EventType {Add, Remove}
    
    // @dev This emits when an address was added or removed from the subendorsements
    event SubendorsementsChanged(address indexed contractAddr, EventType eventType);

    /*
        Getter-Functions
    */
    
    // @notice Returns the domain for the given Smart Contract
    // @dev The domain is a fully-qualified domain name (e.g. "in.tum.de")
    // @return The domain of the contract
    function getDomain() external view returns (string memory);

    // @notice Returns the expiry of the endorsement
    // @dev The timestamp is given in seconds since the epoch
    // @return The expiry of the contract
    function getExpiry() external view returns (uint64);

    // @notice Returns the flags as bytes24
    // @dev The Flags are set in this order: DOMAIN_HASHED, ALLOW_SUBENDORSEMENT, EXCLUSIVE, TRUST_AFTER_EXPIRY
    // @return The flags of the contract in the order as described in @dev
    function getFlags() external view returns (bytes24);

    // @notice Returns the signature for the given Smart Contract
    // @dev The signature contains the claim {addr|domain|expiry|flags} and is signed with the private key from the certificate
    // @return The signature of the contract
    function getSignature() external view returns (string memory);
    
    // @notice Returns the sha256-fingerprint of the certificate that was used to sign the claim
    // @return The certificate fingerprint of the contract
    function getFingerprint() external view returns (bytes32);

    // @notice Returns subendorsements
    // @return The array of subendorsed contract addresses
    function getSubendorsements() external view returns (address[] memory);
}