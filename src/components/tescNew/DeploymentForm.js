import React, { Fragment, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button as BtnSuir, Segment, Dimmer, Loader, Popup, Radio, Header, TextArea, Divider, Icon } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import moment from 'moment';
import BitSet from 'bitset';

import { FaFileSignature } from 'react-icons/fa';

import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';



import AppContext from '../../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "../FeedbackMessage";
import FilePicker from '../FilePicker';
import FingerprintSegment from './FingerprintSegment';
import DeploymentOutput from './DeploymentOutput';
import TescDataTable from '../tesc/TescDataTable';

import TeSC from '../../ethereum/build/contracts/ERCXXXImplementation.json';
import {
    predictContractAddress,
    generateSignature,
    flagsToBytes24Hex,
    padToBytesX,
    storeTesc,
    estimateDeploymentCost,
    FLAG_POSITIONS,
} from '../../utils/tesc';
window.BitSet = BitSet;



const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    button: {
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    actionsContainer: {
        marginBottom: theme.spacing(2),
    },
    resetContainer: {
        padding: theme.spacing(3),
    },
}));

function getSteps() {
    return ['Create Claim', 'Create Signature', 'Add Certificate Fingerprint', 'Review and Confirm'];
}





const DeploymentForm = ({ initInputs }) => {
    const { web3, showMessage, handleBlockScreen } = useContext(AppContext);

    const [contractAddress, setContractAddress] = useState(initInputs ? initInputs.contractAddress.toLowerCase() : '');
    // const predictedContractAddress = useRef()

    const [domain, setDomain] = useState(initInputs && !initInputs.flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? initInputs.domain : '');
    const [expiry, setExpiry] = useState(initInputs ? initInputs.expiry : null);
    const [signature, setSignature] = useState(initInputs ? initInputs.signature : '');
    const [flags, setFlags] = useState(initInputs ? initInputs.flags : new BitSet('0x00'));
    const [domainHashed, setDomainHashed] = useState(initInputs && !!initInputs.flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? initInputs.domain : '');
    const [fingerprint, setFingerprint] = useState(!initInputs || parseInt(initInputs.fingerprint, 16) === 0 ? '' : initInputs.fingerprint);

    const [isMetamaskOpen, setIsMetamaskOpen] = useState(false);
    const [isMatchedOriginalDomain, setIsMatchedOriginalDomain] = useState(false);

    const [privateKeyPEM, setPrivateKeyPEM] = useState('');

    const [costEstimated, setCostEstimated] = useState(null);
    const [costPaid, setCostPaid] = useState(null);

    const [sigType, setSigType] = useState(null);

    const prevExpiry = useRef(expiry);
    const prevFlags = useRef(flags.toString());
    const prevSignature = useRef(signature);
    const prevFingerprint = useRef(fingerprint);
    const prevPrivateKeyPEM = useRef(privateKeyPEM);

    const getCurrentDomain = useCallback(() => !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain,
        [domainHashed, domain, flags]);

    const computeSignature = useCallback(async () => {
        const domain = getCurrentDomain();
        if (!!privateKeyPEM && !!domain && !!expiry) {
            try {
                const address = initInputs ? contractAddress : await predictContractAddress(web3);
                const flagsHex = flagsToBytes24Hex(flags);
                const payload = { address, domain, expiry, flagsHex };
                setSignature(await generateSignature(payload, privateKeyPEM));
            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to compute signature',
                    msg: err.message
                }));
            }
        } else if (!domain || !expiry) {
            setSignature('');
        }
    }, [privateKeyPEM, contractAddress, expiry, flags, getCurrentDomain, showMessage, initInputs, web3]);

    const makeDeploymentTx = useCallback(async () => {
        return await new web3.eth.Contract(TeSC.abi).deploy({
            data: TeSC.bytecode,
            arguments: [getCurrentDomain(), expiry, flagsToBytes24Hex(flags), padToBytesX(fingerprint, 32), signature]
        });
    }, [expiry, flags, signature, fingerprint, web3.eth.Contract, getCurrentDomain]);

    const makeUpdateTx = useCallback(async () => {
        return await new web3.eth.Contract(TeSC.abi, contractAddress).methods.setEndorsement(
            getCurrentDomain(),
            expiry,
            flagsToBytes24Hex(flags),
            padToBytesX(fingerprint),
            signature
        );
    }, [contractAddress, expiry, flags, signature, fingerprint, getCurrentDomain, web3.eth.Contract]);
    // 
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

    const handlePickPrivateKey = (content) => {
        setPrivateKeyPEM(content);
    };

    const handleGetFingerprint = (fp) => {
        setFingerprint(fp);
    };

    const handleExpiryChange = (date) => {
        console.log('DATE EXPIRY', date);
        const mDate = moment.utc(date);
        mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        setExpiry(mDate.unix());
    };

    useEffect(() => {
        (async () => {
            if (expiry !== prevExpiry.current) {
                computeSignature();
                prevExpiry.current = expiry;

            } else if (flags.toString() !== prevFlags.current) {
                computeSignature();
                prevFlags.current = flags.toString();

            } else if (signature !== prevSignature.current || fingerprint !== prevFingerprint.current) {
                const tx = !initInputs ? await makeDeploymentTx() : await makeUpdateTx();
                if (!initInputs || contractAddress) {
                    const estCost = await estimateDeploymentCost(web3, tx);
                    setCostEstimated(estCost);
                }

                if (signature !== prevSignature.current)
                    prevSignature.current = signature;
                else if (fingerprint !== prevFingerprint.current)
                    prevFingerprint.current = fingerprint;

            } else if (privateKeyPEM !== prevPrivateKeyPEM.current) {
                prevPrivateKeyPEM.current = prevPrivateKeyPEM;
                computeSignature();
            }
        })();
    }, [expiry, contractAddress, flags, signature, domain, privateKeyPEM, computeSignature,
        fingerprint, getCurrentDomain, makeDeploymentTx, initInputs, makeUpdateTx, web3]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        handleBlockScreen(true);
        setIsMetamaskOpen(true);

        showMessage(null);
        setContractAddress('');

        const account = web3.currentProvider.selectedAddress;
        const curDomain = getCurrentDomain();


        if (curDomain && expiry && signature) {
            try {
                const tx = !initInputs ? await makeDeploymentTx() : await makeUpdateTx();
                await tx.send({ from: account, gas: '2000000' })
                    .on('receipt', async (txReceipt) => {
                        setCostPaid(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether'));
                        setContractAddress(txReceipt.contractAddress);

                        showMessage(buildPositiveMsg({
                            header: 'Smart Contract successfully deployed',
                            msg: `TLS-endorsed Smart Contract deployed successully at address ${txReceipt.contractAddress}`
                        }));

                        storeTesc({
                            account,
                            claim: { contractAddress: txReceipt.contractAddress, domain: curDomain, expiry }
                        });
                    });

            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to deploy Smart Contract',
                    msg: err.message
                }));
                console.log(err);
            }
        } else {
            showMessage(buildNegativeMsg({
                header: 'Unable to deploy Smart Contract',
                msg: `${!curDomain ? 'Domain' : !expiry ? 'Expiry' : !signature ? 'Signature' : 'Some required input'} is empty`
            }));
        }
        handleBlockScreen(false);
        setIsMetamaskOpen(false);
        handleNext();
    };

    const renderFlagCheckboxes = () => {

        return Object.entries(FLAG_POSITIONS).filter(([flagName, i]) => i === 0).map(([flagName, i]) =>
            <Form.Checkbox
                key={i}
                checked={!!flags.get(i)}
                // label={flagName}
                label='Hash domain'
                onClick={() => handleFlagsChange(i)}
                disabled={(!initInputs && (!domain || !expiry)) || (initInputs && !isMatchedOriginalDomain)}
            />
        );
    };

    const handleEnterOriginalDomain = (originalDomain) => {
        setDomain(originalDomain);
        if (originalDomain && web3.utils.sha3(originalDomain).substring(2) === domainHashed) {
            setIsMatchedOriginalDomain(true);
        }
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    const classes = useStyles();
    const [activeStep, setActiveStep] = React.useState(0);
    const steps = getSteps();

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    function getStepContent(step) {
        switch (step) {
            case 0:
                return {
                    component: (
                        <Fragment>
                            <Form.Field>
                                <label>Domain  <span style={{ color: 'red' }}>*</span></label>
                                <Input
                                    value={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain}
                                    disabled={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED)}
                                    placeholder='www.mysite.com'
                                    onChange={e => setDomain(e.target.value)}
                                    onBlur={() => computeSignature()}
                                    icon='world'
                                />
                            </Form.Field>
                            <Form.Field>
                                {renderFlagCheckboxes()}
                            </Form.Field>


                            <Form.Field>
                                <label>Expiry <span style={{ color: 'red' }}>*</span></label>
                                <DayPickerInput
                                    value={expiry ? formatDate(new Date(expiry * 1000), 'DD/MM/YYYY') : null}
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
                                    component={props => <Input icon='calendar alternate outline' {...props} />}
                                />
                            </Form.Field>
                        </Fragment>
                    ),
                    next: !!getCurrentDomain() && !!expiry
                };
            case 1:
                return {
                    component: (
                        <Fragment>
                            <Header as='h4'>Signature <span style={{ color: 'red' }}>*</span></Header>
                            <Form.Field>
                                <Radio
                                    label="Compute the signature automatically using private key of TLS/SSL certifiticate"
                                    name='radioGroup'
                                    value='auto'
                                    checked={sigType === 'auto'}
                                    onChange={(e, { value }) => setSigType(value)}
                                />
                            </Form.Field>
                            <Form.Field>
                                <Radio
                                    label='Compute the signature manually'
                                    name='radioGroup'
                                    value='manual'
                                    checked={sigType === 'manual'}
                                    onChange={(e, { value }) => setSigType(value)}
                                />
                            </Form.Field>
                            {sigType !== null && (
                                <Divider horizontal>
                                    <Header as='h5'>
                                        <Icon name='signup' />
                                        Add Signature
                                </Header>
                                </Divider>
                            )}
                            {sigType === 'auto' && (
                                <Form.Field>
                                    <div style={{ paddingTop: '5px' }}>
                                        <FilePicker
                                            label='Choose certificate  key'
                                            onPickFile={handlePickPrivateKey}
                                            isDisabled={!getCurrentDomain() || !expiry}
                                        />
                                    </div>
                                    <div><em>Pick the certificate private key file to automatically compute the signature</em></div>

                                    <Segment style={{ wordBreak: 'break-all', minHeight: '7em' }} placeholder>
                                        {signature}
                                    </Segment>
                                </Form.Field>
                            )}
                            {sigType === 'manual' && (
                                <Form.Field>
                                    <p>Please use this command line to generate the signature: <br />
                                        <b>echo -n {`0x254dffcd3277c0b1660f6d42efbb754edababc2b.1637937718`} | openssl dgst -RSA-SHA256 -sign {'<your_private_key_file>'} | openssl base64 | cat</b>
                                    </p>

                                    <TextArea style={{ wordBreak: 'break-all', minHeight: '7em' }} placeholder>
                                        {signature}
                                    </TextArea>
                                </Form.Field>
                            )}
                        </Fragment>
                    ),
                    next: !!signature
                };
            case 2:
                return {
                    component: (
                        <FingerprintSegment
                            inputs={{ contractAddress, domain, expiry, flags, signature, fingerprint: initInputs ? initInputs.fingerprint : '' }}
                            onGetFingerprint={handleGetFingerprint}
                            activated={!!fingerprint}
                        />
                    ),
                    next: true
                };
            case 3:
                return {
                    component: (
                        <Fragment>
                            <TescDataTable
                                data={{ contractAddress, domain: getCurrentDomain(), expiry, flags, signature, fingerprint }}
                            />
                            {!!costEstimated && !!signature && (
                                <div style={{ float: 'right', right: '100%' }}>
                                    Cost estimation:
                                    <Label tag style={{ color: 'royalblue', }}>
                                        {costEstimated.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH</span>
                                    </Label>
                                </div>
                            )}
                        </Fragment>
                    )
                };
            default:
                return 'Unknown step';
        }
    }

    return (
        <React.Fragment>

            <Form style={{ width: '80%', margin: '40px auto' }} className={classes.root}>

                <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((label, index) => (
                        <Step key={label}>
                            <StepLabel><h4>{label}</h4></StepLabel>

                            <StepContent>
                                <Segment raised color='purple' style={{ margin: '1% 10%', padding: '3%' }}>
                                    <Typography>{getStepContent(index).component}</Typography>
                                </Segment>
                                <div className={classes.actionsContainer} style={{ float: 'right', margin: 'auto 10%' }}>
                                    <div>
                                        <BtnSuir
                                            basic
                                            disabled={activeStep === 0}
                                            onClick={handleBack}
                                        >
                                            Back
                                        </BtnSuir>
                                        {activeStep !== steps.length - 1 ?
                                            (
                                                <BtnSuir
                                                    basic
                                                    disabled={!getStepContent(index).next}
                                                    color="purple"
                                                    onClick={handleNext}
                                                >
                                                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                                                </BtnSuir>
                                            ) : (
                                                <BtnSuir
                                                    icon='play circle'
                                                    basic
                                                    onClick={handleSubmit}
                                                    disabled={!signature || !privateKeyPEM}
                                                    positive
                                                    content={!initInputs ? 'Deploy' : 'Update'}
                                                />

                                            )}
                                    </div>
                                </div>

                            </StepContent>
                        </Step>
                    ))}
                </Stepper>
                {activeStep === steps.length && (
                    <Paper square elevation={0} className={classes.resetContainer}>
                        <Typography>All steps completed - you&apos;re finished</Typography>
                        <Button onClick={handleReset} className={classes.button}>
                            Reset
                        </Button>
                    </Paper>
                )}
            </Form>















            {/* <Form style={{ width: '80%', margin: '40px auto' }}>
                {initInputs && !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) && !isMatchedOriginalDomain && (
                    <Form.Field>
                        { !domain && (<Label pointing='below'>The domain in this contract is hashed, the original domain is required to proceed with the update</Label>)}
                        <Input
                            label='Original domain'
                            value={domain}
                            placeholder='www.mysite.com'
                            onChange={e => handleEnterOriginalDomain(e.target.value)}
                            style={{ width: '100%', margin: '5px' }}
                        />
                    </Form.Field>
                )}
                <Form.Group widths='equal'>
                    <Form.Field>
                        <label>Domain  <span style={{ color: 'red' }}>*</span></label>
                        <Input
                            value={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain}
                            disabled={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED)}
                            placeholder='www.mysite.com'
                            onChange={e => setDomain(e.target.value)}
                            onBlur={() => computeSignature()}
                        />
                    </Form.Field>

                    <Form.Field>
                        <label>Expiry <span style={{ color: 'red' }}>*</span></label>
                        <DayPickerInput
                            value={expiry ? formatDate(new Date(expiry * 1000), 'DD/MM/YYYY') : null}
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
                        <FilePicker
                            label='Choose certificate  key'
                            onPickFile={handlePickPrivateKey}
                            isDisabled={!getCurrentDomain() || !expiry}
                        />
                    </div>
                    <div><em>Pick the certificate private key file to automatically compute the signature</em></div>

                    <Segment style={{ wordBreak: 'break-all', minHeight: '7em' }} placeholder>
                        {signature}
                    </Segment>
                </Form.Group>

                <Form.Group grouped>
                    <FingerprintSegment
                        inputs={{ contractAddress, domain, expiry, flags, signature, fingerprint: initInputs ? initInputs.fingerprint : '' }}
                        onGetFingerprint={handleGetFingerprint}
                    />
                </Form.Group>

                {contractAddress && !initInputs && (<DeploymentOutput contractAddress={contractAddress} costPaid={costPaid} />)}

                {!!costEstimated && !!signature && (
                    <div style={{ float: 'right', marginTop: '3px' }}>
                        <Label tag style={{ color: 'royalblue', }}>
                            {costEstimated.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH</span>
                        </Label>
                    </div>
                )}
                <br />
                <br />
                <BtnSuir
                    onClick={handleSubmit}
                    disabled={!signature || !privateKeyPEM}
                    floated='right'
                    positive
                    style={{ width: '20%', marginTop: '0px' }}
                >
                    {!initInputs ? 'Deploy' : 'Update'}
                </BtnSuir>

                <Dimmer active={!!initInputs && isMetamaskOpen} inverted>
                    <Loader indeterminate content='Waiting for transaction to finish...' />
                </Dimmer>
            </Form> */}
        </React.Fragment>
    );
};

export default DeploymentForm;