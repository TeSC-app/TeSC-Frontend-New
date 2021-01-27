import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Form, Label, Button, Segment, Header, Input } from 'semantic-ui-react';
import { isSuperSet, intersection } from "set-operations";

import TeSC from '../../ethereum/build/contracts/ERCXXXImplementation.json';
import AppContext from '../../appContext';
import { buildNegativeMsg } from "../FeedbackMessage";

import { isValidContractAddress } from '../../utils/tesc';



const SubEndorsementAddition = ({ contractAddress }) => {
    const { web3, showMessage, account, handleBlockScreen } = useContext(AppContext);
    const [subendorsements, setSubendorsements] = useState(new Set());
    const [newSubendorsement, setNewSubendorsement] = useState('');
    const [invalidInputReason, setInvalidInputReason] = useState('');

    const [loadingButtonIndex, setLoadingButtonIndex] = useState(-1);

    const contractInstance = useRef(new web3.eth.Contract(TeSC.abi, contractAddress));

    useEffect(() => {
        (async () => {
            const fetchedSubendorsements = await contractInstance.current.methods.getSubendorsements().call();
            setSubendorsements(new Set(fetchedSubendorsements.map(addr => addr.toLowerCase())));
        })();
    }, [contractAddress, web3.eth]);

    const handleChangeSubendorsementInputs = (newAddress) => {
        try {
            setNewSubendorsement(newAddress);

            if (isValidContractAddress(newAddress, true)) {
                if (subendorsements.has(newAddress.toLowerCase())) {
                    setInvalidInputReason(`Contract ${newAddress} already added`);
                } else if (newAddress.toLowerCase() === contractAddress.toLowerCase()) {
                    setInvalidInputReason('A contract cannot subendorse itself');
                } else {
                    setInvalidInputReason('');
                }
            }


        } catch (error) {
            setInvalidInputReason(newAddress ? error.message : '');
        }


    };

    const refresh = (resetInput = true) => {
        if (resetInput) {
            setNewSubendorsement('');
        }
        setInvalidInputReason('');
        setLoadingButtonIndex(-1);
        handleBlockScreen(false);
    };

    const handleRemoveEndorsement = async (index) => {
        try {
            handleBlockScreen(true);
            setLoadingButtonIndex(index);
            await contractInstance.current.methods.removeSubendorsementAtIndex(index).send({ from: account, gas: '3000000' });
            const updatedSubendorsements = [...subendorsements].filter((address, i) => index !== i);
            setSubendorsements(new Set(updatedSubendorsements));
            refresh();
        } catch (error) {
            showMessage(buildNegativeMsg({
                header: `Unable to remove Subendorsement ${subendorsements[index]}`,
                content: error.message
            }));
            refresh(false);
        }
    };

    const handleAddEndorsement = async () => {
        try {
            setLoadingButtonIndex(subendorsements.size);
            handleBlockScreen(true);
            await contractInstance.current.methods.addSubendorsement(newSubendorsement.toLowerCase()).send({ from: account, gas: '3000000' });
            setSubendorsements(new Set([...subendorsements, newSubendorsement]));
            refresh();
        } catch (error) {
            showMessage(buildNegativeMsg({
                header: `Unable to add Subendorsement ${newSubendorsement}`,
                content: error.message
            }));
            refresh(false);
        }
    };


    const renderSubendorsements = () => {
        const subendorsementsArray = [...subendorsements];
        return subendorsementsArray.map((address, i) =>
            <>
                {/* <div style={{marginBottom: '3px', fontWeight: 'bold'}}> Subendorsement {i + 1}</div> */}
                <Label
                    className='ui input'
                    style={{ width: '75%', marginRight: '10px', marginBottom: '10px', color: '#292929', fontSize: '1em', lineHeight: '1.21428571em' }}
                >
                    {subendorsementsArray[i]}
                </Label>
                <Button icon='x' color='red' basic
                    loading={loadingButtonIndex === i}
                    onClick={() => handleRemoveEndorsement(i)}
                    disabled={loadingButtonIndex === i}
                />
            </>
        );
    };

    return (
        <Segment>
            <Header as='h3' content='Subendorsements' />
            <p>Contract {contractAddress} is endorsing <b className='main-color'>{subendorsements.size}</b> other contract{subendorsements.size - 1 !== 1 ? 's' : ''}</p>
            {renderSubendorsements()}
            <Form style={{ marginTop: '10px' }}>
                <Form.Field error={invalidInputReason}>
                    <label>New Subendorsement</label>
                    <Input
                        value={newSubendorsement}
                        placeholder='Contract address e.g. 0x123456789abcdf...'
                        onChange={e => handleChangeSubendorsementInputs(e.target.value)}
                        icon='address'
                        style={{ width: '75%', marginRight: '10px' }}
                    />
                    <Button icon='plus' color='green' basic
                        onClick={() => handleAddEndorsement()}
                        disabled={!!invalidInputReason || !newSubendorsement}
                        loading={loadingButtonIndex === subendorsements.size}
                    />
                    {invalidInputReason &&
                        <Label pointing color='red' basic>{invalidInputReason}</Label>
                    }

                </Form.Field>
            </Form>
        </Segment>
    );
};

export default SubEndorsementAddition;