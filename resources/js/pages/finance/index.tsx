import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    LayoutGrid,
    Pencil,
    Plus,
    Scissors,
    ShoppingBag,
    Tag,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';
import { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finanzas', href: '/finance' },
];

/* ─── Interfaces ──────────────────────────────────────────── */
interface Category { id: number; name: string; color: string; type: 'income' | 'expense'; }

interface TxItem {
    id?: number;
    type: 'service' | 'product';
    name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
    note?: string;
}

interface TxPayment { id: number; amount: number; date: string; notes?: string; }

interface Transaction {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    paid_amount: number;
    payment_status: 'paid' | 'partial' | 'pending';
    description: string;
    date: string;
    notes?: string;
    appointment_id?: number;
    client_name?: string;
    category?: Category;
    transaction_category_id?: number;
    items: TxItem[];
    payments: TxPayment[];
}

interface ServiceOption { id: number; name: string; price: number; }
interface ProductOption { id: number; name: string; price: number; stock: number; }

interface Paginated<T> { data: T[]; current_page: number; last_page: number; next_page_url: string | null; prev_page_url: string | null; }
interface Summary { monthly_income: number; monthly_expense: number; monthly_balance: number; total_pending: number; }

interface Props {
    transactions: Paginated<Transaction>;
    categories: Category[];
    services: ServiceOption[];
    products: ProductOption[];
    summary: Summary;
    filters: { type?: string; category_id?: string; month?: string; year?: string; payment_status?: string };
}

/* ─── Local form item ─────────────────────────────────────── */
interface LocalItem {
    _key: string;
    id?: number;
    type: 'service' | 'product';
    name: string;
    unit_price: string;
    quantity: string;
    note: string;
}

function mkItem(type: 'service' | 'product', name = '', price = ''): LocalItem {
    return { _key: Math.random().toString(36).slice(2), type, name, unit_price: price, quantity: '1', note: '' };
}

/* ─── Helpers ─────────────────────────────────────────────── */
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const TODAY = format(new Date(), 'yyyy-MM-dd');

function fmt(n: number) { return n.toLocaleString('es-CO', { minimumFractionDigits: 2 }); }

