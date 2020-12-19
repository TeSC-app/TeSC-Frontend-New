/** SPDX-License-Identifier: MIT */
pragma solidity ^0.7.4;

import "./TeSC.sol";

contract Selector {
  function calcTeSCInterfaceId() external pure returns (bytes4) {
    TeSC i;
    return i.getDomain.selector ^ i.getExpiry.selector ^ i.getFlags.selector ^ i.getSignature.selector
        ^ i.setDomain.selector ^ i.setExpiry.selector ^ i.setFlags.selector ^ i.setSignature.selector
        ^ i.setEndorsement.selector;
  }
}