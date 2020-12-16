/** SPDX-License-Identifier: MIT */
pragma solidity ^0.7.4;

import "./TeSC.sol";

contract TeSCRegistry {

    // @notice Maps domain to contract address and address of the externally owned account that added the entry
    mapping(string => mapping(address => address)) private registries;

    // @notice Maps domain to addresses of all contracts that are linked to the domain 
    mapping(string => address[]) private registryStorage;

    // @notice Maps contract addresses included in the registry to true
    // @dev Can be called since it is public 
    mapping(address => bool) public contractAvailability;

    // @dev This emits after a new entry was added to the registry
    event Added(string domain, address contractAddr);

    // @dev This emits after an entry was removed from the registry
    event Removed(string domain, address contractAddr);
    
    // @notice Adds a new entry to the registry 
    // @dev Deploy endorsed contract and set its values before adding it to the registry
    // @param _domain The domain that the endorsed contract is linked to (or the hash of this domain)
    // @param _contractAddr The address of the endorsed contract
    function add(string calldata _domain, address _contractAddr) external {
        require(TeSC(_contractAddr).supportsInterface(0xd7de9043));
        require(keccak256(abi.encode(TeSC(_contractAddr).getDomain())) == keccak256(abi.encode(_domain)));
        require(TeSC(_contractAddr).getExpiry() > block.timestamp);
        require(contractAvailability[_contractAddr] == false);
        
        registries[_domain][_contractAddr] = msg.sender;
        registryStorage[_domain].push(_contractAddr);
        contractAvailability[_contractAddr] = true; 

        emit Added(_domain, _contractAddr);
    }
    
    // @notice Removes an entry from the registry
    // @dev The transaction must be sent from the externally owned account that added the entry
    // @param _domain The domain that the endorsed contract was linked to when the entry was added (or the hash of this domain)
    // @param _contractAddr The address of the endorsed contract
    function remove(string calldata _domain, address _contractAddr) external {
        require(registries[_domain][_contractAddr] != address(0));
        require(registries[_domain][_contractAddr] == msg.sender);
        
        address[] storage arr = registryStorage[_domain];
        for (uint i=0; i < arr.length; i++) {
            if (arr[i] == _contractAddr) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
        registries[_domain][_contractAddr] = address(0);
        contractAvailability[_contractAddr] = false; 
        emit Removed(_domain, _contractAddr);
    }
    
    // @notice Returns the addresses of all contracts that are stored for the given domain
    // @dev The parameter must be equal to the domain (or hash) that was given when the entries were added 
    // @param _domain The domain (or hash of a domain) for which the contract addresses will be returned
    // @return An array of all contract addresses stored for the given domain (or hash)
    function getAllTeSCFromDomain(string calldata _domain) external view returns (address[] memory) {
        return registryStorage[_domain];
    }
}