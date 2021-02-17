import React, { useState, useEffect, useContext } from 'react';
import { Label, Grid } from 'semantic-ui-react';

import LinkTescInspect from '../InternalLink';
import ButtonRegistryAddRemove from '../ButtonRegistryAddRemove';
import { isRegistered } from '../../utils/registry';
import AppContext from '../../appContext';


const DeploymentOutput = ({ contractAddress, domain, costsPaid, style }) => {
    const { web3 } = useContext(AppContext);

    const [isInRegistry, setInRegistry] = useState(false);

    useEffect(() => {
        (async () => {
            setInRegistry(await isRegistered(web3, contractAddress));
        })();
    }, [contractAddress, web3]);

    return (
        <Grid verticalAlign='middle' style={style} >
            <Grid.Row>
                <Grid.Column width={4}>
                    <b>Contract deployed at:</b>
                </Grid.Column>
                <Grid.Column width={12} style={{ wordBreak: 'break-all' }} >
                    <Label basic color='purple' size='large'>
                        <LinkTescInspect contractAddress={contractAddress} />
                    </Label>
                </Grid.Column>
            </Grid.Row>
            {costsPaid &&
                (
                    <Grid.Row>
                        <Grid.Column width={4}>
                            <b>Cost paid:</b>
                        </Grid.Column>
                        <Grid.Column width={12}>
                            <Label tag style={{ color: 'royalblue' }}>
                                {costsPaid.eth} <span style={{ fontSize: '0.75em' }}>ETH </span>
                                {costsPaid.usd > 0 && `(${costsPaid.usd}`} <span style={{ fontSize: '0.75em' }}>USD</span>)
                            </Label>
                        </Grid.Column>
                    </Grid.Row>
                )
            }
            <Grid.Row>
                <Grid.Column width={4}>
                    <b>{`${isInRegistry ? 'Deregister from' : 'Register to'} TeSC Registry?`}</b>
                </Grid.Column>
                <Grid.Column width={12}>
                    <ButtonRegistryAddRemove
                        contractAddress={contractAddress}
                        domain={domain}
                        isOwner={true}
                        onClick={setInRegistry}
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default DeploymentOutput;