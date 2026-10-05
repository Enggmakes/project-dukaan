import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { Shield, Eye, Lock, Globe } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Privacy() {
  const sections = [
    {
      icon: Shield,
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us when registering an account, purchasing premium project blueprints, or requesting custom hardware builds. This includes your name, email address, phone number, shipping address (for physical kits), and communication history."
    },
    {
      icon: Eye,
      title: "2. How We Use Your Data",
      content: "We use the collected information to process transactions, deliver instant digital ZIP downloads, dispatch hardware kits via our tracking courier registry, and notify you when new premium projects align with your engineering interests."
    },
    {
      icon: Lock,
      title: "3. Source Code & Project Protection",
      content: "At ProjectDukaan, your custom request blueprints, diagrams, and project details are treated with absolute confidentiality. We do not sell, rent, or distribute your custom engineering requests or uploaded academic reference documents with external third parties."
    },
    {
      icon: Globe,
      title: "4. Data Security & Integrity",
      content: "We implement advanced security measures including SSL encryption, tokenized payment gateways, and secure Supabase database authentication to guard your account, personal data registry, and digital license keys from unauthorized access."
    }
  ];

  return (
    <Layout>
      <Helmet>
        <title>Privacy Policy - ProjectDukaan</title>
        <meta name="description" content="Read the Privacy Policy of ProjectDukaan. Learn how we handle, secure, and protect your digital library assets and personal registry." />
      </Helmet>
      <div className="py-16 bg-[#070a12] border-b border-slate-800 relative overflow-hidden">
        <div className="container-px max-w-4xl mx-auto text-center relative z-10">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-950/60 border border-amber-800 px-3 py-1 rounded">SYS:\PRIVACY_PROTOCOL</span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-white font-black mt-4 font-mono">PRIVACY_POLICY</h1>
          <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-mono">
            Last Updated: 2026. Learn how we handle, secure, and protect your digital library assets and personal registry.
          </p>
        </div>
      </div>

      <section className="container-px py-16 bg-[#070a12] font-mono">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6">
            {sections.map((s, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-6 items-start p-6 bg-[#0d121e] rounded-md border-2 border-slate-800 shadow-xl relative overflow-hidden">
                <div className="w-10 h-10 rounded bg-[#161d2d] border border-cyan-800/80 grid place-items-center text-cyan-400 shrink-0">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white font-mono">// {s.title.toUpperCase()}</h3>
                  <p className="text-slate-300 leading-relaxed text-xs sm:text-sm font-mono">{s.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-[#0a0e17] rounded-md border-2 border-slate-800 shadow-xl relative overflow-hidden">
            <h4 className="text-base font-bold text-white mb-2 font-mono">// DATA_INTEGRITY_INQUIRIES</h4>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal registry, please reach out via our <a href="/contact" className="text-amber-400 hover:underline font-bold">[CONTACT_FORM]</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
