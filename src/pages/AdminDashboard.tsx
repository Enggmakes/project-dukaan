import { useState } from "react";
import { Search, TrendingUp, Users, IndianRupee, Activity, MoreHorizontal, Bell, ChevronDown } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LEADS = [
  { id: "LD-2104", name: "Aarav Khanna", project: "AI Resume Screener", category: "AI & ML", budget: "₹15k–50k", status: "New", date: "2h ago" },
  { id: "LD-2103", name: "Priya Iyer", project: "Smart Mirror IoT", category: "IoT", budget: "₹5k–15k", status: "Contacted", date: "5h ago" },
  { id: "LD-2102", name: "Marco Rossi", project: "GPT Support Bot", category: "AI & ML", budget: "₹50k+", status: "Quoted", date: "1d ago" },
  { id: "LD-2101", name: "Sneha Patil", project: "Lane Detection", category: "Computer Vision", budget: "₹15k–50k", status: "Won", date: "2d ago" },
  { id: "LD-2100", name: "Rohan Mehta", project: "NFT Marketplace", category: "Blockchain", budget: "₹50k+", status: "New", date: "2d ago" },
  { id: "LD-2099", name: "Yusuf Ahmed", project: "Crop Detector", category: "Deep Learning", budget: "<₹5k", status: "Lost", date: "3d ago" },
  { id: "LD-2098", name: "Ananya Sharma", project: "Fitness Tracker App", category: "Mobile", budget: "₹15k–50k", status: "Contacted", date: "4d ago" },
];

const statusColor: Record<string, string> = {
  New: "bg-primary/10 text-primary",
  Contacted: "bg-amber-100 text-amber-700",
  Quoted: "bg-violet-100 text-violet-700",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};

export default function AdminDashboard() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = LEADS.filter(l =>
    (status === "all" || l.status === status) &&
    (q === "" || (l.name + l.project + l.id).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Layout>
      <section className="container-px py-8">
        <div className="max-w-7xl mx-auto bg-navy rounded-[2rem] p-6 md:p-10 shadow-navy relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/15 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <div className="text-white/50 text-xs uppercase tracking-widest">Admin</div>
                <h1 className="text-display text-3xl md:text-4xl text-white mt-1">Lead management</h1>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-full glass-dark grid place-items-center text-white relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-magenta" />
                </button>
                <button className="flex items-center gap-2 glass-dark rounded-full px-3 py-1.5 text-white text-sm">
                  <div className="w-7 h-7 rounded-full bg-primary-gradient grid place-items-center text-xs">AD</div>
                  Admin <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: TrendingUp, label: "New leads (7d)", value: "184", delta: "+22%" },
                { icon: Users, label: "Total contacts", value: "2,841", delta: "+8%" },
                { icon: IndianRupee, label: "Pipeline value", value: "₹18.4L", delta: "+34%" },
                { icon: Activity, label: "Conversion", value: "27.4%", delta: "+3%" },
              ].map(s => (
                <div key={s.label} className="glass-dark rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <s.icon className="w-4 h-4 text-primary-glow" />
                    <span className="text-xs text-emerald-400">{s.delta}</span>
                  </div>
                  <div className="text-white text-3xl font-semibold mt-3">{s.value}</div>
                  <div className="text-white/50 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="glass-dark rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h3 className="text-white font-medium">Custom project requests</h3>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 w-64">
                    <Search className="w-4 h-4 text-white/40" />
                    <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search leads…"
                      className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 h-9" />
                  </div>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-36 rounded-full bg-white/5 border-0 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      {["New", "Contacted", "Quoted", "Won", "Lost"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/50 text-xs uppercase tracking-wider">
                      {["ID", "Name", "Project", "Category", "Budget", "Status", "Submitted", ""].map(h => (
                        <th key={h} className="text-left py-3 px-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => (
                      <tr key={l.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 text-white/60 font-mono text-xs">{l.id}</td>
                        <td className="py-3 px-3 text-white font-medium">{l.name}</td>
                        <td className="py-3 px-3 text-white/80">{l.project}</td>
                        <td className="py-3 px-3 text-white/60">{l.category}</td>
                        <td className="py-3 px-3 text-white/80">{l.budget}</td>
                        <td className="py-3 px-3"><Badge className={`${statusColor[l.status]} rounded-full border-0`}>{l.status}</Badge></td>
                        <td className="py-3 px-3 text-white/50">{l.date}</td>
                        <td className="py-3 px-3"><button className="text-white/40 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <div className="text-center py-10 text-white/50 text-sm">No leads match</div>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
