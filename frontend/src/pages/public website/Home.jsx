import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import AboutUs from '../../components/AboutUs';
import ContactSection from '../../components/ContactSection';
import FeaturedVenues from '../../components/FeaturedVenues';
import Footer from '../../components/Footer';
import Hero from '../../components/Hero';
import Services from '../../components/Services';


const scrollToHash = (hash) => {
  if (!hash) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const id = hash.replace('#', '');
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function Home() {
  const location = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      scrollToHash(location.hash);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

  return (
    <main className="home-page">
      <div id="home">
        <Hero />
      </div>
      <FeaturedVenues />
      <Services />
      <AboutUs />
      <ContactSection />
      <Footer />
    </main>
  );
}

export default Home;

