import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { pathname, host } = request.nextUrl;
  
  console.log('🔓 Supabase Middleware - Host:', host, 'Pathname:', pathname);
  
  // Skip authentication for salon pages and subdomains
  if (pathname.startsWith('/salon/') || 
      (host.includes('zugflow.com') && !host.startsWith('app.'))) {
    console.log('🔓 Skipping authentication for:', pathname);
    return NextResponse.next();
  }
  
  // Creazione della risposta iniziale
  let supabaseResponse = NextResponse.next();

  try {
    // Inizializza il client di Supabase con gestione dei cookie
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Ottieni l'utente corrente
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Blocca l'accesso a /crm se non autenticato
    if (!user && pathname.startsWith("/crm")) {
      console.log('🔒 Redirecting unauthenticated user to login');
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    console.log('✅ Authentication check passed for:', pathname);
  } catch (error) {
    console.error('❌ Error in Supabase middleware:', error);
    // In caso di errore, permetti comunque l'accesso per evitare blocchi
  }

  // Restituisci la risposta con i cookie sincronizzati
  return supabaseResponse;
}
