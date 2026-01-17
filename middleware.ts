import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/"];
const docenteRoutes = ["/docente"];
const alunoRoutes = ["/aluno"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/api/auth")
  );

  const isDocenteRoute = docenteRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  const isAlunoRoute = alunoRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute) {
    // Redirect logged in users from login/register/home to their dashboard
    if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register" || nextUrl.pathname === "/")) {
      if (userRole === "DOCENTE" || userRole === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/docente/dashboard", nextUrl));
      }
      return NextResponse.redirect(new URL("/aluno/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (isDocenteRoute && userRole === "ALUNO") {
    return NextResponse.redirect(new URL("/aluno/dashboard", nextUrl));
  }

  if (isAlunoRoute && (userRole === "DOCENTE" || userRole === "SUPERADMIN")) {
    return NextResponse.redirect(new URL("/docente/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|screenshots|manifest.json|sw.js|workbox-.*).*)"],
};
