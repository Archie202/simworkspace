import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route access rules: which roles can access which route prefixes
// Roles are checked in priority order (platform_admin > school_admin > trainer > manager > hr > intern)
const ROUTE_ACCESS: Record<string, string[]> = {
  // Public routes - no auth required
  "/login": [],
  "/signup": [],
  "/auth": [],

  // All authenticated users
  "/dashboard": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/jobs": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/apply": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/tasks": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/chat": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/meetings": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/record": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],

  // HR and above
  "/hiring": ["hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/hr/job-postings": ["hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/hr/screening": ["hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/hr/interviews": ["hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/hr/offers": ["hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/hr/override": ["trainer", "school_admin", "platform_admin"],
  "/offer": ["intern", "hr", "manager", "trainer", "school_admin", "platform_admin"],
  "/attendance": ["hr", "manager", "trainer", "school_admin", "platform_admin"],

  // Manager and above
  "/reviews": ["manager", "trainer", "school_admin", "platform_admin"],

  // Trainer and above
  "/trainer": ["trainer", "school_admin", "platform_admin"],
  "/trainer/dashboard": ["trainer", "school_admin", "platform_admin"],
  "/trainer/cohorts": ["trainer", "school_admin", "platform_admin"],
  "/trainer/companies": ["trainer", "school_admin", "platform_admin"],
  "/trainer/invite": ["trainer", "school_admin", "platform_admin"],
  "/trainer/consent": ["trainer", "school_admin", "platform_admin"],

  // School admin and above
  "/admin": ["school_admin", "platform_admin"],
};

const ROLE_PRIORITY: Record<string, number> = {
  platform_admin: 5,
  school_admin: 4,
  trainer: 3,
  manager: 2,
  hr: 1,
  intern: 0,
};

function getHighestRole(roles: string[]): string | null {
  let best: { role: string; priority: number } | null = null;
  for (const role of roles) {
    const priority = ROLE_PRIORITY[role] ?? 0;
    if (!best || priority > best.priority) {
      best = { role, priority };
    }
  }
  return best ? best.role : null;
}

function routeAllowsRole(pathname: string, userRole: string | null): boolean {
  // Find the matching route prefix
  let matchingRoute: string | null = null;
  for (const route of Object.keys(ROUTE_ACCESS)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      if (!matchingRoute || route.length > matchingRoute.length) {
        matchingRoute = route;
      }
    }
  }

  if (!matchingRoute) {
    // Unknown route - deny by default
    return false;
  }

  const allowedRoles = ROUTE_ACCESS[matchingRoute];
  if (allowedRoles.length === 0) {
    // Public route
    return true;
  }

  if (!userRole) {
    return false;
  }

  return allowedRoles.includes(userRole);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isAuthPage = pathname.startsWith("/auth");

  // Redirect unauthenticated users to login (unless on login/signup/auth page)
  if (!session && !isLoginPage && !isSignupPage && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login/signup
  if (session && (isLoginPage || isSignupPage)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based route protection
  if (session) {
    // Get user's role from the database
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const userRole = userRoles ? getHighestRole(userRoles.map((r) => r.role)) : null;

    // Users with a profile but no assigned role can access dashboard (pending verification)
    if (!userRole) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, status")
        .eq("id", session.user.id)
        .single();

      if (profile && pathname !== "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (!profile && !routeAllowsRole(pathname, userRole)) {
        return NextResponse.redirect(new URL("/not-allowed", request.url));
      }
    } else if (!routeAllowsRole(pathname, userRole)) {
      return NextResponse.redirect(new URL("/not-allowed", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)"],
};
