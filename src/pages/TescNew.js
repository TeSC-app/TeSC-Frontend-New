import React, { useState } from 'react';
import { Grid } from 'semantic-ui-react';


import 'react-day-picker/lib/style.css';

import DeploymentForm from '../components/tescNew/DeploymentForm';
import FeedbackMessage from "../components/FeedbackMessage";


const TeSCNew = () => {

    const [sysMsg, setSysMsg] = useState(null);

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