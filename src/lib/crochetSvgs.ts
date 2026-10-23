// Self-contained SVG illustrations for sample crochet pieces so demo mode looks
// authentic without external images that might fail or change unexpectedly.
function makeSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const BEAR_SVG = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f2ebe0"/>
  <!-- Crochet texture subtle pattern -->
  <defs>
    <pattern id="stitch" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M2,6 C4,4 8,4 10,6 C8,8 4,8 2,6 Z" fill="none" stroke="#e4d9c8" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="300" height="300" fill="url(#stitch)"/>
  <!-- Teddy bear amigurumi -->
  <g id="bear">
    <!-- Ears -->
    <circle cx="105" cy="100" r="28" fill="#c49a6c" stroke="#9a7245" stroke-width="3"/>
    <circle cx="105" cy="100" r="16" fill="#dfc19c"/>
    <circle cx="195" cy="100" r="28" fill="#c49a6c" stroke="#9a7245" stroke-width="3"/>
    <circle cx="195" cy="100" r="16" fill="#dfc19c"/>
    <!-- Body -->
    <ellipse cx="150" cy="210" rx="60" ry="65" fill="#c49a6c" stroke="#9a7245" stroke-width="3"/>
    <ellipse cx="150" cy="215" rx="38" ry="42" fill="#dfc19c"/>
    <!-- Head -->
    <circle cx="150" cy="140" r="54" fill="#c49a6c" stroke="#9a7245" stroke-width="3"/>
    <!-- Snout -->
    <ellipse cx="150" cy="155" rx="22" ry="16" fill="#f7f2ea"/>
    <!-- Nose & Mouth -->
    <polygon points="144,149 156,149 150,156" fill="#3a2f26"/>
    <path d="M150,156 L150,163 C145,163 143,161 143,161 M150,163 C155,163 157,161 157,161" fill="none" stroke="#3a2f26" stroke-width="2.2" stroke-linecap="round"/>
    <!-- Eyes (safety bead eyes) -->
    <circle cx="130" cy="136" r="6" fill="#1f1a14"/>
    <circle cx="132" cy="134" r="1.8" fill="#ffffff"/>
    <circle cx="170" cy="136" r="6" fill="#1f1a14"/>
    <circle cx="172" cy="134" r="1.8" fill="#ffffff"/>
    <!-- Cheeks (blush yarn) -->
    <circle cx="120" cy="148" r="7" fill="#df9b8e" opacity="0.6"/>
    <circle cx="180" cy="148" r="7" fill="#df9b8e" opacity="0.6"/>
    <!-- Little knitted scarf -->
    <path d="M120,182 Q150,192 180,182 Q174,196 150,195 Q126,196 120,182 Z" fill="#3f5d46" stroke="#2c4433" stroke-width="2"/>
    <rect x="156" y="188" width="16" height="34" rx="3" fill="#3f5d46" stroke="#2c4433" stroke-width="1.8"/>
  </g>
</svg>
`)

export const COASTER_SVG = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f6f0e4"/>
  <!-- Dahlia Coaster (flower petal mandala) -->
  <g transform="translate(150, 150)">
    <!-- Outer ring of petals -->
    <g fill="#c88b7b" stroke="#a36555" stroke-width="1.5">
      <circle cx="0" cy="-80" r="22"/>
      <circle cx="56" cy="-56" r="22"/>
      <circle cx="80" cy="0" r="22"/>
      <circle cx="56" cy="56" r="22"/>
      <circle cx="0" cy="80" r="22"/>
      <circle cx="-56" cy="56" r="22"/>
      <circle cx="-80" cy="0" r="22"/>
      <circle cx="-56" cy="-56" r="22"/>
    </g>
    <!-- Middle ring -->
    <g fill="#dfb196" stroke="#bf8f74" stroke-width="1.5">
      <circle cx="0" cy="-50" r="18"/>
      <circle cx="35" cy="-35" r="18"/>
      <circle cx="50" cy="0" r="18"/>
      <circle cx="35" cy="35" r="18"/>
      <circle cx="0" cy="50" r="18"/>
      <circle cx="-35" cy="35" r="18"/>
      <circle cx="-50" cy="0" r="18"/>
      <circle cx="-35" cy="-35" r="18"/>
    </g>
    <!-- Center circle (ochre core) -->
    <circle cx="0" cy="0" r="32" fill="#d4a359" stroke="#b08540" stroke-width="2"/>
    <circle cx="0" cy="0" r="18" fill="#f7f2ea" stroke="#b08540" stroke-width="1.5" stroke-dasharray="3,3"/>
  </g>
</svg>
`)

