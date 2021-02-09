import React, { useState, useEffect, useRef, useContext } from "react";
import { Popup, Button, Icon } from 'semantic-ui-react';

import AppContext from '../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import {
    addRemoveEntry,
    estimateRegistryActionCost,
    getRegistryContractInstance
} from '../utils/registry';

const ButtonRegistryAddRemove = ({ contractAddress, domain, isOwner, ...rest }) => {
    const { web3, showMessage, handleBlockScreen, hasAccountChanged } = useContext(AppContext);

    const [isInRegistry, setIsInRegistry] = useState(false);
    const [costEstimatedRegistryAction, setCostEstimatedRegistryAction] = useState(0);
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
                console.log('$$$$$$', cost);
                setCostEstimatedRegistryAction(cost);
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
            content={`${isInRegistry ? 'Remove entry from' : 'Add entry to'} the TeSC Registry. This would cost around ${costEstimatedRegistryAction.toFixed(5)} ETH.`}
            trigger={
                <Button
                    basic
                    color={isInRegistry ? 'red' : 'green'}
                    onClick={() => handleRegistryAction(!isInRegistry)}
                    content={isInRegistry ? 'Deregister' : 'Register'}
                    icon={isInRegistry ? 'delete' : 'plus'}
                    {...rest}
                />
            }
        />
    ) : (
            <Popup
                inverted
                content={isInRegistry ? 'In the registry' : 'Not in the registry'}
                trigger={<Icon name={isInRegistry ? 'checkmark' : 'delete'} color={isInRegistry ? 'green' : 'red'} circular />}
            />
        );
};

export default ButtonRegistryAddRemove;
