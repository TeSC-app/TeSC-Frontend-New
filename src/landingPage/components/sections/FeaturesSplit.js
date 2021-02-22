import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { SectionSplitProps } from '../../utils/SectionProps';
import SectionHeader from './partials/SectionHeader';
import { Image, Button } from 'semantic-ui-react'
import { NavLink } from 'react-router-dom';
import BrowserFrame from "react-browser-frame";

import '../../assets/scss/landingPage.scoped.scss';
import analyticsImg from '../../assets/images/analytics.png';
import dashboardImg from '../../assets/images/dashboard.png';
import deployImg from '../../assets/images/deploy.png';
import verifyImg from '../../assets/images/verify.png';
import overviewImg from '../../assets/images/overview.png';
import exploreImg from '../../assets/images/explore.png';

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
  const [images, setImages] = useState([]);

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
    paragraph: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum — semper quis lectus nulla at volutpat diam ut venenatis.'
  };

  const tescSpecificSectionHeader = {
    title: 'TeSC: step by step',
  };

  useEffect(() => {
    (async () => {
      const imgs = [];
      for (let i = 0; i < 4; i++) {
        //imgs[i] = (await import(`./../../assets/images/features-split-image-0${i + 1}.png`)).default;
        //console.log(i, imgs[i]);
      }
      setImages(imgs);
      console.log('images loaded');
    })();
  }, []);


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
              <div className="split-item-content center-content-mobile reveal-from-left" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Overview
                </div>
                <h3 className="mt-0 mb-12">
                  How TeSC works
                </h3>
                <p className="m-0">
                  1. Creates a SC conforming to the TeSC infterface by signing the Claim using TLS-certificate private key of example.com. We call it a TLS-endorsed Smart Contract, or TeSC for short.
                </p>
                <br />
                <p className="m-0">
                  2. Deploy that TeSC to the Ethereum network
                </p>
                <br />
                <p className="m-0">
                  3. This is an optional step to register the TeSC to the TeSC Registry, which is another Smart Contract on the Ethereum network acting as a repository for all TeSCs in the network.
                </p>
                <br />
                <p className="m-0">
                  4. Serves the website containing the TeSC address. The website must use HTTPS with TLS-certificate containing the TLS public key
                </p>
                <br />
                <p className="m-0">
                  5. The users visit the website and see TeSC address at 0x1234567890AbcDeF
                </p>
                <br />
                <p className="m-0">
                  6. When the user wants to verifiy a TeSC, they will go to the Ethereum network and get contract data from at  e.g. domain, signature from
                </p>
                <br />
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={overviewImg} size="large" />
              </div>
            </div>
          </div>
        </div>
        <div className={innerClasses}>
          <SectionHeader data={tescSpecificSectionHeader} className="center-content" />
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

                  <NavLink to="/dashboard">
                    <Button content='Go to Dashboard 📰' />
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

                  <NavLink to="/tesc/new">
                    <Button content='Deploy 🚀' />
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

                  <NavLink to="/tesc/inspect">
                    <Button content='Inspect 🔍' />
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

                  <NavLink to="/registry/inspect">
                    <Button content='Explore 🗺️' />
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

                  <NavLink to="/registry/analytics">
                    <Button content='Bar and Pie Charts 📊' />
                  </NavLink>
                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <Image src={analyticsImg} size="large" />
              </div>
            </div>

            <div className="split-item" style={{ alignItems: 'normal' }}>
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

                  <Button as='a' href='https://github.com/TeSC-app/TeSC-api-server' content='TeSC-API on GitHub 💻' />
                </p>
              </div>
              <div className={classNames('reveal-from-bottom')} style={{ marginLeft: "auto", marginRight: "auto" }}
                data-reveal-container=".split-item">
                <iframe
                  title="media"
                  src={`clidemo/test.html`}
                  frameBorder="0"
                  allowFullScreen
                  height="650"
                  width="650"
                />
              </div>
            </div>

            <div style={{ minWidth: '100%', alignItems: 'center' }}>
              <BrowserFrame>
                <div className='iframe-container'>
                  <iframe
                    title="media"
                    src={`clidemo/cliDemo2.html`}
                    frameBorder="0"
                    allowFullScreen
                    className="frame"
                  />
                </div>
              </BrowserFrame>
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