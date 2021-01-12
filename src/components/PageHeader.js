import React, { useContext } from 'react';
import { Grid, Header } from 'semantic-ui-react';

import AppContext from '../appContext';
import FeedbackMessage from "../components/FeedbackMessage";


const PageHeader = ({ title }) => {
    const { sysMsg, handleDismissMessage } = useContext(AppContext);

    return (
        <Grid style={{ marginBottom: '20px', height: '50px' }}>
            <Grid.Row style={{ height: '100%' }}>
                <Grid.Column width={5}>
                    <h1>{title}</h1>
                    {/* <Header as='h1' content={title} color='purple'/> */}
                </Grid.Column>
                <Grid.Column width={11} >
                    <div style={{ position: 'fixed', right: '80px', top: '60px', maxWidth: '70%', zIndex: '9999' }}>
                        {!!sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}
                    </div>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default PageHeader;