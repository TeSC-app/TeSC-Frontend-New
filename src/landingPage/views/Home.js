import React from 'react';
// import sections
import Hero from '../components/sections/Hero';
import FeaturesTiles from '../components/sections/FeaturesTiles';
import FeaturesSplit from '../components/sections/FeaturesSplit';
import { NavLink } from 'react-router-dom';
import Button from '../components/elements/Button';

import '../assets/scss/landingPage.scoped.scss';


const Home = () => {

  return (
    <>
      <Hero className="illustration-section-01" />
      <FeaturesTiles />
      <FeaturesSplit invertMobile topDivider imageFill />    
    </>
  );
}

export default Home;