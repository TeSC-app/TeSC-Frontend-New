import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Input, Loader, Icon, Label, Grid, Card, Form, Dimmer, Popup, Button, Modal, Segment, Header, Checkbox } from 'semantic-ui-react';
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
import SubEndorsementAddition from "../components/tescInspect/SubEndorsementAddition";
import moment from 'moment';

const TeSCInspect = ({ location }) => {
    const { web3, showMessage, loadStorage } = useContext(AppContext);
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
    const [tescs, setTescs] = useState(loadStorage());

    const [isSubendorsement, setIsSubendorsement] = useState(false);

    useEffect(() => {
        setTescs(loadStorage());
    }, [loadStorage]);

    useEffect(() => {
        if (!!flags.get(FLAGS.DOMAIN_HASHED) && typedInDomain && web3.utils.sha3(typedInDomain).substring(2) === domainFromChain && !verifResult) {
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
        let tescsNew = tescs ? tescs : [];
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
            tescsNew.push({ contractAddress: address, domain: domainFromChain, expiry, isFavourite: true, own: false, createdAt: moment().format('DD/MM/YYYY HH:mm') });
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
            await verifyTesc();
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

    const handleCloseTescUpdate = async (e) => {
        showMessage(null);
        console.log("CONTRACT ADDRESS", contractAddress);
        await fetchTescData(contractAddress);
        await verifyTesc();
    };

    useEffect(() => {
        setTescs(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)));
    }, [web3.currentProvider.selectedAddress]);

    const handleToggleSubendorsement = () => {
        setIsSubendorsement(!isSubendorsement);
        clearResults();
        if (isValidContractAddress(contractAddress)) {
            const res = axios.get('/verify/');
        }
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
            >
                <div style={{width: '75%', marginLeft:'12.5%', textAlign: 'initial'}}>
                    <Checkbox
                        checked={isSubendorsement}
                        onClick={e => handleToggleSubendorsement()}
                        label='Subendorsement '
                        toggle
                    />
                    <Popup
                        inverted
                        content={`If you don't know the address of the master TeSC that endorses the contract at the address above and this endorsed contract should be subject to inspection, you can activate this option. Note that, it could take some time to finish this type of inspection since we have to scan through the TeSC Registry to search for the master contract.`}
                        trigger={<Icon name='question circle' />}
                    />
                </div>
            </SearchBox>
            <Grid style={{ margin: '0 auto' }}>
                <Grid.Row>
                    {domainFromChain && expiry && signature && flags && (
                        <Grid.Column width={10}>
                            <Segment style={{ paddingBottom: '4em' }}>
                                <Header as='h3' content='Contract Data' />
                                <TescDataTable
                                    data={{ contractAddress, domain: domainFromChain, expiry, flags, signature, fingerprint }}
                                />
                                <div style={{ marginTop: '0.5em' }}>
                                    {web3.currentProvider.selectedAddress === contractOwner && (
                                        <Modal
                                            closeIcon
                                            trigger={<Button basic primary style={{ float: 'right' }}>Update TeSC</Button>}
                                            onClose={handleCloseTescUpdate}
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
                                                        expiry, flags,
                                                        signature,
                                                        fingerprint: fingerprint.substring(2),
                                                    }}
                                                    typedInDomain={typedInDomain}
                                                    onMatchOriginalDomain={setTypedInDomain}
                                                />
                                            </Modal.Content>
                                        </Modal>
                                    )}
                                    <Popup content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                                        trigger={
                                            <Button
                                                basic
                                                color='pink'
                                                icon={tescIsInFavourites ? 'heart' : 'heart outline'}
                                                className={tescIsInFavourites ? "favourite" : "notFavourite"}
                                                onClick={() => addRemoveFavourites(contractAddress)}
                                                content={tescIsInFavourites ? 'Unfavourite' : 'Favourite'}
                                                style={{ float: 'right' }}
                                            />}
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
                </Grid.Row>

                <Grid.Row style={{ width: `${1000 / 16}%` }}>
                    <Grid.Column width={10}>
                        {!!flags.get(FLAGS.ALLOW_SUBENDORSEMENT) && contractAddress && contractOwner &&
                            <SubEndorsementAddition
                                contractAddress={contractAddress}
                                owner={contractOwner}
                                verified={verifResult ? verifResult.verified : false}
                            />
                        }
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div >
    );
};

export default TeSCInspect;