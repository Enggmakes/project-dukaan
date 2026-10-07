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
  id: "default-scheme",
  enabled: true,
  audience: "guests_only",
  badge: "STUDENT WELCOME SCHEME",
  title: "FLAT 25% OFF FIRST PROJECT",
  description: "Get 25% off verified academic engineering blueprints and source code with code STUDENT2026.",
  couponCode: "STUDENT2026",
  discountPercent: 25,
  mediaType: "none",
  mediaUrl: "",
  videoAutoplay: true,
  videoMuted: true,
  animation: "smooth_fade",
  layoutMode: "with_buttons",
  ctaText: "CLAIM 25% DISCOUNT",
  ctaLink: "/login",
  secondaryCtaText: "CONTINUE BROWSING",
  secondaryCtaLink: "/marketplace",
  autoDismissSeconds: 0,
  showDelaySeconds: 4,
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = "dukaan_smart_popup_config";
const SNOOZE_KEY = "dukaan_popup_snooze_until";

export function dbToConfig(row: any): PopupConfig {
  if (!row) return DEFAULT_POPUP_CONFIG;
  return {
    id: row.id || DEFAULT_POPUP_CONFIG.id,
    enabled: typeof row.enabled === "boolean" ? row.enabled : DEFAULT_POPUP_CONFIG.enabled,
    audience: (row.audience as PopupAudience) || DEFAULT_POPUP_CONFIG.audience,
    badge: row.badge || DEFAULT_POPUP_CONFIG.badge,
    title: row.title || DEFAULT_POPUP_CONFIG.title,
    description: row.description || DEFAULT_POPUP_CONFIG.description,
    couponCode: row.coupon_code ?? row.couponCode ?? DEFAULT_POPUP_CONFIG.couponCode,
    discountPercent: Number(row.discount_percent ?? row.discountPercent ?? DEFAULT_POPUP_CONFIG.discountPercent),
    mediaType: (row.media_type as PopupMediaType) || (row.mediaType as PopupMediaType) || DEFAULT_POPUP_CONFIG.mediaType,
    mediaUrl: row.media_url ?? row.mediaUrl ?? DEFAULT_POPUP_CONFIG.mediaUrl,
    videoAutoplay: typeof row.video_autoplay === "boolean" ? row.video_autoplay : (typeof row.videoAutoplay === "boolean" ? row.videoAutoplay : true),
    videoMuted: typeof row.video_muted === "boolean" ? row.video_muted : (typeof row.videoMuted === "boolean" ? row.videoMuted : true),
    animation: (row.animation as PopupAnimation) || DEFAULT_POPUP_CONFIG.animation,
    layoutMode: (row.layout_mode as PopupLayoutMode) || (row.layoutMode as PopupLayoutMode) || DEFAULT_POPUP_CONFIG.layoutMode,
    ctaText: row.cta_text ?? row.ctaText ?? DEFAULT_POPUP_CONFIG.ctaText,
    ctaLink: row.cta_link ?? row.ctaLink ?? DEFAULT_POPUP_CONFIG.ctaLink,
    secondaryCtaText: row.secondary_cta_text ?? row.secondaryCtaText ?? DEFAULT_POPUP_CONFIG.secondaryCtaText,
    secondaryCtaLink: row.secondary_cta_link ?? row.secondaryCtaLink ?? DEFAULT_POPUP_CONFIG.secondaryCtaLink,
    autoDismissSeconds: Number(row.auto_dismiss_seconds ?? row.autoDismissSeconds ?? 0),
    showDelaySeconds: Number(row.show_delay_seconds ?? row.showDelaySeconds ?? 4),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export function configToDb(cfg: PopupConfig): any {
  return {
    id: cfg.id || "default-scheme",
    enabled: cfg.enabled,
    audience: cfg.audience,
    badge: cfg.badge,
    title: cfg.title,
    description: cfg.description,
    coupon_code: cfg.couponCode,
    discount_percent: cfg.discountPercent,
    media_type: cfg.mediaType,
    media_url: cfg.mediaUrl,
    video_autoplay: cfg.videoAutoplay,
    video_muted: cfg.videoMuted,
    animation: cfg.animation,
    layout_mode: cfg.layoutMode,
    cta_text: cfg.ctaText,
    cta_link: cfg.ctaLink,
    secondary_cta_text: cfg.secondaryCtaText,
    secondary_cta_link: cfg.secondaryCtaLink,
    auto_dismiss_seconds: cfg.autoDismissSeconds,
    show_delay_seconds: cfg.showDelaySeconds,
    updated_at: new Date().toISOString()
  };
}

/**
 * Reads local cached config synchronously.
 */
export function getPopupConfig(): PopupConfig {
  if (typeof window === "undefined") return DEFAULT_POPUP_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy default matrix image away
      if (parsed.mediaUrl && parsed.mediaUrl.includes("photo-1526374965328-7f61d4dc18c5")) {
        parsed.mediaType = "none";
        parsed.mediaUrl = "";
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_POPUP_CONFIG, ...parsed }));
      }
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

/**
 * Fetches the active popup directly from the Supabase PostgreSQL database table.
 */
export async function fetchPopupFromDb(): Promise<PopupConfig | null> {
  try {
    const { data, error } = await supabase
      .from("marketing_popups")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Could not query marketing_popups table from DB:", error.message);
      return null;
    }

    if (data) {
      const config = dbToConfig(data);
      // Cache to local storage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      }
      return config;
    }
  } catch (err) {
    console.warn("Database fetch exception for marketing_popups:", err);
  }
  return null;
}

/**
 * Saves popup configuration to both localStorage and the Supabase PostgreSQL database table.
 */
export async function savePopupConfig(config: PopupConfig): Promise<boolean> {
  const updated: PopupConfig = {
    ...config,
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dukaan_popup_config_changed", { detail: updated }));
  }

  // Persist directly to Supabase PostgreSQL table
  try {
    const dbPayload = configToDb(updated);
    const { error } = await supabase
      .from("marketing_popups")
      .upsert(dbPayload, { onConflict: "id" });

    if (error) {
      console.warn("Database upsert warning for marketing_popups:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Database upsert error for marketing_popups:", err);
    return false;
  }
}

/**
 * Broadcasts the popup configuration live to all currently connected visitors via Supabase Realtime WebSocket
 * AND saves it permanently to the Supabase database.
 */
export async function broadcastPopupLive(config: PopupConfig): Promise<boolean> {
  // 1. Save to DB & LocalStorage
  await savePopupConfig(config);

  try {
    const payload = {
      ...config,
      isLiveBroadcast: true,
      broadcastTimestamp: Date.now()
    };

    // 2. High-speed WebSocket broadcast channel (<50ms delivery)
    const channel = supabase.channel("admin-global-broadcast");
    await channel.send({
      type: "broadcast",
      event: "popup_broadcast",
      payload
    });

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
