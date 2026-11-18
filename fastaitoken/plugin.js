import { localStoragePageAuth, requestPolicy } from "@app/core/provider-registry.js";

const preset = {
  id: "fastaitoken",
  name: "fastaitoken.com",
  preserveRechargeRateVerification: true,
  baseUrl: "https://www.fastaitoken.com/available-channels",
  rechargeRateVerified: false,
  rechargeRateNote: "站点充值折算尚未核验，当前仅保留站点原始报价，不用于已验证人民币成本比价。",
  enabled: true,
  mode: "page",
  auth: { type: "none" },
  adapter: { endpoint: "/api/v1/channels/available", method: "GET", responseFormat: "auto" }
};

export const sitePlugin = {
  id: "fastaitoken",
  host: "fastaitoken.com",
  matches: ({ hostname }) => hostname === "fastaitoken.com",
  prepare: (stationInput, { url }) => {
    const path = url.pathname === "/" ? "/available-channels" : url.pathname;
    return {
      ...stationInput,
      baseUrl: `https://www.fastaitoken.com${path}`,
      mode: "page",
      adapter: { ...(stationInput.adapter || {}), endpoint: "/api/v1/channels/available", method: "GET", responseFormat: "auto" }
    };
  },
  mode: "page",
  openTemporaryPage: true,
  rationale: "FastAIToken 通过已登录页面读取可用渠道",
  preset,
  request: requestPolicy(() => "/api/v1/channels/available", {
    headers: { "X-User-UI-Request": "1" },
    pageHeaders: ["X-User-UI-Request"],
    credentials: "include",
    pageAuth: localStoragePageAuth("auth_token", "Authorization", "未找到 FastAIToken 登录凭据，请先在当前 Chrome 配置文件登录后重试", "Bearer", [401])
  })
};
