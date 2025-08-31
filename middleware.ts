import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;
  
  console.log('🔍 Middleware - Host:', host, 'Pathname:', pathname);
  
  // Check if this is a subdomain request (not www, app, or api)
  const subdomain = host.split('.')[0];
  const isSubdomain = !['www', 'app', 'api', 'localhost', '127.0.0.1'].includes(subdomain) && 
                     host.includes('zugflow.com');
  
  console.log('🔍 Middleware - Subdomain:', subdomain, 'IsSubdomain:', isSubdomain);
  
  // Special handling for local testing - if pathname starts with /salon/ and we're on localhost
  if (host.includes('localhost') && pathname.startsWith('/salon/')) {
    console.log('🔄 Local salon page request detected');
    return NextResponse.next();
  }
  
  if (isSubdomain) {
    // For subdomain requests, rewrite to salon page without authentication
    const url = request.nextUrl.clone();
    url.pathname = `/salon/${subdomain}`;
    
    console.log('🔄 Rewriting subdomain request to:', url.pathname);
    
    // Don't change the host, just rewrite the path
    return NextResponse.rewrite(url);
  }
  
  // For all other requests, apply authentication and cache headers for dashboard
  const response = await updateSession(request);
  
  // Add headers for better cache management on inactivity for dashboard routes
  if (pathname.startsWith('/crm/dashboard')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Configurazione specifica per Vercel
    if (host.includes('vercel.app')) {
      response.headers.set('X-Vercel-Cache', '0');
      response.headers.set('X-Vercel-Edge-Cache', '0');
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .*\\..* (files with extensions)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

