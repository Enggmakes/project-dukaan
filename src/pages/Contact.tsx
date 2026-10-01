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
      <div className="py-14 bg-slate-50 border-b border-slate-200/80">
        <div className="container-px max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-slate-900 font-extrabold tracking-tight">Direct Engineering Support</h1>
          <p className="text-slate-600 mt-3 text-base sm:text-lg font-medium">Architecture consultation, hardware logistics, or custom requests — we inspect every inquiry.</p>
        </div>
      </div>

      <section className="container-px py-14">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_360px] gap-8">
          <form onSubmit={submit} className="tech-card bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Transmit Message</h2>
            <div>
              <Label className="text-slate-700 font-semibold text-xs mb-1 block">Full Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Engineering Lead / Student Name" className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg text-sm" />
            </div>
            <div>
              <Label className="text-slate-700 font-semibold text-xs mb-1 block">Work / College Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="engineer@domain.com" className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg text-sm" />
            </div>
            <div>
              <Label className="text-slate-700 font-semibold text-xs mb-1 block">Project Scope / Technical Inquiry</Label>
              <Textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Specify required models, dataset sizes, target embedded hardware (e.g. Jetson Orin / ESP32), or thesis guidelines..." className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg text-sm" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 h-10 shadow-xs transition-all">
              <Send className="w-4 h-4 mr-2" /> {isSubmitting ? "Transmitting..." : "Send Message"}
            </Button>
          </form>

          <aside className="space-y-4">
            {[
              { icon: Mail, label: "Direct Inquiries", value: "team@projectdukaan.vercel.app" },
              { icon: Phone, label: "Technical Hotline", value: "+91 77569 37861" },
              { icon: MapPin, label: "Hardware Lab & Logistics", value: "Pune, Maharashtra, India" },
            ].map(i => (
              <div key={i.label} className="tech-card bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center text-blue-600"><i.icon className="w-4 h-4" /></div>
                <div className="text-xs text-slate-400 font-mono mt-3">{i.label}</div>
                <div className="text-slate-900 font-semibold text-sm mt-0.5">{i.value}</div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </Layout>
  );
}
