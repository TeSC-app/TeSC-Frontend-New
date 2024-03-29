import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { SectionSplitProps } from '../../utils/SectionProps';
import SectionHeader from './partials/SectionHeader';
import { Image, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';

import { Label } from 'semantic-ui-react';

import '../../assets/scss/landingPage.scoped.scss';
import analyticsImg from '../../assets/images/analytics.png';
import dashboardImg from '../../assets/images/dashboard.png';
import deployImg from '../../assets/images/deploy.png';
import verifyImg from '../../assets/images/verify.png';
import overviewImg from '../../assets/images/overview.png';
import exploreImg from '../../assets/images/explore.png';

import step1_2 from '../../assets/images/step1-2.png';
import step3 from '../../assets/images/step3.png';
import step4_5 from '../../assets/images/step4-5.png';
import step6 from '../../assets/images/step6.png';
import step7 from '../../assets/images/step7.png';

const propTypes = {
  ...SectionSplitProps.types
};

const defaultProps = {
  ...SectionSplitProps.defaults
};

const FeaturesSplit = ({
  className,
  topOuterDivider,
  bottomOuterDivider,
  topDivider,
  bottomDivider,
  hasBgColor,
  invertColor,
  invertMobile,
  invertDesktop,
  alignTop,
  imageFill,
  ...props
}) => {

  const outerClasses = classNames(
    'features-split section',
    topOuterDivider && 'has-top-divider',
    bottomOuterDivider && 'has-bottom-divider',
    hasBgColor && 'has-bg-color',
    invertColor && 'invert-color',
    className
  );

  const innerClasses = classNames(
    'features-split-inner section-inner',
    topDivider && 'has-top-divider',
    bottomDivider && 'has-bottom-divider'
  );

  const splitClasses = classNames(
    'split-wrap',
    invertMobile && 'invert-mobile',
    invertDesktop && 'invert-desktop',
    alignTop && 'align-top'
  );

  const tescOverviewSectionHeader = {
    title: 'TeSC: the big picture',
    paragraph: 'TLS-endorsed Smart Contracts make use of the TLS-certificate to bind websites on the Internet and smart contracts on the Ethereum network.'
  };

  const tescSpecificSectionHeader = {
    title: 'TeSC: step by step',
  };

  const tescAppSectionHeader = {
    title: 'TeSC App Features',
  };



  return (
    <section
      {...props}
      className={outerClasses}
    >
      <div className="container">
        <div className={innerClasses}>
          <SectionHeader data={tescOverviewSectionHeader} className="center-content" />
          <div className={splitClasses}>

            <div className="split-item" style={{ alignItems: 'normal' }}>
              <div className="split-item-content tesc-concept center-content-mobile reveal-from-left" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Overview
                </div>
                <h3 className="mt-0 mb-12">
                  The Goal
                </h3>
                <p className="m-0">
                  The concept of TLS-endorsed Smart Contract (TeSC for short) is all about filling the gap between websites on the Internet and smart contracts on the Ethereum network, thereby preventing the Address Replacement attacks. It ensures that contract addresses posted on a website are pointing to the smart contracts genuinely owned by the owner of the website/domain. Making sure that smart contract owner and website/domain owner are the same entity helps the entities that would like to send funds to the smart contract be sure that they are not transfering funds to a wrong smart contract.
                </p>

                <br />

                <h3 className="mt-0 mb-12">
                  The How
                </h3>
                <p className="m-0">
                  TLS-endorsed Smart Contract ultilizes TLS-certificate of the website and the asymmetric encryption to achieve the goal of binding websites and smart contracts. The data of a TeSC is signed with the private key of the TLS-certificate and the resulting Signature is stored on-chain in TeSC. A funding entity, e.g. an ICO investor, will then verify a TeSC by decrypting the Signature using the public key of the TLS-certificate retrieved from the website. The verification process gives a binary result: either the contract is trustworthy, i.e. the smart contract owner and the website/domain owner are the same entity, or the contract is not trustworthy since it is probably under the Address Replacement attack. Based on the the verification result, the funding entity decides whether they would transfer the funds to that smart contract or not.
                </p>

              </div>
              <div className={`${classNames('reveal-from-bottom')} split-item-image tesc-concept`} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={overviewImg} size="large" />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================================================================ */}

        <SectionHeader data={tescSpecificSectionHeader} className="center-content" />
        <div className={splitClasses}>
          <div className="split-item" style={{ alignItems: 'normal' }}>
            <div className="split-item-content tesc-concept center-content-mobile reveal-from-left" data-reveal-container=".split-item">
              <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                Step 1 & 2
                </div>
              <h5 className="mt-0 mb-12">
                Website owner creates, endorses and deploys a TLS-endorsed Smart Contract
                </h5>
              <p className="m-0">
                It is required that the website owner has a TLS-certificate that ties together the domain name and the TLS public key, which are included in the TLS-certificate itself and could be read by all website's visitors, while the corresponding TLS private key is not part of the TLS-certificate.
                </p>
              <br />
              <p className="m-0">
                To endorse a smart contract, the website owner makes that contract follow the TeSC interface by implementing a number of specified functions or by inheriting a TeSC reference implementation. The goal is to create an Endorsement composed of a Claim and a Signature.
                To create a Claim, the website owner has to provide the address of the to-be-deployed contract, a domain name, an expriry date and the flags.
                The Signature will then be generated by signing the Claim using the TLS private key. The Endorsement contains the Signature as well as the Claim required to validate that Signature.
                </p>
              <br />
              <p className="m-0">
                The domain name, expiry date, flags and the Signature are the data being stored inside the TLS-endorsed smart contract when it is deployed to the Ethereum network.
                </p>
              <br />
              <br />
              <NavLink to="/tesc/new" className='button-link'>
                Create & Deploy 🚀
                {/* <Button content='Create & Deploy 🚀' /> */}
              </NavLink>
            </div>
            <div className={`${classNames('reveal-from-bottom')} split-item-image tesc-concept`} style={{ marginLeft: "auto", marginRight: "auto" }}
              data-reveal-container=".split-item">
              <Image src={step1_2} />
            </div>
          </div>



          <div className="split-item" style={{ alignItems: 'normal' }}>
            <div className="split-item-content tesc-concept center-content-mobile reveal-from-left" data-reveal-container=".split-item">
              <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                Step 3 <span style={{ fontSize: '0.85em' }}>(Optional)</span>
              </div>
              <h5 className="mt-0 mb-12">
                Website owner register TeSC to the TeSC Registry
                </h5>
              <p className="m-0">
                TeSC Registry is a smart contract deployed on the Ethereum network. It stores an on-chain hash table that maps TeSC addresses to website domains and therefore, acts as a reference point to lookup as well as to search for all TeSC-compliant smart contracts on the Ethereum network.
                  </p>
              <br />
              <p className="m-0">
                To this end, the website owner registers the newly deployed TeSC to the TeSC Registry and adds the mapping between the contract address and his website's domain to the Registry table. Note that, registering a TeSC is not a required step for that TeSC work, so this step is optional.
                  </p>
              <br />
            </div>
            <div className={`${classNames('reveal-from-bottom')} split-item-image tesc-concept`} style={{ marginLeft: "auto", marginRight: "auto" }}
              data-reveal-container=".split-item">
              <Image src={step3} />
            </div>
          </div>


          <div className="split-item" style={{ alignItems: 'normal' }}>
            <div className="split-item-content tesc-concept center-content-mobile reveal-from-left" data-reveal-container=".split-item">
              <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                Step 4 & 5
                </div>
              <h5 className="mt-0 mb-12">
                Website owner serves the website via HTTPS with the TLS-certificate
                </h5>
              <p className="m-0">
                Website owner publishes the website at the domain name that is stored in TeSC and issued to by the TLS-certificate. It is required that the website is served via HTTPS protocol using the TLS-certificate of the private key signing the TeSC Signature. The website content is normally about requesting website visitors to transfer funds to a TeSC, so it would contain a TeSC contract address. The TLS-certificate comprises the TLS public key available to all website visitors and the public key is used for the verification later on.
                  </p>
              <br />
              <p className="m-0">

              </p>
              <br />
            </div>
            <div className={`${classNames('reveal-from-bottom')} split-item-image tesc-concept`} style={{ marginLeft: "auto", marginRight: "auto" }}
              data-reveal-container=".split-item">
              <Image src={step4_5} />
            </div>
          </div>

          <div className="split-item" style={{ alignItems: 'normal' }}>
            <div className="split-item-content tesc-concept center-content-mobile reveal-from-left" data-reveal-container=".split-item">
              <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                Step 6
                </div>
              <h5 className="mt-0 mb-12">
                Verifier queries on-chain contract data required for the verification
                </h5>
              <p className="m-0">
                Seeing the funding request on the website, the verifier wants to make sure the contract address placed in the website content is that of the genuine smart contract and the website is not under a address replacement attack. For this purpose, the verifier queries the on-chain contract data from the Ethereum network and receives the data stored in the TeSC as describe in step 1 for the verification process. This required data includes the Signature, the domain name, the expiry data and the flags.
                  </p>
              <br />
            </div>
            <div className={`${classNames('reveal-from-bottom')} split-item-image tesc-concept`} style={{ marginLeft: "auto", marginRight: "auto" }}
              data-reveal-container=".split-item">
              <Image src={step6} />
            </div>
          </div>


          <div className="split-item" style={{ alignItems: 'normal' }}>
            <div className="split-item-content tesc-concept center-content-mobile reveal-from-left" data-reveal-container=".split-item">
              <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                Step 7
                </div>
              <h5 className="mt-0 mb-12">
                Verifier performs TeSC verfication process
                </h5>
              <p className="m-0">
                On one hand, the verifier reassembles the original Claim using the contract address, the domain name, the expiry date and the flags. While on the other hand, the Signature is decrypted using the TLS public key retrieved from the website and the decryption returns the Claim signed by the TLS private key in step 1. If these two Claims match up, then the verification succeeds meaning the smart contract owner and the website owner are the same entity, therefore, the smart contract is trustworthy. Otherwise, if these two Claims are different, the verifier/investor should refrain from sending funds to that smart contract.
                  </p>
              <br />
              <br />
              {/* <NavLink to="/tesc/inspect" style={{ border: '1px solid #a333c8', width: 'fit-content', padding: '7px', paddingLeft: '11px', borderRadius: '3px' }}> */}
              <NavLink to="/tesc/inspect" className='button-link'>
                Inspect & Verify 🔍
                {/* <Button content='Inspect & Verify 🔍' /> */}
              </NavLink>

            </div>
            <div className={`${classNames('reveal-from-bottom')} split-item-image tesc-concept`} style={{ marginLeft: "auto", marginRight: "auto" }}
              data-reveal-container=".split-item">
              <Image src={step7} />
            </div>
          </div>


        </div>

        {/* ================================================================================================================ */}


        <div className={innerClasses}>
          <SectionHeader data={tescAppSectionHeader} className="center-content" />
          <div className={splitClasses}>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-right" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Dashboard
                  </div>
                <h3 className="mt-0 mb-12">
                  Overview over your contracts
                  </h3>
                <p className="m-0">
                  The dashboard helps you to keep track of your deployed contracts. Check the verification status,
                  set favourites, and use the different filter options!
                  <br /><br />

                  <NavLink to="/dashboard" className='button-link'>
                    Go to Dashboard 📰
                    {/* <Button content='Go to Dashboard 📰' /> */}
                  </NavLink>
                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={dashboardImg} size="large" />
              </div>
            </div>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-left" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Create & Deploy TeSC
                  </div>
                <h3 className="mt-0 mb-12">
                  Guided deployment process
                  </h3>
                <p className="m-0">
                  Six easy to perform steps guide you through the endorsement and deployment of your contract.
                  Tedious tasks, e.g. inheriting the reference implementation or computing the signature, will be automated for you.
                  All you need is a <b>'.sol' file</b> including your contract, your <b>domain name</b>, and the <b>certificate private key</b> of your domain.
                  <br /><br />

                  <NavLink to="/tesc/new" className='button-link'>
                    {/* <Button content='Create & Deploy 🚀' /> */}
                    Create & Deploy 🚀
                  </NavLink>
                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={deployImg} size="large" />
              </div>
            </div>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-right" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Inspect TeSC
                  </div>
                <h3 className="mt-0 mb-12">
                  Verification of TeSCs
                  </h3>
                <p className="m-0">
                  Before making a payment to a contract, you can verify that it belongs to the expected domain.
                  Just enter the <b>address of the contract</b> in question.<br />
                  If you are the owner of the TeSC, you can also update it here.
                  <br /><br />

                  <NavLink to="/tesc/inspect" className='button-link'>
                    Inspect & verify 🔍
                    {/* <Button content='Inspect & verify 🔍' /> */}
                  </NavLink>
                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={verifyImg} size="large" />
              </div>
            </div>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-left" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Explore TeSC Registry
                  </div>
                <h3 className="mt-0 mb-12">
                  Contracts in TeSC Registry
                  </h3>
                <p className="m-0">
                  Browse the TeSC registry in a convenient way. Included contracts are grouped by domain name and can be filtered in different ways.
                  <br /><br />

                  <NavLink to="/registry/inspect" className='button-link'>
                    Explore 🗺️
                    {/* <Button content='Explore 🗺️' /> */}
                  </NavLink>
                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={exploreImg} size="large" />
              </div>
            </div>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-right" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Registry Analytics
                  </div>
                <h3 className="mt-0 mb-12">
                  Statistics for TeSC Registry
                  </h3>
                <p className="m-0">
                  View statistics for the current TeSC Registry content, namely the ratio of valid contracts,
                  domains with the most contracts, used flags, and the expiry of contracts.
                  The numbers are presented as bar and pie charts.
                  <br /><br />

                  <NavLink to="/registry/analytics" className='button-link'>
                    Bar and Pie Charts 📊
                    {/* <Button content='Bar and Pie Charts 📊' /> */}
                  </NavLink>
                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={analyticsImg} size="large" />
              </div>
            </div>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-left" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8" style={{ paddingTop: '10%' }}>
                  TeSC-CLI
                  </div>
                <h3 className="mt-0 mb-12">
                  TeSC on Command Line
                  </h3>
                <p className="m-0">
                  The functionality of the TeSC system can also be used on the command line. Among other,
                  the following functionality is available:<br /><br />

                  <ul>
                    <li><b>tesc deploy:</b> deploy a TeSC-compliant contract</li>
                    <li><b>tesc verify:</b> verify a TeSC-compliant contract</li>
                    <li><b>tesc changelog:</b> log changes of a TeSC-compliant contract</li>
                    <li><b>tesc update:</b> update a TeSC-compliant contract</li>
                    <li><b>tesc register:</b> add a TeSC to the registry</li>
                    <li><b>tesc registry:</b> analyse all entries in the registry</li>
                    <li><b>tesc monitor:</b> monitor all contracts in the TeSC registry and listen to new changes</li>
                  </ul>

                  {/* <Button as='a' href='https://github.com/TeSC-app/TeSC-api-server' content='TeSC-API on GitHub 💻' /> */}

                  <a href='https://github.com/TeSC-app/TeSC-api-server' className='button-link'>
                    TeSC-API on GitHub 💻
                  </a>

                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <iframe
                  title="media"
                  src={`clidemo/test.html`}
                  frameBorder="0"
                  allowFullScreen
                  height="560"
                  width="650"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

FeaturesSplit.propTypes = propTypes;
FeaturesSplit.defaultProps = defaultProps;

export default FeaturesSplit;