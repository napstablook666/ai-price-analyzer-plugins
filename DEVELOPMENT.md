# 插件仓库开发手册

本仓库保存 AI Price Analyzer 的站点插件源代码。插件仓库可以独立开发和提交，但构建器、规范模型查询工具和扩展测试位于扩展仓库。

- 扩展仓库：<https://github.com/napstablook666/ai-price-analyzer>
- 扩展侧插件协议：[`docs/plugin-development.md`](https://github.com/napstablook666/ai-price-analyzer/blob/main/docs/plugin-development.md)
- 插件仓库入口：[README.md](./README.md)

## 1. 最小目录契约

每个站点一个目录：

```text
<id>/
  manifest.json
  plugin.js
  models.json
  icon.svg        （或 icon.png，站点图标，≤ 64px、≤ 24KB）
```

`models.json` 可以省略；省略时构建器按空别名表处理。`icon.svg` / `icon.png` 是站点图标源，构建时复制成扩展的 `icons/sites/<id>.<ext>`；缺图标首页只会显示首字母色块，扩展仓库的测试会报红。图标用扩展仓库的 `npm run plugins:icons` 抓取，抓完人工看一眼是不是该站的 logo。插件 ID 必须同时等于：

- 目录名 `<id>`。
- `manifest.json` 的 `id`。
- `plugin.js` 导出的 `sitePlugin.id`。

ID 只能使用 `a-z`、`0-9` 和连字符，并且必须以字母或数字开头。

## 2. manifest.json

示例：

```json
{
  "id": "sevenai",
  "name": "SevenAI",
  "host": "sevenai.moe",
  "mode": "direct",
  "order": 1,
  "paths": ["/model-plaza"],
  "description": "公开模型广场，直连采集"
}
```

允许的字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 必须等于目录名，只能用小写字母、数字和连字符 |
| `name` | 是 | 扩展首页显示的站点名 |
| `host` | 是 | 主域名，用于站点地址匹配 |
| `hosts` | 否 | 一个插件覆盖多个域名时列出完整域名集合 |
| `paths` | 否 | 限制可匹配的路径或 hash 路径 |
| `mode` | 是 | `direct` 或 `page` |
| `category` | 否 | `paid` 或 `public`，默认是 `paid` |
| `addable` | 否 | `false` 表示不在插件目录中提供默认添加入口 |
| `description` | 否 | 首页中的一行说明 |
| `order` | 是 | 首页排序，新增插件排在现有最大值之后 |

同一个 `host` 对应多个插件时，所有相关插件都必须声明非空 `paths`。构建器会在缺少路径约束时直接失败，避免站点匹配顺序造成错误路由。

不要添加构建器未允许的字段。未知字段会被拒绝，而不是静默忽略。

## 3. plugin.js

插件只导出一个对象：

```js
import { requestPolicy, CENTOS_PRICING_ENDPOINT } from "@app/core/provider-registry.js";

export const sitePlugin = {
  id: "centos",
  host: "ai.centos.hk",
  matches: ({ hostname, path }) => hostname === "ai.centos.hk" && path === "/pricing",
  prepare: (stationInput, { url }) => ({ ...stationInput, baseUrl: url.origin }),
  mode: "direct",
  responseFormat: "new-api-pricing",
  authType: "none",
  rationale: "公开定价 API 直连采集",
  preset: { id: "centos", name: "ai.centos.hk" },
  request: requestPolicy(() => CENTOS_PRICING_ENDPOINT, { credentials: "omit" })
};
```

常用字段：

- `id`：插件 ID，必须与目录和 manifest 一致。
- `host`：插件默认主域名。
- `matches(context, station)`：接收 `{ url, hostname, path, hashPath }`，返回是否匹配。
- `prepare(stationInput, context)`：添加站点时改写 `baseUrl`、adapter、auth 等站点记录，可省略。
- `mode`：`direct` 或 `page`。
- `responseFormat`：交给扩展核心的响应格式选择器。
- `request`：使用 `requestPolicy(urlOrFn, options)`、`localStoragePageAuth` 或 `cookiePageAuth` 等现有请求策略。
- `preset`：插件目录中的默认站点模板。
- `modelAliases`：不要手写，构建器会从 `models.json` 注入。

### 强制限制

- 只能静态导入 `@app/core/...` 或 `@app/shared/...`。
- 禁止 `../../`、绝对本地路径和动态 `import()`。
- 插件运行在 MV3 service worker 中，没有 DOM。
- 需要读取页面登录态或页面数据时，使用 `mode: "page"` 和已有页面桥接请求策略。
- 不在插件里保存或打印 Token、Cookie、Authorization、API Key 或完整私有响应。

## 4. models.json

只有通用归一规则无法处理的、稳定的站内写法才需要别名：

```json
{
  "aliases": {
    "claude-4.5-sonnet": "claude-sonnet-4-5",
    "限时-gpt-5.5": "gpt-5-5"
  }
}
```

匹配优先级是：

1. 用户确认的 `modelMatchOverrides`。
2. 本插件的 `models.json` 别名。
3. 规范模型表。
4. 精确、后缀、版本和模糊等内置规则。

写别名前，先在扩展仓库根目录执行：

```bash
node scripts/model-lookup.mjs claude sonnet
```

查到规范 ID 后再写入 `models.json`。如果查不到，不要把未知模型强行映射到相近模型；先确认规范模型表是否需要更新。

通常不需要为以下差异添加别名：

- 大小写差异。
- 空格、`.`、`_` 和 `-` 的常见差异。
- `provider/` 前缀。
- `:free`、`:thinking` 等装饰后缀。
- 常见日期或版本尾巴。

## 5. 构建与测试

### 嵌套布局

如果插件仓库签出在扩展仓库根目录的 `plugins/`，从扩展仓库根目录执行：

```bash
node scripts/plugin-build.mjs
node scripts/plugin-build.mjs --check
npm test
```

### 外部布局

如果插件仓库在其他路径：

```bash
PLUGIN_DIR=/path/to/plugins node scripts/plugin-build.mjs
PLUGIN_DIR=/path/to/plugins node scripts/plugin-build.mjs --check
```

PowerShell：

```powershell
$env:PLUGIN_DIR = 'C:\path\to\plugins'
node scripts/plugin-build.mjs
node scripts/plugin-build.mjs --check
```

构建器读取：

```text
<id>/manifest.json
<id>/plugin.js
<id>/models.json
```

并生成：

```text
extension/src/site-plugins/providers/<id>.js
extension/src/site-plugins/catalog.js
extension/src/shared/plugin-order.js
```

不要直接修改这些生成文件。`--check` 报漂移时，重新运行不带 `--check` 的生成命令。

## 6. 新增站点流程

1. 在插件仓库创建 `<id>/`。
2. 编写 `manifest.json`、`plugin.js` 和可选的 `models.json`。
3. 确认 `id`、`host`、`mode`、`order` 和 `paths` 与站点实际页面一致。
4. 在扩展仓库运行插件构建器。
5. 运行 `npm test` 和 `node scripts/plugin-build.mjs --check`。
6. 在 Chromium 中加载或刷新 `extension/`。
7. 走一遍“添加站点 → 保存 → 采集 → 比价表”流程。
8. 需要登录时，验证页面预检、重新登录和临时标签页清理。
9. 分别提交插件仓库源码和扩展仓库生成物。

## 7. 手动验收

至少验证：

- 站点能在插件目录或自定义地址中被识别。
- `matches` 不会误命中同域的其他路径。
- 直接接口站点不意外携带扩展凭据。
- 页面站点能复用当前登录页面，登录失败时错误可见。
- 成功响应能生成有价格的站点快照。
- 部分模型失败时，其他有效模型仍然保留。
- 站点模型能正确匹配规范模型，必要时别名才生效。
- 生成物与源文件通过 `--check`。

报告适配问题时，只保留字段结构、类型和数组层级。删除 Cookie、Authorization、Token、账户 ID、余额、签名和完整响应正文。

## 8. 提交清单

- [ ] `manifest.json` 使用允许字段，目录名和 ID 一致。
- [ ] `plugin.js` 导出 `sitePlugin`。
- [ ] 所有导入使用 `@app/core/...` 或 `@app/shared/...`。
- [ ] 没有动态导入、DOM 操作、绝对本地路径或 `../../`。
- [ ] 同域插件都有 `paths`。
- [ ] `models.json` 只包含真实且稳定的站内别名。
- [ ] 没有秘密、私有响应、本机路径和账号标识。
- [ ] 扩展仓库 `node scripts/plugin-build.mjs --check` 通过。
- [ ] 扩展仓库 `npm test` 通过。
- [ ] 已完成一次真实或脱敏 fixture 的手动验收。
