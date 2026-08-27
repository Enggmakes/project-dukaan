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
      <div className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="container-px max-w-4xl mx-auto text-center">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">Legal</span>
          <h1 className="text-display text-5xl md:text-7xl text-slate-900 font-bold mt-4">Privacy Policy</h1>
          <p className="text-slate-600 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
            Last Updated: May 23, 2026. Learn how we handle, secure, and protect your digital library assets and personal registry.
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
            <h4 className="text-lg font-bold text-slate-900 mb-2">Have questions about your data?</h4>
            <p className="text-sm text-slate-600">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal registry, please reach out via our <a href="/contact" className="text-indigo-600 hover:underline font-semibold">Contact Form</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
