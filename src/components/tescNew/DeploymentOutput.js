import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Label } from 'semantic-ui-react';

import LinkTescInspect from '../InternalLink';

const DeploymentOutput = ({ contractAddress, costPaid }) => {
    return (
        <span style={{ float: 'left' }}>
            <b>Contract address:</b>
            <Label basic color='green' size='large' style={{ marginLeft: '5px' }}>
                <LinkTescInspect contractAddress={contractAddress} />
            </Label>
            {costPaid &&
                (
                    <div>
                        <br />
                        <b>
                            Cost paid:  <Label tag style={{ color: 'royalblue' }}>
                                {costPaid.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH</span>
                            </Label>
                        </b>
                    </div>
                )
            }
        </span>
    );
};

export default DeploymentOutput;