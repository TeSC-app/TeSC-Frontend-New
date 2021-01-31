import React from 'react'
import { ResponsivePie } from '@nivo/pie'
import { Dimmer, Image, Loader, Segment } from 'semantic-ui-react'
import PageHeader from '../../components/PageHeader'

function PieChart(props) {

    const { data, loading, isFlags } = props

    const renderPie = () => {
        return loading ? <Segment>
            <Dimmer active={loading} inverted>
                <Loader size='large'>Loading Pie Chart</Loader>
            </Dimmer>
            <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
        </Segment> : <ResponsivePie
                data={data}
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
                legends={[
                    {
                        anchor: 'bottom',
                        direction: isFlags ? 'column' : 'row',
                        justify: false,
                        translateX: isFlags ? 180 : 0,
                        translateY: isFlags ? 0 : 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: isFlags ? 30 : 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 10,
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
        <div style={{ height: 300 }}>
            <PageHeader title={isFlags ? 'Popular Flags' : 'Valid To Invalid Ratio'}
                isRegistryAnalytics={true}
                isPieValidInvalid={isFlags ? false : true}
                isPieFlags={isFlags ? true : false} />
            {renderPie()}
        </div>
    )
}

export default PieChart