import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { SectionSplitProps } from '../../utils/SectionProps';
import SectionHeader from './partials/SectionHeader';
import Image from '../elements/Image';

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
      for (let i = 0; i < 3; i++) {
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
          </div>
        </div>
        <div className={innerClasses}>
          <SectionHeader data={tescSpecificSectionHeader} className="center-content" />
          <div className={splitClasses}>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-right" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Lightning fast workflow
                  </div>
                <h3 className="mt-0 mb-12">
                  Data-driven insights
                  </h3>
                <p className="m-0">
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
                  src={images[1]}
                  alt="Features split 02"
                  width={528}
                  height={396} />
              </div>
            </div>

            <div className="split-item">
              <div className="split-item-content center-content-mobile reveal-from-left" data-reveal-container=".split-item">
                <div className="text-xxs text-color-primary fw-600 tt-u mb-8">
                  Lightning fast workflow
                  </div>
                <h3 className="mt-0 mb-12">
                  Data-driven insights
                  </h3>
                <p className="m-0">
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
                  src={images[2]}
                  alt="Features split 03"
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