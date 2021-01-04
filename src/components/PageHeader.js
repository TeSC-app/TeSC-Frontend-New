import React, { useContext } from 'react';
import { Grid, Label } from 'semantic-ui-react';

import AppContext from '../appContext';
import FeedbackMessage from "../components/FeedbackMessage";


const PageHeader = ({ title }) => {
    const { sysMsg, handleDismissMessage } = useContext(AppContext);

    return (
        <Grid style={{ marginBottom: '20px', height: '50px' }}>
            <Grid.Row style={{ height: '100%' }}>
                <Grid.Column width={5}>
                    <h2>{title}</h2>
                </Grid.Column>
                <Grid.Column width={11} >
                    <div style={{ position: 'fixed', right: '80px', top: '75px', maxWidth: '70%', zIndex: '100' }}>
                        {!!sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}
                    </div>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default PageHeader;