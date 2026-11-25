// 扩展测试用的假站：只用来证明「新增一个需登录站只加插件目录即可续期」。
// 不连真实网络，域名 .invalid 永远解析不到；同目录的 manifest.json 写了 addable:false，
// 加上 .fixtures 点前缀被 scripts/plugin-build.mjs 的 listPlugins() 跳过，
// 所以它不会进 plugins.json、registry-snapshot、图标目录，也不会出现在站点列表里。
import { DEFAULT_PRICING_ENDPOINT as PRICING_ENDPOINT, cookieRefreshAuth, requestPolicy } from "@app/core/provider-registry.js";

// 续期声明：cookie 换 token。kind 显式写 "cookie"，因为 cookieRefreshAuth() 只产出
// 换 token 需要的字段，不带 kind——插件要把它当 renewal 用就得自己补上。
// 这条路径全程在 service worker 里跑，不开标签页，续到的 token 直接落凭据仓。
const pageAuth = {
  source: "cookie",
  sessionFailureStatuses: [401],
  sessionFailureMessage: "假站登录态已失效"
};

const preset = {
  id: "fake-login",
  name: "假站（续期 fixture）",
  baseUrl: "https://fake-login.invalid/",
  priceCurrency: "USD",
  enabled: false,
  mode: "direct",
  auth: { type: "none" },
  adapter: { kind: "declarative", endpoint: PRICING_ENDPOINT, method: "GET", responseFormat: "price-map", priceMap: { base: "allrouter" } }
};

export const sitePlugin = {
  id: "fake-login",
  host: "fake-login.invalid",
  preset,
  matches: ({ hostname }) => hostname === "fake-login.invalid",
  prepareMatches: ({ hostname }) => hostname === "fake-login.invalid",
  prepare: stationInput => ({ ...stationInput, mode: "direct" }),
  mode: "direct",
  responseFormat: "price-map",
  authType: "none",
  rationale: "假站：验证插件声明能否独立驱动凭据续期，不参与真实采集",
  request: requestPolicy(() => PRICING_ENDPOINT, {
    credentials: "include",
    pageAuth,
    renewal: {
      kind: "cookie",
      ...cookieRefreshAuth({
        cookieName: "fake_session",
        refreshPath: "/api/user/auth/refresh",
        expiresAtPath: "data.access_expires_at",
        missingMessage: "未找到假站登录 cookie",
        failureMessage: "假站登录态已失效"
      })
    }
  })
};