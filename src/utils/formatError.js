export const getMsgFromErrorCode = ({msg, subject}) => {
    console.log("msg", msg)
    if (msg.includes('getaddrinfo ENOTFOUND'))
        return ` Unable to connect to ${subject ? subject : 'the domain stored in contract'}. Please check your domain input or the availability of the website at that domain`;
    else if (msg.includes('Signature does not match'))
        return `${msg}. Please make sure you have selected the right certificate for domain ${subject}`;
    return msg;
};


export const extractAxiosErrorMessage = ({error, subject}) => {
    return (error.response) ? getMsgFromErrorCode({msg: error.response.data.err, subject}) : error.message;
}
