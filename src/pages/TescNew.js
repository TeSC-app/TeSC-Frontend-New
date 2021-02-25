import React, { useContext } from 'react';
import { Button, Message, Dimmer, Form, Grid, Header, Icon, Image, Input, Label, Loader, Modal, Popup, Segment } from 'semantic-ui-react';

import 'react-day-picker/lib/style.css';
import DeploymentForm from '../components/tescNew/DeploymentForm';
import PageHeader from "../components/PageHeader";
import AppContext from '../appContext';


const TeSCNew = () => {
    const { web3, account } = useContext(AppContext);

    return (
        <div>
            <PageHeader
                title='Create & Deploy TeSC'
            />
            {account ?
                <DeploymentForm />
                :
                <Segment padded='very' color='purple' style={{ width: '50%', margin: '5% auto', fontFamily: 'monospace' }}>
                    <Header as='h3' content='Your cryptocurrency wallet could not be detected. Please log into your wallet.' />


                    <p style={{  }}>
                        In order to create and deploy smart contract, you need a cryptocurrency wallet. In case you don't have one yet, you could download the Metamask extension (available in Chrome, Firefox and Brave) <a href='https://metamask.io/download.html'>here.</a>
                    </p>
                </Segment>
            }
        </div >
    );
};

export default TeSCNew;