import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Banknote,
    CheckCircle2,
    ChevronDown,
    CreditCard,
    Handshake,
    Minus,
    Package,
    Pencil,
    Percent,
    Plus,
    Printer,
    Scissors,
    Search,
    ShoppingCart,
    Smartphone,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

/* ─── Types ─────────────────────────────────────────────── */
interface ServiceOption  { id: number; name: string; description?: string; price: number; duration_minutes?: number; }
interface ProductOption  { id: number; name: string; description?: string; price: number; stock: number; }
interface ClientOption   { id: number; name: string; phone?: string; email?: string; }
interface CategoryOption { id: number; name: string; color: string; }

interface Props {
    services: ServiceOption[];
    products: ProductOption[];
    clients: ClientOption[];
    categories: CategoryOption[];
}

interface CartItem {
    _key: string;
    type: 'service' | 'product';
    id?: number;
    name: string;
    unit_price: number;
    quantity: number;
    discount: number;
    note: string;
    custom?: boolean;
}

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit';

interface Receipt {
    transaction_id: number;
    date: string;
    client_name?: string;
    items: { type: string; name: string; unit_price: number; quantity: number; discount: number; final_subtotal: number; note?: string }[];
    subtotal: number;
    discount_global: number;
    total: number;
    payment_method: PaymentMethod;
    payment_status: string;
    cash_received?: number;
    change?: number;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const TODAY = format(new Date(), 'yyyy-MM-dd');
function fmt(n: number) { return n.toLocaleString('es-CO', { minimumFractionDigits: 2 }); }
function itemFinal(item: CartItem) { const b = item.unit_price * item.quantity; return b - b * item.discount / 100; }

const PM_CONFIG: Record<PaymentMethod, { label: string; icon: React.ReactNode; active: string }> = {
    cash:     { label: 'Efectivo',      icon: <Banknote className="h-4 w-4" />,   active: 'bg-green-600 text-white border-green-600' },
    card:     { label: 'Tarjeta',       icon: <CreditCard className="h-4 w-4" />, active: 'bg-blue-600 text-white border-blue-600' },
    transfer: { label: 'Transferencia', icon: <Smartphone className="h-4 w-4" />, active: 'bg-violet-600 text-white border-violet-600' },
    credit:   { label: 'Fiado',         icon: <Handshake className="h-4 w-4" />,  active: 'bg-orange-500 text-white border-orange-500' },
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'POS', href: '/pos' },
];

