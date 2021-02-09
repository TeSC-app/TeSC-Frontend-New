import React, { useState } from 'react';
import { Label, Grid } from 'semantic-ui-react';

import LinkTescInspect from '../InternalLink';
import ButtonRegistryAddRemove from '../ButtonRegistryAddRemove';

const DeploymentOutput = ({ contractAddress, domain, costPaid }) => {
    const [isRegistered, setIsRegistered] = useState(false)

    return (
        <Grid verticalAlign='middle'>
            <Grid.Row>
                <Grid.Column width={3}>
                    <b>Contract deployed at:</b>
                </Grid.Column>
                <Grid.Column width={13}>
                    <Label basic color='purple' size='large' >
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
            <Grid.Row>
                <Grid.Column width={3}>
                    <b>{`${isRegistered? 'Deregister from' : 'Register to'} TeSC Registry?`}</b>
                </Grid.Column>
                <Grid.Column width={13}>
                    <ButtonRegistryAddRemove
                        contractAddress={contractAddress}
                        domain={domain}
                        isOwner={true}
                        onClick={setIsRegistered}
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default DeploymentOutput;