import React, { useContext, useState, useEffect } from 'react'
import { Table, Icon } from 'semantic-ui-react';
import SearchComponent from '../components/SearchComponent';
import AppContext from '../appContext';
import isValidDomain from 'is-valid-domain';
import keccak256 from 'keccak256';
import TeSCRegistryImplementation from '../ethereum/build/contracts/TeSCRegistryImplementation.json';
import ERCXXX from '../ethereum/build/contracts/ERCXXX.json';
import moment from 'moment'

function Registry() {
    const { web3 } = useContext(AppContext);
    const [contractRegistry, setContractRegistry] = useState(undefined);
    const [domain, setDomain] = useState('')
    const [searchDisabled, setSearchDisabled] = useState(true);
    const [entries, setEntries] = useState([])
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        const init = async () => {
            try {
                const networkId = await web3.eth.net.getId();
                const deployedNetworkRegistry = TeSCRegistryImplementation.networks[networkId];
                const instanceRegistry = new web3.eth.Contract(
                    TeSCRegistryImplementation.abi,
                    deployedNetworkRegistry && deployedNetworkRegistry.address,
                );
                setContractRegistry(instanceRegistry);
            }
            catch (error) {
                console.error(error);
            }
        }
        init()
    }, [web3.eth.Contract, web3.eth.net])

    const handleInput = event => {
        setSubmitted(false);
        setDomain(event.target.value);
        //check if domain is valid by using the library
        isValidDomain(event.target.value) ? setSearchDisabled(false) : setSearchDisabled(true);
    }

    const handleSubmit = async () => {
        const submittedHash = `0x${keccak256(domain).toString('hex')}`
        const contractAddresses = await contractRegistry.methods.getContractsFromDomain(submittedHash).call();
        const contractInstances = [];
        //generate contracts out of the ERCXXX interface using the contract addresses so that the getExpiry method can be used
        for (let i = 0; i < contractAddresses.length; i++) {
            const contractInstance = new web3.eth.Contract(
                ERCXXX.abi,
                contractAddresses[i],
            )
            const expiry = await contractInstance.methods.getExpiry().call()
            //push the result from the promise to an array of objects which takes the values we need (namely the address and the expiry of the contract's endorsement)
            contractInstances.push({ address: contractAddresses[i], expiry: expiry })
        }
        console.log(contractInstances)
        setEntries(contractInstances);
        setSubmitted(true)
    }

    const renderTable = () => {
        if (entries.length > 0 && submitted) {
            return (
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Address</Table.HeaderCell>
                            <Table.HeaderCell>Expiry</Table.HeaderCell>
                            <Table.HeaderCell textAlign="center">Verified</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {
                            entries.map((contractInstance) => (
                                <Table.Row key={contractInstance.address}>
                                    <Table.Cell>{contractInstance.address}</Table.Cell>
                                    <Table.Cell>{moment.unix(parseInt(contractInstance.expiry)).format('DD/MM/YYYY')}</Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <Icon name="delete" color="red" circular />
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        }
                    </Table.Body>
                </Table>
            )
        } else if (entries.length === 0 && submitted) {
            return (
                <div className="ui placeholder segment">
                    <div className="ui icon header">
                        <i className="search icon"></i>
                  We could not find a Smart Contract associated to this domain in the registry. Look for a different domain.
                </div>
                </div>
            )
        }
    }

    return (
        <div>
            <h2>Explore Smart Contracts associated to a domain</h2>
            <SearchComponent handleInput={handleInput} handleSubmit={handleSubmit} domain={domain} searchDisabled={searchDisabled} />
            {renderTable()}
        </div>
    )
}

export default Registry
