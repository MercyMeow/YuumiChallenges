'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MagicalBackground } from '@/components/ui/magical-background';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageSrc = `/${gif.name}`;

  useEffect(() => {
    console.log(`Attempting to load GIF: ${gif.name} from path: ${imageSrc}`);
  }, [gif.name, imageSrc]);

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
                {imageError ? (
                  <div className="text-red-400 text-center">
                    <p className="text-sm">Failed to load</p>
                    <p className="text-xs opacity-70">{gif.name}</p>
                    <p className="text-xs opacity-50 mt-1">Path: /{gif.name}</p>
                  </div>
                ) : (
                  <>
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse text-cyan-300">Loading...</div>
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt={`Rule ${gif.rule} GIF`}
                      className={`max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => {
                        setImageLoaded(true);
                        console.log(`Successfully loaded: ${gif.name} from ${imageSrc}`);
                      }}
                      onError={(e) => {
                        console.error(`Failed to load image: ${gif.name} from ${imageSrc}`, e);
                        const img = e.target as HTMLImageElement;
                        console.log('Full image src:', img.src);
                        console.log('Current window location:', window.location.href);
                        
                        // Don't set error immediately, try to understand the issue
                        if (!imageError) {
                          setImageError(true);
                        }
                      }}
                    />
                  </>
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
    const ruleNumber = gifName.replace('rule', '').replace('.gif', '');
    // Use .gif extension for Discord embedding
    const shortUrl = `https://yuumi.quest/rule${ruleNumber}.gif`;
    
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
    <MagicalBackground>
      <div className="container mx-auto px-6 py-20">
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
            <p className="text-landing-text-secondary text-lg mb-2">
              Click any rule to copy its Discord-friendly link
            </p>
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
    </MagicalBackground>
  );
}
