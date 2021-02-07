import React, { useState, useContext, useEffect } from 'react';
import 'react-day-picker/lib/style.css';
import PageHeader from '../components/PageHeader';
import TableOverview from '../components/TableOverview';
import AppContext from '../appContext';


const Dashboard = () => {
    const { account } = useContext(AppContext);

    const [rowData, setRowData] = useState(account ? JSON.parse(localStorage.getItem(account.toLowerCase())) : []);

    useEffect(() => {
        setRowData(JSON.parse(localStorage.getItem(account.toLowerCase())));
        console.log('account', account);
    }, [account]);

    useEffect(() => {
        console.log('rowData', rowData);
    }, [rowData])

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            {rowData && 
                <TableOverview
                    isDashboard={true}
                    rowData={rowData}
                    isExploringDomainDefault={true}
                />
            }
        </React.Fragment>
    );


};

export default Dashboard;