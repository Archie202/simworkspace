import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type CohortMember = Database["public"]["Tables"]["cohort_members"]["Row"];
type CompanyMember = Database["public"]["Tables"]["company_members"]["Row"];

export interface UserContext {
  profile: Profile | null;
  roles: UserRole[];
  cohortMembers: CohortMember[];
  companyMembers: CompanyMember[];
  isAuthenticated: boolean;
}

export async function getUserContext(): Promise<UserContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      profile: null,
      roles: [],
      cohortMembers: [],
      companyMembers: [],
      isAuthenticated: false,
    };
  }

  const [profileResult, rolesResult, cohortMembersResult, companyMembersResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase.from("user_roles").select("*").eq("user_id", user.id),
      supabase
        .from("cohort_members")
        .select("*")
        .eq("profile_id", user.id)
        .eq("status", "active"),
      supabase
        .from("company_members")
        .select("*")
        .eq("profile_id", user.id),
    ]);

  return {
    profile: (profileResult.data as Profile) || null,
    roles: (rolesResult.data as UserRole[]) || [],
    cohortMembers: (cohortMembersResult.data as CohortMember[]) || [],
    companyMembers: (companyMembersResult.data as CompanyMember[]) || [],
    isAuthenticated: true,
  };
}

export function getUserRole(context: UserContext): string | null {
  // Priority: platform_admin > school_admin > trainer > manager > hr > intern
  const rolePriority: Record<string, number> = {
    platform_admin: 5,
    school_admin: 4,
    trainer: 3,
    manager: 2,
    hr: 1,
    intern: 0,
  };

  let best: { role: string; priority: number } | null = null;

  for (const role of context.roles) {
    const priority = rolePriority[role.role] ?? 0;
    if (!best || priority > best.priority) {
      best = { role: role.role, priority };
    }
  }

  return best ? best.role : null;
}

export function getUserCohort(context: UserContext) {
  return context.cohortMembers[0] || null;
}

export function getUserCompany(context: UserContext) {
  return context.companyMembers[0] || null;
}

export function getCompanyFunction(context: UserContext) {
  const company = getUserCompany(context);
  return company ? company.function : null;
}
