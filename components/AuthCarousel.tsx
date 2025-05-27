'use client';

import { useEffect, useState } from 'react';
import { PlaceholderImage } from './PlaceholderImage';

interface Slide {
  id: number;
  title: string;
  description: string;
  bgColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Bem-vindo ao Sistema',
    description: 'Gerencie suas autorizações ambientais de forma simples e eficiente.',
    bgColor: '#1a365d'
  },
  {
    id: 2,
    title: 'Processos Simplificados',
    description: 'Acompanhe todo o andamento dos seus processos em tempo real.',
    bgColor: '#2c5282'
  },
  {
    id: 3,
    title: 'Suporte 24/7',
    description: 'Nossa equipe está sempre pronta para ajudar com suas necessidades.',
    bgColor: '#2b6cb0'
  }
];

// Estilos inline para o carrossel
const styles = {
  carouselContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '50%',
    background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
    color: 'white',
    padding: '3rem',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  carouselOverlay: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.1,
    backgroundImage: 'url("/images/pattern.svg")',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
  },
  carouselContent: {
    position: 'relative' as const,
    zIndex: 10,
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center'
  },
  slideContainer: {
    position: 'relative' as const,
    height: '24rem',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    padding: '2rem'
  },
  slide: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    padding: '2rem',
    transition: 'opacity 1000ms ease-in-out',
    opacity: 0
  },
  activeSlide: {
    opacity: 1
  },
  slideTitle: {
    fontSize: '1.875rem',
    fontWeight: 700,
    marginBottom: '1rem'
  },
  slideDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '1.5rem'
  },
  imageContainer: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'center'
  },
  imageWrapper: {
    height: '12rem',
    width: '100%',
    position: 'relative' as const,
    borderRadius: '0.5rem',
    overflow: 'hidden'
  },
  dotsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2rem',
    gap: '0.5rem'
  },
  dot: {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
    backgroundColor: '#84cc16', /* lima-500 */
    cursor: 'pointer',
    transition: 'background-color 200ms ease-in-out'
  },
  activeDot: {
    backgroundColor: '#65a30d' /* lima-650 */
  },
  footer: {
    position: 'relative' as const,
    zIndex: 10,
    marginTop: 'auto',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  footerText: {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.8)'
  }
};

export function AuthCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.carouselContainer} className="lg:flex">
      <div style={styles.carouselOverlay} />
      
      <div style={styles.carouselContent}>
        <div style={styles.slideContainer}>
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              style={{
                ...styles.slide,
                ...(index === currentSlide ? styles.activeSlide : {})
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={styles.slideTitle}>{slide.title}</h2>
                <p style={styles.slideDescription}>{slide.description}</p>
              </div>
              <div style={styles.imageContainer}>
                <div style={styles.imageWrapper}>
                  <PlaceholderImage 
                    text={`Ilustração: ${slide.title}`}
                    bgColor={slide.bgColor}
                    height="100%"
                    width="100%"
                  />
                </div>
              </div>
            </div>
          ))};
        </div>
        
        <div style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#65a30d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index === currentSlide ? '#65a30d' : '#84cc16'}
              style={{
                ...styles.dot,
                ...(index === currentSlide ? styles.activeDot : {}),
              }}
              aria-label={`Ir para o slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div style={styles.footer}>
        <p style={styles.footerText}>© {new Date().getFullYear()} - INGA ONLINE</p>
      </div>
    </div>
  );
}
