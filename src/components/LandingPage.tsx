import React from 'react';
import { Header } from './landing/Header';
import { Hero } from './landing/Hero';
import { Features } from './landing/Features';
import { HowItWorks } from './landing/HowItWorks';
import { Pricing } from './landing/Pricing';
import { Testimonials } from './landing/Testimonials';
import { DownloadApp } from './landing/DownloadApp';
import { Footer } from './landing/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <DownloadApp />
      <Footer />
    </div>
  );
}