/* ─── Custom item form ───────────────────────────────────── */
function CustomItemDialog({ onAdd, onClose }: { onAdd: (item: CartItem) => void; onClose: () => void }) {
    const [form, setForm] = useState({ type: 'service' as 'service' | 'product', name: '', price: '', quantity: '1', note: '' });
    const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || !form.price) return;
        onAdd({
            _key: Math.random().toString(36).slice(2),
            type: form.type,
            id: undefined,
            name: form.name,
            unit_price: parseFloat(form.price) || 0,
            quantity: parseInt(form.quantity) || 1,
            discount: 0,
            note: form.note,
            custom: true,
        });
        onClose();
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Ítem personalizado</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">Agrega cualquier servicio o producto que no esté en el catálogo.</p>
                    <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                        {(['service', 'product'] as const).map((t) => (
                            <button key={t} type="button" onClick={() => f('type', t)}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                                    form.type === t ? (t === 'service' ? 'bg-violet-600 text-white shadow' : 'bg-amber-500 text-white shadow') : 'text-muted-foreground'
                                }`}>
                                {t === 'service' ? <Scissors className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                                {t === 'service' ? 'Servicio' : 'Producto'}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nombre *</Label>
                        <Input value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="Ej: Tratamiento especial" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Precio *</Label>
                            <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => f('price', e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Cantidad</Label>
                            <Input type="number" min="1" value={form.quantity} onChange={(e) => f('quantity', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nota (opcional)</Label>
                        <Input value={form.note} onChange={(e) => f('note', e.target.value)} placeholder="Descripción o detalle..." />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="flex-1" disabled={!form.name || !form.price}>
                            <Plus className="h-4 w-4" /> Agregar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Receipt ─────────────────────────────────────────────── */
function ReceiptModal({ receipt, businessName, onClose }: { receipt: Receipt; businessName: string; onClose: () => void }) {
    const pmLabel = PM_CONFIG[receipt.payment_method]?.label ?? receipt.payment_method;
    const dateStr = format(new Date(receipt.date + 'T12:00:00'), "dd 'de' MMMM yyyy", { locale: es });

    function handlePrint() {
        const rows = receipt.items.map((i) =>
            `<div class="row"><span>${i.name} ×${i.quantity}${i.discount > 0 ? ` (-${i.discount}%)` : ''}</span><span>$${fmt(i.final_subtotal)}</span></div>
             ${i.note ? `<div style="color:#888;font-size:11px;padding-left:8px">${i.note}</div>` : ''}`
        ).join('');

        const win = window.open('', '_blank', 'width=380,height=650');
        if (!win) return;
        win.document.write(`<html><head><title>Recibo #${receipt.transaction_id}</title>
        <style>
            body{font-family:monospace;font-size:12px;padding:16px;width:310px;margin:0 auto}
            h1{font-size:15px;text-align:center;margin:0 0 4px}
            .sub{text-align:center;color:#666;font-size:11px;margin:0 0 2px}
            hr{border:none;border-top:1px dashed #999;margin:8px 0}
            .row{display:flex;justify-content:space-between;margin:3px 0;font-size:12px}
            .total{font-size:16px;font-weight:bold}
            .warn{text-align:center;font-weight:bold;color:#c05000;margin-top:4px}
            .thanks{text-align:center;color:#888;margin-top:6px;font-size:11px}
        </style></head><body>
        <h1>${businessName}</h1>
        <p class="sub">Recibo #${receipt.transaction_id}</p>
        ${receipt.client_name ? `<p class="sub">Cliente: ${receipt.client_name}</p>` : ''}
        <p class="sub">${dateStr}</p>
        <hr>${rows}<hr>
        ${receipt.discount_global > 0 ? `<div class="row"><span>Subtotal</span><span>$${fmt(receipt.subtotal)}</span></div>
        <div class="row" style="color:green"><span>Descuento global</span><span>-$${fmt(receipt.discount_global)}</span></div>` : ''}
        <div class="row total"><span>TOTAL</span><span>$${fmt(receipt.total)}</span></div><hr>
        <div class="row"><span>Pago</span><span>${pmLabel}</span></div>
        ${receipt.payment_status === 'pending' ? '<p class="warn">⚠ PENDIENTE (FIADO)</p>' : ''}
        ${receipt.cash_received ? `<div class="row"><span>Recibido</span><span>$${fmt(receipt.cash_received)}</span></div>
        <div class="row" style="font-weight:bold;color:green"><span>Cambio</span><span>$${fmt(receipt.change ?? 0)}</span></div>` : ''}
        <p class="thanks">¡Gracias por su preferencia!</p>
        </body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" /> ¡Venta registrada!
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-dashed bg-muted/20 p-4 font-mono text-xs">
                    <p className="text-center font-bold text-base">{businessName}</p>
                    <p className="text-center text-muted-foreground">Recibo #{receipt.transaction_id}</p>
                    {receipt.client_name && <p className="text-center">Cliente: {receipt.client_name}</p>}
                    <p className="text-center text-muted-foreground">{dateStr}</p>
                    <hr className="my-2 border-dashed" />
                    {receipt.items.map((item, i) => (
                        <div key={i} className="mb-1">
                            <div className="flex justify-between"><span className="font-medium">{item.name}</span></div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>×{item.quantity} @ ${fmt(item.unit_price)}{item.discount > 0 ? ` −${item.discount}%` : ''}</span>
                                <span>${fmt(item.final_subtotal)}</span>
                            </div>
                            {item.note && <p className="italic text-muted-foreground ml-2">{item.note}</p>}
                        </div>
                    ))}
                    <hr className="my-2 border-dashed" />
                    {receipt.discount_global > 0 && (
                        <>
                            <div className="flex justify-between"><span>Subtotal</span><span>${fmt(receipt.subtotal)}</span></div>
                            <div className="flex justify-between text-green-700"><span>Descuento global</span><span>-${fmt(receipt.discount_global)}</span></div>
                        </>
                    )}
                    <div className="flex justify-between text-base font-bold"><span>TOTAL</span><span>${fmt(receipt.total)}</span></div>
                    <hr className="my-2 border-dashed" />
                    <div className="flex justify-between"><span>Método</span><span>{pmLabel}</span></div>
                    {receipt.payment_status === 'pending' && <p className="mt-1 text-center font-bold text-orange-600">PENDIENTE DE PAGO (FIADO)</p>}
                    {receipt.cash_received != null && receipt.cash_received > 0 && (
                        <>
                            <div className="flex justify-between"><span>Recibido</span><span>${fmt(receipt.cash_received)}</span></div>
                            <div className="flex justify-between font-bold text-green-700"><span>Cambio</span><span>${fmt(receipt.change ?? 0)}</span></div>
                        </>
                    )}
                    <p className="mt-2 text-center text-muted-foreground">¡Gracias por su preferencia!</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handlePrint}><Printer className="h-4 w-4" /> Imprimir</Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onClose}>Nueva venta</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Main POS ───────────────────────────────────────────── */
export default function PosIndex({ services, products, clients, categories }: Props) {
    const { props } = usePage<{ name: string; flash: { receipt?: Receipt } }>();

    /* ── State ── */
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [catalogTab, setCatalogTab] = useState<'all' | 'service' | 'product'>('all');
    const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
    const [showCustom, setShowCustom] = useState(false);

    // Payment
    const [clientId, setClientId]           = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cashReceived, setCashReceived]   = useState('');
    const [discountGlobal, setDiscountGlobal] = useState('');
    const [categoryId, setCategoryId]       = useState('');
    const [saleNotes, setSaleNotes]         = useState('');
    const [saleDate, setSaleDate]           = useState(TODAY);
    const [processing, setProcessing]       = useState(false);
    const [receipt, setReceipt]             = useState<Receipt | null>(null);
    const [expandedKey, setExpandedKey]     = useState<string | null>(null);

    useEffect(() => {
        const r = props.flash?.receipt;
        if (r) setReceipt(r);
    }, [props.flash?.receipt]);

    /* ── Cart ── */
    function addToCart(type: 'service' | 'product', item: ServiceOption | ProductOption) {
        const existing = cart.find((c) => !c.custom && c.type === type && c.id === item.id);
        if (existing) {
            setCart((p) => p.map((c) => c._key === existing._key ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            const newItem: CartItem = {
                _key: Math.random().toString(36).slice(2),
                type, id: item.id, name: item.name,
                unit_price: item.price, quantity: 1, discount: 0, note: '',
            };
            setCart((p) => [...p, newItem]);
        }
        setMobileTab('cart');
    }

    function addCustom(item: CartItem) {
        setCart((p) => [...p, item]);
        setMobileTab('cart');
    }

    function updateItem(key: string, field: keyof CartItem, value: string | number) {
        setCart((p) => p.map((c) => c._key === key ? { ...c, [field]: value } : c));
    }

    function removeItem(key: string) {
        setCart((p) => p.filter((c) => c._key !== key));
        if (expandedKey === key) setExpandedKey(null);
    }

    function clearCart() {
        setCart([]); setClientId(''); setPaymentMethod('cash');
        setCashReceived(''); setDiscountGlobal(''); setCategoryId('');
        setSaleNotes(''); setSaleDate(TODAY); setExpandedKey(null);
    }

    /* ── Totals ── */
    const subtotal      = useMemo(() => cart.reduce((s, i) => s + itemFinal(i), 0), [cart]);
    const globalDiscAmt = useMemo(() => subtotal * (parseFloat(discountGlobal) || 0) / 100, [subtotal, discountGlobal]);
    const total         = useMemo(() => subtotal - globalDiscAmt, [subtotal, globalDiscAmt]);
    const change        = useMemo(() => {
        const rec = parseFloat(cashReceived) || 0;
        return paymentMethod === 'cash' && rec > 0 ? Math.max(0, rec - total) : null;
    }, [cashReceived, paymentMethod, total]);

    /* ── Catalog filter ── */
    const filteredItems = useMemo(() => {
        const q = search.toLowerCase();
        const svcs = catalogTab !== 'product'
            ? services.filter((s) => s.name.toLowerCase().includes(q)).map((s) => ({ type: 'service' as const, item: s }))
            : [];
        const prods = catalogTab !== 'service'
            ? products.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ type: 'product' as const, item: p }))
            : [];
        return [...svcs, ...prods];
    }, [search, catalogTab, services, products]);

    /* ── Submit ── */
    const handleSale = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!cart.length) return;
        setProcessing(true);
        router.post(route('pos.sale'), {
            items: cart.map((i) => ({ type: i.type, id: i.id ?? null, name: i.name, unit_price: i.unit_price, quantity: i.quantity, discount: i.discount, note: i.note || null })),
            client_id: clientId || null,
            payment_method: paymentMethod,
            cash_received: paymentMethod === 'cash' && cashReceived ? parseFloat(cashReceived) : null,
            discount_global: parseFloat(discountGlobal) || 0,
            transaction_category_id: categoryId || null,
            notes: saleNotes || null,
            date: saleDate,
        }, {
            preserveScroll: true,
            onSuccess: () => { clearCart(); setProcessing(false); },
            onError:   () => setProcessing(false),
            onFinish:  () => setProcessing(false),
        });
    }, [cart, clientId, paymentMethod, cashReceived, discountGlobal, categoryId, saleNotes, saleDate]);

    const sellBtnColor = paymentMethod === 'credit'
        ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
        : 'bg-green-600 hover:bg-green-700 shadow-green-600/30';

    /* ─────────────────────────────────────── RENDER ─── */
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS — Punto de Venta" />

            {/* Mobile tab bar */}
            <div className="sticky top-0 z-10 flex border-b bg-card md:hidden shrink-0">
                {(['catalog', 'cart'] as const).map((tab) => (
                    <button key={tab} onClick={() => setMobileTab(tab)}
                        className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                            mobileTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                        }`}>
                        {tab === 'catalog'
                            ? <><Package className="h-4 w-4" /> Catálogo</>
                            : <><ShoppingCart className="h-4 w-4" /> Carrito {cart.length > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-white">{cart.length}</span>}</>}
                    </button>
                ))}
            </div>

            {/* Two-panel layout — fills available space */}
            <div className="flex flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 9.5rem)' }}>

                {/* ══ LEFT — Catalog ══════════════════════════════ */}
                <div className={`flex flex-col min-h-0 overflow-hidden flex-1 ${mobileTab !== 'catalog' ? 'hidden md:flex' : 'flex'}`}>

                    {/* Search bar */}
                    <div className="shrink-0 space-y-2 border-b bg-background p-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar..." className="pl-9" />
                            </div>
                            <Button type="button" variant="outline" onClick={() => setShowCustom(true)}
                                className="shrink-0 gap-1.5 border-dashed text-sm">
                                <Pencil className="h-4 w-4" />
                                <span className="hidden sm:inline">Personalizado</span>
                                <span className="sm:hidden">+</span>
                            </Button>
                        </div>
                        <div className="flex gap-1">
                            {([{ key: 'all', label: 'Todo' }, { key: 'service', label: 'Servicios' }, { key: 'product', label: 'Productos' }] as const).map(({ key, label }) => (
                                <button key={key} type="button" onClick={() => setCatalogTab(key)}
                                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                                        catalogTab === key ? 'bg-primary text-white shadow' : 'bg-muted text-muted-foreground hover:text-foreground'
                                    }`}>{label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Catalog grid — scrollable */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                <Search className="mb-3 h-10 w-10 opacity-20" />
                                <p className="text-sm font-medium">Sin resultados</p>
                                <button onClick={() => setShowCustom(true)} className="mt-3 text-xs underline text-primary">Agregar ítem personalizado</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                                {filteredItems.map(({ type, item }) => {
                                    const inCart = cart.find((c) => !c.custom && c.type === type && c.id === item.id);
                                    const outOfStock = 'stock' in item && item.stock <= 0;
                                    return (
                                        <button key={`${type}-${item.id}`} type="button"
                                            onClick={() => !outOfStock && addToCart(type, item)}
                                            disabled={outOfStock}
                                            className={`group relative flex flex-col rounded-xl border bg-card p-3 text-left transition-all active:scale-[0.97]
                                                ${outOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md hover:border-primary/50 cursor-pointer'}
                                                ${'stock' in item && item.stock > 0 && item.stock <= 3 ? 'border-orange-300' : ''}`}>
                                            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${type === 'service' ? 'bg-violet-100' : 'bg-amber-100'}`}>
                                                {type === 'service' ? <Scissors className="h-4 w-4 text-violet-600" /> : <Package className="h-4 w-4 text-amber-600" />}
                                            </div>
                                            <p className="flex-1 text-sm font-semibold leading-tight">{item.name}</p>
                                            <div className="mt-2 flex items-end justify-between">
                                                <span className="text-sm font-bold text-primary">${fmt(item.price)}</span>
                                                {'stock' in item && (
                                                    <span className={`text-xs ${item.stock <= 3 ? 'font-semibold text-orange-600' : 'text-muted-foreground'}`}>
                                                        {item.stock <= 0 ? 'Sin stock' : `×${item.stock}`}
                                                    </span>
                                                )}
                                            </div>
                                            {inCart && (
                                                <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                                                    {inCart.quantity}
                                                </div>
                                            )}
                                            {!outOfStock && (
                                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <div className="rounded-full bg-primary p-1.5"><Plus className="h-4 w-4 text-white" /></div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ RIGHT — Cart + Payment ═══════════════════════ */}
                <div className={`flex flex-col min-h-0 overflow-hidden border-l bg-card
                    w-full md:w-[380px] lg:w-[420px] shrink-0
                    ${mobileTab !== 'cart' ? 'hidden md:flex' : 'flex'}`}>

                    {/* Cart header */}
                    <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            <span className="font-bold">Carrito</span>
                            {cart.length > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{cart.length}</span>}
                        </div>
                        {cart.length > 0 && (
                            <button type="button" onClick={clearCart} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" /> Vaciar
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSale} className="flex flex-1 flex-col min-h-0 overflow-hidden">

                        {/* Cart items — scrollable */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                    <ShoppingCart className="mb-3 h-12 w-12 opacity-15" />
                                    <p className="text-sm font-medium">Carrito vacío</p>
                                    <p className="text-xs mt-1">Toca un ítem del catálogo para agregarlo</p>
                                </div>
                            ) : cart.map((item) => {
                                const isExpanded = expandedKey === item._key;
                                const subtotalItem = itemFinal(item);
                                return (
                                    <div key={item._key} className={`rounded-xl border p-3 space-y-2 transition-all ${
                                        item.type === 'service' ? 'bg-violet-50 border-violet-100' : 'bg-amber-50 border-amber-100'
                                    } ${item.custom ? 'border-dashed' : ''}`}>
                                        {/* Row: icon + name + qty + subtotal + remove */}
                                        <div className="flex items-center gap-2">
                                            <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${item.type === 'service' ? 'bg-violet-200' : 'bg-amber-200'}`}>
                                                {item.type === 'service' ? <Scissors className="h-3.5 w-3.5 text-violet-700" /> : <Package className="h-3.5 w-3.5 text-amber-700" />}
                                            </div>
                                            <p className="flex-1 text-sm font-semibold leading-tight truncate">{item.name}</p>
                                            {/* Qty inline */}
                                            <div className="flex items-center rounded-md border bg-white overflow-hidden shrink-0">
                                                <button type="button" onClick={() => item.quantity > 1 ? updateItem(item._key, 'quantity', item.quantity - 1) : removeItem(item._key)}
                                                    className="flex h-7 w-7 items-center justify-center hover:bg-muted transition-colors">
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                                                <button type="button" onClick={() => updateItem(item._key, 'quantity', item.quantity + 1)}
                                                    className="flex h-7 w-7 items-center justify-center hover:bg-muted transition-colors">
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <span className="shrink-0 w-20 text-right text-sm font-bold tabular-nums">${fmt(subtotalItem)}</span>
                                            <button type="button" onClick={() => removeItem(item._key)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-red-600 transition-colors">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Expand for price / discount / note */}
                                        <button type="button" onClick={() => setExpandedKey(isExpanded ? null : item._key)}
                                            className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            {isExpanded ? 'Ocultar opciones' : `$${fmt(item.unit_price)} × ${item.quantity}${item.discount > 0 ? ` − ${item.discount}%` : ''}`}
                                        </button>

                                        {isExpanded && (
                                            <div className="space-y-2 pt-1">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <p className="mb-1 text-xs text-muted-foreground">Precio unit.</p>
                                                        <input type="number" min="0" step="0.01" value={item.unit_price}
                                                            onChange={(e) => updateItem(item._key, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            className="w-full rounded-md border bg-white px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-xs text-muted-foreground">Desc. %</p>
                                                        <div className="relative">
                                                            <input type="number" min="0" max="100" step="1" value={item.discount || ''}
                                                                onChange={(e) => updateItem(item._key, 'discount', Math.min(100, parseFloat(e.target.value) || 0))}
                                                                placeholder="0"
                                                                className="w-full rounded-md border bg-white py-1.5 pl-2 pr-5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                                                            <Percent className="pointer-events-none absolute right-1.5 top-2 h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-xs text-muted-foreground">Subtotal</p>
                                                        <div className={`flex h-[34px] items-center rounded-md border px-2 text-sm font-bold tabular-nums ${item.discount > 0 ? 'bg-green-50 text-green-700' : 'bg-white'}`}>
                                                            ${fmt(subtotalItem)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <input value={item.note} onChange={(e) => updateItem(item._key, 'note', e.target.value)}
                                                    placeholder="Nota: regalo, promoción, descuento especial..."
                                                    className="w-full rounded-md border bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Payment panel — fixed at bottom, scrollable internally */}
                        <div className="shrink-0 border-t bg-card">
                            <div className="max-h-[55vh] overflow-y-auto p-3 space-y-3">

                                {/* Client */}
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <Select value={clientId || '_none'} onValueChange={(v) => setClientId(v === '_none' ? '' : v)}>
                                        <SelectTrigger className="h-8 flex-1 text-sm"><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">Sin cliente</SelectItem>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}{c.phone ? ` · ${c.phone}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Global discount + totals */}
                                <div className="rounded-xl bg-muted/40 p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Percent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-xs text-muted-foreground shrink-0">Desc. global</span>
                                        <input type="number" min="0" max="100" step="0.5" value={discountGlobal}
                                            onChange={(e) => setDiscountGlobal(e.target.value)} placeholder="0"
                                            className="w-16 rounded-md border bg-white px-2 py-1 text-sm text-center outline-none focus:ring-1 focus:ring-primary" />
                                        <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                    {globalDiscAmt > 0 && (
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Subtotal</span><span className="tabular-nums">${fmt(subtotal)}</span>
                                        </div>
                                    )}
                                    {globalDiscAmt > 0 && (
                                        <div className="flex justify-between text-sm text-green-700">
                                            <span>Descuento</span><span className="tabular-nums">−${fmt(globalDiscAmt)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-bold border-t pt-2">
                                        <span>Total</span>
                                        <span className="text-primary tabular-nums">${fmt(total)}</span>
                                    </div>
                                </div>

                                {/* Payment method */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    {(Object.entries(PM_CONFIG) as [PaymentMethod, typeof PM_CONFIG[PaymentMethod]][]).map(([key, cfg]) => (
                                        <button key={key} type="button" onClick={() => setPaymentMethod(key)}
                                            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                                                paymentMethod === key ? cfg.active + ' shadow' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                            }`}>
                                            {cfg.icon} {cfg.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Cash change calculator */}
                                {paymentMethod === 'cash' && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Efectivo recibido</Label>
                                        <Input type="number" min="0" step="100" value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            placeholder={`Mínimo $${fmt(total)}`} className="h-9" />
                                        {change !== null && change >= 0 && (
                                            <div className="mt-1.5 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 ring-1 ring-green-200">
                                                <span className="text-sm font-semibold text-green-800">Cambio</span>
                                                <span className="text-xl font-bold tabular-nums text-green-700">${fmt(change)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentMethod === 'credit' && (
                                    <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700 ring-1 ring-orange-200">
                                        🤝 Quedará como <strong>fiado</strong>. Registra abonos desde Finanzas.
                                    </div>
                                )}

                                {/* Extra options */}
                                <details className="group">
                                    <summary className="flex cursor-pointer select-none list-none items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                                        Categoría · Notas · Fecha
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                        <Select value={categoryId || '_none'} onValueChange={(v) => setCategoryId(v === '_none' ? '' : v)}>
                                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="_none">Sin categoría</SelectItem>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="h-8 text-sm" />
                                        <textarea value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} rows={2}
                                            placeholder="Notas de la venta..."
                                            className="w-full rounded-md border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none" />
                                    </div>
                                </details>
                            </div>

                            {/* Sell button — always visible */}
                            <div className="p-3 pt-0">
                                <Button type="submit" disabled={!cart.length || processing}
                                    className={`w-full py-5 text-base font-bold shadow-lg ${sellBtnColor} disabled:opacity-50`}>
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Procesando...
                                        </span>
                                    ) : cart.length === 0 ? (
                                        'Agrega ítems al carrito'
                                    ) : paymentMethod === 'credit' ? (
                                        <><Handshake className="h-5 w-5" /> Registrar fiado · ${fmt(total)}</>
                                    ) : (
                                        <><Banknote className="h-5 w-5" /> Cobrar ${fmt(total)}</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Dialogs */}
            {showCustom && <CustomItemDialog onAdd={addCustom} onClose={() => setShowCustom(false)} />}
            {receipt && <ReceiptModal receipt={receipt} businessName={props.name ?? 'Mi Negocio'} onClose={() => setReceipt(null)} />}
        </AppLayout>
    );
}
