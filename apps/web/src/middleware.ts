// Minimal proxy — just pass through to verify middleware isn't causing 404s
export default function middleware() {
  // pass through
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};