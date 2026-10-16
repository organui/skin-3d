export type Structure = {
  id: string
  name: string
  group: 'Skin layers' | 'Hair and glands' | 'Vessels and nerves'
  color: string
  description: string
  note: string
}

export const anatomySource = 'https://training.seer.cancer.gov/melanoma/anatomy/layers.html'
export const structures: Structure[] = [
  {
    id: 'epidermis',
    name: 'Epidermis',
    group: 'Skin layers',
    color: '#d9a586',
    description:
      'The thin outer layer of the skin. It renews itself constantly and forms a barrier against water loss and infection.',
    note: 'Drawn much thicker than its true proportion to the dermis so that it stays visible. Its sublayers (strata) are not modelled separately.',
  },
  {
    id: 'papillary-dermis',
    name: 'Papillary dermis',
    group: 'Skin layers',
    color: '#e6aba3',
    description:
      'The thin upper part of the dermis. Its finger-like papillae interlock with the epidermis and carry capillary loops close to the surface.',
    note: 'The wavy junction with the epidermis is a schematic of the dermal papillae, not measured geometry.',
  },
  {
    id: 'reticular-dermis',
    name: 'Reticular dermis',
    group: 'Skin layers',
    color: '#cf8f8a',
    description:
      'The thick, dense lower part of the dermis. Its collagen and elastic fibres give skin strength and stretch, and it houses hair follicles and glands.',
    note: 'Shown as a solid block. Its fibre network is not modelled.',
  },
  {
    id: 'hypodermis',
    name: 'Hypodermis',
    group: 'Skin layers',
    color: '#ecd496',
    description:
      'The subcutaneous layer beneath the dermis. Mostly fat, it insulates, cushions and anchors the skin to the tissue below.',
    note: 'The bulges on the cut face suggest fat lobules. Real thickness varies widely across the body.',
  },
  {
    id: 'hair-shaft',
    name: 'Hair shaft',
    group: 'Hair and glands',
    color: '#5a4434',
    description:
      'The keratinised strand of hair. It grows from the bulb at the base of the follicle and emerges through the epidermis.',
    note: 'Three hairs are shown as one selectable group. On the cut face the shaft can be seen inside its follicle.',
  },
  {
    id: 'hair-follicle',
    name: 'Hair follicle',
    group: 'Hair and glands',
    color: '#b48466',
    description:
      'A tube of epidermal cells reaching down into the dermis. Its swollen base, the bulb, produces the growing hair.',
    note: 'Three follicles are shown as one group. Two sit behind the cut face; isolate the group or ghost the layers to see them.',
  },
  {
    id: 'sebaceous-gland',
    name: 'Sebaceous gland',
    group: 'Hair and glands',
    color: '#a7b56b',
    description:
      'Small lobed glands that open into the hair follicle and release sebum, an oily secretion that softens hair and skin.',
    note: 'One gland is shown, beside the follicle on the cut face.',
  },
  {
    id: 'arrector-pili',
    name: 'Arrector pili muscle',
    group: 'Hair and glands',
    color: '#b3525a',
    description:
      'A small band of smooth muscle from the follicle to the upper dermis. When it contracts the hair stands up, giving goosebumps.',
    note: 'One muscle is shown, on the same side of the follicle as the sebaceous gland.',
  },
  {
    id: 'sweat-gland',
    name: 'Eccrine sweat gland',
    group: 'Hair and glands',
    color: '#7fb0a2',
    description:
      'A coiled tube deep in the dermis that secretes sweat. Its duct spirals up through the epidermis to a pore on the surface.',
    note: 'The coil is enlarged and simplified. Apocrine glands, found mainly in the armpits and groin, are not shown.',
  },
  {
    id: 'arteries',
    name: 'Cutaneous arteries',
    group: 'Vessels and nerves',
    color: '#c2463e',
    description:
      'Arteries form a deep plexus where the dermis meets the hypodermis and a superficial plexus in the upper dermis, which sends capillary loops into the papillae.',
    note: 'Vessels are drawn along the cut face and are much thicker than in reality. The epidermis has no blood vessels.',
  },
  {
    id: 'veins',
    name: 'Cutaneous veins',
    group: 'Vessels and nerves',
    color: '#5f7fb8',
    description:
      'Veins run beside the arteries in the same two plexuses and carry blood back out of the skin.',
    note: 'Blue is an illustrative convention, not the colour of the vessel.',
  },
  {
    id: 'nerve',
    name: 'Cutaneous nerve',
    group: 'Vessels and nerves',
    color: '#d9a62e',
    description:
      'Sensory nerve fibres rise through the hypodermis and dermis, ending freely or in receptors that detect touch, pressure, pain and temperature.',
    note: 'One nerve and its branches are shown as a single group. Free nerve endings in the epidermis are not modelled.',
  },
  {
    id: 'lamellar-corpuscle',
    name: 'Lamellar corpuscle',
    group: 'Vessels and nerves',
    color: '#ad98cc',
    description:
      'Also called a Pacinian corpuscle. A layered, onion-like receptor deep in the skin that responds to pressure and vibration.',
    note: 'Its concentric layers are not modelled; it is shown as a smooth ellipsoid.',
  },
]
export const groups = ['Skin layers', 'Hair and glands', 'Vessels and nerves'] as const
export const byId = Object.fromEntries(structures.map((s) => [s.id, s]))
export type View = 'Oblique' | 'Cross-section' | 'Surface'
export const views: View[] = ['Oblique', 'Cross-section', 'Surface']
export const defaultView: View = 'Oblique'
export const tour: { id: string; title: string; text: string; view: View; isolate?: boolean }[] = [
  {
    id: 'epidermis',
    title: 'The outer barrier',
    text: 'Start at the epidermis, the top layer. Look along the cut face to see how thin it is compared with the layers beneath, even though it is drawn thicker than life.',
    view: 'Oblique',
  },
  {
    id: 'papillary-dermis',
    title: 'Where the layers interlock',
    text: 'The papillary dermis rises into the epidermis in small ridges. Capillary loops reach into these papillae to nourish the epidermis, which has no vessels of its own.',
    view: 'Cross-section',
  },
  {
    id: 'hair-follicle',
    title: 'A hair and its partners',
    text: 'Follow the follicle down to its bulb. The sebaceous gland opens into it, and the arrector pili muscle runs from it towards the surface.',
    view: 'Cross-section',
  },
  {
    id: 'sweat-gland',
    title: 'From coil to pore',
    text: 'The sweat gland is isolated here. Its coil sits deep in the dermis and its duct climbs to a pore on the surface. Restore all to see the surrounding tissue.',
    view: 'Cross-section',
    isolate: true,
  },
  {
    id: 'lamellar-corpuscle',
    title: 'Sensing pressure',
    text: 'Deep in the hypodermis, the lamellar corpuscle sits at the end of a nerve branch. It responds to pressure and vibration.',
    view: 'Cross-section',
  },
]

export type Emphasis = 'normal' | 'selected' | 'ghosted'
// With nothing selected every structure keeps its own color. A selection
// keeps its structure solid and ghosts the rest so it stays visible even
// when it sits inside other geometry (follicles, glands, vessels).
export function emphasis(id: string, selected: string | null): Emphasis {
  if (!selected) return 'normal'
  return id === selected ? 'selected' : 'ghosted'
}
