import { DynamicIcon } from '@/components/dynamic-icon';
import { cn } from '@/lib/utils';
import { buildIconValue, ICON_SETS, parseIconValue } from '@/lib/react-icon-sets';
import { ChevronDown, Search, X } from 'lucide-react';
import { ComponentType, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 120;

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
}

interface LoadedSet {
    names: string[];
    components: Record<string, ComponentType<any>>;
}

const setCache: Record<string, LoadedSet> = {};

export function ReactIconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [activeSet, setActiveSet] = useState(ICON_SETS[0].key);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [loadedSet, setLoadedSet] = useState<LoadedSet | null>(null);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const parsed = parseIconValue(value);

    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        loadSet(activeSet);
    }, [activeSet, open]);

    useEffect(() => { setPage(1); }, [query, activeSet]);

    async function loadSet(key: string) {
        if (setCache[key]) { setLoadedSet(setCache[key]); return; }
        setLoading(true);
        setLoadedSet(null);
        try {
            const setDef = ICON_SETS.find((s) => s.key === key)!;
            const mod = await setDef.load();
            const components: Record<string, ComponentType<any>> = {};
            const names: string[] = [];
            for (const [name, comp] of Object.entries(mod)) {
                if (typeof comp === 'function' && /^[A-Z]/.test(name)) {
                    components[name] = comp as ComponentType<any>;
                    names.push(name);
                }
            }
            names.sort();
            const loaded: LoadedSet = { names, components };
            setCache[key] = loaded;
            setLoadedSet(loaded);
        } finally {
            setLoading(false);
        }
    }

    const filteredNames = loadedSet
        ? (query ? loadedSet.names.filter((n) => n.toLowerCase().includes(query.toLowerCase())) : loadedSet.names)
        : [];

    const totalPages = Math.ceil(filteredNames.length / PAGE_SIZE);
    const pageNames = filteredNames.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function select(setKey: string, name: string) {
        onChange(buildIconValue(setKey, name));
        setOpen(false);
        setQuery('');
    }

    function clear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange('');
    }

    return (
        <div className="flex flex-col gap-1.5">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'flex h-9 w-full items-center gap-2 rounded-[var(--radius)] border border-input bg-background px-3 text-sm transition',
                    'hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring',
                    open && 'border-ring ring-2 ring-ring',
                )}
            >
                {value ? (
                    <>
                        <DynamicIcon value={value} className="h-4 w-4 shrink-0 text-primary" />
                        <span className="flex-1 text-left font-mono text-xs">{value}</span>
                        <span role="button" onClick={clear} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex-1 text-left text-muted-foreground">Seleccionar ícono…</span>
                        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
                    </>
                )}
            </button>

            {/* Panel inline — se expande dentro del formulario, sin portal */}
            {open && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-background shadow-sm">

                    {/* Search */}
                    <div className="border-b p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={searchRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar ícono por nombre…"
                                className="h-8 w-full rounded-[var(--radius)] border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Set tabs — scrollable horizontal */}
                    <div className="flex gap-0.5 overflow-x-auto border-b bg-muted/30 px-2 py-1.5">
                        {ICON_SETS.map((set) => (
                            <button
                                key={set.key}
                                type="button"
                                onClick={() => { setActiveSet(set.key); setQuery(''); }}
                                className={cn(
                                    'shrink-0 rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium whitespace-nowrap transition',
                                    activeSet === set.key
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                {set.label}
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="flex items-center justify-between border-b px-3 py-1 text-xs text-muted-foreground">
                        <span>{loading ? 'Cargando…' : `${filteredNames.length} íconos`}{query && !loading && ` · "${query}"`}</span>
                        {totalPages > 1 && <span>Página {page} / {totalPages}</span>}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-10 gap-0.5 overflow-y-auto p-2" style={{ maxHeight: 240 }}>
                        {loading ? (
                            Array.from({ length: 60 }).map((_, i) => (
                                <div key={i} className="h-9 w-full animate-pulse rounded-[var(--radius)] bg-muted" />
                            ))
                        ) : pageNames.length === 0 ? (
                            <p className="col-span-10 py-6 text-center text-sm text-muted-foreground">Sin resultados para "{query}"</p>
                        ) : (
                            pageNames.map((name) => {
                                const Icon = loadedSet!.components[name];
                                const isSelected = parsed?.set === activeSet && parsed?.name === name;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        title={name}
                                        onClick={() => select(activeSet, name)}
                                        className={cn(
                                            'flex h-9 w-full items-center justify-center rounded-[var(--radius)] transition hover:bg-muted',
                                            isSelected && 'bg-primary/10 ring-1 ring-primary/40 text-primary',
                                        )}
                                    >
                                        <Icon size={16} />
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 border-t px-3 py-2">
                            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                                className="rounded-[var(--radius)] border px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-muted">
                                ← Ant.
                            </button>
                            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} type="button" onClick={() => setPage(p)}
                                        className={cn('h-7 w-7 rounded-[var(--radius)] text-xs transition', page === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                                        {p}
                                    </button>
                                );
                            })}
                            {totalPages > 7 && <span className="text-xs text-muted-foreground">…</span>}
                            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                                className="rounded-[var(--radius)] border px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-muted">
                                Sig. →
                            </button>
                        </div>
                    )}

                    {/* Footer selected */}
                    {value && (
                        <div className="flex items-center gap-2 border-t bg-muted/30 px-3 py-1.5 text-xs">
                            <DynamicIcon value={value} className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Seleccionado:</span>
                            <span className="font-mono font-semibold">{value}</span>
                            <button type="button" onClick={clear} className="ml-auto text-muted-foreground hover:text-red-500">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
