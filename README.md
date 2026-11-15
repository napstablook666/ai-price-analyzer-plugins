<p align="center">
  <img src="./assets/logo.svg" width="96" height="96" alt="AI Price Analyzer">
</p>
<h1 align="center">AI Price Analyzer Plugins</h1>

<p align="center">AI Price Analyzer 站点插件的唯一手写源：一个站点一个目录，扩展仓库从这里生成可加载的运行时代码。</p>

<p align="center">
  <a href="./README.md">简体中文</a> |
  <a href="./README.en.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/napstablook666/ai-price-analyzer"><img src="https://img.shields.io/badge/extension-ai--price--analyzer-3776AB?style=flat-square" alt="扩展仓库"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-GPL--3.0-22C55E?style=flat-square" alt="GPL-3.0 许可证"></a>
  <a href="https://napstablook666.github.io/ai-price-analyzer/"><img src="https://img.shields.io/badge/docs-%E5%9C%A8%E7%BA%BF-4F46E5?style=flat-square" alt="在线文档"></a>
</p>

每个中转站的价目藏在不同的接口、页面或者登录态后面。这个仓库把每家站的采集规则写成独立目录：`manifest.json` 说清站点和匹配范围，`plugin.js` 写请求与解析，`models.json` 补站内模型别名。扩展仓库运行构建器，把这些源文件生成 `src/site-plugins/` 下的运行时代码，浏览器里就能采。

## 亮点

| 亮点 | 为什么会在意 |
| --- | --- |
| 一个站点一个目录 | 加站、改站只动 `<id>/`，扩展核心不用碰。 |
| 只用公开的 `@app/` 导入 | 插件源码不写 `../../`，仓库搬走也不用改路径。 |
| 未知字段直接报错 | `manifest.json` 的字段白名单由构建器把关，写错不会被静默忽略。 |
| 生成物可校验 | `plugin-build.mjs --check` 对照生成物，漂移即失败，`npm test` 兜底。 |

## 架构

```text
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ plugin/<id>          │──▶│ plugin-build.mjs     │──▶│ generated files      │
└──────────────────────┘   └──────────────────────┘   └───────────┬──────────┘
                                                                  │ plugins.json
                                                                  ▼
                                                      ┌───────────▼──────────┐
                                                      │ extension runtime    │
                                                      └──────────────────────┘
```

- `plugin/<id>/`：本仓库里的手写源，构建器的唯一输入。
- `plugin-build.mjs`：在扩展仓库根目录运行，读取每个插件的 `manifest.json`、`plugin.js`、`models.json`。
- `generated files`：扩展仓库的 `src/site-plugins/providers/<id>.js`、`src/site-plugins/catalog.js`、`src/shared/plugin-order.js`。
- `plugins.json`：本仓库对外发布的插件清单，扩展默认从这里读取。
- `extension runtime`：Chromium MV3 扩展加载生成物后采集站点价目。

## 目录结构

```text
ai-price-analyzer-plugins/
  <id>/
    manifest.json   # 站点元数据与地址匹配范围
    plugin.js       # export const sitePlugin
    models.json     # 站内写法到规范模型 id 的别名，可选
    icon.svg        # 站点图标源，也可以是 icon.png
  plugins.json      # 生成的插件清单
  DEVELOPMENT.md    # 完整字段与流程手册
```

插件 ID 必须同时等于目录名、`manifest.json` 的 `id` 和 `plugin.js` 里的 `sitePlugin.id`，只能用 `a-z`、`0-9` 和连字符，并以字母或数字开头。

`manifest.json` 的必填字段是 `id`、`name`、`host`、`mode`（`direct` 或 `page`）、`order`；可选 `hosts`、`paths`、`category`（`paid` 或 `public`）、`addable`、`description`。同一个 `host` 对应多个插件时，所有相关插件都必须声明非空 `paths`，否则构建器直接失败。

`manifest.json` 示例：

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

## 插件清单（plugins.json）

`plugins.json` 是扩展默认读取的插件清单：

```text
https://raw.githubusercontent.com/napstablook666/ai-price-analyzer-plugins/main/plugins.json
```

扩展的「站点与插件 → 插件仓库」页可以改成任意满足同样结构的地址。清单条目长这样：

```json
{
  "id": "windhub",
  "name": "WindHub",
  "version": "0.4.0",
  "description": "公益站公开价格接口",
  "hosts": ["windhub.cc"],
  "needsCode": true
}
```

`needsCode: true` 表示采集依赖本仓库 `plugin.js` 里的代码，要等扩展重新生成并发版；`false` 表示可以写成声明式规格，扩展直接从清单安装。这份清单由构建器生成，不要手改。

## 快速开始

### 1. 准备两个仓库

插件仓库和扩展仓库是两个独立的 Git 仓库，常用布局是把本仓库签出到扩展仓库根目录的 `plugins/`：

```bash
git clone https://github.com/napstablook666/ai-price-analyzer.git
cd ai-price-analyzer
git clone https://github.com/napstablook666/ai-price-analyzer-plugins.git plugins
```

本仓库签出到别处也行，之后用 `PLUGIN_DIR` 指过去。

