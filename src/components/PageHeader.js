import React, { useContext } from 'react';
import { Grid, Icon, Popup } from 'semantic-ui-react';
import AppContext from '../appContext';
import FeedbackMessage from "../components/FeedbackMessage";

const PageHeader = ({ title, isRegistryAnalytics, isPieValidInvalid, isBarTop, isPieFlags }) => {
    const { sysMsg, handleDismissMessage } = useContext(AppContext);

    return (
        <Grid className={isRegistryAnalytics ? 'analytics' : 'regular'}>
            <Grid.Row style={{ height: '100%' }}>
                <Grid.Column width={isRegistryAnalytics ? 16 : 5}>
                    {
                        isRegistryAnalytics ? <div className='chart-info'><h3>{title}</h3><Popup inverted content={isPieValidInvalid ?
                            'Shows the number of valid and invalid smart contracts in the registry' :
                            isBarTop ? 'Shows the top 5 domains which have the most smart contracts associated to them' :
                                isPieFlags ? 'Shows the number of the flags that are used in all smart contracts in the registry' : 'No info'}
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