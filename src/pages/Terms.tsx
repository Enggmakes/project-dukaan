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
      <div className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="container-px max-w-4xl mx-auto text-center">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">Rules</span>
          <h1 className="text-display text-5xl md:text-7xl text-slate-900 font-bold mt-4">Terms of Service</h1>
          <p className="text-slate-600 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
            Last Updated: May 23, 2026. Understand your licensing rights, download boundaries, and client responsibilities.
          </p>
        </div>
      </div>

      <section className="container-px py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-10">
            {sections.map((s, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-6 items-start p-6 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-600 shrink-0">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{s.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-slate-50 rounded-3xl border border-slate-200">
            <h4 className="text-lg font-bold text-slate-900 mb-2">Need clarification on licensing?</h4>
            <p className="text-sm text-slate-600">
              If you have any questions regarding intellectual property rights, custom milestone contracts, or download limitations, please reach out via our <a href="/contact" className="text-indigo-600 hover:underline font-semibold">Contact Form</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
