export function middleware() {
  // No-op middleware. Locale routing is handled by the app route structure.
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
