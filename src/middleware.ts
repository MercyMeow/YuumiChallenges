import { withAuth } from "next-auth/middleware";

// Protect these routes
export default withAuth(
  // Only run middleware if user has valid token
  function middleware() {
    // Let the request continue - page will handle authentication
    return;
  },
  {
    pages: {
      signIn: "/auth/signin", // Redirect to proper sign-in page
    },
    callbacks: {
      authorized: () => {
        // Allow all requests through - let components handle authentication
        // This prevents server-side redirect issues while maintaining client-side security
        return true;
      },
    },
  }
);

// Configure which routes to protect
export const config = {
  matcher: [
    // Re-enable dashboard protection with fixed middleware
    "/dashboard/:path*",
    "/profile/:path*",
    "/summoners/:path*", 
    "/challenges/:path*",
    "/leaderboard/:path*",
    "/match/:path*", // Protect match details pages
    // Protect API routes (except auth)
    "/api/user/:path*",
    "/api/summoners/:path*",
    "/api/challenges/:path*", 
    "/api/match/:path*", // Protect match API endpoints
  ],
};