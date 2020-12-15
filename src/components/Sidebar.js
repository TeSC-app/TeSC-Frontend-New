import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';

import { Icon } from 'semantic-ui-react';
import { FaScroll, FaChartBar } from 'react-icons/fa';



const Sidebar = ({ image, collapsed, toggled, handleToggleSidebar }) => {

    const handlePageNavigation = () => {

    }

    return (
        <ProSidebar
            collapsed={collapsed}
            toggled={toggled}
            breakPoint="md"
            onToggle={handleToggleSidebar}
        >
            <Menu iconShape="square">
                <MenuItem icon={<FaChartBar size='1.5em' />} >
                    Dashboard
                </MenuItem>
                <SubMenu title="TLS-endorsed Contract" icon={<FaScroll size='1.5em' />}>
                    <MenuItem icon={<FaScroll />} >Deploy</MenuItem>
                    <MenuItem>Inspect & Verify</MenuItem>
                </SubMenu>
            </Menu>
        </ProSidebar>
    );
};

export default Sidebar;