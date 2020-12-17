# Development

Please follow these steps after cloning this repo in order to set up a development environment locally. Note that [nodejs](https://nodejs.org/en/) should be installed on your device. 

### 1. `npm install`

Installs all necessary packages for the app to run 

### 2. `npm run chain`

Runs a local blockchain in a separate terminal. 

### 3. `npm start`

Runs the app in the development mode (on another terminal other than that from step 2.).\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.


# Update Smart Contracts 

### `npm run sol-build`

When the Smart Contracts in repos [Tesc-EIP](https://github.com/TeSC-app/TeSC-EIP) and [TeSC-Registry](https://github.com/TeSC-app/TeSC-Registry) get changed, we can copy the updated SCs to this repo and compile them by `npm run sol-build`.

Note that, the latest TeSC implementation is now in branch `events` of repo TeSC-EIP and can be retrieved [here](https://github.com/TeSC-app/TeSC-EIP/blob/events/ETHSSL.sol). At present, file [src/ethereum/contracts/ERCXXXImplementation.sol](src/ethereum/contracts/ERCXXXImplementation.sol) is containing that implementation and the frontend in this repo is based on that lastest TeSC implementation.
