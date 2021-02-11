import React, { useState, useEffect, useRef, useContext } from "react";
import { Popup, Button, Icon } from 'semantic-ui-react';

import AppContext from '../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import {
    addRemoveEntry,
    estimateRegistryActionCost,
    getRegistryContractInstance
} from '../utils/registry';

import {
    getEthRates
} from '../utils/conversionRate';

const ButtonRegistryAddRemove = ({ contractAddress, domain, isOwner, verbose, onClick, style }) => {
    const { web3, showMessage, handleBlockScreen, hasAccountChanged } = useContext(AppContext);

    const [isInRegistry, setIsInRegistry] = useState(false);
    const [costsEstimatedRegistryAction, setCostsEstimatedRegistryAction] = useState(0);
    const [loading, setLoading] = useState(true);

    const registryContract = useRef(getRegistryContractInstance(web3));

    useEffect(() => {
        const checkRegistry = async () => {
            try {
                const isInRegistry = await registryContract.current.methods.isContractRegistered(contractAddress).call();
                setIsInRegistry(isInRegistry);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        };
        checkRegistry();
    }, [contractAddress, domain]);


    useEffect(() => {
        const runEffect = async () => {
            if (!hasAccountChanged && !loading) {
                const cost = await estimateRegistryActionCost(isInRegistry, { web3, contractAddress, domain });
                setCostsEstimatedRegistryAction(getEthRates(cost));
            }
        };
        runEffect();
    }, [web3, isInRegistry, hasAccountChanged, loading, domain, contractAddress]);

    const handleRegistryAction = async (isAdding) => {
        handleBlockScreen(true);
        try {
            const cb = (message) => {
                showMessage(buildPositiveMsg(message));
                setIsInRegistry(!isInRegistry);
                if(onClick) onClick(!isInRegistry)
            };
            await addRemoveEntry(isAdding, { web3, domain, contractAddress, cb });

        } catch (error) {
            showMessage(buildNegativeMsg({
                header: 'Unable to add entry to the registry',
                msg: error.message
            }));
        }
        handleBlockScreen(false);
    };

    return isOwner ? (
        <Popup inverted
            content={`${isInRegistry ? 'Remove entry from' : 'Add entry to'} the TeSC Registry. 
            This would cost around ${costsEstimatedRegistryAction.eth} ETH (~ ${costsEstimatedRegistryAction.usd} USD).`} 
            trigger={
                <Button
                    basic
                    color={isInRegistry ? 'red' : 'teal'}
                    onClick={() => handleRegistryAction(!isInRegistry)}
                    content={`${isInRegistry ? 'Dergister' : 'Register'} ${verbose ? `${isInRegistry ? 'from' : 'to'} TeSC Registry` : ''}`}
                    icon={isInRegistry ? 'delete' : 'plus'}
                    style={style}
                />
            }
        />
    ) : (
            <Popup
                inverted
                content={`This contract is ${isInRegistry ? '' : 'not'} registered in the registry`}
                trigger={
                    <span style={{ ...style, marginRight: '20px' }}>
                        <Icon
                            circular
                            name={isInRegistry ? 'checkmark' : 'delete'}
                            color={isInRegistry ? 'green' : 'red'}
                            
                        />
                        {verbose && <b>{isInRegistry ? 'Registered in the registry' : 'Not registered in the registry'}</b>}
                    </span>
                }
            />
        );
};

export default ButtonRegistryAddRemove;
