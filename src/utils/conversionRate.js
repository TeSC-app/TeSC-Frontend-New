import axios from 'axios';


export const getUsdConversionRate = async () => {
    const ticker = await axios.get('https://api.nomics.com/v1/currencies/ticker?key=demo-b5d84e505a11969a7184f899fbb40ae1&ids=ETH&convert=USD&interval=1h', {
        timeout: 15000
    });
    console.log('>>>> ticker', ticker);
    return ticker.data[0].price;

};

export const ethToUsd = async (ether) => {
    try {
        const conversionRate = await getUsdConversionRate();
        return parseFloat(ether) * conversionRate;
    } catch (error) {
        console.log(error);
        return -1;
    }
}; 