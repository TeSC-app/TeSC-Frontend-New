import { useHistory, useLocation } from 'react-router-dom';
import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';

import { FaScroll, FaChartBar, FaAddressBook } from 'react-icons/fa';



const Sidebar = ({ image, collapsed, toggled, handleToggleSidebar }) => {
    let history = useHistory();
    let location = useLocation();

    const handlePageNavigation = (e, dest) => {
        if (location.pathname !== dest) {
            history.push(dest);
        }
    };

    return (
        <ProSidebar
            collapsed={collapsed}
            toggled={toggled}
            breakPoint="md"
            onToggle={handleToggleSidebar}
        >
            <Menu iconShape="square">
                <MenuItem onClick={(e) => handlePageNavigation(e, "/")} icon={<FaChartBar size='1.5em' />} >
                    Dashboard
                </MenuItem>
                <SubMenu title="TLS-endorsed Contract" icon={<FaScroll size='1.5em' />} defaultOpen >
                    <MenuItem onClick={(e) => handlePageNavigation(e, "/tesc/new")} >
                        Create & Deploy
                    </MenuItem>

                    <MenuItem onClick={(e) => handlePageNavigation(e, '/tesc/inspect')} >
                        Inspect
                    </MenuItem>
                </SubMenu>
                <SubMenu title="TeSC Registry" icon={<FaAddressBook size='1.5em' />} defaultOpen >
                    <MenuItem onClick={(e) => handlePageNavigation(e, "/registry/inspect")} >
                        Explore
                    </MenuItem>

                    {/*<MenuItem onClick={(e) => handlePageNavigation(e, '/registry/add')} >
                            Add entry
                        </MenuItem>*/}
                </SubMenu>
            </Menu>
        </ProSidebar>
    );
};

export default Sidebar;