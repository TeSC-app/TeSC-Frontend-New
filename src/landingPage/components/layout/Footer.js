import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Logo from './partials/Logo';
import FooterNav from './partials/FooterNav';
import FooterSocial from './partials/FooterSocial';
import { Link } from 'react-router-dom';


import '../../assets/scss/landingPage.scoped.scss';

const propTypes = {
  topOuterDivider: PropTypes.bool,
  topDivider: PropTypes.bool
};

const defaultProps = {
  topOuterDivider: false,
  topDivider: false
};

const Footer = ({
  className,
  topOuterDivider,
  topDivider,
  ...props
}) => {

  const classes = classNames(
    'site-footer center-content-mobile',
    topOuterDivider && 'has-top-divider',
    className
  );


  return (
    <footer
      {...props}
      className={classes}
    >
      <div className="container">
        <div className={
          classNames(
            'site-footer-inner',
            topDivider && 'has-top-divider'
          )}>
          <div className="footer-top space-between text-xxs">
            <Logo />
            <div>
              <Link to="/dashboard" className="button button-primary button-wide-mobile button-sm" style={{ marginRight: '600px', background: '#A839CC' }}>Go to App</Link>
            </div>
            <FooterSocial />
          </div>
          <div className="footer-bottom space-between text-xxs invert-order-desktop">
            <FooterNav />
            <div className="footer-copyright">Made in <a href="https://wwwmatthes.in.tum.de/pages/18witnulbiwl6/Master-Lab-Course-Web-Applications">SEBA Lab Course</a> at Chair <a href="https://wwwmatthes.in.tum.de">Sebis</a>, <a href="https://www.tum.de">Technical University of Munich (TUM)</a>.</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

Footer.propTypes = propTypes;
Footer.defaultProps = defaultProps;

export default Footer;