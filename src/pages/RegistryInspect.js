import React, { useContext, useState, useEffect } from 'react'
import { Table, Segment, Dimmer, Image, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import ERCXXX from '../ethereum/build/contracts/ERCXXX.json';
import moment from 'moment'
import SearchBox from '../components/SearchBox';
import LinkTescInspect from '../components/InternalLink';
import PageHeader from '../components/PageHeader';
import TableGeneral from '../components/TableGeneral';
import TableCellVerification from '../components/TableCellVerification';

function RegistryInspect() {
    const { web3 } = useContext(AppContext);
    const [contractRegistry, setContractRegistry] = useState(undefined);
    const [domain, setDomain] = useState('')
    const [allEntries, setAllEntries] = useState([])
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [totalPages, setTotalPages] = useState(0) 
    const [displayedEntries, setDisplayedEntries] = useState([])

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
        setLoading(false)
        setDomain(domain);
    }

    const handleSubmit = async () => {
        setLoading(true)
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
        setTotalPages(Math.ceil(contractInstances.length/7))
        setAllEntries(contractInstances);
        setDisplayedEntries(contractInstances.slice(0,7))
        setSubmitted(true)
        setLoading(false)
    }

    const renderRows = () => {
        return displayedEntries.map((contractInstance) => (
            <Table.Row key={contractInstance.address}>
                <Table.Cell><LinkTescInspect contractAddress={contractInstance.address} /></Table.Cell>
                <Table.Cell>{domain}</Table.Cell>
                <Table.Cell>{moment.unix(parseInt(contractInstance.expiry)).format('DD/MM/YYYY')}</Table.Cell>
                <TableCellVerification domain={domain} contractAddress={contractInstance.address} />
            </Table.Row>
        ))
    }

    const changePage = (event, value) => {
        setDisplayedEntries(allEntries.slice((value - 1) * 7, value * 7))
    }

    const tableProps = { renderRows, changePage, totalPages }

    const renderTable = () => {
        if (allEntries.length > 0 && submitted && !loading) {
            return (
                <div style={{justifyContent: 'center'}}>
                    <TableGeneral {...tableProps} />
                </div>
            )
        } else if (allEntries.length === 0 && submitted && !loading) {
            return (
                <div className="ui placeholder segment">
                    <div className="ui icon header">
                        <i className="search icon"></i>
                  We could not find a Smart Contract associated to this domain in the registry. Look for a different domain.
                </div>
                </div>
            )
        } else if (loading) {
            return (
                <Segment>
                    <Dimmer active={loading} inverted>
                        <Loader size='large'>Loading results</Loader>
                    </Dimmer>
                    <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
                </Segment>
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
