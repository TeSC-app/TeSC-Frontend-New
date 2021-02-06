import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon, Button, Popup, Input, Form, Checkbox } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import AppContext from '../appContext';
import TableEntry from './TableEntry';
import moment from 'moment'
import SearchBox from './SearchBox';

const ENTRY_PER_PAGE = 5

function TableOverview(props) {
    const {
        rowData,
        tescsWithOccurances,
        isDashboard,
        isRegistryInspect,
        handleLoading,
        isExploringDomainDefault
    } = props;

    const { web3, account, loadStorage } = useContext(AppContext);

    const [tescs, setTescs] = useState(rowData);
    const [tescsWithOccurancesNew, setTescsWithOccurancesNew] = useState(tescsWithOccurances)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(!isExploringDomainDefault ? Math.ceil(tescsWithOccurancesNew.length / ENTRY_PER_PAGE) : tescs ? Math.ceil(tescs.length / ENTRY_PER_PAGE) : 0);
    const [filterOption, setFilterOption] = useState(0);
    const [displayedEntries, setDisplayedEntries] = useState([]);
    const [isExploringDomain, setIsExploringDomain] = useState(isExploringDomainDefault)

    //for search input
    const [domain, setDomain] = useState('')

    //for sorting
    const [isSortingByAddressAsc, setIsSortingByAddressAsc] = useState(true)
    const [isSortingByDomainAsc, setIsSortingByDomainAsc] = useState(true)
    const [isSortingByExpiryAsc, setIsSortingByExpiryAsc] = useState(true)
    const [isSortingByVerifiedAsc, setIsSortingByVerifiedAsc] = useState(true)
    const [isSortingByTotalSmartContractsAsc, setIsSortingByTotalSmartContractsAsc] = useState(true)
    const [isSortingByIsInRegistryAsc, setIsSortingByIsInRegistryAsc] = useState(true)
    const [isSortingByFavouriteAsc, setIsSortingByFavouriteAsc] = useState(true)
    const [isSortingByCreatedAtAsc, setIsSortingByCreatedAtAsc] = useState(true)

    //for filtering
    const [domainFilter, setDomainFilter] = useState('')
    const [contractAddressFilter, setContractAddressFilter] = useState('')
    const [expiryFromFilter, setExpiryFromFilter] = useState('')
    const [expiryToFilter, setExpiryToFilter] = useState('')
    const [isVerifiedFilter, setIsVerifiedFilter] = useState(true)
    const [isNotVerifiedFilter, setIsNotVerifiedFilter] = useState(true)
    const [isInRegistryFilter, setIsInRegistryFilter] = useState(true)
    const [isNotInRegistryFilter, setIsNotInRegistryFilter] = useState(true)
    const [isFavouriteFilter, setIsFavouriteFilter] = useState(true)
    const [isNotFavouriteFilter, setIsNotFavouriteFilter] = useState(true)
    const [createdAtFromFilter, setCreatedAtFromFilter] = useState('')
    const [createdAtToFilter, setCreatedAtToFilter] = useState('')

    useEffect(() => {
        const init = async () => {
            try {
                // setTescs(account ? (isDashboard? loadStorage() : []) : []);
                setDisplayedEntries(account && tescs ? tescs.slice(0, ENTRY_PER_PAGE) : []);
                setTotalPages(!isExploringDomain ? Math.ceil(tescsWithOccurancesNew.length / ENTRY_PER_PAGE) : Math.ceil(tescs ? tescs.length / ENTRY_PER_PAGE : 0));
                if (isDashboard) {
                    window.ethereum.on('accountsChanged', (accounts) => {
                        setTescs(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                            JSON.parse(localStorage.getItem(accounts[0].toLowerCase())) :
                            []);
                        setDisplayedEntries(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                            JSON.parse(localStorage.getItem(accounts[0].toLowerCase())).slice(0, ENTRY_PER_PAGE) :
                            []);
                    });
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        init();
    }, [tescs, account, web3.eth, web3.eth.Contract, web3.eth.net, tescsWithOccurancesNew, isExploringDomain, isDashboard]);


    const handleChangeTescs = (tesc) => {
        const updatedTescs = [...(tescs.filter(tesc_ => tesc_.contractAddress !== tesc.contractAddress)), tesc];
        if (isRegistryInspect) {
            let tescsNew = loadStorage() ? loadStorage() : []
            let found = false
            for (const tescNew of tescsNew) {
                if (tescNew.contractAddress === tesc.contractAddress) {
                    found = true;
                    if (tescNew.isFavourite) {
                        tescNew.isFavourite = false;
                    } else {
                        tescNew.isFavourite = true;
                    }
                    localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
                    break;
                }
            }
            if (!found) {
                tescsNew.push({ contractAddress: tesc.contractAddress, domain: tesc.domain, expiry: tesc.expiry, isFavourite: true, own: false, createdAt: moment().format('DD/MM/YYYY HH:mm'), verified: tesc.verified });
                localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
            }
            setTescs(updatedTescs.sort((tescA, tescB) => tescB.expiry - tescA.expiry))
        } else {
            setTescs(updatedTescs.sort((tescA, tescB) => tescA.createdAt.toString().localeCompare(tescB.createdAt)));
            localStorage.setItem(account.toLowerCase(), JSON.stringify(updatedTescs));
        }
    };

    const showAllTescs = (tescs) => {
        setCurrentPage(1);
        setFilterOption(0);
        setTotalPages(Math.ceil(tescs.length / ENTRY_PER_PAGE));
        localStorage.getItem(account.toLowerCase()) ? setDisplayedEntries(tescs.slice(0, ENTRY_PER_PAGE)) : setTescs([]);
    };

    const showFavouriteTescs = () => {
        setCurrentPage(1);
        setFilterOption(1);
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.isFavourite === true).length / ENTRY_PER_PAGE));
        localStorage.getItem(account.toLowerCase()) ? setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === true).slice(0, ENTRY_PER_PAGE)) : setTescs([]);
    };

    const showOwnTescs = () => {
        setCurrentPage(1);
        setFilterOption(2);
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.own === true).length / ENTRY_PER_PAGE));
        localStorage.getItem(account.toLowerCase()) ? setDisplayedEntries(tescs.filter(tesc => tesc.own === true).slice(0, ENTRY_PER_PAGE)) : setTescs([]);
    };

    const changePage = (event, { activePage }) => {
        //check if there are filters applied
        setCurrentPage(activePage);
        if (isExploringDomain) {
            setTotalPages(Math.ceil(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc).length / ENTRY_PER_PAGE));
            setDisplayedEntries(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc)
                .slice((activePage - 1) * ENTRY_PER_PAGE, activePage * ENTRY_PER_PAGE));
        } else {
            setDisplayedEntries(tescsWithOccurancesNew.slice((activePage - 1) * ENTRY_PER_PAGE, activePage * ENTRY_PER_PAGE))
        }
    };


    const renderRows = () => {
        if (displayedEntries && isExploringDomain) {
            return displayedEntries.map((tesc) => (
                <TableEntry key={tesc.contractAddress}
                    tesc={tesc}
                    onTescsChange={handleChangeTescs}
                    isDashboard={isDashboard}
                    isExploringDomain={isExploringDomain}
                    setVerificationInTescs={setVerificationInTescs}
                />
            ))
        } else if (displayedEntries && !isExploringDomain) {
            return tescsWithOccurancesNew.map((entry) => (
                <TableEntry key={entry.domain}
                    tesc={entry}
                    isExploringDomain={isExploringDomain}
                    isDashboard={isDashboard}
                    handleSearchInput={handleSearchInput}
                    handleSearchSubmit={handleSearchSubmit}
                />))
        }
    };

    const handleSearchInput = domain => {
        setDomain(domain);
    }

    const handleSearchSubmit = (domain) => {
        handleLoading(true)
        if (domain === '') {
            setIsExploringDomain(false)
            setTescs(tescsWithOccurancesNew)
        } else {
            setIsExploringDomain(true)
            setTescs(rowData.filter(entry => entry.domain === domain).sort((tescA, tescB) => tescB.expiry - tescA.expiry));
        }
        handleLoading(false)
    }

    const renderSearchBox = () => {
        return isRegistryInspect ? (<SearchBox
            onChange={handleSearchInput}
            onSubmit={handleSearchSubmit}
            value={domain}
            placeholder='www.mysite.com'
            label='Domain'
            icon='search'
            validInput={true}
            isRegistryInspect={isRegistryInspect} />) : null
    }

    const sortByContractAddress = () => {
        if (isSortingByAddressAsc) {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.contractAddress - tescB.contractAddress).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByAddressAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.contractAddress - tescA.contractAddress).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByAddressAsc(true)
        }
    }

    const sortByDomain = (tescs) => {
        if (isSortingByDomainAsc) {
            if (isExploringDomain) setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.domain.localeCompare(tescB.domain)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            else setTescsWithOccurancesNew(tescs.sort((tescA, tescB) => tescA.domain.localeCompare(tescB.domain)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByDomainAsc(false)
        } else {
            if (isExploringDomain) setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.domain.localeCompare(tescA.domain)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            else setTescsWithOccurancesNew(tescs.sort((tescA, tescB) => tescB.domain.localeCompare(tescA.domain)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) 
            setIsSortingByDomainAsc(true)
        }
    }

    const sortByExpiry = () => {
        console.log(tescs)
        if (isSortingByExpiryAsc) {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.expiry.toString().localeCompare(tescB.expiry)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByExpiryAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.expiry.toString().localeCompare(tescA.expiry)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByExpiryAsc(true)
        }
    }

    const sortByVerified = () => {
        if (isSortingByVerifiedAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.verified.toString().localeCompare(tescB.verified)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByVerifiedAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.verified.toString().localeCompare(tescA.verified)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByVerifiedAsc(true)
        }
    }

    const sortByTotalSmartContracts = () => {
        if (isSortingByTotalSmartContractsAsc) {
            setTescsWithOccurancesNew(tescsWithOccurancesNew.sort((tescA, tescB) => tescA.contractCount.toString().localeCompare(tescB.contractCount)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByTotalSmartContractsAsc(false)
        } else {
            setTescsWithOccurancesNew(tescsWithOccurancesNew.sort((tescA, tescB) => tescB.contractCount.toString().localeCompare(tescA.contractCount)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByTotalSmartContractsAsc(true)
        }
    }

    const sortByIsInRegistry = () => {
        if (isSortingByIsInRegistryAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.isInRegistry.toString().localeCompare(tescB.isInRegistry)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByIsInRegistryAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.isInRegistry.toString().localeCompare(tescA.isInRegistry)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByIsInRegistryAsc(true)
        }
    }

    const sortByFavourite = () => {
        if (isSortingByFavouriteAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.isFavourite.toString().localeCompare(tescB.isFavourite)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByFavouriteAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.isFavourite.toString().localeCompare(tescA.isFavourite)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByFavouriteAsc(true)
        }
    }

    const sortByCreatedAt = () => {
        if (isSortingByCreatedAtAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.createdAt.toString().localeCompare(tescB.createdAt)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByCreatedAtAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.createdAt.toString().localeCompare(tescA.createdAt)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByCreatedAtAsc(true)
        }
    }

    const setVerificationInTescs = (tescsWithVerification) => {
        setTescs(tescsWithVerification)
    }

    //filtering logic starts from here
    const filterByDomain = (domain, tescs) => {
        if (isExploringDomain) {
        domain !== '' ?
            setDisplayedEntries(tescs.filter(tesc => tesc.domain === domain).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
        } else {
            domain !== '' ?
                setTescsWithOccurancesNew(tescs.filter(tesc => tesc.domain === domain).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                setTescsWithOccurancesNew(tescsWithOccurances.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
        }
    }

    const handleDomainFilter = (e) => {
        setDomainFilter(e.target.value)
    }

    const filterByContractAddress = (contractAddress) => {
        contractAddress !== '' ?
            setDisplayedEntries(tescs.filter(tesc => tesc.contractAddress === contractAddress).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
    }

    const handleContractAddressFilter = (e) => {
        setContractAddressFilter(e.target.value)
    }

    const filterByExpiry = (expiryFromFilter, expiryToFilter) => {
        expiryFromFilter !== '' && expiryToFilter !== '' ?
            setDisplayedEntries(tescs.filter(tesc => tesc.expiry >= expiryFromFilter && tesc.expiry <= expiryToFilter).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
            expiryFromFilter === '' && expiryToFilter !== '' ?
                setDisplayedEntries(tescs.filter(tesc => tesc.expiry <= expiryToFilter).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                expiryFromFilter !== '' && expiryToFilter === '' ?
                    setDisplayedEntries(tescs.filter(tesc => tesc.expiry >= expiryFromFilter).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                    setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
    }

    const handleExpiryFromFilter = (date) => {
        setExpiryFromFilter(convertToUnix(date))
    }

    const handleExpiryToFilter = (date) => {
        setExpiryToFilter(convertToUnix(date))
    }

    const filterByVerified = (isVerifiedFilter, isNotVerifiedFilter) => {
        isVerifiedFilter === true && isNotVerifiedFilter === true ?
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
            isVerifiedFilter === true && isNotVerifiedFilter === false ?
                setDisplayedEntries(tescs.filter(tesc => tesc.verified === true).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                isVerifiedFilter === false && isNotVerifiedFilter === true ?
                    setDisplayedEntries(tescs.filter(tesc => tesc.verified === false).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                    setDisplayedEntries([])
    }

    const handleIsVerifiedFilter = () => {
        if (isVerifiedFilter) setIsVerifiedFilter(false)
        else setIsVerifiedFilter(true)
    }

    const handleIsNotVerifiedFilter = () => {
        if (isNotVerifiedFilter) setIsNotVerifiedFilter(false)
        else setIsNotVerifiedFilter(true)
    }

    const filterByIsInRegistry = (isInRegistryFilter, isNotInRegistryFilter) => {
        isInRegistryFilter === true && isNotInRegistryFilter === true ?
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
            isInRegistryFilter === true && isNotInRegistryFilter === false ?
                setDisplayedEntries(tescs.filter(tesc => tesc.isInRegistry === true).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                isInRegistryFilter === false && isNotInRegistryFilter === true ?
                    setDisplayedEntries(tescs.filter(tesc => tesc.isInRegistry === false).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                    setDisplayedEntries([])
    }

    const handleIsInRegistryFilter = e => {
        if (isInRegistryFilter) setIsInRegistryFilter(false)
        else setIsInRegistryFilter(true)
    }

    const handleIsNotInRegistryFilter = e => {
        if (isNotInRegistryFilter) setIsInRegistryFilter(false)
        else setIsNotInRegistryFilter(true)
    }

    const filterByIsFavourite = (isFavouriteFilter, isNotFavouriteFilter) => {
        isFavouriteFilter === true && isNotFavouriteFilter === true ?
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
            isFavouriteFilter === true && isNotFavouriteFilter === false ?
                setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === true).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                isFavouriteFilter === false && isNotFavouriteFilter === true ?
                    setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === false).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                    setDisplayedEntries([])
    }

    const handleIsFavouriteFilter = e => {
        if (isFavouriteFilter) setIsFavouriteFilter(false)
        else setIsFavouriteFilter(true)
    }

    const handleIsNotFavouriteFilter = e => {
        if (isNotFavouriteFilter) setIsNotFavouriteFilter(false)
        else setIsNotFavouriteFilter(true)
    }

    const filterByCreatedAt = (createdAtFromFilter, createdAtToFilter) => {
        createdAtFromFilter !== '' && createdAtToFilter !== '' ?
            setDisplayedEntries(tescs.filter(tesc => tesc.createdAt >= createdAtFromFilter && tesc.createdAt <= createdAtToFilter).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
            createdAtFromFilter === '' && createdAtToFilter !== '' ?
                setDisplayedEntries(tescs.filter(tesc => tesc.createdAt <= createdAtToFilter).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                createdAtFromFilter !== '' && createdAtToFilter === '' ?
                    setDisplayedEntries(tescs.filter(tesc => tesc.createdAt >= createdAtFromFilter).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE)) :
                    setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
    }

    const handleCreatedAtFromFilter = date => {
        setCreatedAtFromFilter(convertToUnix(date))
    }

    const handleCreatedAtToFilter = date => {
        setCreatedAtToFilter(convertToUnix(date))
    }

    const convertToUnix = date => {
        const mDate = moment.utc(date);
        mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        return mDate.unix()
    }

    //end of filtering logic

    const renderSortingAndFilteringDropdownForCheckboxes = (title, isSortingAsc, sortByType, isTypeFilter, handleIsTypeFilter, isNotTypeFilter, handleIsNotTypeFilter, filterByType) => {
        const checkboxLabelOne = title === 'Verified' ? 'Valid' : title === 'Registry' ? 'In Registry' : title === 'Favourites' ? 'Favourite' : ''
        const checkboxLabelTwo = title === 'Verified' ? 'Invalid' : title === 'Registry' ? 'Not In Registry' : title === 'Favourites' ? 'Not Favourite' : ''
        return (
            <Dropdown
                text={title}
                icon={isSortingAsc ? 'angle down' : 'angle up'}
                simple
                className='icon dropdown-favourites'>
                <Dropdown.Menu>
                    <Dropdown.Item icon={isSortingAsc ? 'arrow down' : 'arrow up'} text={isSortingAsc ? 'Sort asc' : 'Sort desc'} onClick={sortByType} />
                    <Form>
                        <Form.Field><Checkbox label={checkboxLabelOne} checked={isTypeFilter} onChange={handleIsTypeFilter} /></Form.Field>
                        <Form.Field><Checkbox label={checkboxLabelTwo} checked={isNotTypeFilter} onChange={handleIsNotTypeFilter} /></Form.Field>
                        <Button basic onClick={() => filterByType(isTypeFilter, isNotTypeFilter)}>Filter</Button>
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderSortingAndFilteringDropdownForDayPickers = (title, isSortingAsc, sortByType, dateFrom, handleDateFrom, dateTo, handleDateTo, filterByType) => {
        return (
            <Dropdown
                text={title}
                icon={isSortingAsc ? 'angle down' : 'angle up'}
                simple
                className='icon dropdown-favourites'>
                <Dropdown.Menu>
                    <Dropdown.Item icon={isSortingAsc ? 'arrow down' : 'arrow up'} text={isSortingAsc ? 'Sort asc' : 'Sort desc'} onClick={sortByType} />
                    <Form>
                        <Form.Field><DayPickerInput
                            value={dateFrom ? formatDate(new Date(dateFrom * 1000), 'DD/MM/YYYY') : null}
                            onDayChange={handleDateFrom}
                            format="DD/MM/YYYY"
                            formatDate={formatDate}
                            parseDate={parseDate}
                            placeholder='dd/mm/yyyy'
                            inputProps={{ readOnly: true }}
                            component={props => <Input icon='calendar alternate outline' {...props} />}
                        /></Form.Field>
                        <Form.Field>
                            <DayPickerInput
                                value={dateTo ? formatDate(new Date(dateTo * 1000), 'DD/MM/YYYY') : null}
                                onDayChange={handleDateTo}
                                format="DD/MM/YYYY"
                                formatDate={formatDate}
                                parseDate={parseDate}
                                placeholder='dd/mm/yyyy'
                                inputProps={{ readOnly: true }}
                                component={props => <Input icon='calendar alternate outline' {...props} />}
                            /></Form.Field>
                        <Button basic onClick={() => filterByType(dateFrom, dateTo)}>Filter</Button>
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)

    }

    const renderSortingAndFilteringDropdownGeneral = (title, isSortingAsc, sortByType, filterByType, filterStateOne, handleChangeOne) => {
        const placeholder = title === 'Domain' ? 'gaulug.de' : 'Address' ? '0xdF0d...' : ''
        return (
            <Dropdown
                text={title}
                icon={isSortingAsc ? 'angle down' : 'angle up'}
                simple
                className='icon dropdown-favourites'>
                <Dropdown.Menu>
                    {isExploringDomain ?
                        <Dropdown.Item icon={isSortingAsc ? 'arrow down' : 'arrow up'} text={isSortingAsc ? 'Sort asc' : 'Sort desc'} onClick={() => sortByType(tescs)} /> :
                        <Dropdown.Item icon={isSortingAsc ? 'arrow down' : 'arrow up'} text={isSortingAsc ? 'Sort asc' : 'Sort desc'} onClick={() => sortByType(tescsWithOccurancesNew)} />}
                    {isExploringDomain ?
                        <Form onSubmit={() => filterByType(filterStateOne, tescs)}>
                            {title === 'Domain' || title === 'Address' ? <Form.Input label={`Filter By ${title}`} placeholder={placeholder} onChange={handleChangeOne} /> : null}
                        </Form> :
                        <Form onSubmit={() => filterByType(filterStateOne, tescsWithOccurancesNew)}>
                            {title === 'Domain' || title === 'Address' ? <Form.Input label={`Filter By ${title}`} placeholder={placeholder} onChange={handleChangeOne} /> : null}
                        </Form>}
                </Dropdown.Menu>
            </Dropdown>)
    }

    return (
        <>

            {renderSearchBox()}
            <Table color='purple'>
                <Table.Header active='true' style={{ backgroundColor: 'purple' }}>
                    <Table.Row>
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) && <Table.HeaderCell>{renderSortingAndFilteringDropdownGeneral("Address", isSortingByAddressAsc, sortByContractAddress, filterByContractAddress, contractAddressFilter, handleContractAddressFilter)}</Table.HeaderCell>}
                        <Table.HeaderCell>{renderSortingAndFilteringDropdownGeneral("Domain", isSortingByDomainAsc, sortByDomain, filterByDomain, domainFilter, handleDomainFilter)}</Table.HeaderCell>
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) && <Table.HeaderCell>{renderSortingAndFilteringDropdownForDayPickers("Expiry", isSortingByExpiryAsc, sortByExpiry, expiryFromFilter, handleExpiryFromFilter, expiryToFilter, handleExpiryToFilter, filterByExpiry)}</Table.HeaderCell>}
                        {(isRegistryInspect && !isExploringDomain) && <Table.HeaderCell textAlign="center">{renderSortingAndFilteringDropdownGeneral("Total Smart Contracts", isSortingByTotalSmartContractsAsc, sortByTotalSmartContracts)}</Table.HeaderCell>}
                        <Table.HeaderCell textAlign="center">{!isExploringDomain ? "Verified" : renderSortingAndFilteringDropdownForCheckboxes("Verified", isSortingByVerifiedAsc, sortByVerified, isVerifiedFilter, handleIsVerifiedFilter, isNotVerifiedFilter, handleIsNotVerifiedFilter, filterByVerified)}</Table.HeaderCell>
                        {isDashboard &&
                            <Table.HeaderCell textAlign="center">{renderSortingAndFilteringDropdownForCheckboxes("Registry", isSortingByIsInRegistryAsc, sortByIsInRegistry, isInRegistryFilter, handleIsInRegistryFilter, isNotInRegistryFilter, handleIsNotInRegistryFilter, filterByIsInRegistry)}</Table.HeaderCell>
                        }
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) &&
                            <Table.HeaderCell textAlign="center">{renderSortingAndFilteringDropdownForCheckboxes("Favourites", isSortingByFavouriteAsc, sortByFavourite, isFavouriteFilter, handleIsFavouriteFilter, isNotFavouriteFilter, handleIsNotFavouriteFilter, filterByIsFavourite)}
                                {/*<Dropdown
                                    icon='filter'
                                    floating
                                    button
                                    className='icon dropdown-favourites'>
                                    <Dropdown.Menu>
                                        <Dropdown.Item icon='redo' text={isRegistryInspect && domain.length > 0 ? 'All (by domain)' : 'All'} onClick={() => showAllTescs(tescs)} />
                                        {isRegistryInspect && <Dropdown.Item icon='redo' text='All (reset)' onClick={() => setIsExploringDomain(false)} />}
                                        <Dropdown.Item icon='heart' text='By favourite' onClick={showFavouriteTescs} />
                                        <Dropdown.Item icon='user' text='Own' onClick={showOwnTescs} />
                                    </Dropdown.Menu>
                            </Dropdown>*/}
                            </Table.HeaderCell>
                        }
                        {isDashboard &&
                            <Table.HeaderCell>{renderSortingAndFilteringDropdownForDayPickers("Created At", isSortingByCreatedAtAsc, sortByCreatedAt, createdAtFromFilter, handleCreatedAtFromFilter, createdAtToFilter, handleCreatedAtToFilter, filterByCreatedAt)}</Table.HeaderCell>
                        }
                    </Table.Row>
                </Table.Header>
                {(
                    <Table.Body>
                        {renderRows()}
                    </Table.Body>
                )}
            </Table>
            { totalPages > 0 ?
                <div className='pagination'>
                    <Pagination
                        totalPages={totalPages}
                        activePage={currentPage}
                        onPageChange={changePage}
                        ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
                        firstItem={totalPages > 8 ? { content: <Icon name='angle double left' />, icon: true } : null}
                        lastItem={totalPages > 8 ? { content: <Icon name='angle double right' />, icon: true } : null}
                        prevItem={{ content: <Icon name='angle left' />, icon: true }}
                        nextItem={{ content: <Icon name='angle right' />, icon: true }} />
                </div> : null
            }
        </>
    );
}

export default TableOverview;
