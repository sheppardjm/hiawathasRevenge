import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Space Mono',
      cssVariable: '--font-space-mono',
      weights: [400, 700],
      styles: ['normal', 'italic'],
    },
    {
      provider: fontProviders.google(),
      name: 'Special Elite',
      cssVariable: '--font-special-elite',
      weights: [400],
      styles: ['normal'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
