import React, { useState, useContext, useEffect, useRef } from 'react';
import 'react-day-picker/lib/style.css';
import PageHeader from '../components/PageHeader';
import TableOverview from '../components/TableOverview';
import AppContext from '../appContext';


const Dashboard = () => {
    const { loadStorage } = useContext(AppContext);

    const rowData = useRef(loadStorage())

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            {rowData && 
                <TableOverview
                    isDashboard={true}
                    rowData={rowData.current}
                />
            }
        </React.Fragment>
    );


};

export default Dashboard;