import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';


export const getRegistryContractInstance = (web3) => {
    return new web3.eth.Contract(
        TeSCRegistry.abi,
        process.env.REACT_APP_REGISTRY_ADDRESS,
    );
};

export const addRemoveEntry = async (isAdding, { web3, domain, contractAddress, cb }) => {
    const registryContract = getRegistryContractInstance(web3);
    const isContractRegistered = await registryContract.methods.isContractRegistered(contractAddress).call();
    if (isAdding && isContractRegistered) throw new Error(`The address ${contractAddress} has already been added to the registry`);
    if (!isAdding && !isContractRegistered) throw new Error(`TLS-endorsed Smart Contract at address ${contractAddress} was not found in the registry`);

    const account = web3.utils.toChecksumAddress(web3.currentProvider.selectedAddress);
    if (domain && contractAddress) {
        const tx = isAdding ? registryContract.methods.add(contractAddress) : registryContract.methods.remove(domain, contractAddress);
        await tx.send({ from: account, gas: '2000000' })
            .on('receipt', async (txReceipt) => {
                const actionPhrase = isAdding ? 'added to' : 'removed from'
                cb({
                    header: `Entry ${actionPhrase} the registry`,
                    msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully ${actionPhrase} the registry.
                            You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                });
            });
    } else {
        if (!contractAddress) throw new Error(`Contract address not provided`);
        if (!domain) throw new Error(`Domain not provided`);
    }
};
