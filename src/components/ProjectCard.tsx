import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Project } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

export default function ProjectCard({ project, view = "grid" }: { project: Project; view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <motion.div whileHover={{ y: -3 }} className="liquid-glass-card rounded-[2rem] p-4 flex flex-col sm:flex-row gap-4 transition-all">
        <div className="w-full h-48 sm:w-44 sm:h-32 rounded-2xl shrink-0 overflow-hidden relative shadow-inner bg-slate-100" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#E2E8F0' }}>
          {project.thumb?.startsWith('http') && <img src={project.thumb} alt={project.title} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <Badge className="liquid-glass-pill text-indigo-600 font-semibold text-xs mb-2 border-slate-200/80">{project.category}</Badge>
              <h3 className="font-semibold text-slate-900 text-lg sm:text-base leading-tight truncate">{project.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2 mt-1 leading-relaxed">{project.short}</p>
            </div>
            <div className="mt-1 sm:mt-0 sm:text-right shrink-0">
              <div className="text-xl font-bold text-slate-900">₹{project.price.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 sm:mt-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="flex gap-1.5 flex-wrap">
              {(project.tech || []).slice(0, 3).map(t => (
                <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/60">{t}</span>
              ))}
            </div>
            <Link to={`/project/${project.id}`} className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700 hover:underline">
              View Blueprint <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
      <Link to={`/project/${project.id}`} className="group block liquid-glass-card rounded-[2rem] overflow-hidden transition-all h-full">
        <div className="aspect-[4/3] relative overflow-hidden bg-slate-100" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#E2E8F0' }}>
          {project.thumb?.startsWith('http') && (
            <img src={project.thumb} alt={project.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-black/10" />
          <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 font-semibold text-xs border border-white/80 shadow-sm">{project.category}</Badge>
          <Badge className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-white border border-white/20 text-xs shadow-sm font-medium">{project.difficulty}</Badge>
          <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 flex-wrap">
            {(project.tech || []).slice(0, 3).map(t => (
              <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 font-medium border border-white/70 shadow-sm">{t}</span>
            ))}
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="font-semibold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors">{project.title}</h3>
          <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{project.short}</p>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <div>
              <div className="text-xl font-bold text-slate-900">₹{project.price.toLocaleString()}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 grid place-items-center transition-all duration-200 shadow-sm">
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
