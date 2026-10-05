import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CyberConfirmDialog from "@/components/CyberConfirmDialog";
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
  onOpenCheckout?: () => void;
  onCancelRequest?: () => void;
}

export default function ProductChatDrawer({ isOpen, onClose, project, onOpenCheckout, onCancelRequest }: ProductChatDrawerProps) {
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDrawerConfirmOpen, setIsDrawerConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const drawerChatFeedRef = useRef<HTMLDivElement>(null);

  const handleDrawerCancelRequest = () => {
    if (onCancelRequest) {
      onCancelRequest();
      return;
    }
    if (!conversation?.id) return;
    setIsDrawerConfirmOpen(true);
  };

  const executeDrawerCancel = async () => {
    if (!conversation?.id) return;
    setIsCancelling(true);
    try {
      // 1. Wipe chat messages and update status in database
      await supabase
        .from("product_conversations")
        .update({
          status: "withdrawn",
          admin_deleted: true,
          messages: [],
          last_message: "Build request withdrawn by user",
          updated_at: new Date().toISOString()
        })
        .eq("id", conversation.id);

      // 2. Hard delete
      await supabase.from("product_conversations").delete().eq("id", conversation.id);

      toast.success("Build request withdrawn & chat deleted.");
      setIsDrawerConfirmOpen(false);
      setConversation(null);
      setMessages([]);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel request.");
    } finally {
      setIsCancelling(false);
    }
  };

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

        let activeConvo = (existing && existing.status !== "withdrawn" && existing.status !== "cancelled") ? existing : null;

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
          if (payload.new) {
            setConversation(payload.new);
            if (Array.isArray(payload.new.messages)) {
              setMessages(payload.new.messages);
            }
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
            status: conversation.status || "active",
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
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-[#0a0e17] border-l-2 border-slate-800 text-slate-100 font-mono z-50 focus:outline-none h-[100dvh] max-h-[100dvh]"
      >
        {/* Drawer Header with Project Context */}
        <SheetHeader className="p-3.5 sm:p-4 bg-[#070a12] border-b border-slate-800 shrink-0">
          <div className="flex items-start gap-3">
            {project?.thumb && (
              <img
                src={project.thumb}
                alt={project.title}
                className="w-12 h-12 rounded object-cover border border-slate-800 shadow-2xs shrink-0 bg-[#05070c]"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  SYS:\ENGINEER_COMM_LINK
                </span>
                {project?.price && (
                  <span className="ml-auto bg-amber-950/60 text-amber-400 font-black text-xs border border-amber-800 px-2 py-0.5 rounded">
                    ₹{project.price.toLocaleString()}
                  </span>
                )}
              </div>
              <SheetTitle className="text-sm font-bold text-white truncate text-left font-mono">
                {project?.title || "Project Inquiry"}
              </SheetTitle>
              <p className="text-[10px] text-slate-400 truncate text-left font-mono">
                Direct engineer desk • 256-bit isolated channel
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Auth Barrier if user not logged in */}
        {!user ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-[#0d121e] m-4 rounded-md border-2 border-slate-800 shadow-2xl font-mono">
            <div className="w-14 h-14 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800 grid place-items-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-mono">// AUTHENTICATION_REQUIRED</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-mono">
                Connect directly with our engineering team to discuss custom hardware modifications, IEEE documentation, or bulk student discounts.
              </p>
            </div>
            <Link to="/login" className="w-full">
              <Button className="w-full rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-black font-mono text-xs h-11 shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn">
                [EXEC] SIGN_IN_TO_OPEN_CHAT
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Access & Allocation Status Banner */}
            {conversation && (
              <div className="px-3.5 pt-3 pb-1 bg-[#070a12] shrink-0 border-b border-slate-800/60">
                {conversation.status === "ready_to_purchase" ? (
                  <div className="bg-gradient-to-r from-emerald-950/90 via-[#0a1d15] to-emerald-950/90 border border-emerald-500/50 rounded-xl p-3 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 grid place-items-center shrink-0">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>ACCESS_UNLOCKED</span>
                          <Badge className="bg-emerald-500 text-slate-950 text-[9px] font-black py-0 h-4 px-1.5 border-0">
                            READY TO BUY
                          </Badge>
                        </div>
                        <p className="text-[10px] text-emerald-300/90 font-mono truncate">
                          Engineer approved this build. Pay now to unlock assets!
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        onClose();
                        if (onOpenCheckout) onOpenCheckout();
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs h-9 px-4 rounded-lg shadow-md shrink-0 border-0 cursor-pointer active:scale-95 transition-all"
                    >
                      PAY NOW
                    </Button>
                  </div>
                ) : conversation.status === "purchased" ? (
                  <div className="bg-cyan-950/50 border border-cyan-800/70 rounded-xl p-2.5 flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>PROJECT_PURCHASED · Full code & schematics available in your profile registry.</span>
                  </div>
                ) : (
                  <div className="bg-[#090e1c] border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs font-mono text-amber-300/90">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow shrink-0" />
                      <span className="truncate">ALLOCATION_IN_PROGRESS: Engineer reviewing components...</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[9px] font-mono">
                        IN REVIEW
                      </Badge>
                      <button
                        onClick={handleDrawerCancelRequest}
                        className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer font-bold"
                        title="Withdraw build request and delete chat"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Feed (Contained scrolling, prevents window jump) */}
            <div 
              ref={drawerChatFeedRef}
              className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 overscroll-contain bg-[#0a0e17]"
            >
              {isLoading ? (
                <div className="py-20 text-center space-y-3 font-mono">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">SYS:\CONNECTING_STREAM...</p>
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
                        className={`flex flex-col font-mono ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isAdmin ? (
                            <span className="bg-amber-500 text-amber-950 text-[9px] px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              LEAD_ENGINEER
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {isMe ? "YOU" : m.sender_name}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded px-3.5 py-2 text-xs leading-relaxed font-mono shadow-md ${
                            isMe
                              ? "bg-amber-500 text-amber-950 font-semibold"
                              : isAdmin
                              ? "bg-[#0d121e] text-cyan-300 border border-cyan-800/80"
                              : "bg-[#0d121e] text-slate-200 border border-slate-700"
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
              <div className="px-3 sm:px-4 py-2 bg-[#070a12] border-t border-slate-800 shrink-0 font-mono">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  // QUICK_INQUIRIES:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="text-[10px] font-mono text-cyan-300 bg-[#0d121e] hover:bg-[#161d2d] hover:border-cyan-500/60 border border-slate-700 rounded px-2.5 py-1 whitespace-nowrap transition-all cursor-pointer shrink-0"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 sm:p-3.5 bg-[#070a12] border-t border-slate-800 shrink-0 font-mono">
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
                  className="rounded bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 text-xs sm:text-sm h-10 px-3.5 focus-visible:ring-1 focus-visible:ring-amber-500 font-mono flex-1"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 w-10 h-10 p-0 shrink-0 shadow-[0_2px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn transition-all flex items-center justify-center"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin text-amber-950" /> : <Send className="w-4 h-4 text-amber-950" />}
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  SHA-256 ISOLATED_CHANNEL
                </span>
                <span>RETENTION: 10_DAYS</span>
              </div>
            </div>
          </>
        )}
      </SheetContent>

      <CyberConfirmDialog
        isOpen={isDrawerConfirmOpen}
        onClose={() => setIsDrawerConfirmOpen(false)}
        onConfirm={executeDrawerCancel}
        title="WITHDRAW_BUILD_REQUEST"
        description="Are you sure you want to withdraw this build request? This will cancel your allocation check and permanently delete the inquiry chat from the system."
        confirmText="WITHDRAW_&_DELETE"
        cancelText="KEEP_REQUEST"
        variant="danger"
        isLoading={isCancelling}
      />
    </Sheet>
  );
}
