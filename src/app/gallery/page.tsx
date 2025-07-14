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

      {/* Subtle Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
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
            
            <div className="mb-8 relative">
              <div className="text-6xl mb-4 relative inline-block animate-subtle-float">
                <span className="relative z-10">🖼️</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yuumi-teal to-yuumi-blue blur-3xl opacity-20 animate-glow"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-landing-text-primary via-yuumi-teal to-yuumi-blue bg-clip-text text-transparent leading-tight">
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
                        <div className="relative w-full h-48 flex items-center justify-center">
                          <Image 
                            src={`/${gif}`} 
                            alt={`Rule ${ruleNumber} GIF`}
                            width={192}
                            height={192}
                            className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            unoptimized // GIFs don't benefit from Next.js optimization
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

        </div>
      </div>
    </div>
  );
}