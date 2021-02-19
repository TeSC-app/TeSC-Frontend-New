export const filterByDomain = (domain, input) => {
    return (input !== '' && (domain === input))
}

export const filterByAddress = (contractAddress, input) => {
    return (input !== '' && (contractAddress === input))
}

export const filterByExpiry = (expiry, from, to) => {
    return ((from !== '' && to !== '') &&
        (from <= expiry && expiry <= to))
}

export const filterByCreatedAt = (createdAt, from, to) => {
    return ((from !== '' && to !== '') &&
        (from <= createdAt && createdAt <= to))
}

export const filterByOwner = (owner, account, is, isNot) => {
    return (is && (owner === account)) || (isNot && (owner !== account))
}

export const filterByFavourites = (isFavourite, is, isNot) => {
    return (is && isFavourite) || (isNot && !isFavourite)
}

export const filterByVerified = (verified, is, isNot) => {
    return (is && verified) || (isNot && !verified)
}

export const filterByIsInRegistry = (isInRegistry, is, isNot) => {
    return (is && isInRegistry) || (isNot && !isInRegistry)
}

export const applyFilteringConditions = (tesc, filterTypes, account) => {
    /*if (typeof tesc.owner !== undefined) {
        console.log('tesc.owner: ', tesc.owner)
        console.log('filterTypes.byOwner.is', filterTypes.byOwner.is)
        console.log('result of the stupid filtering function which should be true: ', filterByOwner(tesc.owner, account, filterTypes.byOwner.is, filterTypes.byOwner.isNot))
    }
    console.log('names of used filters: ', Object.entries(filterTypes).filter(entry =>
        (entry[1].hasOwnProperty('input') && entry[1].input !== '') ||
        (entry[1].hasOwnProperty('from') && entry[1].from !== '' && entry[1].to !== '') ||
        (entry[1].hasOwnProperty('is') && (entry[1].is || entry[1].isNot)))
        .map(entry => entry[0]))

    console.log('value of used filters: ', Object.entries(filterTypes).filter(entry =>
        (entry[1].hasOwnProperty('input') && entry[1].input !== '') ||
        (entry[1].hasOwnProperty('from') && entry[1].from !== '' && entry[1].to !== '') ||
        (entry[1].hasOwnProperty('is') && (entry[1].is || entry[1].isNot)))
        .map(entry => entry[0])
        .reduce((condition, entry_) =>
            entry_ === 'byFavourites' ? condition || filterByFavourites(tesc.isFavourite, filterTypes.byFavourites.is, filterTypes.byFavourites.isNot) :
                condition, true))
    console.log(filterTypes)*/
    return Object.entries(filterTypes).filter(entry =>
        (entry[1].hasOwnProperty('input') && entry[1].input !== '') ||
        (entry[1].hasOwnProperty('from') && entry[1].from !== '' && entry[1].to !== '') ||
        (entry[1].hasOwnProperty('is') && (entry[1].is || entry[1].isNot)))
        .map(entry => entry[0])
        .reduce((condition, entry_) =>
            entry_ === 'byDomain' ? condition && filterByDomain(tesc.domain, filterTypes.byDomain.input) :
                entry_ === 'byContractAddress' ? condition && filterByAddress(tesc.contractAddress, filterTypes.byContractAddress.input) :
                    entry_ === 'byOwner' ? condition && filterByOwner(tesc.owner, account, filterTypes.byOwner.is, filterTypes.byOwner.isNot) :
                        entry_ === 'byIsInRegistry' ? condition && filterByIsInRegistry(tesc.isInRegistry, filterTypes.byIsInRegistry.is, filterTypes.byIsInRegistry.isNot) :
                            entry_ === 'byVerified' ? condition && filterByVerified(tesc.verified, filterTypes.byVerified.is, filterTypes.byVerified.isNot) :
                                entry_ === 'byFavourites' ? condition && filterByFavourites(tesc.isFavourite, filterTypes.byFavourites.is, filterTypes.byFavourites.isNot) :
                                    entry_ === 'byExpiry' ? condition && filterByExpiry(tesc.expiry, filterTypes.byExpiry.from, filterTypes.byExpiry.to) :
                                        entry_ === 'byCreatedAt' ? condition && filterByCreatedAt(tesc.createdAt, filterTypes.byCreatedAt.from, filterTypes.byCreatedAt.to) :
                                            condition, true)
}