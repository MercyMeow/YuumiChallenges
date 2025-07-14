'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Define rule GIFs with metadata
const ruleGifs = [
  { name: 'rule1.gif', rule: 1 },
  { name: 'rule2.gif', rule: 2 },
  { name: 'rule3.gif', rule: 3 },
  { name: 'rule4.gif', rule: 4 },
  { name: 'rule5.gif', rule: 5 },
  { name: 'rule6.gif', rule: 6 },
  { name: 'rule7.gif', rule: 7 },
  { name: 'rule8.gif', rule: 8 },
  { name: 'rule9.gif', rule: 9 },
  { name: 'rule10.gif', rule: 10 },
  { name: 'rule11.gif', rule: 11 },
  { name: 'rule12.gif', rule: 12 },
  { name: 'rule15.gif', rule: 15 },
].sort((a, b) => a.rule - b.rule);

interface GifCardProps {
  gif: typeof ruleGifs[0];
  onCopyLink: (gifName: string) => void;
  isCopied: boolean;
}

function GifCard({ gif, onCopyLink, isCopied }: GifCardProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    // Use the direct path to the GIF in public folder
    const src = `/${gif.name}`;
    setImageSrc(src);

    // Preload the image to check if it loads correctly
    const img = new window.Image();
    img.onload = () => setImageState('loaded');
    img.onerror = () => setImageState('error');
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [gif.name]);

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-teal-500/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
      <div
        className="cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopyLink(gif.name);
        }}
      >
        <Card className="relative backdrop-blur-md bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="relative rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm">
              {/* Copy feedback overlay */}
              {isCopied && (
                <div className="absolute inset-0 bg-green-500/20 border-2 border-green-400 rounded-lg flex items-center justify-center z-20">
                  <div className="bg-black/60 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-medium">Copied!</span>
                  </div>
                </div>
              )}

              {/* Image container */}
              <div className="relative w-full h-48 flex items-center justify-center p-4">
                {imageState === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                )}

                {imageState === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                    <p className="text-sm text-red-300">Failed to load GIF</p>
                    <p className="text-xs text-gray-400 mt-1">Click to copy link anyway</p>
                  </div>
                )}

                {imageState !== 'error' && imageSrc && (
                  <img
                    src={imageSrc}
                    alt={`Rule ${gif.rule} GIF`}
                    className={`max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300 ${
                      imageState === 'loading' ? 'opacity-0' : 'opacity-100'
                    }`}
                    loading="lazy"
                    onLoad={() => setImageState('loaded')}
                    onError={() => setImageState('error')}
                  />
                )}
              </div>

              {/* Rule label */}
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                <span className="text-xs text-cyan-300 font-medium">Rule {gif.rule}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [copiedGif, setCopiedGif] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyLink = async (gifName: string) => {
    const shortUrl = `https://yuumi.quest/${gifName}`;
    
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedGif(gifName);
      setTimeout(() => setCopiedGif(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shortUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedGif(gifName);
        setTimeout(() => setCopiedGif(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Magical Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
      </div>

      {/* Subtle Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute animate-subtle-pulse top-1/4 left-1/4 w-1.5 h-1.5 bg-yuumi-purple/40 rounded-full shadow-lg shadow-yuumi-purple/20"></div>
        <div className="absolute animate-subtle-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-yuumi-blue/40 rounded-full shadow-lg shadow-yuumi-blue/20"></div>
        <div className="absolute animate-subtle-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 bg-yuumi-teal/40 rounded-full shadow-lg shadow-yuumi-teal/20"></div>
        <div className="absolute animate-subtle-pulse delay-500 top-1/6 left-2/3 w-1 h-1 bg-yuumi-pink/40 rounded-full shadow-lg shadow-yuumi-pink/20"></div>
        <div className="absolute animate-subtle-pulse delay-1500 bottom-1/4 right-1/4 w-1.5 h-1.5 bg-yuumi-blue/40 rounded-full shadow-lg shadow-yuumi-blue/20"></div>
        <div className="absolute animate-subtle-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 bg-primary/40 rounded-full shadow-lg shadow-primary/20"></div>
        <div className="absolute animate-subtle-float delay-300 top-2/3 left-1/5 w-1 h-1 bg-yuumi-teal/40 rounded-full shadow-lg shadow-yuumi-teal/20"></div>
        <div className="absolute animate-subtle-float delay-1200 top-1/5 left-4/5 w-1.5 h-1.5 bg-yuumi-pink/40 rounded-full shadow-lg shadow-yuumi-pink/20"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Link href="/" className="inline-flex items-center gap-2 text-yuumi-purple hover:text-yuumi-blue transition-colors mb-8">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-landing-text-primary via-yuumi-teal to-yuumi-blue bg-clip-text text-transparent leading-tight">
              Yuumi Rule Gallery
            </h1>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ruleGifs.map((gif) => (
              <GifCard
                key={gif.name}
                gif={gif}
                onCopyLink={handleCopyLink}
                isCopied={copiedGif === gif.name}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}