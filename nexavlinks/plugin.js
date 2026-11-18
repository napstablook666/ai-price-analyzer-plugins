import { NEXA_CHANNEL_CATALOG_ENDPOINT, requestPolicy } from "@app/core/provider-registry.js";

const preset = {
  id: "nexavlinks",
  name: "NexaVlinks",
  baseUrl: "https://www.nexavlinks.com/modelsmarket",
  rechargeRateVerified: false,
  rechargeRateNote: "站点充值折算尚未核验，当前仅保留站点原始报价，不用于已验证人民币成本比价。",
  enabled: true,
  mode: "page",
  auth: { type: "none" },
  adapter: { endpoint: NEXA_CHANNEL_CATALOG_ENDPOINT, method: "GET", responseFormat: "auto" }
};

export const sitePlugin = {
  id: "nexavlinks",
  preserveRechargeRateVerification: true,
  host: "nexavlinks.com",
  matches: ({ hostname }) => hostname === "nexavlinks.com",
  prepare: (stationInput, { url }) => ({
    ...stationInput,
    baseUrl: `${url.origin}/modelsmarket`,
    mode: "page",
    auth: { type: "none" },
    adapter: { ...(stationInput.adapter || {}), endpoint: NEXA_CHANNEL_CATALOG_ENDPOINT, method: "GET", responseFormat: "auto" }
  }),
  mode: "page",
  openTemporaryPage: true,
  rationale: "NexaVlinks 通过已登录页面读取模型渠道",
  preset,
  request: requestPolicy(() => NEXA_CHANNEL_CATALOG_ENDPOINT, { credentials: "include" })
};
