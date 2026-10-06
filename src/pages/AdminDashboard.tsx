import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, TrendingUp, Users, IndianRupee, Activity, MoreHorizontal, Bell, ChevronDown, 
  Plus, Image as ImageIcon, Mail, Trash2, CheckCircle, LogOut, Globe, ShoppingBag, 
  Truck, Download, Pencil, ExternalLink, RefreshCw, Layers, Edit3, MessageSquare, 
  Send, Sparkles, CheckCircle2, Clock, User, Filter, Archive, ArrowLeft, FolderGit2, 
  HardDrive, Video, FileText, FileCode, PackageCheck, Copy, Menu, X, SlidersHorizontal, 
  Terminal, Shield, ArrowUpRight, BarChart3, Inbox, FileSpreadsheet, Check, Key, Ticket, Zap, Gift
} from "lucide-react";
import Layout from "@/components/Layout";
import CyberConfirmDialog from "@/components/CyberConfirmDialog";
import StudentLotteryTicketModal from "@/components/StudentLotteryTicketModal";
import { getLotteryConfig, saveLotteryConfig, LotteryConfig } from "@/lib/lotteryConfig";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/mockData";
import { toast } from "sonner";
import { isUserAdmin, checkAdminStatus } from "@/lib/authUtils";

const statusColor: Record<string, string> = {
  New: "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-medium",
  Reviewing: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-medium",
  Contacted: "bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono font-medium",
  Quoted: "bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono font-medium",
  "In Progress": "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono font-medium",
  Delivered: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-medium",
  Cancelled: "bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono font-medium",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const checkAdminAccess = async (session: any) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const admin = await checkAdminStatus(session.user);
      if (!admin) {
        navigate("/");
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminAccess(session);
      setAdminUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminAccess(session);
      setAdminUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const [adminUser, setAdminUser] = useState<any>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("leads");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [readMessages, setReadMessages] = useState<string[]>([]);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [trackingOrderInfo, setTrackingOrderInfo] = useState<{ id: string, currentTracking: string | null } | null>(null);
  const [trackingIdInput, setTrackingIdInput] = useState("");

  // Custom Deliverables Dialog state (GitHub, Drive, Video, PDF, Notes)
  const [isDeliverablesDialogOpen, setIsDeliverablesDialogOpen] = useState(false);
  const [selectedOrderForDeliverables, setSelectedOrderForDeliverables] = useState<any | null>(null);
  const [deliverablesForm, setDeliverablesForm] = useState({
    github_url: "",
    drive_url: "",
    video_url: "",
    pdf_url: "",
    admin_notes: ""
  });
  const [isSavingDeliverables, setIsSavingDeliverables] = useState(false);

  // Real-time Product Inquiries / Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any | null>(null);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [isAdminSending, setIsAdminSending] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [chatStatusFilter, setChatStatusFilter] = useState<"all" | "active" | "purchased" | "archived">("all");
  const adminChatFeedRef = useRef<HTMLDivElement>(null);
  const selectedConvoRef = useRef<any>(null);

  // Student Scratch Lottery Ticket Config state
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(() => getLotteryConfig());
  const [lotteryMinInput, setLotteryMinInput] = useState<number>(() => getLotteryConfig().minDiscount);
  const [lotteryMaxInput, setLotteryMaxInput] = useState<number>(() => getLotteryConfig().maxDiscount);
  const [isTestLotteryOpen, setIsTestLotteryOpen] = useState(false);

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      const cfg = e.detail || getLotteryConfig();
      setLotteryConfig(cfg);
      setLotteryMinInput(cfg.minDiscount);
      setLotteryMaxInput(cfg.maxDiscount);
    };
    window.addEventListener("dukaan_lottery_config_changed", handleConfigChange);
    return () => window.removeEventListener("dukaan_lottery_config_changed", handleConfigChange);
  }, []);

  const handleToggleLottery = () => {
    const newCfg: LotteryConfig = {
      ...lotteryConfig,
      enabled: !lotteryConfig.enabled
    };
    setLotteryConfig(newCfg);
    saveLotteryConfig(newCfg);
    toast.success(newCfg.enabled ? "🟢 Student Scratch Lottery enabled storewide!" : "🔴 Student Scratch Lottery disabled storewide.");
  };

  const handleSaveLotteryRules = (e: React.FormEvent) => {
    e.preventDefault();
    const min = Math.max(1, Math.min(90, Number(lotteryMinInput) || 20));
    const max = Math.max(min, Math.min(90, Number(lotteryMaxInput) || 30));
    const newCfg: LotteryConfig = {
      ...lotteryConfig,
      minDiscount: min,
      maxDiscount: max
    };
    setLotteryConfig(newCfg);
    saveLotteryConfig(newCfg);
    toast.success(`Lottery rules updated: ${min}% to ${max}% discount range!`);
  };

  useEffect(() => {
    supabase.from('custom_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) {
        const formattedLeads = data.map(d => ({
          rawId: d.id,
          id: d.id.split('-')[0].toUpperCase(),
          name: d.full_name,
          email: d.email,
          project: d.title,
          category: d.category,
          budget: d.budget,
          status: d.status,
          date: new Date(d.created_at).toLocaleDateString(),
          document_url: d.document_url
        }));
        setLeads(formattedLeads);
      }
    });

    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMessages(data);
    });

    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setOrders(data);
    });

    fetchDbProjects();
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('product_conversations')
        .select('*')
        .gte('last_message_at', fiveDaysAgo)
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        // Group by user_id and project_id to ensure strictly ONE thread per client per project
        const pairMap = new Map<string, any>();
        const duplicateIdsToDelete: string[] = [];

        for (const c of data) {
          if (c.admin_deleted || c.status === 'withdrawn' || c.status === 'cancelled') continue;
          
          const pairKey = `${c.user_id}_${c.project_id}`;
          if (!pairMap.has(pairKey)) {
            pairMap.set(pairKey, c);
          } else {
            const existing = pairMap.get(pairKey);
            // If the duplicate has actual messages and existing doesn't, keep the one with messages
            const duplicateHasMsgs = Array.isArray(c.messages) && c.messages.length > 0;
            const existingHasMsgs = Array.isArray(existing.messages) && existing.messages.length > 0;
            if (duplicateHasMsgs && !existingHasMsgs) {
              duplicateIdsToDelete.push(existing.id);
              pairMap.set(pairKey, c);
            } else {
              duplicateIdsToDelete.push(c.id);
            }
          }
        }

        const deduplicated = Array.from(pairMap.values());
        setConversations(deduplicated);

        // Automatically clean up duplicate ghost rows from Supabase in the background
        if (duplicateIdsToDelete.length > 0) {
          supabase
            .from('product_conversations')
            .delete()
            .in('id', duplicateIdsToDelete)
            .then();
        }
      }
    } catch (e) {
      console.warn("Could not fetch conversations:", e);
    }
  };

  // Helper to extract cutoff time if admin previously cleared this conversation
  const getClearedCutoff = (convo: any) => {
    if (!convo) return null;
    let cleared = convo.admin_cleared_at;
    if (!cleared) {
      try {
        const clearedMap = JSON.parse(localStorage.getItem('admin_cleared_chats') || '{}');
        cleared = clearedMap[convo.id];
      } catch {}
    }
    return cleared ? new Date(cleared).getTime() : null;
  };

  // Sync messages from conversation into adminChatMessages state
  const syncAdminMessages = (convo: any) => {
    if (!convo) {
      setAdminChatMessages([]);
      return;
    }
    const cutoffTime = getClearedCutoff(convo);
    const msgs = Array.isArray(convo.messages) ? convo.messages : [];
    if (cutoffTime) {
      // Filter out messages prior to the admin clear timestamp
      const filtered = msgs.filter((m: any) => new Date(m.created_at).getTime() > cutoffTime);
      setAdminChatMessages(filtered);
    } else {
      setAdminChatMessages(msgs);
    }
  };

  // Whenever selectedConvo changes, sync its messages to state
  useEffect(() => {
    selectedConvoRef.current = selectedConvo;
    syncAdminMessages(selectedConvo);
  }, [selectedConvo?.id, selectedConvo?.admin_cleared_at]);

  // Active live-sync heartbeat: guarantees realtime message delivery every 3s while admin views a chat
  useEffect(() => {
    if (!selectedConvo?.id) return;
    const currentId = selectedConvo.id;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('product_conversations')
          .select('*')
          .eq('id', currentId)
          .maybeSingle();

        if (error || !data) return;

        // If conversation was withdrawn/cancelled/deleted
        if (data.admin_deleted || data.status === 'withdrawn' || data.status === 'cancelled') {
          if (selectedConvoRef.current?.id === currentId) {
            setSelectedConvo(null);
            setAdminChatMessages([]);
            fetchConversations();
          }
          return;
        }

        const existingCount = Array.isArray(selectedConvoRef.current?.messages)
          ? selectedConvoRef.current.messages.length
          : 0;
        const newCount = Array.isArray(data.messages) ? data.messages.length : 0;
        const timeChanged = data.last_message_at !== selectedConvoRef.current?.last_message_at;

        if (newCount !== existingCount || timeChanged) {
          if (selectedConvoRef.current?.id === currentId) {
            setSelectedConvo(data);
            syncAdminMessages(data);
            // Refresh conversation list preview in sidebar as well
            fetchConversations();
          }
        }
      } catch {
        // Network drop fallback
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConvo?.id]);

  // Realtime subscription for conversation list and active chat (all in product_conversations)
  useEffect(() => {
    const convoChannel = supabase
      .channel('admin-convo-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_conversations' },
        (payload: any) => {
          fetchConversations();
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            setConversations((prev) => prev.filter((c) => c.id !== deletedId));
            if (selectedConvoRef.current?.id === deletedId) {
              setSelectedConvo(null);
              setAdminChatMessages([]);
              toast.info("Build request / chat was deleted.");
            }
          } else if (payload.new) {
            if (payload.new.status === 'withdrawn' || payload.new.status === 'cancelled' || payload.new.admin_deleted) {
              setConversations((prev) => prev.filter((c) => c.id !== payload.new.id));
              if (selectedConvoRef.current?.id === payload.new.id) {
                setSelectedConvo(null);
                setAdminChatMessages([]);
                toast.info("Build request / chat was deleted.");
              }
            } else if (selectedConvoRef.current?.id === payload.new.id) {
              // Ensure we have full messages array even if postgres replica identity omits jsonb
              if (!Array.isArray(payload.new.messages)) {
                supabase
                  .from('product_conversations')
                  .select('*')
                  .eq('id', payload.new.id)
                  .maybeSingle()
                  .then(({ data }) => {
                    if (data && selectedConvoRef.current?.id === data.id) {
                      setSelectedConvo(data);
                      syncAdminMessages(data);
                    }
                  });
              } else {
                setSelectedConvo(payload.new);
                syncAdminMessages(payload.new);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convoChannel);
    };
  }, []);

  useEffect(() => {
    if (adminChatFeedRef.current) {
      adminChatFeedRef.current.scrollTop = adminChatFeedRef.current.scrollHeight;
    }
  }, [adminChatMessages]);

  // Serial send queue to ensure multiple canned clicks or quick typing never race or overwrite each other
  const adminSendQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastAdminSendRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  const handleAdminSend = (presetText?: string) => {
    const text = (presetText || adminReplyText).trim();
    const activeConvo = selectedConvoRef.current;
    if (!text || !activeConvo) return;

    // Multi-click throttle: prevent sending identical message within 1.5s
    const now = Date.now();
    if (lastAdminSendRef.current.text === text && now - lastAdminSendRef.current.time < 1500) {
      return;
    }
    lastAdminSendRef.current = { text, time: now };

    if (!presetText) setAdminReplyText("");

    const targetId = activeConvo.id;
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      conversation_id: targetId,
      sender_id: adminUser?.id || "admin",
      sender_role: "admin",
      sender_name: "ProjectDukaan Support",
      message: text,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setAdminChatMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    // Chain sequentially to guarantee no concurrent writes drop each other's messages
    adminSendQueueRef.current = adminSendQueueRef.current.then(async () => {
      setIsAdminSending(true);
      try {
        // Fetch latest messages from DB to append cleanly without overwrite (using maybeSingle to prevent 406 errors)
        const { data: latest, error: fetchErr } = await supabase
          .from('product_conversations')
          .select('messages')
          .eq('id', targetId)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        const currentMessages = Array.isArray(latest?.messages) 
          ? latest.messages 
          : (Array.isArray(selectedConvoRef.current?.messages) ? selectedConvoRef.current.messages : []);

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
        const updatedMessages: any[] = [];
        for (const m of [...currentMessages, newMsg]) {
          if (m && m.id && !seenIds.has(m.id)) {
            seenIds.add(m.id);
            updatedMessages.push(m);
          }
        }

        const { error: updateErr } = await supabase
          .from('product_conversations')
          .update({
            messages: updatedMessages,
            last_message: text,
            last_message_at: newMsg.created_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId);

        if (updateErr) throw updateErr;

        fetchConversations();
      } catch (err: any) {
        console.error("Failed to send admin message:", err);
        toast.error("Failed to deliver message via Supabase");
      } finally {
        setIsAdminSending(false);
      }
    });
  };

  const handleGrantPurchaseAccess = async (convo: any) => {
    if (!convo) return;
    try {
      const systemMsg = {
        id: `msg-grant-${Date.now()}`,
        conversation_id: convo.id,
        sender_id: adminUser?.id || "admin",
        sender_role: "admin",
        sender_name: "Lead Systems Engineer",
        message: `🎉 [PURCHASE ACCESS GRANTED] Build calibration & repository assets for "${convo.project_title}" are approved! You can now click "[BUY NOW] & PROCEED TO PAYMENT" on the project page or in this chat to complete your purchase and unlock your deliverables.`,
        created_at: new Date().toISOString()
      };

      const currentMessages = Array.isArray(convo.messages) ? convo.messages : [];
      const updatedMessages = [...currentMessages, systemMsg];

      const { error } = await supabase
        .from('product_conversations')
        .update({
          status: 'ready_to_purchase',
          messages: updatedMessages,
          last_message: '🎉 Purchase access granted by engineer',
          last_message_at: systemMsg.created_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', convo.id);

      if (error) throw error;

      toast.success(`Purchase access granted to ${convo.user_name || convo.user_email}!`);
      fetchConversations();
      if (selectedConvo?.id === convo.id) {
        setSelectedConvo((prev: any) => ({
          ...prev,
          status: 'ready_to_purchase',
          messages: updatedMessages
        }));
        setAdminChatMessages(updatedMessages);
      }
    } catch (err: any) {
      console.error("Failed to grant purchase access:", err);
      toast.error("Failed to update access in Supabase");
    }
  };

  const handleRevokePurchaseAccess = async (convo: any) => {
    if (!convo) return;
    try {
      const { error } = await supabase
        .from('product_conversations')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', convo.id);

      if (error) throw error;

      toast.success("Purchase access revoked (reverted to active inquiry)");
      fetchConversations();
      if (selectedConvo?.id === convo.id) {
        setSelectedConvo((prev: any) => ({ ...prev, status: 'active' }));
      }
    } catch (err: any) {
      toast.error("Failed to revoke access");
    }
  };

  const handleGrantLotteryAccess = async (convo: any) => {
    if (!convo) return;
    try {
      const randomTicketId = `№ 00${Math.floor(1000 + Math.random() * 9000)} · SERIES 1984`;
      const ticketMsg = {
        id: `msg-${Date.now()}`,
        sender_id: adminUser?.id || "admin",
        sender_role: "admin",
        sender_name: "Lead Systems Engineer",
        message: `🎟️ [STUDENT LUCKY RAFFLE UNLOCKED] An exclusive vintage student raffle ticket (${randomTicketId}) has been granted for "${convo.project_title}"! Scratch your authentic golden ticket below to reveal your lucky discount.`,
        type: "lottery_ticket",
        ticket_id: randomTicketId,
        created_at: new Date().toISOString()
      };

      const currentMessages = Array.isArray(convo.messages) ? convo.messages : [];
      const updatedMessages = [...currentMessages, ticketMsg];

      let updatePayload: any = {
        lottery_unlocked: true,
        messages: updatedMessages,
        last_message: `🎟️ Student raffle ticket granted (${randomTicketId})`,
        last_message_at: ticketMsg.created_at,
        updated_at: new Date().toISOString()
      };

      let { error } = await supabase
        .from('product_conversations')
        .update(updatePayload)
        .eq('id', convo.id);

      // Fallback if lottery_unlocked column doesn't exist yet on table
      if (error && error.message?.includes("lottery_unlocked")) {
        delete updatePayload.lottery_unlocked;
        const res = await supabase
          .from('product_conversations')
          .update(updatePayload)
          .eq('id', convo.id);
        error = res.error;
      }

      if (error) throw error;

      toast.success(`🎟️ Student scratch ticket granted to ${convo.user_name || convo.user_email}!`);
      fetchConversations();
      if (selectedConvo?.id === convo.id) {
        setSelectedConvo((prev: any) => ({
          ...prev,
          lottery_unlocked: true,
          messages: updatedMessages
        }));
        setAdminChatMessages(updatedMessages);
      }
    } catch (err: any) {
      console.error("Failed to grant lottery access:", err);
      toast.error("Failed to grant lottery ticket in Supabase");
    }
  };

  const handleRevokeLotteryAccess = async (convo: any) => {
    if (!convo) return;
    try {
      let { error } = await supabase
        .from('product_conversations')
        .update({
          lottery_unlocked: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', convo.id);

      if (error && error.message?.includes("lottery_unlocked")) {
        error = null;
      }

      if (error) throw error;

      toast.info("Lottery ticket access revoked for this inquiry");
      fetchConversations();
      if (selectedConvo?.id === convo.id) {
        setSelectedConvo((prev: any) => ({ ...prev, lottery_unlocked: false }));
      }
    } catch (err: any) {
      toast.error("Failed to revoke lottery ticket");
    }
  };

  const updateConvoStatus = async (convoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('product_conversations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', convoId);
      if (error) throw error;
      toast.success(`Inquiry marked as ${newStatus}`);
      setConversations((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, status: newStatus } : c))
      );
      if (selectedConvo?.id === convoId) {
        setSelectedConvo((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      toast.error("Could not update conversation status");
    }
  };

  const handleDeleteForAdmin = async (convoId: string) => {
    try {
      const now = new Date().toISOString();
      // Soft delete from admin view and record cleared timestamp so old messages stay hidden
      const { error } = await supabase
        .from('product_conversations')
        .update({ 
          admin_deleted: true, 
          admin_cleared_at: now,
          updated_at: now 
        })
        .eq('id', convoId);

      if (error) {
        await supabase
          .from('product_conversations')
          .update({ status: 'archived', updated_at: now })
          .eq('id', convoId);
      }

      // Persist locally so even before DB column exists, old messages stay hidden to admin
      try {
        const clearedMap = JSON.parse(localStorage.getItem('admin_cleared_chats') || '{}');
        clearedMap[convoId] = now;
        localStorage.setItem('admin_cleared_chats', JSON.stringify(clearedMap));
      } catch {}

      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (selectedConvo?.id === convoId) {
        setSelectedConvo(null);
      }
      toast.success("Inquiry cleared from Admin view. Any new messages from user will appear fresh.");
    } catch (err: any) {
      toast.error("Failed to remove inquiry");
    }
  };

  const handleCancelAndPurgeRequest = (convoId: string) => {
    const convoObj = conversations.find(c => c.id === convoId) || selectedConvo;
    askConfirmation(
      "CANCEL_BUILD_REQUEST",
      "Are you sure you want to cancel this build request and PERMANENTLY delete the conversation and chat history from the database? This cannot be undone.",
      async () => {
        // 1. Wipe chat messages and update status in database
        await supabase
          .from('product_conversations')
          .update({
            status: 'cancelled',
            admin_deleted: true,
            messages: [],
            last_message: "Build request cancelled by administrator",
            updated_at: new Date().toISOString()
          })
          .eq('id', convoId);

        // 2. Also hard delete from table (both by id and by user_id/project_id to catch all duplicates)
        if (convoObj?.user_id && convoObj?.project_id) {
          await supabase
            .from('product_conversations')
            .delete()
            .eq('user_id', convoObj.user_id)
            .eq('project_id', convoObj.project_id);
        } else {
          await supabase
            .from('product_conversations')
            .delete()
            .eq('id', convoId);
        }

        setConversations((prev) => prev.filter((c) => {
          if (convoObj?.user_id && convoObj?.project_id) {
            return !(c.user_id === convoObj.user_id && c.project_id === convoObj.project_id);
          }
          return c.id !== convoId;
        }));

        if (selectedConvo?.id === convoId || (convoObj && selectedConvo?.user_id === convoObj.user_id && selectedConvo?.project_id === convoObj.project_id)) {
          setSelectedConvo(null);
          setAdminChatMessages([]);
        }
        toast.success("Build request cancelled & chat deleted from database.");
      },
      "YES, DELETE & PURGE"
    );
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesFilter = chatStatusFilter === "all" || c.status === chatStatusFilter;
    const matchesSearch =
      !chatSearch.trim() ||
      (c.user_name && c.user_name.toLowerCase().includes(chatSearch.toLowerCase())) ||
      (c.user_email && c.user_email.toLowerCase().includes(chatSearch.toLowerCase())) ||
      (c.project_title && c.project_title.toLowerCase().includes(chatSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

    const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
    isLoading?: boolean;
    variant?: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const askConfirmation = (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    confirmText = "CONFIRM_DELETE",
    variant: "danger" | "warning" = "danger"
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      confirmText,
      variant,
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          await onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch {
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSubTab, setProjectSubTab] = useState<"list" | "add">("list");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "AI & Machine Learning",
    price: "",
    difficulty: "Beginner",
    delivery_type: "digital",
    tech: "",
    features: "",
    includes: "",
    github_url: "",
    price_note: "",
    image: null as File | null,
    video: null as File | null,
    screenshots: null as FileList | null,
  });

  const fetchDbProjects = async () => {
    setIsLoadingProjects(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setDbProjects(data);
    }
    setIsLoadingProjects(false);
  };

  const openEditModal = (p: any) => {
    setEditingProject(p);
    setEditForm({
      title: p.title || "",
      description: p.description || "",
      category: p.category || "AI & Machine Learning",
      price: String(p.price || ""),
      difficulty: p.difficulty || "Beginner",
      delivery_type: p.delivery_type || "digital",
      tech: Array.isArray(p.tech) ? p.tech.join(', ') : (p.tech || ""),
      features: Array.isArray(p.features) ? p.features.join('\n') : (p.features || ""),
      includes: Array.isArray(p.includes) ? p.includes.join('\n') : (p.includes || ""),
      github_url: p.github_url || "",
      price_note: p.price_note || "",
      image: null,
      video: null,
      screenshots: null,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsUpdating(true);
    const toastId = toast.loading("Saving changes...");

    try {
      let thumbUrl = editingProject.thumb;
      if (editForm.image) {
        const fileExt = editForm.image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: imgError } = await supabase.storage
          .from('project-images')
          .upload(fileName, editForm.image);
        if (imgError) throw new Error("Image upload failed: " + imgError.message);
        const { data: publicUrlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);
        thumbUrl = publicUrlData.publicUrl;
      }

      let screenshotUrls: string[] = Array.isArray(editingProject.screenshots) ? editingProject.screenshots : [];
      if (editForm.screenshots && editForm.screenshots.length > 0) {
        let newUrls: string[] = [];
        for (let i = 0; i < editForm.screenshots.length; i++) {
          const file = editForm.screenshots[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { error: ssError } = await supabase.storage.from('project-images').upload(fileName, file);
          if (ssError) throw new Error("Screenshot upload failed: " + ssError.message);
          const { data: ssUrlData } = supabase.storage.from('project-images').getPublicUrl(fileName);
          newUrls.push(ssUrlData.publicUrl);
        }
        screenshotUrls = [...screenshotUrls, ...newUrls];
      }

      let videoUrl = editingProject.video_url;
      if (editForm.video) {
        const fileExt = editForm.video.name.split('.').pop();
        const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: vidError } = await supabase.storage
          .from('project-images')
          .upload(fileName, editForm.video);
        if (vidError) throw new Error("Video upload failed: " + vidError.message);
        const { data: vidUrlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);
        videoUrl = vidUrlData.publicUrl;
      }

      const { error: updateError } = await supabase.from('projects').update({
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        difficulty: editForm.difficulty,
        price: Number(editForm.price),
        delivery_type: editForm.delivery_type,
        tech: editForm.tech.split(',').map(t => t.trim()).filter(Boolean),
        features: editForm.features.split('\n').map(t => t.trim()).filter(Boolean),
        includes: editForm.includes.split('\n').map(t => t.trim()).filter(Boolean),
        github_url: editForm.github_url.trim() || null,
        price_note: editForm.price_note.trim() || null,
        thumb: thumbUrl,
        screenshots: screenshotUrls,
        video_url: videoUrl,
      }).eq('id', editingProject.id);

      if (updateError) throw new Error("Update error: " + updateError.message);

      toast.success("Project updated successfully!", { id: toastId });
      setIsEditDialogOpen(false);
      setEditingProject(null);
      fetchDbProjects();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    askConfirmation(
      "DELETE_PROJECT_BLUEPRINT",
      `Are you sure you want to delete "${projectTitle}" from the marketplace repository? This cannot be undone.`,
      async () => {
        const toastId = toast.loading("Deleting project...");
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) {
          toast.error("Failed to delete project: " + error.message, { id: toastId });
          return;
        }
        toast.success("Project deleted from marketplace", { id: toastId });
        setDbProjects(prev => prev.filter(p => p.id !== projectId));
      },
      "DELETE_PROJECT"
    );
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, trackingId?: string) => {
    const payload: any = { status: newStatus };
    if (trackingId) payload.tracking_id = trackingId;

    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) {
      toast.error("Failed to update order status");
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
    toast.success(`Order marked as ${newStatus}`);
  };

  const openDeliverablesModal = (order: any) => {
    setSelectedOrderForDeliverables(order);
    const existing = order.deliverables || {};
    setDeliverablesForm({
      github_url: existing.github_url || order.github_url || "",
      drive_url: existing.drive_url || "",
      video_url: existing.video_url || "",
      pdf_url: existing.pdf_url || "",
      admin_notes: existing.admin_notes || ""
    });
    setIsDeliverablesDialogOpen(true);
  };

  const handleSaveDeliverables = async () => {
    if (!selectedOrderForDeliverables) return;
    setIsSavingDeliverables(true);
    const orderId = selectedOrderForDeliverables.id;

    try {
      const payload: any = {
        deliverables: deliverablesForm,
      };
      if (deliverablesForm.github_url) {
        payload.github_url = deliverablesForm.github_url;
      }

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
      toast.success("Order deliverables saved & available to buyer!");
      setIsDeliverablesDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to update deliverables:", err);
      toast.error(err.message || "Failed to save deliverables");
    } finally {
      setIsSavingDeliverables(false);
    }
  };

  const updateLeadStatus = async (lead: any, newStatus: string) => {
    // Only update in Supabase for real leads (UUID id format)
    if (lead.rawId) {
      const { error } = await supabase.from('custom_requests').update({ status: newStatus }).eq('id', lead.rawId);
      if (error) { toast.error("Failed to update status"); return; }
    }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
    toast.success(`Status updated to "${newStatus}"`);
  };

  const deleteLead = (lead: any) => {
    askConfirmation(
      "DELETE_CUSTOM_LEAD",
      `Are you sure you want to delete lead from ${lead.name}? This will remove the custom build inquiry.`,
      async () => {
        if (lead.rawId) {
          const { error } = await supabase.from('custom_requests').delete().eq('id', lead.rawId);
          if (error) { toast.error("Failed to delete lead"); return; }
        }
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        toast.success("Lead deleted");
      }
    );
  };

  const deleteMessage = (id: string) => {
    askConfirmation(
      "DELETE_CONTACT_MESSAGE",
      "Are you sure you want to delete this message? This cannot be undone.",
      async () => {
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (error) { toast.error("Failed to delete message"); return; }
        setMessages(prev => prev.filter(m => m.id !== id));
        toast.success("Message deleted");
      }
    );
  };

  const handleNotificationClickLead = async (lead: any) => {
    setActiveTab("leads");
    if (lead.status === "New") {
      await updateLeadStatus(lead, "Reviewing");
    }
  };

  const handleNotificationClickMessage = (msgId: string) => {
    setActiveTab("messages");
    setReadMessages(prev => [...prev, msgId]);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    category: "AI & Machine Learning",
    price: "",
    difficulty: "Beginner",
    delivery_type: "digital", // 'digital' or 'physical'
    tech: "",
    features: "",
    includes: "",
    github_url: "",
    price_note: "",
    image: null as File | null,
    video: null as File | null,
    screenshots: null as FileList | null
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.image) return toast.error("Please select a cover image.");

    setIsUploading(true);
    const toastId = toast.loading("Publishing project...");

    try {
      const fileExt = newProject.image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: imgError } = await supabase.storage
        .from('project-images')
        .upload(fileName, newProject.image);

      if (imgError) throw new Error("Image upload failed: " + imgError.message);

      const { data: publicUrlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      let screenshotUrls: string[] = [];
      if (newProject.screenshots && newProject.screenshots.length > 0) {
        for (let i = 0; i < newProject.screenshots.length; i++) {
          const file = newProject.screenshots[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          const { error: ssError } = await supabase.storage.from('project-images').upload(fileName, file);
          if (ssError) throw new Error("Screenshot upload failed: " + ssError.message);

          const { data: ssUrlData } = supabase.storage.from('project-images').getPublicUrl(fileName);
          screenshotUrls.push(ssUrlData.publicUrl);
        }
      }

      let videoUrl = null;
      if (newProject.video) {
        const fileExt = newProject.video.name.split('.').pop();
        const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: vidError } = await supabase.storage.from('project-images').upload(fileName, newProject.video);
        if (vidError) throw new Error("Video upload failed: " + vidError.message);

        const { data: vidUrlData } = supabase.storage.from('project-images').getPublicUrl(fileName);
        videoUrl = vidUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from('projects').insert({
        title: newProject.title,
        short: "Production-ready project with full source code.",
        description: newProject.description,
        category: newProject.category,
        difficulty: newProject.difficulty,
        price: Number(newProject.price),
        delivery_type: newProject.delivery_type,
        tech: newProject.tech.split(',').map(t => t.trim()).filter(Boolean),
        features: newProject.features.split('\n').map(t => t.trim()).filter(Boolean),
        includes: newProject.includes.split('\n').map(t => t.trim()).filter(Boolean),
        github_url: newProject.github_url.trim() || null,
        price_note: newProject.price_note.trim() || null,
        screenshots: screenshotUrls,
        video_url: videoUrl,
        thumb: publicUrlData.publicUrl
      });

      if (dbError) throw new Error("Database error: " + dbError.message);

      toast.success("Project published successfully!", { id: toastId });
      setNewProject({ title: "", description: "", category: "AI & Machine Learning", price: "", difficulty: "Beginner", delivery_type: "digital", tech: "", features: "", includes: "", github_url: "", price_note: "", image: null, video: null, screenshots: null });
      fetchDbProjects();
      setProjectSubTab("list");
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = leads.filter(l =>
    (status === "all" || l.status === status) &&
    (q === "" || (l.name + l.project + l.id).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Layout>
      <section className="container-px py-6 sm:py-8 min-h-screen">
        <div className="max-w-7xl mx-auto rounded-2xl bg-[#090d18] border border-slate-800/90 shadow-[0_12px_48px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col md:flex-row relative">

          {/* Desktop Workstation Sidebar */}
          <aside className="w-64 shrink-0 bg-[#070b14] border-r border-slate-800/80 p-4 hidden md:flex md:flex-col justify-between select-none">
            <div className="space-y-6">
              {/* Workstation Badge */}
              <div className="px-2 py-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                    SYS:\ADMIN_CORE
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">ProjectDukaan Console v2.6</div>
              </div>

              {/* Navigation Groups */}
              <div className="space-y-1">
                <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Core Workflow
                </div>
                {[
                  { id: "leads", label: "Custom Leads", icon: FileSpreadsheet, count: leads.length },
                  { id: "projects", label: "Catalog Projects", icon: Layers, count: dbProjects.length },
                  { id: "orders", label: "Client Orders", icon: ShoppingBag, count: orders.length },
                ].map(item => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.1)] font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? "bg-amber-400/20 text-amber-300" : "bg-slate-800 text-slate-400"
                      }`}>
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 pt-2">
                <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Communications
                </div>
                {[
                  { 
                    id: "chats", 
                    label: "Live Inquiries", 
                    icon: MessageSquare, 
                    count: conversations.length,
                    hasActive: conversations.some(c => c.status === 'active')
                  },
                  { id: "messages", label: "Contact Form", icon: Mail, count: messages.length },
                ].map(item => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.1)] font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                        {item.hasActive && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.hasActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isActive ? "bg-amber-400/20 text-amber-300" : "bg-slate-800 text-slate-400"
                        }`}>
                          {item.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 pt-2">
                <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Promotions
                </div>
                {[
                  { 
                    id: "lottery", 
                    label: "Scratch Lottery", 
                    icon: Ticket, 
                    count: lotteryConfig.enabled ? "ON" : "OFF",
                    isOnline: lotteryConfig.enabled 
                  },
                ].map(item => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.1)] font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        item.isOnline ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"
                      }`}>
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Station Links
                </div>
                <a
                  href="/marketplace"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800/40 transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Marketplace
                  </span>
                  <span className="text-[10px] text-slate-500">STORE ↗</span>
                </a>
                <a
                  href="/custom-request"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800/40 transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Custom Studio
                  </span>
                  <span className="text-[10px] text-slate-500">BUILD ↗</span>
                </a>
              </div>
            </div>

            {/* Sidebar Telemetry Footer */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="bg-[#090e1c] rounded-lg p-2.5 border border-slate-800 font-mono text-[10px] space-y-1 text-slate-400">
                <div className="flex justify-between items-center text-slate-300">
                  <span>TELEMETRY</span>
                  <span className="text-emerald-400 font-semibold">115200 BAUD</span>
                </div>
                <div className="text-slate-500">SHA-256 HMAC VERIFIED</div>
                <div className="text-slate-500">PG_POOL: CONNECTED</div>
              </div>
            </div>
          </aside>

          {/* Mobile Drawer (Flyout when open) */}
          {isMobileNavOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileNavOpen(false)} 
              />
              <div className="relative w-72 max-w-[85vw] bg-[#070b14] border-r border-slate-800 p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-400 uppercase">SYS:\ADMIN_CORE</span>
                      <div className="text-[11px] text-slate-400 font-mono">Workstation v2.6</div>
                    </div>
                    <button 
                      onClick={() => setIsMobileNavOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {[
                      { id: "leads", label: "Custom Leads", icon: FileSpreadsheet, count: leads.length },
                      { id: "projects", label: "Catalog Projects", icon: Layers, count: dbProjects.length },
                      { id: "orders", label: "Client Orders", icon: ShoppingBag, count: orders.length },
                      { id: "chats", label: "Live Inquiries", icon: MessageSquare, count: conversations.length },
                      { id: "messages", label: "Contact Form", icon: Mail, count: messages.length },
                      { id: "lottery", label: "Scratch Lottery", icon: Ticket, count: lotteryConfig.enabled ? "ON" : "OFF" },
                    ].map(item => {
                      const isActive = activeTab === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileNavOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-xs font-mono ${
                            isActive
                              ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 font-semibold"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            isActive ? "bg-amber-400/20 text-amber-300" : "bg-slate-800 text-slate-400"
                          }`}>
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500 mb-2">SYS_DAEMON: ONLINE • 115200 BAUD</div>
                  <Button 
                    onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
                    variant="ghost" 
                    className="w-full justify-start text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-9"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out Console
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Workstation Command Console Area */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#070a12]/70">
            {/* Global Workstation Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-[#090d18]/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Open Navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-amber-400 tracking-wider uppercase font-semibold">
                    <span>SYS_CONSOLE</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-300">{activeTab.toUpperCase()}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans mt-0.5">
                    {activeTab === "leads" && "Custom Project Leads"}
                    {activeTab === "projects" && "Marketplace Catalog Manager"}
                    {activeTab === "orders" && "Client Order Registry & Delivery"}
                    {activeTab === "chats" && "Live Inquiries Command Center"}
                    {activeTab === "messages" && "Contact Inquiries Feed"}
                  </h1>
                </div>
              </div>

              {/* Universal Search & Actions */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 sm:w-64 md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search console records..."
                    className="w-full bg-[#070b14] border-slate-700/80 text-slate-200 placeholder:text-slate-500 pl-9 pr-12 text-xs font-mono h-9 rounded-lg focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400"
                  />
                  <span className="hidden sm:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    ⌘K
                  </span>
                </div>

                {/* Notifications Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 rounded-lg bg-[#070b14] border border-slate-700/80 grid place-items-center text-slate-300 relative hover:border-amber-400/60 hover:text-amber-400 transition-all cursor-pointer">
                      <Bell className="w-4 h-4" />
                      {(leads.filter(l => l.status === "New" && l.rawId).length + 
                        messages.filter(m => !readMessages.includes(m.id)).length +
                        orders.filter(o => o.status === "Processing").length) > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-[#0c101d] border-slate-800 text-slate-100 p-2 shadow-2xl rounded-xl z-50">
                    <div className="px-3 py-1.5 text-xs text-slate-400 uppercase tracking-wider font-mono font-semibold">
                      System Notifications
                    </div>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    
                    {orders.filter(o => o.status === "Processing").map(o => (
                      <DropdownMenuItem key={o.id} onClick={() => { setActiveTab("orders"); }}
                        className="text-xs p-3 hover:bg-slate-800/80 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-emerald-400 font-mono">New Order Purchase (₹{o.amount})</span>
                        <span className="text-slate-300">{o.customer_name} bought "{o.project_title}"</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(o.created_at).toLocaleDateString()}</span>
                      </DropdownMenuItem>
                    ))}

                    {leads.filter(l => l.status === "New" && l.rawId).map(l => (
                      <DropdownMenuItem key={l.id} onClick={() => handleNotificationClickLead(l)}
                        className="text-xs p-3 hover:bg-slate-800/80 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-amber-300 font-mono">New Custom Project Lead</span>
                        <span className="text-slate-300">{l.name}: "{l.project}"</span>
                        <span className="text-[10px] font-mono text-slate-500">{l.date}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    {messages.filter(m => !readMessages.includes(m.id)).map(m => (
                      <DropdownMenuItem key={m.id} onClick={() => handleNotificationClickMessage(m.id)}
                        className="text-xs p-3 hover:bg-slate-800/80 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-cyan-400 font-mono">New Support Message</span>
                        <span className="text-slate-300 truncate max-w-xs">{m.name}: "{m.message}"</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(m.created_at).toLocaleDateString()}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    {(leads.filter(l => l.status === "New" && l.rawId).length + 
                      messages.filter(m => !readMessages.includes(m.id)).length +
                      orders.filter(o => o.status === "Processing").length) === 0 && (
                      <div className="py-6 text-center text-xs font-mono text-slate-500">No new notifications</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* AD Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 bg-[#070b14] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs hover:border-amber-400/60 transition-all font-mono cursor-pointer">
                      <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 grid place-items-center text-[10px] font-bold">
                        AD
                      </div>
                      <span className="hidden sm:inline">Admin</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#0c101d] border-slate-800 text-slate-200 p-1.5 shadow-2xl rounded-xl z-50 font-mono text-xs">
                    <div className="px-2.5 py-1.5 text-[11px] text-slate-400 truncate">
                      {adminUser?.email || "workspace7204@gmail.com"}
                    </div>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 hover:text-white rounded-md p-2">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" /> Public Workstation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/marketplace")} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 hover:text-white rounded-md p-2">
                      <Layers className="w-3.5 h-3.5 text-amber-400" /> Store Catalog
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="flex items-center gap-2 cursor-pointer text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md p-2">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out Console
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Dashboard Telemetry KPI Metrics Strip */}
            <div className="p-4 sm:p-6 pb-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { 
                    icon: TrendingUp, 
                    label: "Total Leads", 
                    value: String(leads.length), 
                    delta: "+12% mo", 
                    accent: "amber",
                    color: "text-amber-400",
                    border: "border-amber-500/20",
                    sparkline: [25, 40, 35, 60, 50, 75, 90]
                  },
                  { 
                    icon: Users, 
                    label: "Live Projects", 
                    value: String(dbProjects.length), 
                    delta: "Catalog Verified", 
                    accent: "cyan",
                    color: "text-cyan-400",
                    border: "border-cyan-500/20",
                    sparkline: [30, 45, 45, 55, 65, 70, 85]
                  },
                  { 
                    icon: IndianRupee, 
                    label: "Orders Placed", 
                    value: String(orders.length), 
                    delta: "Lifetime Volume", 
                    accent: "emerald",
                    color: "text-emerald-400",
                    border: "border-emerald-500/20",
                    sparkline: [10, 20, 15, 30, 40, 50, 65]
                  },
                  { 
                    icon: MessageSquare, 
                    label: "Live Inquiries", 
                    value: String(conversations.length), 
                    delta: "Socket Realtime", 
                    accent: "purple",
                    color: "text-purple-400",
                    border: "border-purple-500/20",
                    sparkline: [15, 25, 35, 40, 55, 60, 80]
                  },
                ].map(s => (
                  <div 
                    key={s.label} 
                    className="bg-[#090e1c] border border-slate-800/90 rounded-xl p-3.5 sm:p-4 hover:border-slate-700 transition-all relative overflow-hidden group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${s.color}`}>
                          <s.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{s.label}</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {s.delta}
                      </span>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                        {s.value}
                      </div>

                      {/* Micro Sparkline Indicator */}
                      <div className="flex items-end gap-1 h-6 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                        {s.sparkline.map((h, i) => (
                          <div 
                            key={i} 
                            style={{ height: `${h}%` }}
                            className={`w-1 rounded-xs ${
                              s.accent === 'amber' ? 'bg-amber-400' :
                              s.accent === 'cyan' ? 'bg-cyan-400' :
                              s.accent === 'emerald' ? 'bg-emerald-400' : 'bg-purple-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Panes Container */}
            <div className="p-4 sm:p-6 flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="leads" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-[#090e1c] border border-slate-800/90 rounded-xl p-4 sm:p-6 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-base sm:text-lg font-mono">Custom Engineering Leads</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {filtered.length} RECORDS
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">Review incoming client requests, budget scopes, and specifications</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                        <div className="flex items-center gap-2 rounded-lg px-3 bg-[#070b14] border border-slate-700/80 w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter leads…"
                            className="border-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 h-9 text-xs font-mono" />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="w-full sm:w-36 rounded-lg bg-[#070b14] border-slate-700/80 text-slate-200 text-xs font-mono h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c101d] border-slate-800 text-slate-200 shadow-2xl font-mono text-xs">
                            <SelectItem value="all">All Statuses</SelectItem>
                            {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                      <table className="w-full text-sm min-w-[800px]">
                        <thead>
                          <tr className="text-slate-400 text-[11px] font-mono uppercase tracking-wider border-b border-slate-800 bg-[#070a12]/80">
                            {["ID", "Name", "Project", "Category", "Budget", "Status", "Submitted", "Actions"].map(h => (
                              <th key={h} className="text-left py-3 px-3 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                          {filtered.map(l => (
                            <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-3 text-amber-400 font-semibold">{l.id}</td>
                              <td className="py-3 px-3 text-white font-sans font-medium">{l.name}</td>
                              <td className="py-3 px-3 text-slate-300 font-sans max-w-[200px] truncate" title={l.project}>{l.project}</td>
                              <td className="py-3 px-3 text-slate-400 text-[11px]">{l.category}</td>
                              <td className="py-3 px-3 text-emerald-400 font-bold">{l.budget}</td>
                              <td className="py-3 px-3">
                                <Badge className={`${statusColor[l.status] || "bg-slate-800 text-slate-300 border-slate-700"} rounded-full text-[10px] py-0.5 px-2`}>
                                  {l.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-slate-400 text-[11px]">{l.date}</td>
                              <td className="py-3 px-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52 bg-[#0c101d] border-slate-800 text-slate-200 shadow-2xl rounded-xl p-1.5 z-50 font-mono text-xs">
                                    {l.document_url && (
                                      <>
                                        <DropdownMenuItem asChild>
                                          <a href={l.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 cursor-pointer hover:bg-slate-800/80 p-2 rounded-md">
                                            <Download className="w-4 h-4" /> Download Scope Doc
                                          </a>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-800" />
                                      </>
                                    )}
                                    {l.email && (
                                      <DropdownMenuItem asChild>
                                        <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-800/80 cursor-pointer p-2 rounded-md">
                                          <Mail className="w-4 h-4 text-cyan-400" /> Email Client
                                        </a>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    <div className="px-2 py-1 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Change Status</div>
                                    {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => (
                                      <DropdownMenuItem key={s} onClick={() => updateLeadStatus(l, s)}
                                        className={`flex items-center gap-2 cursor-pointer hover:bg-slate-800/80 p-1.5 rounded-md ${
                                          l.status === s ? "text-amber-400 font-semibold" : "text-slate-300"
                                        }`}>
                                        {l.status === s && <CheckCircle className="w-3 h-3 text-amber-400" />}
                                        {l.status !== s && <span className="w-3" />}
                                        {s}
                                      </DropdownMenuItem>
                                    ))}
                                    {l.rawId && (
                                      <>
                                        <DropdownMenuSeparator className="bg-slate-800" />
                                        <DropdownMenuItem onClick={() => deleteLead(l)}
                                          className="flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer p-2 rounded-md">
                                          <Trash2 className="w-4 h-4" /> Delete Lead
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filtered.length === 0 && (
                        <div className="text-center py-12 text-slate-500 font-mono text-xs">
                          NO MATCHING ENGINEERING LEADS RECORDED
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

              <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-6">
                  {/* Sub navigation between Added Projects and Upload New */}
                  <div className="flex items-center justify-between flex-wrap gap-4 bg-[#090e1c] border border-slate-800/90 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProjectSubTab("list")}
                        className={`rounded-lg px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          projectSubTab === "list"
                            ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Catalog Inventory ({dbProjects.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectSubTab("add")}
                        className={`rounded-lg px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          projectSubTab === "add"
                            ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Deploy New Project
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={fetchDbProjects}
                      disabled={isLoadingProjects}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-3 text-xs font-mono rounded-lg border border-slate-800"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingProjects ? "animate-spin" : ""}`} />
                      Sync Database
                    </Button>
                  </div>

                  {projectSubTab === "list" ? (
                    <div className="bg-[#090e1c] border border-slate-800/90 rounded-xl p-5 md:p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg font-mono">Published Project Blueprints</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              LIVE IN STORE
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1">Manage project metadata, source packages, video walk-throughs, and prices</p>
                        </div>
                        <Button
                          onClick={() => setProjectSubTab("add")}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 h-9 px-4 rounded-lg text-xs font-mono font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)] border-0 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Project
                        </Button>
                      </div>

                      {isLoadingProjects ? (
                        <div className="py-16 text-center text-slate-400 font-mono text-xs">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                          QUERYING MARKETPLACE PROJECTS...
                        </div>
                      ) : dbProjects.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl p-8 bg-[#070b14]">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 grid place-items-center mx-auto mb-3 text-slate-500">
                            <Layers className="w-6 h-6" />
                          </div>
                          <h4 className="text-white font-semibold mb-1 font-mono text-sm">No Projects Uploaded Yet</h4>
                          <p className="text-slate-400 text-xs max-w-sm mx-auto mb-5">
                            You haven't deployed any blueprints to Supabase yet. Use the Deploy Project form to publish one.
                          </p>
                          <Button
                            onClick={() => setProjectSubTab("add")}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg px-5 h-9 text-xs font-mono font-bold"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Deploy First Blueprint
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {dbProjects.map((p) => (
                            <div
                              key={p.id}
                              className="bg-[#070b14] border border-slate-800 hover:border-amber-500/40 rounded-xl overflow-hidden flex flex-col justify-between transition-all group shadow-md"
                            >
                              {/* Small Version Card Preview */}
                              <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                                {p.thumb ? (
                                  <img
                                    src={p.thumb}
                                    alt={p.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full grid place-items-center text-slate-600">
                                    <ImageIcon className="w-8 h-8" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                                <Badge className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] font-mono border border-amber-500/30">
                                  {p.category}
                                </Badge>
                                <Badge className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-mono border border-slate-700">
                                  {p.difficulty || "Beginner"}
                                </Badge>
                                <div className="absolute bottom-2 left-2.5 text-xs font-bold font-mono text-emerald-400">
                                  ₹{Number(p.price).toLocaleString()}
                                </div>
                                <div className="absolute bottom-2 right-2.5">
                                  <Badge className="bg-slate-900/80 backdrop-blur-md text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                                    {p.delivery_type === "physical" ? "Physical Kit" : "Digital"}
                                  </Badge>
                                </div>
                              </div>

                              {/* Card Content */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <h4 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-amber-400 transition-colors" title={p.title}>
                                    {p.title}
                                  </h4>
                                  <p className="text-slate-400 text-xs line-clamp-2 mt-1.5 leading-relaxed font-sans">
                                    {p.description}
                                  </p>

                                  {/* Tech tags */}
                                  {Array.isArray(p.tech) && p.tech.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap mt-3">
                                      {p.tech.slice(0, 3).map((t: string) => (
                                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                          {t}
                                        </span>
                                      ))}
                                      {p.tech.length > 3 && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                                          +{p.tech.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons: Make Changes / Rewrite / View / Delete */}
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => openEditModal(p)}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 h-8 rounded-lg text-xs font-mono font-medium transition-all shadow-none cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3 mr-1.5 text-amber-400" />
                                    Edit
                                  </Button>

                                  <a
                                    href={`/project/${p.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 grid place-items-center transition-colors shrink-0"
                                    title="View on Website"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProject(p.id, p.title)}
                                    className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 grid place-items-center transition-colors shrink-0 cursor-pointer"
                                    title="Delete Project"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ADD NEW PROJECT FORM */
                    <div className="bg-[#090e1c] border border-slate-800/90 rounded-xl p-6 md:p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                        <div>
                          <h3 className="text-white text-lg font-bold font-mono">Deploy New Blueprint to Marketplace</h3>
                          <p className="text-slate-400 text-xs mt-1">Publish verified source code, architecture documentation, and pricing</p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => setProjectSubTab("list")}
                          className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono h-8 rounded-lg border border-slate-800"
                        >
                          ← Inventory View
                        </Button>
                      </div>

                      <form onSubmit={handleAddProject} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Project Title</Label>
                            <Input required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 h-10 font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400" placeholder="e.g. Autonomous LoRa Sensor Hub" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Category</Label>
                            <Select value={newProject.category} onValueChange={v => setNewProject({ ...newProject, category: v })}>
                              <SelectTrigger className="bg-[#070b14] border-slate-700/80 text-slate-200 h-10 font-mono text-xs focus:ring-1 focus:ring-amber-400"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#0c101d] border-slate-800 text-slate-200 font-mono text-xs">
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Price (₹)</Label>
                            <Input required type="number" value={newProject.price} onChange={e => setNewProject({ ...newProject, price: e.target.value })} className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 h-10 font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400" placeholder="4900" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Difficulty</Label>
                            <Select value={newProject.difficulty} onValueChange={v => setNewProject({ ...newProject, difficulty: v })}>
                              <SelectTrigger className="bg-[#070b14] border-slate-700/80 text-slate-200 h-10 font-mono text-xs focus:ring-1 focus:ring-amber-400"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#0c101d] border-slate-800 text-slate-200 font-mono text-xs">
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Delivery Type</Label>
                            <Select value={newProject.delivery_type} onValueChange={v => setNewProject({ ...newProject, delivery_type: v })}>
                              <SelectTrigger className="bg-[#070b14] border-slate-700/80 text-slate-200 h-10 font-mono text-xs focus:ring-1 focus:ring-amber-400"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#0c101d] border-slate-800 text-slate-200 font-mono text-xs">
                                <SelectItem value="digital">Digital (Instant Download)</SelectItem>
                                <SelectItem value="physical">Physical (Hardware/Robotics Kit Shipping)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Description</Label>
                            <Textarea required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 font-sans text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400 resize-none" placeholder="Comprehensive engineering description..." rows={3} />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Technologies (comma separated)</Label>
                            <Input required value={newProject.tech} onChange={e => setNewProject({ ...newProject, tech: e.target.value })} className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 h-10 font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400" placeholder="React, Node.js, Python, LoRaWAN" />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Features (one per line)</Label>
                            <Textarea value={newProject.features} onChange={e => setNewProject({ ...newProject, features: e.target.value })} className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400 resize-none" placeholder="- Kalman Filtering Algorithm&#10;- Sub-GHz Mesh Network&#10;- IEEE Standard Report" rows={4} />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">What's Included (one per line)</Label>
                            <Textarea value={newProject.includes} onChange={e => setNewProject({ ...newProject, includes: e.target.value })} className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400 resize-none" placeholder="Complete Source Code (.zip)&#10;IEEE Standard Thesis (PDF)&#10;Hardware Wiring Schematics" rows={4} />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Cover Image</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              required
                              onChange={e => setNewProject({ ...newProject, image: e.target.files?.[0] || null })}
                              className="bg-[#070b14] border-slate-700/80 text-slate-300 h-10 file:text-slate-200 file:border-0 file:bg-slate-800 file:h-full file:px-3 file:mr-3 file:rounded-md hover:file:bg-slate-700 file:font-mono file:text-xs text-xs cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Screenshots (Multiple)</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={e => setNewProject({ ...newProject, screenshots: e.target.files })}
                              className="bg-[#070b14] border-slate-700/80 text-slate-300 h-10 file:text-slate-200 file:border-0 file:bg-slate-800 file:h-full file:px-3 file:mr-3 file:rounded-md hover:file:bg-slate-700 file:font-mono file:text-xs text-xs cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Demo Video (Optional)</Label>
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={e => setNewProject({ ...newProject, video: e.target.files?.[0] || null })}
                              className="bg-[#070b14] border-slate-700/80 text-slate-300 h-10 file:text-slate-200 file:border-0 file:bg-slate-800 file:h-full file:px-3 file:mr-3 file:rounded-md hover:file:bg-slate-700 file:font-mono file:text-xs text-xs cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">GitHub ZIP Link (Optional)</Label>
                            <Input
                              type="url"
                              value={newProject.github_url}
                              onChange={e => setNewProject({ ...newProject, github_url: e.target.value })}
                              placeholder="https://github.com/username/repo/archive/refs/heads/main.zip"
                              className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 h-10 font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                              <span>Price Note / Hardware Scope Note (Optional)</span>
                              <span className="text-[10px] text-amber-400/80 font-normal">(Displayed above tech stack on detail page)</span>
                            </Label>
                            <Input
                              value={newProject.price_note}
                              onChange={e => setNewProject({ ...newProject, price_note: e.target.value })}
                              placeholder="e.g. * Base price includes verified software and simulation; physical sensor kit shipped separately."
                              className="bg-[#070b14] border-slate-700/80 text-slate-100 placeholder:text-slate-500 h-10 font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-800">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setProjectSubTab("list")}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 font-mono text-xs border border-slate-800"
                          >
                            Cancel
                          </Button>
                          <Button 
                            disabled={isUploading} 
                            type="submit" 
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 h-10 rounded-lg text-xs font-mono font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)] disabled:opacity-50 border-0 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4 mr-2" /> {isUploading ? "TRANSMITTING..." : "PUBLISH BLUEPRINT"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="messages" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#090e1c] border border-slate-800/90 rounded-xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-lg font-mono flex items-center gap-2">
                          <Mail className="w-4 h-4 text-amber-400" />
                          Support & Contact Dispatch
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          {messages.length} INBOX
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">Inquiries submitted via public workstation contact interface</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="text-slate-400 text-[11px] font-mono uppercase tracking-wider border-b border-slate-800 bg-[#070a12]/80">
                          <th className="text-left py-3 px-3 font-semibold">Sender</th>
                          <th className="text-left py-3 px-3 font-semibold">Email</th>
                          <th className="text-left py-3 px-3 font-semibold">Message</th>
                          <th className="text-left py-3 px-3 font-semibold">Date</th>
                          <th className="text-right py-3 px-3 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                        {messages.map(m => (
                          <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-3 text-white font-sans font-medium">{m.name}</td>
                            <td className="py-4 px-3 text-cyan-400">{m.email}</td>
                            <td className="py-4 px-3 text-slate-300 font-sans max-w-xs truncate" title={m.message}>{m.message}</td>
                            <td className="py-4 px-3 text-slate-400 text-[11px]">{new Date(m.created_at).toLocaleDateString()}</td>
                            <td className="py-4 px-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-[#0c101d] border-slate-800 text-slate-200 shadow-2xl rounded-xl p-1.5 z-50 font-mono text-xs">
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${m.email}?subject=Reply to contact request`} className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-800/80 cursor-pointer p-2 rounded-md">
                                      <Mail className="w-4 h-4 text-cyan-400" /> Reply via Email
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-800" />
                                  <DropdownMenuItem onClick={() => deleteMessage(m.id)}
                                    className="flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer p-2 rounded-md">
                                    <Trash2 className="w-4 h-4" /> Delete Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {messages.length === 0 && <div className="text-center py-12 text-slate-500 font-mono text-xs">NO CONTACT MESSAGES IN SYSTEM</div>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#090e1c] border border-slate-800/90 rounded-xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-lg font-mono flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-emerald-400" />
                          Client Order Registry & Fulfillment
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {orders.length} TOTAL ORDERS
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">Purchases, courier tracking dispatch, and digital delivery packages</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead>
                        <tr className="text-slate-400 text-[11px] font-mono uppercase tracking-wider border-b border-slate-800 bg-[#070a12]/80">
                          <th className="text-left py-3 px-3 font-semibold">Order ID</th>
                          <th className="text-left py-3 px-3 font-semibold">Buyer</th>
                          <th className="text-left py-3 px-3 font-semibold">Project Purchased</th>
                          <th className="text-left py-3 px-3 font-semibold">Price</th>
                          <th className="text-left py-3 px-3 font-semibold">Type</th>
                          <th className="text-left py-3 px-3 font-semibold">Shipping Address</th>
                          <th className="text-left py-3 px-3 font-semibold">Status</th>
                          <th className="text-left py-3 px-3 font-semibold">Tracking ID</th>
                          <th className="text-left py-3 px-3 font-semibold">Deliverables</th>
                          <th className="text-right py-3 px-3 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                        {orders.map(o => {
                          const isPhysical = o.delivery_type === "physical";
                          const dev = o.deliverables || {};
                          const devCount = [dev.github_url || o.github_url, dev.drive_url, dev.video_url, dev.pdf_url, dev.admin_notes].filter(Boolean).length;
                          return (
                            <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-4 px-3 text-amber-400 font-semibold truncate max-w-[80px]" title={o.id}>
                                #{o.id.substring(0, 8)}
                              </td>
                              <td className="py-4 px-3">
                                <div className="text-white font-sans font-medium">{o.customer_name}</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">{o.customer_email}</div>
                              </td>
                              <td className="py-4 px-3 text-slate-200 font-sans max-w-[180px] truncate" title={o.project_title}>
                                {o.project_title}
                              </td>
                              <td className="py-4 px-3 text-emerald-400 font-bold">₹{o.amount.toLocaleString()}</td>
                              <td className="py-4 px-3">
                                <Badge className={isPhysical ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono text-[10px]" : "bg-blue-500/10 text-blue-300 border border-blue-500/30 font-mono text-[10px]"}>
                                  {isPhysical ? "Physical Kit" : "Digital ZIP"}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 text-slate-400 font-sans max-w-[200px] truncate text-xs" title={isPhysical ? `${o.shipping_address}, ${o.city}, ${o.state} - ${o.pincode} | Tel: ${o.customer_phone}` : "Instant Digital Download"}>
                                {isPhysical ? (
                                  <>
                                    <div className="font-medium text-slate-200">{o.shipping_address}, {o.city}</div>
                                    <div className="text-slate-500 text-[10px] mt-0.5 font-mono">Tel: {o.customer_phone}</div>
                                  </>
                                ) : (
                                  <span className="text-slate-500 font-mono">Instant Download</span>
                                )}
                              </td>
                              <td className="py-4 px-3">
                                <Badge className={
                                  o.status === "Delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]" :
                                  o.status === "Shipped" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-[10px]" :
                                  "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[10px]"
                                }>
                                  {o.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 font-mono text-xs">
                                {o.tracking_id ? (
                                  <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{o.tracking_id}</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="py-4 px-3">
                                {devCount > 0 ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeliverablesModal(o)}
                                    className="h-7 text-[11px] font-mono font-semibold border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 gap-1.5 px-2.5 rounded-lg cursor-pointer"
                                    title="View or update client deliverables"
                                  >
                                    <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{devCount} Linked</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeliverablesModal(o)}
                                    className="h-7 text-[11px] font-mono font-medium border-dashed border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-400/60 gap-1 px-2.5 rounded-lg cursor-pointer bg-transparent"
                                    title="Attach GitHub repo, Google Drive link, video walkthrough, or thesis PDF"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Attach</span>
                                  </Button>
                                )}
                              </td>
                              <td className="py-4 px-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56 bg-[#0c101d] border-slate-800 text-slate-200 p-1.5 shadow-2xl rounded-xl z-50 font-mono text-xs">
                                    <DropdownMenuItem 
                                      onClick={() => openDeliverablesModal(o)}
                                      className="flex items-center gap-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 font-medium cursor-pointer rounded-md p-2"
                                    >
                                      <FolderGit2 className="w-4 h-4 text-amber-400" /> Deliver Assets & Links
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    
                                    <div className="px-2.5 py-1 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Set Order Status</div>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    
                                    {isPhysical && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setTrackingOrderInfo({ id: o.id, currentTracking: o.tracking_id || null });
                                          setTrackingIdInput(o.tracking_id || "");
                                          setIsTrackingDialogOpen(true);
                                        }}
                                        className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer rounded-md p-2"
                                      >
                                        <Truck className="w-4 h-4 text-cyan-400" /> {o.tracking_id ? "Update Tracking ID" : "Mark as Shipped"}
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem 
                                      onClick={() => updateOrderStatus(o.id, "Processing")}
                                      className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer rounded-md p-2"
                                    >
                                      <MoreHorizontal className="w-4 h-4 text-amber-400" /> Mark as Processing
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => updateOrderStatus(o.id, "Delivered")}
                                      className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer rounded-md p-2"
                                    >
                                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Mark as Delivered
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        askConfirmation(
                                          "CANCEL_CLIENT_ORDER",
                                          "Are you sure you want to cancel this order? This cannot be undone.",
                                          () => updateOrderStatus(o.id, "Cancelled"),
                                          "CANCEL_ORDER"
                                        );
                                      }}
                                      className="flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer rounded-md p-2"
                                    >
                                      <Trash2 className="w-4 h-4" /> Cancel Order
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {orders.length === 0 && <div className="text-center py-12 text-slate-500 font-mono text-xs">NO PURCHASES REGISTERED YET</div>}
                  </div>
                </div>
              </TabsContent>

              {/* Real-time Live Product Inquiries Desk */}
              <TabsContent value="chats" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#0c101d] border border-slate-800/80 rounded-xl shadow-2xl overflow-hidden">
                  {/* Top Bar */}
                  <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#090e1c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                        <h3 className="text-white font-mono font-bold text-base tracking-wide flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                          LIVE_PRODUCT_INQUIRIES & CUSTOMIZATIONS
                        </h3>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 font-mono">
                        Real-time customer upgrade requests, hardware inquiries, and thesis customization desk
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px] px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 inline-block" />
                        WEBSOCKET_ACTIVE
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchConversations}
                        className="h-8 text-xs font-mono border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> REFRESH
                      </Button>
                    </div>
                  </div>

                  {/* 2-Column Split View (Responsive Mobile & Desktop) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px] lg:min-h-[620px]">
                    {/* Left Column: Conversations List (Hidden on mobile if a conversation is open) */}
                    <div className={`lg:col-span-5 xl:col-span-4 border-r border-slate-800/80 flex flex-col bg-[#090e1c]/70 ${
                      selectedConvo ? "hidden lg:flex" : "flex"
                    }`}>
                      {/* Search and Filters */}
                      <div className="p-3.5 border-b border-slate-800/80 space-y-2.5 bg-[#090e1c]">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                            placeholder="Filter by client or project..."
                            className="pl-9 h-9 text-xs font-mono bg-[#070a12] border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:border-cyan-500/50"
                          />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                          {(["all", "active", "purchased", "archived"] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setChatStatusFilter(filter)}
                              className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded transition-all whitespace-nowrap ${
                                chatStatusFilter === filter
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs"
                                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/60"
                              }`}
                            >
                              {filter} ({filter === "all" ? conversations.length : conversations.filter(c => c.status === filter).length})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* List Items */}
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 max-h-[460px] lg:max-h-[560px]">
                        {filteredConversations.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 font-mono">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                            <p className="text-xs">NO_INQUIRIES_FOUND</p>
                          </div>
                        ) : (
                          filteredConversations.map((c) => {
                            const isSelected = selectedConvo?.id === c.id;
                            return (
                              <ContextMenu key={c.id}>
                                <ContextMenuTrigger asChild>
                                  <div
                                    onClick={() => setSelectedConvo(c)}
                                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 hover:bg-slate-800/40 cursor-pointer select-none relative group ${
                                      isSelected ? "bg-amber-500/10 border-r-2 border-r-amber-400 shadow-xs" : ""
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded bg-[#070a12] border border-slate-700/60 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                      {c.user_name ? c.user_name.charAt(0).toUpperCase() : (c.user_email?.charAt(0).toUpperCase() || "U")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <h4 className="text-xs font-semibold text-slate-200 truncate">
                                          {c.user_name || c.user_email}
                                        </h4>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[10px] text-slate-500 font-mono">
                                            {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                          </span>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-colors opacity-70 group-hover:opacity-100"
                                                title="Inquiry options"
                                              >
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                              </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-[#0d121f] border-slate-800 text-slate-200 shadow-2xl rounded-xl p-1 z-50">
                                              <DropdownMenuItem
                                                onClick={() => updateConvoStatus(c.id, c.status === 'archived' ? 'active' : 'archived')}
                                                className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-slate-800/80 text-slate-300"
                                              >
                                                <Archive className="w-4 h-4 text-slate-400" />
                                                {c.status === 'archived' ? 'Unarchive Inquiry' : 'Archive Inquiry'}
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator className="bg-slate-800 my-1" />
                                              <DropdownMenuItem
                                                onClick={() => handleDeleteForAdmin(c.id)}
                                                className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-rose-500/10 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                                              >
                                                <Archive className="w-4 h-4 text-slate-400" />
                                                Hide from Admin View
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => handleCancelAndPurgeRequest(c.id)}
                                                className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-rose-500/10 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 font-semibold"
                                              >
                                                <Trash2 className="w-4 h-4 text-rose-400" />
                                                Cancel Request & Delete Chat
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-cyan-500/20 bg-cyan-500/10 text-cyan-400 font-mono truncate max-w-[170px]">
                                          {c.project_title}
                                        </Badge>
                                        <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                                          c.status === 'ready_to_purchase'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)] animate-pulse'
                                            : c.status === 'purchased'
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : c.status === 'archived'
                                            ? 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        }`}>
                                          {c.status === 'ready_to_purchase' ? 'ACCESS_GRANTED' : (c.status || 'active')}
                                        </span>
                                        {(c.lottery_unlocked || c.messages?.some((m: any) => m.type === "lottery_ticket")) && (
                                          <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded shadow-[0_0_6px_rgba(245,158,11,0.25)]">
                                            🎟️ RAFFLE
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-400 truncate">
                                        {c.last_message || "New inquiry started..."}
                                      </p>
                                    </div>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-52 bg-[#0d121f] border-slate-800 text-slate-200 shadow-2xl rounded-xl p-1 z-50">
                                  <ContextMenuItem
                                    onClick={() => updateConvoStatus(c.id, c.status === 'archived' ? 'active' : 'archived')}
                                    className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-slate-800/80 text-slate-300"
                                  >
                                    <Archive className="w-4 h-4 text-slate-400" />
                                    {c.status === 'archived' ? 'Unarchive Inquiry' : 'Archive Inquiry'}
                                  </ContextMenuItem>
                                  <ContextMenuSeparator className="bg-slate-800 my-1" />
                                  <ContextMenuItem
                                    onClick={() => handleDeleteForAdmin(c.id)}
                                    className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-slate-800/80 text-slate-400 focus:text-slate-200"
                                  >
                                    <Archive className="w-4 h-4 text-slate-400" />
                                    Hide from Admin View
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => handleCancelAndPurgeRequest(c.id)}
                                    className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-rose-500/10 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 font-semibold"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                    Cancel Request & Delete Chat
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right Column: Chat Console (Visible on mobile if convo selected, or desktop) */}
                    <div className={`lg:col-span-7 xl:col-span-8 flex flex-col bg-[#0c101d] ${
                      selectedConvo ? "flex" : "hidden lg:flex"
                    }`}>
                      {selectedConvo ? (
                        <>
                          {/* Chat Header */}
                          <div className="p-3 sm:p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 bg-[#090e1c]/80 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedConvo(null)}
                                className="lg:hidden h-8 px-2 -ml-1 text-slate-400 hover:text-amber-400 gap-1 text-xs font-mono shrink-0"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden xs:inline">INQUIRIES</span>
                              </Button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-none">
                                    {selectedConvo.user_name || "Customer"}
                                  </h4>
                                  <a 
                                    href={`mailto:${selectedConvo.user_email}`} 
                                    className="text-[11px] sm:text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono truncate max-w-[160px] sm:max-w-none"
                                  >
                                    {selectedConvo.user_email}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs text-slate-400">
                                  <span className="truncate max-w-[180px] sm:max-w-xs font-mono">
                                    KIT: <strong className="text-slate-200">{selectedConvo.project_title}</strong>
                                  </span>
                                  {selectedConvo.project_price > 0 && (
                                    <span className="font-mono font-semibold text-emerald-400 shrink-0">
                                      ₹{Number(selectedConvo.project_price).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {/* One-Click Buy Access Action Button */}
                              {selectedConvo.status === 'ready_to_purchase' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevokePurchaseAccess(selectedConvo)}
                                  className="h-8 text-xs font-mono border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 flex items-center gap-1.5 transition-all group"
                                  title="Customer has permission to purchase. Click to revoke."
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:hidden" />
                                  <X className="w-3.5 h-3.5 text-rose-400 hidden group-hover:inline" />
                                  <span className="group-hover:hidden font-bold">ACCESS_GRANTED</span>
                                  <span className="hidden group-hover:inline">REVOKE_ACCESS</span>
                                </Button>
                              ) : selectedConvo.status !== 'purchased' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleGrantPurchaseAccess(selectedConvo)}
                                  className="h-8 text-xs font-mono font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.35)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                  title="Grant customer permission to buy this project"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span>GRANT_BUY_ACCESS</span>
                                </Button>
                              ) : (
                                <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[11px] h-8 px-2.5">
                                  ✓ PURCHASED
                                </Badge>
                              )}

                              {/* One-Click Individual Student Scratch Lottery Action */}
                              {selectedConvo.lottery_unlocked || selectedConvo.messages?.some((m: any) => m.type === "lottery_ticket") ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevokeLotteryAccess(selectedConvo)}
                                  className="h-8 text-xs font-mono border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 flex items-center gap-1.5 transition-all group"
                                  title="Student raffle ticket is active. Click to revoke."
                                >
                                  <Ticket className="w-3.5 h-3.5 text-amber-400 group-hover:hidden" />
                                  <X className="w-3.5 h-3.5 text-rose-400 hidden group-hover:inline" />
                                  <span className="group-hover:hidden font-bold">🎟️ TICKET_ACTIVE</span>
                                  <span className="hidden group-hover:inline">REVOKE_TICKET</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleGrantLotteryAccess(selectedConvo)}
                                  className="h-8 text-xs font-mono font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                  title="Grant an exclusive vintage scratch lottery ticket to this student"
                                >
                                  <Ticket className="w-3.5 h-3.5" />
                                  <span>🎟️ GRANT_LOTTERY_TICKET</span>
                                </Button>
                              )}

                              {/* Open Project Link */}
                              {selectedConvo.project_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-8 text-xs font-mono border-slate-800 bg-slate-900/60 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 px-2 sm:px-3"
                                >
                                  <a href={`/project/${selectedConvo.project_id}`} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-3.5 h-3.5 sm:mr-1" />
                                    <span className="hidden sm:inline">VIEW_PRODUCT</span>
                                  </a>
                                </Button>
                              )}

                              {/* Status Dropdown */}
                              <Select
                                value={selectedConvo.status || "active"}
                                onValueChange={(val) => updateConvoStatus(selectedConvo.id, val)}
                              >
                                <SelectTrigger className="h-8 text-xs font-mono w-[125px] sm:w-[155px] border-slate-800 bg-[#070a12] text-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0d121f] border-slate-800 text-slate-200">
                                  <SelectItem value="active">🟢 In Review (Active)</SelectItem>
                                  <SelectItem value="ready_to_purchase">⚡ Access Granted</SelectItem>
                                  <SelectItem value="purchased">✅ Purchased</SelectItem>
                                  <SelectItem value="archived">📁 Archived</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Direct Cancel & Purge Action */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelAndPurgeRequest(selectedConvo.id)}
                                className="h-8 text-xs font-mono border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Cancel this build request and permanently delete chat from database"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span className="hidden sm:inline">CANCEL_REQUEST</span>
                              </Button>

                              {/* More Options for selected chat */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white border border-slate-800 bg-slate-900/60">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#0d121f] border-slate-800 text-slate-200 shadow-2xl rounded-xl p-1 z-50">
                                  <DropdownMenuItem
                                    onClick={() => updateConvoStatus(selectedConvo.id, selectedConvo.status === 'archived' ? 'active' : 'archived')}
                                    className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-slate-800/80 text-slate-300"
                                  >
                                    <Archive className="w-4 h-4 text-slate-400" />
                                    {selectedConvo.status === 'archived' ? 'Unarchive Inquiry' : 'Archive Inquiry'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-800 my-1" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteForAdmin(selectedConvo.id)}
                                    className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-slate-800/80 text-slate-400 focus:text-slate-200"
                                  >
                                    <Archive className="w-4 h-4 text-slate-400" />
                                    Hide from Admin View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCancelAndPurgeRequest(selectedConvo.id)}
                                    className="flex items-center gap-2 text-xs py-2 px-2.5 rounded-lg cursor-pointer hover:bg-rose-500/10 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 font-bold"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                    Cancel Request & Delete Chat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Chat Message Scrollable Feed */}
                          <div 
                            ref={adminChatFeedRef}
                            className="flex-1 p-3.5 sm:p-4 overflow-y-auto max-h-[380px] sm:max-h-[440px] min-h-[320px] space-y-3 bg-[#070a12]/50 overscroll-contain"
                          >
                            {(() => {
                              const displayChatMessages = adminChatMessages.filter((msg: any, idx: number, arr: any[]) => {
                                return arr.findIndex((x) => x.id === msg.id) === idx;
                              });

                              if (displayChatMessages.length === 0) {
                                return (
                                  <div className="py-12 text-center text-slate-500 font-mono">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-400 opacity-60" />
                                    <p className="text-xs">NO_MESSAGES_LOGGED_YET</p>
                                    <p className="text-[11px] text-slate-600 mt-1">Send an engineering greeting below.</p>
                                  </div>
                                );
                              }

                              return displayChatMessages.map((msg: any) => {
                                const isAdmin = msg.sender_role === "admin";
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                                  >
                                    <div className="flex items-center gap-1.5 mb-1 px-1">
                                      <span className="text-[10px] font-mono font-semibold text-slate-400">
                                        {isAdmin ? "ProjectDukaan Terminal (You)" : msg.sender_name || "Client"}
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-500">
                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                      </span>
                                    </div>
                                    <div
                                      className={`p-3 text-xs rounded-xl max-w-[85%] leading-relaxed ${
                                        isAdmin
                                          ? "bg-amber-500 text-slate-950 font-medium rounded-tr-xs shadow-md"
                                          : "bg-[#0f172a] text-slate-200 border border-slate-800 rounded-tl-xs shadow-xs"
                                      }`}
                                    >
                                      {msg.message}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Quick Admin Canned Responses */}
                          <div className="p-2 sm:p-2.5 border-t border-slate-800/80 bg-[#090e1c] flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] shrink-0">
                            <span className="text-slate-400 text-[10px] font-mono uppercase shrink-0 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" /> CANNED:
                            </span>
                            {[
                              "Yes, this kit is in stock and ready to dispatch via DTDC Courier!",
                              "We can customize sensors (ESP32, LoRa, GSM) for your college synopsis.",
                              "Complete source code, IEEE synopsis, PPT, and circuit diagram are included.",
                              "Would you like us to schedule a 10-minute live hardware video demo?",
                            ].map((preset, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleAdminSend(preset)}
                                disabled={isAdminSending}
                                className="bg-[#070a12] border border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-400 px-2.5 py-1 rounded whitespace-nowrap transition-colors shrink-0 text-[11px] font-mono cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                              >
                                {preset.slice(0, 30)}...
                              </button>
                            ))}
                          </div>

                          {/* Reply Input Bar */}
                          <div className="p-2.5 sm:p-3 border-t border-slate-800/80 bg-[#090e1c] shrink-0">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAdminSend();
                              }}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={adminReplyText}
                                onChange={(e) => setAdminReplyText(e.target.value)}
                                placeholder={`Reply to ${selectedConvo.user_name || "client"}...`}
                                className="h-10 text-xs sm:text-sm bg-[#070a12] border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:border-amber-500/50 flex-1 font-mono"
                                disabled={isAdminSending}
                              />
                              <Button
                                type="submit"
                                disabled={isAdminSending || !adminReplyText.trim()}
                                className="h-10 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold shrink-0 text-xs sm:text-sm gap-1.5 shadow-md disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">DISPATCH</span>
                              </Button>
                            </form>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 min-h-[350px]">
                          <div className="w-14 h-14 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
                            <MessageSquare className="w-7 h-7 text-amber-400/60" />
                          </div>
                          <h4 className="text-white font-mono font-semibold text-sm mb-1">NO_CONVERSATION_SELECTED</h4>
                          <p className="text-slate-400 text-xs max-w-sm font-mono">
                            Select an active customer inquiry from the left console to review questions, discuss hardware upgrades, and dispatch replies in real time.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Student Scratch Lottery Management Panel */}
              <TabsContent value="lottery" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#090e1c] border border-slate-800/90 rounded-xl p-4 sm:p-6 shadow-xl space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-amber-400" />
                        <h3 className="text-white font-bold text-base sm:text-lg font-mono">
                          Student Scratch Lottery Engine
                        </h3>
                        <Badge className={lotteryConfig.enabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-rose-500/20 text-rose-400 border-rose-500/40"}>
                          {lotteryConfig.enabled ? "LIVE & ACTIVE" : "DISABLED"}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 font-mono">
                        Admin authority over the interactive student scratch-off coupon cards and random discount range.
                      </p>
                    </div>

                    {/* Master Switch Button */}
                    <Button
                      type="button"
                      onClick={handleToggleLottery}
                      className={`h-11 px-5 font-mono font-bold text-xs rounded transition-all cursor-pointer shadow-sm ${
                        lotteryConfig.enabled
                          ? "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80"
                          : "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black border border-emerald-300"
                      }`}
                    >
                      {lotteryConfig.enabled ? (
                        <>
                          <X className="w-4 h-4 mr-1.5" />
                          DISABLE_LOTTERY_GLOBALLY
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-1.5 fill-emerald-950" />
                          ENABLE_LOTTERY_GLOBALLY
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Status & Rule Settings Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Configuration Form (7 cols) */}
                    <form onSubmit={handleSaveLotteryRules} className="lg:col-span-7 space-y-5 bg-[#070b14] p-5 sm:p-6 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                          RANDOM_DISCOUNT_BOUNDS
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          MIN & MAX THRESHOLDS
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-mono text-slate-400 block mb-1.5">
                            Minimum Discount (%)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            value={lotteryMinInput}
                            onChange={(e) => setLotteryMinInput(Number(e.target.value))}
                            className="bg-[#090e1c] border-slate-700 text-white font-mono text-sm h-11"
                          />
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            Default: 20%
                          </span>
                        </div>

                        <div>
                          <label className="text-xs font-mono text-slate-400 block mb-1.5">
                            Maximum Discount (%)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            value={lotteryMaxInput}
                            onChange={(e) => setLotteryMaxInput(Number(e.target.value))}
                            className="bg-[#090e1c] border-slate-700 text-white font-mono text-sm h-11"
                          />
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            Default: 30%
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Student Psychology & Isolated Per-User Granting:</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Lottery tickets are strictly isolated per student and hidden from general visitors on project pages. When chatting with an inquiring student, click <strong className="text-amber-400">[🎟️ GRANT_LOTTERY_TICKET]</strong> in the conversation toolbar. Only that specific student receives the vintage scratch ticket to reveal their lucky academic discount between <strong className="text-amber-400">{lotteryMinInput}%</strong> and <strong className="text-amber-400">{lotteryMaxInput}%</strong>.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-black font-mono text-xs shadow-md border border-amber-300 retro-btn cursor-pointer"
                      >
                        [SAVE_&_APPLY_LOTTERY_RULES]
                      </Button>
                    </form>

                    {/* Right: Live Preview & Admin Sandbox (5 cols) */}
                    <div className="lg:col-span-5 bg-[#070b14] p-5 sm:p-6 rounded-xl border border-slate-800 flex flex-col justify-between space-y-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <Gift className="w-4 h-4 text-emerald-400" />
                            ADMIN_SANDBOX_TEST
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            SIMULATOR
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed">
                          Test scratch the lottery card as an administrator to inspect foil physics, particle reveal rates, and auto-discount vouchers.
                        </p>

                        <div className="p-3 rounded bg-[#090e1c] border border-slate-800/80 font-mono text-xs space-y-2">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Storewide State:</span>
                            <span className={lotteryConfig.enabled ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {lotteryConfig.enabled ? "ACTIVE (Appears on checkout)" : "OFFLINE (Hidden from students)"}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Active Range:</span>
                            <span className="text-amber-400 font-bold">
                              {lotteryConfig.minDiscount}% – {lotteryConfig.maxDiscount}% Random
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Eligible Target:</span>
                            <span className="text-cyan-400 font-bold">Engineering Capstones</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setIsTestLotteryOpen(true)}
                        className="w-full h-11 rounded bg-[#0d1424] hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                      >
                        <Ticket className="w-4 h-4 text-amber-400" />
                        <span>TEST SCRATCH CARD AS ADMIN</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Individual Student Inquiry Quick-Grant Table */}
                  <div className="bg-[#070b14] p-5 sm:p-6 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-amber-400" />
                          INDIVIDUAL_STUDENT_LOTTERY_DISPATCH
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Grant or revoke scratch lottery tickets per student conversation. Only students granted here or inside the Inquiry chat will see the scratch card.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 shrink-0">
                        {conversations.filter(c => c.status !== 'archived').length} Active Inquiries
                      </span>
                    </div>

                    {conversations.filter(c => c.status !== 'archived').length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs font-mono">
                        No active student inquiries found. When a student clicks &ldquo;Request Build &amp; Inquire Access&rdquo;, their inquiry will appear here.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto quiet-code-scroll">
                        {conversations
                          .filter(c => c.status !== 'archived')
                          .map((convo) => {
                            const isGranted = Boolean(
                              convo.lottery_unlocked || 
                              convo.messages?.some((m: any) => m.type === "lottery_ticket")
                            );

                            return (
                              <div
                                key={convo.id}
                                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 rounded transition-colors font-mono"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-white truncate">
                                      {convo.user_name || "Student"}
                                    </span>
                                    <span className="text-[10px] text-amber-400/90 truncate">
                                      ({convo.user_email})
                                    </span>
                                    {isGranted ? (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                                        🎟️ TICKET_ACTIVE
                                      </span>
                                    ) : (
                                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                        NO_TICKET
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                    Project: <strong className="text-slate-300">{convo.project_title}</strong>
                                    {convo.project_price > 0 && ` · ₹${Number(convo.project_price).toLocaleString('en-IN')}`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedConvo(convo);
                                      const tabBtn = document.querySelector('button[value="inquiries"]') as HTMLElement;
                                      if (tabBtn) tabBtn.click();
                                    }}
                                    className="h-8 text-[11px] font-mono border-slate-700 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
                                  >
                                    OPEN_CHAT
                                  </Button>

                                  {isGranted ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRevokeLotteryAccess(convo)}
                                      className="h-8 text-[11px] font-mono border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                                    >
                                      REVOKE_TICKET
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleGrantLotteryAccess(convo)}
                                      className="h-8 text-[11px] font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 shadow-sm cursor-pointer"
                                    >
                                      <Ticket className="w-3.5 h-3.5 mr-1" />
                                      GRANT_TICKET
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>

      {/* Edit / Make Changes Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#0c101d] border border-slate-800 text-slate-100 sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-mono font-bold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-400" />
              EDIT_PROJECT_PARAMETERS
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-mono text-xs">
              Update project details, screenshots, demo video, code links, pricing, or description. Changes reflect immediately across the store.
            </DialogDescription>
          </DialogHeader>

          {editingProject && (
            <form onSubmit={handleUpdateProject} className="space-y-4 py-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">PROJECT_TITLE</Label>
                  <Input
                    required
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs focus-visible:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">CATEGORY</Label>
                  <Select value={editForm.category} onValueChange={v => setEditForm({ ...editForm, category: v })}>
                    <SelectTrigger className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-slate-800 text-slate-200">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">PRICE (₹)</Label>
                  <Input
                    required
                    type="number"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs focus-visible:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">DIFFICULTY</Label>
                  <Select value={editForm.difficulty} onValueChange={v => setEditForm({ ...editForm, difficulty: v })}>
                    <SelectTrigger className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-slate-800 text-slate-200">
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">DELIVERY_TYPE</Label>
                  <Select value={editForm.delivery_type} onValueChange={v => setEditForm({ ...editForm, delivery_type: v })}>
                    <SelectTrigger className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-slate-800 text-slate-200">
                      <SelectItem value="digital">Digital (Instant Download)</SelectItem>
                      <SelectItem value="physical">Physical (Hardware Shipping)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">TECHNOLOGIES (comma separated)</Label>
                  <Input
                    required
                    value={editForm.tech}
                    onChange={e => setEditForm({ ...editForm, tech: e.target.value })}
                    className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs focus-visible:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">DESCRIPTION</Label>
                  <Textarea
                    required
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="bg-[#070a12] border-slate-800 text-white resize-none font-mono text-xs focus-visible:border-amber-500/50"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">FEATURES (one per line)</Label>
                  <Textarea
                    value={editForm.features}
                    onChange={e => setEditForm({ ...editForm, features: e.target.value })}
                    className="bg-[#070a12] border-slate-800 text-white resize-none font-mono text-xs focus-visible:border-amber-500/50"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">WHAT'S INCLUDED (one per line)</Label>
                  <Textarea
                    value={editForm.includes}
                    onChange={e => setEditForm({ ...editForm, includes: e.target.value })}
                    className="bg-[#070a12] border-slate-800 text-white resize-none font-mono text-xs focus-visible:border-amber-500/50"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">GITHUB_ZIP_URL (Optional)</Label>
                  <Input
                    type="url"
                    value={editForm.github_url}
                    onChange={e => setEditForm({ ...editForm, github_url: e.target.value })}
                    placeholder="https://github.com/username/repo/archive/refs/heads/main.zip"
                    className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs focus-visible:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-300 text-xs font-mono font-semibold flex items-center gap-2">
                    <span>PRICE_NOTE / SURCHARGE_NOTE (Optional)</span>
                    <span className="text-[10px] text-amber-400/80 font-normal font-mono">(Displayed above Tech Stack)</span>
                  </Label>
                  <Input
                    value={editForm.price_note}
                    onChange={e => setEditForm({ ...editForm, price_note: e.target.value })}
                    placeholder="e.g. * Extra ₹500 for deployment support, or base price includes basic setup only"
                    className="bg-[#070a12] border-slate-800 text-white h-10 font-mono text-xs focus-visible:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">REPLACE_COVER_IMAGE</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => setEditForm({ ...editForm, image: e.target.files?.[0] || null })}
                    className="bg-[#070a12] border-slate-800 text-slate-300 h-10 file:text-amber-400 file:border-0 file:bg-slate-900 file:h-full file:px-3 file:mr-3 file:rounded-md text-xs cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">REPLACE_SCREENSHOTS</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => setEditForm({ ...editForm, screenshots: e.target.files })}
                    className="bg-[#070a12] border-slate-800 text-slate-300 h-10 file:text-amber-400 file:border-0 file:bg-slate-900 file:h-full file:px-3 file:mr-3 file:rounded-md text-xs cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-300 text-xs font-mono font-semibold">REPLACE_DEMO_VIDEO</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={e => setEditForm({ ...editForm, video: e.target.files?.[0] || null })}
                    className="bg-[#070a12] border-slate-800 text-slate-300 h-10 file:text-amber-400 file:border-0 file:bg-slate-900 file:h-full file:px-3 file:mr-3 file:rounded-md text-xs cursor-pointer"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-end pt-4 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 font-mono text-xs"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 h-10 font-mono font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {isUpdating ? "SAVING..." : "COMMIT_CHANGES"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking ID Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="bg-[#0c101d] border border-slate-800 text-slate-100 sm:max-w-md shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-mono font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              DISPATCH_TRACKING_DETAILS
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-mono text-xs">
              Provide the courier tracking ID to mark this hardware consignment as shipped.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="tracking-id" className="text-slate-300 mb-2 block font-mono text-xs font-medium">TRACKING_ID (DTDC / BlueDart / SpeedPost)</Label>
            <Input 
              id="tracking-id" 
              value={trackingIdInput} 
              onChange={e => setTrackingIdInput(e.target.value)} 
              placeholder="e.g. DTDC-88429910" 
              className="bg-[#070a12] border-slate-800 text-white h-11 font-mono text-xs focus-visible:border-amber-500/50" 
              autoFocus 
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsTrackingDialogOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 font-mono text-xs">
              CANCEL
            </Button>
            <Button onClick={() => {
              if (trackingOrderInfo) {
                updateOrderStatus(trackingOrderInfo.id, "Shipped", trackingIdInput.trim() || undefined);
                setIsTrackingDialogOpen(false);
              }
            }} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-md">
              SAVE_TRACKING & SHIP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Deliverables & Custom Links Dialog */}
      <Dialog open={isDeliverablesDialogOpen} onOpenChange={setIsDeliverablesDialogOpen}>
        <DialogContent className="bg-[#0c101d] border border-slate-800 text-slate-100 sm:max-w-xl shadow-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <FolderGit2 className="w-4 h-4" />
              </span>
              <div>
                <DialogTitle className="text-white font-mono font-bold text-base">
                  ORDER_DELIVERABLES & CUSTOM_LINKS
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-mono text-xs">
                  Allocate personalized repositories, cloud folders, walkthrough videos, and engineering notes to this client.
                </DialogDescription>
              </div>
            </div>
            {selectedOrderForDeliverables && (
              <div className="bg-[#090e1c] border border-slate-800/80 rounded-xl p-3 mt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-mono">ORDER #{selectedOrderForDeliverables.id.substring(0, 8)}</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{selectedOrderForDeliverables.project_title}</div>
                  <div className="text-slate-400 text-[11px] font-mono">{selectedOrderForDeliverables.customer_name} ({selectedOrderForDeliverables.customer_email})</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedOrderForDeliverables.customer_email);
                    toast.success("Buyer email copied to clipboard!");
                  }}
                  className="h-7 text-[11px] font-mono text-slate-300 hover:text-amber-400 gap-1 border border-slate-800 bg-[#070a12]"
                >
                  <Copy className="w-3 h-3" /> COPY_EMAIL
                </Button>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveDeliverables(); }} className="space-y-4 pt-3">
            {/* GitHub Repo Link */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                PRIVATE_GITHUB_REPOSITORY / INVITE_LINK
              </Label>
              <Input
                value={deliverablesForm.github_url}
                onChange={(e) => setDeliverablesForm({ ...deliverablesForm, github_url: e.target.value })}
                placeholder="https://github.com/your-org/custom-project-repo"
                className="bg-[#070a12] border-slate-800 text-white h-9 text-xs font-mono focus-visible:border-amber-500/50"
              />
              <p className="text-[10px] text-slate-500 font-mono">Buyer will receive a direct 1-click button to open or accept their private repository.</p>
            </div>

            {/* Google Drive / Cloud Link */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                GOOGLE_DRIVE / CLOUD_FOLDER_LINK
              </Label>
              <Input
                value={deliverablesForm.drive_url}
                onChange={(e) => setDeliverablesForm({ ...deliverablesForm, drive_url: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                className="bg-[#070a12] border-slate-800 text-white h-9 text-xs font-mono focus-visible:border-amber-500/50"
              />
              <p className="text-[10px] text-slate-500 font-mono">Share datasets, 3D printing STL files, PCB Gerber zip, or large archives.</p>
            </div>

            {/* Video Walkthrough Link */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-rose-400" />
                HARDWARE_DEMO / VIDEO_WALKTHROUGH_URL
              </Label>
              <Input
                value={deliverablesForm.video_url}
                onChange={(e) => setDeliverablesForm({ ...deliverablesForm, video_url: e.target.value })}
                placeholder="https://youtu.be/... or Google Drive video link"
                className="bg-[#070a12] border-slate-800 text-white h-9 text-xs font-mono focus-visible:border-amber-500/50"
              />
              <p className="text-[10px] text-slate-500 font-mono">Unlisted YouTube, Loom, or Drive video tutorial showing setup and demo.</p>
            </div>

            {/* Project Synopsis / Thesis PDF Link */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                PROJECT_REPORT / THESIS_SYNOPSIS_PDF_URL
              </Label>
              <Input
                value={deliverablesForm.pdf_url}
                onChange={(e) => setDeliverablesForm({ ...deliverablesForm, pdf_url: e.target.value })}
                placeholder="https://drive.google.com/... or public PDF link"
                className="bg-[#070a12] border-slate-800 text-white h-9 text-xs font-mono focus-visible:border-amber-500/50"
              />
              <p className="text-[10px] text-slate-500 font-mono">Direct link to customized IEEE documentation or report.</p>
            </div>

            {/* Engineer Handover Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                ENGINEER_HANDOVER_INSTRUCTIONS & CREDENTIALS
              </Label>
              <Textarea
                rows={3}
                value={deliverablesForm.admin_notes}
                onChange={(e) => setDeliverablesForm({ ...deliverablesForm, admin_notes: e.target.value })}
                placeholder="e.g., Default WiFi: ProjectNet / pass1234. LoRa frequency is set to 868MHz. Connect sensor trigger to GPIO 4. For viva, remember to explain the Kalman filter equations."
                className="bg-[#070a12] border-slate-800 text-white text-xs leading-relaxed font-mono focus-visible:border-amber-500/50"
              />
              <p className="text-[10px] text-slate-500 font-mono">Displayed in an authorized Engineer Callout Box on the buyer's purchases page.</p>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end pt-3 border-t border-slate-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeliverablesDialogOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 font-mono text-xs"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={isSavingDeliverables}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 h-9 font-mono font-bold text-xs shadow-md border-0 gap-1.5 disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" />
                {isSavingDeliverables ? "SAVING..." : "COMMIT & DELIVER"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cyber-Deck Themed Universal Confirmation Modal */}
      <CyberConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={confirmDialog.isLoading}
      />

      {/* Admin Test Simulator Scratch Lottery Ticket Modal */}
      <StudentLotteryTicketModal
        isOpen={isTestLotteryOpen}
        onClose={() => setIsTestLotteryOpen(false)}
        projectTitle="Admin Simulator Project"
        originalPrice={24999}
        onApplyDiscount={(disc, code) => {
          toast.success(`Simulation verified: ${disc}% Lucky Discount (${code}) generated!`);
        }}
      />
    </Layout>
  );
}
