import React from 'react'
import PageHeader from '../../components/PageHeader'
import { Dimmer, Image, Loader, Segment } from 'semantic-ui-react'
import { ResponsiveBar } from '@nivo/bar'

function BarChart(props) {

    const { data, loading } = props

    const getBarColor = bar => bar.data.color;

    const renderBarChart = () => {
        return loading ? <Segment>
            <Dimmer active={loading} inverted>
                <Loader size='large'>Loading Bar Chart</Loader>
            </Dimmer>
            <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
        </Segment> : <ResponsiveBar
                data={data}
                keys={['count']}
                indexBy="domain"
                margin={{ top: 50, right: 0, bottom: 50, left: 60 }}
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

    return (
        <div style={{ height: 300 }}>
            <PageHeader title='Domains With Most Smart Contracts' isRegistryAnalytics={true} isBarTop={true} />
            {renderBarChart()}
        </div>
    )
}

export default BarChart
