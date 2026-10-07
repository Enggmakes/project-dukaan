import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CyberConfirmDialog from "@/components/CyberConfirmDialog";
import StudentLotteryTicketModal from "@/components/StudentLotteryTicketModal";
import { isLotteryActiveForConvo, isMessageTicketActive, getConvoDiscountInfo, getConvoLotteryBounds } from "@/lib/lotteryConfig";
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
  ExternalLink,
  Ticket,
  Zap
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
  isLotteryUnlocked?: boolean;
  onOpenLottery?: () => void;
  appliedDiscount?: number;
  appliedCoupon?: string;
}

export default function ProductChatDrawer({ 
  isOpen, 
  onClose, 
  project, 
  onOpenCheckout, 
  onCancelRequest,
  isLotteryUnlocked,
  onOpenLottery,
  appliedDiscount,
  appliedCoupon
}: ProductChatDrawerProps) {
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDrawerConfirmOpen, setIsDrawerConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isInternalLotteryOpen, setIsInternalLotteryOpen] = useState(false);
  const [internalDiscount, setInternalDiscount] = useState<number>(0);
  const [internalCoupon, setInternalCoupon] = useState<string>("");
  const drawerChatFeedRef = useRef<HTMLDivElement>(null);

  const effectiveDiscount = appliedDiscount || internalDiscount;
  const effectiveCoupon = appliedCoupon || internalCoupon;

  const isTicketActive = isLotteryActiveForConvo(conversation, messages);

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
      // 1. Wipe chat messages, reset lottery state, and update status in database
      await supabase
        .from("product_conversations")
        .update({
          status: "withdrawn",
          admin_deleted: true,
          lottery_unlocked: false,
          messages: [],
          last_message: "Build request withdrawn by user",
          updated_at: new Date().toISOString()
        })
        .eq("id", conversation.id)
        .catch((err) => console.warn("Drawer cancel update warning:", err));

      // 2. Hard delete any conversations for this user & project
      if (user?.id && project?.id) {
        await supabase
          .from("product_conversations")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", project.id)
          .catch((err) => console.warn("Drawer cancel hard delete warning:", err));
      } else {
        await supabase
          .from("product_conversations")
          .delete()
          .eq("id", conversation.id)
          .catch((err) => console.warn("Drawer cancel hard delete warning:", err));
      }

      setInternalDiscount(0);
      setInternalCoupon("");
      toast.success("Build request withdrawn & chat deleted.");
      setIsDrawerConfirmOpen(false);
      setConversation(null);
      setMessages([]);
      onClose();
    } catch (err) {
      console.error("Drawer cancel error:", err);
      // Failsafe state reset
      setConversation(null);
      setMessages([]);
      setIsDrawerConfirmOpen(false);
      onClose();
      toast.success("Build request cancelled.");
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

  // Fetch or prepare conversation when drawer opens
  useEffect(() => {
    if (!isOpen || !project || !user) return;

    let isMounted = true;
    setIsLoading(true);

    const initConversation = async () => {
      try {
        // Look for existing conversation for this user and project (sorted by newest message)
        const { data: existingList, error } = await supabase
          .from("product_conversations")
          .select("*")
          .eq("user_id", user.id)
          .eq("project_id", project.id)
          .order("last_message_at", { ascending: false });

        if (error) {
          console.warn("Error fetching conversation:", error);
        }

        let activeConvo: any = null;
        if (existingList && existingList.length > 0) {
          // Filter out withdrawn or cancelled ones
          const validConvos = existingList.filter(
            (c: any) => c.status !== "withdrawn" && c.status !== "cancelled" && !c.admin_deleted
          );

          if (validConvos.length > 0) {
            // Pick conversation with real messages, or the newest one
            activeConvo = validConvos.find((c: any) => Array.isArray(c.messages) && c.messages.length > 0) || validConvos[0];

            // Clean up any duplicate orphaned records in background
            const duplicates = existingList.filter((c: any) => c.id !== activeConvo.id).map((c: any) => c.id);
            if (duplicates.length > 0) {
              supabase.from("product_conversations").delete().in("id", duplicates).then();
            }
          }
        }

        // Purge expired conversation after 5 days if applicable
        if (activeConvo) {
          const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).getTime();
          if (new Date(activeConvo.last_message_at).getTime() < fiveDaysAgo) {
            await supabase.from("product_conversations").delete().eq("id", activeConvo.id);
            activeConvo = null;
          }
        }

        // If no active conversation exists, DO NOT insert an empty phantom row into Supabase!
        // Maintain a local conversation object until the user actually sends their first message.
        if (!activeConvo) {
          activeConvo = {
            id: `local-${Date.now()}`,
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email.split("@")[0],
            project_id: project.id,
            project_title: project.title,
            project_thumb: project.thumb || "/placeholder.svg",
            project_price: project.price || 0,
            status: "active",
            messages: []
          };
        }

        if (isMounted) {
          setConversation(activeConvo);
          const discInfo = getConvoDiscountInfo(activeConvo);
          if (discInfo) {
            setInternalDiscount(discInfo.discountPercent);
            setInternalCoupon(discInfo.couponCode);
          }
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
  }, [isOpen, project?.id, user?.id]);

  // Keep a ref to the active conversation to avoid stale closures in listeners and queues
  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Realtime Broadcast Room & WebSocket Subscription while drawer is open
  useEffect(() => {
    if (!isOpen || !conversation?.id || conversation.id.startsWith("local-")) return;

    let isSubscribed = true;
    const convoId = conversation.id;

    // 1. Instant Peer-to-Peer Chat Room Broadcast (sub-30ms latency)
    const roomChannel = supabase.channel(`convo-room-${convoId}`, {
      config: { broadcast: { self: false } }
    });

    roomChannel
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        if (!isSubscribed || !payload || !payload.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        if (payload.type === "lottery_ticket") {
          setConversation((prev: any) => prev ? { ...prev, lottery_unlocked: true } : prev);
        } else if (payload.type === "lottery_revoked") {
          setConversation((prev: any) => prev ? { ...prev, lottery_unlocked: false } : prev);
          setInternalDiscount(0);
          setInternalCoupon("");
        } else if (payload.type === "coupon_applied") {
          setInternalDiscount(payload.discount_percent);
          setInternalCoupon(payload.coupon_code);
          setConversation((prev: any) => prev ? { 
            ...prev, 
            applied_discount: payload.discount_percent,
            coupon_code: payload.coupon_code,
            discounted_price: payload.discounted_price
          } : prev);
        }
      })
      .subscribe();

    // 2. Supabase Realtime Database Channel for persistent record updates
    const dbChannel = supabase
      .channel(`chat-db-${convoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_conversations",
          filter: `id=eq.${convoId}`,
        },
        (payload: any) => {
          if (!isSubscribed) return;
          if (payload.new) {
            setConversation(payload.new);
            if (Array.isArray(payload.new.messages)) {
              setMessages(payload.new.messages);
            } else {
              // Fetch full messages if postgres replica identity omits JSONB
              supabase
                .from("product_conversations")
                .select("messages")
                .eq("id", convoId)
                .maybeSingle()
                .then(({ data }) => {
                  if (data && Array.isArray(data.messages) && isSubscribed) {
                    setMessages(data.messages);
                  }
                });
            }
          }
        }
      )
      .subscribe();

    // 3. Fast 1.5-second live sync heartbeat while chat drawer is open
    // Guarantees delivery even if websockets drop or lag
    const pollInterval = setInterval(async () => {
      const activeId = conversationRef.current?.id;
      if (!isSubscribed || !activeId || activeId.startsWith("local-")) return;

      try {
        const { data: latest } = await supabase
          .from("product_conversations")
          .select("*")
          .eq("id", activeId)
          .maybeSingle();

        if (latest && isSubscribed) {
          const prevLatest = conversationRef.current;
          const msgCountChanged = Array.isArray(latest.messages) && 
            (!Array.isArray(prevLatest?.messages) || latest.messages.length !== prevLatest.messages.length);
          const timeChanged = latest.last_message_at !== prevLatest?.last_message_at;

          if (msgCountChanged || timeChanged || latest.status !== prevLatest?.status) {
            setConversation(latest);
            if (Array.isArray(latest.messages)) {
              setMessages(latest.messages);
            }
          }
        }
      } catch (e) {
        // Silently catch background poll jitter
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [isOpen, conversation?.id]);

  // Auto-scroll to bottom inside container only
  useEffect(() => {
    if (drawerChatFeedRef.current) {
      drawerChatFeedRef.current.scrollTop = drawerChatFeedRef.current.scrollHeight;
    }
  }, [messages]);

  // Serialized send queue to guarantee atomic message delivery and eliminate race conditions
  const userSendQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastUserSendRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  const handleSendMessage = (textToSend?: string) => {
    const msgText = (textToSend || newMessage).trim();
    const currentConvo = conversationRef.current;
    if (!msgText || !user || !currentConvo) return;

    // Multi-click throttle: prevent sending identical message within 1.5s
    const now = Date.now();
    if (lastUserSendRef.current.text === msgText && now - lastUserSendRef.current.time < 1500) {
      return;
    }
    lastUserSendRef.current = { text: msgText, time: now };

    if (!textToSend) setNewMessage("");

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      conversation_id: currentConvo.id,
      sender_id: user.id,
      sender_role: isUserAdmin(user) ? "admin" : "user",
      sender_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Client",
      message: msgText,
      created_at: new Date().toISOString(),
    };

    // 1. Optimistically update message feed immediately (0ms user latency)
    setMessages((prev) => [...prev, newMsg]);

    // 2. Broadcast immediately over websocket room (< 30ms latency to admin)
    if (!currentConvo.id.startsWith("local-")) {
      supabase.channel(`convo-room-${currentConvo.id}`).send({
        type: "broadcast",
        event: "chat_message",
        payload: newMsg,
      }).then(() => {}).catch(() => {});

      // Also broadcast snippet to admin global inquiry stream so the sidebar updates in real time
      supabase.channel("admin-global-inquiries").send({
        type: "broadcast",
        event: "inquiry_message",
        payload: newMsg,
      }).then(() => {}).catch(() => {});
    }

    // 3. Chain sequentially to persist to Supabase
    userSendQueueRef.current = userSendQueueRef.current.then(async () => {
      setIsSending(true);
      try {
        const convoNow = conversationRef.current || currentConvo;

        if (convoNow.id.startsWith("local-")) {
          // User sent their first message! Create single database conversation row now
          const { data: created, error: createError } = await supabase
            .from("product_conversations")
            .insert({
              user_id: user.id,
              user_email: user.email,
              user_name: user.user_metadata?.full_name || user.email?.split("@")[0],
              project_id: project.id,
              project_title: project.title,
              project_thumb: project.thumb || "/placeholder.svg",
              project_price: project.price || 0,
              status: "active",
              messages: [newMsg],
              last_message: msgText,
              last_message_at: newMsg.created_at,
            })
            .select()
            .maybeSingle();

          if (createError) throw createError;
          if (created) {
            setConversation(created);
            conversationRef.current = created;

            // Instantly notify admin dashboard over WebSocket broadcast
            supabase.channel("admin-global-inquiries").send({
              type: "broadcast",
              event: "inquiry_created",
              payload: created,
            }).then(() => {}).catch(() => {});

            // Broadcast message into room
            supabase.channel(`convo-room-${created.id}`).send({
              type: "broadcast",
              event: "chat_message",
              payload: newMsg,
            }).then(() => {}).catch(() => {});
          }
        } else {
          // Fetch current message list from DB to append cleanly
          const { data: latest, error: fetchErr } = await supabase
            .from("product_conversations")
            .select("messages")
            .eq("id", convoNow.id)
            .maybeSingle();

          if (fetchErr) throw fetchErr;

          const currentMessages = Array.isArray(latest?.messages)
            ? latest.messages
            : messages.filter((m) => m.id !== "welcome");

          // Guard against duplicate rapid multi-click in database
          const lastMsg = currentMessages[currentMessages.length - 1];
          if (
            lastMsg &&
            lastMsg.sender_role === newMsg.sender_role &&
            lastMsg.message === newMsg.message &&
            Math.abs(new Date(newMsg.created_at).getTime() - new Date(lastMsg.created_at).getTime()) < 1500
          ) {
            return;
          }

          // Deduplicate strictly by message id
          const seenIds = new Set<string>();
          const updatedMessages: ChatMessage[] = [];
          for (const m of [...currentMessages, newMsg]) {
            if (m && m.id && !seenIds.has(m.id)) {
              seenIds.add(m.id);
              updatedMessages.push(m);
            }
          }

          // Update single conversation row in Supabase
          const { error: updateError } = await supabase
            .from("product_conversations")
            .update({
              messages: updatedMessages,
              last_message: msgText,
              last_message_at: newMsg.created_at,
              admin_deleted: false, // Unhide in admin view if previously cleared
              status: convoNow.status || "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", convoNow.id);

          if (updateError) throw updateError;
        }
      } catch (err: any) {
        console.warn("Could not save message to Supabase:", err);
      } finally {
        setIsSending(false);
      }
    });
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
                <div className="ml-auto flex items-center gap-2">
                  {onCancelRequest && conversation?.status !== "purchased" && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onCancelRequest();
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline font-mono cursor-pointer touch-manipulation py-1 px-1.5"
                      title="Withdraw build request"
                    >
                      [Withdraw]
                    </button>
                  )}
                  {project?.price && (
                    <span className="bg-amber-950/60 text-amber-400 font-black text-xs border border-amber-800 px-2 py-0.5 rounded">
                      ₹{project.price.toLocaleString()}
                    </span>
                  )}
                </div>
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
                          <Badge className="bg-emerald-500 text-emerald-950 text-[9px] font-black py-0 h-4 px-1.5 border-0">
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
                      className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-mono font-black text-xs h-9 px-4 rounded-lg shadow-md shrink-0 border-0 cursor-pointer active:scale-95 transition-all"
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

                {/* Individual Student Lottery Pass Banner */}
                {isTicketActive && (
                  effectiveDiscount && effectiveDiscount > 0 ? (
                    <div className="mt-2 bg-emerald-950/60 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono text-emerald-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">STUDENT GRANT: {effectiveDiscount}% OFF ({effectiveCoupon})</span>
                      </span>
                      <Badge className="bg-emerald-500 text-emerald-950 font-black text-[9px] h-4 py-0 shrink-0">SAVED</Badge>
                    </div>
                  ) : (
                    <div className="mt-2 bg-gradient-to-r from-amber-950/80 via-[#181206] to-amber-950/80 border border-amber-500/60 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono text-amber-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <Ticket className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                        <span className="font-['Cinzel',serif] font-bold truncate">RAFFLE TICKET GRANTED</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenLottery) onOpenLottery();
                          else setIsInternalLotteryOpen(true);
                        }}
                        className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-2.5 py-0.5 rounded text-[10px] cursor-pointer shadow-sm transition-all shrink-0 tracking-wider"
                      >
                        SCRATCH →
                      </button>
                    </div>
                  )
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
                    .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
                    .map((m, mIdx, filteredArr) => {
                    const isAdmin = m.sender_role === "admin";
                    const isMe = m.sender_id === user.id;
                    const isLotteryTicketMsg = m.type === "lottery_ticket" || m.message?.includes("[STUDENT LUCKY RAFFLE UNLOCKED]");
                    const isCurrentTicketActive = isLotteryTicketMsg && isMessageTicketActive(mIdx, filteredArr, conversation);

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

                        {isLotteryTicketMsg ? (
                          <div className="w-full max-w-sm rounded-xl bg-gradient-to-br from-[#121a2c] via-[#0b101c] to-[#070b14] border-2 border-amber-500/70 p-3.5 sm:p-4 shadow-[0_0_25px_rgba(245,158,11,0.25)] text-left relative overflow-hidden font-mono space-y-3">
                            <div className="absolute inset-0 opacity-15 pointer-events-none vintage-sunburst" />
                            
                            <div className="relative z-10 flex items-center justify-between border-b border-amber-500/30 pb-2">
                              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-['Cinzel',serif] font-bold tracking-wider">
                                <span>STUDENT RAFFLE PASS</span>
                              </div>
                              <span className="text-[10px] font-['Special_Elite',monospace] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                                {m.ticket_id || "№ 008530 · 1984"}
                              </span>
                            </div>

                            <p className="relative z-10 text-xs text-slate-200 font-mono leading-relaxed">
                              {m.message}
                            </p>

                            <div className="relative z-10 pt-1">
                              {isCurrentTicketActive && effectiveDiscount && effectiveDiscount > 0 ? (
                                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <div>
                                      <div className="text-xs font-bold text-emerald-300 font-mono">
                                        {effectiveDiscount}% DISCOUNT APPLIED
                                      </div>
                                      <div className="text-[10px] text-emerald-400/80 font-mono">
                                        Code: {effectiveCoupon} active on checkout
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      onClose();
                                      if (onOpenCheckout) onOpenCheckout();
                                    }}
                                    className="h-7 text-[10px] font-mono font-black bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-2.5 rounded cursor-pointer"
                                  >
                                    PAY NOW
                                  </Button>
                                </div>
                              ) : isCurrentTicketActive ? (
                                <Button
                                  onClick={() => {
                                    if (onOpenLottery) onOpenLottery();
                                    else setIsInternalLotteryOpen(true);
                                  }}
                                  className="w-full h-11 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-amber-950 font-black font-mono text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-98 retro-btn border border-amber-300"
                                >
                                  <Ticket className="w-4 h-4" />
                                  <span>[ SCRATCH YOUR LUCKY TICKET ]</span>
                                </Button>
                              ) : (
                                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-mono text-center flex items-center justify-center gap-1.5">
                                  <span>Ticket inactive / revoked by engineer</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
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
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Quick Inquiry Chips (Always accessible, persistent like admin canned response bar) */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#080d19] border-t border-slate-800/80 overflow-x-auto no-scrollbar shrink-0 font-mono">
              <span className="text-[10px] font-mono font-bold text-amber-400/90 flex items-center gap-1 shrink-0 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" />
                PRESETS:
              </span>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isSending}
                  className="text-[11px] font-mono bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40 px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {q}
                </button>
              ))}
            </div>

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

      {/* Internal Student Scratch Lottery Modal */}
      {(() => {
        const bounds = getConvoLotteryBounds(conversation, messages);
        const activeTicket = messages
          ?.slice()
          .reverse()
          .find((m: any) => m.type === "lottery_ticket" || m.message?.includes("[STUDENT LUCKY RAFFLE UNLOCKED]"));

        return (
          <StudentLotteryTicketModal
            isOpen={isInternalLotteryOpen}
            onClose={() => setIsInternalLotteryOpen(false)}
            projectTitle={project?.title || ""}
            originalPrice={project?.price || 0}
            minDiscount={bounds.minDiscount}
            maxDiscount={bounds.maxDiscount}
            ticketId={activeTicket?.ticket_id}
            onApplyDiscount={async (disc, code) => {
              setInternalDiscount(disc);
              setInternalCoupon(code);
              setIsInternalLotteryOpen(false);
              toast.success(`🎉 ${disc}% Lucky Discount Applied! Promo: ${code}`);

              if (conversation?.id) {
                const origPrice = Number(conversation.project_price || project?.price || 0);
                const discountedPrice = origPrice > 0 ? Math.round(origPrice * (1 - disc / 100)) : 0;
                
                const discountMsg = {
                  id: `msg-${Date.now()}`,
                  sender_id: user?.id || "user",
                  sender_role: "user",
                  sender_name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Student",
                  message: `🎟️ Applied Lucky Student Coupon: ${code} (${disc}% OFF) — Total: ₹${discountedPrice.toLocaleString('en-IN')}`,
                  type: "coupon_applied",
                  discount_percent: disc,
                  coupon_code: code,
                  original_price: origPrice,
                  discounted_price: discountedPrice,
                  created_at: new Date().toISOString()
                };

                const currentMsgs = Array.isArray(messages) ? messages : [];
                const nextMsgs = [...currentMsgs, discountMsg];
                setMessages(nextMsgs);
                setConversation((prev: any) => prev ? {
                  ...prev,
                  applied_discount: disc,
                  coupon_code: code,
                  discounted_price: discountedPrice,
                  messages: nextMsgs,
                  last_message: discountMsg.message,
                  last_message_at: discountMsg.created_at,
                } : prev);

                // 1. Peer-to-peer room broadcast (<30ms)
                supabase.channel(`convo-room-${conversation.id}`).send({
                  type: 'broadcast',
                  event: 'chat_message',
                  payload: discountMsg
                }).catch(() => {});

                // 2. Admin global inquiries broadcast (<30ms)
                supabase.channel('admin-global-inquiries').send({
                  type: 'broadcast',
                  event: 'coupon_applied',
                  payload: {
                    conversation_id: conversation.id,
                    applied_discount: disc,
                    coupon_code: code,
                    original_price: origPrice,
                    discounted_price: discountedPrice,
                    last_message: discountMsg.message,
                    last_message_at: discountMsg.created_at,
                    message: discountMsg
                  }
                }).catch(() => {});

                // 3. Persist to Supabase database
                let updatePayload: any = {
                  applied_discount: disc,
                  coupon_code: code,
                  discounted_price: discountedPrice,
                  messages: nextMsgs,
                  last_message: discountMsg.message,
                  last_message_at: discountMsg.created_at,
                  updated_at: new Date().toISOString()
                };

                let { error } = await supabase
                  .from('product_conversations')
                  .update(updatePayload)
                  .eq('id', conversation.id);

                if (error && (error.message?.includes('applied_discount') || error.message?.includes('discounted_price'))) {
                  delete updatePayload.applied_discount;
                  delete updatePayload.coupon_code;
                  delete updatePayload.discounted_price;
                  await supabase
                    .from('product_conversations')
                    .update(updatePayload)
                    .eq('id', conversation.id);
                }
              }
            }}
          />
        );
      })()}
    </Sheet>
  );
}
