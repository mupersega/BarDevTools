import { defineConfig } from 'vite';

export default defineConfig({
  base: '/your-repo-name/', // Change this to your GitHub repository name
  build: {
    outDir: 'docs', // Ensure the output folder matches your GitHub Pages settings
  },
});
