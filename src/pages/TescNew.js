import React, { useState } from 'react';
import { Grid } from 'semantic-ui-react';


import 'react-day-picker/lib/style.css';

import DeploymentForm from '../components/tescNew/DeploymentForm';
import FeedbackMessage from "../components/FeedbackMessage";


const TeSCNew = () => {

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

    const [costEstimated, setCostEstimated] = useState(0);
    const [costActual, setCostActual] = useState(0);

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
                }).send({ from: account, gas: '2000000' })
                    .on('receipt', async (txReceipt) => {
                        console.log("TX_RECEIPT: ", txReceipt);
                        setCostActual(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether'));
                    });


                setDeployDone(true);
                const isFavourite = false;
                const own = true;

                setSysMsg(buildPositiveMsg({
                    header: 'Smart Contract successfully deployed',
                    msg: `TLS-endorsed Smart Contract deployed successully at address ${contractAddress}`
                }));


                let tescs = JSON.parse(localStorage.getItem(account));
                if (!tescs) {
                    tescs = [];
                }
                tescs.push({ contractAddress, domain, expiry, isFavourite, own });
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

    const handleFeedback = (feedback) => {
        setSysMsg(feedback)
    }

    return (
        <React.Fragment>
            <Grid style={{ marginBottom: '50px', height: '50px' }}>
                <Grid.Row style={{ height: '100%' }}>
                    <Grid.Column width={5}>
                        <h2>Create & Deploy TeSC</h2>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <div style={{ float: 'right' }}>
                            {sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}

                        </div>
                    </Grid.Column>
                </Grid.Row>

            </Grid>
            <DeploymentForm onFeedback={handleFeedback} />


        </React.Fragment>
    );
};

export default TeSCNew;