import { supabase } from "./supabase";

export type PopupAudience = "guests_only" | "authenticated_only" | "all_visitors";
export type PopupMediaType = "none" | "image" | "video";
export type PopupAnimation = "cyber_glitch" | "hologram_pulse" | "terminal_boot" | "smooth_fade";
export type PopupLayoutMode = "with_buttons" | "no_buttons_pure_media";

export interface PopupConfig {
  id: string;
  enabled: boolean;
  audience: PopupAudience;
  badge: string;
  title: string;
  description: string;
  couponCode: string;
  discountPercent: number;
  mediaType: PopupMediaType;
  mediaUrl: string;
  videoAutoplay: boolean;
  videoMuted: boolean;
  animation: PopupAnimation;
  layoutMode: PopupLayoutMode;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  autoDismissSeconds: number; // 0 = manual only
  showDelaySeconds: number; // seconds after landing before showing
  updatedAt: string;
}

export const DEFAULT_POPUP_CONFIG: PopupConfig = {
  id: "scheme-welcome-v1",
  enabled: true,
  audience: "guests_only",
  badge: "STUDENT CAPSTONE INCENTIVE",
  title: "FLAT 25% OFF YOUR FIRST CAPSTONE BLUEPRINT",
  description: "Register a free account to unlock verified Flutter, AI & IoT codebases, IEEE synopses, and live consultation with lead project engineers.",
  couponCode: "STUDENT2026",
  discountPercent: 25,
  mediaType: "image",
  mediaUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80",
  videoAutoplay: true,
  videoMuted: true,
  animation: "cyber_glitch",
  layoutMode: "with_buttons",
  ctaText: "CREATE ACCOUNT & CLAIM 25% OFF",
  ctaLink: "/login",
  secondaryCtaText: "EXPLORE BLUEPRINTS",
  secondaryCtaLink: "/marketplace",
  autoDismissSeconds: 0,
  showDelaySeconds: 4,
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = "dukaan_smart_popup_config";
const SNOOZE_KEY = "dukaan_popup_snooze_until";

export function getPopupConfig(): PopupConfig {
  if (typeof window === "undefined") return DEFAULT_POPUP_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_POPUP_CONFIG,
        ...parsed,
        enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_POPUP_CONFIG.enabled,
      };
    }
  } catch (e) {
    console.warn("Failed to read popup config from localStorage:", e);
  }
  return DEFAULT_POPUP_CONFIG;
}

export function savePopupConfig(config: PopupConfig): void {
  if (typeof window === "undefined") return;
  try {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dukaan_popup_config_changed", { detail: updated }));
  } catch (e) {
    console.warn("Failed to save popup config:", e);
  }
}

/**
 * Broadcasts the popup configuration live to all currently connected visitors via Supabase Realtime WebSocket.
 * Connected visitors receive this message instantly without needing to reload.
 */
export async function broadcastPopupLive(config: PopupConfig): Promise<boolean> {
  savePopupConfig(config);
  try {
    const payload = {
      ...config,
      isLiveBroadcast: true,
      broadcastTimestamp: Date.now()
    };

    // 1. WebSocket broadcast channel (<50ms delivery)
    const channel = supabase.channel("admin-global-broadcast");
    await channel.send({
      type: "broadcast",
      event: "popup_broadcast",
      payload
    });

    // 2. Also try updating app_settings in Supabase if table exists
    supabase
      .from("app_settings")
      .upsert({ key: "smart_popup_config", value: payload, updated_at: new Date().toISOString() })
      .then()
      .catch(() => {});

    return true;
  } catch (err) {
    console.warn("Failed to send live popup broadcast:", err);
    return false;
  }
}

/**
 * Checks if the popup has been snoozed by the user within the last 24 hours.
 */
export function isPopupSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
    if (!snoozeUntil) return false;
    const expiry = parseInt(snoozeUntil, 10);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

/**
 * Snoozes the popup for the specified hours (defaults to 24 hours).
 */
export function snoozePopup(hours: number = 24): void {
  if (typeof window === "undefined") return;
  try {
    const expiry = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, expiry.toString());
  } catch (e) {
    console.warn("Failed to snooze popup:", e);
  }
}

/**
 * Resets snooze so popup can show again immediately.
 */
export function clearPopupSnooze(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SNOOZE_KEY);
  } catch (_) {}
}
