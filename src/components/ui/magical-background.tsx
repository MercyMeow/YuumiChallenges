interface MagicalBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function MagicalBackground({ children, className = "" }: MagicalBackgroundProps) {
  return (
    <div className={`min-h-screen w-full relative ${className}`}>
      {/* Magical Background - Full viewport coverage with fallbacks */}
      <div 
        className="fixed inset-0 z-[-1] magical-bg" 
        style={{
          background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1e 50%, #0f0f23 100%)',
          backgroundImage: 'linear-gradient(135deg, oklch(0.08 0.05 285) 0%, oklch(0.06 0.08 250) 50%, oklch(0.08 0.06 270) 100%)'
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
      </div>

      {/* Subtle Animated Particles - Full viewport coverage */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        {/* Yuumi Purple Particles */}
        <div 
          className="absolute animate-subtle-pulse top-1/4 left-1/4 w-1.5 h-1.5 rounded-full" 
          style={{
            backgroundColor: 'rgba(147, 51, 234, 0.4)',
            backgroundImage: 'oklch(0.70 0.22 285 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.2), 0 4px 6px -2px rgba(147, 51, 234, 0.1)'
          }}
        ></div>
        <div 
          className="absolute animate-subtle-pulse delay-1500 bottom-1/4 right-1/4 w-1.5 h-1.5 rounded-full" 
          style={{
            backgroundColor: 'rgba(147, 51, 234, 0.4)',
            backgroundImage: 'oklch(0.70 0.22 285 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.2), 0 4px 6px -2px rgba(147, 51, 234, 0.1)'
          }}
        ></div>
        
        {/* Yuumi Blue Particles */}
        <div 
          className="absolute animate-subtle-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 rounded-full" 
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.4)',
            backgroundImage: 'oklch(0.68 0.20 250 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)'
          }}
        ></div>
        <div 
          className="absolute animate-subtle-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 rounded-full" 
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.4)',
            backgroundImage: 'oklch(0.68 0.20 250 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)'
          }}
        ></div>
        
        {/* Yuumi Teal Particles */}
        <div 
          className="absolute animate-subtle-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 rounded-full" 
          style={{
            backgroundColor: 'rgba(45, 212, 191, 0.4)',
            backgroundImage: 'oklch(0.65 0.18 185 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(45, 212, 191, 0.2), 0 4px 6px -2px rgba(45, 212, 191, 0.1)'
          }}
        ></div>
        <div 
          className="absolute animate-subtle-float delay-300 top-2/3 left-1/5 w-1 h-1 rounded-full" 
          style={{
            backgroundColor: 'rgba(45, 212, 191, 0.4)',
            backgroundImage: 'oklch(0.65 0.18 185 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(45, 212, 191, 0.2), 0 4px 6px -2px rgba(45, 212, 191, 0.1)'
          }}
        ></div>
        
        {/* Yuumi Pink Particles */}
        <div 
          className="absolute animate-subtle-pulse delay-500 top-1/6 left-2/3 w-1 h-1 rounded-full" 
          style={{
            backgroundColor: 'rgba(236, 72, 153, 0.4)',
            backgroundImage: 'oklch(0.72 0.20 340 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.2), 0 4px 6px -2px rgba(236, 72, 153, 0.1)'
          }}
        ></div>
        <div 
          className="absolute animate-subtle-float delay-1200 top-1/5 left-4/5 w-1.5 h-1.5 rounded-full" 
          style={{
            backgroundColor: 'rgba(236, 72, 153, 0.4)',
            backgroundImage: 'oklch(0.72 0.20 340 / 0.4)',
            boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.2), 0 4px 6px -2px rgba(236, 72, 153, 0.1)'
          }}
        ></div>
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