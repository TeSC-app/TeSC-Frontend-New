import React, { Fragment, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button as BtnSuir, Segment, Popup, Radio, Header, TextArea, Divider, Icon, Grid, Dropdown } from 'semantic-ui-react';
import Highlight from 'react-highlight.js';
import hljs from 'highlight.js';
import hljsSolidity from 'highlightjs-solidity';

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
import {
    getTooltipForType,
    isEmptyValidInputForType,
    validateConstructorParameterInput
} from '../../utils/constructorInput';
import {
    ethToUsd
} from '../../utils/conversionRate';

import { extractAxiosErrorMessage } from '../../utils/formatError';
import axios from 'axios';

hljsSolidity(hljs);
hljs.initHighlightingOnLoad();

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

    const [contractAddress, setContractAddress] = useState(initInputs ? initInputs.contractAddress : '');
    const [futureContractAddress, setFutureContractAddress] = useState(initInputs ? initInputs.contractAddress : '');

    const [domain, setDomain] = useState(initInputs && !initInputs.flags.get(FLAGS.DOMAIN_HASHED) ? initInputs.domain : typedInDomain);
    const [expiry, setExpiry] = useState(initInputs ? initInputs.expiry : null);
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(initInputs ? initInputs.flags : new BitSet('0x00'));
    const [currentDomain, setCurrentDomain] = useState(initInputs && !!initInputs.flags.get(FLAGS.DOMAIN_HASHED) ? initInputs.domain : domain);
    const [fingerprint, setFingerprint] = useState(defaultFingerprint);


    const [privateKeyPEM, setPrivateKeyPEM] = useState('');
    const [privateKeyFileName, setPrivateKeyFileName] = useState('');

    const [solidityCode, setSolidityCode] = useState(null);
    const [endorsedSolidityCode, setEndorsedSolidityCode] = useState(null);
    const [solidityFileName, setSolidityFileName] = useState(null);

    const [costsEstimated, setCostsEstimated] = useState(null);
    const [costsPaid, setCostsPaid] = useState(null);

    const [isMetamaskOpen, setIsMetamaskOpen] = useState(false);
    const [isMatchedOriginalDomain, setIsMatchedOriginalDomain] = useState(typedInDomain ? true : false);

    const [sigInputType, setSigInputType] = useState(null);
    const [deploymentType, setDeploymentType] = useState(null);

    const [deploymentJson, setDeploymentJson] = useState(null);
    const [constructorParameters, setConstructorParameters] = useState(null);
    const [constructorParameterValues, setConstructorParameterValues] = useState([]);
    const [allParamsCorrectlyEntered, setAllParamsCorrectlyEntered] = useState(null);
    const [contractsInFile, setContractsInFile] = useState(null);
    const [selectedContract, setSelectedContract] = useState(null);

    const classes = useStyles();
    const [activeStep, setActiveStep] = React.useState(0);

    const prevExpiry = useRef(expiry);
    const prevFlags = useRef(flags.toString());
    const prevSignature = useRef(signature);
    const prevFingerprint = useRef(fingerprint);
    const prevPrivateKeyPEM = useRef(privateKeyPEM);

    

    const getClaimString = () => {
        return formatClaim({contractAddress: futureContractAddress, domain: currentDomain, expiry, flags: flagsToBytes24Hex(flags)})
    }

    const computeSignature = useCallback(async (currentDomain) => {
        if (prevPrivateKeyPEM.current && currentDomain && prevExpiry.current) {
            try {
                let address = futureContractAddress;
                if(!address) {
                    address = await predictContractAddress(web3);
                    setFutureContractAddress(address);
                }
                const flagsHex = flagsToBytes24Hex(prevFlags.current);
                const payload = { address, domain: currentDomain, expiry: prevExpiry.current, flagsHex };
                setSignature(await generateSignature(payload, prevPrivateKeyPEM.current));
            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to compute signature',
                    msg: err.message
                }));
            }
        } else if (!currentDomain || !prevExpiry.current) {
            setSignature('');
        }
    }, [futureContractAddress, showMessage, web3]);

    const handleLoseDomainInputFocus = () => {
        if (fingerprint) {
            setFingerprint(defaultFingerprint)
        }
        computeSignature(currentDomain);
        
    }

    const makeDeploymentTx = useCallback(async (currentDomain, json, constructorParameterValues) => {
        return await new web3.eth.Contract(json.abi).deploy({
            data: json.bytecode,
            arguments: [currentDomain, prevExpiry.current, flagsToBytes24Hex(prevFlags.current), padToBytesX(prevFingerprint.current, 32), prevSignature.current].concat(constructorParameterValues)
        });
    }, [web3.eth.Contract]);

    const makeUpdateTx = useCallback(async (currentDomain) => {
        return await new web3.eth.Contract(TeSC.abi, contractAddress).methods.setEndorsement(
            currentDomain,
            prevExpiry.current,
            flagsToBytes24Hex(prevFlags.current),
            padToBytesX(prevFingerprint.current),
            prevSignature.current
        );
    }, [contractAddress, web3.eth.Contract]);
    

    const handlePickPrivateKey = (filename, content) => {
        setPrivateKeyFileName(filename);
        setPrivateKeyPEM(content);
    };

    const handlePickSolidityFile = async (filename, content) => {
        setSelectedContract(null);
        try{
            await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/solidityCode/compile`, {
                params: {
                    solidityCode: content
                }
            });
        }catch(error){
            showMessage(buildNegativeMsg({
                header: 'Unable to compile your file',
                msg: "Please make sure to upload a valid file"
            }));
            return;
        }
        
        setSolidityFileName(filename);
        setSolidityCode(content);

        const contractsRes = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/solidityCode/contracts`, {
            params: {
                solidityCode: content
            }
        });
        const contractsInFile = contractsRes.data.contractNames;
        setContractsInFile(contractsInFile);

        if(contractsInFile.length === 1){
            handleContractSelected(contractsInFile[0], content);
        } 
    };

    const buildContractDropdownOptions = (contractNames) => {
        const options = [];
        contractNames.forEach(contractName => {
            options.push({
                key: contractName,
                text: contractName,
                value: contractName,
            });
        });
        return options;
    }

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
                console.log(1)
            }
            if (expiry !== prevExpiry.current) {
                prevExpiry.current = expiry;
                if (privateKeyPEM) computeSignature(currentDomain);
                console.log(2)

            } else if (flags.toString() !== prevFlags.current) {
                prevFlags.current = flags.toString();
                if (privateKeyPEM) computeSignature(currentDomain);
                console.log(3)

            } else if (privateKeyPEM !== prevPrivateKeyPEM.current) {
                prevPrivateKeyPEM.current = privateKeyPEM;
                computeSignature(currentDomain);

            } else if (signature !== prevSignature.current || fingerprint !== prevFingerprint.current) {
                if (signature !== prevSignature.current) {
                    prevSignature.current = signature;
                    console.log(4)
                }
                else if (fingerprint !== prevFingerprint.current)
                    prevFingerprint.current = fingerprint;

                if (signature) {
                    console.log(5)
                    const tx = !initInputs ? await makeDeploymentTx(currentDomain, deploymentJson, constructorParameterValues) : await makeUpdateTx(currentDomain);
                    if (!initInputs || contractAddress) {
                        try{
                            const estCost = await estimateDeploymentCost(web3, tx);
                            const estCostUsd = await ethToUsd(estCost);
                            setCostsEstimated({eth: estCost, usd: estCostUsd});
                            console.log("$$$$$$$$", estCostUsd);
                            
                        }catch(error){
                            showMessage(buildNegativeMsg({
                                header: 'Unable to estimate transaction cost',
                                msg: "You probably entered invalid constructor parameters in the first step"
                            }));
                        }           
                    }
                }

            } 
        })();
    }, [currentDomain, expiry, contractAddress, futureContractAddress, flags, signature, privateKeyPEM, computeSignature,
        fingerprint, makeDeploymentTx, initInputs, makeUpdateTx, web3, constructorParameterValues, deploymentJson, showMessage]);


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

        let success = false;
        if (currentDomain && expiry && signature) {
            try {
                await validateEndorsement();
                const tx = !initInputs ? await makeDeploymentTx(currentDomain, deploymentJson, constructorParameterValues) : await makeUpdateTx(currentDomain);
                console.log("tx", tx)
                await tx.send({ from: account, gas: '3000000' })
                    .on('receipt', async (txReceipt) => {
                        const costPaid = txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether');
                        setCostsPaid({eth: costPaid, usd: await ethToUsd(costPaid)});
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
                                domain: currentDomain, 
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
                msg: `${!currentDomain ? 'Domain' : !expiry ? 'Expiry' : !signature ? 'Signature' : 'Some required input'} is empty`
            }));
        }
        handleBlockScreen(false);
        setIsMetamaskOpen(false);
        if (success) {
            handleNext();
        }
    };


    const renderConstructorParameterInputFields = () => {
        return constructorParameters.map((constructorParameter, i) => 
            <Form.Group inline>
                <label>
                    {constructorParameter.type} {constructorParameter.name} 
                    {!isEmptyValidInputForType(constructorParameter.type) && <span style={{ color: 'red' }}>*</span>} 
                    <Popup
                        inverted
                        content={getTooltipForType(constructorParameter.type)}
                        trigger={<Icon name='question circle' />}
                    />
                </label>
                <Input
                    // TODO how does interaction between value and onChange work?
                    //value={constructorParameterValues[i].toString()}
                    onChange={e => handleTextChange(e.target.value, i, constructorParameter.type)}
                />
            </Form.Group>
        )
    }

    const handleTextChange = (value, index, type) => {
        const updatedValues = constructorParameterValues;
        if(type.endsWith("[]")){
            if(value === ""){
                updatedValues[index] = [];
            }else{
                updatedValues[index] = value.split(',');
            }
        }else{
            updatedValues[index] = value;
        }
        setConstructorParameterValues(updatedValues);
        setAllParamsCorrectlyEntered(validateConstructorParameterInput(constructorParameters, constructorParameterValues));
    }

    const handleEnterOriginalDomain = (originalDomain) => {
        setDomain(originalDomain);
        if (originalDomain && web3.utils.sha3(originalDomain) === currentDomain) {
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

    const handleSwitchDeploymentType = (val) => {
        setDeploymentType(val);
        if(val === 'reference'){
            setDeploymentJson({abi: TeSC.abi, bytecode: TeSC.bytecode});
            // make everything related to the other deployment type disappear
            setContractsInFile(null);
            setSelectedContract(null);
            setConstructorParameters(null);
            setConstructorParameterValues([]);
            setAllParamsCorrectlyEntered(null);
        }
    }

    const handleContractSelectedFromDropdown = (e, {name, value}) => {
        handleContractSelected(value, solidityCode);
    }

    const handleContractSelected = async (value, code) => {
        setSelectedContract(value);

        // constructor parameters
        const constructorParametersRes = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/solidityCode/constructorParameters`, {
            params: {
                solidityCode: code,
                selectedContract: value
            }
        });
        const constructorParamsFromRes = constructorParametersRes.data.constructorParameters;
        setConstructorParameters(constructorParamsFromRes);

        // constructor parameters initial values
        const initialConstructorParameterValues = [];
        constructorParamsFromRes.forEach((parameter) => {
            if(parameter.type.endsWith("[]")){
                initialConstructorParameterValues.push([]);
            }else{
                initialConstructorParameterValues.push("");
            } 
        });
        setConstructorParameterValues(initialConstructorParameterValues);
        
        // endorsed solidity code
        const addInterfaceRes = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/solidityCode/addInterface`, {
            params: {
                solidityCode: code,
                selectedContract: value
            }
        });
        const solidityCodeWithInterface = addInterfaceRes.data.solidityCodeWithInterface;
        setEndorsedSolidityCode(solidityCodeWithInterface);

        // json for deployment
        const compileRes = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/solidityCode/compileAndGetJson`, {
            params: {
                solidityCode: solidityCodeWithInterface,
                selectedContract: value
            }
        });
        setDeploymentJson(compileRes.data.json);
    }

    const handleTextCopy = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(`echo -n ${getClaimString()} | openssl dgst -RSA-SHA256 -sign <path_to_private_key_file> | openssl base64 | cat`);
    };

    const shouldDisplayOriginalDomainStep = () => {
        return initInputs && flags.get(FLAGS.DOMAIN_HASHED) && !typedInDomain && !isMatchedOriginalDomain
    }

    const getSteps = () => {
        const steps = [
            `${initInputs ? 'Change' : 'Create'} Claim`, 
            `${initInputs ? 'Change' : 'Create'} Signature`, 
            `${initInputs ? 'Change' : 'Add'} Certificate Fingerprint`, 
            `Review and ${initInputs ? 'Update' : 'Deploy'}`, 
            'Receipt'
        ];
        if(!initInputs){
            steps.unshift(`Select Smart Contract`);
        }
        return steps;
    }


    const handleFlagsChange = (i, selected) => {
        const newFlags = new BitSet(flags.flip(i).toString());
        setFlags(newFlags);
        if (i === FLAGS.DOMAIN_HASHED) {
            if (domain && !selected) {
                setCurrentDomain(web3.utils.sha3(domain));
            } else {
                setCurrentDomain(domain)
            }
        }
        console.log('newFlags', flagsToBytes24Hex(flags))
    };

    const renderFlagCheckboxes = () => {
        const FLAGNAME_LABEL_MAPPING = {
            'ALLOW_SUBENDORSEMENT': 'Allow Subendorsement'
        }
        return Object.entries(FLAGS).filter(([flagName, i]) => i=== FLAGS.ALLOW_SUBENDORSEMENT).map(([flagName, i]) =>
                <Form.Checkbox
                    key={i}
                    checked={!!flags.get(i)}
                    // label={flagName}
                    label={FLAGNAME_LABEL_MAPPING[flagName]}
                    onClick={() => handleFlagsChange(i, !!flags.get(i))}
                    slider
                    className='slider'
                />
        );
    };
    
    const renderOriginalDomainInput = () => {
        return (
            <div raised padded='very' color='purple' style={{margin: '1% 5%'}}>
                <div style={{marginBottom: '30px'}}>
                    <b style={{color: '#A333C8', fontSize: '1.28571429rem'}} >
                        Enter Original Domain
                    </b>
                    <Popup
                        inverted
                        content={`The original plaintext domain that is hashed to the hash ${currentDomain} (required)`}
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
        let actualStep = step;
        if(initInputs){
            actualStep ++;
        }
        switch (actualStep) {
            case 0:
                return {
                    component: (
                        <>
                            <Header as='h3' content={getSteps()[step]} style={{marginBottom: '30px'}} color='purple'/>

                            <Form.Field>
                                <Radio
                                    label="Deploy reference implementation"
                                    name='deploymentTypeRadioGroup'
                                    value='reference'
                                    checked={deploymentType === 'reference'}
                                    onChange={(e, { value }) => handleSwitchDeploymentType(value)}
                                />
                            </Form.Field>
                            <Form.Field>
                                <Radio
                                    label='Endorse and deploy your own Smart Contract'
                                    name='deploymentTypeRadioGroup'
                                    value='custom'
                                    checked={deploymentType === 'custom'}
                                    onChange={(e, { value }) => handleSwitchDeploymentType(value)}
                                />
                            </Form.Field>

                            {deploymentType === "custom" && (
                                <div style={{ paddingTop: '15px' }}>
                                    <FilePicker
                                        label='Choose solidity file'
                                        onPickFile={handlePickSolidityFile}
                                        input={{fileName:solidityFileName, content: solidityCode}}
                                    />
                                    <div><em>Pick the solidity file with the Smart Contract that you want to endorse and deploy</em></div>
                                </div>     
                            )}

                            {(contractsInFile && contractsInFile.length > 1) && (
                                <div style={{ paddingTop: '20px' }}>
                                <Form.Field>
                                    <label>
                                        Smart Contract <span style={{ color: 'red' }}>*</span> 
                                        <Popup
                                            inverted
                                            content='Your file contains multiple Smart Contracts. Select the one that you want to endorse and deploy.'
                                            trigger={<Icon name='question circle' />}
                                        />
                                    </label>
                                    <Dropdown 
                                        placeholder='Select Smart Contract'
                                        fluid
                                        selection
                                        onChange={handleContractSelectedFromDropdown}
                                        options={buildContractDropdownOptions(contractsInFile)}>
                                    </Dropdown>
                                </Form.Field>
                                </div>
                            )}

                            {selectedContract && (
                                <div style={{ paddingTop: '25px' }}>
                                <Form.Field>              
                                    <label>
                                        File with endorsed Smart Contract 
                                        <Popup
                                            inverted
                                            content={solidityFileName + ' with endorsed ' + selectedContract}
                                            trigger={<Icon name='question circle' />}
                                        />
                                    </label>
                                    <Highlight language='solidity'>
                                        {endorsedSolidityCode}
                                    </Highlight>
                                </Form.Field>      
                                </div>   
                            )}

                            {(constructorParameters && constructorParameters.length > 0) && (
                               <div style={{ paddingTop: '20px' }}>
                                    <label>
                                        <b>Values for constructor parameters</b> <span style={{ color: 'red' }}>*</span>
                                        <Popup
                                            inverted
                                            content={'The constructor of ' + selectedContract + ' has additional parameters. Please enter values for them.'}
                                            trigger={<Icon name='question circle' />}
                                        />
                                    </label>
                                    {renderConstructorParameterInputFields()}
                               </div>      
                            )}
                        </>
                    ),
                    completed: deploymentType === "reference" || (selectedContract && constructorParameters && (constructorParameters.length === 0 || allParamsCorrectlyEntered && allParamsCorrectlyEntered === true)),
                    reachable: true
                }
            case 1:
                return {
                    component: (
                        <>
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
                                    value={currentDomain}
                                    disabled={!!flags.get(FLAGS.DOMAIN_HASHED)}
                                    placeholder='www.mysite.com'
                                    onChange={e => {setDomain(e.target.value); setCurrentDomain(e.target.value)}}
                                    onBlur={() => handleLoseDomainInputFocus()}
                                    icon='world'
                                />
                            </Form.Field>
                            <Form.Field>
                                <Form.Checkbox
                                    checked={!!flags.get(FLAGS.DOMAIN_HASHED)}
                                    label='Hash Domain'
                                    onClick={() => handleFlagsChange(FLAGS.DOMAIN_HASHED, !!flags.get(FLAGS.DOMAIN_HASHED))}
                                    disabled={(!initInputs && (!domain)) || (initInputs && !isMatchedOriginalDomain)}
                                    slider
                                />
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
                                    onBlur={() => computeSignature(currentDomain)}
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

                            <Form.Field>
                                {renderFlagCheckboxes()}
                            </Form.Field>
                        </>
                    ),
                    completed: initInputs? (currentDomain !== initInputs.domain) || (expiry !== initInputs.expiry) : !!currentDomain && !!expiry ,
                    reachable: initInputs && currentDomain? isMatchedOriginalDomain: true
                };
            case 2:
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
                                            isDisabled={!currentDomain || !expiry}
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
            case 3:
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
            case 4:
                return {
                    component: (
                        <Fragment>
                            <Header as='h3' content='Review and Deploy' style={{marginBottom: '30px'}} color='purple'/>
                            <TescDataTable
                                data={{ contractAddress, domain: currentDomain, expiry, flags, signature, fingerprint }}
                            />
                            {!!costsEstimated && !!signature && (
                                <div style={{ float: 'right'}}>
                                    <span>Cost estimation:  </span>
                                    <Label tag style={{ color: 'royalblue', }}>
                                        {costsEstimated.eth.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH </span>
                                        {costsEstimated.usd > 0 && `(${costsEstimated.usd.toFixed(2)}`} <span style={{ fontSize: '0.75em' }}>USD</span>)
                                    </Label>
                                </div>
                            )}
                        </Fragment>
                    ),
                    completed: !!costsPaid,
                    reachable: getStepContent(step - 2).completed || !!costsPaid  
                };
            case 5:
                return {
                    component: (
                        <Fragment>
                            <Header as='h3' content='Receipt' style={{marginBottom: '30px'}} color='purple'/>
                            {costsPaid && 
                                <Grid.Row style={{ minWidth: 'max-content', paddingTop: '2%' }}>
                                    <DeploymentOutput contractAddress={contractAddress} domain={domain} costsPaid={costsPaid} />
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
        return step === 3;
    };

    const allStepsCompleted = () => {
        return getSteps().filter((step, i) => getStepContent(i).completed) === getSteps().length;
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
                getSteps().findIndex((step, i) => !getStepContent(i).completed)
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
        setCurrentDomain('');
        setExpiry(null);
        setFlags(new BitSet('0x00'));
        setSignature('');
        setFingerprint('');
        setPrivateKeyPEM('');
        setPrivateKeyFileName('');
        setCostsEstimated(null);
        setCostsPaid(null);
        setSigInputType(null);

        showMessage(null);
    };


    return (
        <React.Fragment>
            {!shouldDisplayOriginalDomainStep() ? (
                <div className={classes.root}>
                    <Stepper alternativeLabel nonLinear activeStep={activeStep} style={{ background: 'none' }}>
                        {getSteps().map((label, index) => {
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
                                    {costsPaid && !initInputs && (
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

                                    {((activeStep < 4 && !costsPaid) || (activeStep <= 4 && costsPaid)) && (
                                        <BtnSuir
                                            basic
                                            color="purple"
                                            disabled={!getStepContent(activeStep).completed}
                                            onClick={handleNext}
                                        >
                                            Next
                                        </BtnSuir>
                                    )}
                                    {activeStep === 4 && !costsPaid && (
                                        <BtnSuir
                                            icon='play circle'
                                            basic
                                            onClick={handleSubmit}
                                            disabled={!signature}
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