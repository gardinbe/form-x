import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
      tsconfigPath: 'tsconfig.browser.json'
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'form-x',
      fileName: (format) => `form-x.${format}.js`,
      formats: [
        'es',
        'cjs',
        'umd'
      ]
    }
  }
});
