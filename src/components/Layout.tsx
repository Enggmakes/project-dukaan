import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-background z-0 isolate">
      <Navbar />

      {/* Subtle Atmospheric Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Upper Left - Tiny Floating Blurred Purple Orb */}
        <div 
          className="absolute top-[22%] -left-[5%] w-56 h-56 rounded-full blur-[45px] animate-drift-1"
          style={{ 
            backgroundColor: "rgba(110, 91, 255, 0.24)"
          }}
        />
        
        {/* Middle Right - Tiny Floating Faint Pink Radial */}
        <div 
          className="absolute top-[44%] -right-[5%] w-64 h-64 rounded-full blur-[55px] animate-drift-2"
          style={{ 
            backgroundColor: "rgba(244, 63, 94, 0.18)"
          }}
        />
        
        {/* Lower Left - Tiny Floating Subtle Mesh Glow */}
        <div 
          className="absolute top-[76%] -left-[5%] w-60 h-60 rounded-full blur-[50px] animate-drift-3"
          style={{ 
            backgroundColor: "rgba(139, 92, 246, 0.2)"
          }}
        />
      </div>


      <main className="flex-1 pt-24 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}

