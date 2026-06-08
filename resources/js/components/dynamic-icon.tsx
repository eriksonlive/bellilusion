/**
 * Componente unificado para renderizar íconos.
 * Soporta:
 *   - react-icons: "fa:FaHome", "md:MdDashboard", "bi:BiUser"...
 *   - Lucide (legacy): "LayoutGrid", "AlarmClock"...
 */
import { DynamicIcon as LucideDynamicIcon } from '@/lib/icon-registry';
import { ICON_SETS_MAP, parseIconValue } from '@/lib/react-icon-sets';
import { ComponentType, useEffect, useState } from 'react';

interface Props {
    value: string | null | undefined;
    className?: string;
    size?: number;
}

export function DynamicIcon({ value, className = 'h-4 w-4', size }: Props) {
    const [IconComponent, setIconComponent] = useState<ComponentType<{ className?: string; size?: number }> | null>(null);

    useEffect(() => {
        if (!value) { setIconComponent(null); return; }

        const parsed = parseIconValue(value);
        if (!parsed) { setIconComponent(null); return; }

        // Lucide legacy (sin set prefix)
        if (!parsed.set) {
            setIconComponent(null); // se maneja inline abajo
            return;
        }

        const setDef = ICON_SETS_MAP[parsed.set];
        if (!setDef) { setIconComponent(null); return; }

        setDef.load().then((mod) => {
            const Icon = mod[parsed.name] as ComponentType<any> | undefined;
            setIconComponent(Icon ? () => Icon : null);
        });
    }, [value]);

    if (!value) return null;

    const parsed = parseIconValue(value);
    if (!parsed) return null;

    // Lucide legacy
    if (!parsed.set) {
        return <LucideDynamicIcon name={parsed.name} className={className} size={size} />;
    }

    if (!IconComponent) return <span className={`inline-block bg-muted rounded ${className}`} style={{ width: size, height: size }} />;

    return <IconComponent className={className} size={size} />;
}
