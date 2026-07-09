import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      '.vercel/**',
      'out/**',
      'node_modules/**',
      'convex/_generated/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;
