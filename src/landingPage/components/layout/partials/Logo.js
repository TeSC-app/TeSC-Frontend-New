import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import Image from '../../elements/Image';

import '../../../assets/scss/landingPage.scoped.scss';
import logo from '../../../assets/images/logo.svg'

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
        <Link to="/">
          <Image
            src={logo}
            alt="Open"
            width={32}
            height={32} />
        </Link>
      </h1>
    </div>
  );
};

export default Logo;