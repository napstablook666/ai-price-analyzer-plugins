import { publicPricingProvider } from "@app/core/provider-registry.js";

const preset = {
  id: "liuguang",
  name: "liuguang.ai",
  baseUrl: "https://www.liuguang.ai/pricing",
  rechargeRateVerified: false,
  rechargeRateNote: "站点充值折算尚未核验，当前仅保留站点原始报价，不用于已验证人民币成本比价。",
  enabled: true,
  mode: "direct",
  auth: { type: "none" },
  adapter: { kind: "public-pricing", endpoint: "/api/models", method: "GET", responseFormat: "auto" }
};

export const sitePlugin = publicPricingProvider("liuguang", "liuguang.ai", preset);
