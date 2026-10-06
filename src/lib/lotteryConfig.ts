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
