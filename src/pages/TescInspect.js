import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Input, Loader, Icon, Label, Grid, Card, Form, Dimmer, Popup, Button, Modal, Segment, Header, Checkbox, Image } from 'semantic-ui-react';
import BitSet from 'bitset';
import axios from 'axios';
import moment from 'moment';

import AppContext from '../appContext';
import { FLAGS, hexStringToBitSet, isValidContractAddress } from '../utils/tesc';
import { extractAxiosErrorMessage } from '../utils/formatError';
import { toggleFavourite, getLocalTescs, save } from '../utils/storage';
import { buildNegativeMsg } from "../components/FeedbackMessage";
import SearchBox from "../components/SearchBox";
import DeploymentForm from "../components/tescNew/DeploymentForm";
import PageHeader from "../components/PageHeader";
import TescDataTable from "../components/tesc/TescDataTable";
import TableOverview, { COL } from "../components/TableOverview";
import SubEndorsementAddition from "../components/tescInspect/SubEndorsementAddition";
import ButtonRegistryAddRemove from "../components/ButtonRegistryAddRemove";

const TeSCInspect = ({ location }) => {
    const { web3, account, showMessage } = useContext(AppContext);
    window.web3 = web3;
    const [contractAddress, setContractAddress] = useState('');
    const [contractOwner, setContractOwner] = useState('');
    const [domainFromChain, setDomainFromChain] = useState('');
    const [expiry, setExpiry] = useState('');
    const [signature, setSignature] = useState('');
    const [fingerprint, setFingerprint] = useState('');
    const [flags, setFlags] = useState(new BitSet('0x00'));
    const [isDomainHashed, setIsDomainHashed] = useState(null);
    const [typedInDomain, setTypedInDomain] = useState('');
    const [isPlainDomainSubmitted, setIsPlainDomainSubmitted] = useState(false);
    const [curVerifResult, setCurVerifResult] = useState(null);
    const [isFavourite, setIsFavourite] = useState(null);
    const locationStateAddress = useRef(null);
    const localTescs = useRef({});
    const hasSentVerif = useRef(false);


    const [endorsers, setEndorsers] = useState(null);

    const [loading, setLoading] = useState(false);


    const handleToggleFavourite = () => {
        const updatedTescs = toggleFavourite({ account, contractAddress, domain: domainFromChain, expiry });
        setIsFavourite(updatedTescs[contractAddress] ? updatedTescs[contractAddress].isFavourite : false);
        localTescs.current = updatedTescs;
    };

    const assignContractData = useCallback((contract) => {
        const flagsHex = contract.flags;
        console.log("Flaghex", flagsHex);
        setIsDomainHashed(!!(new BitSet(flagsHex)).get(FLAGS.DOMAIN_HASHED + 1));
        setFlags(hexStringToBitSet(flagsHex));

        setDomainFromChain(contract.domain);
        setExpiry(contract.expiry);
        setSignature(contract.signature);
        setFingerprint(contract.fingerprint);

        setContractOwner(contract.owner);

        if(!localTescs.current[contract.contractAddress]) {
            console.log('contract', contract)
            const {subendorsements, ...rest} = contract
            localTescs.current[contract.contractAddress] = {...rest, createdAt: moment().format('DD/MM/YYYY HH:mm')};
        }

        if (contract.owner.toLowerCase() === account.toLowerCase()) {
            localTescs.current[contract.contractAddress].own = true;
            save(localTescs.current, account);
        }

    }, [account]);

    const verifyTesc = useCallback(async (address) => {
        console.log('address', address);
        console.log('curVerifResult', curVerifResult);
        const isRepeated = curVerifResult && (curVerifResult.target === address) && !curVerifResult.message.includes('Domain in TeSC is hashed');
        if (!isRepeated &&
            !hasSentVerif.current &&
            (typedInDomain ? isPlainDomainSubmitted : true) &&
            isValidContractAddress(address)
        ) {
            let result;
            let response;
            try {
                clearDisplayData();
                setLoading(true)
                hasSentVerif.current = true;
                console.log('sending req...', typedInDomain);
                response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/verify/${address}`, {
                    params: { plainDomain: typedInDomain },
                    timeout: 10000
                });


                console.log('>>> VERIF_RESULT', response);
                result = response.data;

                if (!response.data.message.includes('Domain in TeSC is hashed')) {
                    setCurVerifResult({ target: address, ...result });
                }


                if (result.endorsers && result.endorsers.length > 0) {
                    setEndorsers(result.endorsers);
                } else if (result.contract) {
                    // await fetchTescData(address);
                    assignContractData(result.contract);
                } else {
                    throw new Error(`Unknow result from backend server: ${result}`);
                }

            } catch (error) {
                console.log(error);
                const msg = extractAxiosErrorMessage({ error, subject: typedInDomain ? typedInDomain : '' });
                showMessage(buildNegativeMsg({
                    header: `Unable to verify contract ${address}`,
                    msg,
                }));
            }
            console.log('---------------------------------------------------------');
            setIsPlainDomainSubmitted(false);
            hasSentVerif.current = false;
            setLoading(false)
        }
    }, [isPlainDomainSubmitted, typedInDomain, showMessage, curVerifResult, assignContractData]);

    useEffect(() => {
        if (isValidContractAddress(contractAddress)) {
            verifyTesc(contractAddress);
        }
    }, [verifyTesc, contractAddress]);

    const handleChangeAddress = useCallback(async (address) => {
        clearDisplayData();
        setContractAddress(address);
        setLoading(true);
        if (isValidContractAddress(address)) {
            setIsFavourite(localTescs.current[address] ? localTescs.current[address].isFavourite : false);
            console.log('handleChangeAddress');
            await verifyTesc(address);
        }
        setLoading(false);
    }, [verifyTesc]);

    useEffect(() => {
        if (Object.keys(localTescs.current).length === 0) {
            localTescs.current = getLocalTescs(account);
            showMessage(null);
        }

        if (location.state && location.state.contractAddress !== locationStateAddress.current) {
            handleChangeAddress(location.state.contractAddress);
            locationStateAddress.current = location.state.contractAddress;
        }

    }, [account, showMessage, location.state, handleChangeAddress, locationStateAddress, web3]);

    const clearDisplayData = () => {
        setDomainFromChain('');
        setExpiry('');
        setFlags(new BitSet('0x00'));
        setSignature('');
        setTypedInDomain('');
        setIsPlainDomainSubmitted(false);
        setEndorsers(null);
    };

    const handleSubmitAddress = async (e) => {
        e.preventDefault();
        try {
            setCurVerifResult(null);
            await verifyTesc(contractAddress);
        } catch (err) {
            showMessage(buildNegativeMsg({
                header: 'Invalid smart contract address',
                msg: err.message
            }));
        }
    };

    const handleEnterOriginalDomain = async (e) => {
        e.preventDefault();
        setIsPlainDomainSubmitted(true);
        verifyTesc(contractAddress);
    };

    const handleCloseTescUpdateModal = async (e) => {
        showMessage(null);
        setCurVerifResult(null);
        await verifyTesc(contractAddress);
    };



    return (
        <div>
            <PageHeader
                title='Inspect TeSC'
            />
            <SearchBox
                value={contractAddress}
                label='TeSC Address'
                onChange={handleChangeAddress}
                placeholder='Contract address e.g. 0x123456789abcdf...'
                onSubmit={handleSubmitAddress}
                icon='search'
                validInput={true}
            />
            <div>
                {isValidContractAddress(contractAddress) && !endorsers && !loading &&
                    <Grid style={{ margin: '0 auto' }}>
                        <Grid.Row>
                            {!endorsers && domainFromChain && expiry && signature && flags && (
                                <Grid.Column width={10}>
                                    <Segment style={{ paddingBottom: '4em' }}>
                                        <Header as='h3' content='Contract Data' />
                                        <TescDataTable
                                            data={{ contractAddress, domain: domainFromChain, expiry, flags, signature, fingerprint }}
                                        />
                                        <div style={{ marginTop: '2em' }}>
                                            {account === contractOwner && (
                                                <Modal
                                                    closeIcon
                                                    trigger={<Button basic primary style={{ float: 'right' }}>Update TeSC</Button>}
                                                    onClose={handleCloseTescUpdateModal}
                                                    style={{ borderRadius: '20px', height: '80%', width: '75%' }}
                                                >
                                                    <Modal.Header style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                                        Update TLS-endorsed Smart Contract
                                                    </Modal.Header>
                                                    <Modal.Content style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                                                        <DeploymentForm
                                                            initInputs={{
                                                                contractAddress,
                                                                domain: domainFromChain,
                                                                expiry, 
                                                                flags,
                                                                signature,
                                                                fingerprint,
                                                            }}
                                                            typedInDomain={typedInDomain}
                                                            onMatchOriginalDomain={setTypedInDomain}
                                                        />
                                                    </Modal.Content>
                                                </Modal>
                                            )}

                                            <ButtonRegistryAddRemove
                                                verbose
                                                contractAddress={contractAddress}
                                                domain={domainFromChain}
                                                isOwner={account === contractOwner}
                                                style={{ float: 'left' }}
                                            />

                                            <Popup inverted
                                                content={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                                                trigger={
                                                    <Button
                                                        basic
                                                        color='pink'
                                                        icon={isFavourite ? 'heart' : 'heart outline'}
                                                        className={isFavourite ? "favourite" : "notFavourite"}
                                                        onClick={() => handleToggleFavourite()}
                                                        content={isFavourite ? 'Unfavourite' : 'Favourite'}
                                                        style={{ float: 'left' }}
                                                    />
                                                }
                                            />

                                        </div>
                                    </Segment>
                                </Grid.Column>
                            )}

                            <Grid.Column width={6} centered='true'>
                                {domainFromChain && signature &&
                                    (
                                        <Card style={{ width: '100%' }}>
                                            <Card.Content header="Verification" />
                                            <Card.Content>
                                                <Dimmer active={(isPlainDomainSubmitted && !curVerifResult)
                                                    || (!isDomainHashed && !curVerifResult)} inverted>
                                                    <Loader content='Verifying...' />
                                                </Dimmer>
                                                {isDomainHashed &&
                                                    (
                                                        <Form onSubmit={handleEnterOriginalDomain}>
                                                            <Form.Field>
                                                                <label>Original domain</label>
                                                                <Input
                                                                    value={typedInDomain}
                                                                    placeholder='www.mysite.com'
                                                                    onChange={e => setTypedInDomain(e.target.value)}
                                                                    size='large'
                                                                    style={{ width: '100%' }}
                                                                />
                                                            </Form.Field>
                                                        </Form>
                                                    )
                                                }
                                                {curVerifResult && (
                                                    <div style={{ textAlign: 'center' }}>
                                                        {
                                                            curVerifResult.verified ?
                                                                (
                                                                    <div>
                                                                        <Icon name="checkmark" circular={true} color="green" size='big' style={{ marginTop: '10px' }} />
                                                                        <br />
                                                                        <Label basic color='green' size='large' style={{ marginTop: '10px' }}>{curVerifResult.message}</Label>
                                                                    </div>

                                                                ) :
                                                                (
                                                                    <div>
                                                                        <Icon name="warning sign" color="red" size='huge' style={{ marginTop: '10px' }} />
                                                                        <br />
                                                                        <Label basic color='red' size='large' style={{ marginTop: '10px' }}>{curVerifResult.message}</Label>
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

                        {!endorsers &&
                            <Grid.Row style={{ width: `${1000 / 16}%` }}>
                                <Grid.Column width={10}>
                                    {!!flags.get(FLAGS.ALLOW_SUBENDORSEMENT) && isValidContractAddress(contractAddress) && isValidContractAddress(contractOwner) &&
                                        <SubEndorsementAddition
                                            contractAddress={contractAddress}
                                            owner={contractOwner}
                                            verified={curVerifResult ? curVerifResult.verified : false}
                                        />
                                    }
                                </Grid.Column>
                            </Grid.Row>
                        }
                    </Grid>
                }
                {endorsers && !loading &&
                    <>
                        <p>The contract <b>{contractAddress}</b> is not a TLS-endorsed Smart Contract (TeSC) but is subendorsed by <b className='main-color'>{endorsers.length}</b> TeSCs</p>

                        <TableOverview
                            cols={new Set([COL.VERIF, COL.FAV])}
                            rowData={endorsers}
                        />
                    </>
                }
                {loading &&
                    <Segment basic>
                        <Dimmer active inverted>
                            <Loader size='large'>Loading</Loader>
                        </Dimmer>

                        <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
                    </Segment>
                }
            </div>
        </div>
    );
};

export default TeSCInspect;