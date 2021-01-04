import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button, Segment, Dimmer, Loader } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import moment from 'moment';
import BitSet from 'bitset';

import AppContext from '../../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "../FeedbackMessage";
import FilePicker from '../FilePicker';
import FingerprintSegment from './FingerprintSegment';
import DeploymentOutput from './DeploymentOutput';

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

const DeploymentForm = ({ initInputs }) => {
    const { web3, showMessage, handleBlockScreen } = useContext(AppContext);

    const [contractAddress, setContractAddress] = useState('');

    const [domain, setDomain] = useState('');
    const [expiry, setExpiry] = useState(null);
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(new BitSet('0x00'));
    const [domainHashed, setDomainHashed] = useState('');
    const [fingerprint, setFingerprint] = useState('');

    const [isMetamaskOpen, setIsMetamaskOpen] = useState(false);

    const privateKeyPEM = useRef('');

    const [costEstimated, setCostEstimated] = useState(null);
    const [costPaid, setCostPaid] = useState(null);

    const prevExpiry = useRef(expiry);
    const prevFlags = useRef(flags.toString());
    const prevSignature = useRef(signature);
    const prevFingerprint = useRef('');

    useEffect(() => {
        if (initInputs && initInputs.contractAddress) {
            setContractAddress(initInputs.contractAddress);
            setDomain(initInputs.domain);
            handleExpiryChange(new Date(parseInt(initInputs.expiry) * 1000))
            // setExpiry(expiry);
            setFlags(initInputs.flags);
            setSignature(initInputs.signature);
            console.log("FINGERPRINT", initInputs.fingerprint)
            setFingerprint(initInputs.fingerprint)
        }
    }, []);

    const getCurrentDomain = useCallback(() => !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain,
        [domainHashed, domain, flags]);

    const computeSignature = useCallback(async () => {
        const domain = getCurrentDomain();
        if (!!privateKeyPEM.current && !!domain && !!expiry) {
            try {
                const address = await predictContractAddress(web3);
                const flagsHex = flagsToBytes24Hex(flags);
                const payload = { address, domain, expiry, flagsHex };
                setSignature(await generateSignature(payload, privateKeyPEM.current));
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
    }, [expiry, flags, getCurrentDomain, showMessage, web3]);

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
            padToBytesX(fingerprint, 32),
            signature
        );
    }, [contractAddress, expiry, flags, signature, fingerprint, web3.eth.Contract, getCurrentDomain]);

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
        privateKeyPEM.current = content;
        computeSignature();
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
                const estCost = await estimateDeploymentCost(web3, tx);
                setCostEstimated(estCost);

                if (signature !== prevSignature.current)
                    prevSignature.current = signature;
                else if (fingerprint !== prevFingerprint.current)
                    prevFingerprint.current = fingerprint;
            }
        })();
    }, [expiry, flags, signature, domain, computeSignature, fingerprint, getCurrentDomain, makeDeploymentTx, initInputs, makeUpdateTx, web3]);

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
    };

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).map(([flagName, i]) =>
            <Form.Checkbox
                key={i}
                checked={!!flags.get(i)}
                label={flagName}
                onClick={() => handleFlagsChange(i)}
                disabled={!domain || !expiry}
            />
        );
    };

    return (
        <React.Fragment>
            <Form style={{ width: '80%', margin: '40px auto' }}>
                <Form.Group widths='equal'>
                    <Form.Field>
                        <label>Domain  <span style={{ color: 'red' }}>*</span></label>
                        <Input
                            value={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain}
                            disabled={!!domain && !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED)}
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
                            label='Choose certificate private key'
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
                        inputs={{ domain, expiry, flags, signature, fingerprint: initInputs? initInputs.fingerprint : '' }}
                        onGetFingerprint={handleGetFingerprint}
                    />
                </Form.Group>

                {contractAddress && (<DeploymentOutput contractAddress={contractAddress} costPaid={costPaid} />)}

                {!!costEstimated && !!signature && (
                    <div style={{ float: 'right', marginTop: '3px' }}>
                        <Label tag style={{ color: 'royalblue', }}>
                            {costEstimated.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH</span>
                        </Label>
                    </div>
                )}
                <br />
                <br />
                <Button
                    onClick={handleSubmit}
                    disabled={!signature || !privateKeyPEM.current}
                    floated='right'
                    positive
                    style={{ width: '20%', marginTop: '0px' }}
                >
                    {!initInputs ? 'Deploy' : 'Update'}
                </Button>

                <Dimmer active={!!initInputs && isMetamaskOpen} inverted>
                    <Loader indeterminate content='Waiting for transaction to finish...' />
                </Dimmer>
            </Form>
        </React.Fragment>
    );
};

export default DeploymentForm;