import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Segment, Dimmer, Image, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import PageHeader from '../components/PageHeader';
import TableOverview, { COL } from '../components/TableOverview';
import axios from 'axios';
import moment from 'moment';

function RegistryInspect(props) {
    const { loadStorage } = useContext(AppContext);
    const [entriesRaw, setEntriesRaw] = useState([])
    const [entriesWithOccurances, setEntriesWithOccurances] = useState([])
    const [loading, setLoading] = useState(false);

    //add createdAt and isFavourite prop to objects retrieved from the backend - compares with localStorage values
    const updateCreatedAtAndFavouritesForRegistryInspectEntries = useCallback((newTesc) => {
        const tescsLocalStorage = loadStorage() ? loadStorage() : [];
        let isIdentical = false;
        for (const tesc of tescsLocalStorage) {
            if (tesc.contractAddress === newTesc.contractAddress) {
                isIdentical = true;
                return { isFavourite: tesc.isFavourite, createdAt: tesc.createdAt };
            }
        }
        if (!isIdentical) return { isFavourite: false, createdAt: moment().format('DD/MM/YYYY HH:mm') };
    }, [loadStorage]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/registry`);
                //for each object key that is an array get the values associated to that key and out of these values build an array of objects
                const registryEntries = Object.keys(response.data['registryEntries'])
                    .map(domain => Object.values(response.data['registryEntries'][domain])
                        .map(({ contract, verified }) => ({ contractAddress: contract.contractAddress, domain: contract.domain, expiry: contract.expiry, createdAt: moment().format('DD/MM/YYYY HH:mm'), verified: verified })))
                    .flat()
                if (response.status === 200) {
                    //console.log(registryEntries.map(entry => ({ ...entry, ...updateCreatedAtAndFavouritesForRegistryInspectEntries(entry) })))
                    const entriesRaw = registryEntries.map(entry => ({ ...entry, ...updateCreatedAtAndFavouritesForRegistryInspectEntries(entry) })).sort((entryA, entryB) => entryB.expiry - entryA.expiry)
                    const entriesWithOccurances = entriesRaw.map(entry => ({
                        domain: entry.domain, contractAddresses: entriesRaw.filter((entry_) => entry_.domain === entry.domain).map(({contractAddress}) => contractAddress), contractCount: entriesRaw.reduce((counter, entry_) =>
                                entry_.domain === entry.domain ? counter += 1 : counter, 0),
                        verifiedCount: entriesRaw.reduce((counter, entry_) =>
                            entry_.verified === true && entry_.domain === entry.domain ? counter += 1 : counter, 0)
                    }))
                    let distinctEntriesWithOccurances = []
                    const map = new Map(); 
                    //array of contract addresses used for the smart contract images in the exploration page
                    for (const entry of entriesWithOccurances) {
                        if (!map.has(entry.domain)) {
                            map.set(entry.domain, true);    // set any value to Map
                            distinctEntriesWithOccurances.push({
                                domain: entry.domain,
                                contractAddresses: entry.contractAddresses,
                                contractCount: entry.contractCount,
                                verifiedCount: entry.verifiedCount
                            });
                        }
                    }
                    setEntriesRaw(entriesRaw)
                    setEntriesWithOccurances(distinctEntriesWithOccurances)
                } else {
                    setEntriesRaw([])
                }
                setLoading(false);
            } catch (error) {
                console.log(error);
            }
        })();
    }, [updateCreatedAtAndFavouritesForRegistryInspectEntries]);

    const renderTable = () => {
        if (entriesRaw && entriesRaw.length > 0 && !loading) {
            return (
                <div style={{ justifyContent: 'center' }}>
                    <TableOverview
                        rowData={entriesRaw}
                        entriesWithOccurances={entriesWithOccurances}
                        isRegistryInspect={true}
                        handleLoading={handleLoading}
                        isExploringDomainDefault={false} 
                        cols={new Set([COL.VERIF, COL.FAV])}
                    />
                </div>
            )
        } else if (entriesRaw && entriesRaw.length === 0 && !loading) {
            return (
                <div className="ui placeholder segment">
                    <div className="ui icon header">
                        <i className="search icon"></i>
                  We could not find a Smart Contract associated to this domain in the registry. Look for a different domain.
                </div>
                </div>
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
        setLoading(loading)
    }

    return (
        <div>
            <PageHeader title='Explore TeSC Registry' />
            {/* Smart Contracts associated with Domain */}
            {renderTable()}
        </div>
    );
}

export default RegistryInspect;
