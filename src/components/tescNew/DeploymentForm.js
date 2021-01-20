import React, { Fragment, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button as BtnSuir, Segment, Popup, Radio, Header, TextArea, Divider, Icon, Grid } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import moment from 'moment';
import BitSet from 'bitset';


import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
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
    formatClaim,
    FLAGS,
} from '../../utils/tesc';
import { extractAxiosErrorMessage } from '../../utils/formatError';
import axios from 'axios';


const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    active: {
        color: 'purple',
        backgroundColor: 'purple'
    },
    completed: {
        display: 'inline-block',
        color: 'purple',
        backgroundColor: 'purple'
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));




const DeploymentForm = ({ initInputs, onMatchOriginalDomain, typedInDomain='' }) => {
    const { web3, showMessage, handleBlockScreen, account } = useContext(AppContext);

    const defaultFingerprint = !initInputs || parseInt(initInputs.fisngerprint, 16) === 0 ? '' : initInputs.fingerprint;

    const [contractAddress, setContractAddress] = useState(initInputs ? initInputs.contractAddress.toLowerCase() : '');
    const [futureContractAddress, setFutureContractAddress] = useState(initInputs ? initInputs.contractAddress.toLowerCase() : '');

    const [domain, setDomain] = useState(initInputs && !initInputs.flags.get(FLAGS.DOMAIN_HASHED) ? initInputs.domain : typedInDomain);
    const [expiry, setExpiry] = useState(initInputs ? initInputs.expiry : null);
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(initInputs ? initInputs.flags : new BitSet('0x00'));
    const [domainHashed, setDomainHashed] = useState(initInputs && !!initInputs.flags.get(FLAGS.DOMAIN_HASHED) ? initInputs.domain : '');
    const [fingerprint, setFingerprint] = useState(defaultFingerprint);

    const [privateKeyPEM, setPrivateKeyPEM] = useState('');
    const [privateKeyFileName, setPrivateKeyFileName] = useState('');

    const [costEstimated, setCostEstimated] = useState(null);
    const [costPaid, setCostPaid] = useState(null);

    const [isMetamaskOpen, setIsMetamaskOpen] = useState(false);
    const [isMatchedOriginalDomain, setIsMatchedOriginalDomain] = useState(typedInDomain ? true : false);


    const [sigInputType, setSigInputType] = useState(null);

    const prevExpiry = useRef(expiry);
    const prevFlags = useRef(flags.toString());
    const prevSignature = useRef(signature);
    const prevFingerprint = useRef(fingerprint);
    const prevPrivateKeyPEM = useRef(privateKeyPEM);

    const getCurrentDomain = useCallback(() => !!flags.get(FLAGS.DOMAIN_HASHED) ? domainHashed : domain,
        [domainHashed, domain, flags]);

    const getClaimString = () => {
        return formatClaim({contractAddress: futureContractAddress, domain: getCurrentDomain(), expiry, flags: flagsToBytes24Hex(flags)})
    }

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

    const handleLoseDomainInputFocus = () => {
        if (fingerprint) {
            setFingerprint(defaultFingerprint)
        }
        computeSignature();
        
    }

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
    
    const handleFlagsChange = (i) => {
        const newFlags = new BitSet(flags.flip(i).toString());
        setFlags(newFlags);
        if (i === FLAGS.DOMAIN_HASHED) {
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
        if (privateKeyPEM) {
            computeSignature();
        }
    }, [expiry, contractAddress, futureContractAddress, flags, signature, privateKeyPEM, computeSignature,
        fingerprint, getCurrentDomain, makeDeploymentTx, initInputs, makeUpdateTx, web3]);


    const validateEndorsement = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/predeploy/validate`, {
                params: { 
                    domain,
                    claim: getClaimString(), 
                    signature
                }
            });

            console.log(res.status);
        } catch (err) {
            throw err;
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        handleBlockScreen(true);
        setIsMetamaskOpen(true);

        showMessage(null);

        const curDomain = getCurrentDomain();

        let success = false;
        if (curDomain && expiry && signature) {
            try {
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
                await validateEndorsement();
                console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
                const tx = !initInputs ? await makeDeploymentTx() : await makeUpdateTx();
                await tx.send({ from: account, gas: '2000000' })
                    .on('receipt', async (txReceipt) => {
                        setCostPaid(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether'));
                        if(txReceipt.contractAddress) {
                            setContractAddress(txReceipt.contractAddress);
                        }
                        setActiveStep(activeStep + 1);
                        success = true;

                        showMessage(buildPositiveMsg({
                            header: 'Smart Contract successfully deployed',
                            msg: `TLS-endorsed Smart Contract deployed successully at address ${txReceipt.contractAddress}`
                        }));

                        storeTesc({
                            account,
                            claim: { 
                                contractAddress: initInputs? contractAddress : txReceipt.contractAddress, 
                                domain: curDomain, 
                                expiry 
                            }
                        });
                    });

            } catch (error) {
                showMessage(buildNegativeMsg({
                    code: error.code,
                    header: 'Unable to deploy Smart Contract',
                    msg: extractAxiosErrorMessage({ error, subject: domain })
                }));
                console.log(error);
            }
        } else {
            showMessage(buildNegativeMsg({
                header: 'Unable to deploy Smart Contract',
                msg: `${!curDomain ? 'Domain' : !expiry ? 'Expiry' : !signature ? 'Signature' : 'Some required input'} is empty`
            }));
        }
        handleBlockScreen(false);
        setIsMetamaskOpen(false);
        if (success) {
            handleNext();
        }
    };

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAGS).filter(([flagName, i]) => i === 0).map(([flagName, i]) =>
                <Form.Checkbox
                    key={i}
                    checked={!!flags.get(i)}
                    // label={flagName}
                    label='Hash domain'
                    onClick={() => handleFlagsChange(i)}
                    disabled={(!initInputs && (!domain)) || (initInputs && !isMatchedOriginalDomain)}
                    slider
                />
        );
    };

    const handleEnterOriginalDomain = (originalDomain) => {
        setDomain(originalDomain);
        if (originalDomain && web3.utils.sha3(originalDomain).substring(2) === domainHashed) {
            setIsMatchedOriginalDomain(true);
            onMatchOriginalDomain(originalDomain);
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
        navigator.clipboard.writeText(`echo -n ${getClaimString()} | openssl dgst -RSA-SHA256 -sign <path_to_private_key_file> | openssl base64 | cat`);
    };

    const shouldDisplayOriginalDomainStep = () => {
        return initInputs && !typedInDomain && domainHashed && !isMatchedOriginalDomain
    }

    const getSteps = () => {
        return [
            `${initInputs ? 'Change' : 'Create'} Claim`, 
            `${initInputs ? 'Change' : 'Create'} Signature`, 
            `${initInputs ? 'Change' : 'Add'} Certificate Fingerprint`, 
            `Review and ${initInputs ? 'Update' : 'Deploy'}`, 
            'Receipt'
        ];
    }

    const classes = useStyles();
    const [activeStep, setActiveStep] = React.useState(0);
    const steps = getSteps();
    
    const renderOriginalDomainInput = () => {
        return (
            <div raised padded='very' color='purple' style={{margin: '1% 5%'}}>
                <div style={{marginBottom: '30px'}}>
                    <b style={{color: '#A333C8', fontSize: '1.28571429rem'}} >
                        Enter Original Domain
                    </b>
                    <Popup
                        inverted
                        content={`The original plaintext domain that is hashed to the hash ${domainHashed} (required)`}
                        trigger={<Icon name='question circle' />}
                    />
                </div>
                <Input
                    label={{ content: 'Original Domain', color: 'purple' }}
                    value={domain}
                    placeholder='www.mysite.com'
                    onChange={e => handleEnterOriginalDomain(e.target.value)}
                    icon='world'
                    style={{marginTop: '12px', width: '100%'}}
                />
            </div>
        )
    }

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return {
                    component: (
                        <Fragment>
                            <Header as='h3' content={getSteps()[step]} style={{marginBottom: '30px'}} color='purple'/>
                            <Form.Field>
                                <p>
                                    <b>Contract address: </b>
                                    <span style={{ wordBreak: 'break-all' }}>{futureContractAddress} </span>
                                    <Popup
                                        inverted
                                        content='The contract address is predetermined using the wallet address and the current nonce of the wallet'
                                        trigger={<Icon name='question circle' />}
                                    />
                                    
                                </p>
                            </Form.Field>

                            <Form.Field>
                                <label>
                                    Domain  <span style={{ color: 'red' }}>*</span> 
                                    <Popup
                                        inverted
                                        content='The domain of the website you would like to bind with this TLS-endorsed Smart Contract (required)'
                                        trigger={<Icon name='question circle' />}
                                    />
                                </label>
                                <Input
                                    value={!!flags.get(FLAGS.DOMAIN_HASHED) ? domainHashed : domain}
                                    disabled={!!flags.get(FLAGS.DOMAIN_HASHED)}
                                    placeholder='www.mysite.com'
                                    onChange={e => setDomain(e.target.value)}
                                    onBlur={() => handleLoseDomainInputFocus()}
                                    icon='world'
                                />
                            </Form.Field>
                            <Form.Field>
                                {renderFlagCheckboxes()}
                            </Form.Field>


                            <Form.Field>
                                <label>
                                    Expiry <span style={{ color: 'red' }}>*</span>
                                    <Popup
                                        inverted 
                                        content='The expiry date, on which this TeSC is expired, stored as Unix timestamp (required)'
                                        trigger={<Icon name='question circle' />}
                                    />
                                </label>
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
                    completed: initInputs? (getCurrentDomain() !== initInputs.domain) || (expiry !== initInputs.expiry) : !!getCurrentDomain() && !!expiry ,
                    reachable: initInputs && domainHashed? isMatchedOriginalDomain: true
                };
            case 1:
                return {
                    component: (
                        <Fragment>
                            <Header as='h3' content='Create Signature' style={{marginBottom: '30px'}} color='purple'/>

                            <p>
                                <b>Signature</b> <span style={{ color: 'red' }}>*</span>
                                <Popup
                                    inverted 
                                    content='Using the private key of the website certificate, you can sign the Claim created in the last step (required)'
                                    trigger={<Icon name='question circle' />}
                                />
                            </p>
                            <Form.Field>
                                <Radio
                                    label="Compute the signature automatically by picking TLS/SSL private key file"
                                    name='radioGroup'
                                    value='auto'
                                    checked={sigInputType === 'auto'}
                                    onChange={(e, { value }) => handleSwitchSigInputType(value)}
                                />
                            </Form.Field>
                            <Form.Field>
                                <Radio
                                    label='Compute the signature manually using command line'
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
                                        Please use this command line to generate the signature in your terminal, then copy and paste it into the text box below:
                                        
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
                                                echo -n {getClaimString()} |
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
                    reachable: initInputs? getStepContent(step - 1).completed : !!signature || getStepContent(step - 1).completed 
                };
            case 2:
                return {
                    component: (
                        <Fragment>
                            <Header as='h3' content='Add Certificate Fingerprint' style={{marginBottom: '30px'}} color='purple'/>
                            <FingerprintSegment
                                inputs={{ contractAddress, domain, expiry, flags, signature, fingerprint }}
                                onGetFingerprint={handleGetFingerprint}
                            />
                        </Fragment>
                    ),
                    completed: getStepContent(step - 2).completed && getStepContent(step - 1).completed,
                    reachable: (getStepContent(step - 2).completed && getStepContent(step - 1).completed) || getStepContent(step - 1).reachable
                };
            case 3:
                return {
                    component: (
                        <Fragment>
                            <Header as='h3' content='Review and Deploy' style={{marginBottom: '30px'}} color='purple'/>
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
                    completed: !!costPaid,
                    reachable: getStepContent(step - 2).completed || !!costPaid  
                };
            case 4:
                return {
                    component: (
                        <Fragment>
                            <Header as='h3' content='Receipt' style={{marginBottom: '30px'}} color='purple'/>
                            {costPaid && 
                                <Grid.Row style={{ minWidth: 'max-content', paddingTop: '2%' }}>
                                    <DeploymentOutput contractAddress={contractAddress} costPaid={costPaid} />
                                </Grid.Row>
                            }
                            

                        </Fragment>
                    ),
                    completed: getStepContent(step - 1).completed,
                    reachable: getStepContent(step - 1).completed
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
        console.log('fingerprint', fingerprint)
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
            {!shouldDisplayOriginalDomainStep() ? (
                <div className={classes.root}>
                    <Stepper alternativeLabel nonLinear activeStep={activeStep} style={{ background: 'none' }}>
                        {steps.map((label, index) => {
                            const stepProps = {};
                            const buttonProps = {};
                            if (isStepOptional(index)) {
                                buttonProps.optional = <Typography variant="caption" style={{ fontSize: '0.9em' }}>Optional</Typography>;
                            }
                            return (
                                <Step key={label} {...stepProps}>
                                    <StepButton
                                        onClick={handleStep(index)}
                                        completed={getStepContent(index).completed}
                                        disabled={!getStepContent(index).reachable}
                                        {...buttonProps}
                                    >
                                        <span style={{ fontSize: '1.2em' }}>{label}</span>
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
                                    {costPaid && !initInputs && (
                                        <BtnSuir
                                            basic
                                            onClick={handleReset}
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

                                    {((activeStep < 3 && !costPaid) || (activeStep <= 3 && costPaid)) && (
                                        <BtnSuir
                                            basic
                                            color="purple"
                                            disabled={!getStepContent(activeStep).completed}
                                            onClick={handleNext}
                                        >
                                            Next
                                        </BtnSuir>
                                    )}
                                    {activeStep === 3 && !costPaid && (
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
            ) : 
                (
                    <Fragment>
                        {renderOriginalDomainInput()}
                    </Fragment>
                )
            }
        </React.Fragment>
    );
};

export default DeploymentForm;