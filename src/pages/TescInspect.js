import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Input, Loader, Icon, Label, Grid, Card, Form, Dimmer, Popup, Button, Modal, Segment, Header, Checkbox } from 'semantic-ui-react';
import BitSet from 'bitset';
import axios from 'axios';
import AppContext from '../appContext';
import { FLAGS, hexStringToBitSet, isValidContractAddress } from '../utils/tesc';
import { extractAxiosErrorMessage } from '../utils/formatError';
import TeSC from '../ethereum/build/contracts/ERCXXXImplementation.json';
import { buildNegativeMsg } from "../components/FeedbackMessage";
import SearchBox from "../components/SearchBox";
import DeploymentForm from "../components/tescNew/DeploymentForm";
import PageHeader from "../components/PageHeader";
import TescDataTable from "../components/tesc/TescDataTable";
import SubEndorsementAddition from "../components/tescInspect/SubEndorsementAddition";
import moment from 'moment';

const TeSCInspect = ({ location }) => {
    const { web3, account, showMessage, loadStorage } = useContext(AppContext);
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
    const [isFavourite, setIsInFavourites] = useState(null);
    const tescs = useRef({});

    const [isSubendorsement, setIsSubendorsement] = useState(false);


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

            const owner = await contract.methods.owner().call()
            setContractOwner(owner);
            if(owner.toLowerCase() === account.toLowerCase()) {
                tescs.current[address].own = true;                
            }

        } catch (err) {
            showMessage(buildNegativeMsg({
                header: 'Unable to read data from smart contract',
                msg: err.message
            }));
        };
    }, [showMessage, account, web3.eth.Contract]);

    const toggleFavourite = () => {
        let found = tescs.current[contractAddress] && Object.keys(tescs.current[contractAddress]).length > 0;
        if (found) {
            const isFav = !tescs.current[contractAddress].isFavourite;
            setIsInFavourites(isFav);
            tescs.current[contractAddress].isFavourite = isFav;
            if(!tescs.current[contractAddress].isFavourite && !tescs.current[contractAddress].own) {
                delete tescs.current[contractAddress]
            }
        } else {
            tescs.current[contractAddress] = { domain: domainFromChain, expiry, isFavourite: true, own: false, createdAt: moment().format('DD/MM/YYYY HH:mm') };
            setIsInFavourites(true);
        }
        const tescArray = Object.entries(tescs.current).map(entry => {
            entry[1].contractAddress = entry[0];
            return entry[1];
        });
        localStorage.setItem(account, JSON.stringify(tescArray));
    };

    const verifyTesc = useCallback(async () => {
        const isRepeated = verifResult && verifResult.contract && verifResult.contract.contractAddress.includes(contractAddress);
        if (!isRepeated &&
            isDomainHashed !== null &&
            (!isDomainHashed || (isDomainHashed && isPlainDomainSubmitted)) &&
            isValidContractAddress(contractAddress)
        ) {
            try {
                console.log('contractAddress', contractAddress);
                console.log('typedInDomain', typedInDomain);
                const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/verify/${contractAddress}`, {
                    params: { plainDomain: typedInDomain }
                });
                console.log('VERIF_RESULT', response);
                setVerifResult(response.data);
                setIsPlainDomainSubmitted(false);
            } catch (error) {
                const msg = extractAxiosErrorMessage({ error, subject: isDomainHashed ? typedInDomain : domainFromChain });
                showMessage(buildNegativeMsg({
                    header: `Unable to verify contract ${contractAddress}`,
                    msg,
                }));
            }
        }
    }, [contractAddress, domainFromChain, isDomainHashed, typedInDomain, isPlainDomainSubmitted, showMessage, verifResult]);

    useEffect(() => {
        verifyTesc();
    }, [verifyTesc]);

    const handleChangeAddress = useCallback(async (address) => {
        console.log('addresssssss', address);
        setContractAddress(address);
        if (isValidContractAddress(address)) {
            try {
                setIsInFavourites(tescs.current[address] ? tescs.current[address].isFavourite : false);
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
        if (Object.keys(tescs.current).length === 0) {
            const tescArray = loadStorage();
            console.log('tescArray', tescArray);
            for (const tesc of tescArray) {
                const { contractAddress, ...rest } = tesc;
                tescs.current[contractAddress] = rest;
            }
            showMessage(null);
            if (location.state) {
                handleChangeAddress(location.state.contractAddress);
            }
        }
    }, [loadStorage, showMessage, location.state, handleChangeAddress]);

    const clearResults = () => {
        setDomainFromChain('');
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
            console.log('submit with ', contractAddress);
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
        verifyTesc();
    };

    const handleCloseTescUpdate = async (e) => {
        showMessage(null);
        console.log("CONTRACT ADDRESS", contractAddress);
        await fetchTescData(contractAddress);
        await verifyTesc();
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
            {isValidContractAddress(contractAddress) &&
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
                                        {account === contractOwner && (
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
                                        <Popup content={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                                            trigger={
                                                <Button
                                                    basic
                                                    color='pink'
                                                    icon={isFavourite ? 'heart' : 'heart outline'}
                                                    className={isFavourite ? "favourite" : "notFavourite"}
                                                    onClick={toggleFavourite}
                                                    content={isFavourite ? 'Unfavourite' : 'Favourite'}
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
                            {!!flags.get(FLAGS.ALLOW_SUBENDORSEMENT) && isValidContractAddress(contractAddress) && isValidContractAddress(contractOwner) &&
                                <SubEndorsementAddition
                                    contractAddress={contractAddress}
                                    owner={contractOwner}
                                    verified={verifResult ? verifResult.verified : false}
                                />
                            }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            }
        </div>
    );
};

export default TeSCInspect;