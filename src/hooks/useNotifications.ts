import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface ProjectNotification {
  id: string;
  title: string;
  thumb: string | null;
  category: string;
  price: number;
  created_at: string;
}

const STORAGE_KEY = "pd_last_seen_at";

export function useNotifications() {
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get the timestamp of the last time user opened the bell
  const getLastSeenAt = () => {
    return localStorage.getItem(STORAGE_KEY) || new Date(0).toISOString();
  };

  const markAllRead = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setUnreadCount(0);
  };

  useEffect(() => {
    const lastSeenAt = getLastSeenAt();

    // Fetch projects added after user's last visit
    const fetchNewProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, thumb, category, price, created_at")
        .gt("created_at", lastSeenAt)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data as ProjectNotification[]);
        setUnreadCount(data.length);
      }
    };

    fetchNewProjects();

    // Listen for real-time new project inserts
    const channel = supabase
      .channel("new-projects")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "projects" },
        (payload) => {
          const newProject = payload.new as ProjectNotification;
          setNotifications((prev) => [newProject, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { notifications, unreadCount, markAllRead };
}
