import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Input, Table, Checkbox, Loader, Icon, Label, Grid, Card, Form, Dimmer } from 'semantic-ui-react';


import BitSet from 'bitset';
import moment from 'moment';
import axios from 'axios';

import AppContext from '../appContext';
import { FLAG_POSITIONS, hexStringToBitSet } from '../utils/tesc';
import TeSC from '../ethereum/build/contracts/ERCXXXImplementation.json';


const TeSCInspect = ({ location }) => {
    const { web3 } = useContext(AppContext);
    const [contractAddress, setContractAddress] = useState('');

    const [domainFromChain, setDomainFromChain] = useState('');
    const [expiry, setExpiry] = useState('');
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(new BitSet('0x00'));
    const [isDomainHashed, setIsDomainHashed] = useState(null);

    const [plainDomain, setPlainDomain] = useState('');
    const [plainDomainSubmitted, setPlainDomainSubmitted] = useState(false);

    const [verifResult, setVerifResult] = useState(null);


    const fetchTescData = async (address) => {
        const contract = new web3.eth.Contract(TeSC.abi, address);

        const flagsHex = await contract.methods.getFlags().call();
        setIsDomainHashed(!!(new BitSet(flagsHex)).get(FLAG_POSITIONS.DOMAIN_HASHED + 1));
        console.log("Flaghex", flagsHex);
        setFlags(hexStringToBitSet(flagsHex));

        setDomainFromChain(await contract.methods.getDomain().call());
        setExpiry(await contract.methods.getExpiry().call());
        setSignature(await contract.methods.getSignature().call());
    };

    const verifyTesc = useCallback(async () => {
        if (isDomainHashed !== null && (!isDomainHashed || (isDomainHashed && plainDomainSubmitted))) {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/isVerified/${contractAddress}`, {
                params: { plainDomain }
            });
            console.log('VERIF_RESULT', response);
            setVerifResult(response.data);
            setPlainDomainSubmitted(false);
        }
    }, [contractAddress, isDomainHashed, plainDomain, plainDomainSubmitted]);

    useEffect(() => {
        verifyTesc();
    }, [contractAddress, plainDomainSubmitted, verifyTesc]);

    useEffect(() => {
        if(location.state){
            handleChangeAddress(location.state.contractAddress);
        } 
    }, []);


    const handleChangeAddress = async (address) => {
        // resetValues();
        setContractAddress(address);
        if (address.substring(0, 2) === '0x' && address.length === 42) {
            try {
                setVerifResult(null);
                await fetchTescData(address);
            } catch (err) {
                console.log(err);
            }
        }
    };

    const handleSubmitAddress = async (e) => {
        e.preventDefault();
        handleChangeAddress(contractAddress);
    };

    const handlePlainDomainEntered = async (e) => {
        e.preventDefault();
        setVerifResult(null);
        setPlainDomainSubmitted(true);
    };

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).map(([flagName, i]) => (
            <div key={i} style={{ paddingBottom: '5px' }}>
                <Checkbox
                    checked={!!flags.get(i)}
                    label={flagName}
                    disabled
                />
            </div>
        ));
    };

    return (
        <div>
            <h2>Inspect TeSC</h2>
            <div centered='true' style={{ marginBottom: '50px', marginTop: '50px', textAlign: 'center' }}>
                <Form onSubmit={handleSubmitAddress}>
                    <Form.Field>
                        <Input
                            value={contractAddress}
                            label='TeSC Address'
                            placeholder='0x254dffcd3277c0b1660f6d42efbb754edababc2b'
                            onChange={e => { handleChangeAddress(e.target.value); }}
                            size='large'
                            icon='search'
                            style={{ width: '75%' }}
                        />
                    </Form.Field>
                </Form>
            </div>
            <Grid>
                <Grid.Row>
                    {
                        domainFromChain && expiry && signature && flags &&
                        (
                            <Grid.Column width={10}>
                                <Table basic='very' celled collapsing>
                                    <Table.Body>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Domain</b>
                                            </Table.Cell>
                                            <Table.Cell>{domainFromChain}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Expiry</b>
                                            </Table.Cell>
                                            <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Flags</b>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {renderFlagCheckboxes()}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Signature</b>
                                            </Table.Cell>
                                            <Table.Cell style={{ wordBreak: 'break-all' }}>
                                                {signature}
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Body>

                                </Table>

                            </Grid.Column>

                        )
                    }
                    <Grid.Column width={6} centered='true'>
                        {domainFromChain && signature &&
                            (
                                <Card style={{ width: '100%' }}>
                                    <Card.Content header="Verification" />
                                    <Card.Content>
                                        <Dimmer active={(plainDomainSubmitted && !verifResult)
                                            || (!isDomainHashed && !verifResult)} inverted>
                                            <Loader content='Verifying...' />
                                        </Dimmer>
                                        {isDomainHashed &&
                                            (
                                                <Form onSubmit={handlePlainDomainEntered}>
                                                    <Form.Field>
                                                        <label>Original domain</label>
                                                        <Input
                                                            value={plainDomain}
                                                            placeholder='www.mysite.com'
                                                            onChange={e => setPlainDomain(e.target.value)}
                                                            size='large'
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Form.Field>
                                                </Form>

                                            )
                                        }
                                        {verifResult && (
                                            <div style={{ textAlign: 'center' }}>
                                                {
                                                    verifResult.verified ?
                                                        (
                                                            <div>
                                                                <Icon name="checkmark" circular={true} color="green" size='big' style={{ marginTop: '10px' }} />
                                                                <br />
                                                                <Label basic={true} color='green' size='large' style={{ marginTop: '10px' }}>{verifResult.reason}</Label>
                                                            </div>

                                                        ) :
                                                        (
                                                            <div>
                                                                <Icon name="warning sign" basic={true} color="red" size='huge' style={{ marginTop: '10px' }} />
                                                                <br />
                                                                <Label basic={true} color='red' size='large' style={{ marginTop: '10px' }}>{verifResult.reason}</Label>
                                                            </div>
                                                        )
                                                }
                                            </div>
                                        )}
                                    </Card.Content>
                                </Card>
                            )
                        }
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div >
    );
};

export default TeSCInspect;