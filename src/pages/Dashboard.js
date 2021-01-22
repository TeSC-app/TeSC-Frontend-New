import React, { useContext, useEffect, useState } from 'react';
import 'react-day-picker/lib/style.css';
import AppContext from '../appContext';
import PageHeader from '../components/PageHeader';
import TableOverview from '../components/TableOverview';

const Dashboard = () => {

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            <TableOverview isDashboard={true} />
        </React.Fragment>
    );


};

export default Dashboard;