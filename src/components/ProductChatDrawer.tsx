import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { isUserAdmin } from "@/lib/authUtils";
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Bot, 
  User, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  Layers, 
  ChevronRight,
  ExternalLink
} from "lucide-react";

interface ProductChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    thumb?: string;
    price?: number;
    category?: string;
  } | null;
}

export default function ProductChatDrawer({ isOpen, onClose, project }: ProductChatDrawerProps) {
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const drawerChatFeedRef = useRef<HTMLDivElement>(null);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch or create conversation when drawer opens
  useEffect(() => {
    if (!isOpen || !project || !user) return;

    let isMounted = true;
    setIsLoading(true);

    const initConversation = async () => {
      try {
        // Look for existing conversation for this user and project
        const { data: existing, error } = await supabase
          .from("product_conversations")
          .select("*")
          .eq("user_id", user.id)
          .eq("project_id", project.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.warn("Error fetching conversation:", error);
        }

        let activeConvo = existing;

        if (existing) {
          const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
          if (new Date(existing.last_message_at).getTime() < fiveDaysAgo.getTime()) {
            // Purge expired conversation after 5 days
            await supabase.from("product_conversations").delete().eq("id", existing.id);
            activeConvo = null;
          }
        }

        if (!activeConvo) {
          // Create new conversation
          const { data: created, error: createError } = await supabase
            .from("product_conversations")
            .insert({
              user_id: user.id,
              user_email: user.email,
              user_name: user.user_metadata?.full_name || user.email.split("@")[0],
              project_id: project.id,
              project_title: project.title,
              project_thumb: project.thumb || "/placeholder.svg",
              project_price: project.price || 0,
              status: "active",
              last_message: "Chat initiated",
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.warn("Could not create conversation in database:", createError);
            // Fallback local memory conversation
            activeConvo = {
              id: `local-${Date.now()}`,
              user_id: user.id,
              project_id: project.id,
              project_title: project.title,
            };
          } else {
            activeConvo = created;
          }
        }

        if (isMounted) {
          setConversation(activeConvo);
          if (activeConvo && Array.isArray(activeConvo.messages) && activeConvo.messages.length > 0) {
            setMessages(activeConvo.messages);
          } else {
            setMessages([
              {
                id: "welcome",
                sender_role: "admin",
                sender_name: "ProjectDukaan Lead Engineer",
                message: `Hi there! I'm here to answer any questions about "${project?.title}". Are you looking for custom sensor upgrades, IEEE thesis customization, or hardware kit dispatch details?`,
                created_at: new Date().toISOString(),
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to initialize conversation:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initConversation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, project, user]);

  // Realtime WebSocket Subscription on conversation UPDATE
  useEffect(() => {
    if (!conversation?.id || conversation.id.startsWith("local-")) return;

    const channel = supabase
      .channel(`chat-convo-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "product_conversations",
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          if (payload.new && Array.isArray(payload.new.messages)) {
            setMessages(payload.new.messages);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  // Auto-scroll to bottom inside container only
  useEffect(() => {
    if (drawerChatFeedRef.current) {
      drawerChatFeedRef.current.scrollTop = drawerChatFeedRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || newMessage).trim();
    if (!msgText || !user || !conversation) return;

    setIsSending(true);
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_role: isUserAdmin(user) ? "admin" : "user",
      sender_name: user.user_metadata?.full_name || user.email.split("@")[0],
      message: msgText,
      created_at: new Date().toISOString(),
    };

    // Optimistically update message feed
    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setNewMessage("");

    try {
      if (!conversation.id.startsWith("local-")) {
        // Fetch current message list from DB to append cleanly
        const { data: latest } = await supabase
          .from("product_conversations")
          .select("messages")
          .eq("id", conversation.id)
          .single();

        const currentMessages = Array.isArray(latest?.messages)
          ? latest.messages
          : messages.filter((m) => m.id !== "welcome");

        const updatedMessages = [...currentMessages, newMsg];

        // Update single conversation row in Supabase
        const { error: updateError } = await supabase
          .from("product_conversations")
          .update({
            messages: updatedMessages,
            last_message: msgText,
            last_message_at: newMsg.created_at,
            admin_deleted: false, // Unhide in admin view if previously cleared
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversation.id);

        if (updateError) throw updateError;
      }
    } catch (err: any) {
      console.warn("Could not save message to Supabase:", err);
    } finally {
      setIsSending(false);
    }
  };

  const quickQuestions = [
    "Can you add custom hardware sensors to this kit?",
    "Does this include full IEEE thesis & circuit diagrams?",
    "What is the delivery timeline for physical shipping?",
    "Can I get a discount for a college group order?",
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-slate-50 z-50 focus:outline-none h-[100dvh] max-h-[100dvh]"
      >
        {/* Drawer Header with Project Context */}
        <SheetHeader className="p-3.5 sm:p-4 bg-white border-b border-slate-200/90 shrink-0">
          <div className="flex items-start gap-3">
            {project?.thumb && (
              <img
                src={project.thumb}
                alt={project.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Live Engineer Desk
                </span>
                {project?.price && (
                  <Badge className="ml-auto bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
                    ₹{project.price.toLocaleString()}
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-sm font-bold text-slate-900 truncate text-left">
                {project?.title || "Project Inquiry"}
              </SheetTitle>
              <p className="text-[11px] text-slate-500 truncate text-left">
                Direct inquiry channel • Response within minutes
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Auth Barrier if user not logged in */}
        {!user ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-white m-4 rounded-3xl border border-slate-200/90 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Sign in to Chat</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Connect directly with our engineering team to discuss custom hardware modifications, IEEE documentation, or bulk student discounts.
              </p>
            </div>
            <Link to="/login" className="w-full">
              <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 shadow-sm">
                Sign in to Open Chat
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Messages Feed (Contained scrolling, prevents window jump) */}
            <div 
              ref={drawerChatFeedRef}
              className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 overscroll-contain"
            >
              {isLoading ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Connecting to live chat stream...</p>
                </div>
              ) : (
                <>
                  {messages
                    .filter((m, idx, arr) => {
                      if (idx > 0) {
                        const prev = arr[idx - 1];
                        if (prev.sender_role === m.sender_role && prev.message === m.message) {
                          const timeDiff = Math.abs(new Date(m.created_at).getTime() - new Date(prev.created_at).getTime());
                          if (isNaN(timeDiff) || timeDiff < 60000) {
                            return false;
                          }
                        }
                      }
                      return true;
                    })
                    .map((m) => {
                    const isAdmin = m.sender_role === "admin";
                    const isMe = m.sender_id === user.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isAdmin ? (
                            <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0 h-4 font-bold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Lead Engineer
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {isMe ? "You" : m.sender_name}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                            isMe
                              ? "bg-slate-900 text-white rounded-tr-xs"
                              : isAdmin
                              ? "bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs"
                              : "bg-blue-50 text-blue-950 border border-blue-100 rounded-tl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Quick Inquiry Chips (When empty or 1 message) */}
            {messages.length <= 2 && (
              <div className="px-3 sm:px-4 py-2 bg-white/90 border-t border-slate-200/60 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Suggested Questions:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-md px-2.5 py-1 whitespace-nowrap transition-all cursor-pointer shrink-0"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 sm:p-3.5 bg-white border-t border-slate-200/90 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask about components, hardware, or code..."
                  className="rounded-lg bg-slate-50 border-slate-200 text-xs sm:text-sm h-10 px-3.5 focus-visible:ring-blue-500/20 flex-1"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 p-0 shrink-0 shadow-sm transition-all"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Encrypted & Isolated Channel
                </span>
                <span>Active 5-10 days</span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
