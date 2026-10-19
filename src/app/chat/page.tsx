import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createMessage } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Channel = {
  id: string;
  name: string;
  kind: string;
  organization_id: string;
  cohort_id: string;
  company_id: string | null;
  created_by: string;
  created_at: string;
  archived_at: string | null;
};

type ChannelMember = {
  profile_id: string;
};

type ChannelWithMembers = Channel & {
  channel_members: ChannelMember[];
};

type Message = {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: {
    display_name: string | null;
  } | null;
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Get channels the user is a member of
  const { data: channels } = await supabase
    .from("channels")
    .select(
      "*, channel_members!inner(profile_id)"
    )
    .eq("channel_members.profile_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  const channelIdRaw = searchParams.channel_id;
  const channelId =
    typeof channelIdRaw === "string" ? channelIdRaw : undefined;

  // Get messages for the selected channel
  let messages: Message[] = [];
  let currentChannel: ChannelWithMembers | null = null;

  if (channelId) {
    const { data: channel } = await supabase
      .from("channels")
      .select(
        "*, channel_members!inner(profile_id)"
      )
      .eq("id", channelId)
      .eq("channel_members.profile_id", user.id)
      .single();

    currentChannel = channel as ChannelWithMembers;

    const { data: msgs } = await supabase
      .from("messages")
      .select(
        "*, sender:profiles!sender_id(display_name)"
      )
      .eq("channel_id", channelId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    messages = (msgs || []) as Message[];
  }

  return (
    <div className="max-w-5xl mx-auto p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Channels sidebar */}
        <div className="w-full md:w-80">
          <h2 className="text-sm font-semibold text-text mb-3">Channels</h2>
          <div className="space-y-1">
            {channels?.map((ch: ChannelWithMembers) => (
              <div
                key={ch.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  ch.id === channelId
                    ? "bg-fill text-accent"
                    : "text-text hover:bg-fill"
                }`}
                onClick={() => {
                  // Navigate to channel
                }}
              >
                <span className={`text-xs ${ch.kind === "direct" ? "text-blue-600" : "text-zinc-500"}`}>
                  {ch.kind === "direct" ? "DM" : ch.kind === "announcement" ? "#" : ""}
                </span>
                {ch.name}
              </div>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentChannel ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${currentChannel.kind === "direct" ? "text-blue-600" : "text-zinc-500"}`}>
                    {currentChannel.kind === "direct" ? "DM" : currentChannel.kind === "announcement" ? "#" : ""}
                  </span>
                  <span className="text-sm font-medium text-text">{currentChannel.name}</span>
                </div>
                <span className="text-xs text-text-muted">Trainers can read this channel</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
                {messages.map((msg: Message) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs text-zinc-600 font-semibold">
                      {msg.sender?.display_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xs font-medium text-text">{msg.sender?.display_name}</span>
                        <span className="text-xs text-zinc-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="rounded-lg bg-white p-3 shadow-sm text-sm text-text">
                        {msg.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-surface border-t border-border p-4">
                <form
                  action={createMessage}
                  className="flex gap-2"
                  method="POST"
                >
                  <input type="hidden" name="channel_id" value={channelId} />
                  <Input
                    id="body"
                    name="body"
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit">Send</Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
              <p className="text-sm">Select a channel to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
