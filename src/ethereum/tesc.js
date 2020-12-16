import web3 from './web3-config';
import TeSC from './build/ERCXXXImplementation.json';


const instance = new web3.eth.Contract(
    TeSC.abi,
    process.env.NEXT_PUBLIC_DEPLOYED_CAMPAIGN_FACTORY_ADDRESS
);


export default instance;