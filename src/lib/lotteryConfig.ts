import { getPopupConfig } from "./popupConfig";

export type DiscountType = "percentage" | "fixed";

export interface LotteryConfig {
  enabled: boolean;
  discountType: DiscountType; // "percentage" (%) or "fixed" (₹)
  minDiscount: number; // e.g. 20 (for %) or 500 (for ₹)
  maxDiscount: number; // e.g. 30 (for %) or 1500 (for ₹)
}

export const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  enabled: true,
  discountType: "percentage",
  minDiscount: 20,
  maxDiscount: 30,
};

export function getLotteryConfig(): LotteryConfig {
  if (typeof window === "undefined") return DEFAULT_LOTTERY_CONFIG;
  try {
    const raw = localStorage.getItem("dukaan_lottery_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : true,
        discountType: (parsed.discountType === "fixed" ? "fixed" : "percentage") as DiscountType,
        minDiscount: Number(parsed.minDiscount) || 20,
        maxDiscount: Number(parsed.maxDiscount) || 30,
      };
    }
  } catch (e) {
    console.warn("Failed to read lottery config:", e);
  }
  return DEFAULT_LOTTERY_CONFIG;
}

export function saveLotteryConfig(config: LotteryConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("dukaan_lottery_config", JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("dukaan_lottery_config_changed", { detail: config }));
  } catch (e) {
    console.warn("Failed to save lottery config:", e);
  }
}

/**
 * Determines whether a student scratch lottery ticket is currently active for a conversation.
 * Scans conversation history in chronological order so re-granting after revocation correctly
 * activates the ticket without being permanently blocked by older revocation events.
 */
export function isLotteryActiveForConvo(convo: any, messages?: any[]): boolean {
  if (!convo) return false;
  if (convo.status === "withdrawn" || convo.status === "cancelled") return false;

  const msgList = Array.isArray(messages) && messages.length > 0
    ? messages
    : (Array.isArray(convo.messages) ? convo.messages : []);

  // Scan backwards to find the latest lottery event
  for (let i = msgList.length - 1; i >= 0; i--) {
    const m = msgList[i];
    if (!m) continue;

    const isGrant = m.type === "lottery_ticket" || 
      (typeof m.message === "string" && m.message.includes("[STUDENT LUCKY RAFFLE UNLOCKED]"));
    
    const isRevoke = m.type === "lottery_revoked" ||
      (typeof m.message === "string" && (
        m.message.includes("ticket has been revoked") || 
        m.message.includes("ticket has been deactivated")
      ));

    if (isGrant) {
      return true;
    }

    if (isRevoke) {
      return false;
    }
  }

  // Fallback to lottery_unlocked flag if no lottery messages exist
  return Boolean(convo.lottery_unlocked);
}

/**
 * Checks whether a specific lottery message within the chat list is currently active.
 * A message is active if the overall lottery is active AND no revocation message occurred after it.
 */
export function isMessageTicketActive(
  msgIndex: number,
  messages: any[],
  convo: any
): boolean {
  if (!convo || convo.status === "withdrawn" || convo.status === "cancelled") {
    return false;
  }
  if (!Array.isArray(messages) || msgIndex < 0 || msgIndex >= messages.length) {
    return false;
  }
  if (!isLotteryActiveForConvo(convo, messages)) {
    return false;
  }

  // Check if any revocation message occurred after this specific message
  for (let i = msgIndex + 1; i < messages.length; i++) {
    const nextMsg = messages[i];
    if (!nextMsg) continue;
    if (
      nextMsg.type === "lottery_revoked" ||
      (typeof nextMsg.message === "string" && (
        nextMsg.message.includes("ticket has been revoked") || 
        nextMsg.message.includes("ticket has been deactivated")
      ))
    ) {
      return false;
    }
  }

  return true;
}

export interface ConvoDiscountInfo {
  discountType: DiscountType;
  discountValue: number;
  discountPercent: number; // for backward compatibility in display
  couponCode: string;
  originalPrice: number;
  discountedPrice: number;
}

/**
 * Returns dynamic discount details for a conversation if an active coupon has been applied.
 * Checks both database fields and chronological messages.
 * If the ticket is currently revoked, returns null (so price reverts to original).
 */
