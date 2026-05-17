import { Link } from "react-router-dom";
import { Star, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Project } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

export default function ProjectCard({ project, view = "grid" }: { project: Project; view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <motion.div whileHover={{ y: -2 }} className="bg-white rounded-3xl p-4 shadow-soft border border-border flex flex-col sm:flex-row gap-4 hover:shadow-elegant transition-shadow">
        <div className="w-full h-48 sm:w-40 sm:h-28 rounded-2xl shrink-0 overflow-hidden relative" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#ccc' }}>
          {project.thumb?.startsWith('http') && <img src={project.thumb} alt={project.title} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <Badge className="bg-secondary text-navy hover:bg-secondary mb-2">{project.category}</Badge>
              <h3 className="font-semibold text-navy text-lg sm:text-base leading-tight truncate">{project.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.short}</p>
            </div>
            <div className="mt-1 sm:mt-0 sm:text-right shrink-0">
              <div className="text-lg font-semibold text-navy">₹{project.price.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 sm:mt-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
            <div className="flex gap-1.5 flex-wrap">
              {(project.tech || []).slice(0, 3).map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-navy">{t}</span>)}
            </div>
            <Link to={`/project/${project.id}`} className="text-sm text-primary font-medium flex items-center gap-1">View <ArrowUpRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
      <Link to={`/project/${project.id}`} className="group block bg-white rounded-3xl overflow-hidden shadow-soft border border-border hover:shadow-elegant transition-all h-full">
        <div className="aspect-[4/3] relative overflow-hidden" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#ccc' }}>
          {project.thumb?.startsWith('http') && <img src={project.thumb} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <Badge className="absolute top-3 left-3 bg-white/90 text-navy hover:bg-white">{project.category}</Badge>
          <Badge className="absolute top-3 right-3 bg-navy/90 text-white hover:bg-navy">{project.difficulty}</Badge>
          <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 flex-wrap">
            {(project.tech || []).slice(0, 3).map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full glass text-navy font-medium">{t}</span>
            ))}
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-navy text-lg leading-tight group-hover:text-primary transition-colors">{project.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.short}</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div>
              <div className="text-lg font-semibold text-navy">₹{project.price.toLocaleString()}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-secondary group-hover:bg-primary group-hover:text-white grid place-items-center transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
