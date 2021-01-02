import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Form, Dimmer, Loader, Segment } from 'semantic-ui-react';

import axios from 'axios';
import { Certificate } from '@fidm/x509';

import AppContext, { TescNewContext } from '../../appContext';
import FilePicker from '../FilePicker';
import { buildNegativeMsg, buildWarningMsg } from "../FeedbackMessage";

import { predictContractAddress, formatClaim, flagsToBytes24Hex, FLAG_POSITIONS } from '../../utils/tesc';


const FingerprintInput = ({ inputs, onGetFingerprint }) => {
    const { web3 } = useContext(AppContext);
    const { showMessage } = useContext(TescNewContext);

    const [sysMsg, setSysMsg] = useState(null);
    const [isWaiting, setIsWaiting] = useState(false);

    const [sliderState, setSliderState] = useState(false);
    const [fingerprint, setFingerprint] = useState('');

    const [certPEM, setCertPEM] = useState('');
    const [filePickerDisplayed, setFilePickerDisplayed] = useState(false);

    const domain = useRef(inputs.domain);
    const flags = useRef(inputs.flags);
    const expiry = useRef(inputs.expiry);
    const signature = useRef(inputs.signature);

    const contractAddress = useRef('');
    const claim = useRef('');

    const cache = useRef({});

    const resetStates = () => {
        setFilePickerDisplayed(false);
        setFingerprint('');
        setSysMsg(null);
        setCertPEM('');
    };

    const handleChangeSliderState = async () => {
        setSliderState(!sliderState);

        if (!sliderState) {
            retrieveCertificate();
        } else {
            resetStates();
        }
    };

    const handlePickCert = useCallback(async (certPEM) => {
        setCertPEM(certPEM);
        console.log('CLAIM', claim.current);
        try {
            if (!cache.current[domain.current]) {
                const cert = Certificate.fromPEM(certPEM);
                if (!cert.dnsNames.includes(domain.current) && !cert.ipAddresses.includes(domain.current)) {
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
                setFingerprint(res.data.fingerprint);

            } else {
                setFingerprint(cache.current[domain.current]);
            }

        } catch (error) {
            setFingerprint('');
            const msg = (error.response) ? getMsgFromErrorCode(error.response.data.err) : error.message;
            setSysMsg(buildNegativeMsg({
                header: 'Unable to compute fingerprint',
                msg
            }));
        }
    }, []);

    const updateClaim = useCallback(() => {
        const curDomain = !!flags.current.get(FLAG_POSITIONS.DOMAIN_HASHED) ? web3.utils.sha3(domain.current).substring(2) : domain.current;
        if (contractAddress.current && domain.current && expiry.current) {
            console.log('cAdd in');
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
                setFingerprint(res.data.fingerprint);

            } else {
                setFingerprint(cache.current[domain.current]);
            }

        } catch (error) {
            setFingerprint('');
            const msg = (error.response) ? getMsgFromErrorCode(error.response.data.err) : error.message;
            setSysMsg(buildWarningMsg({
                header: 'Unable to automatically retrieve domain certificate to compute the fingerprint.',
                msg: `${msg}${!!msg.match(/[.!]+$/i) ? '' : '.'} You can also upload your domain certificate manually.`
            }));
            setFilePickerDisplayed(true);
        }
    }, [updateClaim]);


    useEffect(() => {
        (async () => {
            console.log('INPUTS', inputs);
            if (!contractAddress.current && web3.currentProvider.selectedAddress) {
                contractAddress.current = await predictContractAddress(web3);
            }
            if (signature.current !== inputs.signature) {
                signature.current = inputs.signature;
                if (sliderState && signature.current) {
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
            console.log('Signature.current', signature.current);

        })();
    }, [inputs, sliderState, retrieveCertificate, certPEM, handlePickCert, web3]);

    const getMsgFromErrorCode = (errMsg) => {
        if (errMsg.includes('getaddrinfo ENOTFOUND'))
            return ` Unable to connect to ${domain.current}. Please check your domain input and the availability of your website. `;
        else if (errMsg.includes('Signature does not match'))
            return `${errMsg}. Please make sure you have selected the right certificate for domain ${domain.current}`;
        return errMsg;
    };


    useEffect(() => {
        if (fingerprint) {
            cache.current[domain.current] = fingerprint;
        }
        if (sysMsg && fingerprint) {
            setSysMsg(null);
        } else {
            showMessage(sysMsg);
        }

        onGetFingerprint(fingerprint);
        setIsWaiting(false);
    }, [fingerprint, sysMsg, showMessage, onGetFingerprint]);


    return (
        <div>
            <Form.Checkbox
                toggle
                checked={sliderState}
                label='Use certificate fingerprint (optional)'
                onClick={handleChangeSliderState}
                disabled={!signature.current || !domain.current}
            />
            {filePickerDisplayed && !fingerprint && (<FilePicker label='Choose certificate' onPickFile={handlePickCert} isDisabled={!sliderState} />)}
            {sliderState && fingerprint && (<p><b>Fingerprint: {fingerprint}</b></p>)
            }
            <Dimmer active={isWaiting} inverted>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>
        </div>
    );

};

export default FingerprintInput;