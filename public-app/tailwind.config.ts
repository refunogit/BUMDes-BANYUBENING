import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hijauPedesaan: '#3B7A57',
        hijauPedesaanTua: '#2D5A40',
        hijauPedesaanMuda: '#4F7942',
        airBeningGunung: '#EBF4F6',
        airBeningGunungMuda: '#F0F8FF',
        biruMudaLangit: '#7091E6',
        biruMudaLangitMuda: '#86B6F6',
        kuningBungaMatahari: '#FFD23F',
        merahJambu: '#E25858',
        ivory: '#FFFDD0',
        cream: '#FAF8F5',
        stone: '#4A4A4A',
        sage: '#87A96B',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
};

export default config;
