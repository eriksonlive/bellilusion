import { BlurModal } from '@/components/blur-modal';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Menu, Props } from '@/types/menu';
import { router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Menu',
        href: '/menu',
    },
];

const getPaginationLabel = (label: string) => {
    if (label.includes('&laquo;')) {
        return 'Página anterior';
    }

    if (label.includes('&raquo;')) {
        return 'Página siguiente';
    }

    const cleanLabel = label
        .replace(/<[^>]*>/g, '')
        .replace('&laquo;', '')
        .replace('&raquo;', '')
        .trim();

    return `Ir a la página ${cleanLabel}`;
};

export const Index = ({ menus, permissions }: Props) => {
    const [openModal, setOpenModal] = useState(false);

    const user = usePage<{ auth: { permissions: string[] } }>().props.auth;
    const { data, setData, post, errors, processing } = useForm({
        label: '',
        href: '',
        icon: '',
        parent_id: '',
        order: 0,
        permission: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('menus.store'));
        setOpenModal(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="bg-card text-card-foreground border-border relative m-5 rounded-2xl border p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        aria-label="Crear item"
                        title="Crear item"
                        className="group bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-ring focus:ring-offset-card absolute top-3 right-6 flex h-10 w-10 items-center justify-center rounded-full text-3xl leading-none font-bold shadow-lg transition hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                    >
                        <span aria-hidden="true" className="-mt-1 text-lg">
                            +
                        </span>

                        <span
                            role="tooltip"
                            className="bg-foreground text-background pointer-events-none absolute top-full right-0 mt-2 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                        >
                            Crear item
                        </span>
                    </button>

                    <BlurModal open={openModal} title="Crear menú" onClose={() => setOpenModal(false)}>
                        <form
                            onSubmit={handleSubmit}
                            className="bg-muted border-border mb-4 grid grid-cols-3 items-end gap-4 rounded-lg border p-4 shadow-sm"
                        >
                            <div className="flex w-full flex-col">
                                <label htmlFor="label" className="text-foreground mb-1 text-sm font-medium">
                                    Etiqueta
                                </label>
                                <input
                                    type="text"
                                    id="label"
                                    value={data.label || ''}
                                    onChange={(e) => setData('label', e.target.value)}
                                    placeholder="Nombre de la etiqueta"
                                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                                {errors.label && <span className="text-danger mt-1 text-xs">{errors.label}</span>}
                            </div>

                            <div className="flex w-full flex-col">
                                <label htmlFor="href" className="text-foreground mb-1 text-sm font-medium">
                                    Url
                                </label>
                                <input
                                    type="text"
                                    id="href"
                                    value={data.href || ''}
                                    onChange={(e) => setData('href', e.target.value)}
                                    placeholder="url"
                                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                                {errors.href && <span className="text-danger mt-1 text-xs">{errors.href}</span>}
                            </div>

                            <div className="flex w-full flex-col">
                                <label htmlFor="icon" className="text-foreground mb-1 text-sm font-medium">
                                    Icono
                                </label>
                                <input
                                    type="text"
                                    id="icon"
                                    value={data.icon || ''}
                                    onChange={(e) => setData('icon', e.target.value)}
                                    placeholder="Icono"
                                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                                {errors.icon && <span className="text-danger mt-1 text-xs">{errors.icon}</span>}
                            </div>

                            <div className="flex w-full flex-col">
                                <label htmlFor="parent_id" className="text-foreground mb-1 text-sm font-medium">
                                    Padre
                                </label>
                                <select
                                    name="parent_id"
                                    id="parent_id"
                                    value={data.parent_id || ''}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className="border-input bg-background text-foreground focus:ring-ring focus:border-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                >
                                    <option value="">Seleccione una opción</option>
                                    {menus?.data.map((menu: Menu) => (
                                        <option key={menu.id} value={menu.id}>
                                            {menu.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.parent_id && <span className="text-danger mt-1 text-xs">{errors.parent_id}</span>}
                            </div>

                            <div className="flex w-full flex-col">
                                <label htmlFor="order" className="text-foreground mb-1 text-sm font-medium">
                                    Orden
                                </label>
                                <input
                                    type="text"
                                    id="order"
                                    value={data.order || ''}
                                    onChange={(e) => setData('order', parseInt(e.target.value))}
                                    placeholder="Orden"
                                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                                {errors.order && <span className="text-danger mt-1 text-xs">{errors.order}</span>}
                            </div>

                            <div className="flex w-full flex-col">
                                <label htmlFor="permission" className="text-foreground mb-1 text-sm font-medium">
                                    Permiso
                                </label>
                                <select
                                    name="permission"
                                    id="permission"
                                    value={data.permission || ''}
                                    onChange={(e) => setData('permission', e.target.value)}
                                    className="border-input bg-background text-foreground focus:ring-ring focus:border-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                >
                                    <option value="">Seleccione una opción</option>
                                    {permissions?.map((per) => (
                                        <option key={per.id} value={per.name}>
                                            {per.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.permission && <span className="text-danger mt-1 text-xs">{errors.permission}</span>}
                            </div>

                            {user.permissions.includes('assign teams') && (
                                <div className="w-full sm:w-auto">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Crear
                                    </button>
                                </div>
                            )}
                        </form>
                    </BlurModal>
                </div>

                <div className="border-border bg-card mt-10 overflow-hidden rounded-xl border">
                    <table className="text-card-foreground min-w-full text-sm">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="border-border border px-4 py-2 text-left">Etiqueta</th>
                                <th className="border-border border px-4 py-2 text-left">Enlace</th>
                                <th className="border-border border px-4 py-2 text-left">Icono</th>
                                <th className="border-border border px-4 py-2 text-left">Padre</th>
                                <th className="border-border border px-4 py-2 text-left">Orden</th>
                                <th className="border-border border px-4 py-2 text-left">Permiso</th>
                                <th className="border-border border px-4 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {menus?.data.map((menu: Menu) => (
                                <tr key={menu.id} className="even:bg-muted/50 hover:bg-muted transition">
                                    <td className="border-border border px-4 py-2">{menu?.label}</td>
                                    <td className="border-border border px-4 py-2">{menu?.href}</td>
                                    <td className="border-border border px-4 py-2">{/* {menu?.icono} */}</td>
                                    <td className="border-border border px-4 py-2">{menu?.parent?.label}</td>
                                    <td className="border-border border px-4 py-2">{menu?.order}</td>
                                    <td className="border-border border px-4 py-2">{menu?.permission}</td>
                                    <td className="border-border border px-4 py-2">
                                        <button
                                            onClick={() => {
                                                if (confirm('¿Seguro que quieres eliminar este item?')) {
                                                    router.delete(route('menus.destroy', menu.id));
                                                }
                                            }}
                                            className="bg-danger text-danger-foreground hover:bg-danger-hover rounded px-3 py-1 text-sm transition"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-end gap-1 text-sm">
                    {menus?.links.map((link, index) => {
                        const label = getPaginationLabel(link.label);

                        return (
                            <button
                                key={index}
                                type="button"
                                aria-label={label}
                                title={label}
                                aria-current={link.active ? 'page' : undefined}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`rounded border px-3 py-1 transition ${
                                    link.active
                                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                                        : 'border-border bg-card text-card-foreground hover:bg-muted'
                                } ${!link.url ? 'text-muted-foreground cursor-not-allowed opacity-50' : ''}`}
                            >
                                <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: link.label }} />
                            </button>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
