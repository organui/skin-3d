import { mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Document, NodeIO } from '@gltf-transform/core'
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { structures } from '../src/anatomy'

// An original, schematic block of skin generated from code. Nothing here is
// measured or traced from a scan: proportions are chosen for legibility (the
// epidermis and vessels are exaggerated) and every shape is a simple
// parametric surface, tube, or ellipsoid. Generation is deterministic, so the
// runtime GLB and its checksum are reproducible.

const GENERATOR = 'organui-skin-block'
const GENERATOR_VERSION = '1.0.0'

// Block extent in display units. +z is the cut face that shows the layers.
const X0 = -2.2,
  X1 = 2.2,
  Z0 = -1.6,
  Z1 = 1.6
const FACE = Z1

// Layer boundaries (y). The surface is at about 0.
const surface = (x: number, z: number) =>
  0.02 * Math.sin(x * 2.3 + 0.4) * Math.cos(z * 1.7) + 0.012 * Math.sin(x * 9 + z * 4)
const junction = (x: number, z: number) =>
  -0.19 + 0.06 * Math.sin(x * 7.5) * Math.cos(z * 6.5) + 0.01 * Math.sin(z * 3)
const papillaryBase = (x: number, z: number) => -0.52 + 0.015 * Math.sin(x * 2 + z)
const dermisBase = (x: number, z: number) =>
  -1.55 + 0.04 * Math.sin(x * 1.6 + 0.8) + 0.03 * Math.cos(z * 1.9)
const hypodermisBase = () => -2.6

type Height = (x: number, z: number) => number

/** A closed slab between two height fields over the block's footprint. */
function slab(top: Height, bottom: Height, nx = 88, nz = 64) {
  const positions: number[] = []
  const indices: number[] = []
  const grid = (height: Height, flip: boolean) => {
    const start = positions.length / 3
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = X0 + ((X1 - X0) * i) / nx,
          z = Z0 + ((Z1 - Z0) * j) / nz
        positions.push(x, height(x, z), z)
      }
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const a = start + j * (nx + 1) + i,
          b = a + 1,
          c = a + nx + 1,
          d = c + 1
        if (flip) indices.push(a, b, c, b, d, c)
        else indices.push(a, c, b, b, c, d)
      }
  }
  grid(top, false)
  grid(bottom, true)
  // Four walls, each a strip of quads between the two height fields.
  const wall = (edge: (t: number) => [number, number], count: number, flip: boolean) => {
    const start = positions.length / 3
    for (let i = 0; i <= count; i++) {
      const [x, z] = edge(i / count)
      positions.push(x, bottom(x, z), z, x, top(x, z), z)
    }
    for (let i = 0; i < count; i++) {
      const a = start + i * 2,
        b = a + 1,
        c = a + 2,
        d = a + 3
      if (flip) indices.push(a, b, c, b, d, c)
      else indices.push(a, c, b, b, c, d)
    }
  }
  wall((t) => [X0 + (X1 - X0) * t, Z1], nx, false)
  wall((t) => [X0 + (X1 - X0) * t, Z0], nx, true)
  wall((t) => [X1, Z0 + (Z1 - Z0) * t], nz, true)
  wall((t) => [X0, Z0 + (Z1 - Z0) * t], nz, false)
  const geometry = new BufferGeometry()
    .setAttribute('position', new Float32BufferAttribute(positions, 3))
    .setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function tube(points: [number, number, number][], radius: number, segments = 64, radial = 14) {
  const curve = new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    false,
    'centripetal',
  )
  return capped(new TubeGeometry(curve, segments, radius, radial, false), curve, radius)
}

// Rounded ends so vessels and ducts do not show open, hollow tube ends.
function capped(geometry: TubeGeometry, curve: CatmullRomCurve3, radius: number) {
  const caps = [0, 1].map((t) =>
    new SphereGeometry(radius, 14, 10).translate(...curve.getPoint(t).toArray()),
  )
  return merge([geometry, ...caps])
}

function ellipsoid(
  center: [number, number, number],
  radii: [number, number, number],
  tilt = 0,
  detail: [number, number] = [28, 20],
) {
  return new SphereGeometry(1, ...detail).applyMatrix4(
    new Matrix4().compose(
      new Vector3(...center),
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), tilt),
      new Vector3(...radii),
    ),
  )
}

function merge(parts: BufferGeometry[]) {
  const prepared = parts.map((part) => {
    const geometry = part.index ? part : part.toNonIndexed()
    for (const name of Object.keys(geometry.attributes))
      if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name)
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
    return geometry
  })
  const merged = mergeGeometries(prepared)
  if (!merged) throw new Error('Could not merge geometry')
  return merged
}

