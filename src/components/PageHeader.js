import React, { useContext } from 'react';
import { Grid, Icon, Popup } from 'semantic-ui-react';
import AppContext from '../appContext';
import FeedbackMessage from "../components/FeedbackMessage";

const PageHeader = ({ title, isRegistryAnalytics, isPieValidInvalid, isBarTop, isPieFlags, infoText }) => {
    const { sysMsg, handleDismissMessage } = useContext(AppContext);

    return (
        <Grid className={isRegistryAnalytics ? 'analytics' : 'regular'}>
            <Grid.Row style={{ height: '100%' }}>
                <Grid.Column width={isRegistryAnalytics ? 16 : 5}>
                    {
                        isRegistryAnalytics ? <div className='chart-info'><h3>{title}</h3><Popup inverted content={infoText ? infoText : ''}
                            trigger={<Icon name='question circle' color='teal' />} /></div> : <h1>{title}</h1>
                    }
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