function PayStatusBadge({ status }: { status: Transaction['payment_status'] }) {
    const map = {
        paid:    { label: 'Pagado',   cls: 'bg-green-100 text-green-700' },
        partial: { label: 'Parcial',  cls: 'bg-orange-100 text-orange-700' },
        pending: { label: 'Pendiente',cls: 'bg-red-100 text-red-700' },
    };
    const { label, cls } = map[status];
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

/* ─── TransactionRow ─────────────────────────────────────── */
function TransactionRow({
    tx, onEdit, onDelete, onAddAbono, onDeleteAbono,
}: {
    tx: Transaction;
    onEdit: (tx: Transaction) => void;
    onDelete: (tx: Transaction) => void;
    onAddAbono: (tx: Transaction) => void;
    onDeleteAbono: (tx: Transaction, paymentId: number) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasDetail = tx.items.length > 0 || tx.payments.length > 0 || tx.payment_status !== 'paid';
    const serviceItems = tx.items.filter((i) => i.type === 'service');
    const productItems = tx.items.filter((i) => i.type === 'product');
    const balance = tx.amount - tx.paid_amount;

    return (
        <>
            <tr className={expanded ? 'bg-muted/30' : undefined}>
                {/* Toggle */}
                <td className="w-8 pl-4">
                    {hasDetail ? (
                        <button onClick={() => setExpanded((v) => !v)} className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    ) : <span className="inline-block w-5" />}
                </td>
                {/* Tipo */}
                <td>
                    <div className={`inline-flex items-center justify-center rounded-full p-2 ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'income' ? <ArrowUpCircle className="h-4 w-4 text-green-600" /> : <ArrowDownCircle className="h-4 w-4 text-red-600" />}
                    </div>
                </td>
                {/* Descripción */}
                <td>
                    <div className="flex flex-col gap-0.5">
                        <p className="font-semibold leading-tight">{tx.description}</p>
                        {tx.appointment_id && tx.client_name && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">✂️ {tx.client_name}</span>
                        )}
                        {!tx.appointment_id && tx.notes && (
                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">{tx.notes}</p>
                        )}
                    </div>
                </td>
                {/* Fecha */}
                <td className="tabular-nums text-muted-foreground">
                    <div>{format(parseISO(tx.date), 'dd MMM', { locale: es })}</div>
                    <div className="text-xs">{format(parseISO(tx.date), 'yyyy')}</div>
                </td>
                {/* Categoría */}
                <td>
                    {tx.category
                        ? <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: tx.category.color + '20', color: tx.category.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: tx.category.color }} />{tx.category.name}
                          </span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                {/* Monto + estado */}
                <td className="text-right">
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-base font-bold tabular-nums ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}
                        </span>
                        {tx.payment_status !== 'paid' && (
                            <div className="flex flex-col items-end gap-0.5">
                                <PayStatusBadge status={tx.payment_status} />
                                {tx.paid_amount > 0 && (
                                    <span className="text-xs text-muted-foreground">Abonado: ${fmt(tx.paid_amount)}</span>
                                )}
                                <span className="text-xs font-semibold text-red-600">Debe: ${fmt(balance)}</span>
                            </div>
                        )}
                    </div>
                </td>
                {/* Acciones */}
                <td>
                    <div className="flex items-center justify-end gap-1">
                        {tx.payment_status !== 'paid' && (
                            <button onClick={() => onAddAbono(tx)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-green-50 hover:text-green-700 transition-colors" title="Registrar abono">
                                <Wallet className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <button onClick={() => onEdit(tx)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => onDelete(tx)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors" title="Eliminar">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </td>
            </tr>

            {/* ── Panel expandible ──────────────────────────── */}
            {expanded && (
                <tr>
                    <td colSpan={7} className="bg-muted/20 px-4 py-4 sm:px-12">
                        <div className="rounded-lg border border-dashed border-border bg-card p-4 space-y-4">

                            {/* Desglose de ítems */}
                            {tx.items.length > 0 && (
                                <div>
                                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {tx.appointment_id ? 'Desglose de la cita' : 'Ítems'}
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {serviceItems.length > 0 && (
                                            <div>
                                                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600">
                                                    <Scissors className="h-3.5 w-3.5" /> Servicios
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {serviceItems.map((item) => (
                                                        <div key={item.id} className="flex items-start justify-between rounded-md bg-violet-50 px-3 py-1.5">
                                                            <div>
                                                                <span className="text-sm font-medium">{item.name}</span>
                                                                {item.quantity > 1 && <span className="ml-1.5 rounded-full bg-violet-200 px-1.5 py-0.5 text-xs font-semibold text-violet-700">×{item.quantity}</span>}
                                                                {item.note && <p className="mt-0.5 text-xs text-violet-500 italic">{item.note}</p>}
                                                            </div>
                                                            <span className="text-sm font-bold text-violet-700">${fmt(item.subtotal)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {productItems.length > 0 && (
                                            <div>
                                                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
                                                    <ShoppingBag className="h-3.5 w-3.5" /> Productos
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {productItems.map((item) => (
                                                        <div key={item.id} className="flex items-start justify-between rounded-md bg-amber-50 px-3 py-1.5">
                                                            <div>
                                                                <span className="text-sm font-medium">{item.name}</span>
                                                                {item.quantity > 1 && <span className="ml-1.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-semibold text-amber-700">×{item.quantity}</span>}
                                                                {item.note && <p className="mt-0.5 text-xs text-amber-500 italic">{item.note}</p>}
                                                            </div>
                                                            <span className="text-sm font-bold text-amber-700">${fmt(item.subtotal)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 flex justify-end border-t pt-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-muted-foreground">Total:</span>
                                            <span className="text-lg font-bold text-green-600">${fmt(tx.amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Abonos */}
                            {(tx.payment_status !== 'paid' || tx.payments.length > 0) && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Wallet className="h-3.5 w-3.5" /> Abonos
                                        </p>
                                        {tx.payment_status !== 'paid' && (
                                            <button onClick={() => onAddAbono(tx)} className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 transition-colors">
                                                <Plus className="h-3 w-3" /> Registrar abono
                                            </button>
                                        )}
                                    </div>

                                    {tx.payments.length === 0 ? (
                                        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">Sin abonos registrados — debe ${fmt(tx.amount)}</p>
                                    ) : (
                                        <div className="flex flex-col gap-1.5">
                                            {tx.payments.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground">{format(parseISO(p.date), 'dd MMM yyyy', { locale: es })}</span>
                                                        {p.notes && <span className="text-xs text-green-700 italic">{p.notes}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-green-700">+${fmt(p.amount)}</span>
                                                        <button onClick={() => onDeleteAbono(tx, p.id)} className="rounded p-0.5 text-muted-foreground hover:text-red-600 transition-colors">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {tx.payments.length > 0 && (
                                        <div className="mt-2 flex justify-end gap-6 border-t pt-2 text-sm">
                                            <span className="text-muted-foreground">Abonado: <strong className="text-green-600">${fmt(tx.paid_amount)}</strong></span>
                                            <span className="text-muted-foreground">Pendiente: <strong className="text-red-600">${fmt(tx.amount - tx.paid_amount)}</strong></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

/* ─── ItemsEditor ────────────────────────────────────────── */
function ItemsEditor({
    items, services, products, onChange,
}: {
    items: LocalItem[];
    services: ServiceOption[];
    products: ProductOption[];
    onChange: (items: LocalItem[]) => void;
}) {
    const [addingType, setAddingType] = useState<'service' | 'product' | null>(null);

    function update(key: string, field: keyof LocalItem, value: string) {
        onChange(items.map((i) => i._key === key ? { ...i, [field]: value } : i));
    }
    function remove(key: string) {
        onChange(items.filter((i) => i._key !== key));
    }
    function addFromCatalog(type: 'service' | 'product', id: string) {
        if (!id || id === '_none') return;
        const catalog = type === 'service' ? services : products;
        const found = catalog.find((c) => c.id === parseInt(id));
        if (!found) return;
        onChange([...items, mkItem(type, found.name, found.price.toString())]);
        setAddingType(null);
    }
    function addManual(type: 'service' | 'product') {
        onChange([...items, mkItem(type)]);
        setAddingType(null);
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Ítems del ingreso</Label>
                <div className="flex gap-1">
                    <button type="button" onClick={() => setAddingType(addingType === 'service' ? null : 'service')}
                        className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-violet-50 hover:border-violet-300 transition-colors">
                        <Scissors className="h-3 w-3 text-violet-600" /> Servicio
                    </button>
                    <button type="button" onClick={() => setAddingType(addingType === 'product' ? null : 'product')}
                        className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-amber-50 hover:border-amber-300 transition-colors">
                        <ShoppingBag className="h-3 w-3 text-amber-600" /> Producto
                    </button>
                </div>
            </div>

            {/* Picker de catálogo */}
            {addingType && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Agregar {addingType === 'service' ? 'servicio' : 'producto'}
                    </p>
                    <div className="flex gap-2">
                        <Select onValueChange={(v) => addFromCatalog(addingType, v)}>
                            <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue placeholder={`Seleccionar del catálogo...`} /></SelectTrigger>
                            <SelectContent>
                                {(addingType === 'service' ? services : products).map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name} — ${fmt(c.price)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => addManual(addingType)}>
                            Manual
                        </Button>
                    </div>
                </div>
            )}

            {/* Lista de ítems */}
            {items.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-2">
                    {items.map((item) => (
                        <div key={item._key} className={`rounded-md p-2.5 space-y-2 ${item.type === 'service' ? 'bg-violet-50' : 'bg-amber-50'}`}>
                            <div className="flex items-center gap-2">
                                {item.type === 'service'
                                    ? <Scissors className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                                    : <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                                <Input
                                    value={item.name}
                                    onChange={(e) => update(item._key, 'name', e.target.value)}
                                    placeholder="Nombre del ítem"
                                    className="h-7 flex-1 text-sm bg-white"
                                />
                                <button type="button" onClick={() => remove(item._key)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-red-600">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <p className="mb-0.5 text-xs text-muted-foreground">Precio unit.</p>
                                    <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => update(item._key, 'unit_price', e.target.value)} placeholder="0.00" className="h-7 text-sm bg-white" />
                                </div>
                                <div>
                                    <p className="mb-0.5 text-xs text-muted-foreground">Cant.</p>
                                    <Input type="number" min="1" step="1" value={item.quantity} onChange={(e) => update(item._key, 'quantity', e.target.value)} placeholder="1" className="h-7 text-sm bg-white" />
                                </div>
                                <div>
                                    <p className="mb-0.5 text-xs text-muted-foreground">Subtotal</p>
                                    <div className="flex h-7 items-center rounded-md border bg-muted/40 px-2.5 text-sm font-semibold tabular-nums">
                                        ${fmt((parseFloat(item.unit_price || '0') || 0) * (parseInt(item.quantity || '1') || 1))}
                                    </div>
                                </div>
                            </div>
                            <Input value={item.note} onChange={(e) => update(item._key, 'note', e.target.value)} placeholder="Nota: descuento, regalo, promoción... (opcional)" className="h-7 text-xs bg-white" />
                        </div>
                    ))}
                    {/* Total */}
                    <div className="flex justify-end border-t pt-1.5 pr-1">
                        <span className="text-sm font-bold">
                            Total: ${fmt(items.reduce((s, i) => s + (parseFloat(i.unit_price || '0') || 0) * (parseInt(i.quantity || '1') || 1), 0))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Main component ─────────────────────────────────────── */
export default function FinanceIndex({ transactions, categories, services, products, summary, filters }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        type: 'income' as 'income' | 'expense',
        amount: '',
        description: '',
        date: TODAY,
        transaction_category_id: '',
        notes: '',
        payment_status: 'paid' as 'paid' | 'partial' | 'pending',
    });
    const [formItems, setFormItems] = useState<LocalItem[]>([]);

    // Abono modal
    const [abonoTx, setAbonoTx] = useState<Transaction | null>(null);
    const { data: abonoData, setData: setAbonoData, post: abonoPost, processing: abonoProcessing, errors: abonoErrors, reset: abonoReset } = useForm({
        amount: '',
        date: TODAY,
        notes: '',
    });

    /* Derived */
    const itemsTotal = formItems.reduce((s, i) => s + (parseFloat(i.unit_price || '0') || 0) * (parseInt(i.quantity || '1') || 1), 0);
    const filteredCats = categories.filter((c) => c.type === formData.type);

    /* Handlers */
    function setField<K extends keyof typeof formData>(k: K, v: typeof formData[K]) {
        setFormData((p) => ({ ...p, [k]: v }));
    }

    function openCreate(type: 'income' | 'expense' = 'income') {
        setEditingTx(null);
        setFormErrors({});
        setFormItems([]);
        setFormData({ type, amount: '', description: '', date: TODAY, transaction_category_id: '', notes: '', payment_status: 'paid' });
        setShowModal(true);
    }

    function openEdit(tx: Transaction) {
        setEditingTx(tx);
        setFormErrors({});
        setFormData({
            type: tx.type,
            amount: tx.amount.toString(),
            description: tx.description,
            date: tx.date,
            transaction_category_id: tx.transaction_category_id?.toString() ?? '',
            notes: tx.notes ?? '',
            payment_status: tx.payment_status,
        });
        setFormItems(tx.items.map((i) => ({
            _key: Math.random().toString(36).slice(2),
            id: i.id,
            type: i.type,
            name: i.name,
            unit_price: i.unit_price.toString(),
            quantity: i.quantity.toString(),
            note: i.note ?? '',
        })));
        setShowModal(true);
    }

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Use items total if items present
        const amount = formItems.length > 0 ? itemsTotal.toString() : formData.amount;

        const payload = {
            ...formData,
            amount,
            transaction_category_id: formData.transaction_category_id || null,
            items: formItems.length > 0 ? formItems.map((i) => ({
                id: i.id,
                type: i.type,
                name: i.name,
                unit_price: parseFloat(i.unit_price || '0'),
                quantity: parseInt(i.quantity || '1'),
                note: i.note || null,
            })) : undefined,
        };

        const url = editingTx ? route('finance.update', editingTx.id) : route('finance.store');
        const method = editingTx ? 'put' : 'post';

        router[method](url, payload, {
            onSuccess: () => { setShowModal(false); setProcessing(false); },
            onError: (errs) => { setFormErrors(errs); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    }, [formData, formItems, editingTx, itemsTotal]);

    function handleDelete(tx: Transaction) {
        const msg = tx.appointment_id
            ? '⚠️ Esta transacción fue generada por una cita.\n\nSi la eliminas, el ingreso desaparecerá pero la cita seguirá marcada como completada.\n\n¿Confirmas la eliminación?'
            : '¿Eliminar esta transacción? Esta acción no se puede deshacer.';
        if (!confirm(msg)) return;
        router.delete(route('finance.destroy', tx.id));
    }

    function handleAddAbono(tx: Transaction) {
        setAbonoTx(tx);
        abonoReset();
        setAbonoData('date', TODAY);
    }

    function handleAbonoSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!abonoTx) return;
        abonoPost(route('finance.payments.store', abonoTx.id), {
            onSuccess: () => { setAbonoTx(null); abonoReset(); },
        });
    }

    function handleDeleteAbono(tx: Transaction, paymentId: number) {
        if (!confirm('¿Eliminar este abono?')) return;
        router.delete(route('finance.payments.destroy', { transaction: tx.id, payment: paymentId }));
    }

    function applyFilter(key: string, value: string) {
        const real = value === '_all' ? undefined : value || undefined;
        router.get(route('finance.index'), { ...filters, [key]: real }, { preserveState: true, replace: true });
    }

    const balance = summary.monthly_balance;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finanzas" />
            <div className="flex flex-col gap-5 p-5">

                {/* ── Header ───────────────────────────────────── */}
                <div className="card-berry flex flex-wrap items-center justify-between gap-3 bg-card px-5 py-4" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <div>
                        <h1 className="text-xl font-bold">Finanzas</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Resumen del mes de {format(new Date(), 'MMMM yyyy', { locale: es })}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('finance.categories.index')}>
                            <Button variant="outline" size="sm"><Tag className="h-4 w-4" /> Categorías</Button>
                        </Link>
                        <Button onClick={() => openCreate('income')} size="sm" className="bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/30">
                            <ArrowUpCircle className="h-4 w-4" /> Ingreso
                        </Button>
                        <Button onClick={() => openCreate('expense')} size="sm" className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/30">
                            <ArrowDownCircle className="h-4 w-4" /> Egreso
                        </Button>
                    </div>
                </div>

                {/* ── Summary cards ────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingresos del mes</p>
                                <p className="mt-2 text-2xl font-bold text-green-600">${fmt(summary.monthly_income)}</p>
                            </div>
                            <div className="rounded-2xl bg-green-100 p-3"><ArrowUpCircle className="h-6 w-6 text-green-600" /></div>
                        </div>
                        <div className="h-1 bg-green-500/20"><div className="h-full bg-green-500" style={{ width: '100%' }} /></div>
                    </div>
                    <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Egresos del mes</p>
                                <p className="mt-2 text-2xl font-bold text-red-600">${fmt(summary.monthly_expense)}</p>
                            </div>
                            <div className="rounded-2xl bg-red-100 p-3"><ArrowDownCircle className="h-6 w-6 text-red-600" /></div>
                        </div>
                        <div className="h-1 bg-red-500/20"><div className="h-full bg-red-500" style={{ width: summary.monthly_income > 0 ? `${Math.min(100, (summary.monthly_expense / summary.monthly_income) * 100)}%` : '0%' }} /></div>
                    </div>
                    <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance del mes</p>
                                <p className={`mt-2 text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{balance >= 0 ? '+' : ''}{fmt(balance)}</p>
                            </div>
                            <div className={`rounded-2xl p-3 ${balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                                {balance >= 0 ? <TrendingUp className="h-6 w-6 text-blue-600" /> : <TrendingDown className="h-6 w-6 text-orange-600" />}
                            </div>
                        </div>
                        <div className={`h-1 ${balance >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}><div className={`h-full ${balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: '100%' }} /></div>
                    </div>
                    <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cartera por cobrar</p>
                                <p className="mt-2 text-2xl font-bold text-orange-600">${fmt(summary.total_pending)}</p>
                            </div>
                            <div className="rounded-2xl bg-orange-100 p-3"><Clock className="h-6 w-6 text-orange-600" /></div>
                        </div>
                        <div className="h-1 bg-orange-500/20"><div className="h-full bg-orange-500" style={{ width: summary.total_pending > 0 ? '100%' : '0%' }} /></div>
                    </div>
                </div>

                {/* ── Tabla ────────────────────────────────────── */}
                <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h2 className="text-base font-bold">Movimientos</h2>
                            <p className="text-xs text-muted-foreground">Haz clic en <ChevronRight className="inline h-3 w-3" /> para ver desglose y abonos</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={filters.type ?? '_all'} onValueChange={(v) => applyFilter('type', v)}>
                                <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos</SelectItem>
                                    <SelectItem value="income">Ingresos</SelectItem>
                                    <SelectItem value="expense">Egresos</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.payment_status ?? '_all'} onValueChange={(v) => applyFilter('payment_status', v)}>
                                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Estado pago" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos</SelectItem>
                                    <SelectItem value="paid">Pagados</SelectItem>
                                    <SelectItem value="partial">Parciales</SelectItem>
                                    <SelectItem value="pending">Pendientes</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.category_id ?? '_all'} onValueChange={(v) => applyFilter('category_id', v)}>
                                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Categoría" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todas</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filters.month ?? '_all'} onValueChange={(v) => applyFilter('month', v)}>
                                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Mes" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos los meses</SelectItem>
                                    {MONTHS.map((m, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters.year ?? '_all'} onValueChange={(v) => applyFilter('year', v)}>
                                <SelectTrigger className="h-8 w-24"><SelectValue placeholder="Año" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos</SelectItem>
                                    {YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {transactions.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <LayoutGrid className="mb-3 h-12 w-12 opacity-20" />
                            <p className="font-medium">No hay transacciones</p>
                            <div className="mt-4 flex gap-2">
                                <Button onClick={() => openCreate('income')} size="sm" className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4" />Ingreso</Button>
                                <Button onClick={() => openCreate('expense')} size="sm" className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4" />Egreso</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="berry-table w-full">
                                    <thead>
                                        <tr>
                                            <th className="w-8" />
                                            <th>Tipo</th>
                                            <th>Descripción</th>
                                            <th>Fecha</th>
                                            <th>Categoría</th>
                                            <th className="text-right">Monto</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.data.map((tx) => (
                                            <TransactionRow
                                                key={tx.id}
                                                tx={tx}
                                                onEdit={openEdit}
                                                onDelete={handleDelete}
                                                onAddAbono={handleAddAbono}
                                                onDeleteAbono={handleDeleteAbono}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {(transactions.next_page_url || transactions.current_page > 1) && (
                                <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                                    <span className="text-muted-foreground">Página {transactions.current_page}</span>
                                    <div className="flex gap-1">
                                        <Link href={transactions.prev_page_url ?? '#'} className={!transactions.prev_page_url ? 'pointer-events-none opacity-40' : ''}><Button variant="outline" size="sm">Anterior</Button></Link>
                                        <Link href={transactions.next_page_url ?? '#'} className={!transactions.next_page_url ? 'pointer-events-none opacity-40' : ''}><Button variant="outline" size="sm">Siguiente</Button></Link>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Modal crear / editar ──────────────────────── */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTx?.appointment_id ? 'Ajustar ingreso de cita' : editingTx ? 'Editar transacción' : 'Nueva transacción'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Aviso cita */}
                        {editingTx?.appointment_id && (
                            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Transacción generada por una cita</p>
                                    <p className="mt-0.5 text-xs text-amber-700">Puedes ajustar ítems (precios, descuentos), categoría y notas. Para anular totalmente, elimina la transacción.</p>
                                </div>
                            </div>
                        )}

                        {/* Tipo — solo si no es cita */}
                        {!editingTx?.appointment_id && (
                            <div className="flex flex-col gap-1.5">
                                <Label>Tipo *</Label>
                                <div className="flex gap-1 border bg-muted/30 p-1" style={{ borderRadius: 'var(--radius)' }}>
                                    {(['income', 'expense'] as const).map((t) => (
                                        <button key={t} type="button"
                                            onClick={() => { setField('type', t); setField('transaction_category_id', ''); }}
                                            className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-semibold transition-all ${
                                                formData.type === t
                                                    ? t === 'income' ? 'rounded-[calc(var(--radius)-2px)] bg-green-600 text-white shadow' : 'rounded-[calc(var(--radius)-2px)] bg-red-600 text-white shadow'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}>
                                            {t === 'income' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                                            {t === 'income' ? 'Ingreso' : 'Egreso'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Estado de pago (fiado) */}
                        {formData.type === 'income' && (
                            <div className="flex flex-col gap-1.5">
                                <Label>¿Cómo se cobró?</Label>
                                <div className="flex gap-1 border bg-muted/30 p-1" style={{ borderRadius: 'var(--radius)' }}>
                                    {([
                                        { value: 'paid',    label: 'Al contado',  icon: '💵' },
                                        { value: 'pending', label: 'Fiado',        icon: '🤝' },
                                    ] as const).map(({ value, label, icon }) => (
                                        <button key={value} type="button"
                                            onClick={() => setField('payment_status', value)}
                                            className={`flex flex-1 items-center justify-center gap-2 py-1.5 text-sm font-medium transition-all ${
                                                formData.payment_status === value
                                                    ? value === 'paid' ? 'rounded-[calc(var(--radius)-2px)] bg-green-600 text-white shadow' : 'rounded-[calc(var(--radius)-2px)] bg-orange-500 text-white shadow'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}>
                                            {icon} {label}
                                        </button>
                                    ))}
                                </div>
                                {formData.payment_status === 'pending' && (
                                    <p className="text-xs text-orange-600">💡 Se registrará como pendiente. Podrás ir abonando después.</p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="description">Descripción *</Label>
                            <Input id="description" value={formData.description} onChange={(e) => setField('description', e.target.value)} placeholder="Ej: Pago de servicio de corte" />
                            {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
                        </div>

                        {/* Ítems editor — solo para ingresos */}
                        {formData.type === 'income' && (
                            <ItemsEditor
                                items={formItems}
                                services={services}
                                products={products}
                                onChange={setFormItems}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="amount">
                                    {formItems.length > 0 ? 'Monto (auto)' : 'Monto *'}
                                </Label>
                                <Input
                                    id="amount"
                                    type="number" step="0.01" min="0.01"
                                    value={formItems.length > 0 ? itemsTotal.toFixed(2) : formData.amount}
                                    onChange={(e) => setField('amount', e.target.value)}
                                    placeholder="0.00"
                                    readOnly={formItems.length > 0}
                                    className={formItems.length > 0 ? 'bg-muted font-semibold text-green-700' : ''}
                                />
                                {formErrors.amount && <p className="text-xs text-destructive">{formErrors.amount}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="date">Fecha *</Label>
                                <Input id="date" type="date" value={formData.date} onChange={(e) => setField('date', e.target.value)} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Categoría</Label>
                            <Select value={formData.transaction_category_id || '_none'} onValueChange={(v) => setField('transaction_category_id', v === '_none' ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin categoría</SelectItem>
                                    {filteredCats.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="notes">Notas</Label>
                            <textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setField('notes', e.target.value)}
                                rows={2}
                                style={{ borderRadius: 'var(--radius)' }}
                                className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Notas adicionales..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editingTx ? 'Guardar cambios' : 'Registrar'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Modal abono ───────────────────────────────── */}
            <Dialog open={!!abonoTx} onOpenChange={(v) => !v && setAbonoTx(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Registrar abono</DialogTitle>
                    </DialogHeader>
                    {abonoTx && (
                        <div className="flex flex-col gap-1.5 mb-4 rounded-lg bg-muted/40 p-3">
                            <p className="text-sm font-semibold">{abonoTx.description}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Total: <strong>${fmt(abonoTx.amount)}</strong></span>
                                <span>Abonado: <strong className="text-green-600">${fmt(abonoTx.paid_amount)}</strong></span>
                                <span>Debe: <strong className="text-red-600">${fmt(abonoTx.amount - abonoTx.paid_amount)}</strong></span>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleAbonoSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="abono-amount">Monto del abono *</Label>
                            <Input id="abono-amount" type="number" step="0.01" min="0.01" value={abonoData.amount} onChange={(e) => setAbonoData('amount', e.target.value)} placeholder="0.00" />
                            {abonoErrors.amount && <p className="text-xs text-destructive">{abonoErrors.amount}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="abono-date">Fecha *</Label>
                            <Input id="abono-date" type="date" value={abonoData.date} onChange={(e) => setAbonoData('date', e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="abono-notes">Nota (opcional)</Label>
                            <Input id="abono-notes" value={abonoData.notes} onChange={(e) => setAbonoData('notes', e.target.value)} placeholder="Ej: transferencia, efectivo..." />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setAbonoTx(null)}>Cancelar</Button>
                            <Button type="submit" disabled={abonoProcessing} className="bg-green-600 hover:bg-green-700">
                                <Wallet className="h-4 w-4" /> Registrar abono
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