// Deterministic pseudo-random numbers for small irregularities.
let seed = 20261016
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

// ---- Hair units: follicle, shaft, and (for the one on the cut face) gland and muscle.
type HairUnit = { bulb: [number, number]; opening: [number, number]; z: number }
const hairs: HairUnit[] = [
  { bulb: [-1.32, -1.72], opening: [-0.72, surface(-0.72, FACE)], z: FACE - 0.07 },
  { bulb: [1.0, -1.62], opening: [1.5, surface(1.5, -0.55)], z: -0.55 },
  { bulb: [-0.2, -1.66], opening: [0.32, surface(0.32, -1.05)], z: -1.05 },
]
const along = ({ bulb, opening }: HairUnit, t: number): [number, number] => [
  bulb[0] + (opening[0] - bulb[0]) * t,
  bulb[1] + (opening[1] - bulb[1]) * t,
]
function hairFollicle(unit: HairUnit) {
  const steps = Array.from({ length: 6 }, (_, i) => i / 5)
  const wall = tube(
    steps.map((t) => [...along(unit, 0.08 + t * 0.86), unit.z] as [number, number, number]),
    0.12,
  )
  const [bx, by] = unit.bulb
  const angle = Math.atan2(unit.opening[1] - by, unit.opening[0] - bx) - Math.PI / 2
  return merge([wall, ellipsoid([bx, by, unit.z], [0.19, 0.24, 0.19], angle)])
}
function hairShaft(unit: HairUnit) {
  const [dx, dy] = [unit.opening[0] - unit.bulb[0], unit.opening[1] - unit.bulb[1]]
  const length = Math.hypot(dx, dy)
  const [ux, uy] = [dx / length, dy / length]
  const [ox, oy] = unit.opening
  // Sit the shaft slightly forward on the cut face so it reads inside its follicle.
  const z = unit.z === hairs[0].z ? FACE + 0.02 : unit.z
  const bend = 0.12 + random() * 0.08
  return tube(
    [
      [...along(unit, 0.06), z],
      [...along(unit, 0.5), z],
      [ox, oy, z],
      [ox + ux * 0.45 + bend * 0.5, oy + uy * 0.45, z],
      [ox + ux * 0.85 + bend * 1.6, oy + uy * 0.8 - bend * 0.4, z],
    ],
    0.045,
  )
}
// Unit vector perpendicular to the first follicle, on its obtuse-angle side.
const [fdx, fdy] = [hairs[0].opening[0] - hairs[0].bulb[0], hairs[0].opening[1] - hairs[0].bulb[1]]
const flen = Math.hypot(fdx, fdy)
const side: [number, number] = [-fdy / flen, fdx / flen]
function sebaceousGland() {
  const [ax, ay] = along(hairs[0], 0.68)
  const lobes = [
    [0.21, 0.02, 0.13],
    [0.33, -0.12, 0.12],
    [0.3, 0.15, 0.1],
  ] as const
  return merge(
    lobes.map(([out, up, r]) =>
      ellipsoid(
        [ax + side[0] * out, ay + side[1] * out + up, FACE - 0.06],
        [r * 1.05, r, r * 0.9],
        0.4,
      ),
    ),
  )
}
function arrectorPili() {
  const [ax, ay] = along(hairs[0], 0.4)
  return tube(
    [
      [ax + side[0] * 0.1, ay + side[1] * 0.1, FACE - 0.03],
      [ax + side[0] * 0.35, ay + 0.35, FACE - 0.02],
      [ax + side[0] * 0.62, -0.42, FACE - 0.02],
      [-1.86, -0.27, FACE - 0.03],
    ],
    0.042,
  )
}

// ---- Eccrine sweat gland: a coil at the base of the dermis and a duct to a pore.
function sweatGland() {
  const center = new Vector3(0.38, -1.4, FACE - 0.05)
  const coil: [number, number, number][] = []
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2
    coil.push([
      center.x + 0.19 * Math.cos(t) + 0.08 * Math.cos(4 * t),
      center.y + 0.11 * Math.sin(3 * t),
      center.z + 0.12 * Math.sin(t) + 0.08 * Math.sin(4 * t),
    ])
  }
  const top = coil[0]
  const duct: [number, number, number][] = [top]
  const ductZ = FACE - 0.01
  for (let i = 1; i <= 9; i++) {
    const y = top[1] + ((junction(0.62, FACE) - top[1]) * i) / 9
    duct.push([top[0] + 0.03 * Math.sin(i * 1.4) + i * 0.018, y, ductZ])
  }
  // A corkscrew through the epidermis to the pore.
  const [px, py] = duct[duct.length - 1]
  for (let i = 1; i <= 16; i++) {
    const t = i / 16
    duct.push([
      px + 0.05 * Math.sin(t * Math.PI * 4),
      py + (surface(px, FACE) + 0.01 - py) * t,
      ductZ + 0.03 * Math.cos(t * Math.PI * 4) - 0.03,
    ])
  }
  return merge([tube(coil, 0.045, 320, 10), tube(duct, 0.04, 160, 10)])
}

