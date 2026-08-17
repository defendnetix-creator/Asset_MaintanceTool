# ADR 0003: Free Frontend Stack

**Status:** Accepted  
**Date:** 2024-08-17  
**Author:** Founding Product Architect  
**Decision:** React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + Zustand + Radix UI

---

## Context

The frontend must be a modern, responsive, accessible PWA that works offline for audit scanning. All tools must be free (MIT/Apache licensed) with no paid licenses.

## Decision

We adopt a **modern, type-safe, component-driven frontend stack**:

| Layer | Technology | Version | License | Purpose |
|-------|------------|---------|---------|---------|
| Framework | React | 18.2+ | MIT | Component library |
| Language | TypeScript | 5.3+ | Apache-2.0 | Type safety |
| Build Tool | Vite | 5.0+ | MIT | Fast HMR, optimized builds |
| Styling | Tailwind CSS | 3.4+ | MIT | Design system, responsive |
| State (Server) | TanStack Query | 5.17+ | MIT | Caching, deduping, mutations |
| State (Client) | Zustand | 4.5+ | MIT | Lightweight global state |
| Forms | React Hook Form + Zod | 7.49+ / 3.22+ | MIT | Validation, type inference |
| UI Primitives | Radix UI | 1.0+ | MIT | Accessible, unstyled components |
| Icons | Lucide React | 0.344+ | ISC | Consistent icon system |
| Charts | Recharts | 2.12+ | MIT | Composable visualizations |
| PWA | Vite PWA Plugin (Workbox) | 0.19+ | MIT | Offline-first, installable |
| Storybook | Storybook | 8.0+ | MIT | Component documentation |
| Testing | Vitest + Playwright | 1.3+ / 1.42+ | MIT | Unit, integration, E2E |

---

## Package.json

```json
{
  "name": "asset-mt-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-commands --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tooltip": "^1.0.7",
    "lucide-react": "^0.344.0",
    "recharts": "^2.12.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "date-fns": "^3.3.0",
    "@tanstack/react-table": "^8.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-storybook": "^0.8.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.19.0",
    "vitest": "^1.3.0",
    "@vitest/coverage-v8": "^1.3.0",
    "@playwright/test": "^1.42.0",
    "@storybook/react": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@storybook/addon-links": "^8.0.0",
    "@storybook/blocks": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "storybook": "^8.0.0",
    "storybook-addon-paddings": "^5.0.0",
    "storybook-addon-viewport": "^8.0.0"
  }
}
```

---

## Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Asset Maintenance Tool',
        short_name: 'AssetMT',
        description: 'Multi-tenant asset management with offline audits',
        theme_color: '#2563EB',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        categories: ['business', 'productivity'],
        screenshots: [],
        shortcuts: [
          { name: 'Scan Barcode', url: '/scan', icons: [{ src: 'scan-icon.png', sizes: '192x192' }] },
          { name: 'My Assets', url: '/assets/mine', icons: [{ src: 'assets-icon.png', sizes: '192x192' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|webp)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/ws': { target: 'ws://localhost:3001', ws: true }
    }
  }
});
```

---

## Tailwind Config (Design Tokens)

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '.storybook/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#DBEAFE',
          100: '#BFDBFE',
          200: '#93C5FD',
          300: '#60A5FA',
          400: '#3B82F6',
          500: '#2563EB',  // Primary
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
        },
        secondary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        success: {
          500: '#059669',
          600: '#047857',
        },
        warning: {
          500: '#D97706',
          600: '#B45309',
        },
        error: {
          500: '#DC2626',
          600: '#B91C1C',
        },
        info: {
          500: '#0891B2',
          600: '#0E7490',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '56px', fontWeight: '700' }],
        'h1': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'h2': ['30px', { lineHeight: '38px', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'code': ['13px', { lineHeight: '20px', fontWeight: '400' }],
      },
      spacing: {
        '0': '0',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'full': '9999px',
      },
      boxShadow: {
        'level-1': '0 1px 2px rgba(15,23,42,0.05)',
        'level-2': '0 4px 6px -1px rgba(15,23,42,0.1), 0 2px 4px -2px rgba(15,23,42,0.1)',
        'level-3': '0 20px 25px -5px rgba(15,23,42,0.1), 0 8px 10px -6px rgba(15,23,42,0.1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      screens: {
        'mobile': '640px',
        'tablet': '1024px',
        'desktop': '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## PWA Service Worker Strategy

```typescript
// src/registerSW.ts
import { registerSW } from 'virtual:pwa-register';

export function registerSW() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('New version available. Update?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready for offline use');
        // Show subtle toast
      },
      onRegistered(registration) {
        console.log('SW registered:', registration.scope);
      },
      onRegisterError(error) {
        console.error('SW registration failed:', error);
      }
    });
  }
}

// Offline detection hook
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```

---

## Storybook Config

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-addon-paddings',
    'storybook-addon-viewport',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    return config;
  },
};

export default config;
```

---

## Testing Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.stories.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Design Token Export (for Stitch handoff)

```typescript
// src/lib/design-tokens.ts
export const designTokens = {
  colors: {
    primary: { 500: '#2563EB', 600: '#1D4ED8', 700: '#1E40AF' },
    secondary: { 500: '#64748B', 600: '#475569' },
    success: { 500: '#059669', 600: '#047857' },
    warning: { 500: '#D97706', 600: '#B45309' },
    error: { 500: '#DC2626', 600: '#B91C1C' },
    info: { 500: '#0891B2', 600: '#0E7490' },
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  },
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  borderRadius: { sm: 4, md: 8, lg: 12, full: 9999 },
  shadows: {
    level1: '0 1px 2px rgba(15,23,42,0.05)',
    level2: '0 4px 6px -1px rgba(15,23,42,0.1), 0 2px 4px -2px rgba(15,23,42,0.1)',
    level3: '0 20px 25px -5px rgba(15,23,42,0.1), 0 8px 10px -6px rgba(15,23,42,0.1)',
  },
  typography: {
    fontFamily: { sans: 'Inter', mono: 'JetBrains Mono' },
    fontSize: { display: 48, h1: 36, h2: 30, h3: 24, bodyLg: 18, body: 16, bodySm: 14, caption: 12, code: 13 },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeight: { tight: 1.1, normal: 1.5, relaxed: 1.75 },
  },
  breakpoints: { mobile: 640, tablet: 1024, desktop: 1280 },
  shadows: { level1: '0 1px 2px rgba(15,23,42,0.05)', level2: '0 4px 6px -1px rgba(15,23,42,0.1)', level3: '0 20px 25px -5px rgba(15,23,42,0.1)' },
  motion: { fast: '150ms', normal: '250ms', slow: '350ms' },
  focusRing: '#2563EB',
};

export type DesignTokens = typeof designTokens;
```

---

## Consequences

### Positive
- **Zero cost** — all MIT/Apache licensed
- **Type-safe end-to-end** — shared Zod schemas with backend
- **PWA ready** — offline-first audit scanning
- **Design system** — Tailwind tokens match Stitch output
- **Component library** — Radix UI ensures accessibility
- **Testing** — Vitest + Playwright for full coverage

### Negative
- **Bundle size** — Radix + Query + Charts adds weight (~150kb gzipped)
- **Learning curve** — TanStack Query, Zustand patterns
- **PWA complexity** — Service Worker debugging

---

## References

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Storybook](https://storybook.js.org/)

---

**Next:** ADR 0004 — Free Backend Stack