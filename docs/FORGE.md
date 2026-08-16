# Asset Forge

Request web hero and marketing assets via the Forge Inbox at [https://forge.kecktech.net](https://forge.kecktech.net).

Operators approve and run jobs in the UI. Use `lib/forge.ts` from server/tooling code.

## Env

| Variable | Purpose |
|----------|---------|
| `ASSET_FORGE_URL` | Base URL (default `https://forge.kecktech.net`) |
| `ASSET_FORGE_TOKEN` | Bearer service token |
| `ASSET_FORGE_PROJECT_ID` | `personal-website-gen` |

```ts
import { submitRequest } from "../lib/forge";

await submitRequest({ title: "Site hero set", packs: ["web"] });
```
