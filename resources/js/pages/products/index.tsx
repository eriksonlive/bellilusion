import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Productos', href: '/products' },
];

interface Product {
    id: number;
    name: string;
    description?: string;
    price: string;
    stock: number;
    active: boolean;
}

interface Paginator {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    products: Paginator;
    filters: { search?: string; active?: string; per_page?: string };
}

function formatMoney(n: string | number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n));
}

export default function ProductsIndex({ products, filters }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        price: '',
        stock: '0',
        active: true as boolean,
    });

    function openCreate() {
        reset();
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(p: Product) {
        setEditing(p);
        setData({
            name: p.name,
            description: p.description ?? '',
            price: p.price,
            stock: String(p.stock),
            active: p.active,
        });
        setShowModal(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(route('products.update', editing.id), { onSuccess: () => { setShowModal(false); reset(); } });
        } else {
            post(route('products.store'), { onSuccess: () => { setShowModal(false); reset(); } });
        }
    }

    function handleDelete(p: Product) {
        if (!confirm(`¿Eliminar "${p.name}"?`)) return;
        router.delete(route('products.destroy', p.id));
    }

    function applySearch() {
        router.get(route('products.index'), { ...filters, search, page: 1 }, { preserveState: true, replace: true });
    }

    function clearSearch() {
        setSearch('');
        router.get(route('products.index'), { ...filters, search: '', page: 1 }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Productos" />
            <div className="flex flex-col gap-5 p-4 md:p-6">



                <div className="card-berry overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <div>
                            <h2 className="text-base font-bold">Productos</h2>
                            <p className="text-xs text-muted-foreground">{products.total} producto{products.total !== 1 ? 's' : ''} registrado{products.total !== 1 ? 's' : ''}</p>
                        </div>
                        <Button onClick={openCreate} size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm shadow-secondary/30">
                            <Plus className="h-4 w-4" /> Nuevo producto
                        </Button>
                    </div>
                    <div className="border-b" />

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 px-5 py-3">
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                placeholder="Buscar producto…"
                                className="h-9 w-full rounded-[var(--radius)] border border-input bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {search && (
                                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <select
                            value={filters.active ?? ''}
                            onChange={(e) => router.get(route('products.index'), { ...filters, active: e.target.value, page: 1 }, { preserveState: true, replace: true })}
                            className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Todos</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>
                        <select
                            value={filters.per_page ?? '15'}
                            onChange={(e) => router.get(route('products.index'), { ...filters, per_page: e.target.value, page: 1 }, { preserveState: true, replace: true })}
                            className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n} / pág</option>)}
                        </select>
                    </div>

                    {/* Table */}
                    {products.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Package className="mb-3 h-12 w-12 opacity-20" />
                            <p className="font-medium">No hay productos registrados</p>
                            <Button onClick={openCreate} size="sm" className="mt-4">Crear primer producto</Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="berry-table w-full border-t">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th className="hidden sm:table-cell">Descripción</th>
                                        <th>Precio</th>
                                        <th>Stock</th>
                                        <th>Estado</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                        <Package className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="hidden max-w-[200px] truncate text-muted-foreground sm:table-cell">{p.description || '—'}</td>
                                            <td className="font-medium text-emerald-600">{formatMoney(p.price)}</td>
                                            <td>
                                                <span className={`font-semibold tabular-nums ${p.stock <= 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-foreground'}`}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${p.active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                                    {p.active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(p)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                            <span className="text-muted-foreground">Página {products.current_page} de {products.last_page}</span>
                            <div className="flex gap-1">
                                {products.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`rounded-[var(--radius)] px-3 py-1.5 text-xs transition ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted disabled:opacity-40'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label>Nombre *</Label>
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Ej: Crema hidratante" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Descripción</Label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                                placeholder="Descripción del producto…"
                                className="flex w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Precio *</Label>
                                <Input type="number" min="0" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="0" />
                                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Stock</Label>
                                <Input type="number" min="0" step="1" value={data.stock} onChange={(e) => setData('stock', e.target.value)} placeholder="0" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-[var(--radius)] border border-input bg-muted/30 px-3 py-2">
                            <Label className="cursor-pointer">Producto activo</Label>
                            <button
                                type="button"
                                onClick={() => setData('active', !data.active)}
                                className={`relative h-6 w-11 rounded-full transition-colors ${data.active ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <span className={`block h-4 w-4 translate-y-1 rounded-full bg-white shadow transition-transform ${data.active ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Guardar cambios' : 'Crear producto'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
