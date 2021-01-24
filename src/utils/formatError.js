export const getMsgFromErrorCode = ({msg, subject}) => {
    console.log("msg", msg)
    if (msg.includes('getaddrinfo ENOTFOUND'))
        return ` Unable to connect to ${subject}. Please check your domain input and the availability of your website.`;
    else if (msg.includes('Signature does not match'))
        return `${msg}. Please make sure you have selected the right certificate for domain ${subject}`;
    return msg;
};


export const extractAxiosErrorMessage = ({error, subject}) => {
    return (error.response) ? getMsgFromErrorCode({msg: error.response.data.err, subject}) : error.message;
}
