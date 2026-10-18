import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApplyForm from "./ApplyForm";

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: { postingId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the job posting with company name
  const { data: posting, error: postingError } = await supabase
    .from("job_postings")
    .select(
      "id, title, function, track, description, requirements, openings, status, companies!inner(name)"
    )
    .eq("id", params.postingId)
    .single();

  if (postingError || !posting) {
    redirect("/not-allowed");
  }

  if (posting.status !== "open") {
    redirect(`/apply/${params.postingId}?error=posting_not_open`);
  }

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  return (
    <ApplyForm
      posting={{
        id: posting.id,
        title: posting.title,
        function: posting.function,
        track: posting.track,
        description: posting.description,
        requirements: posting.requirements,
        openings: posting.openings,
        company_name: posting.companies.name,
      }}
      error={error}
      success={success}
    />
  );
}
