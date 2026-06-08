import { useEffect, useState } from "react";

export type Theme = "green" | "blue" | "purple" | "dark";

const THEME_KEY = "app-theme";

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>("green");

    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;

        if (savedTheme) {
            setThemeState(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else {
            document.documentElement.setAttribute("data-theme", "green");
        }
    }, []);

    const setTheme = (value: Theme) => {
        setThemeState(value);
        localStorage.setItem(THEME_KEY, value);
        document.documentElement.setAttribute("data-theme", value);
    };

    return {
        theme,
        setTheme,
    };
}
