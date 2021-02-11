import axios from 'axios';
import CoinGecko from 'coingecko-api';
const CoinGeckoClient = new CoinGecko();

const CONVERSION_RATE = 'conversionRate';

export const CURRENCY = {
    USD: 'USD',
    EUR: 'EUR',
};

let apiResponse;

export const fetchConversionRate = async () => {
    try {
        console.log('>>>>> Coin Gecko <<<<<');
        apiResponse = await CoinGeckoClient.simple.price({
            ids: ['ethereum'],
            vs_currencies: ['eur', 'usd'],
        });
        if (apiResponse.success) {
            console.log('> data <', apiResponse);
            localStorage.setItem(CONVERSION_RATE, JSON.stringify(apiResponse.data.ethereum));
        } else {
            const rates = {
                usd: getConversionRateFromNomics(CURRENCY.USD),
                eur: getConversionRateFromNomics(CURRENCY.EUR)
            };
            localStorage.setItem(CONVERSION_RATE, JSON.stringify(rates));
        }

    } catch (error) {
        console.log(error);
    }
};


const getConversionRateFromNomics = async (currency = CURRENCY.USD) => {
    const ticker = await axios.get(`https://api.nomics.com/v1/currencies/ticker?key=demo-b5d84e505a11969a7184f899fbb40ae1&ids=ETH&convert=${currency}&interval=1h`, {
        timeout: 15000
    });
    console.log('>>>> ticker', ticker);
    return ticker.data[0].price;
};

export const getEthRates = (ether) => {
    try {
        const conversionRates = JSON.parse(localStorage.getItem(CONVERSION_RATE));
        return {
            eth: ether.toFixed(5),
            usd: (parseFloat(ether) * conversionRates[CURRENCY.USD.toLowerCase()]).toFixed(2),
            eur: (parseFloat(ether) * conversionRates[CURRENCY.EUR.toLowerCase()]).toFixed(2),
        };
    } catch (error) {
        console.log(error);
        return -1;
    }
}; 