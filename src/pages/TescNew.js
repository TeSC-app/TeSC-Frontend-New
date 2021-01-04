import React, {Fragement, useState } from 'react';
import { Grid, Loader, Dimmer } from 'semantic-ui-react';


import 'react-day-picker/lib/style.css';

import DeploymentForm from '../components/tescNew/DeploymentForm';
import PageHeader from "../components/PageHeader";

const TeSCNew = () => {
    return (
        <div>
            <PageHeader
                title='Create & Deploy TeSC'
            />
            <DeploymentForm />
        </div>
    );
};

export default TeSCNew;