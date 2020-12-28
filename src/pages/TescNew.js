import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button, Grid } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';
import moment from 'moment';
import BitSet from 'bitset';

import 'react-day-picker/lib/style.css';

import AppContext from '../appContext';
import FeedbackMessage, { buildNegativeMsg, buildPositiveMsg } from "../components/FeedbackMessage";
import LinkTescInspect from '../components/InternalLink';


import TeSC from '../ethereum/build/contracts/ERCXXXImplementation.json';
import {
    predictContractAddress,
    generateSignature,
    flagsTo24BytesHex,
    FLAG_POSITIONS,
} from '../utils/tesc';


const TeSCNew = () => {
    const { web3 } = useContext(AppContext);

    const [sysMsg, setSysMsg] = useState(null);
    const [contractAddress, setContractAddress] = useState('');

    const [domain, setDomain] = useState('');
    const [expiry, setExpiry] = useState(null);
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(new BitSet('0x00'));
    const [domainHashed, setDomainHashed] = useState('');

    const [privateKeyFileName, setPrivateKeyFileName] = useState('');
    const [privateKeyPEM, setPrivateKeyPEM] = useState('');
    const [deployDone, setDeployDone] = useState(false);

    const [cost, setCost] = useState(0);

    const prevExpiry = useRef(expiry);
    const prevFlags = useRef(flags.toString());
    const prevPrivateKeyPEM = useRef(privateKeyPEM);


    const fileInputRef = React.createRef();


    const getCurrentDomain = useCallback(() => !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain,
        [domainHashed, domain, flags]);


    const isSignatureInputReady = useCallback(() => getCurrentDomain() && expiry,
        [getCurrentDomain, expiry]);


    const computeSignature = useCallback(async () => {
        const domain = getCurrentDomain();
        if (!!privateKeyPEM && !!domain && !!expiry) {
            const address = await predictContractAddress(web3);
            setContractAddress(address);
            const flagsHex = flagsTo24BytesHex(flags);
            const payload = { address, domain, expiry, flagsHex };
            setSignature(await generateSignature(payload, privateKeyPEM));
        } else if (!domain || !expiry) {
            setSignature('');
        }
    }, [expiry, flags, privateKeyPEM, web3, getCurrentDomain]);


    const handleFlagsChange = (i) => {
        const newFlags = new BitSet(flags.flip(i).toString());
        setFlags(newFlags);
        console.log(newFlags.toString());
        if (i === FLAG_POSITIONS.DOMAIN_HASHED) {
            if (domain) {
                setDomainHashed(web3.utils.sha3(domain).substring(2));
            }
        }
    };


    /* https://stackoverflow.com/a/56377153 */
    const handleFilePicked = (event) => {
        event.preventDefault();
        setPrivateKeyFileName(fileInputRef.current.files[0].name);

        if (domain && expiry) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                setPrivateKeyPEM(e.target.result);
            };
            reader.readAsText(event.target.files[0]);
        }
    };

    useEffect(() => {
        if (privateKeyPEM !== prevPrivateKeyPEM.current) {
            computeSignature();
            prevPrivateKeyPEM.current = privateKeyPEM;
        }
    }, [privateKeyPEM, computeSignature]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        setSysMsg(null);
        setDeployDone(false);

        const flagsHex = flagsTo24BytesHex(flags);

        if (domain && expiry && signature) {
            try {
                const account = web3.currentProvider.selectedAddress;
                const contract = new web3.eth.Contract(TeSC.abi);
                await contract.deploy({
                    data: TeSC.bytecode,
                    arguments: [getCurrentDomain(), expiry, flagsHex, signature]
                }).send({ from: account, gas: '2000000' });


                setDeployDone(true);

                setSysMsg(buildPositiveMsg({
                    header: 'Smart Contract successfully deployed',
                    msg: `TLS-endorsed Smart Contract deployed successully at address ${contractAddress}`
                }));


                let tescs = JSON.parse(localStorage.getItem(account));
                if (!tescs) {
                    tescs = [];
                }
                tescs.push({ contractAddress, domain, expiry });
                localStorage.setItem(account, JSON.stringify(tescs));
            } catch (err) {
                setSysMsg(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to deploy Smart Contract',
                    msg: err.message
                }));
                console.log(err);
            }
        } else {
            setSysMsg(buildNegativeMsg({
                header: 'Unable to deploy Smart Contract',
                msg: `${!domain ? 'Domain' : !expiry ? 'Expiry' : !signature ? 'Signature' : 'Some required input'} is empty`
            }));
        }
    };


    const handleExpiryChange = (date) => {
        const mDate = moment.utc(date);
        mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        setExpiry(mDate.unix());
    };

    useEffect(() => {
        if (expiry !== prevExpiry.current) {
            computeSignature();
            prevExpiry.current = expiry;
        }
    }, [expiry, computeSignature]);


    useEffect(() => {
        if (flags.toString() !== prevFlags.current) {
            computeSignature();
            prevFlags.current = flags.toString();
        }
    }, [flags, computeSignature]);


    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).map(([flagName, i]) => (
            <Form.Checkbox
                key={i}
                checked={!!flags.get(i)}
                label={flagName}
                onClick={() => handleFlagsChange(i)}
                disabled={!domain || !expiry}
            />
        ));
    };

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const estimateDeploymentCost = useCallback(async () => {
        if (domain && expiry && signature) {
            const flagsHex = flagsTo24BytesHex(flags);

            const account = web3.currentProvider.selectedAddress;
            const contract = new web3.eth.Contract(TeSC.abi);
            const gasEstimation = await contract.deploy({
                data: TeSC.bytecode,
                arguments: [getCurrentDomain(), expiry, flagsHex, signature]
            }).estimateGas({ from: account, gas: '2000000' });

            console.log("GAS ESTIMATION: ", gasEstimation);
            const gasPrice = await web3.eth.getGasPrice();

            console.log("GAS PRICE (ether): ", web3.utils.fromWei(gasPrice, 'ether'));
            setCost(gasEstimation * web3.utils.fromWei(gasPrice, 'ether'));
        }
    }, [expiry, getCurrentDomain, domain, flags, signature, web3]);

    useEffect(() => {
        estimateDeploymentCost();
    }, [signature, estimateDeploymentCost]);

    return (
        <React.Fragment>

            {/* {estimateDeploymentCost()} */}
            <Grid style={{ marginBottom: '50px', height: '50px' }}>
                <Grid.Row style={{ height: '100%' }}>
                    <Grid.Column width={6}>
                        <h2>Create & Deploy TeSC</h2>
                    </Grid.Column>
                    <Grid.Column width={10}>
                        <div style={{ float: 'right' }}>
                            {sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}

                        </div>
                    </Grid.Column>
                </Grid.Row>

            </Grid>
            {/* <Button onClick={estimateDeploymentCost}>
                estimate gas
            </Button> */}
            <Form>

                <Form.Group widths='equal'>
                    <Form.Field>
                        <label>
                            {/* Domain <Label circular='true' color='red' style={{ fontSize: '10px' }}>required</Label> */}
                            Domain  <span style={{ color: 'red' }}>*</span>
                        </label>
                        <Input
                            value={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain}
                            disabled={!!domain && !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED)}
                            placeholder='www.mysite.com'
                            onChange={e => setDomain(e.target.value)}
                            onBlur={() => computeSignature()}
                        />
                    </Form.Field>

                    <Form.Field>
                        <label>
                            Expiry <span style={{ color: 'red' }}>*</span>
                        </label>
                        <DayPickerInput
                            onBlur={() => computeSignature()}
                            onDayChange={handleExpiryChange}
                            format="DD/MM/YYYY"
                            formatDate={formatDate}
                            parseDate={parseDate}
                            placeholder='dd/mm/yyyy'
                            dayPickerProps={{
                                disabledDays: {
                                    before: new Date()
                                },
                                readOnly: true
                            }}
                            inputProps={{ readOnly: true }}
                        />
                    </Form.Field>

                </Form.Group>
                <Form.Group grouped>
                    <label>Flags</label>
                    {renderFlagCheckboxes()}
                </Form.Group>

                <Form.Group grouped>
                    <label>Signature <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ paddingTop: '5px' }}>
                        <Button
                            content="Choose certificate private key"
                            labelPosition="left"
                            icon="file"
                            onClick={() => fileInputRef.current.click()}
                            disabled={!isSignatureInputReady()}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFilePicked}
                            accept=".pem, .txt, .cer, .cert, .key"
                            hidden
                        />
                        {!!privateKeyFileName && <Label basic pointing='left'>{privateKeyFileName}</Label>}
                    </div>

                    <div>
                        <em>Paste your signature into the box below or pick the certificate private key file to automatically compute the signature</em>
                    </div>
                    <Form.TextArea
                        value={signature}
                        onChange={e => setSignature(e.target.value)}
                        // disabled={!isSignatureInputReady()}
                        disabled={true}
                    />
                </Form.Group>
                {deployDone &&
                    (
                        <span>
                            <b>Contract address:</b>
                            <Label basic color='green' size='large' style={{ marginLeft: '5px' }}>
                                <LinkTescInspect contractAddress={contractAddress} />
                            </Label>
                        </span>
                    )
                }

                <Button
                    onClick={handleSubmit}
                    // disabled={!isSignatureInputReady() || !signature}
                    floated='right'
                    positive
                    style={{ width: '15%' }}
                >
                    Deploy
                </Button>
                <br />
                <br />
                {!!cost && signature && (
                    <p style={{ float: 'right', textAlign:'center' }}>
                        <b>Cost Estimation: <span style={{color: 'royalblue'}}>{cost.toFixed(5)} ether</span>
                        </b>
                    </p>
                )}

            </Form>

        </React.Fragment>
    );
};

export default TeSCNew;