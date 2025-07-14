import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Magical Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
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
            <img 
              src={`/${gifName}`} 
              alt={`Rule ${ruleNumber} GIF`}
              className="max-w-full h-auto"
              style={{ maxWidth: '500px', width: '100%' }}
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
    </div>
  );
}

export function generateStaticParams() {
  return validGifs.map((gif) => ({
    gif: gif,
  }));
}