import { requestPolicy, STELLAISLE_PRICING_ENDPOINT } from "@app/core/provider-registry.js";

const preset = {
  id: "stellaisle",
  name: "飓星API",
  category: "public",
  baseUrl: "https://token.stellaisle.com/pricing",
  rechargeRmb: 1,
  rechargeCredits: 1,
  rechargeRateVerified: true,
  rechargeRateNote: "站点 FAQ：充值按 1:1 折算美元额度，1 元 = 1 美元额度。单笔 500 美元以上 8.8 折要找管理员，Codex 套餐有效倍率最低 0.13，两者都不能自助购买。",
  priceCurrency: "CREDITS",
  priceCurrencyVerified: true,
  priceCurrencyNote: "额度计价，1 元充值换 1 美元额度",
  enabled: true,
  mode: "direct",
  auth: { type: "none" },
  adapter: { kind: "stellaisle", endpoint: STELLAISLE_PRICING_ENDPOINT, method: "GET", responseFormat: "stellaisle" }
};

export const sitePlugin = {
  id: "stellaisle",
  host: "token.stellaisle.com",
  preserveRechargeRateVerification: true,
  matches: ({ hostname, path }) => hostname === "token.stellaisle.com" && ["/", "/pricing"].includes(path),
  prepareMatches: ({ hostname }) => hostname === "token.stellaisle.com",
  prepare: (stationInput, { url }) => ({
    ...stationInput,
    baseUrl: `${url.origin}/pricing`,
    category: "public",
    rechargeRateVerified: true,
    mode: "direct",
    auth: { type: "none" },
    adapter: { ...(stationInput.adapter || {}), kind: "stellaisle", endpoint: STELLAISLE_PRICING_ENDPOINT, method: "GET", responseFormat: "stellaisle" }
  }),
  mode: "direct",
  responseFormat: "stellaisle",
  authType: "none",
  rationale: "飓星API 的 /api/pricing 匿名可读，价格不需要登录",
  preset,
  request: requestPolicy(() => STELLAISLE_PRICING_ENDPOINT, { credentials: "omit" })
};
