'use client';

import { MagicalBackground } from '@/components/ui/magical-background';
import { useState, useEffect } from 'react';

export default function TestBackgroundPage() {
  const [mounted, setMounted] = useState(false);
  const [cssVarsLoaded, setCssVarsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if CSS variables are loaded
    const checkCssVars = () => {
      const testElement = document.createElement('div');
      testElement.className = 'bg-yuumi-purple-40';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const bgColor = computedStyle.backgroundColor;
      
      document.body.removeChild(testElement);
      
      setCssVarsLoaded(bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent');
    };

    if (typeof window !== 'undefined') {
      // Check immediately and after a delay
      setTimeout(checkCssVars, 100);
    }
  }, []);

  return (
    <div className="min-h-screen w-full">
      <MagicalBackground>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">MagicalBackground Test Page</h1>
              <p className="text-lg text-gray-300">
                This page tests the MagicalBackground component functionality
              </p>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded ${cssVarsLoaded ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  CSS Variables: {cssVarsLoaded ? 'Loaded' : 'Not Loaded'}
                </span>
              </div>
            </div>

            {/* Test Status */}
            <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Component Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400">Component Mounted: {mounted ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400">MagicalBackground Wrapper: Active</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-400">Background Gradients: Should be visible</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-purple-400">Animated Particles: Should be floating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Tests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gradient Test */}
              <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Gradient Background Test</h3>
                <div className="space-y-3">
                  <div className="text-sm text-gray-300">
                    <strong>Expected:</strong> Deep purple-blue gradient background
                  </div>
                  <div className="text-sm text-gray-300">
                    <strong>CSS Variables:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>--landing-bg-from: oklch(0.08 0.05 285)</li>
                      <li>--landing-bg-via: oklch(0.06 0.08 250)</li>
                      <li>--landing-bg-to: oklch(0.08 0.06 270)</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="ml-2 text-green-400">
                      {typeof window !== 'undefined' ? 'Browser environment detected' : 'Server-side rendering'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Particle Test */}
              <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Particle Animation Test</h3>
                <div className="space-y-3">
                  <div className="text-sm text-gray-300">
                    <strong>Expected:</strong> 8 colored particles with subtle animations
                  </div>
                  <div className="text-sm text-gray-300">
                    <strong>Animation Classes:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>animate-subtle-pulse (3s ease-in-out)</li>
                      <li>animate-subtle-float (4s ease-in-out)</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Particle Colors:</span>
                    <div className="flex space-x-2 mt-2">
                      <div className="w-4 h-4 bg-yuumi-purple-40 rounded-full shadow-yuumi-purple"></div>
                      <div className="w-4 h-4 bg-yuumi-blue-40 rounded-full shadow-yuumi-blue"></div>
                      <div className="w-4 h-4 bg-yuumi-teal-40 rounded-full shadow-yuumi-teal"></div>
                      <div className="w-4 h-4 bg-yuumi-pink-40 rounded-full shadow-yuumi-pink"></div>
                      <div className="w-4 h-4 bg-primary-40 rounded-full shadow-primary"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Z-Index Test */}
            <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Z-Index Layering Test</h3>
              <div className="space-y-4">
                <div className="text-sm text-gray-300">
                  <strong>Layer Stack (bottom to top):</strong>
                  <ol className="ml-4 mt-2 space-y-1">
                    <li>1. Background gradients (z-[-1])</li>
                    <li>2. Animated particles (z-[-1])</li>
                    <li>3. This content (z-20)</li>
                  </ol>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/10 border border-red-500/30 rounded-lg"></div>
                  <div className="relative z-10 p-4 bg-black/30 border border-white/20 rounded-lg">
                    <p className="text-white text-sm">
                      ✅ If you can read this text clearly, the z-index layering is working correctly.
                      The background should be visible behind this content.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CSS Variable Test */}
            <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">CSS Variables Test</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Color Variables:</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(var(--yuumi-purple))' }}></div>
                      <span className="text-gray-400">--yuumi-purple</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(var(--yuumi-blue))' }}></div>
                      <span className="text-gray-400">--yuumi-blue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(var(--yuumi-teal))' }}></div>
                      <span className="text-gray-400">--yuumi-teal</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(var(--yuumi-pink))' }}></div>
                      <span className="text-gray-400">--yuumi-pink</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Background Variables:</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(var(--landing-bg-from))' }}></div>
                      <span className="text-gray-400">--landing-bg-from</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(var(--landing-bg-via))' }}></div>
                      <span className="text-gray-400">--landing-bg-via</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(var(--landing-bg-to))' }}></div>
                      <span className="text-gray-400">--landing-bg-to</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Test Particles */}
            <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Manual Particle Test</h3>
              <div className="relative h-32 bg-black/10 rounded-lg overflow-hidden">
                <div className="absolute animate-subtle-pulse top-4 left-4 w-3 h-3 bg-yuumi-purple-40 rounded-full shadow-yuumi-purple"></div>
                <div className="absolute animate-subtle-pulse delay-1000 top-4 right-4 w-2 h-2 bg-yuumi-blue-40 rounded-full shadow-yuumi-blue"></div>
                <div className="absolute animate-subtle-float delay-500 bottom-4 left-1/2 w-3 h-3 bg-yuumi-teal-40 rounded-full shadow-yuumi-teal"></div>
                <div className="absolute animate-subtle-float delay-1500 bottom-4 right-8 w-2 h-2 bg-yuumi-pink-40 rounded-full shadow-yuumi-pink"></div>
                <div className="absolute animate-subtle-pulse delay-700 top-1/2 left-1/4 w-3 h-3 bg-primary-40 rounded-full shadow-primary"></div>
                <div className="text-center pt-12">
                  <p className="text-sm text-gray-400">
                    These particles should be animating with pulse and float effects
                  </p>
                </div>
              </div>
            </div>

            {/* Background Visibility Test */}
            <div className="bg-black/20 backdrop-blur-md border border-yellow-500/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Background Visibility Test</h3>
              <div className="space-y-4">
                <div className="text-sm text-gray-300">
                  <strong>Direct CSS Class Test:</strong>
                </div>
                <div className="h-32 rounded-lg magical-bg border border-white/10 flex items-center justify-center">
                  <span className="text-white bg-black/50 px-3 py-1 rounded">
                    This div has the &quot;magical-bg&quot; class applied directly
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  <strong>Expected:</strong> Should show the purple-blue gradient background
                </div>
              </div>
            </div>

            {/* Debugging Info */}
            <div className="bg-black/20 backdrop-blur-md border border-red-500/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Debug Information</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="text-gray-300">
                  <strong>Component Path:</strong> /src/components/ui/magical-background.tsx
                </div>
                <div className="text-gray-300">
                  <strong>CSS Classes:</strong> magical-bg, animate-subtle-pulse, animate-subtle-float
                </div>
                <div className="text-gray-300">
                  <strong>CSS Variables Test:</strong>
                  <div className="mt-2 space-y-1">
                    <div>--landing-bg-from: <span className="text-yellow-400" style={{ color: 'oklch(var(--landing-bg-from))' }}>█</span></div>
                    <div>--landing-bg-via: <span className="text-blue-400" style={{ color: 'oklch(var(--landing-bg-via))' }}>█</span></div>
                    <div>--landing-bg-to: <span className="text-purple-400" style={{ color: 'oklch(var(--landing-bg-to))' }}>█</span></div>
                  </div>
                </div>
                <div className="text-gray-300">
                  <strong>Expected Issues:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• CSS variables not compiling correctly</li>
                    <li>• Animation classes not being applied</li>
                    <li>• Z-index layering problems</li>
                    <li>• Background gradient not visible</li>
                    <li>• Fixed positioning conflicts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MagicalBackground>
    </div>
  );
}