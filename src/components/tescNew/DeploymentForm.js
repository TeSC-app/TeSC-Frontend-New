import React, { Fragment, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button as BtnSuir, Segment, Dimmer, Loader, Popup, Radio, Header, TextArea, Divider, Icon, Grid } from 'semantic-ui-react';

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

import StepButton from '@material-ui/core/StepButton';


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


const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    button: {
        marginRight: theme.spacing(1),
    },
    backButton: {
        marginRight: theme.spacing(1),
    },
    completed: {
        display: 'inline-block',
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));


function getSteps() {
    return ['Create Claim', 'Create Signature', 'Add Certificate Fingerprint', 'Review and Confirm', 'Done'];
}



const DeploymentForm = ({ initInputs }) => {
    const { web3, showMessage, handleBlockScreen } = useContext(AppContext);

    const [contractAddress, setContractAddress] = useState(initInputs ? initInputs.contractAddress.toLowerCase() : '');
    const [futureContractAddress, setFutureContractAddress] = useState(initInputs ? initInputs.contractAddress.toLowerCase() : '');

    const [domain, setDomain] = useState(initInputs && !initInputs.flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? initInputs.domain : '');
    const [expiry, setExpiry] = useState(initInputs ? initInputs.expiry : null);
    const [signature, setSignature] = useState(initInputs ? initInputs.signature : '');
    const [flags, setFlags] = useState(initInputs ? initInputs.flags : new BitSet('0x00'));
    const [domainHashed, setDomainHashed] = useState(initInputs && !!initInputs.flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? initInputs.domain : '');
    const [fingerprint, setFingerprint] = useState(!initInputs || parseInt(initInputs.fingerprint, 16) === 0 ? '' : initInputs.fingerprint);

    const [privateKeyPEM, setPrivateKeyPEM] = useState('');
    const [privateKeyFileName, setPrivateKeyFileName] = useState('');

    const [costEstimated, setCostEstimated] = useState(null);
    const [costPaid, setCostPaid] = useState(null);

    const [isMetamaskOpen, setIsMetamaskOpen] = useState(false);
    const [isMatchedOriginalDomain, setIsMatchedOriginalDomain] = useState(false);


    const [sigInputType, setSigInputType] = useState(null);

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

    const handlePickPrivateKey = (filename, content) => {
        setPrivateKeyFileName(filename);
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
            if (!futureContractAddress) {
                setFutureContractAddress(await predictContractAddress(web3));
            }
            if (expiry !== prevExpiry.current) {
                prevExpiry.current = expiry;

            } else if (flags.toString() !== prevFlags.current) {
                prevFlags.current = flags.toString();

            } else if (signature !== prevSignature.current || fingerprint !== prevFingerprint.current) {
                if (signature) {
                    const tx = !initInputs ? await makeDeploymentTx() : await makeUpdateTx();
                    if (!initInputs || contractAddress) {
                        console.log(initInputs);
                        const estCost = await estimateDeploymentCost(web3, tx);
                        setCostEstimated(estCost);
                    }
                }

                if (signature !== prevSignature.current)
                    prevSignature.current = signature;
                else if (fingerprint !== prevFingerprint.current)
                    prevFingerprint.current = fingerprint;

            } else if (privateKeyPEM !== prevPrivateKeyPEM.current) {
                prevPrivateKeyPEM.current = prevPrivateKeyPEM;
            }
        })();
        console.log('USE EFFECT', privateKeyPEM)
        if (privateKeyPEM) {
            computeSignature();
        }
    }, [expiry, contractAddress, futureContractAddress, flags, signature, domain, privateKeyPEM, computeSignature,
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
                        setActiveStep(activeStep + 1);

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
        if (!isLastStep()) {
            handleNext();
        }
    };

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).filter(([flagName, i]) => i === 0).map(([flagName, i]) =>
            <Form.Checkbox
                key={i}
                checked={!!flags.get(i)}
                // label={flagName}
                label='Hash domain'
                onClick={() => handleFlagsChange(i)}
                disabled={(!initInputs && (!domain)) || (initInputs && !isMatchedOriginalDomain)}
            />
        );
    };

    const handleEnterOriginalDomain = (originalDomain) => {
        setDomain(originalDomain);
        if (originalDomain && web3.utils.sha3(originalDomain).substring(2) === domainHashed) {
            setIsMatchedOriginalDomain(true);
        }
    };

    const handleSwitchSigInputType = (val) => {
        setSigInputType(val);
        if (val === 'manual') {
            setPrivateKeyPEM('');
            setPrivateKeyFileName('')
        }
    };

    const handleTextCopy = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(`echo -n ${futureContractAddress}.${getCurrentDomain()}.${expiry}.${flagsToBytes24Hex(flags)} | openssl dgst -RSA-SHA256 -sign <path_to_private_key_file> | openssl base64 | cat`);
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    const classes = useStyles();
    const [activeStep, setActiveStep] = React.useState(0);
    const steps = getSteps();

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
                    completed: !!getCurrentDomain() && !!expiry,
                    reachable: true
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
                                    checked={sigInputType === 'auto'}
                                    onChange={(e, { value }) => handleSwitchSigInputType(value)}
                                />
                            </Form.Field>
                            <Form.Field>
                                <Radio
                                    label='Compute the signature manually'
                                    name='radioGroup'
                                    value='manual'
                                    checked={sigInputType === 'manual'}
                                    onChange={(e, { value }) => handleSwitchSigInputType(value)}
                                />
                            </Form.Field>
                            {sigInputType !== null && (
                                <Divider horizontal>
                                    <Header as='h5'>
                                        <Icon name='signup' />
                                        Add Signature
                                </Header>
                                </Divider>
                            )}
                            {sigInputType === 'auto' && (
                                <Form.Field>
                                    <div style={{ paddingTop: '5px' }}>
                                        <FilePicker
                                            label='Choose certificate  key'
                                            onPickFile={handlePickPrivateKey}
                                            isDisabled={!getCurrentDomain() || !expiry}
                                            input={{fileName:privateKeyFileName, content: privateKeyPEM}}
                                        />
                                    </div>
                                    <div><em>Pick the certificate private key file to automatically compute the signature</em></div>

                                    <Segment style={{ wordBreak: 'break-all', minHeight: '7em' }} placeholder>
                                        {signature}
                                    </Segment>
                                </Form.Field>
                            )}
                            {sigInputType === 'manual' && (
                                <Form.Field>
                                    <p style={{ wordBreak: 'break-all' }}>
                                        Please use this command line to generate the signature in your terminal:
                                        
                                        <br />
                                        <br />
                                        <Label color='black'>
                                            <Popup content='Copy to clipboard' trigger={
                                                <BtnSuir  circular icon='copy'
                                                    floated='right'
                                                    onClick={handleTextCopy}
                                                    style={{marginRight: '0px', marginLeft: '10px'}}
                                                />}
                                            />
                                            <span>
                                                echo -n {`${futureContractAddress}.${getCurrentDomain()}.${expiry}.${flagsToBytes24Hex(flags)}`} |
                                                openssl dgst -RSA-SHA256 -sign <span style={{ color: 'magenta' }}>{'<path_to_private_key_file>'}</span> | openssl base64 | cat
                                            </span>
                                        </Label>
                                        <br />
                                    </p>


                                    <TextArea
                                        style={{ wordBreak: 'break-all', minHeight: '7em' }}
                                        placeholder
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                    />
                                </Form.Field>
                            )}
                        </Fragment>
                    ),
                    completed: !!signature,
                    reachable: !!signature || getStepContent(0).reachable
                };
            case 2:
                return {
                    component: (
                        <FingerprintSegment
                            inputs={{ contractAddress, domain, expiry, flags, signature, fingerprint: initInputs ? initInputs.fingerprint : fingerprint }}
                            onGetFingerprint={handleGetFingerprint}
                        />
                    ),
                    completed: getStepContent(0).completed && getStepContent(1).completed,
                    reachable: (getStepContent(0).completed && getStepContent(1).completed) || getStepContent(1).reachable
                };
            case 3:
                return {
                    component: (
                        <Fragment>
                            <TescDataTable
                                data={{ contractAddress, domain: getCurrentDomain(), expiry, flags, signature, fingerprint }}
                            />
                            {!!costEstimated && !!signature && (
                                <div style={{ float: 'right'}}>
                                    <span>Cost estimation:  </span>
                                    <Label tag style={{ color: 'royalblue', }}>
                                        {costEstimated.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH</span>
                                    </Label>
                                </div>
                            )}
                        </Fragment>
                    ),
                    completed: !!contractAddress,
                    reachable: !!contractAddress || getStepContent(2).reachable
                };
            case 4:
                return {
                    component: (
                        // { contractAddress && !initInputs && 
                        <Grid.Row style={{ minWidth: 'max-content', paddingTop: '2%' }}>
                            <DeploymentOutput contractAddress={contractAddress} costPaid={costPaid} />
                        </Grid.Row>
                    ),
                    completed: getStepContent(3).completed,
                    reachable: getStepContent(3).completed
                };

            default:
                return 'Unknown step';
        }
    }



    const isStepOptional = (step) => {
        return step === 2;
    };

    const allStepsCompleted = () => {
        return getSteps.filter((step, i) => getStepContent(i).completed) === getSteps.length;
    };

    const isLastStep = () => {
        return activeStep === getSteps().length - 1;
    };

    const handleNext = () => {
        const newActiveStep =
            isLastStep() && !allStepsCompleted()
                ? // It's the last step, but not all steps have been completed
                // find the first step that has been completed
                steps.findIndex((step, i) => !getStepContent(i).completed)
                : activeStep + 1;

        setActiveStep(newActiveStep);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleStep = (step) => () => {
        setActiveStep(step);
    };

    const handleReset = () => {
        setActiveStep(0);
        // setCompleted(new Set());
        setContractAddress('');
        setFutureContractAddress('');
        setDomain('');
        setDomainHashed('');
        setExpiry(null);
        setFlags(new BitSet('0x00'));
        setSignature('');
        setFingerprint('');
        setPrivateKeyPEM('');
        setPrivateKeyFileName('');
        setCostEstimated(null);
        setCostPaid(null);
        setSigInputType(null);

        showMessage(null);
    };


    return (
        <React.Fragment>
            <div className={classes.root}>
                <Stepper alternativeLabel nonLinear activeStep={activeStep}>
                    {steps.map((label, index) => {
                        const stepProps = {};
                        const buttonProps = {};
                        if (isStepOptional(index)) {
                            buttonProps.optional = <Typography variant="caption">Optional</Typography>;
                        }
                        return (
                            <Step key={label} {...stepProps}>
                                <StepButton
                                    onClick={handleStep(index)}
                                    completed={getStepContent(index).completed}
                                    disabled={!getStepContent(index).reachable}
                                    {...buttonProps}
                                >
                                    {label}
                                </StepButton>
                            </Step>
                        );
                    })}
                </Stepper>
                <Grid relaxed style={{ width: '70%', margin: '0 auto' }}>
                    <Grid.Column>
                        <Grid.Row style={{ paddingBottom: '5%', margin: '0 auto' }}>
                            <Form>
                                <Segment raised padded='very' color='purple'>
                                    {getStepContent(activeStep).component}
                                </Segment>
                            </Form>

                            <div className={classes.actionsContainer} style={{ float: 'right', height: 'min-content', padding: '1.5% 0' }}>
                                {contractAddress && (
                                    <BtnSuir
                                        basic
                                        onClick={handleReset}
                                        className={classes.button}
                                        primary
                                    >
                                        Deploy another TeSC
                                    </BtnSuir>
                                )}
                                <BtnSuir
                                    basic
                                    disabled={activeStep === 0}
                                    onClick={handleBack}
                                >
                                    Back
                                </BtnSuir>

                                {((activeStep < 3 && !contractAddress) || (activeStep <= 3 && contractAddress)) && (
                                    <BtnSuir
                                        basic
                                        color="purple"
                                        disabled={!getStepContent(activeStep).completed}
                                        onClick={handleNext}
                                    >
                                        Next
                                    </BtnSuir>
                                )}
                                {activeStep === 3 && !contractAddress && (
                                    <BtnSuir
                                        icon='play circle'
                                        basic
                                        onClick={handleSubmit}
                                        disabled={!signature || !privateKeyPEM}
                                        positive
                                        content={!initInputs ? 'Deploy' : 'Update'}
                                    />
                                )
                                }
                            </div>
                        </Grid.Row>

                    </Grid.Column>
                </Grid>
            </div>
        </React.Fragment>
    );
};

export default DeploymentForm;