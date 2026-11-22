import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
const publica = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
]);
export default clerkMiddleware(async (auth, req) => {
  if (!publica(req)) await auth.protect();
});
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|webmanifest|txt|woff2?)).*)",
    "/(api|trpc)(.*)",
  ],
};
