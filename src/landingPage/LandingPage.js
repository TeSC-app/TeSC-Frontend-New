import React, { Fragment, useRef, useEffect, useState } from 'react';
import ReactGA from 'react-ga';
import { useLocation, Switch, Route } from 'react-router-dom';
import ScrollReveal from './utils/ScrollReveal';
import App from '../components/App';
import { Loader, Dimmer } from 'semantic-ui-react';


// Layouts
import LayoutDefault from './layouts/LayoutDefault';

// Views 
import Home from './views/Home';


const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const childRef = useRef();
  let location = useLocation();

  const Layout = (LayoutDefault === undefined) ? props => (<>{props.children}</>) : LayoutDefault;


  useEffect(() => {
    (async () => {
      await import('../landingPage/assets/scss/landing-page.scoped.scss');
      setIsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    document.body.classList.add('is-loaded');
    childRef.current.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, location]);

  return (
    <>
      <ScrollReveal
        style={{ display: 'hidden' }}
        ref={childRef}
        children={() => isLoaded &&  (
          <Layout>
            <Home />
          </Layout>
        )} />

      {!isLoaded &&
        <Dimmer active={true} >
          <Loader content='Loading...' />
        </Dimmer>
      }
    </>
  );
};

export default LandingPage;