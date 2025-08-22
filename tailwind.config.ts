import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Use Nillion CSS variables
        'nillion-primary': 'var(--nillion-primary)',
        'nillion-primary-hover': 'var(--nillion-primary-hover)',
        'nillion-bg': 'var(--nillion-bg)',
        'nillion-bg-secondary': 'var(--nillion-bg-secondary)',
        'nillion-text': 'var(--nillion-text)',
        'nillion-text-secondary': 'var(--nillion-text-secondary)',
        'nillion-border': 'var(--nillion-border)',
      },
      fontFamily: {
        'heading': 'var(--nillion-font-heading)',
        'body': 'var(--nillion-font-body)',
      },
    },
  },
  plugins: [],
} satisfies Config;