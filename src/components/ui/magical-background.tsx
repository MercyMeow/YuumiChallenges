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
    
    /* Individual particle styles */
    .magical-particle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(0.5px);
    }
    
    .particle-purple {
      background: radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(147, 51, 234, 0) 70%);
      box-shadow: 0 0 10px rgba(147, 51, 234, 0.5), 0 0 20px rgba(147, 51, 234, 0.3);
    }
    
    .particle-blue {
      background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0) 70%);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
    }
    
    .particle-teal {
      background: radial-gradient(circle, rgba(45, 212, 191, 0.8) 0%, rgba(45, 212, 191, 0) 70%);
      box-shadow: 0 0 10px rgba(45, 212, 191, 0.5), 0 0 20px rgba(45, 212, 191, 0.3);
    }
    
    .particle-pink {
      background: radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(236, 72, 153, 0) 70%);
      box-shadow: 0 0 10px rgba(236, 72, 153, 0.5), 0 0 20px rgba(236, 72, 153, 0.3);
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
      
      // Create particles container
      const particlesContainer = document.createElement('div');
      particlesContainer.className = 'magical-particles';
      document.body.appendChild(particlesContainer);
      
      // Create animated particles
      const particleColors = ['purple', 'blue', 'teal', 'pink'];
      const particleCount = 12;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const color = particleColors[i % particleColors.length];
        const size = Math.random() * 3 + 1; // 1-4px
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const duration = Math.random() * 20 + 20; // 20-40s
        const delay = Math.random() * 5; // 0-5s delay
        
        particle.className = `magical-particle particle-${color} animate-subtle-float`;
        particle.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${startX}%;
          top: ${startY}%;
          animation-duration: ${duration}s;
          animation-delay: ${delay}s;
          opacity: ${Math.random() * 0.3 + 0.2}; // 0.2-0.5 opacity
        `;
        
        particlesContainer.appendChild(particle);
      }
    }
  });
}