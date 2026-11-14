# AI Price Analyzer 插件仓库
<p align="center">
  <a href="./README.md">简体中文</a> |
  <a href="./README.en.md">English</a>
</p>

这里维护 AI 中转站站点插件的唯一手写源。一个站点一个目录，扩展仓库从这些源文件生成运行时插件和站点目录。

- 扩展仓库：<https://github.com/napstablook666/ai-price-analyzer>
- 在线文档站：<https://napstablook666.github.io/ai-price-analyzer/>（VitePress，插件协议见「插件开发」一节）
- 扩展侧的完整协议说明：[docs/plugin-development.md](https://github.com/napstablook666/ai-price-analyzer/blob/main/docs/plugin-development.md)
- 插件仓库开发手册：[DEVELOPMENT.md](./DEVELOPMENT.md)

## 目录结构

```text
ai-price-analyzer-plugins/
  <id>/
    manifest.json   # 首页显示和地址匹配所需的站点元数据
    plugin.js       # export const sitePlugin
    models.json     # 站内模型写法到规范模型 id 的别名，可选
  README.md
  DEVELOPMENT.md
```

插件 ID 必须同时满足：

- 目录名、`manifest.json` 的 `id`、`plugin.js` 中的 `sitePlugin.id` 三者一致。
- 只使用小写字母、数字和连字符。
- 不包含站点密钥、Cookie、Token、Authorization、私有 URL 或完整私有响应。

## 与扩展仓库的关系

插件仓库和扩展仓库是两个独立的 Git 仓库。常用布局是把本仓库签出到扩展仓库根目录的 `plugins/`：

```text
ai-price-analyzer/
  extension/
  scripts/
  docs/
  plugins/          # 本仓库的嵌套签出，独立 Git 仓库
```

扩展仓库不跟踪本目录中的插件源文件。扩展仓库会把插件源生成到：

```text
extension/src/site-plugins/providers/<id>.js
extension/src/site-plugins/catalog.js
extension/src/shared/plugin-order.js
```

生成物会签入扩展仓库，因此扩展源码 checkout 可以直接加载；插件源改动后仍必须重新生成。不要直接编辑生成物。

## 插件商店（plugins.json）

`plugins.json` 是这个仓库对外发布的插件清单，扩展默认从这里读取：

```text
https://raw.githubusercontent.com/napstablook666/ai-price-analyzer-plugins/main/plugins.json
```

扩展的「站点与插件 → 插件仓库」页可以改成任意满足同样结构的地址。清单结构：

```json
{
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "windhub",
      "name": "WindHub",
      "version": "0.2.1",
      "description": "公益站公开价格接口",
      "hosts": ["windhub.cc"],
      "needsCode": true
    }
  ]
}
```

`needsCode: true` 表示插件依赖本仓库 `plugin.js` 里的采集代码，必须等扩展发版；`false` 表示可以写成声明式规格（`hosts` / `paths` / `request` / `responseFormat` / `preset` 等字段，不需要注入代码），扩展直接从清单安装。

这份清单由 `node scripts/plugin-build.mjs` 在扩展仓库生成，不要手改。

## 开发模式加载本地插件

扩展设置页打开「开发模式」后，可以粘贴或选择一个插件 JSON 规格直接加载，只在本机生效，并且在已安装列表里标为「本地插件」。关闭开发模式会连同本地插件一起卸载。

本地插件规格就是声明式插件的字段集合：

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

`responseFormat` 只能用在扩展已经支持的价格格式上，写自定义解析逻辑要提 PR 到扩展仓库。

## 快速开始

### 1. 准备两个仓库

```bash
git clone https://github.com/napstablook666/ai-price-analyzer.git
cd ai-price-analyzer
git clone https://github.com/napstablook666/ai-price-analyzer-plugins.git plugins
```

插件仓库也可以单独签出到其他路径，再使用 `PLUGIN_DIR` 指向它。

### 2. 修改插件

只修改：

```text
<id>/manifest.json
<id>/plugin.js
<id>/models.json
```

### 3. 从扩展仓库生成和校验

以下命令在扩展仓库根目录运行，不在插件仓库目录运行：

```bash
node scripts/plugin-build.mjs
node scripts/plugin-build.mjs --check
npm test
```

当插件仓库位于扩展仓库外部时：

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

## 提交前检查

- `manifest.json` 没有未知字段，站点 ID 与目录名一致。
- `plugin.js` 导出 `sitePlugin`，只使用 `@app/core/...` 或 `@app/shared/...` 静态导入。
- 没有动态 `import()`，没有 DOM 操作，没有 `../../` 导入。
- 站点特有的模型写法只在确实必要时写入 `models.json`。
- 从扩展仓库运行 `node scripts/plugin-build.mjs --check` 和 `npm test`。
- 真实采集手动验证通过后，分别提交插件仓库源文件和扩展仓库生成物。

完整字段、请求策略、模型别名优先级、同域路径约束和手动验收步骤见 [DEVELOPMENT.md](./DEVELOPMENT.md)。

## 许可证与安全

插件仓库沿用扩展项目的 GPL-3.0 许可。公开提交前请阅读扩展仓库的 [贡献指南](https://github.com/napstablook666/ai-price-analyzer/blob/main/CONTRIBUTING.md)、[安全政策](https://github.com/napstablook666/ai-price-analyzer/blob/main/SECURITY.md) 和 [隐私说明](https://github.com/napstablook666/ai-price-analyzer/blob/main/PRIVACY.md)。
