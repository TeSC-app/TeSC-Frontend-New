/** SPDX-License-Identifier: MIT */
pragma solidity ^0.7.4;

interface TeSC {
    function getDomain() external view returns (string memory);
    function getExpiry() external returns (uint64);
    function getFlags() external returns (bytes16);
    function getSignature() external view returns (string memory);
    function setDomain(string calldata _domain) external; 
    function setExpiry(uint64 _expires) external;
    function setFlags(bytes4 _flags) external;
    function setSignature(string calldata _signature) external;
    function supportsInterface(bytes4 interfaceID) external pure returns (bool);
    event DomainChanged(string indexed domain);
    event SignatureChanged(string signature);
}

contract Selector {
  function calcTeSCInterfaceId() external pure returns (bytes4) {
    TeSC i;
    return i.getDomain.selector ^ i.getExpiry.selector ^ i.getFlags.selector ^ i.getSignature.selector
        ^ i.setDomain.selector ^ i.setExpiry.selector ^ i.setFlags.selector ^ i.setSignature.selector;
  }
}