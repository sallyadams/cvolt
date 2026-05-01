import createMiddleware from "next-intl/middleware"

export default createMiddleware({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
})

export const config = {
  // Middleware only runs on / and /en|fr paths.
  // /login  /signup  /dashboard  /cv  /api/*  etc. are NEVER matched here.
  matcher: ["/", "/(en|fr)(.*)"],
}
