/**
 * Definición de todos los sets de react-icons disponibles.
 * Cada set se carga de forma lazy (solo cuando el usuario lo selecciona).
 */

export interface IconSet {
    key: string;
    label: string;
    prefix: string; // prefijo de los nombres de componentes, ej. "Fa", "Md"
    load: () => Promise<Record<string, unknown>>;
}

export const ICON_SETS: IconSet[] = [
    { key: 'fa',  label: 'Font Awesome 5',      prefix: 'Fa',  load: () => import('react-icons/fa')  },
    { key: 'fa6', label: 'Font Awesome 6',       prefix: 'Fa',  load: () => import('react-icons/fa6') },
    { key: 'md',  label: 'Material Design',      prefix: 'Md',  load: () => import('react-icons/md')  },
    { key: 'bi',  label: 'Bootstrap Icons',      prefix: 'Bi',  load: () => import('react-icons/bi')  },
    { key: 'hi',  label: 'Heroicons 1',          prefix: 'Hi',  load: () => import('react-icons/hi')  },
    { key: 'hi2', label: 'Heroicons 2',          prefix: 'Hi',  load: () => import('react-icons/hi2') },
    { key: 'fi',  label: 'Feather',              prefix: 'Fi',  load: () => import('react-icons/fi')  },
    { key: 'ri',  label: 'Remix Icons',          prefix: 'Ri',  load: () => import('react-icons/ri')  },
    { key: 'tb',  label: 'Tabler Icons',         prefix: 'Tb',  load: () => import('react-icons/tb')  },
    { key: 'pi',  label: 'Phosphor Icons',       prefix: 'Pi',  load: () => import('react-icons/pi')  },
    { key: 'bs',  label: 'Bootstrap 5',          prefix: 'Bs',  load: () => import('react-icons/bs')  },
    { key: 'io',  label: 'Ionicons 4',           prefix: 'Io',  load: () => import('react-icons/io')  },
    { key: 'io5', label: 'Ionicons 5',           prefix: 'Io',  load: () => import('react-icons/io5') },
    { key: 'ai',  label: 'Ant Design',           prefix: 'Ai',  load: () => import('react-icons/ai')  },
    { key: 'gi',  label: 'Game Icons',           prefix: 'Gi',  load: () => import('react-icons/gi')  },
    { key: 'ci',  label: 'Circum Icons',         prefix: 'Ci',  load: () => import('react-icons/ci')  },
    { key: 'cg',  label: 'css.gg',              prefix: 'Cg',  load: () => import('react-icons/cg')  },
    { key: 'si',  label: 'Simple Icons (brands)',prefix: 'Si',  load: () => import('react-icons/si')  },
    { key: 'vsc', label: 'VS Code Icons',        prefix: 'Vsc', load: () => import('react-icons/vsc') },
    { key: 'rx',  label: 'Radix UI',             prefix: 'Rx',  load: () => import('react-icons/rx')  },
    { key: 'gr',  label: 'Grommet',              prefix: 'Gr',  load: () => import('react-icons/gr')  },
    { key: 'go',  label: 'Github Octicons',      prefix: 'Go',  load: () => import('react-icons/go')  },
    { key: 'ti',  label: 'Typicons',             prefix: 'Ti',  load: () => import('react-icons/ti')  },
    { key: 'di',  label: 'Devicons',             prefix: 'Di',  load: () => import('react-icons/di')  },
    { key: 'wi',  label: 'Weather Icons',        prefix: 'Wi',  load: () => import('react-icons/wi')  },
    { key: 'im',  label: 'IcoMoon',              prefix: 'Im',  load: () => import('react-icons/im')  },
    { key: 'lu',  label: 'Lucide',              prefix: 'Lu',  load: () => import('react-icons/lu')  },
    { key: 'tfi', label: 'Themify',              prefix: 'Tfi', load: () => import('react-icons/tfi') },
    { key: 'sl',  label: 'Simple Line',          prefix: 'Sl',  load: () => import('react-icons/sl')  },
    { key: 'fc',  label: 'Flat Color Icons',     prefix: 'Fc',  load: () => import('react-icons/fc')  },
    { key: 'lia', label: 'Line Awesome',         prefix: 'Lia', load: () => import('react-icons/lia') },
];

export const ICON_SETS_MAP: Record<string, IconSet> = Object.fromEntries(
    ICON_SETS.map((s) => [s.key, s]),
);

/**
 * Parsea un valor almacenado en BD.
 * Formato: "fa:FaHome"  →  { set: "fa", name: "FaHome" }
 * Formato legacy Lucide: "LayoutGrid" → { set: null, name: "LayoutGrid" }
 */
export function parseIconValue(value: string | null | undefined): { set: string | null; name: string } | null {
    if (!value) return null;
    if (value.includes(':')) {
        const [set, name] = value.split(':');
        return { set, name };
    }
    // Legado: Lucide sin prefijo
    return { set: null, name: value };
}

/** Crea el valor para guardar en BD */
export function buildIconValue(set: string, name: string) {
    return `${set}:${name}`;
}
