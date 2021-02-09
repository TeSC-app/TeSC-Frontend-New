import React, { useState, useEffect, useRef, useContext } from "react";
import { Popup, Button } from 'semantic-ui-react';

import AppContext from '../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import { 
    addRemoveEntry, 
    estimateRegistryActionCost, 
    getRegistryContractInstance 
} from '../utils/registry';

const ButtonRegistryAddRemove = ({ tesc }) => {
    const { web3, showMessage, handleBlockScreen, hasAccountChanged } = useContext(AppContext);

    const [isInRegistry, setIsInRegistry] = useState(false);
    const [costEstimatedRegistryAction, setCostEstimatedRegistryAction] = useState(0);
    const [loading, setLoading] = useState(true);

    const registryContract = useRef(getRegistryContractInstance(web3));
    const contractAddress = useRef(tesc.contractAddress);
    const domain = useRef(tesc.domain);
    const own = useRef(tesc.own);


    useEffect(() => {
        const checkRegistry = async () => {
            try {
                const isInRegistry = await registryContract.current.methods.isContractRegistered(contractAddress.current).call();
                setIsInRegistry(isInRegistry);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        };
        checkRegistry();
    }, []);


    useEffect(() => {
        const runEffect = async () => {
            if (own.current && !hasAccountChanged && !loading) {
                const cost = await estimateRegistryActionCost(isInRegistry, { web3, contractAddress: contractAddress.current, domain: domain.current });
                console.log('$$$$$$', cost);
                setCostEstimatedRegistryAction(cost);
            }
        };
        runEffect();
    }, [web3, isInRegistry, hasAccountChanged, loading]);

    const handleRegistryAction = async (isAdding) => {
        handleBlockScreen(true);
        try {
            const cb = (message) => {
                showMessage(buildPositiveMsg(message));
                setIsInRegistry(!isInRegistry);
            };
            await addRemoveEntry(isAdding, { web3, domain: domain.current, contractAddress: contractAddress.current, cb });

        } catch (error) {
            showMessage(buildNegativeMsg({
                header: 'Unable to add entry to the registry',
                msg: error.message
            }));
        }
        handleBlockScreen(false);
    };

    return (
        <Popup inverted
            content={`${isInRegistry ? 'Remove entry from' : 'Add entry to'} the TeSC registry. This would cost around ${costEstimatedRegistryAction.toFixed(5)} ETH.`}
            trigger={
                <Button
                    basic
                    color={isInRegistry ? 'red' : 'blue'}
                    onClick={() => handleRegistryAction(!isInRegistry)}
                    content={isInRegistry ? 'Remove' : 'Add'}
                    icon={isInRegistry ? 'delete' : 'plus'}
                    className='button-remove'
                />
            }
        />
    );
};

export default ButtonRegistryAddRemove;
