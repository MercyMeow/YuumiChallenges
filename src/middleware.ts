import { withAuth } from "next-auth/middleware";

// Protect these routes
export default withAuth({
  pages: {
    signIn: "/auth/signin", // Redirect to proper sign-in page
  },
});

// Configure which routes to protect
export const config = {
  matcher: [
    // Protect dashboard routes
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