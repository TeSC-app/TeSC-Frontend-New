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