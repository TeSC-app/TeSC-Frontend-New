import React from 'react';
import { Label, Grid, Segment } from 'semantic-ui-react';

import LinkTescInspect from '../InternalLink';

const DeploymentOutput = ({ contractAddress, costPaid }) => {
    return (
        <Grid>
            <Grid.Row>
                <Grid.Column width={3}>
                    <b>Contract address:</b>
                </Grid.Column>
                <Grid.Column width={13}>
                    <Label basic color='green' size='large' >
                        <LinkTescInspect contractAddress={contractAddress} />
                    </Label>
                </Grid.Column>
            </Grid.Row>
            {costPaid &&
                (
                    <Grid.Row>
                        <Grid.Column width={3}>
                            <b>Cost paid:</b>
                        </Grid.Column>
                        <Grid.Column width={13}>
                            <Label tag style={{ color: 'royalblue' }}>
                                {costPaid.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH</span>
                            </Label>
                        </Grid.Column>
                    </Grid.Row>
                )
            }
        </Grid>
    );
};

export default DeploymentOutput;