import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MagicalBackground } from '@/components/ui/magical-background';

// List of valid rule GIFs
const validGifs = [
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
];

interface PageProps {
  params: Promise<{ gif: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gif: gifName } = await params;

  if (!validGifs.includes(gifName)) {
    return {
      title: 'GIF Not Found',
    };
  }

  const ruleNumber = gifName.replace('rule', '').replace('.gif', '');
  const gifUrl = `https://yuumi.quest/${gifName}`;

  return {
    title: `Rule ${ruleNumber} - Yuumi Mains Discord`,
    description: `Discord server rule ${ruleNumber} GIF for Yuumi Mains community`,
    openGraph: {
      title: `Rule ${ruleNumber} - Yuumi Mains Discord`,
      description: `Discord server rule ${ruleNumber} GIF for Yuumi Mains community`,
      images: [
        {
          url: gifUrl,
          width: 500,
          height: 500,
          alt: `Rule ${ruleNumber} GIF`,
          type: 'image/gif',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Rule ${ruleNumber} - Yuumi Mains Discord`,
      description: `Discord server rule ${ruleNumber} GIF for Yuumi Mains community`,
      images: [gifUrl],
    },
    other: {
      'og:image:type': 'image/gif',
      'og:image:width': '500',
      'og:image:height': '500',
    },
  };
}

export default async function GifPage({ params }: PageProps) {
  const { gif: gifName } = await params;

  if (!validGifs.includes(gifName)) {
    notFound();
  }

  const ruleNumber = gifName.replace('rule', '').replace('.gif', '');

  return (
    <MagicalBackground>
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-landing-text-primary via-yuumi-purple to-yuumi-blue bg-clip-text text-transparent leading-tight">
              Rule {ruleNumber}
            </h1>
            <p className="text-xl text-landing-text-primary mb-8">
              Yuumi Mains Discord Server Rule
            </p>
          </div>

          {/* GIF Display */}
          <div className="relative mb-8 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 inline-block">
            <Image 
              src={`/${gifName}`} 
              alt={`Rule ${ruleNumber} GIF`}
              width={500}
              height={500}
              className="max-w-full h-auto"
              style={{ maxWidth: '500px', width: '100%' }}
              unoptimized // GIFs don't benefit from Next.js optimization
            />
          </div>

          {/* Back to Gallery */}
          <div className="space-y-4">
            <Link 
              href="/gallery"
              className="inline-flex items-center gap-2 text-yuumi-purple hover:text-yuumi-blue transition-colors"
            >
              ← Back to Gallery
            </Link>
            <p className="text-landing-text-secondary/80">
              Share this link for Discord embedding: <br />
              <code className="text-yuumi-teal">https://yuumi.quest/{gifName}</code>
            </p>
          </div>
        </div>
      </div>
    </MagicalBackground>
  );
}

export function generateStaticParams() {
  return validGifs.map((gif) => ({
    gif: gif,
  }));
}