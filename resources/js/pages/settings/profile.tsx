import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, Save, User } from 'lucide-react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Perfil', href: '/settings/profile' },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Perfil" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Section header */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">Información del perfil</h3>
                        <p className="mt-1 text-sm text-gray-500">Actualiza tu nombre y dirección de correo electrónico.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Nombre completo
                            </Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="name"
                                    className="pl-9"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Tu nombre completo"
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Correo electrónico
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-9"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Verify email notice */}
                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-sm text-amber-700">
                                    Tu correo no está verificado.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="font-medium underline hover:text-amber-900"
                                    >
                                        Reenviar correo de verificación.
                                    </Link>
                                </p>
                                {status === 'verification-link-sent' && (
                                    <p className="mt-1 text-sm font-medium text-green-600">
                                        Se ha enviado un nuevo enlace a tu correo.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button disabled={processing} className="gap-2">
                                <Save className="h-4 w-4" />
                                Guardar cambios
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

                    {/* Divider */}
                    <div className="border-t border-gray-100 pt-2" />

                    <DeleteUser />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
