export interface LotteryConfig {
  enabled: boolean;
  minDiscount: number; // e.g. 20
  maxDiscount: number; // e.g. 30
}

export const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  enabled: true,
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

