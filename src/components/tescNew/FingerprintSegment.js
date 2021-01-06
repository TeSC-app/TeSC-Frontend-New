import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Form, Dimmer, Loader, Segment, Label } from 'semantic-ui-react';

import axios from 'axios';
import { Certificate } from '@fidm/x509';

import AppContext from '../../appContext';
import FilePicker from '../FilePicker';
import { buildNegativeMsg, buildWarningMsg } from "../FeedbackMessage";

import { predictContractAddress, formatClaim, flagsToBytes24Hex, FLAG_POSITIONS } from '../../utils/tesc';


const FingerprintSegment = ({ inputs, onGetFingerprint }) => {
    const { web3, showMessage } = useContext(AppContext);

    const [isWaiting, setIsWaiting] = useState(false);

    const [sliderState, setSliderState] = useState(!inputs.fingerprint || parseInt(inputs.fingerprint, 16) === 0 ? false : true);
    const [fingerprint, setFingerprint] = useState(!inputs.fingerprint || parseInt(inputs.fingerprint, 16) === 0 ? '' : inputs.fingerprint);

    const [certPEM, setCertPEM] = useState('');
    const [filePickerDisplayed, setFilePickerDisplayed] = useState(false);

    const domain = useRef(inputs.domain);
    const flags = useRef(inputs.flags);
    const expiry = useRef(inputs.expiry);
    const signature = useRef(inputs.signature);

    const contractAddress = useRef(inputs.contractAddress);
    const claim = useRef('');

    const cache = useRef({});
    const prevFingerprint = useRef(fingerprint);


    const resetStates = useCallback(() => {
        setFilePickerDisplayed(false);
        setFingerprint('');
        setCertPEM('');
        onGetFingerprint('');
        prevFingerprint.current = ''
    }, [onGetFingerprint]);

    const handleChangeSliderState = async () => {
        setSliderState(!sliderState);

        if (!sliderState) {
            retrieveCertificate();
        } else {
            resetStates();
            showMessage(null, 'fp');
        }
    };

    const handlePickCert = useCallback(async (certPEM) => {
        setCertPEM(certPEM);
        try {
            if (!cache.current[domain.current]) {
                const cert = Certificate.fromPEM(certPEM);
                if (!cert.dnsNames.includes(domain.current) || !cert.ipAddresses.includes(domain.current)) {
                    throw new Error(`The selected certificate is not issued to domain ${domain.current}`);
                }

                setIsWaiting(true);
                const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-uploading`, {
                    params: {
                        certPEM,
                        signature: signature.current,
                        claim: claim.current
                    }
                });
                const fingerprintLowerCase = res.data.fingerprint.toLowerCase();
                setFingerprint(fingerprintLowerCase);
                cache.current[domain.current] = fingerprintLowerCase;

            } else {
                setFingerprint(cache.current[domain.current]);
                setCertPEM('');
            }

        } catch (error) {
            const msg = (error.response) ? getMsgFromErrorCode(error.response.data.err) : error.message;
            showMessage(buildNegativeMsg({
                header: 'Unable to compute fingerprint',
                msg,
                closingCondition: 'fp'
            }));
            setFingerprint('');
        }
    }, [showMessage]);

    const updateClaim = useCallback(() => {
        const curDomain = !!flags.current.get(FLAG_POSITIONS.DOMAIN_HASHED) ? web3.utils.sha3(domain.current).substring(2) : domain.current;
        if (contractAddress.current && domain.current && expiry.current) {
            claim.current = formatClaim({
                contractAddress: contractAddress.current,
                domain: curDomain,
                expiry: expiry.current,
                flags: flagsToBytes24Hex(flags.current)
            });
        }
    }, [web3.utils]);

    const retrieveCertificate = useCallback(async () => {
        try {
            if (!cache.current[domain.current]) {
                setIsWaiting(true);
                updateClaim();
                const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-retrieval`, {
                    params: {
                        domain: domain.current,
                        signature: signature.current,
                        claim: claim.current
                    }
                });
                const fingerprintLowerCase = res.data.fingerprint.toLowerCase();
                setFingerprint(fingerprintLowerCase);
                cache.current[domain.current] = fingerprintLowerCase;

            } else {
                setFingerprint(cache.current[domain.current]);
            }

        } catch (error) {
            const msg = (error.response) ? getMsgFromErrorCode(error.response.data.err) : error.message;
            showMessage(buildWarningMsg({
                header: 'Unable to automatically retrieve domain certificate to compute the fingerprint.',
                msg: `${msg}${!!msg.match(/[.!]+$/i) ? '' : '.'} You can also upload your domain certificate manually.`,
                closingCondition: 'fp'
            }));
            setFilePickerDisplayed(true);
            setFingerprint('');
        }
    }, [updateClaim, showMessage]);


    useEffect(() => {
        (async () => {
            if (!contractAddress.current && web3.currentProvider.selectedAddress) {
                contractAddress.current = await predictContractAddress(web3);
            }
            if (signature.current !== inputs.signature) {
                signature.current = inputs.signature;
                if (sliderState && signature.current && !inputs.fingerprint) {
                    (!certPEM) ? retrieveCertificate() : handlePickCert(certPEM);

                } else if (!signature.current) {
                    resetStates();
                    setSliderState(false);
                }
            }
            if (signature.current) {
                if (domain.current !== inputs.domain) {
                    domain.current = inputs.domain;
                } else if (expiry.current !== inputs.expiry) {
                    expiry.current = inputs.expiry;
                } else if (flags.current !== inputs.flags) {
                    flags.current = inputs.flags;
                }
            }
        })();
    }, [inputs, sliderState, retrieveCertificate, certPEM, handlePickCert, resetStates, web3]);

    const getMsgFromErrorCode = (errMsg) => {
        if (errMsg.includes('getaddrinfo ENOTFOUND'))
            return ` Unable to connect to ${domain.current}. Please check your domain input and the availability of your website.`;
        else if (errMsg.includes('Signature does not match'))
            return `${errMsg}. Please make sure you have selected the right certificate for domain ${domain.current}`;
        return errMsg;
    };


    useEffect(() => {
        if (sliderState && fingerprint !== prevFingerprint.current) {
            onGetFingerprint(fingerprint);
            prevFingerprint.current = fingerprint;
        }
        setIsWaiting(false);
    }, [fingerprint, sliderState, onGetFingerprint]);


    return (
        <div>
            <Form.Checkbox
                toggle
                checked={sliderState}
                label='Use certificate fingerprint (optional)'
                onClick={handleChangeSliderState}
                disabled={!signature.current}
            />
            {sliderState && (fingerprint || filePickerDisplayed) &&
                <Segment style={{ maxWidth: '50%', width: 'max-content' }}>
                    {filePickerDisplayed && !fingerprint && (<FilePicker label='Choose certificate' onPickFile={handlePickCert} isDisabled={!sliderState} />)}
                    {sliderState && fingerprint && (<span style={{ wordBreak: 'break-all' }}><b>Fingerprint: <Label>{fingerprint}</Label></b></span>)
                    }
                    <Dimmer active={isWaiting} inverted>
                        <Loader indeterminate content='Retrieving certificate and computing fingerprint...' />
                    </Dimmer>
                </Segment>
            }
        </div>
    );

};

export default FingerprintSegment;