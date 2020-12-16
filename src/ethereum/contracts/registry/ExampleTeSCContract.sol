/** SPDX-License-Identifier: MIT */
//USED FOR TESTING PURPOSES
pragma solidity ^0.7.4;

contract ExampleTeSCContract {
    address public owner;
    string private domain;
    uint64 private expiry;
    bytes24 private flags;

    // Claim C = {addr|domain|expiry|flags}
    // Signature S = {sign(hash(C), privateKey)}
    string private signature;
    bytes4 private interfaceId;

     // @dev This emits when the Domain of the endorsement changes by any mechanism
    event DomainChanged(string domain);
    
    // @dev This emits when the Expriy Date of the endorsement changes by any mechanism
    event ExpiryChanged(uint64 expiry);
    
    // @dev This emits when the Flags of the endorsement changes by any mechanism
    event FlagsChanged(bytes24 flags);
    
    // @dev This emits when the Signature of the endorsement changes
    // Signature signed the claim {addr|domain|expiry|flags}
    event SignatureChanged(string signature);

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
        interfaceId = 0xd7de9043;
    }

    function setDomainInternal(string memory _domain) internal {
        if (keccak256(bytes(domain)) == keccak256(bytes(_domain))) return;
        domain = _domain;
        emit DomainChanged(_domain);
    }

    function setSignatureInternal(string memory _signature) internal {
        if (bytes(_signature).length > 0) return;
        signature = _signature;
        emit SignatureChanged(_signature);
    }

    function setExpiryInternal(uint64 _expiry) internal {
        if (expiry == _expiry) return;
        expiry = _expiry;
        emit ExpiryChanged(_expiry);
    }

    function setFlagsInternal(bytes24 _flags) internal {
        if (flags == _flags) return;
        flags = _flags;
        emit FlagsChanged(_flags);
    }

    function getDomain() external view returns (string memory) {
        return domain;
    }

    function getSignature() external view returns (string memory) {
        return signature;
    }

    function getExpiry() external view returns (uint64) {
        return expiry;
    }

    function getFlags() external view returns (bytes24) {
        return flags;
    }

    function setInterfaceId(bytes4 _interfaceId) external isOwner {
        interfaceId = _interfaceId;
    }

    function setDomain(string calldata _domain, string calldata _signature) external isOwner {
        setDomainInternal(_domain);
        setSignatureInternal(_signature);
    }

    function setExpiry(uint64 _expiry, string calldata _signature) external isOwner {
        setExpiryInternal(_expiry);
        setSignatureInternal(_signature);
    }

    function setFlags(bytes24 _flags, string calldata _signature) external isOwner {
        setFlagsInternal(_flags);
        setSignatureInternal(_signature);
    }
    
    function setSignature(string calldata _signature) external isOwner {
        setSignatureInternal(_signature);
    }
    
    function setEndorsement(string calldata _domain, uint64 _expiry, bytes4 _flags, string calldata _signature) external isOwner {
        setDomainInternal(_domain);
        setExpiryInternal(_expiry);
        setFlagsInternal(_flags);
        setSignatureInternal(_signature);
    }

    //this is a pure function according to the ERC-165 but for testing purposes here we read the state which is initially the same as the value in the first check
    function supportsInterface(bytes4 interfaceID) external view returns (bool) {
        return interfaceID == interfaceId;
    }
}