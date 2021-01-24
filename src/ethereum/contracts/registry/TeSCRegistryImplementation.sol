/** SPDX-License-Identifier: MIT */
pragma solidity ^0.7.5;

import "./TeSC.sol";
import "./TeSCRegistry.sol";

contract TeSCRegistryImplementation is TeSCRegistry {
    // @notice Maps domain hash and contract address to address of account that added the entry
    mapping(string => mapping(address => address)) private entryOwner;

    // @notice Maps domain hash to addresses of all contracts that are linked to the domain
    mapping(string => address[]) private domainToContracts;

    // @notice Maps contract addresses included in the registry to true
    mapping(address => bool) private registeredContracts;

    // @notice Maps contract addresses to their index in domainToContracts
    mapping(address => uint) private contractsToIndex;

    function add(address _contractAddr) external override {
        require(TeSC(_contractAddr).supportsInterface(0xd7de9043), "Contract not added to registry: does not support TeSC interface");
        bytes24 flags = TeSC(_contractAddr).getFlags();
        require(isFlagSet(flags, 0), "Contract not added to registry: sanity flag (at index 0) not set");
        require(TeSC(_contractAddr).getExpiry() > block.timestamp, "Contract not added to registry: endorsement is expired");
        require(registeredContracts[_contractAddr] == false, "Contract not added to registry: already contained in registry");

        string memory domain = TeSC(_contractAddr).getDomain();
        entryOwner[domain][_contractAddr] = msg.sender;
        address[] storage arr = domainToContracts[domain];
        uint indexOfNewContract = arr.length;
        arr.push(_contractAddr);
        contractsToIndex[_contractAddr] = indexOfNewContract;
        registeredContracts[_contractAddr] = true;

        emit RegistryChanged(domain, _contractAddr, EventType.Add);
    }

    function remove(string calldata _domain, address _contractAddr) external override {
        require(registeredContracts[_contractAddr] == true, "Contract not removed from registry: not contained in registry");
        require(entryOwner[_domain][_contractAddr] == msg.sender, "Contract not removed from registry: only sender that added the contract can remove it");

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

    function getContractsFromDomain(string calldata _domain) external override view returns (address[] memory) {
        return domainToContracts[_domain];
    }

    function isContractRegistered(address _contractAddr) external override view returns (bool) {
        return registeredContracts[_contractAddr];
    }

    function isFlagSet(bytes24 b, uint pos) internal pure returns (bool) {
        bytes24 one = 0x000000000000000000000000000000000000000000000001;
        return ((b >> pos) & one) != 0;
    }
}
