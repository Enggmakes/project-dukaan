import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

import Index from "./pages/Index.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import ProjectDetails from "./pages/ProjectDetails.tsx";
import CustomRequest from "./pages/CustomRequest.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Auth from "./pages/Auth.tsx";
import Profile from "./pages/Profile.tsx";
import Wishlist from "./pages/Wishlist.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import GravityLab from "./pages/GravityLab.tsx";
import NotFound from "./pages/NotFound.tsx";

import { HelmetProvider } from "react-helmet-async";
import GlobalTechParticles from "@/components/GlobalTechParticles";
import ScrollToTop from "@/components/ScrollToTop";
import SmartSchemeModal from "@/components/SmartSchemeModal";

const queryClient = new QueryClient();

// Global listener to route password recovery links to /reset-password from anywhere
function AuthRecoveryListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Detect if recovery tokens or recovery errors landed on root or any subpage
    const hash = window.location.hash || "";
    const search = window.location.search || "";

    const hasRecoverySignals =
      hash.includes("type=recovery") ||
      search.includes("type=recovery") ||
      hash.includes("error_code=otp_expired") ||
      search.includes("error_code=otp_expired") ||
      hash.includes("error=access_denied");

    if (hasRecoverySignals && location.pathname !== "/reset-password") {
      navigate(`/reset-password${search}${hash}`, { replace: true });
    }

    // 2. Listen to Supabase auth events (e.g. PASSWORD_RECOVERY event)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (window.location.pathname !== "/reset-password") {
          navigate("/reset-password");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  return null;
}

// Premium App router and state provider configuration
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GlobalTechParticles />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthRecoveryListener />
          <ScrollToTop />
          <SmartSchemeModal />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/custom-request" element={<CustomRequest />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/gravity" element={<GravityLab />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
