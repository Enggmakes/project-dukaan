import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Upload, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CATEGORIES } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(120),
  phone: z.string().trim().min(7, "Invalid phone").max(20),
  college: z.string().trim().max(120).optional().or(z.literal("")),
  title: z.string().trim().min(3, "Title too short").max(120),
  category: z.string().min(1, "Pick a category"),
  description: z.string().trim().min(20, "Tell us more (20+ chars)").max(2000),
  tech: z.string().trim().max(200).optional().or(z.literal("")),
  budget: z.string().min(1, "Select a budget"),
  deadline: z.string().min(1, "Pick a deadline"),
  notes: z.string().max(500).optional().or(z.literal("")),
  contact: z.string(),
});

type FormData = z.infer<typeof schema>;

const steps = ["Your info", "Project details", "Scope & budget", "Review"];

export default function CustomRequest() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<FormData>({
    fullName: "", email: "", phone: "", college: "", title: "", category: "",
    description: "", tech: "", budget: "", deadline: "", notes: "", contact: "email",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      const allowedExtensions = ["pdf", "docx", "png", "jpg", "jpeg"];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        toast.error("Only PDF, DOCX, PNG, and JPG files are allowed");
        return;
      }
      setSelectedFile(file);
    }
  };

  const set = (k: keyof FormData, v: string) => setData(d => ({ ...d, [k]: v }));

  const validateStep = (): boolean => {
    const stepFields: Record<number, (keyof FormData)[]> = {
      0: ["fullName", "email", "phone"],
      1: ["title", "category", "description"],
      2: ["budget", "deadline"],
      3: [],
    };
    const fields = stepFields[step];
    const partial = Object.fromEntries(fields.map(f => [f, data[f]]));
    const result = schema.partial().safeParse(partial);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return false;
    }
    // Manually check required for this step
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = data[f] as string;
      const full = schema.shape[f];
      const r = full.safeParse(v);
      if (!r.success) errs[f] = r.error.errors[0].message;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => validateStep() && setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    const result = schema.safeParse(data);
    if (!result.success) { toast.error("Please complete required fields"); return; }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your request...");
    
    try {
      let documentUrl = null;
      if (selectedFile) {
        toast.loading("Uploading requirement document...", { id: toastId });
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `custom-requests/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('requirements-files')
          .upload(filePath, selectedFile);
          
        if (uploadError) throw new Error("File upload failed: " + uploadError.message);
        
        const { data: publicUrlData } = supabase.storage
          .from('requirements-files')
          .getPublicUrl(filePath);
          
        documentUrl = publicUrlData.publicUrl;
      }

      toast.loading("Submitting project details...", { id: toastId });

      const { error } = await supabase.from('custom_requests').insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        college: data.college || null,
        title: data.title,
        category: data.category,
        description: data.description,
        tech: data.tech || null,
        budget: data.budget,
        deadline: data.deadline,
        contact_method: data.contact,
        notes: data.notes || null,
        document_url: documentUrl
      });

      if (error) throw new Error(error.message);

      // Send email notification via EmailJS
      const emailParams = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        college: data.college || "N/A",
        title: data.title,
        category: data.category,
        tech: data.tech || "N/A",
        budget: data.budget,
        deadline: data.deadline,
        description: data.description,
        notes: data.notes || "None",
        contact: data.contact,
        documentUrl: documentUrl || "None"
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        emailParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      toast.success("Request submitted successfully!", { id: toastId });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className="container-px py-20">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-[#0a0e17] rounded-md p-10 border-2 border-slate-800 shadow-2xl text-center relative overflow-hidden font-mono">
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
            <div className="w-14 h-14 rounded-full bg-emerald-950/60 border-2 border-emerald-500/50 grid place-items-center mx-auto text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.3)]">
              <Check className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl text-white font-extrabold mt-6 font-mono">SYS:\REQUEST_DISPATCHED</h1>
            <p className="text-slate-300 mt-2 text-sm sm:text-base font-medium">Our engineering team has received your technical specifications.</p>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">We typically reply within 24 hours with architectural breakdown, hardware BOM, and delivery schedule.</p>
            <Button className="mt-8 rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-mono font-black px-6 h-11 text-xs shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn" onClick={() => { setSubmitted(false); setStep(0); }}>[+] SUBMIT_ANOTHER_BLUEPRINT</Button>
          </motion.div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Request Custom AI, ML, IoT Project | ProjectDukaan</title>
        <meta name="description" content="Can't find the project blueprint you need? Request a custom build from ProjectDukaan. Our team designs, builds, and delivers within 7 days." />
        <meta name="keywords" content="request custom project, custom AI development, custom ML development, IoT prototype build, robotics custom project, engineering support" />
        <link rel="canonical" href="https://projectdukaan.vercel.app/custom-request" />
      </Helmet>
      <div className="py-14 bg-[#070a12] border-b border-slate-800 relative overflow-hidden">
        <div className="container-px max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-950/60 border border-amber-800 text-xs text-amber-400 font-mono font-semibold mb-5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> SYS:\CUSTOM_ARCHITECTURE_STUDIO
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-white font-extrabold tracking-tight font-mono">REQUEST_CUSTOM_BUILD</h1>
          <p className="text-slate-400 mt-3 text-base sm:text-lg font-mono">Tell us what you need — our technical leads will design, build & deliver.</p>
        </div>
      </div>

      <section className="container-px py-12">
        <div className="max-w-3xl mx-auto font-mono">
          {/* Stepper */}
          <div className="relative mb-8">
            {/* Progress Lines Container */}
            <div className="absolute left-[18px] right-[18px] h-0.5 -translate-y-1/2 z-0" style={{ top: "18px" }}>
              {/* Background Line */}
              <div className="absolute inset-0 bg-slate-800" />
              {/* Active Progress Line */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-amber-500 transition-all duration-500 ease-in-out shadow-[0_0_8px_#f59e0b]"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Step Circles */}
            <div className="flex items-center justify-between relative z-10">
              {steps.map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded grid place-items-center text-xs font-mono font-bold transition-all ${
                    i < step ? "bg-amber-500 text-amber-950 font-black shadow-[0_0_8px_rgba(255,176,0,0.4)]" : i === step ? "bg-amber-500 text-amber-950 font-black border-2 border-amber-300 ring-2 ring-amber-500/30" : "bg-[#0d121e] text-slate-500 border border-slate-700"
                  }`}>
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block font-mono uppercase ${i === step ? "text-amber-400 font-bold" : "text-slate-500"}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a0e17] rounded-md p-6 sm:p-8 md:p-10 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
            {/* CRT Corner Decal Ticks */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {step === 0 && (
                  <div className="space-y-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">// 01_CLIENT_INFORMATION</h2>
                    <Field label="Full name *" error={errors.fullName}><Input value={data.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Jane Doe" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" /></Field>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Email *" error={errors.email}><Input type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" /></Field>
                      <Field label="Phone *" error={errors.phone}><Input value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98xxxx0000" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" /></Field>
                    </div>
                    <Field label="College / Company" error={errors.college}><Input value={data.college} onChange={e => set("college", e.target.value)} placeholder="IIT Delhi" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" /></Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">// 02_PROJECT_SPECIFICATIONS</h2>
                    <Field label="Project title *" error={errors.title}><Input value={data.title} onChange={e => set("title", e.target.value)} placeholder="AI-powered crop disease detector" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" /></Field>
                    <Field label="Domain / Category *" error={errors.category}>
                      <Select value={data.category} onValueChange={v => set("category", v)}>
                        <SelectTrigger className="bg-[#0d121e] border-slate-700 text-white font-mono rounded"><SelectValue placeholder="Pick a category" /></SelectTrigger>
                        <SelectContent className="bg-[#0d121e] border-slate-800 text-white font-mono rounded-md shadow-xl">
                          {CATEGORIES.map(c => <SelectItem key={c} value={c} className="hover:bg-slate-800 focus:bg-slate-800">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Project description *" error={errors.description}>
                      <Textarea rows={5} value={data.description} onChange={e => set("description", e.target.value)} placeholder="What should the project do? Who is it for?" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" />
                    </Field>
                    <Field label="Technologies required" error={errors.tech}><Input value={data.tech} onChange={e => set("tech", e.target.value)} placeholder="Python, TensorFlow, React" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" /></Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">// 03_SCOPE_&_BUDGET</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Budget range *" error={errors.budget}>
                        <Select value={data.budget} onValueChange={v => set("budget", v)}>
                          <SelectTrigger className="bg-[#0d121e] border-slate-700 text-white font-mono rounded"><SelectValue placeholder="Select budget" /></SelectTrigger>
                          <SelectContent className="bg-[#0d121e] border-slate-800 text-white font-mono rounded-md shadow-xl">
                            <SelectItem value="<5k" className="hover:bg-slate-800 focus:bg-slate-800">Under ₹5,000</SelectItem>
                            <SelectItem value="5k-15k" className="hover:bg-slate-800 focus:bg-slate-800">₹5,000 – ₹15,000</SelectItem>
                            <SelectItem value="15k-50k" className="hover:bg-slate-800 focus:bg-slate-800">₹15,000 – ₹50,000</SelectItem>
                            <SelectItem value="50k+" className="hover:bg-slate-800 focus:bg-slate-800">₹50,000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Deadline *" error={errors.deadline}><Input type="date" value={data.deadline} onChange={e => set("deadline", e.target.value)} className="bg-[#0d121e] border-slate-700 text-white rounded font-mono" /></Field>
                    </div>
                    <Field label="Upload requirement documents">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-md p-8 text-center transition-all cursor-pointer relative ${
                          isDragging ? "border-amber-400 bg-amber-950/20 scale-[1.01]" : "border-slate-700 hover:border-amber-500 bg-[#0d121e]"
                        }`}
                      >
                        {selectedFile ? (
                          <div className="space-y-2">
                            <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                            <p className="text-sm font-semibold text-white font-mono">{selectedFile.name}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="text-xs text-rose-400 hover:underline mt-2 block mx-auto font-semibold font-mono"
                            >
                              [REMOVE_FILE]
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-200 font-mono">Drop files or click to browse</p>
                            <p className="text-xs text-slate-500 mt-1 font-mono">PDF, DOCX, PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error("File size exceeds 10MB limit");
                              return;
                            }
                            setSelectedFile(file);
                          }
                        }}
                        className="hidden" 
                        accept=".pdf,.docx,.png,.jpg,.jpeg"
                      />
                    </Field>
                    <Field label="Preferred contact method">
                      <RadioGroup value={data.contact} onValueChange={v => set("contact", v)} className="flex gap-4">
                        {["email", "phone", "whatsapp"].map(c => (
                          <label key={c} className="flex items-center gap-2 capitalize text-sm cursor-pointer font-medium text-slate-300 font-mono">
                            <RadioGroupItem value={c} className="border-slate-600 text-amber-500 data-[state=checked]:border-amber-400" /> {c}
                          </label>
                        ))}
                      </RadioGroup>
                    </Field>
                    <Field label="Additional notes" error={errors.notes}>
                      <Textarea rows={3} value={data.notes} onChange={e => set("notes", e.target.value)} placeholder="Anything else we should know?" className="bg-[#0d121e] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500 rounded font-mono" />
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">// 04_REVIEW_&_TRANSMIT</h2>
                    <div className="bg-[#0d121e] rounded-md p-5 space-y-2.5 text-sm border border-slate-800 font-mono">
                      <Row label="Name" value={data.fullName} />
                      <Row label="Email" value={data.email} />
                      <Row label="Phone" value={data.phone} />
                      <Row label="College/Company" value={data.college || "—"} />
                      <Row label="Project" value={data.title} />
                      <Row label="Category" value={data.category} />
                      <Row label="Budget" value={data.budget} />
                      <Row label="Deadline" value={data.deadline} />
                      <Row label="Contact via" value={data.contact} />
                      {selectedFile && <Row label="Document" value={selectedFile.name} />}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">By submitting you agree to be contacted by our team about this project.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
              <Button variant="ghost" className="rounded text-slate-400 hover:text-white hover:bg-slate-800 font-mono text-xs" onClick={prev} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-1" /> [←] PREV</Button>
              {step < steps.length - 1 ? (
                <Button onClick={next} className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-mono font-black px-6 h-11 text-xs shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn">NEXT_STEP [→]</Button>
              ) : (
                <Button onClick={submit} disabled={isSubmitting} className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-mono font-black px-6 h-11 text-xs shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn">
                  {isSubmitting ? "TRANSMITTING..." : "[EXEC] SUBMIT_REQUEST"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-1.5 block font-mono">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1 font-mono font-medium">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 font-mono text-xs sm:text-sm">
      <span className="text-slate-500">{label}:</span>
      <span className="text-amber-400 font-bold text-right">{value}</span>
    </div>
  );
}
