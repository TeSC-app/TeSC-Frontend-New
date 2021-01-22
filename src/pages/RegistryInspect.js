import React, { useContext, useEffect, useState } from 'react'
import { Segment, Dimmer, Image, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import ERCXXX from '../ethereum/build/contracts/ERCXXX.json';
import SearchBox from '../components/SearchBox';
import PageHeader from '../components/PageHeader';
import TableOverview from '../components/TableOverview';
import axios from 'axios'

function RegistryInspect(props) {
    const { contractRegistry } = props
    const { web3 } = useContext(AppContext);
    const [domain, setDomain] = useState('')
    const [allEntries, setAllEntries] = useState([])
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [totalPages, setTotalPages] = useState(0)
    const [displayedEntries, setDisplayedEntries] = useState([])

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/registry`);
                //for each object key that is an array get the values associated to that key and out of these values build an array of objects
                const registryEntries = Object.keys(response.data['registryEntries'])
                    .map(domain => Object.values(response.data['registryEntries'][domain])
                        .map(({ contract }) => ({ contractAddress: contract.contractAddress, domain: contract.domain, expiry: contract.expiry })))
                    .flat()
                if(response.status === 200) {
                    setAllEntries(registryEntries)
                    setDisplayedEntries(registryEntries.slice(0, 7))
                } else {
                    setAllEntries([])
                    setDisplayedEntries([])
                }
                setLoading(false)
            } catch (error) {
                console.log(error);
            }
        })();
    }, [])

    const handleInput = domain => {
        setSubmitted(false);
        setLoading(false)
        setDomain(domain);
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
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
                contractInstances.push({ contractAddress: contractAddresses[i], domain, expiry })
            }
            setTotalPages(Math.ceil(contractInstances.length / 7))
            setAllEntries(contractInstances);
            setDisplayedEntries(contractInstances.slice(0, 7))
            setSubmitted(true)
            setLoading(false)
        } catch (err) {
            setLoading(false)
            setSubmitted(true)
        }

    }

    const changePage = (event, { activePage }) => {
        setDisplayedEntries(allEntries.slice((activePage - 1) * 7, activePage * 7))
    }

    const tableProps = { changePage, displayedEntries, totalPages }

    const renderTable = () => {
        if (allEntries.length > 0 && !loading) {
            return (
                <div style={{ justifyContent: 'center' }}>
                    <TableOverview {...tableProps} />
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
