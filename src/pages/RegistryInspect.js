import React, { useContext, useEffect, useState, useCallback } from 'react'
import { Segment, Dimmer, Image, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import PageHeader from '../components/PageHeader';
import TableOverview from '../components/TableOverview';
import axios from 'axios'
import moment from 'moment'

function RegistryInspect(props) {
    const { loadStorage } = useContext(AppContext);
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(false)

    //add createdAt and isFavourite prop to objects retrieved from the backend - compares with localStorage values
    const updateCreatedAtAndFavouritesForRegistryInspectEntries = useCallback((newTesc) => {
        const tescsLocalStorage = loadStorage() ? loadStorage() : []
        let isIdentical = false;
        for (const tesc of tescsLocalStorage) {
            if (tesc.contractAddress === newTesc.contractAddress) {
                isIdentical = true
                return { isFavourite: tesc.isFavourite, createdAt: tesc.createdAt }
            }
        }
        if (!isIdentical) return { isFavourite: false, createdAt: moment().format('DD/MM/YYYY HH:mm') }
    }, [loadStorage])

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/registry`);
                //for each object key that is an array get the values associated to that key and out of these values build an array of objects
                const registryEntries = Object.keys(response.data['registryEntries'])
                    .map(domain => Object.values(response.data['registryEntries'][domain])
                        .map(({ contract }) => ({ contractAddress: contract.contractAddress, domain: contract.domain, expiry: contract.expiry, createdAt: moment().format('DD/MM/YYYY HH:mm') })))
                    .flat()
                if(response.status === 200) {
                    //console.log(registryEntries.map(entry => ({ ...entry, ...updateCreatedAtAndFavouritesForRegistryInspectEntries(entry) })))
                    setEntries(registryEntries.map(entry => ({ ...entry, ...updateCreatedAtAndFavouritesForRegistryInspectEntries(entry) })).sort((entryA, entryB) => entryB.expiry - entryA.expiry))
                } else {
                    setEntries([])
                }
                setLoading(false)
            } catch (error) {
                console.log(error);
            }
        })();
    }, [updateCreatedAtAndFavouritesForRegistryInspectEntries])

    const renderTable = () => {
        if (entries && entries.length > 0 && !loading) {
            return (
                <div style={{justifyContent: 'center'}}>
                    <TableOverview rowData={entries} isRegistryInspect={true} handleLoading={handleLoading} />
                </div>
            )
        } else if (entries && entries.length === 0 && !loading) {
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

    const handleLoading = loading => {
        setLoading(loading)
    }

    return (
        <div>
            <PageHeader title='Explore TeSC Registry' />
            {/* Smart Contracts associated with Domain */}
            {renderTable()}
        </div>
    )
}

export default RegistryInspect
