/** SPDX-License-Identifier: MIT */
pragma solidity ^0.7.5;

import "./TeSC.sol";
import "./TeSCRegistry.sol";

contract TeSCRegistryImplementation is TeSCRegistry {
    // @notice Maps domain hash and contract address to address of account that added the entry
    mapping(bytes32 => mapping(address => address)) private entryOwner;

    // @notice Maps domain hash to addresses of all contracts that are linked to the domain
    mapping(bytes32 => address[]) private domainToContracts;

    // @notice Maps contract addresses included in the registry to true
    mapping(address => bool) private registeredContracts;

    // @notice Maps contract addresses to their index in domainToContracts
    mapping(address => uint) private contractsToIndex;

    function add(bytes32 _domain, address _contractAddr) external override {
        require(TeSC(_contractAddr).supportsInterface(0xd7de9043));
        require(keccak256(abi.encodePacked(TeSC(_contractAddr).getDomain())) == _domain);
        require(TeSC(_contractAddr).getExpiry() > block.timestamp);
        require(registeredContracts[_contractAddr] == false);

        entryOwner[_domain][_contractAddr] = msg.sender;
        address[] storage arr = domainToContracts[_domain];
        uint indexOfNewContract = arr.length;
        arr.push(_contractAddr);
        contractsToIndex[_contractAddr] = indexOfNewContract;
        registeredContracts[_contractAddr] = true;

        emit RegistryChanged(_domain, _contractAddr, EventType.Add);
    }

    function remove(bytes32 _domain, address _contractAddr) external override {
        require(entryOwner[_domain][_contractAddr] == msg.sender);

        address[] storage arr = domainToContracts[_domain];
        address replacement = arr[arr.length - 1];
        uint index = contractsToIndex[_contractAddr];
        contractsToIndex[arr[index]] = 0;
        contractsToIndex[replacement] = index;
        arr[index] = replacement;
        arr.pop();

        entryOwner[_domain][_contractAddr] = address(0);
        registeredContracts[_contractAddr] = false;
        emit RegistryChanged(_domain, _contractAddr, EventType.Remove);
    }

    function getContractsFromDomain(bytes32 _domain) external override view returns (address[] memory) {
        return domainToContracts[_domain];
    }

    function isContractRegistered(address _contractAddr) external override view returns (bool) {
        return registeredContracts[_contractAddr];
    }
}
