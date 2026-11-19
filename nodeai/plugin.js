import { NODEAI_MODEL_PLAZA_ENDPOINT, requestPolicy } from "@app/core/provider-registry.js";

const preset = {
  // >>> recharge-probe（由 scripts/recharge-apply.mjs 生成，勿手改）
  rechargePayments: [
    { channel: "alipay", faceAmount: 10, payAmount: 10, currency: "CNY", at: "2026-11-19", note: "订单 pay_amount 10、fee_rate 0、status EXPIRED，金额即收银台待支付额" },
  ],
  rechargePaymentsVerified: true,
  // <<< recharge-probe
  id: "nodeai",
  preserveRechargeRateVerification: true,
  name: "NodeAI",
  baseUrl: "https://nodeai.cc/model-plaza",
  rechargeRateVerified: false,
  rechargeRateNote: "站点充值折算尚未核验，当前仅保留站点原始报价，不用于已验证人民币成本比价。",
  rechargeRmb: 1,
  rechargeCurrency: "CNY",
  rechargeCredits: 1,
  enabled: true,
  mode: "direct",
  auth: { type: "none" },
  adapter: { kind: "nodeai-model-plaza", endpoint: NODEAI_MODEL_PLAZA_ENDPOINT, method: "GET", responseFormat: "nodeai-model-plaza" }
};

export const sitePlugin = {
  id: "nodeai",
  host: "nodeai.cc",
  matches: ({ hostname, path }) => hostname === "nodeai.cc" && path === "/model-plaza",
  prepare: (stationInput, { url }) => ({
    ...stationInput,
    baseUrl: preset.baseUrl,
    mode: "direct",
    auth: { type: "none" },
    adapter: { ...(stationInput.adapter || {}), kind: "nodeai-model-plaza", endpoint: NODEAI_MODEL_PLAZA_ENDPOINT, method: "GET", responseFormat: "nodeai-model-plaza" }
  }),
  mode: "direct",
  responseFormat: "nodeai-model-plaza",
  authType: "none",
  rationale: "NodeAI 通过公开模型广场 API 直连采集",
  preset,
  request: requestPolicy(() => NODEAI_MODEL_PLAZA_ENDPOINT, { credentials: "omit" })
};
