const TeSCRegistryImplementation = artifacts.require("TeSCRegistryImplementation");

module.exports = async function (deployer) {
    await deployer.deploy(TeSCRegistryImplementation);
};