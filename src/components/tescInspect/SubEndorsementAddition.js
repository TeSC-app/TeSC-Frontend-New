import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Form, Label, Button, Segment, Header, Input, Divider, Icon, Ref, Popup, Checkbox } from 'semantic-ui-react';
import { toast } from 'react-toastify';

import TeSC from '../../ethereum/build/contracts/ERCXXXImplementation.json';
import AppContext from '../../appContext';
import { negativeMsg } from "../FeedbackMessage";

import { isValidContractAddress } from '../../utils/tesc';



const SubEndorsementAddition = ({ contractAddress, verified, owner }) => {
    const { web3, account, handleBlockScreen } = useContext(AppContext);

    const [subendorsements, setSubendorsements] = useState(new Set());
    const [newSubendorsement, setNewSubendorsement] = useState('');
    const [invalidAddInputReason, setInvalidAddInputReason] = useState('');
    const [invalidSearchInputReason, setInvalidSearchInputReason] = useState('');

    const [subendorsementSearchAddress, setSubendorsementSearchAddress] = useState('');
    const [hasSubendorsementMatch, setHasSubendorsementMatch] = useState(false);

    const [loadingButtonIndex, setLoadingButtonIndex] = useState(-1);

    const contractInstance = useRef(null);

    useEffect(() => {
        (async () => {
            contractInstance.current = new web3.eth.Contract(TeSC.abi, contractAddress);
            const fetchedSubendorsements = await contractInstance.current.methods.getSubendorsements().call();
            setSubendorsements(new Set(fetchedSubendorsements));
        })();

    }, [contractAddress, web3.eth]);

    const validateAddressInput = (address, checkDuplicate = true) => {
        if (isValidContractAddress(address, true)) {
            if (checkDuplicate && subendorsements.has(address)) {
                setInvalidAddInputReason(`Contract ${address} already added`);
            } else {
                setInvalidAddInputReason('');
            }
        }
    };

    const handleChangeNewSubendorsement = (newAddress) => {
        try {
            setNewSubendorsement(newAddress);
            validateAddressInput(newAddress);
        } catch (error) {
            setInvalidAddInputReason(newAddress ? error.message : '');
        }
    };

    const handleChangeSubendorsementSearch = (address) => {
        try {
            setSubendorsementSearchAddress(address);
            validateAddressInput(address, false);

            const matches = [...subendorsements].filter(addr => addr === address);
            setHasSubendorsementMatch(matches.length > 0 ? true : false);

        } catch (error) {
            setInvalidSearchInputReason(address ? error.message : '');
            setHasSubendorsementMatch(false);

        }
    };

    const refresh = (resetInput = true) => {
        if (resetInput) {
            setNewSubendorsement('');
        }
        setInvalidAddInputReason('');
        setLoadingButtonIndex(-1);
        handleBlockScreen(false);
    };

    const handleRemoveEndorsement = async (address, index) => {
        try {
            handleBlockScreen(true);
            setLoadingButtonIndex(index);
            await contractInstance.current.methods.removeSubendorsementAtIndex(index).send({ from: account, gas: '3000000' });
            const updatedSubendorsements = [...subendorsements].filter((addr, i) => address !== addr);
            setSubendorsements(new Set(updatedSubendorsements));
            refresh();
        } catch (error) {
            toast(negativeMsg({
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
            await contractInstance.current.methods.addSubendorsement(newSubendorsement).send({ from: account, gas: '3000000' });
            setSubendorsements(new Set([...subendorsements, newSubendorsement]));
            refresh();
        } catch (error) {
            toast(negativeMsg({
                header: `Unable to add Subendorsement ${newSubendorsement}`,
                content: error.message
            }));
            refresh(false);
        }
    };


    const renderSubendorsements = () => {
        const subendorsementsArray = [...subendorsements];
        return subendorsementsArray.filter(addr => !hasSubendorsementMatch || addr === subendorsementSearchAddress).map((addr, i) =>
            <>
                {/* <div style={{marginBottom: '3px', fontWeight: 'bold'}}> Subendorsement {i + 1}</div> */}
                <Label
                    key={addr}
                    content={addr}
                    basic={hasSubendorsementMatch}
                    color={hasSubendorsementMatch ? 'purple' : undefined}
                    className='ui input'
                    style={{ width: '75%', marginRight: '10px', marginBottom: '10px', color: '#292929', fontSize: '1em', lineHeight: '1.21428571em' }}
                />
                {owner === account &&
                    <Button icon='x' color='red' basic
                        loading={loadingButtonIndex === i}
                        onClick={() => handleRemoveEndorsement(addr, i)}
                        disabled={loadingButtonIndex === i}
                        style={{ marginRight: '15px' }}
                    />
                }
                {hasSubendorsementMatch &&
                    <Popup inverted
                        content={`This contract is ${verified ? '' : 'NOT'} trustworthy because the master contract ${contractAddress} is ${verified ? '' : 'NOT'} verified.`}
                        trigger={
                            <Icon
                                name={verified ? 'check circle' : 'warning sign'}
                                color={verified ? 'green' : 'red'}
                                size='large'
                            />
                        }
                    />
                }
            </>
        );
    };
    return (
        <div className='tesc-inspect--segment'>
            <Header as='h3' content='Subendorsements' />
            <p>Contract <b>{contractAddress}</b> is endorsing <b className='main-color'>{subendorsements.size}</b> other contract{subendorsements.size === 1 ? '' : 's'}</p>

            {subendorsements.size > 0 &&
                <>
                    <Divider section hidden>
                        <p style={{ fontSize: '0.8em' }}>
                            <Icon name='search' />
                            Lookup & Verify
                        </p>
                    </Divider>

                    <Form style={{ marginTop: '10px' }}>
                        <Form.Field error={!!invalidSearchInputReason}>
                            {/* <label>Lookup & Verify</label> */}
                            <Input
                                value={subendorsementSearchAddress}
                                placeholder='Contract address e.g. 0x123456789abcdf...'
                                onChange={e => handleChangeSubendorsementSearch(e.target.value)}
                                icon='search'
                                iconPosition='left'
                                style={{ width: '75%', marginRight: '10px' }}
                            />
                            {/* <Button icon='search' color='purple' basic
                        onClick={() => handleAddEndorsement()}
                        loading={loadingButtonIndex === subendorsements.size}
                    /> */}

                            {invalidSearchInputReason &&
                                <Label pointing prompt content={invalidSearchInputReason} />
                            }
                        </Form.Field>
                    </Form>
                </>
            }

            {/* <Divider section style={{ width: '50%', margin: '40px auto' }} /> */}

            {owner === account &&
                <>
                    <Divider section hidden>
                        <p style={{ fontSize: '0.8em' }}>
                            <Icon name='plus' />
                                        Add subendorsement
                                    </p>
                    </Divider>
                    <Form style={{ marginTop: '10px' }}>
                        <Form.Field error={!!invalidAddInputReason}>
                            {/* <label>New subendorsement</label> */}
                            <Input
                                value={newSubendorsement}
                                placeholder='Contract address e.g. 0x123456789abcdf...'
                                onChange={e => handleChangeNewSubendorsement(e.target.value)}
                                style={{ width: '75%', marginRight: '10px' }}
                            />

                            <Button icon='plus' color='green' basic
                                onClick={() => handleAddEndorsement()}
                                disabled={!!invalidAddInputReason || !newSubendorsement}
                                loading={loadingButtonIndex === subendorsements.size}
                            />
                            {invalidAddInputReason &&
                                <Label pointing prompt content={invalidAddInputReason} />
                            }
                        </Form.Field>
                    </Form>
                </>
            }

            {subendorsements.size > 0 && contractAddress &&
                <>
                    <Divider section hidden>
                        <p style={{ fontSize: '0.8em' }}>
                            <Icon name='list' /> Current Subendorsements
                        </p>
                    </Divider>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>
                        {renderSubendorsements()}
                    </div>
                </>
            }
        </div>
    );
};

export default SubEndorsementAddition;