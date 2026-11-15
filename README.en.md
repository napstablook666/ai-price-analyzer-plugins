<h1 align="center">AI Price Analyzer Plugins</h1>

<p align="center">The single hand-written source for AI Price Analyzer station plugins: one directory per station, and the extension repository generates loadable runtime code from it.</p>

<p align="center">
  <a href="./README.md">简体中文</a> |
  <a href="./README.en.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/napstablook666/ai-price-analyzer"><img src="https://img.shields.io/badge/extension-ai--price--analyzer-3776AB?style=flat-square" alt="Extension repository"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-GPL--3.0-22C55E?style=flat-square" alt="GPL-3.0 license"></a>
  <a href="https://napstablook666.github.io/ai-price-analyzer/"><img src="https://img.shields.io/badge/docs-%E5%9C%A8%E7%BA%BF-4F46E5?style=flat-square" alt="Documentation"></a>
</p>

Every relay station hides its prices behind a different endpoint, page, or login session. This repository turns each station's collection rules into its own directory: `manifest.json` describes the station and the URLs it matches, `plugin.js` holds the request and parsing logic, and `models.json` adds station-specific model aliases. The extension repository runs a builder that turns these sources into the runtime code under `src/site-plugins/`, which the browser extension loads.

## Highlights

| Highlight | Why it matters |
| --- | --- |
| One directory per station | Adding or fixing a station only touches `<id>/`; the extension core stays untouched. |
| Only public `@app/` imports | Plugin sources never use `../../`, so moving the checkout requires no path changes. |
| Unknown fields fail loudly | The builder enforces the `manifest.json` field allowlist instead of ignoring mistakes. |
| Generated files are checkable | `plugin-build.mjs --check` compares against generated output, so drift fails, and `npm test` backs it up. |

## Architecture

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

- `plugin/<id>/`: hand-written sources in this repository, the builder's only input.
- `plugin-build.mjs`: runs from the extension repository root and reads each plugin's `manifest.json`, `plugin.js`, and `models.json`.
- `generated files`: the extension repository's `src/site-plugins/providers/<id>.js`, `src/site-plugins/catalog.js`, and `src/shared/plugin-order.js`.
- `plugins.json`: the plugin registry this repository publishes and the extension reads by default.
- `extension runtime`: the Chromium MV3 extension loads generated files and collects station prices.

## Layout

```text
ai-price-analyzer-plugins/
  <id>/
    manifest.json   # station metadata and URL match scope
    plugin.js       # export const sitePlugin
    models.json     # station name aliases to canonical model IDs, optional
    icon.svg        # station icon source, icon.png also works
  plugins.json      # generated plugin registry
  DEVELOPMENT.md    # full field reference and workflow
```

A plugin ID must equal the directory name, the `manifest.json` `id`, and `sitePlugin.id` in `plugin.js`. It may use only `a-z`, `0-9`, and hyphens, and must start with a letter or digit.

Required `manifest.json` fields are `id`, `name`, `host`, `mode` (`direct` or `page`), and `order`; optional fields are `hosts`, `paths`, `category` (`paid` or `public`), `addable`, and `description`. When several plugins share one `host`, every one of them must declare a non-empty `paths`, and the builder fails otherwise.

Example `manifest.json`:

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

## Plugin registry (plugins.json)

`plugins.json` is the registry the extension reads by default:

```text
https://raw.githubusercontent.com/napstablook666/ai-price-analyzer-plugins/main/plugins.json
```

The extension's plugin registry page accepts any address with the same structure. A registry entry looks like this:

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

`needsCode: true` means collection depends on code in this repository's `plugin.js`, so it ships with a regenerated extension release; `false` means the plugin can be described declaratively and installed straight from the registry. The builder generates this file, so do not edit it by hand.

## Quick Start

### 1. Prepare both repositories

The plugin repository and the extension repository are separate Git repositories. The common layout checks this one out as `plugins/` inside the extension repository root:

```bash
git clone https://github.com/napstablook666/ai-price-analyzer.git
cd ai-price-analyzer
git clone https://github.com/napstablook666/ai-price-analyzer-plugins.git plugins
```

Checking this repository out elsewhere also works; point `PLUGIN_DIR` at it afterwards.

### 2. Edit a plugin

Change only `<id>/manifest.json`, `<id>/plugin.js`, `<id>/models.json`, and icon files. Never edit generated files in the extension repository.

