import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="crt-scanline-overlay" aria-hidden="true" />
      <Navbar />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}

