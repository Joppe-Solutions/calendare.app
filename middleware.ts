import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher(["/agenda(.*)", "/clientes(.*)", "/servicos(.*)", "/configuracoes(.*)"])
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/forgot-password(.*)", "/reset-password(.*)"])
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (isProtectedRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }
  }

  if (isAuthRoute(req)) {
    if (userId) {
      return NextResponse.redirect(new URL("/agenda", req.url))
    }
  }

  if (isOnboardingRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
}
