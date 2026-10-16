# Model provenance and preparation

## Why the model is generated

The other OrganUI explorers use curated meshes from BodyParts3D 4.0 (CC BY 4.0). BodyParts3D models organs at body scale; it has no layered skin, so it cannot supply an epidermis, dermis, hypodermis, or appendages as selectable structures. Openly licensed skin cross-section meshes on general model-sharing sites have mixed or unclear terms and could not be retrieved from the build environment (its network policy reached only npm and GitHub), so none could be inspected or checksummed.

The model is therefore an **original schematic block of skin generated from code** by [`scripts/prepare-model.ts`](../scripts/prepare-model.ts). This avoids third-party terms entirely and lets every structure be a separate, named mesh.

## License

The generated model (`public/models/skin.glb`) is dedicated to the public domain under [**CC0 1.0 Universal**](https://creativecommons.org/publicdomain/zero/1.0/). The generator script is application code under the repository's MIT license. Credit line, if wanted:

> OrganUI Skin schematic model, dedicated to the public domain under CC0 1.0.

## What the model contains

Thirteen selectable structures in three interface groups. The front face (+z) is a cut through the layers; the appendages, vessels and nerve are laid along that face so they are visible on it.

| Group | Structure | Geometry |
| --- | --- | --- |
| Skin layers | Epidermis | Slab between a gently undulating surface and a wavy dermo-epidermal junction |
| | Papillary dermis | Slab from the wavy junction (schematic dermal papillae) to a flat base |
| | Reticular dermis | Slab down to the dermis–hypodermis boundary |
| | Hypodermis | Slab to the base of the block, with flattened ellipsoids on the cut face suggesting fat lobules |
| Hair and glands | Hair shaft | Three curved tubes from the bulbs out through the surface |
| | Hair follicle | Three oblique tubes, each with an ellipsoidal bulb; one on the cut face, two behind it |
| | Sebaceous gland | Three ellipsoid lobes beside the cut-face follicle |
| | Arrector pili muscle | A thin tube from the follicle to the papillary dermis, on the obtuse-angle side of the hair |
| | Eccrine sweat gland | A tubular coil at the base of the dermis and a duct that corkscrews through the epidermis to a pore |
| Vessels and nerves | Cutaneous arteries | Deep and superficial plexuses, connecting branches, a feeding artery, and capillary loops into the papillae |
| | Cutaneous veins | Deep and superficial plexuses, connecting branches, and a draining vein |
| | Cutaneous nerve | A nerve rising through the hypodermis and dermis, with two branches |
| | Lamellar corpuscle | An ellipsoid at the end of a nerve branch in the hypodermis |

## Accuracy and limitations

This is a **schematic, not a measured model**. Its layout follows standard textbook descriptions of skin structure, but nothing is traced from histology or imaging.

- Proportions are chosen for legibility. The epidermis is drawn far thicker relative to the dermis than in life, and vessels, nerves and glands are greatly enlarged. Real skin thickness varies widely across the body.
- Epidermal strata, the fibre network of the dermis, apocrine glands, tactile (Meissner) corpuscles, free nerve endings, lymphatics and other receptors are not modelled.
- Grouped structures (three hairs and follicles, the vessel plexuses, the nerve and its branches) are one selectable mesh each.
- Colours are illustrative conventions (for example, blue veins).

Descriptions in `src/anatomy.ts` are original concise summaries of standard skin anatomy. The in-app reference link is [NCI SEER Training: Layers of the Skin](https://training.seer.cancer.gov/melanoma/anatomy/layers.html); that page could not be fetched from the build environment, so the summaries were not re-checked against it in this session. **Not completed: review by a clinical anatomy or dermatology expert.** The app, README and About dialog disclose this.

## Reproduce the runtime asset

```sh
bun install --frozen-lockfile
bun run prepare:model
bun run verify:model
```

Generation is deterministic (fixed parameters and a seeded pseudo-random sequence for small irregularities) and needs no network access. It builds each structure from height-field slabs, Catmull–Rom tubes and ellipsoids with Three.js, merges each structure into one indexed mesh, stores its stable `structureId` on the GLB node, and writes `public/models/skin.glb` and `public/models/manifest.json` (generator version, extent, per-structure vertex and triangle counts, runtime size and SHA-256). Re-running the script reproduces the same checksum. `bun run verify:model` decodes the GLB, verifies its checksum, checks every expected structure, and validates the geometry.
