/* Generates assets/iconaplikasi.png — 152x152 launcher mark for KASIRKU BUMDes POS. */
const path = require('path');
const sharp = require('sharp');
const NAVY = '#0C3B6E', BLUE = '#2F86D1', GOLD = '#D8A93E', RED = '#D64545';
const S = 152;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 152 152">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BLUE}"/><stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="148" height="148" rx="30" fill="url(#bg)" stroke="${GOLD}" stroke-width="2"/>
  <circle cx="76" cy="76" r="50" fill="none" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="1.5"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M40 60h72v50a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6z" fill="#ffffff" fill-opacity="0.10" stroke="#ffffff" stroke-width="4"/>
    <path d="M36 52h80l-4 16a10 10 0 0 1-19.5 0 9.5 9.5 0 0 1-18.5 0 9.5 9.5 0 0 1-18.5 0A10 10 0 0 1 36 52z" fill="${GOLD}" stroke="${GOLD}" stroke-width="3"/>
    <path d="M40 52l6-14h60l6 14" stroke="#ffffff" stroke-width="4"/>
    <rect x="64" y="82" width="24" height="34" rx="3" fill="${NAVY}" stroke="${GOLD}" stroke-width="3"/>
    <circle cx="82" cy="100" r="2" fill="${GOLD}"/>
    <rect x="47" y="84" width="12" height="12" rx="2" fill="${BLUE}" stroke="#ffffff" stroke-width="2.5"/>
    <rect x="93" y="84" width="12" height="12" rx="2" fill="${BLUE}" stroke="#ffffff" stroke-width="2.5"/>
  </g>
</svg>`;
sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, '..', 'assets', 'iconaplikasi.png'))
  .then((info) => console.log('iconaplikasi.png', info.width + 'x' + info.height))
  .catch((e) => { console.error(e); process.exit(1); });
