import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { SectionSplitProps } from '../../utils/SectionProps';
import SectionHeader from './partials/SectionHeader';
import Image from '../elements/Image';
import { Link } from 'react-router-dom';

import '../../assets/scss/landingPage.scoped.scss';

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

  const sectionHeader = {
    title: 'Workflow that just works',
    paragraph: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum — semper quis lectus nulla at volutpat diam ut venenatis.'
  };

  useEffect(() => {
    (async () => {
      const imgs = [];
      for (let i = 0; i < 4; i++) {
        imgs[i] = (await import(`./../../assets/images/features-split-image-0${i + 1}.png`)).default;
        console.log(i, imgs[i]);
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
          <SectionHeader data={sectionHeader} className="center-content" />
          <div className={splitClasses}>

            <div className="split-item" style={{alignItems: 'normal'}}>
              <div className="split-item-content center-content-mobile reveal-from-left" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Overview
                </div>
                <h3 className="mt-0 mb-12">
                  How TeSC works
                </h3>
                <p className="m-0">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <Image
                  src={images[0]}
                  alt="Features split 01"
                  width={528}
                  height={396} />
              </div>
            </div>

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
                  set favourites, and use the diverse filter options!
                  <br/><br/>
               
                  <Link to="/dashboard">
                    <span className="text-color-primary"><b>Go to dashboard</b></span> 📰         
                  </Link>  
                </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <Image
                  src={images[1]}
                  alt="Features split 02"
                  width={528}
                  height={396} />
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
                  Tedious tasks, like inheriting the reference implementation or computing the signature, will be automated for you.
                  All you need is a <b>'.sol' file</b> including your contract, your <b>domain name</b>, and the <b>certificate private key</b> of your domain. 
                  <br/><br/>
               
                  <Link to="/tesc/new">
                    <span className="text-color-primary"><b>Deploy</b></span> 🚀         
                  </Link>            
                  </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <Image
                  src={images[2]}
                  alt="Features split 03"
                  width={528}
                  height={396} />
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
                  Before making a payment to a contract, you can verify that it belongs to the given domain. 
                  Just enter the <b>address of the contract</b> in question.<br/>
                  If you are the owner of the TeSC, you can also update it here.
                  <br/><br/>
               
                  <Link to="/tesc/inspect">
                    <span className="text-color-primary"><b>Inspect</b></span> 🔍         
                  </Link>  
                </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <Image
                  src={images[3]}
                  alt="Features split 02"
                  width={528}
                  height={396} />
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
                  Browse the TeSC registry in a convenient way. Included contracts are grouped by domain name and can be filtered with various options.
                  <br/><br/>
               
                  <Link to="/registry/inspect">
                    <span className="text-color-primary"><b>Explore</b></span> 🗺️         
                  </Link>            
                  </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <Image
                  src={images[2]}
                  alt="Features split 03"
                  width={528}
                  height={396} />
              </div>
            </div>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-right" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  TeSC Registry Analytics
                  </div>
                <h3 className="mt-0 mb-12">
                  Statistics for TeSC Registry
                  </h3>
                <p className="m-0">
                  View current numbers from the TeSC Registry, e.g. the number of deployed contracts, used flags, and domains.
                  <br/><br/>
               
                  <Link to="/registry/analytics">
                    <span className="text-color-primary"><b>Graphs and pie charts</b></span> 🥧         
                  </Link>  
                </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <Image
                  src={images[3]}
                  alt="Features split 02"
                  width={528}
                  height={396} />
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