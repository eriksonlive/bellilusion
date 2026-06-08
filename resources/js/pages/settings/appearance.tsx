import { Head } from '@inertiajs/react';
import { Monitor, Moon, Palette, Sun, Type } from 'lucide-react';

import { type BreadcrumbItem } from '@/types';
import { useAppearance } from '@/hooks/use-appearance';
import { useTheme, type BorderRadius, type FontFamily, type ThemeColor } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Apariencia', href: '/settings/appearance' },
];

const COLOR_OPTIONS: { value: ThemeColor; label: string; swatch: string }[] = [
    { value: 'default', label: 'Morado', swatch: '#7c3aed' },
    { value: 'blue', label: 'Azul', swatch: '#2563eb' },
    { value: 'teal', label: 'Verde azul', swatch: '#0d9488' },
    { value: 'orange', label: 'Naranja', swatch: '#ea580c' },
    { value: 'dark', label: 'Oscuro', swatch: '#1e2535' },
];

const RADIUS_OPTIONS: { value: BorderRadius; label: string; preview: string }[] = [
    { value: 'none', label: 'Sin borde', preview: 'rounded-none' },
    { value: 'sm', label: 'Pequeño', preview: 'rounded-sm' },
    { value: 'md', label: 'Mediano', preview: 'rounded-md' },
    { value: 'lg', label: 'Grande', preview: 'rounded-lg' },
    { value: 'xl', label: 'Extra grande', preview: 'rounded-xl' },
];

const FONT_OPTIONS: { value: FontFamily; label: string; className: string }[] = [
    { value: 'inter', label: 'Inter', className: 'font-sans' },
    { value: 'poppins', label: 'Poppins', className: '' },
    { value: 'roboto', label: 'Roboto', className: '' },
    { value: 'nunito', label: 'Nunito', className: '' },
];

export default function Appearance() {
    const { appearance, updateAppearance } = useAppearance();
    const { settings, updateSettings } = useTheme();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apariencia" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Section header */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">Apariencia</h3>
                        <p className="mt-1 text-sm text-gray-500">Personaliza los colores, fuentes y estilo visual de la aplicación.</p>
                    </div>

                    {/* Mode: light / dark / system */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Sun className="h-4 w-4 text-gray-400" />
                            Modo de pantalla
                        </p>
                        <div className="flex gap-3">
                            {([
                                { value: 'light', icon: Sun, label: 'Claro' },
                                { value: 'dark', icon: Moon, label: 'Oscuro' },
                                { value: 'system', icon: Monitor, label: 'Sistema' },
                            ] as const).map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => updateAppearance(value)}
                                    className={cn(
                                        'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all',
                                        appearance === value
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50',
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color theme */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Palette className="h-4 w-4 text-gray-400" />
                            Color principal
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {COLOR_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateSettings({ color: opt.value })}
                                    title={opt.label}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all',
                                        settings.color === opt.value
                                            ? 'border-primary shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300',
                                    )}
                                >
                                    <span
                                        className="h-4 w-4 rounded-full"
                                        style={{ backgroundColor: opt.swatch }}
                                    />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Border radius */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Radio de bordes</p>
                        <div className="flex flex-wrap gap-2">
                            {RADIUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateSettings({ radius: opt.value })}
                                    className={cn(
                                        'flex items-center gap-2 border-2 px-3 py-2 text-sm font-medium transition-all',
                                        opt.preview,
                                        settings.radius === opt.value
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300',
                                    )}
                                >
                                    <span
                                        className={cn('h-5 w-5 border-2 border-current', opt.preview)}
                                    />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Type className="h-4 w-4 text-gray-400" />
                            Tipografía
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {FONT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateSettings({ font: opt.value })}
                                    className={cn(
                                        'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                                        opt.className,
                                        settings.font === opt.value
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300',
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
