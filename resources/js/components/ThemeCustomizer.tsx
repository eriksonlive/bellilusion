import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { type BorderRadius, type FontFamily, type ThemeColor, useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Moon, RotateCcw, Settings2, Sun, X } from 'lucide-react';
import { useState } from 'react';

/* ── Color presets ─────────────────────────────────────────── */
const COLOR_PRESETS: { value: ThemeColor; label: string; from: string; to: string }[] = [
    { value: 'default', label: 'Morado',  from: '#5e35b1', to: '#7e57c2' },
    { value: 'blue',    label: 'Azul',    from: '#1565c0', to: '#42a5f5' },
    { value: 'teal',    label: 'Teal',    from: '#00695c', to: '#26a69a' },
    { value: 'orange',  label: 'Naranja', from: '#e65100', to: '#ff7043' },
    { value: 'dark',    label: 'Oscuro',  from: '#1a223f', to: '#29314f' },
];

/* ── Radius options ────────────────────────────────────────── */
const RADIUS_OPTIONS: { value: BorderRadius; label: string; preview: string }[] = [
    { value: 'none', label: 'Cuadrado',   preview: 'rounded-none' },
    { value: 'sm',   label: 'Pequeño',    preview: 'rounded-sm' },
    { value: 'md',   label: 'Medio',      preview: 'rounded-md' },
    { value: 'lg',   label: 'Grande',     preview: 'rounded-xl' },
    { value: 'xl',   label: 'Extra',      preview: 'rounded-3xl' },
];

/* ── Font options ──────────────────────────────────────────── */
const FONT_OPTIONS: { value: FontFamily; label: string; sample: string }[] = [
    { value: 'inter',   label: 'Inter',   sample: 'Aa' },
    { value: 'poppins', label: 'Poppins', sample: 'Aa' },
    { value: 'roboto',  label: 'Roboto',  sample: 'Aa' },
    { value: 'nunito',  label: 'Nunito',  sample: 'Aa' },
];

export function ThemeCustomizer() {
    const [open, setOpen] = useState(false);
    const { settings, updateSettings, resetSettings } = useTheme();

    return (
        <>
            {/* Floating trigger — Berry style */}
            <button
                onClick={() => setOpen(true)}
                className="fixed right-0 top-1/2 z-50 -translate-y-1/2 rounded-l-xl bg-primary px-2 py-3 text-primary-foreground shadow-lg transition-transform hover:-translate-x-0.5 hover:-translate-y-1/2"
                aria-label="Personalizar tema"
            >
                <Settings2 className="h-5 w-5" />
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-80 overflow-y-auto [scrollbar-gutter:stable] p-0">
                    {/* Header */}
                    <SheetHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
                        <SheetTitle className="text-base font-semibold">Personalizar tema</SheetTitle>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetSettings}
                                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Restablecer
                            </button>
                            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </SheetHeader>

                    <div className="flex flex-col gap-6 px-5 py-5">

                        {/* ── Theme mode ──────────────────────────── */}
                        <section>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Modo</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        const next = settings.color === 'dark' ? 'default' : settings.color;
                                        updateSettings({ color: next });
                                    }}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all',
                                        settings.color !== 'dark'
                                            ? 'border-primary bg-secondary text-primary shadow-sm'
                                            : 'hover:bg-muted',
                                    )}
                                >
                                    <Sun className="h-4 w-4" /> Claro
                                </button>
                                <button
                                    onClick={() => updateSettings({ color: 'dark' })}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all',
                                        settings.color === 'dark'
                                            ? 'border-primary bg-secondary text-primary shadow-sm'
                                            : 'hover:bg-muted',
                                    )}
                                >
                                    <Moon className="h-4 w-4" /> Oscuro
                                </button>
                            </div>
                        </section>

                        {/* ── Color presets ───────────────────────── */}
                        <section>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Color del tema</p>
                            <div className="flex flex-wrap gap-3">
                                {COLOR_PRESETS.filter((p) => p.value !== 'dark').map((preset) => (
                                    <button
                                        key={preset.value}
                                        title={preset.label}
                                        onClick={() => updateSettings({ color: preset.value })}
                                        className={cn(
                                            'relative h-10 w-10 rounded-full transition-transform hover:scale-110',
                                            settings.color === preset.value && 'ring-2 ring-offset-2 ring-offset-card',
                                        )}
                                        style={{
                                            background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                                            ringColor: preset.from,
                                        }}
                                    >
                                        {settings.color === preset.value && (
                                            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Border radius ───────────────────────── */}
                        <section>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Redondeo</p>
                            <div className="grid grid-cols-5 gap-1.5">
                                {RADIUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateSettings({ radius: opt.value })}
                                        className={cn(
                                            'flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:bg-muted',
                                            settings.radius === opt.value && 'border-primary bg-secondary',
                                        )}
                                    >
                                        <div
                                            className={cn('h-7 w-7 border-2 border-current bg-transparent', opt.preview)}
                                            style={{ color: settings.radius === opt.value ? 'var(--primary)' : 'var(--border)' }}
                                        />
                                        <span className={cn('text-[9px] font-medium', settings.radius === opt.value ? 'text-primary' : 'text-muted-foreground')}>
                                            {opt.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Font family ─────────────────────────── */}
                        <section>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipografía</p>
                            <div className="grid grid-cols-2 gap-2">
                                {FONT_OPTIONS.map((font) => (
                                    <button
                                        key={font.value}
                                        onClick={() => updateSettings({ font: font.value })}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all hover:bg-muted',
                                            settings.font === font.value && 'border-primary bg-secondary text-primary shadow-sm',
                                        )}
                                    >
                                        <span
                                            className="text-xl font-bold leading-none"
                                            style={{ fontFamily: `'${font.label}', sans-serif` }}
                                        >
                                            {font.sample}
                                        </span>
                                        <span className="font-medium">{font.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