// ---- Vessels: deep and superficial plexuses along the cut face, linked vertically.
function plexus(y: number, z: number, radius: number, phase: number, from = X0, to = X1) {
  const points: [number, number, number][] = []
  for (let i = 0; i <= 18; i++) {
    const x = from + ((to - from) * i) / 18
    points.push([x, y + 0.035 * Math.sin(x * 2.2 + phase), z])
  }
  return tube(points, radius, 120, 12)
}
function capillaryLoop(x: number, fromY: number, z: number, radius: number, lean: number) {
  const tip = junction(x, FACE) + 0.07
  return tube(
    [
      [x - 0.04, fromY, z],
      [x - 0.03 + lean, (fromY + tip) / 2, z],
      [x + lean, tip, z],
      [x + 0.05 + lean, (fromY + tip) / 2, z],
      [x + 0.07, fromY, z],
    ],
    radius,
    40,
    8,
  )
}
// Papilla crests along the cut face, where capillary loops rise.
const papillae = (() => {
  const crests: number[] = []
  for (let x = X0 + 0.15; x < X1 - 0.15; x += 0.01) {
    const y = junction(x, FACE)
    if (y > junction(x - 0.01, FACE) && y >= junction(x + 0.01, FACE)) crests.push(x)
  }
  return crests.filter((x) => Math.abs(x + 1) > 0.35 && Math.abs(x - 0.6) > 0.2)
})()
function arteries() {
  const z = FACE - 0.02
  const deepY = dermisBase(0, FACE) - 0.04
  const superficialY = -0.47
  return merge([
    plexus(deepY, z, 0.06, 0),
    plexus(superficialY, z, 0.035, 1.3),
    // Feeding artery rising from the hypodermis and two connecting branches.
    tube(
      [
        [1.85, -2.62, z],
        [1.8, -2.1, z],
        [1.9, -1.8, z],
        [1.86, deepY, z],
      ],
      0.075,
    ),
    tube(
      [
        [-0.15, deepY, z],
        [-0.1, -1.0, z],
        [-0.17, superficialY, z],
      ],
      0.035,
    ),
    tube(
      [
        [1.35, deepY, z],
        [1.28, -1.0, z],
        [1.33, superficialY, z],
      ],
      0.035,
    ),
    ...papillae.map((x) => capillaryLoop(x, superficialY, FACE, 0.026, 0)),
  ])
}
function veins() {
  const z = FACE - 0.03
  const deepY = dermisBase(0, FACE) - 0.2
  const superficialY = -0.6
  return merge([
    plexus(deepY, z, 0.07, 2.1),
    plexus(superficialY, z, 0.04, 0.4),
    tube(
      [
        [2.02, -2.62, z],
        [2.05, -2.1, z],
        [2.0, -1.85, z],
        [2.04, deepY, z],
      ],
      0.085,
    ),
    tube(
      [
        [-0.32, deepY, z],
        [-0.3, -1.1, z],
        [-0.34, superficialY, z],
      ],
      0.04,
    ),
    tube(
      [
        [1.15, deepY, z],
        [1.12, -1.1, z],
        [1.17, superficialY, z],
      ],
      0.04,
    ),
  ])
}

// ---- Nerve and lamellar corpuscle.
const corpuscle = { center: [0.95, -2.2, FACE - 0.07] as [number, number, number] }
function nerve() {
  const z = FACE - 0.03
  return merge([
    tube(
      [
        [0.75, -2.62, z],
        [0.72, -2.2, z],
        [0.8, -1.7, z],
        [0.86, -1.05, z],
        [0.93, -0.5, z],
        [0.98, junction(0.98, FACE) - 0.04, z],
      ],
      0.04,
    ),
    tube(
      [
        [0.72, -2.25, z],
        [0.8, -2.26, z],
        [corpuscle.center[0] - 0.06, corpuscle.center[1] - 0.12, z],
      ],
      0.03,
    ),
    tube(
      [
        [0.84, -1.2, z],
        [0.6, -0.95, z],
        [0.52, -0.6, z],
        [0.5, junction(0.5, FACE) - 0.05, z],
      ],
      0.025,
    ),
  ])
}
function lamellarCorpuscle() {
  return ellipsoid(corpuscle.center, [0.16, 0.27, 0.15], -0.5)
}