export function getConvoDiscountInfo(convo: any): ConvoDiscountInfo | null {
  if (!convo) return null;
  const origPrice = Number(convo.project_price || 0);

  // If the lottery ticket was revoked, the student discount is deactivated
  if (!isLotteryActiveForConvo(convo, convo.messages)) {
    return null;
  }

  // 1. Direct fields on conversation record
  if (typeof convo.applied_discount === "number" && convo.applied_discount > 0) {
    const disc = convo.applied_discount;
    const dType: DiscountType = convo.applied_discount_type === "fixed" ? "fixed" : "percentage";
    const discounted = typeof convo.discounted_price === "number" && convo.discounted_price > 0
      ? convo.discounted_price
      : (dType === "fixed" ? Math.max(0, origPrice - disc) : Math.round(origPrice * (1 - disc / 100)));

    const percent = dType === "fixed" ? Math.round((disc / (origPrice || 1)) * 100) : disc;

    return {
      discountType: dType,
      discountValue: disc,
      discountPercent: percent,
      couponCode: convo.coupon_code || (dType === "fixed" ? `FLAT-${disc}` : `STUDENT-${disc}`),
      originalPrice: origPrice,
      discountedPrice: discounted,
    };
  }

  // 2. Scan messages backwards for latest coupon_applied event
  const msgs = Array.isArray(convo.messages) ? convo.messages : [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (!m) continue;

    // If ticket was revoked after this message, discount is not active
    if (m.type === "lottery_revoked") {
      return null;
    }

    if (
      m.type === "coupon_applied" || 
      (typeof m.discount_percent === "number" && m.discount_percent > 0) ||
      (typeof m.discount_value === "number" && m.discount_value > 0) ||
      (typeof m.message === "string" && m.message.includes("Applied Lucky Student Coupon"))
    ) {
      const dType: DiscountType = m.discount_type === "fixed" ? "fixed" : "percentage";
      let disc = Number(m.discount_value || m.discount_percent || m.discount) || 0;
      if (!disc && typeof m.message === "string") {
        const matchPercent = m.message.match(/(\d+)%\s*OFF/i);
        const matchFixed = m.message.match(/₹\s*(\d+)\s*OFF/i);
        if (matchFixed) {
          disc = parseInt(matchFixed[1], 10);
        } else if (matchPercent) {
          disc = parseInt(matchPercent[1], 10);
        }
      }

      if (disc > 0) {
        let code = m.coupon_code || m.coupon;
        if (!code && typeof m.message === "string") {
          const matchCode = m.message.match(/Coupon:\s*([A-Z0-9_-]+)/i);
          if (matchCode) code = matchCode[1];
        }

        const discounted = typeof m.discounted_price === "number" && m.discounted_price > 0
          ? m.discounted_price
          : (dType === "fixed" ? Math.max(0, origPrice - disc) : Math.round(origPrice * (1 - disc / 100)));

        const percent = dType === "fixed" ? Math.round((disc / (origPrice || 1)) * 100) : disc;

        return {
          discountType: dType,
          discountValue: disc,
          discountPercent: percent,
          couponCode: code || (dType === "fixed" ? `FLAT-${disc}` : `STUDENT-${disc}`),
          originalPrice: origPrice,
          discountedPrice: discounted,
        };
      }
    }
  }

  return null;
}

/**
 * Resolves the effective min and max discount bounds and discount type for a conversation.
 * Prioritizes the specific ticket message granted to the student, falling back to
 * conversation fields, and lastly to the global lottery config.
 */
export function getConvoLotteryBounds(convo: any, messages?: any[]): { 
  minDiscount: number; 
  maxDiscount: number;
  discountType: DiscountType;
} {
  const cfg = getLotteryConfig();
  const msgList = Array.isArray(messages) && messages.length > 0
    ? messages
    : (Array.isArray(convo?.messages) ? convo.messages : []);

  // Find the latest lottery ticket grant message
  for (let i = msgList.length - 1; i >= 0; i--) {
    const m = msgList[i];
    if (!m) continue;
    if (m.type === "lottery_ticket" || (typeof m.message === "string" && m.message.includes("[STUDENT LUCKY RAFFLE UNLOCKED]"))) {
      const min = typeof m.min_discount === "number" && m.min_discount > 0 ? m.min_discount : undefined;
      const max = typeof m.max_discount === "number" && m.max_discount > 0 ? m.max_discount : undefined;
      const discType = (m.discount_type === "fixed" ? "fixed" : "percentage") as DiscountType;
      if (min !== undefined && max !== undefined) {
        return { 
          minDiscount: Math.min(min, max), 
          maxDiscount: Math.max(min, max),
          discountType: discType
        };
      }
      break;
    }
  }

  const dType = (convo?.lottery_discount_type === "fixed" ? "fixed" : cfg.discountType) as DiscountType;

  // Check direct conversation fields
  if (typeof convo?.lottery_min_discount === "number" && typeof convo?.lottery_max_discount === "number") {
    return {
      minDiscount: Math.min(convo.lottery_min_discount, convo.lottery_max_discount),
      maxDiscount: Math.max(convo.lottery_min_discount, convo.lottery_max_discount),
      discountType: dType
    };
  }

  return {
    minDiscount: Math.min(cfg.minDiscount, cfg.maxDiscount),
    maxDiscount: Math.max(cfg.minDiscount, cfg.maxDiscount),
    discountType: cfg.discountType
  };
}

