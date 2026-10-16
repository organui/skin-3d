# Anatomy-tree registry integration

The anatomy panel uses the OrganUI registry item `anatomy-tree`, installed with the shadcn CLI. The installed source is tracked in version control; runtime and ordinary setup never contact a registry.

## Exact installation

Installed on 2026-10-16:

```sh
REGISTRY_URL=http://127.0.0.1:4417 bunx shadcn@4.21.0 add http://127.0.0.1:4417/anatomy-tree.json -y -o
```

The build sandbox's network policy blocked `organui.com` and `ui.shadcn.com`. The item was therefore served from a local static server (`python3 -m http.server 4417`) holding the registry output built with `bun run build` in `packages/registry` of the OrganUI repository at `master` commit **42dc34f** (organui PR #12, merged), plus shadcn's `colors/neutral.json` fetched from the shadcn GitHub repository. With network access, the equivalent public command is `bunx shadcn@4.21.0 add https://organui.com/r/anatomy-tree.json -y -o`.

| Artifact                                     | SHA-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Served `anatomy-tree.json`                   | `719c1547afb1453e809ee1b2fca0dc99858083aa3ff712477a493c77e8f5f389` |
| Embedded `files[0].content`                  | `14709d69270066ebb4677e736d71fa59c2ec9cf9c1f0e1a6a8236795633944cd` |
| Tracked `src/components/ui/anatomy-tree.tsx` | `3d5554cdc179f1ad778fd6321cc1414c293c4cca0535efd9aab679c686893538` |

These match the heart explorer's install exactly. The item declares `@base-ui/react@^1.8.0`; the CLI wrote `^1.8.0` to `package.json` and it was changed back to the exact `1.8.0` to match the other explorers' pins. `bun install` left the text `bun.lock` unchanged.

## Installed-source differences

The only difference from the published source is that the CLI removed the `"use client"` directive (and the blank line after it) for this non-RSC Vite target (`components.json` sets `"rsc": false`). No behaviour, markup, API, state, or class names changed. The file is listed in `.prettierignore` and must not be hand-edited, so its checksum stays verifiable. The consumer was set up before installing (`components.json`, `@/* -> src/*` alias in `tsconfig.json` and `vite.config.ts`, Tailwind 4 in `src/styles.css`), so the file landed in `src/components/ui/` directly.

## API used

- `data`: three group rows (`selectable: false`), each with its structure leaves (`color` set to the structure's mesh colour);
- `selectedId` / `onSelectionChange`: the app's single controlled selection;
- `visibility` / `onVisibilityChange`: a map keyed by leaf IDs, where a missing entry means visible;
- `defaultExpandedIds`: all three groups;
- `label="Skin anatomy"` and `className="registry-tree"`.

## Application adapter

Scene-specific logic lives in `src/anatomy-adapter.ts`, built from `structures` and `groups` in `src/anatomy.ts`:

| Tree ID                    | Scene leaves (GLB `structureId`)                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `group-skin-layers`        | `epidermis`, `papillary-dermis`, `reticular-dermis`, `hypodermis`                         |
| `group-hair-and-glands`    | `hair-shaft`, `hair-follicle`, `sebaceous-gland`, `arrector-pili`, `sweat-gland`          |
| `group-vessels-and-nerves` | `arteries`, `veins`, `nerve`, `lamellar-corpuscle`                                        |

Groups are interface groupings only and do not claim anatomical containment. Every leaf ID is exactly one application structure ID and one GLB node. `assertAnatomyMapping` runs at import and throws on missing, unknown, or duplicate leaves; `src/anatomy-adapter.test.ts` covers the adapter.

Selection, visibility, reset and reveal behave exactly as in the heart explorer: group rows expand or collapse rather than select, visibility stays the app's `hidden` set, Reset remounts the tree to clear its search and expansion, and opening the panel scrolls an already-selected row into the tree's own scroll area.

## Theme setup

`src/styles.css` imports Tailwind CSS 4 and defines shadcn tokens (`--background`, `--foreground`, `--muted`, `--muted-foreground`, `--accent`, `--border`, `--input`, `--ring`) from the explorer's existing warm neutral palette. The app's own muted text colour was renamed from `--muted` to `--muted-ink` because shadcn uses `--muted` as a background colour.

As in the kidney explorer, the app's global resets moved into `@layer base` after Tailwind preflight, so registry utility classes still win. Preflight changes that would otherwise alter the rest of the app are reverted in that layer: `html` line-height `normal`, heading size/weight and `dialog` margin reverted to browser defaults, and `svg` back to inline display. Unlayered `.registry-tree` rules fit the component into the panel: no card frame, the previous search-field look with a search glyph, the previous row and hover tints, pill-shaped visibility buttons (dashed when hidden or mixed), and an internally scrolling row area.

## Friction and observations

No registry defect blocked the integration and the component was not modified. The known limits recorded in heart-3d still apply: the CLI loosens exact pins, search and expansion are internal (Reset remounts the tree), the search box has no placeholder prop, and reveal runs only when `selectedId` changes. Screen-reader testing of the tree was not done.
