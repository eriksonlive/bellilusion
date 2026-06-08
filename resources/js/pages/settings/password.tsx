import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, KeyRound, Lock, Save, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Contraseña', href: '/settings/password' },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contraseña" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Section header */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">Actualizar contraseña</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Usa una contraseña larga y aleatoria para mantener tu cuenta segura.
                        </p>
                    </div>

                    {/* Tips banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <p className="text-sm text-blue-700">
                            Mínimo 8 caracteres. Combina letras, números y símbolos para mayor seguridad.
                        </p>
                    </div>

                    <form onSubmit={updatePassword} className="space-y-5">
                        {/* Current password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="current_password" className="text-sm font-medium text-gray-700">
                                Contraseña actual
                            </Label>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    type="password"
                                    className="pl-9"
                                    autoComplete="current-password"
                                    placeholder="Tu contraseña actual"
                                />
                            </div>
                            <InputError message={errors.current_password} />
                        </div>

                        {/* New password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Nueva contraseña
                            </Label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    type="password"
                                    className="pl-9"
                                    autoComplete="new-password"
                                    placeholder="Nueva contraseña"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                Confirmar contraseña
                            </Label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    type="password"
                                    className="pl-9"
                                    autoComplete="new-password"
                                    placeholder="Repite la nueva contraseña"
                                />
                            </div>
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button disabled={processing} className="gap-2">
                                <Save className="h-4 w-4" />
                                Guardar contraseña
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out duration-200"
                                enterFrom="opacity-0 translate-y-1"
                                enterTo="opacity-100 translate-y-0"
                                leave="transition ease-in-out duration-150"
                                leaveTo="opacity-0"
                            >
                                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Guardado
                                </span>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
