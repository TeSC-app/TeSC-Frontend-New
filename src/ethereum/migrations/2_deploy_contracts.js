const TeSCRegistryImplementation = artifacts.require("TeSCRegistryImplementation");
const ExampleTeSCContract = artifacts.require("ExampleTeSCContract");

module.exports = async function (deployer) {
    await deployer.deploy(ExampleTeSCContract, "customdomain.com", "1924819200", "0x0", "customsignatureBEGINEND");
    await deployer.deploy(TeSCRegistryImplementation);
};