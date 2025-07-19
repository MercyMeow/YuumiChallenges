"use client";

import { useEffect, useRef } from "react";

interface MagicalBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function MagicalBackground({ children, className = "" }: MagicalBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the magical background is applied globally
    if (typeof document !== 'undefined') {
      const magicalBg = document.querySelector('.global-magical-bg');
      if (!magicalBg) {
        const bgElement = document.createElement('div');
        bgElement.className = 'global-magical-bg';
        document.body.appendChild(bgElement);
      }
    }
  }, []);

  return (
    <div ref={containerRef} className={`min-h-screen w-full relative ${className}`}>
      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

// Global magical background that persists across all pages
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .global-magical-bg {
      position: fixed;
      inset: 0;
      z-index: -100;
      pointer-events: none;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    
    .global-magical-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, 
        oklch(0.08 0.05 285), 
        oklch(0.06 0.08 250), 
        oklch(0.08 0.06 270)
      );
      /* Fallback for browsers that don't support OKLCH */
      background: linear-gradient(135deg, #0f0f23, #0a0a1e, #0f0f23);
    }
    
    .global-magical-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(139, 69, 234, 0.2) 0%, transparent 50%);
    }
    
    /* Animated particles container */
    .magical-particles {
      position: fixed;
      inset: 0;
      z-index: -99;
      pointer-events: none;
      overflow: hidden;
    }
    
    /* Aurora effects */
    .magical-aurora {
      position: fixed;
      inset: 0;
      z-index: -98;
      pointer-events: none;
      overflow: hidden;
    }
    
    .aurora-beam {
      position: absolute;
      width: 200%;
      height: 100px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(147, 51, 234, 0.1) 25%, 
        rgba(59, 130, 246, 0.15) 50%, 
        rgba(45, 212, 191, 0.1) 75%, 
        transparent 100%
      );
      filter: blur(2px);
      animation: aurora 30s ease-in-out infinite;
    }
    
    /* Constellation elements */
    .magical-stars {
      position: fixed;
      inset: 0;
      z-index: -97;
      pointer-events: none;
      overflow: hidden;
    }
    
    /* Individual particle styles */
    .magical-particle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(0.5px);
    }
    
    .magical-star {
      position: absolute;
      pointer-events: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 8px;
    }
    
    .magical-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, transparent 70%);
      filter: blur(1px);
    }
    
    .particle-purple {
      background: radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(147, 51, 234, 0) 70%);
      box-shadow: 
        0 0 10px rgba(147, 51, 234, 0.6), 
        0 0 20px rgba(147, 51, 234, 0.4),
        0 0 40px rgba(147, 51, 234, 0.2);
    }
    
    .particle-blue {
      background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0) 70%);
      box-shadow: 
        0 0 10px rgba(59, 130, 246, 0.6), 
        0 0 20px rgba(59, 130, 246, 0.4),
        0 0 40px rgba(59, 130, 246, 0.2);
    }
    
    .particle-teal {
      background: radial-gradient(circle, rgba(45, 212, 191, 0.8) 0%, rgba(45, 212, 191, 0) 70%);
      box-shadow: 
        0 0 10px rgba(45, 212, 191, 0.6), 
        0 0 20px rgba(45, 212, 191, 0.4),
        0 0 40px rgba(45, 212, 191, 0.2);
    }
    
    .particle-pink {
      background: radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(236, 72, 153, 0) 70%);
      box-shadow: 
        0 0 10px rgba(236, 72, 153, 0.6), 
        0 0 20px rgba(236, 72, 153, 0.4),
        0 0 40px rgba(236, 72, 153, 0.2);
    }
    
    .particle-white {
      background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%);
      box-shadow: 
        0 0 10px rgba(255, 255, 255, 0.8), 
        0 0 20px rgba(255, 255, 255, 0.6),
        0 0 40px rgba(255, 255, 255, 0.3);
    }
  `;
  document.head.appendChild(style);
}

// Create global magical background and particles on load
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check if background already exists
    if (!document.querySelector('.global-magical-bg')) {
      // Create magical background
      const bgElement = document.createElement('div');
      bgElement.className = 'global-magical-bg';
      document.body.appendChild(bgElement);
      
      // Create aurora effects
      const auroraContainer = document.createElement('div');
      auroraContainer.className = 'magical-aurora';
      document.body.appendChild(auroraContainer);
      
      // Create multiple aurora beams
      for (let i = 0; i < 3; i++) {
        const aurora = document.createElement('div');
        aurora.className = 'aurora-beam';
        aurora.style.cssText = `
          top: ${Math.random() * 80 + 10}%;
          transform: rotate(${Math.random() * 20 - 10}deg);
          animation-delay: ${i * 10}s;
          animation-duration: ${30 + i * 5}s;
        `;
        auroraContainer.appendChild(aurora);
      }
      
      // Create constellation stars
      const starsContainer = document.createElement('div');
      starsContainer.className = 'magical-stars';
      document.body.appendChild(starsContainer);
      
      // Create twinkling stars
      for (let i = 0; i < 15; i++) {
        const star = document.createElement('div');
        star.className = 'magical-star animate-twinkle';
        star.textContent = '✦';
        star.style.cssText = `
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation-delay: ${Math.random() * 5}s;
          animation-duration: ${Math.random() * 3 + 4}s;
          opacity: ${Math.random() * 0.5 + 0.3};
        `;
        starsContainer.appendChild(star);
      }
      
      // Create particles container
      const particlesContainer = document.createElement('div');
      particlesContainer.className = 'magical-particles';
      document.body.appendChild(particlesContainer);
      
      // Create enhanced animated particles
      const particleColors = ['purple', 'blue', 'teal', 'pink', 'white'];
      const particleCount = 20;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const color = particleColors[i % particleColors.length];
        const size = Math.random() * 4 + 1; // 1-5px
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const duration = Math.random() * 30 + 15; // 15-45s
        const delay = Math.random() * 8; // 0-8s delay
        
        particle.className = `magical-particle particle-${color} animate-subtle-float`;
        particle.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${startX}%;
          top: ${startY}%;
          animation-duration: ${duration}s;
          animation-delay: ${delay}s;
          opacity: ${Math.random() * 0.4 + 0.2}; // 0.2-0.6 opacity
        `;
        
        particlesContainer.appendChild(particle);
      }
      
      // Create magical orbs
      for (let i = 0; i < 5; i++) {
        const orb = document.createElement('div');
        const size = Math.random() * 20 + 10; // 10-30px
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const duration = Math.random() * 20 + 15; // 15-35s
        const delay = Math.random() * 10; // 0-10s delay
        
        orb.className = 'magical-orb animate-magical-orb';
        orb.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${startX}%;
          top: ${startY}%;
          animation-duration: ${duration}s;
          animation-delay: ${delay}s;
          opacity: ${Math.random() * 0.3 + 0.1}; // 0.1-0.4 opacity
        `;
        
        particlesContainer.appendChild(orb);
      }
      
      // Create sparkle effects
      for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'magical-star animate-sparkle';
        sparkle.textContent = '✨';
        sparkle.style.cssText = `
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation-delay: ${Math.random() * 8}s;
          animation-duration: ${Math.random() * 5 + 6}s;
          opacity: ${Math.random() * 0.6 + 0.4};
          font-size: ${Math.random() * 8 + 8}px;
        `;
        starsContainer.appendChild(sparkle);
      }
    }
  });
}