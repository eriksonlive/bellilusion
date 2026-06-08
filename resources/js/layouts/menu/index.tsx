import { DynamicIcon } from '@/components/dynamic-icon';
import { ReactIconPicker } from '@/components/react-icon-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Menu, Permission, Props } from '@/types/menu';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { LayoutList, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

interface ExtendedProps extends Props {
    filters: { search?: string; permission?: string; parent_id?: string; per_page?: string };
    parents: { id: number; label: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '#' },
    { title: 'Menús', href: '/admin/menus' },
];

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function applyFilters(params: Record<string, string | undefined>) {
    router.get(route('admin.menus.index'), params as Record<string, string>, {
        preserveState: true,
        replace: true,
    });
}

export const Index = ({ menus, permissions, filters, parents }: ExtendedProps) => {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props as any;

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Menu | null>(null);
    const [search, setSearch] = useState(filters?.search ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        label: '',
        href: '',
        icon: '',
        parent_id: '',
        order: 0 as number,
        permission: '',
    });

    const perPage = filters?.per_page ?? '10';
    const hasFilters = !!(filters?.search || filters?.permission || filters?.parent_id);

    function openCreate() {
        reset();
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(menu: Menu) {
        setEditing(menu);
        setData({
            label: menu.label,
            href: menu.href ?? '',
            icon: menu.icon ?? '',
            parent_id: menu.parent_id ? String(menu.parent_id) : '',
            order: menu.order ?? 0,
            permission: menu.permission ?? '',
        });
        setShowModal(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(route('admin.menus.update', editing.id), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post(route('admin.menus.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    }

    function handleDelete(menu: Menu) {
        if (!confirm(`¿Eliminar el menú "${menu.label}"?`)) return;
        router.delete(route('admin.menus.destroy', menu.id));
    }

    function submitSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters({ ...filters, search: search || undefined, page: undefined });
    }

    function changeFilter(key: string, value: string) {
        applyFilters({ ...filters, [key]: value === '_all' ? undefined : value, page: undefined });
    }

    function clearFilters() {
        setSearch('');
        applyFilters({ per_page: perPage !== '10' ? perPage : undefined });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Menús — Admin" />
            <div className="flex flex-col gap-5 p-5">

                {/* Flash */}
                {(flash?.success || flash?.error) && (
                    <div
                        className={`flex items-center gap-3 px-4 py-3 text-sm ring-1 rounded-[var(--radius)] ${
                            flash.success
                                ? 'bg-green-50 text-green-700 ring-green-200'
                                : 'bg-red-50 text-red-700 ring-red-200'
                        }`}
                    >
                        <span className={`h-2 w-2 rounded-full ${flash.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        {flash.success ?? flash.error}
                    </div>
                )}

                <div className="card-berry overflow-hidden bg-card rounded-[var(--radius-lg)]">

                    {/* ── Toolbar ─────────────────────────────────── */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h1 className="text-base font-bold">Menús</h1>
                            <p className="text-xs text-muted-foreground">
                                {menus?.total ?? 0} elemento{(menus?.total ?? 0) !== 1 ? 's' : ''} en total
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <form onSubmit={submitSearch} className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar etiqueta..."
                                    className="h-9 w-48 rounded-[var(--radius)] border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </form>

                            {/* Filter: parent */}
                            <Select
                                value={filters?.parent_id ?? '_all'}
                                onValueChange={(v) => changeFilter('parent_id', v)}
                            >
                                <SelectTrigger className="h-9 w-36">
                                    <SelectValue placeholder="Padre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos los padres</SelectItem>
                                    {parents?.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Filter: permission */}
                            <Select
                                value={filters?.permission ?? '_all'}
                                onValueChange={(v) => changeFilter('permission', v)}
                            >
                                <SelectTrigger className="h-9 w-40">
                                    <SelectValue placeholder="Permiso" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos los permisos</SelectItem>
                                    {permissions?.map((p: Permission) => (
                                        <SelectItem key={p.id} value={p.name}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Clear filters */}
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                                    title="Limpiar filtros"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}

                            <Button onClick={openCreate} size="sm" className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Nuevo menú
                            </Button>
                        </div>
                    </div>

                    {/* ── Table ───────────────────────────────────── */}
                    {(menus?.data?.length ?? 0) === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <LayoutList className="mb-3 h-12 w-12 opacity-20" />
                            <p className="font-medium">No hay menús</p>
                            {hasFilters && (
                                <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <table className="berry-table w-full">
                                <thead>
                                    <tr>
                                        <th>Etiqueta</th>
                                        <th>Enlace</th>
                                        <th>Icono</th>
                                        <th>Padre</th>
                                        <th className="text-center">Orden</th>
                                        <th>Permiso</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {menus!.data.map((menu: Menu) => (
                                        <tr key={menu.id}>
                                            <td className="font-semibold">{menu.label}</td>
                                            <td className="text-muted-foreground font-mono text-xs">{menu.href ?? '—'}</td>
                                            <td>
                                                {menu.icon ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <DynamicIcon value={menu.icon} className="h-4 w-4 text-primary" />
                                                        <span className="font-mono text-xs text-muted-foreground">{menu.icon}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </td>
                                            <td>
                                                {menu.parent ? (
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                        {menu.parent.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="text-center tabular-nums">{menu.order ?? 0}</td>
                                            <td>
                                                {menu.permission ? (
                                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                        {menu.permission}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(menu)}
                                                        className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(menu)}
                                                        className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* ── Footer: per_page + pagination ───── */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-sm">
                                {/* Per-page selector */}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>Mostrar</span>
                                    <Select
                                        value={perPage}
                                        onValueChange={(v) =>
                                            applyFilters({ ...filters, per_page: v !== '10' ? v : undefined, page: undefined })
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PER_PAGE_OPTIONS.map((n) => (
                                                <SelectItem key={n} value={String(n)}>
                                                    {n}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span>por página</span>
                                </div>

                                {/* Page info + prev/next */}
                                <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground">
                                        Página {menus!.current_page} de {menus!.last_page}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!menus!.prev_page_url}
                                            onClick={() => menus!.prev_page_url && router.visit(menus!.prev_page_url)}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!menus!.next_page_url}
                                            onClick={() => menus!.next_page_url && router.visit(menus!.next_page_url)}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Modal ──────────────────────────── */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar menú' : 'Nuevo menú'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Label */}
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <Label>Etiqueta *</Label>
                                <Input
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    placeholder="Nombre del menú"
                                    autoFocus
                                />
                                {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
                            </div>

                            {/* Href */}
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <Label>URL</Label>
                                <Input
                                    value={data.href}
                                    onChange={(e) => setData('href', e.target.value)}
                                    placeholder="/ruta/destino"
                                />
                                {errors.href && <p className="text-xs text-red-500">{errors.href}</p>}
                            </div>

                            {/* Icon */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Ícono</Label>
                                <ReactIconPicker
                                    value={data.icon}
                                    onChange={(v) => setData('icon', v)}
                                />
                                {errors.icon && <p className="text-xs text-red-500">{errors.icon}</p>}
                            </div>

                            {/* Order */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Orden</Label>
                                <Input
                                    type="number"
                                    value={data.order}
                                    onChange={(e) => setData('order', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                                {errors.order && <p className="text-xs text-red-500">{errors.order}</p>}
                            </div>

                            {/* Parent */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Menú padre</Label>
                                <Select
                                    value={data.parent_id || '_none'}
                                    onValueChange={(v) => setData('parent_id', v === '_none' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin padre" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">Sin padre (nivel raíz)</SelectItem>
                                        {menus?.data.map((m: Menu) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.parent_id && <p className="text-xs text-red-500">{errors.parent_id}</p>}
                            </div>

                            {/* Permission */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Permiso requerido</Label>
                                <Select
                                    value={data.permission || '_none'}
                                    onValueChange={(v) => setData('permission', v === '_none' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin restricción" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">Sin restricción</SelectItem>
                                        {permissions?.map((p: Permission) => (
                                            <SelectItem key={p.id} value={p.name}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.permission && <p className="text-xs text-red-500">{errors.permission}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editing ? 'Guardar cambios' : 'Crear menú'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default Index;
