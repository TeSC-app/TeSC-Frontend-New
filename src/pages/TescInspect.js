import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Input, Loader, Icon, Label, Grid, Card, Form, Dimmer, Popup, Button, Modal } from 'semantic-ui-react';
import BitSet from 'bitset';
import axios from 'axios';
import AppContext from '../appContext';
import { FLAGS, hexStringToBitSet, isValidContractAddress } from '../utils/tesc';
import TeSC from '../ethereum/build/contracts/ERCXXXImplementation.json';
import { buildNegativeMsg } from "../components/FeedbackMessage";
import SearchBox from "../components/SearchBox";
import DeploymentForm from "../components/tescNew/DeploymentForm";
import PageHeader from "../components/PageHeader";
import TescDataTable from "../components/tesc/TescDataTable";
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';

const TeSCInspect = ({ location }) => {
    const { web3, showMessage } = useContext(AppContext);
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
    const [verifResult, setVerifResult] = useState(null);
    const [tescIsInFavourites, setTescsIsInFavourites] = useState(false);
    const [tescs, setTescs] = useState(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)));
    const [contractRegistry, setContractRegistry] = useState(null)

    useEffect(() => {
        setTescs(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)));
        const contractRegistry = new web3.eth.Contract(
            TeSCRegistry.abi,
            process.env.REACT_APP_REGISTRY_ADDRESS,
        );
        setContractRegistry(contractRegistry)
    }, [web3.currentProvider.selectedAddress, web3.eth.Contract]);
    
    useEffect(() => {
        if(!!flags.get(FLAGS.DOMAIN_HASHED) && typedInDomain && web3.utils.sha3(typedInDomain).substring(2) === domainFromChain && !verifResult) {
            setIsPlainDomainSubmitted(true);
        }
    }, [typedInDomain, domainFromChain, flags, verifResult, web3.utils]);

    const fetchTescData = useCallback(async (address) => {
        showMessage(null);
        try {
            const contract = new web3.eth.Contract(TeSC.abi, address);

            const flagsHex = await contract.methods.getFlags().call();
            console.log("Flaghex", flagsHex);
            setIsDomainHashed(!!(new BitSet(flagsHex)).get(FLAGS.DOMAIN_HASHED + 1));
            setFlags(hexStringToBitSet(flagsHex));

            setDomainFromChain(await contract.methods.getDomain().call());
            setExpiry(await contract.methods.getExpiry().call());
            setSignature(await contract.methods.getSignature().call());
            setFingerprint(await contract.methods.getFingerprint().call());

            setContractOwner((await contract.methods.owner().call()).toLowerCase());

            for (const tesc of tescs) {
                if (tesc.contractAddress === contractAddress) {
                    setTescsIsInFavourites(tesc.isFavourite);
                    break;
                }
            }

        } catch (err) {
            showMessage(buildNegativeMsg({
                header: 'Unable to read data from smart contract',
                msg: err.message
            }));
        };
    }, [contractAddress, showMessage, tescs, web3.eth.Contract]);

    const addRemoveFavourites = async (address) => {
        let tescsNew;
        tescs ? tescsNew = tescs : tescsNew = [];
        let found = false;
        for (const tesc of tescsNew) {
            if (tesc.contractAddress === address) {
                found = true;
                if (tesc.isFavourite) {
                    tesc.isFavourite = false;
                    setTescsIsInFavourites(false);
                } else {
                    tesc.isFavourite = true;
                    setTescsIsInFavourites(true);
                }
                localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
                break;
            }
        }
        if (!found) {
            const isInRegistry = contractRegistry ? await contractRegistry.methods.isContractRegistered(address).call() : false
            tescsNew.push({ contractAddress: address, domain: domainFromChain, expiry, isFavourite: true, own: false, isInRegistry });
            localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
            setTescsIsInFavourites(true);
        }
    };

    const verifyTesc = useCallback(async () => {
        if (isDomainHashed !== null && (!isDomainHashed || (isDomainHashed && isPlainDomainSubmitted))) {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/isVerified/${contractAddress.toLowerCase()}`, {
                params: { plainDomain: typedInDomain }
            });
            console.log('VERIF_RESULT', response);
            setVerifResult(response.data);
            setIsPlainDomainSubmitted(false);
        }
    }, [contractAddress, isDomainHashed, typedInDomain, isPlainDomainSubmitted]);

    useEffect(() => {
        verifyTesc();
    }, [contractAddress, isPlainDomainSubmitted, verifyTesc]);

    const handleChangeAddress = useCallback(async (address) => {
        setContractAddress(address);
        if (isValidContractAddress(address)) {
            try {
                await fetchTescData(address);
            } catch (err) {
                showMessage(buildNegativeMsg({
                    header: 'Unable to retrieve smart contract data',
                    msg: err.message
                }));
                console.log(err);
            }
        }
    }, [fetchTescData, showMessage]);

    useEffect(() => {
        showMessage(null);
        if (location.state) {
            handleChangeAddress(location.state.contractAddress);
        }
    }, [handleChangeAddress, location.state, showMessage]);

    const clearResults = () => {
        setDomainFromChain(null);
        setExpiry('');
        setFlags(new BitSet('0x00'));
        setSignature('');
        setTypedInDomain('');
        setVerifResult(null);
    };

    const handleSubmitAddress = async (e) => {
        e.preventDefault();
        clearResults();
        try {
            isValidContractAddress(contractAddress, true);
            await fetchTescData(contractAddress);

        } catch (err) {
            showMessage(buildNegativeMsg({
                header: 'Invalid smart contract address',
                msg: err.message
            }));
        }
    };

    const handleEnterOriginalDomain = async (e) => {
        e.preventDefault();
        setVerifResult(null);
        setIsPlainDomainSubmitted(true);
    };

    const handleCloseTescUpdate = (e) => {
        showMessage(null);
        console.log("CONTRACT ADDRESS", contractAddress);
        fetchTescData(contractAddress);
        verifyTesc();
    };


    useEffect(() => {
        setTescs(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)));
    }, [web3.currentProvider.selectedAddress]);

    return (
        <div>
            <PageHeader
                title='Inspect TeSC'
            />
                <SearchBox 
                    value={contractAddress}
                    label='TeSC Address'
                    onChange={handleChangeAddress}
                    placeholder='0x254dffcd3277c0b1660f6d42efbb754edababc2b'
                    onSubmit={handleSubmitAddress}
                    icon='search'
                    validInput={true}
                />
            <Grid style={{ margin: '0 auto' }}>
                <Grid.Row>
                    {
                        domainFromChain && expiry && signature && flags &&
                        (
                            <Grid.Column width={10}>
                                <TescDataTable
                                    data={{ contractAddress, domain: domainFromChain, expiry, flags, signature, fingerprint }}
                                />
                            </Grid.Column>
                        )
                    }

                    <Grid.Column width={6} centered='true'>
                        {domainFromChain && signature &&
                            (
                                <Card style={{ width: '100%' }}>
                                    <Card.Content header="Verification" />
                                    <Card.Content>
                                        <Dimmer active={(isPlainDomainSubmitted && !verifResult)
                                            || (!isDomainHashed && !verifResult)} inverted>
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
                                        {verifResult && (
                                            <div style={{ textAlign: 'center' }}>
                                                {
                                                    verifResult.verified ?
                                                        (
                                                            <div>
                                                                <Icon name="checkmark" circular={true} color="green" size='big' style={{ marginTop: '10px' }} />
                                                                <br />
                                                                <Label basic color='green' size='large' style={{ marginTop: '10px' }}>{verifResult.reason}</Label>
                                                            </div>

                                                        ) :
                                                        (
                                                            <div>
                                                                <Icon name="warning sign" color="red" size='huge' style={{ marginTop: '10px' }} />
                                                                <br />
                                                                <Label basic color='red' size='large' style={{ marginTop: '10px' }}>{verifResult.reason}</Label>
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

                    {domainFromChain && expiry && signature && flags && (
                        <Grid.Row style={{ width: `${1000 / 16}%` }}>
                            {web3.currentProvider.selectedAddress === contractOwner && (
                                <Grid.Column width={10} >
                                    <Modal
                                        closeIcon
                                        trigger={<Button basic primary style={{ float: 'right' }}>Update TeSC</Button>}
                                        onClose={handleCloseTescUpdate}
                                        style={{borderRadius: '20px', height: '80%', width: '75%'}}
                                    >
                                        <Modal.Header style={{borderTopLeftRadius: '15px', borderTopRightRadius: '15px'}}>
                                            Update TLS-endorsed Smart Contract
                                        </Modal.Header>
                                        <Modal.Content style={{borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px'}}>
                                            <DeploymentForm
                                                initInputs={{ 
                                                    contractAddress, 
                                                    domain: domainFromChain, 
                                                    expiry, flags, 
                                                    signature, 
                                                    fingerprint: fingerprint.substring(2),
                                                }}
                                                typedInDomain={typedInDomain}
                                                onMatchOriginalDomain={setTypedInDomain}
                                            />
                                        </Modal.Content>
                                        {/* <Dimmer active={true}>
                                            <Loader indeterminate content='Waiting for transaction to finish...' />
                                        </Dimmer> */}
                                    </Modal>
                                </Grid.Column>
                            )}
                            <Grid.Column width={6}>
                                <Popup content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                                    trigger={
                                        <Button
                                            basic
                                            color='pink'
                                            icon={tescIsInFavourites? 'heart' : 'heart outline'}
                                            className={tescIsInFavourites ? "favourite" : "notFavourite"}
                                            onClick={() => addRemoveFavourites(contractAddress)}
                                            content={tescIsInFavourites ? 'Unfavourite' : 'Favourite'}
                                            style={{ float: 'right'}}
                                        />} />
                            </Grid.Column>
                        </Grid.Row>
                    )}
                </Grid.Row>

            </Grid>
        </div>
    );
};

export default TeSCInspect;