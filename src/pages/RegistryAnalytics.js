import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FLAGS } from '../utils/tesc'
import BitSet from 'bitset';
import PieChart from '../components/analytics/PieChart'
import BarChart from '../components/analytics/BarChart';

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

    const feedData = (verified) => {
        return entries.reduce((count, entry) => count + (entry.verified === verified), 0)
    }

    const dataPie = [{ 'id': 'Valid', 'value': feedData(true) }, { 'id': 'Invalid', 'value': feedData(false) }]  
    const colorsBar = ['#E8C1A0', '#F47560', '#F1E15B', '#E8A838', '#61CDBB']
    const mode = (entries) => {
        const entriesWithOccurances = entries.map(entry => ({
            domain: (entry.domain.length === 64 && entry.domain.split('.').length === 1)
                ? 'hashed domain' : entry.domain, count: entries.reduce((counter, entry_) =>
                    entry_.domain === entry.domain ? counter += 1 : counter, 0)
        }))
        const distinctEntriesWithOccurances = [];
        const map = new Map();
        let index = 0;
        for (const entry of entriesWithOccurances) {
            if (!map.has(entry.domain)) {
                map.set(entry.domain, true);    // set any value to Map
                distinctEntriesWithOccurances.push({
                    domain: entry.domain,
                    count: entry.count,
                    color: colorsBar[index++]
                });
            }
        }
        return distinctEntriesWithOccurances.slice(0, 5)
    }

    const countFlags = (entries) => {
        let counterDomainHashed = 0;
        let counterAllowSubdomain = 0;
        let counterAllowSubendorsement = 0;
        let counterExclusive = 0;
        let counterPayable = 0;
        let counterAllowAlternativeDomain = 0;
        const allFlags = entries.map(entry => ({ flag: new BitSet(entry.flags).data[0] }))
        for (const flag of allFlags) {
            switch (flag.flag) {
                case 3: counterDomainHashed++
                    break
                default: break
            }
        }
        const result = [{ id: Object.keys(FLAGS)[0], value: counterDomainHashed }, { id: Object.keys(FLAGS)[1], value: counterAllowSubendorsement },
        { id: Object.keys(FLAGS)[2], value: counterExclusive }, { id: Object.keys(FLAGS)[3], value: counterPayable },
        { id: Object.keys(FLAGS)[4], value: counterAllowAlternativeDomain }, { id: Object.keys(FLAGS)[5], value: counterAllowSubdomain }]
        return result
    }

    return (
        <section style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto',
            gridGap: '10px',
            height: '300px'}}>
            <PieChart data={dataPie} loading={loading} />
            <BarChart data={mode(entries)} loading={loading} />
            <PieChart data={countFlags(entries)} isFlags={true} loading={loading} />
        </section>
    )
}

export default RegistryAnalytics
