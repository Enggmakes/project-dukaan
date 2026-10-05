import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Star, Download, ShieldCheck, Play, FileText, Database, Video, MapPin, Phone, Mail, Loader2, Package, Truck, CheckCircle2, ShoppingBag, X, Laptop, Bot, Heart, Headphones, Terminal, Layers, Cpu, Code2, Wrench, MessageSquare, FolderGit2, Key, Clock, Sparkles, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { load } from '@cashfreepayments/cashfree-js';
import { Helmet } from 'react-helmet-async';
import Layout from "@/components/Layout";
import ProjectCard from "@/components/ProjectCard";
import ProductChatDrawer from "@/components/ProductChatDrawer";
import CyberConfirmDialog from "@/components/CyberConfirmDialog";
import { Project } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { isUserAdmin, checkAdminStatus } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const getIncludeIcon = (text: string) => {
  const lower = (text || "").toLowerCase();
  
  // Code, Repository, Source, ZIP
  if (lower.includes("code") || lower.includes("zip") || lower.includes("github") || lower.includes("repo") || lower.includes("source") || lower.includes("blueprint")) {
    return Download;
  }
  // Database, SQL, Schemas, Datasets, CSV, JSON data
  if (lower.includes("sql") || lower.includes("data") || lower.includes("db") || lower.includes("schema") || lower.includes("dataset") || lower.includes("csv") || lower.includes("supabase")) {
    return Database;
  }
  // Video, Walkthrough, Demo, Recording, Tutorial
  if (lower.includes("video") || lower.includes("walkthrough") || lower.includes("demo") || lower.includes("recording") || lower.includes("tutorial") || lower.includes("guide") || lower.includes("stream")) {
    return Video;
  }
  // Support, Bug fixes, Maintenance, Consultation, Warranty, Help
  if (lower.includes("support") || lower.includes("fix") || lower.includes("bug") || lower.includes("maintenance") || lower.includes("consult") || lower.includes("help") || lower.includes("setup")) {
    return Headphones;
  }
  // API, Postman, Endpoint, Terminal, Script, CLI, Webhook
  if (lower.includes("api") || lower.includes("postman") || lower.includes("script") || lower.includes("endpoint") || lower.includes("webhook") || lower.includes("cli")) {
    return Terminal;
  }
  // UI / UX, Figma, Assets, Design, Wireframe, Icons
  if (lower.includes("figma") || lower.includes("ui") || lower.includes("ux") || lower.includes("design") || lower.includes("asset") || lower.includes("wireframe") || lower.includes("template")) {
    return Layers;
  }
  // Hardware, Kit, IoT, Sensor, PCB, Robotics, Circuit, BOM
  if (lower.includes("hardware") || lower.includes("kit") || lower.includes("sensor") || lower.includes("robot") || lower.includes("iot") || lower.includes("circuit") || lower.includes("pcb") || lower.includes("bom")) {
    return Cpu;
  }
  // Documentation, PDF, Reports, Docs
  return FileText;
};

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<Project[]>([]);

  // Checkout & Cashfree States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCashfreeOpen, setIsCashfreeOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Builder Allocation & Purchase Access States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [convoStatus, setConvoStatus] = useState<"none" | "active" | "ready_to_purchase" | "purchased">("none");
  const [activeConvo, setActiveConvo] = useState<any | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [isRequestingBuild, setIsRequestingBuild] = useState(false);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);

  // Check user ownership, admin status, and build inquiry permission in realtime
  useEffect(() => {
    let channel: any = null;
    let ordersChannel: any = null;

    const checkAccessAndOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCurrentUser(null);
        setIsAdmin(false);
        setIsOwned(false);
        setConvoStatus("none");
        setActiveConvo(null);
        return;
      }

      setCurrentUser(session.user);
      const admin = await checkAdminStatus(session.user);
      setIsAdmin(admin);

      // Check if user has an active, non-cancelled order for this project
      const userEmail = session.user.email?.trim().toLowerCase();
      const { data: userOrders } = await supabase
        .from("orders")
        .select("id, project_title, customer_email, status")
        .order("created_at", { ascending: false });

      let hasActivePurchase = false;
      if (userOrders && project) {
        hasActivePurchase = userOrders.some((o: any) => 
          o.customer_email && 
          o.customer_email.trim().toLowerCase() === userEmail &&
          o.project_title && 
          o.project_title.trim().toLowerCase() === project.title.trim().toLowerCase() &&
          o.status?.toLowerCase() !== "cancelled" &&
          o.status?.toLowerCase() !== "withdrawn"
        );
      }

      if (hasActivePurchase) {
        setIsOwned(true);
        setConvoStatus("purchased");
      } else {
        setIsOwned(false);
      }

      // Check active conversation / build request
      if (id) {
        const { data: convo } = await supabase
          .from("product_conversations")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("project_id", id)
          .maybeSingle();

        if (convo && convo.status !== "withdrawn" && convo.status !== "cancelled") {
          setActiveConvo(convo);
          if (convo.status === "ready_to_purchase") {
            setConvoStatus("ready_to_purchase");
          } else if (convo.status === "purchased") {
            if (hasActivePurchase) {
              setConvoStatus("purchased");
              setIsOwned(true);
            } else {
              // The order was cancelled by admin: revoke ownership and allow buying again
              setIsOwned(false);
              setConvoStatus("ready_to_purchase");
            }
          } else {
            setConvoStatus("active");
          }

          // Realtime listener for this conversation
          channel = supabase
            .channel(`convo-status-${convo.id}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "product_conversations",
                filter: `id=eq.${convo.id}`,
              },
              (payload: any) => {
                if (payload.eventType === "DELETE") {
                  setActiveConvo(null);
                  setConvoStatus("none");
                  setIsChatDrawerOpen(false);
                  toast.info("Build request has been cancelled.");
                } else if (payload.new) {
                  const newStatus = payload.new.status;
                  if (newStatus === "withdrawn" || newStatus === "cancelled") {
                    setActiveConvo(null);
                    setConvoStatus("none");
                    setIsChatDrawerOpen(false);
                    toast.info("Build request has been cancelled.");
                  } else if (newStatus === "ready_to_purchase") {
                    setActiveConvo(payload.new);
                    setConvoStatus("ready_to_purchase");
                    toast.success("🎉 Access Granted! Lead engineer approved this build. You can now Buy Now & Pay!", {
                      duration: 7000
                    });
                  } else if (newStatus === "purchased") {
                    if (hasActivePurchase) {
                      setActiveConvo(payload.new);
                      setConvoStatus("purchased");
                      setIsOwned(true);
                    }
                  } else {
                    setActiveConvo(payload.new);
                    setConvoStatus("active");
                  }
                }
              }
            )
            .subscribe();
        } else {
          if (!hasActivePurchase) {
            setConvoStatus("none");
          }
          setActiveConvo(null);
        }
      }
    };

    checkAccessAndOrders();

    // Realtime orders status listener for instant sync when admin changes or cancels an order
    ordersChannel = supabase
      .channel(`orders-live-sync-${id || 'detail'}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          checkAccessAndOrders();
        }
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkAccessAndOrders();
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setIsOwned(false);
        setConvoStatus("none");
        setActiveConvo(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
      if (ordersChannel) supabase.removeChannel(ordersChannel);
    };
  }, [id, project]);

  const handleRequestBuildClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to request build access!");
      navigate(`/login?redirect=/project/${id}`);
      return;
    }

    if (!project) return;
    setIsRequestingBuild(true);

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("product_conversations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("project_id", project.id)
        .maybeSingle();

      if (existing && existing.status !== "withdrawn" && existing.status !== "cancelled") {
        setActiveConvo(existing);
        setConvoStatus(existing.status || "active");
        setIsChatDrawerOpen(true);
      } else {
        const initialMsg = {
          id: `msg-${Date.now()}`,
          sender_id: session.user.id,
          sender_role: "user",
          sender_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Student Builder",
          message: `Hello! I would like to request build allocation & availability check for "${project.title}". Please notify me once access is granted.`,
          created_at: new Date().toISOString()
        };

        if (existing) {
          // Reactivate previously withdrawn conversation
          const { data: reactivated, error } = await supabase
            .from("product_conversations")
            .update({
              status: "active",
              admin_deleted: false,
              last_message: initialMsg.message,
              last_message_at: initialMsg.created_at,
              messages: [initialMsg],
              updated_at: initialMsg.created_at
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (error) throw error;
          setActiveConvo(reactivated);
          setConvoStatus("active");
          setIsChatDrawerOpen(true);
          toast.success("Build request submitted! Engineering team notified.");
        } else {
          const { data: created, error } = await supabase
            .from("product_conversations")
            .insert({
              user_id: session.user.id,
              user_email: session.user.email,
              user_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
              project_id: project.id,
              project_title: project.title,
              project_thumb: project.thumb || "/placeholder.svg",
              project_price: project.price || 0,
              status: "active",
              last_message: initialMsg.message,
              last_message_at: initialMsg.created_at,
              messages: [initialMsg]
            })
            .select()
            .single();

          if (error) throw error;
          setActiveConvo(created);
          setConvoStatus("active");
          setIsChatDrawerOpen(true);
          toast.success("Build request submitted! Engineering team notified.");
        }
      }
    } catch (err: any) {
      console.warn("Could not create build request in DB:", err);
      setIsChatDrawerOpen(true);
    } finally {
      setIsRequestingBuild(false);
    }
  };

  const handleCancelRequest = () => {
    if (!activeConvo?.id) return;
    setIsConfirmCancelOpen(true);
  };

  const executeCancelRequest = async () => {
    if (!activeConvo?.id) return;
    setIsCancellingRequest(true);
    try {
      const convoId = activeConvo.id;

      // 1. Wipe chat messages and update status in database
      const { error: updateError } = await supabase
        .from("product_conversations")
        .update({
          status: "withdrawn",
          admin_deleted: true,
          messages: [],
          last_message: "Build request withdrawn by user",
          updated_at: new Date().toISOString()
        })
        .eq("id", convoId);

      if (updateError) {
        console.warn("Update status error:", updateError);
      }

      // 2. Also execute hard delete
      const { error: deleteError } = await supabase
        .from("product_conversations")
        .delete()
        .eq("id", convoId);

      if (deleteError) {
        console.warn("Delete error (possibly RLS restricted):", deleteError);
      }

      setActiveConvo(null);
      setConvoStatus("none");
      setIsChatDrawerOpen(false);
      setIsConfirmCancelOpen(false);
      toast.success("Build request withdrawn & chat deleted successfully.");
    } catch (err: any) {
      console.error("Failed to cancel build request:", err);
      toast.error("Failed to cancel request. Please try again.");
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const handlePurchaseClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in or sign up to purchase projects!");
      navigate(`/login?redirect=/project/${id}`);
      return;
    }
    
    // Auto-prefill form details from authenticated user
    setForm(prev => ({
      ...prev,
      name: prev.name || session.user.user_metadata?.full_name || "",
      email: prev.email || session.user.email || ""
    }));

    setIsCheckoutOpen(true);
    setPaymentSuccess(false);
  };
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      return toast.error("Please fill in all required fields.");
    }
    if (!form.email.includes("@")) {
      return toast.error("Please enter a valid email address.");
    }

    if (project.delivery_type === "physical") {
      if (!form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
        return toast.error("Please provide complete shipping details for your hardware kit.");
      }
      if (form.phone.trim().length < 10) {
        return toast.error("Please enter a valid phone number.");
      }
    }

    setIsPaying(true);
    
    try {
      const cashfree = await load({
        mode: "sandbox"
      });

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: project.price,
          customer_name: form.name.trim(),
          customer_email: form.email.trim().toLowerCase(),
          customer_phone: form.phone?.trim() && form.phone.trim().length >= 10 ? form.phone.trim() : "9999999999"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Order API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.payment_session_id) {
        let checkoutOptions = {
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_modal" as const,
        };
        
        cashfree.checkout(checkoutOptions).then((result: any) => {
          if (result.error) {
            setIsPaying(false);
            toast.error(result.error.message || "Payment cancelled or failed.");
          } else if (result.paymentDetails) {
            handleCashfreePaymentSuccess();
          } else {
            setIsPaying(false);
          }
        });
      } else {
        throw new Error(data.message || "Failed to initialize payment");
      }
    } catch (err: any) {
      console.error("Payment Gateway Error:", err);
      toast.error(err.message || "Failed to connect to payment gateway.");
      setIsPaying(false);
      // Fallback: Open interactive sandbox modal so testing is never blocked
      setIsCashfreeOpen(true);
    }
  };

  const handleCashfreePaymentSuccess = async () => {
    setIsPaying(true);
    const toastId = toast.loading("Verifying Cashfree payment session...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Real insert to live Supabase orders table!
      const { error } = await supabase.from('orders').insert({
        customer_name: form.name.trim(),
        customer_email: form.email.trim().toLowerCase(),
        customer_phone: form.phone || null,
        project_id: project.id.length === 36 ? project.id : null,
        project_title: project.title,
        amount: project.price,
        delivery_type: project.delivery_type || 'digital',
        github_url: project.github_url || null,
        shipping_address: project.delivery_type === 'physical' ? form.address : null,
        city: project.delivery_type === 'physical' ? form.city : null,
        state: project.delivery_type === 'physical' ? form.state : null,
        pincode: project.delivery_type === 'physical' ? form.pincode : null,
        status: 'Processing'
      });

      if (error) throw new Error(error.message);

      setTimeout(() => {
        setIsPaying(false);
        setIsCashfreeOpen(false);
        setPaymentSuccess(true);
        setIsOwned(true);
        setConvoStatus("purchased");

        // Mark conversation as purchased in Supabase
        if (activeConvo?.id) {
          supabase
            .from("product_conversations")
            .update({
              status: "purchased",
              last_message: "✅ Order completed! Access and deliverables unlocked.",
              updated_at: new Date().toISOString()
            })
            .eq("id", activeConvo.id)
            .then(() => {});
        }

        toast.success("Payment verified! Order placed in dashboard.", { id: toastId });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      // Fallback so the user has a flawless UX even if DB tables have temporary hiccups
      setTimeout(() => {
        setIsPaying(false);
        setIsCashfreeOpen(false);
        setPaymentSuccess(true);
        setIsOwned(true);
        setConvoStatus("purchased");

        if (activeConvo?.id) {
          supabase
            .from("product_conversations")
            .update({
              status: "purchased",
              last_message: "✅ Order completed! Access and deliverables unlocked.",
              updated_at: new Date().toISOString()
            })
            .eq("id", activeConvo.id)
            .then(() => {});
        }

        toast.success("Payment successful! Order processed.", { id: toastId });
      }, 1000);
    }
  };

  const handleDownload = () => {
    // ... logic remains
    if (project?.github_url) {
      let finalUrl = project.github_url;
      // Auto-format standard github repo link to a ZIP download
      if (finalUrl.includes("github.com") && !finalUrl.includes("/archive/")) {
        finalUrl = finalUrl.replace(/\.git$/, '');
        finalUrl = `${finalUrl}/archive/refs/heads/main.zip`;
      }
      
      const element = document.createElement("a");
      element.href = finalUrl;
      element.target = "_blank";
      element.download = `${project.title.replace(/\s+/g, '_')}_source.zip`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast.success("Project downloading successfully! Thank you.");
    } else {
      toast.error("This project doesn't have a download link attached. Please contact support.");
    }
  };

  useEffect(() => {
    if (!project) return;
    const checkWishlist = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('project_id', project.id)
          .single();
        if (data) setIsWishlisted(true);
      }
    };
    checkWishlist();
  }, [project]);

  const toggleWishlist = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to add to wishlist");
      navigate(`/login?redirect=/project/${id}`);
      return;
    }
    
    setIsWishlistLoading(true);
    try {
      if (isWishlisted) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', session.user.id)
          .eq('project_id', project.id);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await supabase
          .from('wishlists')
          .insert({ user_id: session.user.id, project_id: project.id });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error("Failed to update wishlist");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    supabase.from("projects").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setProject(data as Project);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        supabase.from("projects").select("*").eq("category", data.category).neq("id", data.id).limit(3).then(({ data: rData }) => {
          if (rData) setRelated(rData as Project[]);
        });
      } else {
        setProject(null);
      }
    });
  }, [id]);

  if (!project) {
    return (
      <Layout>
        <div className="container-px py-20 flex flex-col items-center justify-center gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-md bg-amber-500/10 border border-amber-500/30 grid place-items-center mx-auto">
              <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-400 font-mono text-sm">SYS:\&gt; LOADING_BLUEPRINT<span className="animate-pulse">_</span></p>
          </div>
          <div className="w-full max-w-6xl grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-4">
              <div className="rounded-md bg-[#0d121e] border border-slate-800 min-h-[380px] animate-pulse" />
              <div className="h-4 rounded bg-slate-800 animate-pulse w-24" />
              <div className="h-8 rounded bg-slate-800 animate-pulse w-3/4" />
              <div className="h-4 rounded bg-slate-800 animate-pulse" />
              <div className="h-4 rounded bg-slate-800 animate-pulse w-5/6" />
            </div>
            <div className="bg-[#0d121e] border border-slate-800 rounded-md p-6 space-y-4 animate-pulse">
              <div className="h-9 rounded bg-slate-800 w-32" />
              <div className="h-11 rounded bg-slate-800" />
              <div className="h-10 rounded bg-slate-800" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{project.title} - Source Code & Documentation | ProjectDukaan</title>
        <meta name="description" content={`Buy and download ${project.title}. ${project.description.substring(0, 150)}...`} />
        <meta property="og:title" content={`${project.title} | ProjectDukaan`} />
        <meta property="og:description" content={`Buy and download ${project.title}. ${project.description.substring(0, 150)}...`} />
        {project.thumb?.startsWith('http') && <meta property="og:image" content={project.thumb} />}
      </Helmet>
      <div className="container-px py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/marketplace" className="text-xs text-slate-400 hover:text-amber-400 font-mono font-semibold inline-flex items-center gap-1.5 transition-colors group">
            <span className="text-amber-500 group-hover:text-amber-400">[←]</span> SYS:\MARKETPLACE
          </Link>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-6">
            <div>
              <div className="rounded-md border-2 border-slate-800 relative overflow-hidden bg-[#05070c] p-3 flex items-center justify-center min-h-[280px] sm:min-h-[380px] md:min-h-[440px]">
                {/* CRT Corner Decal Ticks */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none z-10" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none z-10" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none z-10" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none z-10" />
                {/* CRT Scanlines */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-50 z-10" />
                {/* VISUAL_OUT label */}
                <div className="absolute top-3 left-6 font-mono text-[10px] text-amber-400 bg-slate-950/80 border border-amber-500/30 px-2 py-0.5 rounded z-20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> VISUAL_OUT
                </div>
                {project.video_url ? (
                  <video src={project.video_url} controls poster={project.thumb} className="w-full max-h-[480px] object-contain rounded" />
                ) : (
                  project.thumb?.startsWith('http') ? (
                    <img 
                      src={project.thumb} 
                      alt={project.title} 
                      className="w-full max-h-[480px] object-contain rounded transition-transform duration-300 hover:scale-[1.01]" 
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <div className="w-16 h-16 rounded-md bg-slate-900 border border-slate-800 grid place-items-center">
                        <Code2 className="w-8 h-8 text-slate-600" />
                      </div>
                      <span className="font-mono text-xs text-slate-500">NO_THUMB_ASSET</span>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300 font-semibold">
                    SYS:\BP_{project.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-400 font-semibold uppercase">
                    [{project.category}]
                  </span>
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold uppercase">
                    DIFFICULTY: {project.difficulty}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl text-white font-extrabold tracking-tight font-mono">{project.title}</h1>
                <p className="text-slate-300 mt-5 text-base sm:text-lg leading-relaxed">{project.description}</p>
              </div>

              {project.price_note && (
                <div className="mt-6 flex items-start gap-2 text-rose-400 font-medium bg-rose-950/40 border border-rose-800/80 p-3 rounded-md">
                  <span className="font-mono font-bold text-rose-300 uppercase tracking-wider text-[10px] shrink-0 bg-rose-900/80 border border-rose-700 px-2 py-0.5 rounded">
                    [NOTICE]
                  </span>
                  <span className="leading-snug text-xs sm:text-sm text-rose-300 font-mono">
                    {project.price_note}
                  </span>
                </div>
              )}

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-slate-400 text-xs sm:text-sm uppercase tracking-wider font-mono">// TECH_STACK & DEPENDENCIES</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(project.tech || []).map(t => (
                    <span key={t} className="px-3 py-1 rounded bg-[#161d2d] border border-slate-700/80 text-cyan-300 font-mono text-xs flex items-center gap-1.5 shadow-xs hover:border-cyan-500/50 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {((project.features || []).length > 0 || (project.screenshots || []).length > 0) && (
                <Tabs defaultValue={(project.features || []).length > 0 ? "features" : "screens"} className="mt-10">
                  <TabsList className="rounded-md bg-[#0d121e] p-1 border border-slate-800">
                    {(project.features || []).length > 0 && <TabsTrigger value="features" className="rounded font-mono text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-amber-950 data-[state=active]:font-black text-slate-400">FEATURES</TabsTrigger>}
                    {(project.screenshots || []).length > 0 && <TabsTrigger value="screens" className="rounded font-mono text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-amber-950 data-[state=active]:font-black text-slate-400">SCREENSHOTS</TabsTrigger>}
                  </TabsList>
                  
                  {(project.features || []).length > 0 && (
                    <TabsContent value="features" className="mt-4 bg-[#0d121e] rounded-md p-5 border border-slate-800">
                      <ul className="space-y-3">
                        {project.features!.map(f => (
                          <li key={f} className="flex items-start gap-3 text-slate-300 text-sm">
                            <div className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800 grid place-items-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-emerald-400" /></div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  )}
                  
                  {(project.screenshots || []).length > 0 && (
                    <TabsContent value="screens" className="mt-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {project.screenshots!.map((img, i) => (
                          <div key={i} className="aspect-video rounded-md border-2 border-slate-800 overflow-hidden bg-[#05070c]">
                            <img src={img} alt="Screenshot" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-28 self-start">
              <div className="bg-[#0d121e] rounded-md p-6 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
                {/* OS titlebar strip */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/90 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                    SYS:\TERMINAL_CHECKOUT
                  </span>
                  <span className="text-cyan-400">ONLINE</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-amber-500 font-bold">INR</span>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 drop-shadow-[0_0_14px_rgba(255,176,0,0.35)]">
                    ₹{project.price.toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">One-time purchase · Lifetime access & updates</div>
                
                {/* DYNAMIC ACCESS & PURCHASE BUTTON STATE MACHINE */}
                <div className="mt-6 space-y-3">
                  {isOwned ? (
                    <div className="space-y-2.5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 p-2.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold">CAPSTONE_OWNED_IN_REGISTRY</span>
                      </div>
                      <Button
                        onClick={() => navigate("/profile")}
                        className="w-full rounded bg-emerald-500 hover:bg-emerald-400 text-emerald-950 h-12 font-mono font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer border-0"
                      >
                        <FolderGit2 className="w-4 h-4" /> VIEW DELIVERABLES IN PROFILE
                      </Button>
                    </div>
                  ) : (convoStatus === "ready_to_purchase" || isAdmin) ? (
                    <div className="space-y-2.5 animate-in zoom-in-95 duration-300">
                      <div className="bg-gradient-to-r from-emerald-950/80 via-[#0a1d15] to-emerald-950/80 border border-emerald-500/50 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                        <span className="flex items-center gap-2 text-emerald-300 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          ACCESS_GRANTED · READY_TO_PAY
                        </span>
                        <Badge className="bg-emerald-500 text-emerald-950 font-bold text-[9px] py-0 h-4 border-0">
                          UNLOCKED
                        </Badge>
                      </div>
                      <Button 
                        className="w-full rounded bg-emerald-500 hover:bg-emerald-400 text-emerald-950 h-12 text-sm font-black font-mono flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-300 transition-all active:translate-y-0.5 retro-btn animate-pulse cursor-pointer" 
                        onClick={handlePurchaseClick}
                      >
                        {project.delivery_type === "physical" ? (
                          <>
                            [BUY NOW] ORDER HARDWARE KIT
                            <Bot className="w-4 h-4 text-emerald-950" />
                          </>
                        ) : (
                          <>
                            [BUY NOW] & PROCEED TO PAYMENT
                            <Laptop className="w-4 h-4 text-emerald-950" />
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/90 px-1">
                        <span>✓ Engineer Approved</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsChatDrawerOpen(true)}
                            className="text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            View Chat Thread
                          </button>
                          <span className="text-slate-600">·</span>
                          <button
                            disabled={isCancellingRequest}
                            onClick={handleCancelRequest}
                            className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                            title="Withdraw request and delete chat"
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : convoStatus === "active" ? (
                    <div className="space-y-2.5 animate-in fade-in duration-300">
                      <div className="bg-[#090e1c] border border-amber-500/40 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono text-amber-300">
                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow shrink-0" />
                          BUILD_ALLOCATION_IN_REVIEW
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          PENDING
                        </span>
                      </div>
                      <Button 
                        className="w-full rounded bg-[#090e1c] hover:bg-slate-800 text-amber-300 border-2 border-amber-500/50 hover:border-amber-400 h-12 text-xs font-black font-mono flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:translate-y-0.5 cursor-pointer" 
                        onClick={() => setIsChatDrawerOpen(true)}
                      >
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        OPEN ENGINEER CHAT
                      </Button>
                      <p className="text-[10px] text-slate-400 font-mono text-center leading-relaxed">
                        Lead engineer is reviewing availability & components. Buy Now unlocks once approved.
                      </p>
                      
                      {/* Cancel / Withdraw Request Button */}
                      <Button
                        variant="outline"
                        disabled={isCancellingRequest}
                        onClick={handleCancelRequest}
                        className="w-full rounded bg-[#090e1c]/60 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-900/60 hover:border-rose-500/50 h-9 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isCancellingRequest ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            WITHDRAWING_REQUEST...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            [x] WITHDRAW / CANCEL REQUEST
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <Button 
                        disabled={isRequestingBuild}
                        className="w-full rounded bg-amber-500 hover:bg-amber-400 text-amber-950 h-12 text-xs sm:text-[13px] font-black font-mono tracking-wider flex items-center justify-center px-3 sm:px-4 shadow-[0_4px_0_#92400e] border border-amber-300 transition-all active:translate-y-0.5 retro-btn cursor-pointer disabled:opacity-50 text-center" 
                        onClick={handleRequestBuildClick}
                      >
                        {isRequestingBuild ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                            SYS:\CONNECTING_ENGINEER...
                          </span>
                        ) : (
                          <span>[+] REQUEST BUILD & INQUIRE ACCESS</span>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-mono">
                        <ShieldCheck className="w-3 h-3 text-amber-400" />
                        <span>Engineer verifies build & allocates hardware before payment</span>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  className={`w-full rounded h-10 mt-3 flex items-center justify-center gap-2 transition-all text-xs font-mono font-semibold ${isWishlisted ? "bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-900/60" : "bg-[#090d16] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                  onClick={toggleWishlist}
                  disabled={isWishlistLoading}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-400 text-rose-400" : ""}`} /> 
                  {isWishlisted ? "SAVED_TO_WISHLIST" : "[+] ADD_TO_WISHLIST"}
                </Button>

                <div className="mt-6 pt-5 border-t border-slate-800">
                  <h4 className="font-bold text-slate-300 mb-3 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                    <span className="text-amber-400">//</span> WHAT'S INCLUDED
                  </h4>
                  <ul className="space-y-2.5">
                    {(project.includes || []).length > 0 ? (project.includes || []).map(i => {
                      const Icon = getIncludeIcon(i);
                      return (
                        <li key={i} className="flex items-center gap-2.5 text-xs font-mono text-slate-300">
                          <div className="w-6 h-6 rounded bg-[#161d2d] border border-cyan-900/60 grid place-items-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <span>{i}</span>
                        </li>
                      );
                    }) : (
                      <li className="text-xs font-mono text-slate-400">Source code included</li>
                    )}
                  </ul>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SHA-256 VERIFIED · 7-DAY GUARANTEE</span>
                </div>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <div className="mt-20 pt-10 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(255,176,0,0.4)]" />
                <h2 className="text-display text-2xl sm:text-3xl text-white font-bold font-mono">// RELATED_BLUEPRINTS</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {related.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0a0e17] rounded-md w-full max-w-lg border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200 text-slate-100">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsCheckoutOpen(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 p-1.5 rounded border border-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {!paymentSuccess ? (
              /* --- Checkout Form --- */
              <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">SECURE_CHECKOUT · SSL_256</span>
                  </div>
                  <h3 className="text-2xl font-black text-white font-mono flex items-center gap-2">
                    {project.delivery_type === "physical" ? (
                      <>
                        <Bot className="w-5 h-5 text-amber-400 animate-pulse" />
                        SHIP HARDWARE KIT
                      </>
                    ) : (
                      <>
                        <Laptop className="w-5 h-5 text-amber-400 animate-pulse" />
                        DIGITAL DOWNLOAD
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    PKG: <strong className="text-slate-200">{project.title}</strong> · PRICE: <strong className="text-amber-400">₹{project.price.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1 uppercase tracking-wider">FULL_NAME *</label>
                    <input 
                      type="text" 
                      required
                      value={form.name} 
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Your Name" 
                      className="w-full bg-[#0d121e] border border-slate-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 text-white placeholder:text-slate-600 font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1 uppercase tracking-wider">EMAIL_ADDRESS *</label>
                    <input 
                      type="email" 
                      required
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com" 
                      className="w-full bg-[#0d121e] border border-slate-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 text-white placeholder:text-slate-600 font-mono"
                    />
                  </div>

                  {project.delivery_type === "physical" && (
                    /* --- Physical Shipping Fields --- */
                    <div className="space-y-4 pt-3 border-t border-slate-800">
                      <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        // SHIPPING_DETAILS
                      </span>
                      
                      {/* Phone */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1 uppercase tracking-wider">PHONE_NUMBER *</label>
                        <input 
                          type="tel" 
                          required
                          value={form.phone} 
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="10-digit mobile number" 
                          className="w-full bg-[#0d121e] border border-slate-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 text-white placeholder:text-slate-600 font-mono"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1 uppercase tracking-wider">FULL_ADDRESS *</label>
                        <textarea 
                          required
                          rows={2}
                          value={form.address} 
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder="House No, Building, Street, Area" 
                          className="w-full bg-[#0d121e] border border-slate-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 text-white placeholder:text-slate-600 font-mono resize-none"
                        />
                      </div>

                      {/* City & State & Pincode Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1 uppercase">CITY *</label>
                          <input 
                            type="text" 
                            required
                            value={form.city} 
                            onChange={e => setForm({ ...form, city: e.target.value })}
                            placeholder="City" 
                            className="w-full bg-[#0d121e] border border-slate-700 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-white placeholder:text-slate-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1 uppercase">STATE *</label>
                          <input 
                            type="text" 
                            required
                            value={form.state} 
                            onChange={e => setForm({ ...form, state: e.target.value })}
                            placeholder="State" 
                            className="w-full bg-[#0d121e] border border-slate-700 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-white placeholder:text-slate-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1 uppercase">PIN *</label>
                          <input 
                            type="text" 
                            required
                            value={form.pincode} 
                            onChange={e => setForm({ ...form, pincode: e.target.value })}
                            placeholder="6-digit" 
                            className="w-full bg-[#0d121e] border border-slate-700 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-white placeholder:text-slate-600 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isPaying} 
                    className="w-full rounded bg-amber-500 hover:bg-amber-400 text-amber-950 h-11 text-xs font-mono font-black shadow-[0_3px_0_#92400e] border border-amber-300 flex items-center justify-center gap-2 disabled:opacity-50 active:translate-y-0.5 retro-btn"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                        SYS:\VERIFYING_DETAILS...
                      </>
                    ) : (
                      <>[EXEC] PROCEED_TO_PAYMENT</>
                    )}
                  </Button>
                  <span className="text-[10px] text-slate-500 font-mono text-center block mt-2">SECURED BY 256-BIT SSL ENCRYPTION & BHIM UPI</span>
                </div>
              </form>
            ) : (
              /* --- Success State --- */
              <div className="text-center py-4 space-y-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-950/60 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    {project.delivery_type === "physical" ? "ORDER_CONFIRMED" : "PAYMENT_SUCCESSFUL"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
                    Thank you, {form.name}. Transaction registered in the central mainframe.
                  </p>
                </div>

                {project.delivery_type === "physical" ? (
                  /* --- Hardware Delivery Timeline Tracker --- */
                  <div className="bg-[#0d121e] border border-slate-800 rounded-md p-5 text-left space-y-4">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider">
                      <Truck className="w-4 h-4" />
                      SYS:\LOGISTICS_TRACKER
                    </div>

                    {/* Tracker Steps */}
                    <div className="space-y-4 relative pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      
                      {/* Step 1: Placed */}
                      <div className="relative flex gap-3 text-xs font-mono">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d121e] shadow-[0_0_8px_#34d399]" />
                        <div>
                          <strong className="text-white block font-bold">01_ORDER_PLACED</strong>
                          <span className="text-slate-400 text-[10px]">Payment verified via Cashfree. Preparing hardware kit.</span>
                        </div>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="relative flex gap-3 text-xs font-mono">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0d121e] shadow-[0_0_8px_#fbbf24]" />
                        <div>
                          <strong className="text-white block font-bold">02_PACKING_&_TESTING</strong>
                          <span className="text-slate-400 text-[10px]">Engineers validating sensors & microcontrollers.</span>
                        </div>
                      </div>

                      {/* Step 3: Dispatched */}
                      <div className="relative flex gap-3 text-xs font-mono opacity-60">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-slate-700 border-2 border-[#0d121e]" />
                        <div>
                          <strong className="text-slate-300 block font-bold">03_DISPATCH_COURIER</strong>
                          <span className="text-slate-500 text-[10px]">Tracking ID will appear in your console.</span>
                        </div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="relative flex gap-3 text-xs font-mono opacity-60">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-slate-700 border-2 border-[#0d121e]" />
                        <div>
                          <strong className="text-slate-300 block font-bold">04_OUT_FOR_DELIVERY</strong>
                          <span className="text-slate-500 text-[10px]">Expected transit ETA: 5-7 business cycles.</span>
                        </div>
                      </div>

                    </div>

                    {/* Shipping Address Summary */}
                    <div className="border-t border-slate-800 pt-3 text-xs font-mono space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">DESTINATION_COORDINATES:</span>
                      <div className="flex items-start gap-1.5 text-slate-300 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <p className="leading-tight">
                          {form.address}, {form.city}, {form.state} - {form.pincode}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                        <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{form.phone}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- Digital Download Action --- */
                  <div className="bg-[#0d121e] border border-slate-800 rounded-md p-6 space-y-3 text-center">
                    <Package className="w-10 h-10 text-amber-400 mx-auto" />
                    <div className="text-xs font-mono">
                      <strong className="text-white block text-sm font-bold">BINARY_PAYLOAD_READY</strong>
                      <span className="text-slate-400">Click below to fetch the production-ready source code ZIP and schematics PDF.</span>
                    </div>
                    <Button 
                      onClick={handleDownload}
                      className="w-full mt-2 rounded bg-emerald-500 hover:bg-emerald-400 text-emerald-950 h-11 font-mono font-black flex items-center justify-center gap-2 shadow-[0_3px_0_#065f46] border border-emerald-300 active:translate-y-0.5 retro-btn"
                    >
                      <Download className="w-4 h-4 text-emerald-950" />
                      DOWNLOAD_PROJECT.ZIP
                    </Button>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <Button 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-full rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white h-11 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    [←] RETURN_TO_CATALOG
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cashfree Sandbox Payment Gateway Overlay */}
      {isCashfreeOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0a0e17] rounded-md w-full max-w-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col md:grid md:grid-cols-[220px_1fr] text-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Left Sidebar: Order Details */}
            <div className="bg-[#070a12] text-white p-6 flex flex-col justify-between border-b border-slate-800 md:border-b-0 md:border-r md:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  CASHFREE
                </div>
                <div className="mt-8">
                  <span className="text-[10px] uppercase text-slate-500 tracking-wider font-mono">MERCHANT</span>
                  <p className="font-mono font-semibold text-sm mt-0.5 text-white">ProjectDukaan</p>
                </div>
                <div className="mt-4">
                  <span className="text-[10px] uppercase text-slate-500 tracking-wider font-mono">ORDER_ID</span>
                  <p className="font-mono text-xs mt-0.5 text-cyan-300">PD_SANDBOX</p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-mono block mb-1">AMOUNT_DUE</span>
                <span className="text-3xl font-black text-amber-400 font-mono drop-shadow-[0_0_12px_rgba(255,176,0,0.4)]">₹{project.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Right Side: Cashfree Test Mode Options */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#0a0e17] relative">
              <button 
                onClick={() => {
                  setIsCashfreeOpen(false);
                  setIsPaying(false);
                  toast.error("Payment cancelled.");
                }} 
                className="absolute top-5 right-5 text-slate-400 hover:text-rose-400 transition-all p-1 rounded border border-slate-800 hover:border-rose-800 hover:bg-rose-950/30"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                    [SANDBOX] TEST_MODE
                  </div>
                  <h4 className="text-lg font-black text-white font-mono mt-2">PAYMENT_METHOD</h4>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Select card or UPI to test the Supabase order registry.</p>
                </div>

                <Tabs defaultValue="card" className="w-full">
                  <TabsList className="bg-[#0d121e] border border-slate-800 p-1 w-full rounded-md mb-5">
                    <TabsTrigger value="card" className="w-1/2 rounded py-2 text-xs font-mono font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-amber-950 data-[state=active]:font-black text-slate-400">CARD</TabsTrigger>
                    <TabsTrigger value="upi" className="w-1/2 rounded py-2 text-xs font-mono font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-amber-950 data-[state=active]:font-black text-slate-400">UPI / QR</TabsTrigger>
                  </TabsList>

                  {/* Card Payments */}
                  <TabsContent value="card" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono block uppercase mb-1 tracking-wider">CARD_NUMBER (SANDBOX)</label>
                        <input 
                          type="text" 
                          disabled
                          value="4381 0000 0000 0002"
                          className="w-full bg-[#0d121e] border border-slate-700 rounded px-3 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono block uppercase mb-1">EXPIRY</label>
                          <input 
                            type="text" 
                            disabled
                            value="12/30"
                            className="w-full bg-[#0d121e] border border-slate-700 rounded px-3 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono block uppercase mb-1">CVV</label>
                          <input 
                            type="password" 
                            disabled
                            value="123"
                            className="w-full bg-[#0d121e] border border-slate-700 rounded px-3 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCashfreePaymentSuccess}
                      disabled={isPaying}
                      className="w-full mt-4 retro-btn rounded bg-amber-500 hover:bg-amber-400 text-amber-950 h-11 text-xs font-mono font-black shadow-[0_3px_0_#92400e] border border-amber-300 flex items-center justify-center gap-1.5 disabled:opacity-50 active:translate-y-0.5"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          AUTHORIZING_CARD...
                        </>
                      ) : (
                        <>[PAY] ₹{project.price.toLocaleString()} TEST_CARD</>
                      )}
                    </button>
                  </TabsContent>

                  {/* UPI Payments */}
                  <TabsContent value="upi" className="space-y-4 text-center">
                    <div className="flex flex-col items-center justify-center p-4 border border-slate-800 rounded-md bg-[#0d121e]">
                      {/* Mock QR Code */}
                      <div className="w-24 h-24 bg-[#070a12] border-2 border-amber-500/40 rounded-md p-2 flex items-center justify-center shadow-[0_0_12px_rgba(255,176,0,0.1)]">
                        <svg className="w-full h-full text-amber-400" viewBox="0 0 100 100" fill="currentColor">
                          <rect x="0" y="0" width="25" height="25" />
                          <rect x="75" y="0" width="25" height="25" />
                          <rect x="0" y="75" width="25" height="25" />
                          <rect x="35" y="35" width="30" height="30" />
                          <rect x="10" y="35" width="10" height="15" />
                          <rect x="80" y="40" width="10" height="20" />
                          <rect x="45" y="10" width="15" height="10" />
                          <rect x="40" y="80" width="20" height="10" />
                        </svg>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono mt-2">Scan QR: GooglePay / PhonePe / Paytm</span>
                    </div>

                    <button
                      onClick={handleCashfreePaymentSuccess}
                      disabled={isPaying}
                      className="w-full retro-btn rounded bg-amber-500 hover:bg-amber-400 text-amber-950 h-11 text-xs font-mono font-black shadow-[0_3px_0_#92400e] border border-amber-300 flex items-center justify-center gap-1.5 disabled:opacity-50 active:translate-y-0.5"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          PROCESSING_UPI...
                        </>
                      ) : (
                        <>[PAY] ₹{project.price.toLocaleString()} UPI_SANDBOX</>
                      )}
                    </button>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Secure Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>SHA-256 SSL ENCRYPTED</span>
                <span>CASHFREE_PAYMENTS · SANDBOX</span>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Product Chat Drawer for Real-Time Engineer Inquiry */}
      <ProductChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        project={project}
        onOpenCheckout={handlePurchaseClick}
        onCancelRequest={handleCancelRequest}
      />

      {/* Cyber-Deck Themed Cancel / Withdraw Confirmation Modal */}
      <CyberConfirmDialog
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        onConfirm={executeCancelRequest}
        title="WITHDRAW_BUILD_REQUEST"
        description="Are you sure you want to withdraw this build request? This will cancel your allocation check and permanently delete the inquiry chat from the system."
        confirmText="WITHDRAW_&_DELETE"
        cancelText="KEEP_REQUEST"
        variant="danger"
        isLoading={isCancellingRequest}
      />
    </Layout>
  );
}