// ---- Fat lobules on the hypodermis cut face.
function hypodermis() {
  const lobules: BufferGeometry[] = []
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 9; col++) {
      const x = X0 + 0.3 + col * 0.48 + (row % 2) * 0.24 + (random() - 0.5) * 0.08
      const y = -1.85 - row * 0.3 + (random() - 0.5) * 0.06
      if (x > X1 - 0.22) continue
      if (Math.hypot(x - corpuscle.center[0], y - corpuscle.center[1]) < 0.3) continue
      lobules.push(ellipsoid([x, y, FACE - 0.035], [0.21, 0.13, 0.06], 0, [18, 12]))
    }
  return merge([slab(dermisBase, hypodermisBase, 44, 32), ...lobules])
}

const builders: Record<string, () => BufferGeometry> = {
  epidermis: () => slab(surface, junction),
  'papillary-dermis': () => slab(junction, papillaryBase),
  'reticular-dermis': () => slab(papillaryBase, dermisBase, 44, 32),
  hypodermis,
  'hair-shaft': () => merge(hairs.map(hairShaft)),
  'hair-follicle': () => merge(hairs.map(hairFollicle)),
  'sebaceous-gland': sebaceousGland,
  'arrector-pili': arrectorPili,
  'sweat-gland': sweatGland,
  arteries,
  veins,
  nerve,
  'lamellar-corpuscle': lamellarCorpuscle,
}

const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')
await mkdir('public/models', { recursive: true })
const doc = new Document()
const credit = 'OrganUI Skin schematic model, dedicated to the public domain under CC0 1.0'
doc.getRoot().getAsset().copyright = credit
const scene = doc.createScene('OrganUI Skin — schematic block')
const buffer = doc.createBuffer()
const built = structures.map((structure) => {
  const build = builders[structure.id]
  if (!build) throw new Error(`No geometry for ${structure.id}`)
  const geometry = build()
  const positions = new Float32Array(geometry.getAttribute('position').array)
  const normals = new Float32Array(geometry.getAttribute('normal').array)
  const indices = new Uint32Array(geometry.index!.array)
  const color = new Color(structure.color)
  const material = doc
    .createMaterial(structure.id)
    .setBaseColorFactor([color.r, color.g, color.b, 1])
    .setRoughnessFactor(0.65)
    .setMetallicFactor(0)
    .setDoubleSided(true)
  const primitive = doc
    .createPrimitive()
    .setAttribute(
      'POSITION',
      doc.createAccessor().setType('VEC3').setArray(positions).setBuffer(buffer),
    )
    .setAttribute(
      'NORMAL',
      doc.createAccessor().setType('VEC3').setArray(normals).setBuffer(buffer),
    )
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(indices).setBuffer(buffer))
    .setMaterial(material)
  scene.addChild(
    doc
      .createNode(structure.id)
      .setMesh(doc.createMesh(structure.id).addPrimitive(primitive))
      .setExtras({ structureId: structure.id }),
  )
  geometry.dispose()
  return { id: structure.id, vertices: positions.length / 3, triangles: indices.length / 3 }
})
const runtime = await new NodeIO().writeBinary(doc)
await Bun.write('public/models/skin.glb', runtime)
const manifest = {
  model: 'OrganUI Skin schematic block',
  generator: { name: GENERATOR, version: GENERATOR_VERSION, script: 'scripts/prepare-model.ts' },
  license: 'CC0-1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  credit,
  provenance:
    'Original procedural geometry generated by this repository. No scanned, traced, or third-party anatomy data.',
  extent: {
    x: [X0, X1],
    y: [hypodermisBase(), 0],
    z: [Z0, Z1],
    units: 'display units, not millimetres',
  },
  runtime: { file: 'skin.glb', bytes: runtime.byteLength, sha256: sha(runtime) },
  structures: built,
}
await Bun.write('public/models/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `Generated ${structures.length} structures, ${built.reduce((n, s) => n + s.triangles, 0)} triangles, ${runtime.byteLength} bytes. SHA-256 ${sha(runtime)}`,
)
