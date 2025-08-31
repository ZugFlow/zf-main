// Debug script for Vercel deployment issues
// Run this in the browser console to help identify problems

console.log('🔍 Debug script started');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('✅ Running in browser environment');
  
  // Check for common issues
  const checks = {
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    navigator: typeof navigator !== 'undefined',
    document: typeof document !== 'undefined'
  };
  
  console.log('🔍 Environment checks:', checks);
  
  // Check for Supabase environment variables
  const envVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
  };
  
  console.log('🔍 Environment variables:', envVars);
  
  // Check for common loading issues
  const loadingIssues = {
    hasNavbar: !!document.querySelector('[data-testid="navbar"]') || !!document.querySelector('nav'),
    hasMainContent: !!document.querySelector('main') || !!document.querySelector('[role="main"]'),
    hasLoadingSpinner: !!document.querySelector('.animate-bounce'),
    hasError: !!document.querySelector('.text-red-600')
  };
  
  console.log('🔍 Loading state checks:', loadingIssues);
  
  // Check for authentication issues
  if (typeof window !== 'undefined' && window.supabase) {
    console.log('🔍 Supabase client available');
    
    // Try to get session
    window.supabase.auth.getSession().then(({ data, error }) => {
      console.log('🔍 Session check:', { hasSession: !!data.session, error });
    }).catch(err => {
      console.error('❌ Session check failed:', err);
    });
  } else {
    console.log('❌ Supabase client not available');
  }
  
  // Check for console errors
  const originalError = console.error;
  console.error = function(...args) {
    console.log('🚨 Error caught:', args);
    originalError.apply(console, args);
  };
  
  console.log('🔍 Debug script completed');
} else {
  console.log('❌ Not running in browser environment');
} 