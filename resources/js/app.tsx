import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const pages = import.meta.glob([
    './pages/**/*.tsx',
    './layouts/**/*.tsx',
]);

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,

    resolve: (name) => {
        if (name.startsWith('layouts/')) {
            return resolvePageComponent(`./${name}.tsx`, pages);
        }

        return resolvePageComponent(`./pages/${name}.tsx`, pages);
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },

    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
