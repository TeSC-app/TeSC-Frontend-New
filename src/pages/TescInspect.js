import axios from 'axios';
import BitSet from 'bitset';
import moment from 'moment';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, Card, Dimmer, Form, Grid, Header, Icon, Image, Input, Label, Loader, Modal, Popup, Segment } from 'semantic-ui-react';
import { toast } from 'react-toastify';

import AppContext from '../appContext';
import ButtonRegistryAddRemove from "../components/ButtonRegistryAddRemove";
import { negativeMsg } from "../components/FeedbackMessage";
import PageHeader from "../components/PageHeader";
import SearchBox from "../components/SearchBox";
import TableOverview, { COL } from "../components/TableOverview";
import TescDataTable from "../components/tesc/TescDataTable";
import SubEndorsementAddition from "../components/tescInspect/SubEndorsementAddition";
import DeploymentForm from "../components/tescNew/DeploymentForm";
import { extractAxiosErrorMessage } from '../utils/formatError';
import { getLocalTesc, updateTeSC, toggleFavourite } from '../utils/storage';
import { FLAGS, hexStringToBitSet, isValidContractAddress } from '../utils/tesc';


const TeSCInspect = ({ location }) => {
    const { web3, account } = useContext(AppContext);
    const [contractAddress, setContractAddress] = useState('');
    const [contractOwner, setContractOwner] = useState('');
    const [domainFromChain, setDomainFromChain] = useState('');
    const [expiry, setExpiry] = useState('');
    const [signature, setSignature] = useState('');
    const [fingerprint, setFingerprint] = useState('');
    const [flags, setFlags] = useState(new BitSet('0x00'));
    const [isDomainHashed, setIsDomainHashed] = useState(null);
    const [originalDomain, setOriginalDomain] = useState('');
    const [curVerifResult, setCurVerifResult] = useState(null);
    const [isFavourite, setIsFavourite] = useState(null);
    const [isTescUpdated, setIsTescUpdated] = useState(false);
    const [isVerificationRunning, setIsVerificationRunning] = useState(false);
    const locationStateAddress = useRef(null);
    const localTesc = useRef(null);
    const hasSentVerifReq = useRef(false);


    const [endorsers, setEndorsers] = useState(null);

    const [loading, setLoading] = useState(false);


    const handleToggleFavourite = () => {
        console.log('localTesc.current', localTesc.current);
        const updatedTesc = toggleFavourite(account, localTesc.current);
        setIsFavourite(updatedTesc ? updatedTesc.isFavourite : false);
        localTesc.current = updatedTesc;
    };


    const assignContractData = useCallback((contract) => {
        const flagsHex = contract.flags;
        console.log("Flaghex", flagsHex);
        setIsDomainHashed(!!(new BitSet(flagsHex)).get(FLAGS.DOMAIN_HASHED + 1));
        setFlags(hexStringToBitSet(flagsHex));

        setDomainFromChain(contract.domain);
        setExpiry(parseInt(contract.expiry));
        setSignature(contract.signature);
        setFingerprint(contract.fingerprint);

        setContractOwner(contract.owner);

        const { subendorsements, ...rest } = contract;
        localTesc.current = getLocalTesc(account, contract.contractAddress);

        if (localTesc.current !== null) {
            localTesc.current = { ...(localTesc.current), ...rest };
        } else {
            localTesc.current = { ...rest, createdAt: moment().unix(), isFavourite: false };
        }

        if (contract.owner.toLowerCase() === account.toLowerCase()) {
            localTesc.current.own = true;
            localTesc.current.owner = account;
        }

        if (localTesc.current.own || localTesc.current.isFavourite) {
            updateTeSC(account, localTesc.current);
        }
        setIsFavourite(localTesc.current.isFavourite);
        console.log('assignContractData localTesc.current', localTesc.current);
    }, [account]);

    const verifyTesc = useCallback(async (address, originalDomain = '', runManually = false) => {
        console.log('curVerifResult', curVerifResult);
        const isRepeated = curVerifResult
            && (curVerifResult.target === address)
            && (curVerifResult.inputDomain === originalDomain)
            && !curVerifResult.message.includes('Domain in TeSC is hashed');
        console.log('isRepeated', isRepeated);
        console.log('originalDomain', originalDomain);
        try {
            if (runManually || (!isRepeated &&
                !hasSentVerifReq.current &&
                isValidContractAddress(address, true))
            ) {
                let result;
                let response;

                if (!originalDomain) {
                    clearDisplayData();
                    setLoading(true);
                    console.log('loading true');
                } else {
                    setIsVerificationRunning(true);
                }

                hasSentVerifReq.current = true;
                console.log('sending req...', originalDomain);
                response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/verify/${address}`, {
                    params: { plainDomain: originalDomain },
                    timeout: 30000
                });


                console.log('>>> VERIF_RESULT', response);
                result = response.data;

                if (!response.data.message.includes('Domain in TeSC is hashed')) {
                    setCurVerifResult({ target: address, inputDomain: `${originalDomain}`, ...result });
                }


                if (result.endorsers && result.endorsers.length > 0) {
                    setEndorsers(result.endorsers);
                } else if (result.contract) {
                    assignContractData(result.contract);
                } else {
                    throw new Error(`Unknow result from backend server: ${result}`);
                }

                setLoading(false);
                console.log('loading false');
                hasSentVerifReq.current = false;
                setIsVerificationRunning(false);
            }
        } catch (error) {
            console.log(error);
            const msg = extractAxiosErrorMessage({ error, subject: originalDomain ? originalDomain : '' });
            toast(negativeMsg({
                header: `Unable to verify contract ${address}`,
                msg,
            }));
            setIsVerificationRunning(false);
        }
        console.log('---------------------------------------------------------');

    }, [curVerifResult, assignContractData]);

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
            await verifyTesc(address);
        }
        setLoading(false);
    }, [verifyTesc]);

    useEffect(() => {
        if (!localTesc.current) {
            localTesc.current = getLocalTesc(account, contractAddress);
            console.log('localTesc assigned');
        }

        if (location.state && location.state.contractAddress !== locationStateAddress.current) {
            handleChangeAddress(location.state.contractAddress);
            locationStateAddress.current = location.state.contractAddress;
        }

    }, [account, location.state, handleChangeAddress, locationStateAddress, web3, contractAddress]);

    const clearDisplayData = () => {
        setDomainFromChain('');
        setExpiry('');
        setFlags(new BitSet('0x00'));
        setIsDomainHashed(null);
        setSignature('');
        setOriginalDomain('');
        setEndorsers(null);
        localTesc.current = null;
    };

    const handleSubmitAddress = async (e) => {
        e.preventDefault();
        try {
            if (isValidContractAddress(contractAddress, true)) {
                clearDisplayData();
                setLoading(true);
                curVerifResult ? setCurVerifResult(null) : await verifyTesc(contractAddress, originalDomain, true);
            }
        } catch (err) {
            toast(negativeMsg({
                header: 'Invalid smart contract address',
                msg: err.message
            }));
        }
    };

    const handleReceiveOriginalDomainFromModal = async (typedInDomain) => {
        setOriginalDomain(typedInDomain);
        await verifyTesc(contractAddress, typedInDomain);
    };

    const handleSubmitOriginalDomain = async (e) => {
        e.preventDefault();
        if (originalDomain) {
            setCurVerifResult(null);
            await verifyTesc(contractAddress, originalDomain, true);
        }
    };

    const handleCloseTescUpdateModal = async (e) => {
        e.preventDefault();
        console.log('isTescUpdated', isTescUpdated);
        if (isTescUpdated) {
            setCurVerifResult(null);
            clearDisplayData();
            setLoading(true);
        } else if (!isTescUpdated && isDomainHashed && originalDomain) {
            await verifyTesc(contractAddress, originalDomain);
        }
        setIsTescUpdated(false);
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
                placeholder='Inspect & Verify'
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
                                    <div className='tesc-inspect--segment'>
                                        <Header as='h3' content='Contract Data' />
                                        <TescDataTable
                                            data={{ contractAddress, domain: domainFromChain, expiry, flags, signature, fingerprint }}
                                        />
                                        <div style={{ marginTop: '2em', width: '100%' }}>
                                            {account === contractOwner && (
                                                <Modal
                                                    closeIcon
                                                    trigger={
                                                        <Button
                                                            icon='heart'
                                                            basic
                                                            color='purple'
                                                            style={{ float: 'right', marginTop: '5px' }}
                                                        >
                                                            Update TeSC
                                                        </Button>
                                                    }
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
                                                            inputOriginalDomain={originalDomain}
                                                            onMatchOriginalDomain={handleReceiveOriginalDomainFromModal}
                                                            onTescUpdated={setIsTescUpdated}
                                                        />
                                                    </Modal.Content>
                                                </Modal>
                                            )}

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
                                                        style={{ marginTop: '5px' }}
                                                    />
                                                }
                                            />

                                            <ButtonRegistryAddRemove
                                                contractAddress={contractAddress}
                                                domain={domainFromChain}
                                                isOwner={account === contractOwner}
                                            />

                                        </div>
                                    </div>
                                </Grid.Column>
                            )}

                            <Grid.Column width={6} centered='true'>
                                {domainFromChain && signature &&
                                    (
                                        <Segment id='verif-box' padded className='tesc-inspect--segment'>
                                            <Header as='h3' content="Verification" />

                                            {isDomainHashed &&
                                                (
                                                    <Form onSubmit={handleSubmitOriginalDomain}>
                                                        <Form.Field>
                                                            <Input
                                                                value={originalDomain}
                                                                placeholder='Enter original domain name'
                                                                onChange={e => setOriginalDomain(e.target.value)}
                                                                size='large'
                                                                icon='world'
                                                                style={{ width: '100%' }}

                                                                action={{
                                                                    color: 'purple',
                                                                    content: 'Domain',
                                                                }}
                                                                actionPosition='left'
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
                                            <Dimmer active={isVerificationRunning || (!isDomainHashed && !curVerifResult)} inverted>
                                                <Loader content='Verifying...' />
                                            </Dimmer>
                                        </Segment>
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
                            cols={new Set([COL.DOMAIN, COL.ADDRESS, COL.EXPIRY, COL.VERIF, COL.FAV])}
                            rowData={endorsers.map(({ contract }) => ({ contractAddress: contract.contractAddress, domain: contract.domain, expiry: contract.expiry, flags: contract.flags }))}
                        />
                    </>
                }
                {loading && (
                    <Segment basic>
                        <Dimmer active={loading} inverted>
                            <Loader size='large'>Loading...</Loader>
                        </Dimmer>

                        <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' />
                    </Segment>
                )}
            </div>
        </div>
    );
};

export default TeSCInspect;