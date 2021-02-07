import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import Image from '../../elements/Image';

import '../../../assets/scss/landingPage.scoped.scss';
// import logo from '../../../assets/images/logo.svg'
import logo from '../../../../static/images/tesc-logo.png'

const Logo = ({
  className,
  ...props
}) => {

  const classes = classNames(
    'brand',
    className
  );

  return (
    <div
      {...props}
      className={classes}
    >
      <h1 className="m-0">
        <Link to="/dashboard">
          <Image
            src={logo}
            alt="Open"
            width={150}
            height={120} 
          />
        </Link>
      </h1>
    </div>
  );
};

export default Logo;