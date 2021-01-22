import React, { useContext } from 'react';
import 'react-day-picker/lib/style.css';
import PageHeader from '../components/PageHeader';
import TableOverview from '../components/TableOverview';
import AppContext from '../appContext';


const Dashboard = () => {
    const { account } = useContext(AppContext);

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            <TableOverview
                isDashboard={true}
                rowData={account ? JSON.parse(localStorage.getItem(account.toLowerCase())) : []}
            />
        </React.Fragment>
    );


};

export default Dashboard;