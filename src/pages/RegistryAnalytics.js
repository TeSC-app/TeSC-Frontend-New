import React, { useState, useEffect } from 'react'
import axios from 'axios'
import PieChart from '../components/analytics/PieChart'
import BarChart from '../components/analytics/BarChart';
import { 
    computeTopDomains,
    countFlags,
    computeValidContracts
} from '../utils/analytics';

function RegistryAnalytics() {
    const [loading, setLoading] = useState(false)
    const [entries, setEntries] = useState([])

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/registry`);
                //for each object key that is an array get the values associated to that key and out of these values build an array of objects
                const registryEntries = Object.keys(response.data['registryEntries'])
                    .map(domain => Object.values(response.data['registryEntries'][domain])
                        .map(({ contract, verified }) => ({ contractAddress: contract.contractAddress, domain: contract.domain, expiry: contract.expiry, flags: contract.flags, verified })))
                    .flat()
                if (response.status === 200) {
                    console.log(response)
                    //console.log(registryEntries.map(entry => ({ ...entry, ...updateCreatedAtAndFavouritesForRegistryInspectEntries(entry) })))
                    setEntries(registryEntries)
                } else {
                    setEntries([])
                }
                setLoading(false)
            } catch (error) {
                console.log(error);
            }
        })();
    }, [])

    const dataValidContracts = [{ 'id': 'Valid', 'value': computeValidContracts(entries, true) }, { 'id': 'Invalid', 'value': computeValidContracts(entries, false) }]
    return (
        <section style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto',
            gridGap: '10px',
            height: '300px'
        }}>
            <PieChart data={dataValidContracts} loading={loading} />
            <BarChart data={computeTopDomains(entries)} loading={loading} />
            <PieChart data={countFlags(entries)} isFlags={true} loading={loading} />
        </section>
    )
}

export default RegistryAnalytics