export const PILLOW_SVG = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#efe7d7"/>
  <!-- Chunky Pillow -->
  <g transform="translate(150, 150)">
    <!-- Pillow body -->
    <rect x="-85" y="-85" width="170" height="170" rx="30" fill="#ded4c0" stroke="#b8aa90" stroke-width="3"/>
    <!-- Chunky rib stitches -->
    <line x1="-55" y1="-70" x2="-55" y2="70" stroke="#c4b59b" stroke-width="10" stroke-linecap="round"/>
    <line x1="-20" y1="-70" x2="-20" y2="70" stroke="#c4b59b" stroke-width="10" stroke-linecap="round"/>
    <line x1="15" y1="-70" x2="15" y2="70" stroke="#c4b59b" stroke-width="10" stroke-linecap="round"/>
    <line x1="50" y1="-70" x2="50" y2="70" stroke="#c4b59b" stroke-width="10" stroke-linecap="round"/>
    <!-- Flap and coconut buttons -->
    <rect x="-65" y="-12" width="130" height="24" rx="6" fill="#ebe1ce" stroke="#9a7245" stroke-width="1.5"/>
    <circle cx="-35" cy="0" r="8" fill="#755030" stroke="#48301b" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="8" fill="#755030" stroke="#48301b" stroke-width="1.5"/>
    <circle cx="35" cy="0" r="8" fill="#755030" stroke="#48301b" stroke-width="1.5"/>
  </g>
</svg>
`)

export const FROG_SVG = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#edf2ec"/>
  <!-- Woodland Frog amigurumi -->
  <g transform="translate(150, 155)">
    <!-- Legs -->
    <ellipse cx="-55" cy="50" rx="26" ry="16" fill="#588157" stroke="#3a5a40" stroke-width="2.5"/>
    <ellipse cx="55" cy="50" rx="26" ry="16" fill="#588157" stroke="#3a5a40" stroke-width="2.5"/>
    <!-- Body -->
    <ellipse cx="0" cy="20" rx="60" ry="50" fill="#588157" stroke="#3a5a40" stroke-width="3"/>
    <ellipse cx="0" cy="25" rx="40" ry="32" fill="#a3b18a"/>
    <!-- Eye bumps -->
    <circle cx="-35" cy="-30" r="22" fill="#588157" stroke="#3a5a40" stroke-width="2.5"/>
    <circle cx="35" cy="-30" r="22" fill="#588157" stroke="#3a5a40" stroke-width="2.5"/>
    <!-- Big glossy eyes -->
    <circle cx="-35" cy="-30" r="11" fill="#1a251b"/>
    <circle cx="-32" cy="-33" r="3.5" fill="#ffffff"/>
    <circle cx="35" cy="-30" r="11" fill="#1a251b"/>
    <circle cx="38" cy="-33" r="3.5" fill="#ffffff"/>
    <!-- Happy smile -->
    <path d="M-22, -6 Q0, 12 22, -6" fill="none" stroke="#283618" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Blush -->
    <ellipse cx="-32" cy="0" rx="8" ry="5" fill="#e07a5f" opacity="0.6"/>
    <ellipse cx="32" cy="0" rx="8" ry="5" fill="#e07a5f" opacity="0.6"/>
  </g>
</svg>
`)
