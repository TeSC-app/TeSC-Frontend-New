import React, { useState } from 'react';
import { Grid, Loader, Dimmer } from 'semantic-ui-react';


import 'react-day-picker/lib/style.css';
import { TescNewContext } from '../appContext';

import DeploymentForm from '../components/tescNew/DeploymentForm';
import PageHeader from "../components/PageHeader";

const TeSCNew = () => {
    const [sysMsg, setSysMsg] = useState(null);
    const [blocking, setBlocking] = useState(false);

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const showMessage = (msg) => {
        setSysMsg(msg);
    };

    const handleBlockScreen = (isBlocking) => {
        setBlocking(isBlocking);
    };

    return (
        <TescNewContext.Provider value={{ showMessage }}>
            <PageHeader
                title='Create & Deploy TeSC'
                message={sysMsg}
                onDismissMessage={handleDismissMessage}
            />
            <DeploymentForm
                blockScreen={handleBlockScreen}
            />

            <Dimmer active={blocking}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>

        </TescNewContext.Provider>
    );
};

export default TeSCNew;