import { useEffect, useState } from 'react';

export type ThemeColor = 'default' | 'blue' | 'teal' | 'orange' | 'dark';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type FontFamily = 'inter' | 'poppins' | 'roboto' | 'nunito';

/** @deprecated Use ThemeColor */
export type Theme = ThemeColor;

interface ThemeSettings {
    color: ThemeColor;
    radius: BorderRadius;
    font: FontFamily;
}

const STORAGE_KEY = 'berry-theme-settings';

const defaults: ThemeSettings = {
    color: 'default',
    radius: 'lg',
    font: 'inter',
};

function applySettings(settings: ThemeSettings) {
    const root = document.documentElement;
    // color
    if (settings.color === 'default') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', settings.color);
    }
    // radius
    root.setAttribute('data-radius', settings.radius);
    // font
    root.setAttribute('data-font', settings.font);
}

export function useTheme() {
    const [settings, setSettings] = useState<ThemeSettings>(defaults);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed: ThemeSettings = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
            setSettings(parsed);
            applySettings(parsed);
        } catch {
            applySettings(defaults);
        }
    }, []);

    function updateSettings(partial: Partial<ThemeSettings>) {
        const next = { ...settings, ...partial };
        setSettings(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        applySettings(next);
    }

    function resetSettings() {
        setSettings(defaults);
        localStorage.removeItem(STORAGE_KEY);
        applySettings(defaults);
    }

    /** @deprecated - kept for backwards compat */
    const setTheme = (value: string) => updateSettings({ color: value as ThemeColor });
    /** @deprecated */
    const theme = settings.color;

    return {
        settings,
        updateSettings,
        resetSettings,
        // backwards compat
        theme,
        setTheme,
    };
}
