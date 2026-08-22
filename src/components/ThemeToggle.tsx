import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`w-9 h-9 rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-navy dark:text-white border-0 shadow-none focus-visible:ring-0 focus:outline-none transition-colors ${className || ""}`}
          title="Choose Theme: Light, Dark, or System"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 bg-white/95 dark:bg-[#1f1b2e]/95 backdrop-blur-xl border border-border dark:border-white/10 rounded-2xl p-1.5 shadow-xl z-50"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
            theme === "light"
              ? "bg-secondary text-primary font-semibold dark:bg-white/10 dark:text-white"
              : "text-navy dark:text-white/80 hover:bg-secondary dark:hover:bg-white/10"
          }`}
        >
          <span className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            Light
          </span>
          {theme === "light" && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
            theme === "dark"
              ? "bg-secondary text-primary font-semibold dark:bg-white/10 dark:text-white"
              : "text-navy dark:text-white/80 hover:bg-secondary dark:hover:bg-white/10"
          }`}
        >
          <span className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            Dark
          </span>
          {theme === "dark" && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
            theme === "system"
              ? "bg-secondary text-primary font-semibold dark:bg-white/10 dark:text-white"
              : "text-navy dark:text-white/80 hover:bg-secondary dark:hover:bg-white/10"
          }`}
        >
          <span className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            System
          </span>
          {theme === "system" && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
