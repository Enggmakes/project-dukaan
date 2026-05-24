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
          className="absolute top-[22%] left-[4%] w-32 h-32 rounded-full blur-[50px] animate-drift-1"
          style={{ 
            backgroundColor: "rgba(110, 91, 255, 0.16)"
          }}
        />
        
        {/* Middle Right - Tiny Floating Faint Pink Radial */}
        <div 
          className="absolute top-[44%] right-[6%] w-40 h-40 rounded-full blur-[60px] animate-drift-2"
          style={{ 
            backgroundColor: "rgba(244, 63, 94, 0.14)"
          }}
        />
        
        {/* Lower Left - Tiny Floating Subtle Mesh Glow */}
        <div 
          className="absolute top-[76%] left-[5%] w-36 h-36 rounded-full blur-[55px] animate-drift-3"
          style={{ 
            backgroundColor: "rgba(139, 92, 246, 0.13)"
          }}
        />
      </div>


      <main className="flex-1 pt-24 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}

