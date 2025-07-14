'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Get all rule GIFs from the public directory
const ruleGifs = [
  'rule1.gif',
  'rule2.gif',
  'rule3.gif',
  'rule4.gif',
  'rule5.gif',
  'rule6.gif',
  'rule7.gif',
  'rule8.gif',
  'rule9.gif',
  'rule10.gif',
  'rule11.gif',
  'rule12.gif',
  'rule15.gif',
].sort((a, b) => {
  const numA = parseInt(a.replace('rule', '').replace('.gif', ''));
  const numB = parseInt(b.replace('rule', '').replace('.gif', ''));
  return numA - numB;
});

export default function GalleryPage() {
  const [copiedGif, setCopiedGif] = useState<string | null>(null);

  const handleCopyLink = async (gifName: string) => {
    const shortUrl = `https://yuumi.quest/${gifName}`;
    
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedGif(gifName);
      setTimeout(() => setCopiedGif(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Magical Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute animate-pulse top-1/4 left-1/4 w-2 h-2 bg-purple-400/60 rounded-full shadow-lg shadow-purple-400/30"></div>
        <div className="absolute animate-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-blue-400/60 rounded-full shadow-lg shadow-blue-400/30"></div>
        <div className="absolute animate-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 bg-indigo-400/60 rounded-full shadow-lg shadow-indigo-400/30"></div>
        <div className="absolute animate-pulse delay-500 top-1/6 left-2/3 w-1 h-1 bg-purple-300/60 rounded-full shadow-lg shadow-purple-300/30"></div>
        <div className="absolute animate-pulse delay-1500 bottom-1/4 right-1/4 w-2 h-2 bg-blue-300/60 rounded-full shadow-lg shadow-blue-300/30"></div>
        <div className="absolute animate-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 bg-violet-400/50 rounded-full shadow-lg shadow-violet-400/30"></div>
        <div className="absolute animate-float delay-300 top-2/3 left-1/5 w-1 h-1 bg-cyan-400/50 rounded-full shadow-lg shadow-cyan-400/30"></div>
        <div className="absolute animate-float delay-1200 top-1/5 left-4/5 w-2 h-2 bg-fuchsia-400/40 rounded-full shadow-lg shadow-fuchsia-400/30"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Link href="/" className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors mb-8">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            
            <div className="mb-8 relative">
              <div className="text-6xl mb-4 relative inline-block animate-float">
                <span className="relative z-10">🖼️</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 blur-3xl opacity-30 animate-glow"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-teal-300 to-blue-300 bg-clip-text text-transparent leading-tight">
              Rule Gallery
            </h1>
            
            <p className="text-xl text-landing-text-primary mb-4">
              Browse and share Discord server rule GIFs
            </p>
            
            <p className="text-lg text-landing-text-secondary/80 max-w-2xl mx-auto leading-relaxed">
              Click on any GIF to copy its short link for easy sharing and Discord embedding
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ruleGifs.map((gif) => {
              const ruleNumber = gif.replace('rule', '').replace('.gif', '');
              const isCopied = copiedGif === gif;
              
              return (
                <div key={gif} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-teal-500/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                  <div
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyLink(gif);
                    }}
                  >
                    <Card className="relative backdrop-blur-md bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                    >
                    <CardContent className="p-0">
                      <div className="relative rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm">
                        {isCopied && (
                          <div className="absolute inset-0 bg-green-500/20 border-2 border-green-400 rounded-lg flex items-center justify-center z-10">
                            <div className="bg-black/60 rounded-lg px-3 py-2 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-400" />
                              <span className="text-green-300 font-medium">Copied!</span>
                            </div>
                          </div>
                        )}
                        <div className="relative w-full h-48">
                          <Image 
                            src={`/${gif}`} 
                            alt={`Rule ${ruleNumber} GIF`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            unoptimized // Important for GIFs to work properly
                            priority={false}
                            onError={(e) => {
                              console.error(`Failed to load image: ${gif}`, e);
                            }}
                            onLoad={() => {
                              console.log(`Successfully loaded image: ${gif}`);
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Info */}
          <div className="mt-16 text-center">
            <div className="relative group max-w-2xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <Card className="relative backdrop-blur-md bg-gradient-to-br from-cyan-600/20 to-teal-600/20 border border-cyan-500/30 rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-white text-xl font-bold mb-4">
                    How to Use
                  </h3>
                  <div className="space-y-2 text-landing-text-primary/90">
                    <p>• Click any GIF to copy its short link</p>
                    <p>• Links are optimized for Discord embedding</p>
                    <p>• Share rules quickly in your server</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}