### 3. Generate and check from the extension repository

Run these from the **extension repository root**, not from this repository:

```bash
node scripts/plugin-build.mjs
node scripts/plugin-build.mjs --check
npm test
```

When the plugin repository lives outside the extension repository:

```bash
PLUGIN_DIR=/path/to/plugins node scripts/plugin-build.mjs
PLUGIN_DIR=/path/to/plugins node scripts/plugin-build.mjs --check
```

Windows PowerShell:

```powershell
$env:PLUGIN_DIR = 'C:\path\to\plugins'
node scripts/plugin-build.mjs
node scripts/plugin-build.mjs --check
```

### 4. Verify in the browser

Load or reload the extension repository root in Chromium and walk through adding a station, saving it, collecting, and checking the comparison table. For stations that need a login, also verify the login pre-check, re-login, and temporary tab cleanup.

## Adding a station

1. Create `<id>/` in this repository.
2. Write `manifest.json`, `plugin.js`, and optional `models.json`, plus `icon.svg` when needed.
3. Verify that `id`, `host`, `mode`, `order`, and `paths` match the real station pages.
4. Run `node scripts/plugin-build.mjs` in the extension repository.
5. Run `npm test` and `node scripts/plugin-build.mjs --check`.
6. Reload the extension in Chromium and finish the collection flow.
7. Commit the sources here and the generated files in the extension repository separately.

To add a station-specific model alias, resolve the canonical ID first:

```bash
node scripts/model-lookup.mjs claude sonnet
```

Only write the alias into `models.json` once it resolves. If it does not, do not force an unknown model onto a near match; check whether the canonical table needs an update. Case differences, spacing, `.`, `_`, `-`, `provider/` prefixes, decorative suffixes such as `:free` or `:thinking`, and common date suffixes are already handled by the general rules, so they need no alias.

Matching priority is: user-confirmed `modelMatchOverrides`, then this plugin's `models.json` aliases, then the canonical model table, then the built-in exact, suffix, version, and fuzzy rules.

## Local plugins in development mode

With development mode enabled on the extension settings page, you can paste or select a declarative plugin spec that applies only to this machine and appears in the installed list as a local plugin. Turning development mode off uninstalls it.

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

`responseFormat` only accepts formats the extension already supports. Custom parsing logic belongs in a plugin in this repository.

## Constraints

- Static imports only, from `@app/core/...` or `@app/shared/...`; no `../../` and no absolute local paths.
- No dynamic `import()`; an MV3 service worker only loads static imports.
- Plugins run in the service worker and have no DOM. Use `mode: "page"` with the existing page-bridge request strategies to read page data or login state.
- Never store or print tokens, cookies, authorization headers, API keys, or complete private responses.
- Never put station secrets, private URLs, or account identifiers in a plugin.

## Pre-submit checks

- `manifest.json` has no unknown fields, and the station ID matches the directory name.
- `plugin.js` exports `sitePlugin` and uses only static `@app/` imports.
- Station-specific names are written to `models.json` only when genuinely needed.
- `node scripts/plugin-build.mjs --check` and `npm test` both pass from the extension repository.
- A real collection run has been verified manually, then commit to both repositories.

For the complete field reference, request strategies, alias priority, same-host path rules, and manual acceptance steps, see [DEVELOPMENT.md](./DEVELOPMENT.md); for the extension-side protocol, see [docs/plugin-development.md](https://github.com/napstablook666/ai-price-analyzer/blob/main/docs/plugin-development.md).

## Related repositories

- Extension repository: <https://github.com/napstablook666/ai-price-analyzer>
- Documentation site: <https://napstablook666.github.io/ai-price-analyzer/>
- Extension-side plugin protocol: [docs/plugin-development.md](https://github.com/napstablook666/ai-price-analyzer/blob/main/docs/plugin-development.md)
- Development manual for this repository: [DEVELOPMENT.md](./DEVELOPMENT.md)

## License and security

This repository follows the extension project's GPL-3.0 license; see [LICENSE](./LICENSE). Before opening a public pull request, read the extension repository's [contributing guide](https://github.com/napstablook666/ai-price-analyzer/blob/main/CONTRIBUTING.md), [security policy](https://github.com/napstablook666/ai-price-analyzer/blob/main/SECURITY.md), and [privacy notes](https://github.com/napstablook666/ai-price-analyzer/blob/main/PRIVACY.md).