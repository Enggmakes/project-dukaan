import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Navbar />

      {/* Subtle Atmospheric Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20">
        {/* Upper Left - Blurred Purple Orb */}
        <div 
          className="absolute top-[18%] -left-[20%] w-[600px] h-[600px] rounded-full blur-[130px] animate-float"
          style={{ 
            backgroundColor: "rgba(110, 91, 255, 0.035)",
            animationDuration: "20s" 
          }}
        />
        
        {/* Middle Right - Faint Pink Radial */}
        <div 
          className="absolute top-[48%] -right-[15%] w-[700px] h-[700px] rounded-full blur-[150px] animate-float"
          style={{ 
            backgroundColor: "rgba(255, 182, 193, 0.025)",
            animationDuration: "26s", 
            animationDelay: "-4s" 
          }}
        />
        
        {/* Lower Left - Subtle Mesh Glow */}
        <div 
          className="absolute top-[75%] -left-[10%] w-[650px] h-[650px] rounded-full blur-[140px] animate-float"
          style={{ 
            backgroundColor: "rgba(139, 92, 246, 0.025)",
            animationDuration: "23s", 
            animationDelay: "-8s" 
          }}
        />
      </div>

      <main className="flex-1 pt-24 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}

