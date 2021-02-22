import React from 'react'
import PageHeader from '../../components/PageHeader'
import { Dimmer, Image, Loader, Segment } from 'semantic-ui-react'
import { ResponsiveBar } from '@nivo/bar'

function BarChart(props) {

    const { data, loading, infoText, isExpiration, isExploringDomain } = props

    const getBarColor = bar => bar.data.color;

    const renderBarChart = () => {
        return loading ? <Segment basic>
            <Dimmer active={loading} inverted>
                <Loader size='large'>Loading Bar Chart</Loader>
            </Dimmer>
            <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
        </Segment> : <ResponsiveBar
                data={data}
                keys={['Count']}
                indexBy={isExpiration ? "expired" : "domain"}
                margin={{ top: 50, right: 50, bottom: 50, left: 70 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={getBarColor}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: isExpiration ? 'Expiry' : 'Domain',
                    legendPosition: 'middle',
                    legendOffset: 32
                }}
                axisLeft={{
                    tickSize: 5,
                    format: e => Math.floor(e) === e && e,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Number of Smart Contracts',
                    legendPosition: 'middle',
                    legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
            />
    }

    return (
        <div style={{ height: 300 }}>
            <PageHeader title={isExpiration ? 'Expiry of Smart Contracts' : 'Domains With Most Smart Contracts'}
                isRegistryAnalytics={true}
                infoText={infoText} />
            {renderBarChart()}
        </div>
    )
}

export default BarChart
