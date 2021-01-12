import React, { useContext, useState, useEffect } from 'react'
import { Table, Icon } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import ERCXXX from '../ethereum/build/contracts/ERCXXX.json';
import moment from 'moment'
import SearchBox from '../components/SearchBox';
import LinkTescInspect from '../components/InternalLink';
import PageHeader from '../components/PageHeader';


function RegistryInspect() {
    const { web3 } = useContext(AppContext);
    const [contractRegistry, setContractRegistry] = useState(undefined);
    const [domain, setDomain] = useState('')
    const [entries, setEntries] = useState([])
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        const init = async () => {
            try {
                const contractRegistry = new web3.eth.Contract(
                    TeSCRegistry.abi,
                    process.env.REACT_APP_REGISTRY_ADDRESS,
                );
                setContractRegistry(contractRegistry);
            }
            catch (error) {
                console.error(error);
            }
        }
        init()
    }, [web3.eth.Contract, web3.eth.net])

    const handleInput = domain => {
        setSubmitted(false);
        setDomain(domain);
    }

    const handleSubmit = async () => {
        const contractAddresses = await contractRegistry.methods.getContractsFromDomain(domain).call();
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
        setEntries(contractInstances);
        setSubmitted(true)
    }

    const renderTable = () => {
        if (entries.length > 0 && submitted) {
            return (
                <Table color='purple'>
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
                                    <Table.Cell><LinkTescInspect contractAddress={contractInstance.address} /></Table.Cell>
                                    <Table.Cell>{moment.unix(parseInt(contractInstance.expiry)).format('DD/MM/YYYY')}</Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <Icon name="check" color="green" circular />
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
            <PageHeader title='Explore TeSC Registry' />
            {/* Smart Contracts associated with Domain */}
            <SearchBox
                onChange={handleInput}
                onSubmit={handleSubmit}
                value={domain}
                placeholder='www.mysite.com'
                label='Domain'
                icon='search'
                validInput={true} />
            {renderTable()}
        </div>
    )
}

export default RegistryInspect