### 2. 改插件

只改 `<id>/manifest.json`、`<id>/plugin.js`、`<id>/models.json` 和图标文件，不要手改扩展仓库里的生成物。

### 3. 在扩展仓库生成和校验

以下命令都在**扩展仓库根目录**运行，不在本仓库目录里：

```bash
node scripts/plugin-build.mjs
node scripts/plugin-build.mjs --check
npm test
```

插件仓库在扩展仓库外部时：

```bash
PLUGIN_DIR=/path/to/plugins node scripts/plugin-build.mjs
PLUGIN_DIR=/path/to/plugins node scripts/plugin-build.mjs --check
```

Windows PowerShell：

```powershell
$env:PLUGIN_DIR = 'C:\path\to\plugins'
node scripts/plugin-build.mjs
node scripts/plugin-build.mjs --check
```

### 4. 在浏览器里跑通

在 Chromium 里加载或刷新扩展仓库根目录，走一遍「添加站点 → 保存 → 采集 → 比价表」。需要登录的站点，还要验证登录态预检、重新登录和临时标签页清理。

## 增加一个站点

1. 在本仓库创建 `<id>/` 目录。
2. 写 `manifest.json`、`plugin.js` 和可选的 `models.json`，必要时补 `icon.svg`。
3. 核对 `id`、`host`、`mode`、`order`、`paths` 与站点实际页面一致。
4. 在扩展仓库运行 `node scripts/plugin-build.mjs`。
5. 运行 `npm test` 和 `node scripts/plugin-build.mjs --check`。
6. 在 Chromium 里刷新扩展，跑通采集流程。
7. 分别提交本仓库的源文件和扩展仓库的生成物。

需要站内模型别名时，先查规范 id：

```bash
node scripts/model-lookup.mjs claude sonnet
```

查到再写进 `models.json`。查不到就别硬映射到相近模型，先确认规范模型表要不要更新。大小写、空格、`.`、`_`、`-` 差异、`provider/` 前缀、`:free` / `:thinking` 这类装饰后缀和常见日期尾巴，通用规则已经处理，不需要别名。

匹配优先级是：用户确认的 `modelMatchOverrides` > 本插件的 `models.json` 别名 > 规范模型表 > 内置精确/后缀/版本/模糊规则。

## 开发模式加载本地插件

扩展设置页打开「开发模式」后，可以直接粘贴或选择一个声明式插件规格，只在本机生效，在已安装列表里标为「本地插件」。关闭开发模式会连同本地插件一起卸载。

```json
{
  "id": "my-site",
  "version": "0.1.0",
  "name": "My Site",
  "hosts": ["pricing.example.com"],
  "paths": ["/api/pricing"],
  "request": { "endpoint": "/api/pricing", "credentials": "omit" },
  "responseFormat": "auto",
  "category": "paid",
  "mode": "direct"
}
```

`responseFormat` 只能填扩展已支持的格式；要写自定义解析逻辑，得在本仓库提插件。

## 限制

- 只能静态导入 `@app/core/...` 或 `@app/shared/...`，不能写 `../../` 或绝对本地路径。
- 禁止动态 `import()`，MV3 service worker 只认静态导入。
- 插件运行在 service worker 里，没有 DOM。要读页面数据或登录态时用 `mode: "page"` 和现有的页面桥接请求策略。
- 不保存、不打印 Token、Cookie、Authorization、API Key 或完整私有响应。
- 不在插件里写站点密钥、私有 URL 或账户标识。

## 提交前检查

- `manifest.json` 没有未知字段，站点 ID 与目录名一致。
- `plugin.js` 导出 `sitePlugin`，只用 `@app/` 静态导入。
- 站内特有写法确实必要时才写进 `models.json`。
- 从扩展仓库运行 `node scripts/plugin-build.mjs --check` 和 `npm test` 都通过。
- 真实采集手动验证过，再分两个仓库提交。

完整字段表、请求策略、模型别名优先级、同域路径约束和手动验收步骤见 [DEVELOPMENT.md](./DEVELOPMENT.md)；扩展侧协议见 [docs/plugin-development.md](https://github.com/napstablook666/ai-price-analyzer/blob/main/docs/plugin-development.md)。

## 相关仓库

- 扩展仓库：<https://github.com/napstablook666/ai-price-analyzer>
- 在线文档站：<https://napstablook666.github.io/ai-price-analyzer/>
- 扩展侧插件协议：[docs/plugin-development.md](https://github.com/napstablook666/ai-price-analyzer/blob/main/docs/plugin-development.md)
- 本仓库开发手册：[DEVELOPMENT.md](./DEVELOPMENT.md)

## 许可证与安全

本仓库沿用扩展项目的 GPL-3.0 许可，见 [LICENSE](./LICENSE)。公开提交前请读扩展仓库的[贡献指南](https://github.com/napstablook666/ai-price-analyzer/blob/main/CONTRIBUTING.md)、[安全政策](https://github.com/napstablook666/ai-price-analyzer/blob/main/SECURITY.md)和[隐私说明](https://github.com/napstablook666/ai-price-analyzer/blob/main/PRIVACY.md)。