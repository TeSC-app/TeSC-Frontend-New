import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button as BtnSuir, Segment, Popup, Radio, Header, TextArea, Divider, Icon, Grid } from 'semantic-ui-react';

import TeSC from '../../ethereum/build/contracts/ERCXXXImplementation.json';
import AppContext from '../../appContext';
import { buildNegativeMsg } from "../FeedbackMessage";

import { isValidContractAddress } from '../../utils/tesc';



const SubEndorsementAddition = ({ contractAddress }) => {
    const { web3, showMessage } = useContext(AppContext);
    const [subendorsements, setSubendorsements] = useState(['']);
    const [invalidInputIndices, setInvalidInputIndices] = useState(new Set());
    const [invalidInputReasons, setInvalidInputReasons] = useState(null);

    useEffect(() => {
        (async () => {
            const contract = new web3.eth.Contract(TeSC.abi, contractAddress);
            const fetchedSubendorsements = await contract.methods.getSubendorsements().call();
            console.log('fetchedSubendorsements', fetchedSubendorsements);
            setSubendorsements([...fetchedSubendorsements, '']);
        })();
    }, [contractAddress, web3.eth]);

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    const handleChangeSubendorsementInputs = (newAddress, index) => {
        try {
            let last = subendorsements.length - 1;
            let updatedSubendorsements = subendorsements.map((curAddress, i) => {
                if (index === i) return newAddress;
                return curAddress;
            });

            if (newAddress === '' && index !== last) {
                updatedSubendorsements = updatedSubendorsements.slice(0, last);
                last = updatedSubendorsements.length - 1;
                setSubendorsements(updatedSubendorsements);
            } else if (newAddress) {
                setSubendorsements(index === last ? [...updatedSubendorsements, ''] : updatedSubendorsements);
            }

            console.log('index', index);
            console.log('last', last);
            if ((newAddress === '' && index === last) || isValidContractAddress(newAddress, true)) {
                console.log('updatedSubendorsements', updatedSubendorsements);
                setInvalidInputIndices(new Set([...updatedSubendorsements].filter(i => i !== index)));
                setInvalidInputReasons(Object.fromEntries(Object.entries(invalidInputReasons).filter((k, v) => k !== index)));
            }

        } catch (error) {
            setInvalidInputIndices(new Set([...invalidInputIndices, index]));
            setInvalidInputReasons({ ...invalidInputReasons, [index]: error.message });
        }


    };


    const renderInputs = () => {
        return subendorsements.map((address, i) =>
            <Form.Field

            >
                <Form.Input
                    value={subendorsements[i]}
                    label={`Subendorsement ${i + 1}`}
                    placeholder='Contract address e.g. 0x123456789abcdf...'
                    onChange={e => handleChangeSubendorsementInputs(e.target.value, i)}
                    // onBlur={() => handleLoseDomainInputFocus()}
                    icon='address'
                    error={invalidInputIndices.has(i) ? invalidInputReasons[i] : false}
                />
            </Form.Field>
        );
    };

    return (
        <Segment>
            <Header as='h3' content='Add Subendorsements' />
            <p>{contractAddress}</p>
            <Form onSubmit={handleSubmit}>
                {renderInputs()}
            </Form>
        </Segment>
    );
};

export default SubEndorsementAddition;