/**
 * FlashToast — notificaciones globales que se muestran en la esquina inferior derecha.
 * - Flash del servidor (success / error / warning / info)
 * - Errores de validación de formularios (agrupados en un solo toast)
 * Escucha el evento de navegación de Inertia para dispararse en cada respuesta del servidor.
 */
import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Toast {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    detail?: string;
}

let nextId = 1;

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const COLORS = {
    success: {
        bg: 'bg-green-50 border-green-200',
        icon: 'text-green-500',
        title: 'text-green-800',
        detail: 'text-green-600',
    },
    error: {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-500',
        title: 'text-red-800',
        detail: 'text-red-600',
    },
    warning: {
        bg: 'bg-amber-50 border-amber-200',
        icon: 'text-amber-500',
        title: 'text-amber-800',
        detail: 'text-amber-600',
    },
    info: {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-500',
        title: 'text-blue-800',
        detail: 'text-blue-600',
    },
};

const DURATION: Record<Toast['type'], number> = {
    success: 4000,
    info: 4000,
    warning: 6000,
    error: 7000,
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const Icon = ICONS[toast.type];
    const colors = COLORS[toast.type];

    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        timerRef.current = setTimeout(() => dismiss(), DURATION[toast.type]);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timerRef.current);
        };
    }, []);

    function dismiss() {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 350);
    }

    return (
        <div
            role="alert"
            className={`flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300
                ${colors.bg}
                ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${colors.icon}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${colors.title}`}>{toast.message}</p>
                {toast.detail && (
                    <p className={`mt-1 text-xs leading-relaxed ${colors.detail}`}>{toast.detail}</p>
                )}
            </div>
            <button
                onClick={dismiss}
                className={`ml-1 shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100 ${colors.icon}`}
                aria-label="Cerrar notificación"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export default function FlashToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const add = useCallback((type: Toast['type'], message: string, detail?: string) => {
        setToasts((prev) => [...prev, { id: nextId++, type, message, detail }]);
    }, []);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        // Fires after every Inertia navigation (form success redirects, page visits, etc.)
        const unsubNavigate = router.on('navigate', (event) => {
            const props = (event.detail.page.props ?? {}) as Record<string, unknown>;
            const flash = props.flash as Record<string, string> | undefined;
            const errors = props.errors as Record<string, string> | undefined;

            if (flash?.success) { add('success', flash.success); }
            if (flash?.error) { add('error', flash.error); }
            if (flash?.warning) { add('warning', flash.warning); }
            if (flash?.info) { add('info', flash.info); }

            if (errors && Object.keys(errors).length > 0) {
                const firstErrors = Object.values(errors).slice(0, 4);
                const detail = firstErrors.join(' · ');
                add('error', 'Corrige los errores del formulario', detail);
            }
        });

        // Fires on network errors
        const unsubError = router.on('error', () => {
            add('error', 'Error de conexión', 'No se pudo comunicar con el servidor. Intenta nuevamente.');
        });

        return () => {
            unsubNavigate();
            unsubError();
        };
    }, [add]);

    if (toasts.length === 0) { return null; }

    return (
        <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse items-end gap-3 sm:bottom-6 sm:right-6"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={remove} />
            ))}
        </div>
    );
}
