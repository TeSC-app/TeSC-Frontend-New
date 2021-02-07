import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, Button as Btn } from 'semantic-ui-react';
import BrowserFrame from "react-browser-frame";


import classNames from 'classnames';
import { SectionProps } from '../../utils/SectionProps';
import ButtonGroup from '../elements/ButtonGroup';
import Button from '../elements/Button';
import Modal from '../elements/Modal';

import '../../assets/scss/landingPage.scoped.scss';



const propTypes = {
  ...SectionProps.types
};

const defaultProps = {
  ...SectionProps.defaults
};

const Hero = ({
  className,
  topOuterDivider,
  bottomOuterDivider,
  topDivider,
  bottomDivider,
  hasBgColor,
  invertColor,
  ...props
}) => {

  const [videoModalActive, setVideomodalactive] = useState(false);
  const [curSlide, setCurSlide] = useState(0);
  const slideFrameRef = useRef(null);

  const openModal = (e) => {
    e.preventDefault();
    setVideomodalactive(true);
  };

  const closeModal = (e, slideNumber) => {
    e.preventDefault();
    setVideomodalactive(false);
    setCurSlide(slideNumber);
  };

  const outerClasses = classNames(
    'hero section center-content',
    topOuterDivider && 'has-top-divider',
    bottomOuterDivider && 'has-bottom-divider',
    hasBgColor && 'has-bg-color',
    invertColor && 'invert-color',
    className
  );

  const innerClasses = classNames(
    'hero-inner section-inner',
    topDivider && 'has-top-divider',
    bottomDivider && 'has-bottom-divider'
  );

  const slideFrame = (
    <BrowserFrame>
      <iframe
        title="media"
        src={`slides-TA.html#/${curSlide}`}
        frameBorder="0"
        allowFullScreen
        width={890}
        height={504}
        ref={slideFrameRef}
      />
    </BrowserFrame>
  );

  return (
    <section
      {...props}
      className={outerClasses}
    >
      <div className="container-sm">
        <div className={innerClasses}>
          <div className="hero-content">
            <h1 className="mt-0 mb-16 reveal-from-bottom" data-reveal-delay="200">
              TLS-endorsed Smart Contract (<span className="text-color-primary">TeSC</span>)
            </h1>
            <div className="container-xs">
              <p className="m-0 mb-32 reveal-from-bottom" data-reveal-delay="400">
                Protect your ICO Smart Contracts from address replacement attacks and give your investors more trust in funding your business.
                </p>
              <div className="reveal-from-bottom" data-reveal-delay="600">
                <ButtonGroup>
                  <NavLink to="/dashboard">
                    <Button tag="a" color="primary" wideMobile>
                      Get started
                    </Button>
                  </NavLink>
                  <Button tag="a" color="dark" wideMobile href="https://github.com/TeSC-app">
                    View on Github
                    </Button>
                </ButtonGroup>
              </div>
            </div>
          </div>
          <div className="hero-figure reveal-from-bottom illustration-element-01" data-reveal-value="20px" data-reveal-delay="800">
            {slideFrame}
            <div
              // icon={{name: 'expand', size: 'large'}}
              aria-controls="video-modal"
              onClick={openModal}
              style={{
                opacity: '0.1',
                position: 'relative',
                float: 'right',
                right: '15px',
                bottom: '490px',
                transition: '0.5s',
                width: 'max-content',
                height: 'max-content',
              }}
            >
              <Icon name='expand' size='big' link style={{ color: '#123456', fontStyle: 'normal' }} />
            </div>
          </div>
          <Modal
            id="video-modal"
            show={videoModalActive}
            handleClose={closeModal}
            video={`slides-TA.html#/${slideFrameRef.current ? slideFrameRef.current.contentWindow.location.href.split('#/')[1] : '0'}`}
            videoTag="iframe"
            onSlideChange={setCurSlide}
          />
        </div>
      </div>
    </section>
  );
};

Hero.propTypes = propTypes;
Hero.defaultProps = defaultProps;

export default Hero;