import React from 'react';

interface MagicalBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function MagicalBackground({ children, className = "" }: MagicalBackgroundProps) {
  return (
    <div className={`min-h-screen w-full relative ${className}`}>
      {/* Magical Background - Full viewport coverage */}
      <div className="fixed inset-0 z-[-1] magical-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
      </div>

      {/* Subtle Animated Particles - Full viewport coverage */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute animate-subtle-pulse top-1/4 left-1/4 w-1.5 h-1.5 bg-yuumi-purple-40 rounded-full shadow-yuumi-purple"></div>
        <div className="absolute animate-subtle-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-yuumi-blue-40 rounded-full shadow-yuumi-blue"></div>
        <div className="absolute animate-subtle-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 bg-yuumi-teal-40 rounded-full shadow-yuumi-teal"></div>
        <div className="absolute animate-subtle-pulse delay-500 top-1/6 left-2/3 w-1 h-1 bg-yuumi-pink-40 rounded-full shadow-yuumi-pink"></div>
        <div className="absolute animate-subtle-pulse delay-1500 bottom-1/4 right-1/4 w-1.5 h-1.5 bg-yuumi-blue-40 rounded-full shadow-yuumi-blue"></div>
        <div className="absolute animate-subtle-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 bg-primary-40 rounded-full shadow-primary"></div>
        <div className="absolute animate-subtle-float delay-300 top-2/3 left-1/5 w-1 h-1 bg-yuumi-teal-40 rounded-full shadow-yuumi-teal"></div>
        <div className="absolute animate-subtle-float delay-1200 top-1/5 left-4/5 w-1.5 h-1.5 bg-yuumi-pink-40 rounded-full shadow-yuumi-pink"></div>
      </div>

      {/* Content */}
      {children && (
        <div className="relative z-20">
          {children}
        </div>
      )}
    </div>
  );
}