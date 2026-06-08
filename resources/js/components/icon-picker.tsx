import { DynamicIcon, ICON_LIST, ICON_REGISTRY } from '@/lib/icon-registry';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface IconPickerProps {
    value: string;
    onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const filtered = query
        ? ICON_LIST.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
        : ICON_LIST;

    // Cierra al hacer clic fuera
    useEffect(() => {
        function onOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onOutside);
        return () => document.removeEventListener('mousedown', onOutside);
    }, []);

    // Enfoca el buscador al abrir
    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
    }, [open]);

    function select(name: string) {
        onChange(name);
        setOpen(false);
        setQuery('');
    }

    function clear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange('');
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'flex h-9 w-full items-center gap-2 rounded-[var(--radius)] border border-input bg-background px-3 text-sm transition',
                    'hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring',
                    open && 'ring-2 ring-ring',
                )}
            >
                {value ? (
                    <>
                        <DynamicIcon name={value} className="h-4 w-4 shrink-0 text-primary" />
                        <span className="flex-1 text-left font-medium">{value}</span>
                        <span
                            role="button"
                            onClick={clear}
                            className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    </>
                ) : (
                    <span className="flex-1 text-left text-muted-foreground">Seleccionar ícono…</span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-[200] mt-1.5 w-72 rounded-[var(--radius-lg)] border border-border bg-popover shadow-lg">
                    {/* Search */}
                    <div className="border-b p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={searchRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar ícono…"
                                className="h-8 w-full rounded-[var(--radius)] border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {filtered.length} ícono{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Grid */}
                    <div className="grid max-h-60 grid-cols-6 gap-0.5 overflow-y-auto p-2">
                        {filtered.length === 0 ? (
                            <p className="col-span-6 py-6 text-center text-sm text-muted-foreground">
                                Sin resultados
                            </p>
                        ) : (
                            filtered.map((name) => {
                                const Icon = ICON_REGISTRY[name];
                                const isSelected = value === name;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        title={name}
                                        onClick={() => select(name)}
                                        className={cn(
                                            'flex flex-col items-center justify-center rounded-[var(--radius)] p-2 transition hover:bg-muted',
                                            isSelected && 'bg-primary/10 text-primary ring-1 ring-primary/30',
                                        )}
                                    >
                                        <Icon className="h-4.5 w-4.5" size={18} />
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Selected name */}
                    {value && (
                        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                            Seleccionado:{' '}
                            <span className="font-semibold text-foreground">{value}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
