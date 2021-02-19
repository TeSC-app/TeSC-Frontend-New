import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Segment, Dimmer, Image, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import PageHeader from '../components/PageHeader';
import TableOverview, { COL } from '../components/TableOverview';
import { loadStorage } from '../utils/storage'
import axios from 'axios';
import moment from 'moment';
import { extractDomainAndTopLevelDomain, isSha3 } from '../utils/tesc'
import PieChart from '../components/analytics/PieChart';
import {
    countFlags,
    computeValidContracts,
    checkExpirationDates
} from '../utils/analytics'
import BarChart from '../components/analytics/BarChart';
import SearchBox from '../components/SearchBox';

function RegistryInspect() {
    const { account } = useContext(AppContext);
    const [entriesRaw, setEntriesRaw] = useState([])
    const [tescsWithOccurances, setTescsWithOccurances] = useState([])
    const [loading, setLoading] = useState(false)
    const [isExploringDomain, setIsExploringDomain] = useState(false)
    const [domainFilter, setDomainFilter] = useState('')
    const [entriesOriginal, setEntriesOriginal] = useState([])

    const handleDomainFilter = (domain) => {
        setDomainFilter(domain)
    }

    //add createdAt and isFavourite prop to objects retrieved from the backend - compares with localStorage values
    const updateCreatedAtAndFavouritesForRegistryInspectEntries = useCallback((newTesc) => {
        const tescsLocalStorage = loadStorage(account);
        let isIdentical = false;
        for (const tesc of tescsLocalStorage) {
            if (tesc.contractAddress === newTesc.contractAddress) {
                isIdentical = true;
                return { isFavourite: tesc.isFavourite, createdAt: tesc.createdAt };
            }
        }
        if (!isIdentical) return { isFavourite: false, createdAt: moment().unix() }
    }, [account])

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/registry`);
                //for each object key that is an array get the values associated to that key and out of these values build an array of objects
                const registryEntries = Object.keys(response.data['registryEntries'])
                    .map(domain => Object.values(response.data['registryEntries'][domain])
                        .map(({ contract, verified }) => ({ contractAddress: contract.contractAddress, domain: contract.domain, expiry: contract.expiry, createdAt: moment().unix(), verified: verified, flags: contract.flags })))
                    .flat()
                if (response.status === 200) {
                    const entriesRaw = registryEntries.map(entry => ({ ...entry, ...updateCreatedAtAndFavouritesForRegistryInspectEntries(entry) })).sort((entryA, entryB) => entryB.expiry - entryA.expiry)
                    const tescsWithOccurances = entriesRaw.map(entry => ({
                        domain: entry.domain, contractAddresses: entriesRaw.filter((entry_) => entry_.domain.includes(entry.domain)).map(({ contractAddress, verified }) => ({ contractAddress, verified })),
                        contractCount: entriesRaw.reduce((counter, entry_) =>
                            entry_.domain.includes(entry.domain) ? counter += 1 : counter, 0),
                        verifiedCount: entriesRaw.reduce((counter, entry_) =>
                            entry_.verified === true && entry_.domain.includes(entry.domain) ? counter += 1 : counter, 0)
                    }))
                    let distinctTescsWithOccurances = []
                    const map = new Map();
                    //array of contract addresses used for the smart contract images in the exploration page
                    for (const entry of tescsWithOccurances) {
                        if (!map.has(extractDomainAndTopLevelDomain(entry.domain))) {
                            map.set(extractDomainAndTopLevelDomain(entry.domain), true);    // set any value to Map
                            distinctTescsWithOccurances.push({
                                domain: extractDomainAndTopLevelDomain(entry.domain),
                                contractAddresses: entry.contractAddresses,
                                contractCount: entry.contractCount,
                                verifiedCount: entry.verifiedCount
                            });
                        }
                    }
                    //this is needed when we apply the filters in the registry 
                    //and our original rowData is changed because we need to change the analytics - used in clearFilters()
                    setEntriesOriginal(entriesRaw)
                    setEntriesRaw(entriesRaw)
                    setTescsWithOccurances(distinctTescsWithOccurances)
                } else {
                    setEntriesRaw([]);
                }
                setLoading(false);
            } catch (error) {
                console.log(error);
            }
        })();
    }, [updateCreatedAtAndFavouritesForRegistryInspectEntries]);

    const handleIsExploringDomain = (isExploringDomain) => {
        setIsExploringDomain(isExploringDomain);
    };

    //when we filter we update the row data and by doing so the analytics as well
    const updateRowData = (entries) => {
        setEntriesRaw(entries)
    }

    const renderTable = () => {
        if (entriesRaw && entriesRaw.length > 0 && !loading) {
            return (
                <div style={{ justifyContent: 'center' }}>
                    <TableOverview
                        rowData={entriesRaw}
                        tescsWithOccurances={tescsWithOccurances}
                        rowDataOriginal={entriesOriginal}
                        handleLoading={handleLoading}
                        handleIsExploringDomain={handleIsExploringDomain}
                        handleDomainFilter={handleDomainFilter}
                        updateRowData={updateRowData}
                        cols={isExploringDomain ? new Set([COL.ADDRESS, COL.DOMAIN, COL.EXPIRY, COL.VERIF]) : new Set([COL.DOMAIN, COL.TSC, COL.VERIF])}
                    />
                </div>
            );
        } else if (entriesRaw && entriesRaw.length === 0 && !loading) {
            return (
                <>
                <SearchBox
                            onChange={handleDomainFilter}
                            onSubmit={() => setEntriesRaw(entriesRaw.filter(entry => entry.domain.includes(domainFilter)).sort((tescA, tescB) => tescB.expiry - tescA.expiry))}
                            value={domainFilter}
                            placeholder='www.mysite.com'
                            label='Domain'
                            icon='search'
                            validInput={true}
                        />
                <div className="ui placeholder segment">
                    <div className="ui icon header">
                  We could not find a Smart Contract associated to this domain in the registry. Look for a different domain.
                </div>
                </div>
                </>
            );
        } else if (loading) {
            return (
                <Segment>
                    <Dimmer active={loading} inverted>
                        <Loader size='large'>Loading results</Loader>
                    </Dimmer>
                    <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
                </Segment>
            );
        }
    };

    const handleLoading = loading => {
        setLoading(loading);
    };

    const dataValidContracts = [{
        'id': 'Valid',
        'value': computeValidContracts(entriesRaw.filter(entry =>
            entry.domain.includes(domainFilter)), true)
    },
    {
        'id': 'Invalid',
        'value': computeValidContracts(entriesRaw.filter(entry =>
            entry.domain.includes(domainFilter)), false)
    }]

    const renderAnalytics = () => {
        return isExploringDomain &&
            <>
                {!isSha3(domainFilter) &&
                    <PieChart data={dataValidContracts}
                        loading={loading}
                        infoText={`Shows the number of valid and invalid smart contracts endorsed by ${domainFilter}`}
                        isExploringDomain={true} />
                }
                <PieChart data={countFlags(entriesRaw.filter(entry =>
                    entry.domain.includes(domainFilter)))}
                    isFlags={true}
                    loading={loading}
                    infoText={`Shows the number of the flags that are used in all smart contracts endorsed by ${domainFilter}`}
                    isExploringDomain={true} />
                <BarChart data={checkExpirationDates(entriesRaw.filter(entry =>
                    entry.domain.includes(domainFilter)))}
                    isExpiration={true}
                    loading={loading}
                    isExploringDomain={isExploringDomain}
                    infoText={`Shows a distribution of the expiry dates of all smart contracts endorsed by ${domainFilter}`}
                />
            </>
    }

    return (
        <div>
            <PageHeader title='Explore TeSC Registry' />
            {/* Smart Contracts associated with Domain */}
            {renderTable()}
            {isExploringDomain && entriesRaw.length > 0 && (<div style={{ backgroundColor: '#eff2f5' }}>
                <PageHeader isRegistryInspect={true} as='h2' title='Domain-specific Analytics' />
                <section style={{
                    display: 'grid',
                    gridTemplateColumns: isSha3(domainFilter) ? '1fr 1fr' : '1fr 1fr 1fr',
                    gridTemplateRows: 'auto auto',
                    gridGap: '10px',
                    height: '300px',
                    marginTop: '100px'
                }}>
                    {renderAnalytics()}
                </section>
            </div>)}
        </div>
    );
}

export default RegistryInspect;
