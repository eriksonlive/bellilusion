import { useTheme, type Theme } from "@/hooks/useTheme";

const themes: { value: Theme; label: string }[] = [
    { value: "green", label: "Verde" },
    { value: "blue", label: "Azul" },
    { value: "purple", label: "Morado" },
    { value: "dark", label: "Oscuro" },
];

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <select
            aria-label="Padre"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none transition focus:ring-2 focus:ring-ring"
        >
            {themes.map((item) => (
                <option key={item.value} value={item.value}>
                    {item.label}
                </option>
            ))}
        </select>
    );
}