export interface ValidatedCouponResult {
  valid: boolean;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountPercent: number;
  discountedPrice: number;
  savings: number;
  message?: string;
}

/**
 * Validates a user-entered promo/coupon code against active schemes, popup discounts,
 * and system discount patterns.
 */
export function validateCouponCode(
  inputCode: string,
  originalPrice: number
): ValidatedCouponResult {
  const cleanCode = (inputCode || "").trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      code: "",
      discountType: "percentage",
      discountValue: 0,
      discountPercent: 0,
      discountedPrice: originalPrice,
      savings: 0,
      message: "Please enter a valid coupon code.",
    };
  }

  // 1. Check active popup / marketing scheme coupon
  const popupCfg = getPopupConfig();
  if (popupCfg.enabled && popupCfg.couponCode && cleanCode === popupCfg.couponCode.toUpperCase()) {
    const percent = popupCfg.discountPercent || 25;
    const discounted = Math.round(originalPrice * (1 - percent / 100));
    return {
      valid: true,
      code: cleanCode,
      discountType: "percentage",
      discountValue: percent,
      discountPercent: percent,
      discountedPrice: discounted,
      savings: originalPrice - discounted,
      message: `${percent}% scheme discount applied successfully!`,
    };
  }

  // 2. Official Student 2026 Code
  if (cleanCode === "STUDENT2026") {
    const percent = 25;
    const discounted = Math.round(originalPrice * (1 - percent / 100));
    return {
      valid: true,
      code: cleanCode,
      discountType: "percentage",
      discountValue: percent,
      discountPercent: percent,
      discountedPrice: discounted,
      savings: originalPrice - discounted,
      message: "25% Student Capstone discount applied!",
    };
  }

  // 3. Official IEEE 2026 Code
  if (cleanCode === "IEEE2026") {
    const percent = 15;
    const discounted = Math.round(originalPrice * (1 - percent / 100));
    return {
      valid: true,
      code: cleanCode,
      discountType: "percentage",
      discountValue: percent,
      discountPercent: percent,
      discountedPrice: discounted,
      savings: originalPrice - discounted,
      message: "15% IEEE builder discount applied!",
    };
  }

  // 4. Pattern match STUDENT-XX (e.g. STUDENT-20, STUDENT-30) from lottery ticket
  const studentMatch = cleanCode.match(/^STUDENT-(\d+)$/i);
  if (studentMatch) {
    const num = parseInt(studentMatch[1], 10);
    if (num > 0 && num <= 90) {
      const discounted = Math.round(originalPrice * (1 - num / 100));
      return {
        valid: true,
        code: cleanCode,
        discountType: "percentage",
        discountValue: num,
        discountPercent: num,
        discountedPrice: discounted,
        savings: originalPrice - discounted,
        message: `${num}% Lucky Student discount applied!`,
      };
    }
  }

  // 5. Pattern match FLAT-XXX, CASH-XXX or RUPEE-XXX (e.g. FLAT-500, FLAT-1000) for fixed rupee discount
  const flatMatch = cleanCode.match(/^(?:FLAT|CASH|RUPEE)-(\d+)$/i);
  if (flatMatch) {
    const amt = parseInt(flatMatch[1], 10);
    if (amt > 0) {
      const discounted = Math.max(0, originalPrice - amt);
      return {
        valid: true,
        code: cleanCode,
        discountType: "fixed",
        discountValue: amt,
        discountPercent: Math.round((amt / (originalPrice || 1)) * 100),
        discountedPrice: discounted,
        savings: amt,
        message: `₹${amt.toLocaleString()} flat cash discount applied!`,
      };
    }
  }

  return {
    valid: false,
    code: cleanCode,
    discountType: "percentage",
    discountValue: 0,
    discountPercent: 0,
    discountedPrice: originalPrice,
    savings: 0,
    message: "Invalid or expired coupon code. Please verify and try again.",
  };
}

