import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { FileText, Award, AlertTriangle, Scale } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  const sections = [
    {
      icon: FileText,
      title: "1. Acceptable Terms & Usage",
      content: "Welcome to ProjectDukaan. By registering an account, purchasing premium engineering blueprints, or commissioning a custom hardware build, you explicitly agree to follow and be bound by these Terms of Service."
    },
    {
      icon: Award,
      title: "2. Single-Use Educational License",
      content: "All purchased digital codebases (.zip), circuit diagrams, 3D CAD schematics, and testing documentation are granted under a strictly educational, single-user license. Commercial redistribution, resale, or publishing ProjectDukaan files to public repositories (such as public GitHub repos) is strictly prohibited."
    },
    {
      icon: AlertTriangle,
      title: "3. Digital Refund & Shipping Policy",
      content: "Due to the instantaneous delivery and reproducible nature of source-code blueprints, all sales of digital files are final and non-refundable. For physical hardware projects, refunds or replacement calibrations are eligible only prior to shipping dispatch via our DTDC registry courier."
    },
    {
      icon: Scale,
      title: "4. Limitations of Liability",
      content: "ProjectDukaan provides premium engineering reference materials. We are not responsible or liable for any university grading outcomes, academic policy violations, or physical component damage/injuries caused during live hardware calibration and testing."
    }
  ];

  return (
    <Layout>
      <Helmet>
        <title>Terms of Service - ProjectDukaan</title>
        <meta name="description" content="Understand the licensing rules, single-use educational limits, download boundaries, and terms of service for purchasing premium engineering blueprints on ProjectDukaan." />
      </Helmet>
      <div className="py-16 bg-[#070a12] border-b border-slate-800 relative overflow-hidden">
        <div className="container-px max-w-4xl mx-auto text-center relative z-10">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-950/60 border border-amber-800 px-3 py-1 rounded">SYS:\LEGAL_DISCLAIMER</span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-white font-black mt-4 font-mono">TERMS_OF_SERVICE</h1>
          <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-mono">
            Last Updated: 2026. Understand your licensing rights, download boundaries, and client responsibilities.
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
            <h4 className="text-base font-bold text-white mb-2 font-mono">// NEED_LICENSING_CLARIFICATION?</h4>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              If you have any questions regarding intellectual property rights, custom milestone contracts, or download limitations, please reach out via our <a href="/contact" className="text-amber-400 hover:underline font-bold">[CONTACT_FORM]</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
