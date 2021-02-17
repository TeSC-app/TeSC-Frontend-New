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
import { getLocalTescs, save, toggleFavourite } from '../utils/storage';
import { FLAGS, hexStringToBitSet, isValidContractAddress } from '../utils/tesc';


const TeSCInspect = ({ location }) => {
    const { web3, account } = useContext(AppContext);
    window.web3 = web3;
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
    const localTescs = useRef({});
    const hasSentVerifReq = useRef(false);


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
        setExpiry(parseInt(contract.expiry));
        setSignature(contract.signature);
        setFingerprint(contract.fingerprint);

        setContractOwner(contract.owner);

        if (!localTescs.current[contract.contractAddress]) {
            console.log('contract', contract);
            const { subendorsements, ...rest } = contract;
            localTescs.current[contract.contractAddress] = { ...rest, createdAt: moment().format('DD/MM/YYYY HH:mm') };
        }

        if (contract.owner.toLowerCase() === account.toLowerCase()) {
            localTescs.current[contract.contractAddress].own = true;
            save(localTescs.current, account);
        }

    }, [account]);

    const verifyTesc = useCallback(async (address, originalDomain='', runManually = false) => {
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
                    // await fetchTescData(address);
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
            setIsFavourite(localTescs.current[address] ? localTescs.current[address].isFavourite : false);
            console.log('handleChangeAddress');
            await verifyTesc(address);
        }
        setLoading(false);
    }, [verifyTesc]);

    useEffect(() => {
        if (Object.keys(localTescs.current).length === 0) {
            localTescs.current = getLocalTescs(account);
        }

        if (location.state && location.state.contractAddress !== locationStateAddress.current) {
            handleChangeAddress(location.state.contractAddress);
            locationStateAddress.current = location.state.contractAddress;
        }

    }, [account, location.state, handleChangeAddress, locationStateAddress, web3]);

    const clearDisplayData = () => {
        setDomainFromChain('');
        setExpiry('');
        setFlags(new BitSet('0x00'));
        setIsDomainHashed(null);
        setSignature('');
        setOriginalDomain('');
        setEndorsers(null);
    };

    const handleSubmitAddress = async (e) => {
        e.preventDefault();
        try {
            curVerifResult ? setCurVerifResult(null) : await verifyTesc(contractAddress, originalDomain, true);
            clearDisplayData();
            setLoading(true);
            
        } catch (err) {
            toast.error(negativeMsg({
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
                                                            inputOriginalDomain={originalDomain}
                                                            onMatchOriginalDomain={handleReceiveOriginalDomainFromModal}
                                                            onTescUpdated={setIsTescUpdated}
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
                                                <Dimmer active={isVerificationRunning
                                                    || (!isDomainHashed && !curVerifResult)} inverted>
                                                    <Loader content='Verifying...' />
                                                </Dimmer>
                                                {isDomainHashed &&
                                                    (
                                                        <Form onSubmit={handleSubmitOriginalDomain}>
                                                            <Form.Field>
                                                                <label>Original domain</label>
                                                                <Input
                                                                    value={originalDomain}
                                                                    placeholder='www.mysite.com'
                                                                    onChange={e => setOriginalDomain(e.target.value)}
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