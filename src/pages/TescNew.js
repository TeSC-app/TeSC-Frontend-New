import React, { useState } from 'react';
import { Grid, Loader, Dimmer } from 'semantic-ui-react';


import 'react-day-picker/lib/style.css';

import DeploymentForm from '../components/tescNew/DeploymentForm';
import FeedbackMessage from "../components/FeedbackMessage";


const TeSCNew = () => {

    const [sysMsg, setSysMsg] = useState(null);
    const [blocking, setBlocking] = useState(false);

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const handleFeedback = (feedback) => {
        setSysMsg(feedback);
    };

    const handleBlockScreen = (isBlocking) => {
        setBlocking(isBlocking);
    };

    return (
        <div>
            {/* {sysMsg &&
                <FeedbackMessage
                    message={sysMsg}
                    handleDismiss={handleDismissMessage}
                    style={{ marginBottom: '20px' }}
                />
            } */}

            {/* <h2>Create & Deploy TeSC</h2> */}

            <Grid style={{ marginBottom: '20px', height: '50px' }} reversed>
                    <Grid.Row style={{ height: '100%' }}>
                        <Grid.Column width={5}>
                            <h2>Create & Deploy TeSC</h2>
                        </Grid.Column>
                        <Grid.Column width={11} >
                            <div style={{ float: 'right' }}>
                                {sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}

                            </div>
                        </Grid.Column>
                    </Grid.Row>

                </Grid>
            <DeploymentForm
                onFeedback={handleFeedback}
                blockScreen={handleBlockScreen}
            />

            <Dimmer active={blocking}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>

        </div>
    );
};

export default TeSCNew;