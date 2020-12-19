import React, { useContext, useState, useEffect } from 'react'
import { Table } from 'semantic-ui-react';
import Search from '../components/Search';
import AppContext from '../appContext';
import isValidDomain from 'is-valid-domain';
import keccak256 from 'keccak256';
import TeSCRegistryImplementation from "../ethereum/build/contracts/TeSCRegistryImplementation.json";

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
                console.log(networkId)
                const deployedNetworkRegistry = TeSCRegistryImplementation.networks[networkId];
                console.log(deployedNetworkRegistry && deployedNetworkRegistry.address)
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
        isValidDomain(event.target.value) ? setSearchDisabled(false) : setSearchDisabled(true);
    }

    const handleSubmit = async () => {
        const submittedHash = `0x${keccak256(domain).toString('hex')}`
        console.log(`You've submitted ${submittedHash}`)
        const response = await contractRegistry.methods.getContractsFromDomain(submittedHash).call();
        console.log(response[0])
        // Update state with the result.
        setEntries(response);
        setSubmitted(true)
    }

    const renderTable = () => {
        if (entries.length > 0 && submitted) {
            return (
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Address</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {renderRows()}
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

    const renderRows = () => {
        if (entries.length > 1) {
            entries.map((contractAddress) => (
                <Table.Row key={contractAddress}>
                    <Table.Cell>{contractAddress}</Table.Cell>
                </Table.Row>
            ));
        } else if (entries.length === 1) {
            return (<Table.Row key={entries[0]}>
                <Table.Cell>{entries[0]}</Table.Cell>
            </Table.Row>
            )
        }
    }

    return (
        <div>
            <h2>Explore Smart Contracts associated to a domain</h2>
            <Search handleInput={handleInput} handleSubmit={handleSubmit} domain={domain} searchDisabled={searchDisabled} />
            {renderTable()}
        </div>
    )
}

export default Registry
