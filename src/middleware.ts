import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the request is for a rule GIF page (not the actual .gif file)
  const gifName = pathname.slice(1); // Remove leading slash
  const isRuleGifPage = validGifs.includes(gifName);
  
  if (isRuleGifPage) {
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check if the request is from Discord bot or other social media crawlers
    const isBot = userAgent.includes('Discordbot') || 
                  userAgent.includes('Discord') ||
                  userAgent.includes('facebookexternalhit') ||
                  userAgent.includes('Twitterbot') ||
                  userAgent.includes('LinkedInBot') ||
                  userAgent.toLowerCase().includes('bot');
    
    if (isBot) {
      // Redirect to the API route that serves the actual GIF file
      const url = request.nextUrl.clone();
      url.pathname = `/api/gif/${gifName}`;
      return NextResponse.redirect(url);
    }
    
    // For non-bot requests to GIF names, serve the dynamic page
    // The actual .gif files from public folder will bypass middleware
  }
  
  // For all other requests, continue to the normal Next.js routing
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude all static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(gif|jpg|jpeg|png|svg|ico|webp)).*)',
  ],
};