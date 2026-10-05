import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(1000),
});

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return toast.error(r.error.errors[0].message);
    
    setIsSubmitting(true);
    const toastId = toast.loading("Sending your message...");

    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name,
        email: form.email,
        message: form.message
      });

      if (error) throw new Error(error.message);

      toast.success("Message sent! We'll reply within 24 hours.", { id: toastId });
      setForm({ name: "", email: "", message: "" });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Contact Us | ProjectDukaan</title>
        <meta name="description" content="Get in touch with the ProjectDukaan team. For sales queries, support, or partnership proposals, we respond within 24 hours." />
        <meta name="keywords" content="contact projectdukaan, project support, final year project help, sales contact" />
        <link rel="canonical" href="https://projectdukaan.vercel.app/contact" />
      </Helmet>
      <div className="py-14 bg-[#070a12] border-b border-slate-800 relative overflow-hidden">
        <div className="container-px max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-950/60 border border-amber-800 text-xs text-amber-400 font-mono font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SYS:\TRANSMISSION_STATION
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-white font-black tracking-tight font-mono">DIRECT_ENGINEERING_SUPPORT</h1>
          <p className="text-slate-400 mt-3 text-sm sm:text-base font-mono">Architecture consultation, hardware logistics, or custom requests — we inspect every inquiry.</p>
        </div>
      </div>

      <section className="container-px py-14 font-mono">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_360px] gap-8">
          <form onSubmit={submit} className="bg-[#0a0e17] rounded-md p-6 sm:p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden space-y-5">
            {/* CRT Corner Decal Ticks */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
            
            <h2 className="text-lg sm:text-xl font-bold text-white font-mono flex items-center gap-2">
              <span className="text-amber-400">//</span> TRANSMIT_MESSAGE
            </h2>
            <div>
              <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-1 block font-mono">FULL_NAME *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Engineering Lead / Student Name" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded text-sm font-mono" />
            </div>
            <div>
              <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-1 block font-mono">WORK / COLLEGE EMAIL *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="engineer@domain.com" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded text-sm font-mono" />
            </div>
            <div>
              <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-1 block font-mono">TECHNICAL_INQUIRY_PAYLOAD *</Label>
              <Textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Specify required models, dataset sizes, target embedded hardware (e.g. Jetson Orin / ESP32), or thesis guidelines..." className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded text-sm font-mono" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-mono font-black px-6 h-11 text-xs shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn transition-all">
              <Send className="w-4 h-4 mr-2 text-amber-950" /> {isSubmitting ? "TRANSMITTING..." : "[EXEC] SEND_TRANSMISSION"}
            </Button>
          </form>

          <aside className="space-y-4">
            {[
              { icon: Mail, label: "Direct Inquiries", value: "team@projectdukaan.vercel.app" },
              { icon: Phone, label: "Technical Hotline", value: "+91 77569 37861" },
              { icon: MapPin, label: "Hardware Lab & Logistics", value: "Pune, Maharashtra, India" },
            ].map(i => (
              <div key={i.label} className="bg-[#0d121e] rounded-md p-5 border-2 border-slate-800 shadow-xl font-mono">
                <div className="w-9 h-9 rounded bg-[#161d2d] border border-cyan-800/80 grid place-items-center text-cyan-400"><i.icon className="w-4 h-4" /></div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-3">{i.label}</div>
                <div className="text-white font-mono font-semibold text-xs sm:text-sm mt-0.5">{i.value}</div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </Layout>
  );
}
