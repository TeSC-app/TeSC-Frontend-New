import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { Dimmer, Image, Loader, Segment } from 'semantic-ui-react'
import { FLAGS } from '../utils/tesc'
import BitSet from 'bitset';
import PageHeader from '../components/PageHeader'

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

    const renderPie = () => {
        return loading ? <Segment>
            <Dimmer active={loading} inverted>
                <Loader size='large'>Loading Pie Chart</Loader>
            </Dimmer>
            <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
        </Segment> : <ResponsivePie
                data={dataPie}
                margin={{ top: 40, right: 80, bottom: 80, left: 0 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                radialLabelsSkipAngle={10}
                radialLabelsTextColor="#333333"
                radialLabelsLinkColor={{ from: 'color' }}
                sliceLabelsSkipAngle={10}
                sliceLabelsTextColor="#333333"
                defs={[
                    {
                        id: 'dots',
                        type: 'patternDots',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        size: 4,
                        padding: 1,
                        stagger: true
                    },
                    {
                        id: 'lines',
                        type: 'patternLines',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10
                    }
                ]}
                fill={[
                    {
                        match: {
                            id: 'Valid'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'Invalid'
                        },
                        id: 'lines'
                    },
                ]}
                legends={[
                    {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemTextColor: '#000'
                                }
                            }
                        ]
                    }
                ]}
            />
    }

    const mode = (entries) => {
        const entriesWithOccurances = entries.map(entry => ({
            domain: (entry.domain.length === 64 && entry.domain.split('.').length === 1)
                ? 'hashed domain' : entry.domain, count: entries.reduce((counter, entry_) =>
                    entry_.domain === entry.domain ? counter += 1 : counter, 0)
        }))
        const distinctEntriesWithOccurances = [];
        const map = new Map();
        for (const entry of entriesWithOccurances) {
            if (!map.has(entry.domain)) {
                map.set(entry.domain, true);    // set any value to Map
                distinctEntriesWithOccurances.push({
                    domain: entry.domain,
                    count: entry.count
                });
            }
        }
        return distinctEntriesWithOccurances
    }

    const renderBarChart = () => {
        console.log(mode(entries))
        return loading ? <Segment>
            <Dimmer active={loading} inverted>
                <Loader size='large'>Loading Bar Chart</Loader>
            </Dimmer>
            <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
        </Segment> : <ResponsiveBar
                data={mode(entries)}
                keys={['count']}
                indexBy="domain"
                margin={{ top: 50, right: 0, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                defs={[
                    {
                        id: 'dots',
                        type: 'patternDots',
                        background: 'inherit',
                        color: '#38bcb2',
                        size: 4,
                        padding: 1,
                        stagger: true
                    },
                    {
                        id: 'lines',
                        type: 'patternLines',
                        background: 'inherit',
                        color: '#eed312',
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10
                    }
                ]}
                fill={[
                    {
                        match: {
                            id: 'count'
                        },
                        id: 'dots'
                    },
                ]}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Domain',
                    legendPosition: 'middle',
                    legendOffset: 32
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Number of Smart Contracts',
                    legendPosition: 'middle',
                    legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                legends={[
                    {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 20,
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemOpacity: 1
                                }
                            }
                        ]
                    }
                ]}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
            />
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

    const renderPieFlags = () => {
        return loading ? <Segment>
            <Dimmer active={loading} inverted>
                <Loader size='large'>Loading Pie Chart</Loader>
            </Dimmer>
            <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
        </Segment> : <ResponsivePie
                data={countFlags(entries)}
                margin={{ top: 40, right: 80, bottom: 80, left: 0 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                radialLabelsSkipAngle={10}
                radialLabelsTextColor="#333333"
                radialLabelsLinkColor={{ from: 'color' }}
                sliceLabelsSkipAngle={10}
                sliceLabelsTextColor="#333333"
                defs={[
                    {
                        id: 'dots',
                        type: 'patternDots',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        size: 4,
                        padding: 1,
                        stagger: true
                    },
                    {
                        id: 'lines',
                        type: 'patternLines',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10
                    }
                ]}
                fill={[
                    {
                        match: {
                            id: 'Valid'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'Invalid'
                        },
                        id: 'lines'
                    },
                ]}
                legends={[
                    {
                        anchor: 'bottom',
                        direction: 'column',
                        justify: false,
                        translateX: 200,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemWidth: 200,
                        itemHeight: 30,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemTextColor: '#000'
                                }
                            }
                        ]
                    }
                ]}
            />
    }

    return (
        <section style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto',
            gridGap: '10px',
            height: '300px'}}>
            <div style={{height: 300}}>
                <PageHeader title='Valid To Invalid Ratio' isRegistryAnalytics={true} />
                {renderPie()}
            </div>
            <div style={{ height: 300 }}>
                <PageHeader title='Domains With Most Smart Contracts' isRegistryAnalytics={true} />
                {renderBarChart()}
            </div>
            <div style={{ height: 300 }}>
                <PageHeader title='Most Used Flags' isRegistryAnalytics={true} />
                {renderPieFlags()}
            </div>
        </section>
    )
}

export default RegistryAnalytics
