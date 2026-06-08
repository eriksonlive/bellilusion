import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finanzas', href: '/finance' },
    { title: 'Categorías', href: '/finance/categories' },
];

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#64748b',
];

interface Category {
    id: number;
    name: string;
    color: string;
    type: 'income' | 'expense';
    transactions_count: number;
}

interface Props {
    categories: Category[];
}

export default function CategoriesIndex({ categories }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        color: '#6366f1',
        type: 'income' as 'income' | 'expense',
    });

    function openCreate() {
        reset();
        setEditingCategory(null);
        setShowModal(true);
    }

    function openEdit(category: Category) {
        setEditingCategory(category);
        setData({ name: category.name, color: category.color, type: category.type });
        setShowModal(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingCategory) {
            put(route('finance.categories.update', editingCategory.id), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post(route('finance.categories.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    }

    function handleDelete(category: Category) {
        if (!confirm(`¿Eliminar la categoría "${category.name}"? Las transacciones vinculadas perderán su categoría.`)) return;
        router.delete(route('finance.categories.destroy', category.id));
    }

    const incomeCategories = categories.filter((c) => c.type === 'income');
    const expenseCategories = categories.filter((c) => c.type === 'expense');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categorías" />
            <div className="flex flex-col gap-4 p-4">
                {flash?.success && (
                    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('finance.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">Categorías</h1>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="h-4 w-4" /> Nueva categoría
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Income Categories */}
                    <div className="rounded-xl border bg-card">
                        <div className="border-b px-4 py-3">
                            <h2 className="font-semibold text-green-600 dark:text-green-400">Ingresos</h2>
                        </div>
                        {incomeCategories.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Sin categorías de ingreso</div>
                        ) : (
                            <div className="divide-y">
                                {incomeCategories.map((cat) => (
                                    <CategoryRow key={cat.id} category={cat} onEdit={openEdit} onDelete={handleDelete} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Expense Categories */}
                    <div className="rounded-xl border bg-card">
                        <div className="border-b px-4 py-3">
                            <h2 className="font-semibold text-red-600 dark:text-red-400">Egresos</h2>
                        </div>
                        {expenseCategories.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Sin categorías de egreso</div>
                        ) : (
                            <div className="divide-y">
                                {expenseCategories.map((cat) => (
                                    <CategoryRow key={cat.id} category={cat} onEdit={openEdit} onDelete={handleDelete} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>Tipo *</Label>
                            <div className="flex rounded-lg border p-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'income')}
                                    className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${data.type === 'income' ? 'bg-green-600 text-white' : 'hover:bg-muted'}`}
                                >
                                    Ingreso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'expense')}
                                    className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${data.type === 'expense' ? 'bg-red-600 text-white' : 'hover:bg-muted'}`}
                                >
                                    Egreso
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Ej: Servicios, Materiales..."
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setData('color', color)}
                                        className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${data.color === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full border" style={{ backgroundColor: data.color }} />
                                <Input
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    placeholder="#6366f1"
                                    className="h-8 font-mono text-sm"
                                />
                            </div>
                            {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>
                                {editingCategory ? 'Guardar' : 'Crear'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function CategoryRow({
    category,
    onEdit,
    onDelete,
}: {
    category: Category;
    onEdit: (c: Category) => void;
    onDelete: (c: Category) => void;
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
            <div className="flex-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">{category.transactions_count} transacciones</p>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    );
}
