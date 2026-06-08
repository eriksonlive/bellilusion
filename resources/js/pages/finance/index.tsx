import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, LayoutGrid, Pencil, Plus, Tag, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finanzas', href: '/finance' },
];

interface Category   { id: number; name: string; color: string; type: 'income'|'expense' }
interface Transaction {
    id: number; type: 'income'|'expense'; amount: string; description: string;
    date: string; notes?: string; category?: Category; transaction_category_id?: number;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number;
    next_page_url: string|null; prev_page_url: string|null;
}
interface Summary   { monthly_income: number; monthly_expense: number; monthly_balance: number }
interface Props      { transactions: Paginated<Transaction>; categories: Category[]; summary: Summary; filters: { type?: string; category_id?: string; month?: string; year?: string } }

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({length:5},(_,i)=>CURRENT_YEAR-i);

function fmt(n: number) { return n.toLocaleString('es-CO',{minimumFractionDigits:2}); }

export default function FinanceIndex({ transactions, categories, summary, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction|null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        type: 'income' as 'income'|'expense',
        amount:'', description:'',
        date: format(new Date(),'yyyy-MM-dd'),
        transaction_category_id:'', notes:'',
    });

    function openCreate(type: 'income'|'expense' = 'income') {
        reset(); setEditingTx(null); setData('type',type); setShowModal(true);
    }
    function openEdit(tx: Transaction) {
        setEditingTx(tx);
        setData({ type:tx.type, amount:tx.amount, description:tx.description, date:tx.date,
            transaction_category_id: tx.transaction_category_id?.toString()??'', notes:tx.notes??'' });
        setShowModal(true);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingTx) put(route('finance.update',editingTx.id),{onSuccess:()=>{setShowModal(false);reset();}});
        else post(route('finance.store'),{onSuccess:()=>{setShowModal(false);reset();}});
    }
    function handleDelete(tx: Transaction) {
        if (!confirm('¿Eliminar esta transacción?')) return;
        router.delete(route('finance.destroy',tx.id));
    }
    function applyFilter(key: string, value: string) {
        const real = value==='_all'?undefined:value||undefined;
        router.get(route('finance.index'),{...filters,[key]:real},{preserveState:true,replace:true});
    }
    const filteredCats = categories.filter((c)=>c.type===data.type);
    const balance = summary.monthly_balance;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finanzas"/>
            <div className="flex flex-col gap-5 p-5">

                {flash?.success && (
                    <div className="flex items-center gap-3 bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200" style={{borderRadius:'var(--radius)'}}>
                        <span className="h-2 w-2 rounded-full bg-green-500"/> {flash.success}
                    </div>
                )}

                {/* ── Page header ────────────────────────────── */}
                <div className="card-berry flex flex-wrap items-center justify-between gap-3 bg-card px-5 py-4" style={{borderRadius:'var(--radius-lg)'}}>
                    <div>
                        <h1 className="text-xl font-bold">Finanzas</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Resumen del mes de {format(new Date(),'MMMM yyyy',{locale:es})}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('finance.categories.index')}>
                            <Button variant="outline" size="sm"><Tag className="h-4 w-4"/> Categorías</Button>
                        </Link>
                        <Button onClick={()=>openCreate('income')} size="sm" className="bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/30">
                            <ArrowUpCircle className="h-4 w-4"/> Ingreso
                        </Button>
                        <Button onClick={()=>openCreate('expense')} size="sm" className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/30">
                            <ArrowDownCircle className="h-4 w-4"/> Egreso
                        </Button>
                    </div>
                </div>

                {/* ── Summary cards ──────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* Income */}
                    <div className="card-berry overflow-hidden bg-card" style={{borderRadius:'var(--radius-lg)'}}>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingresos del mes</p>
                                <p className="mt-2 text-2xl font-bold text-green-600">${fmt(summary.monthly_income)}</p>
                            </div>
                            <div className="rounded-2xl bg-green-100 p-3">
                                <ArrowUpCircle className="h-6 w-6 text-green-600"/>
                            </div>
                        </div>
                        <div className="h-1 bg-green-500/20"><div className="h-full bg-green-500" style={{width:'100%'}}/></div>
                    </div>

                    {/* Expense */}
                    <div className="card-berry overflow-hidden bg-card" style={{borderRadius:'var(--radius-lg)'}}>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Egresos del mes</p>
                                <p className="mt-2 text-2xl font-bold text-red-600">${fmt(summary.monthly_expense)}</p>
                            </div>
                            <div className="rounded-2xl bg-red-100 p-3">
                                <ArrowDownCircle className="h-6 w-6 text-red-600"/>
                            </div>
                        </div>
                        <div className="h-1 bg-red-500/20">
                            <div className="h-full bg-red-500" style={{width: summary.monthly_income > 0 ? `${Math.min(100,(summary.monthly_expense/summary.monthly_income)*100)}%` : '0%'}}/>
                        </div>
                    </div>

                    {/* Balance */}
                    <div className={`card-berry overflow-hidden bg-card`} style={{borderRadius:'var(--radius-lg)'}}>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance del mes</p>
                                <p className={`mt-2 text-2xl font-bold ${balance>=0?'text-blue-600':'text-orange-600'}`}>{balance>=0?'+':''}{fmt(balance)}</p>
                            </div>
                            <div className={`rounded-2xl p-3 ${balance>=0?'bg-blue-100':'bg-orange-100'}`}>
                                {balance>=0
                                    ? <TrendingUp className="h-6 w-6 text-blue-600"/>
                                    : <TrendingDown className="h-6 w-6 text-orange-600"/>
                                }
                            </div>
                        </div>
                        <div className={`h-1 ${balance>=0?'bg-blue-500/20':'bg-orange-500/20'}`}>
                            <div className={`h-full ${balance>=0?'bg-blue-500':'bg-orange-500'}`} style={{width:'100%'}}/>
                        </div>
                    </div>
                </div>

                {/* ── Transactions table card ─────────────────── */}
                <div className="card-berry overflow-hidden bg-card" style={{borderRadius:'var(--radius-lg)'}}>
                    {/* Toolbar with filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <h2 className="text-base font-bold">Movimientos</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Type filter */}
                            <Select value={filters.type??'_all'} onValueChange={(v)=>applyFilter('type',v)}>
                                <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Tipo"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos</SelectItem>
                                    <SelectItem value="income">Ingresos</SelectItem>
                                    <SelectItem value="expense">Egresos</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Category filter */}
                            <Select value={filters.category_id??'_all'} onValueChange={(v)=>applyFilter('category_id',v)}>
                                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Categoría"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todas</SelectItem>
                                    {categories.map((c)=>(
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            <span className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full" style={{background:c.color}}/>{c.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Month */}
                            <Select value={filters.month??'_all'} onValueChange={(v)=>applyFilter('month',v)}>
                                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Mes"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos los meses</SelectItem>
                                    {MONTHS.map((m,i)=><SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {/* Year */}
                            <Select value={filters.year??'_all'} onValueChange={(v)=>applyFilter('year',v)}>
                                <SelectTrigger className="h-8 w-24"><SelectValue placeholder="Año"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos</SelectItem>
                                    {YEARS.map((y)=><SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Empty */}
                    {transactions.data.length===0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <LayoutGrid className="mb-3 h-12 w-12 opacity-20"/>
                            <p className="font-medium">No hay transacciones</p>
                            <div className="mt-4 flex gap-2">
                                <Button onClick={()=>openCreate('income')} size="sm" className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4"/>Ingreso</Button>
                                <Button onClick={()=>openCreate('expense')} size="sm" className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4"/>Egreso</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                        <table className="berry-table w-full">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Fecha</th>
                                    <th>Categoría</th>
                                    <th className="text-right">Monto</th>
                                    <th/>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.data.map((tx)=>(
                                    <tr key={tx.id}>
                                        <td>
                                            <div className={`inline-flex items-center justify-center rounded-full p-2 ${tx.type==='income'?'bg-green-100':'bg-red-100'}`}>
                                                {tx.type==='income'
                                                    ? <ArrowUpCircle className="h-4 w-4 text-green-600"/>
                                                    : <ArrowDownCircle className="h-4 w-4 text-red-600"/>
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            <p className="font-semibold">{tx.description}</p>
                                            {tx.notes && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{tx.notes}</p>}
                                        </td>
                                        <td className="text-muted-foreground tabular-nums">
                                            <div>{format(parseISO(tx.date),'dd MMM',{locale:es})}</div>
                                            <div className="text-xs">{format(parseISO(tx.date),'yyyy')}</div>
                                        </td>
                                        <td>
                                            {tx.category ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                                    style={{backgroundColor:tx.category.color+'20', color:tx.category.color}}>
                                                    <span className="h-1.5 w-1.5 rounded-full" style={{background:tx.category.color}}/>
                                                    {tx.category.name}
                                                </span>
                                            ) : <span className="text-xs text-muted-foreground">—</span>}
                                        </td>
                                        <td className="text-right">
                                            <span className={`text-base font-bold tabular-nums ${tx.type==='income'?'text-green-600':'text-red-600'}`}>
                                                {tx.type==='income'?'+':'-'}${parseFloat(tx.amount).toLocaleString('es-CO',{minimumFractionDigits:2})}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={()=>openEdit(tx)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
                                                <button onClick={()=>handleDelete(tx)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {(transactions.next_page_url || transactions.current_page > 1) && (
                            <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                                <span className="text-muted-foreground">Página {transactions.current_page}</span>
                                <div className="flex gap-1">
                                    <Link href={transactions.prev_page_url??'#'} className={!transactions.prev_page_url?'pointer-events-none opacity-40':''}>
                                        <Button variant="outline" size="sm">Anterior</Button>
                                    </Link>
                                    <Link href={transactions.next_page_url??'#'} className={!transactions.next_page_url?'pointer-events-none opacity-40':''}>
                                        <Button variant="outline" size="sm">Siguiente</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editingTx?'Editar transacción':'Nueva transacción'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        {/* Type toggle */}
                        <div className="flex flex-col gap-1.5">
                            <Label>Tipo *</Label>
                            <div className="flex gap-1 p-1 bg-muted/30 border" style={{borderRadius:'var(--radius)'}}>
                                {(['income','expense'] as const).map((t)=>(
                                    <button key={t} type="button"
                                        onClick={()=>{ setData('type',t); setData('transaction_category_id',''); }}
                                        className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-semibold transition-all ${data.type===t?t==='income'?'bg-green-600 text-white rounded-[calc(var(--radius)-2px)] shadow':'bg-red-600 text-white rounded-[calc(var(--radius)-2px)] shadow':'text-muted-foreground hover:text-foreground'}`}>
                                        {t==='income'?<ArrowUpCircle className="h-4 w-4"/>:<ArrowDownCircle className="h-4 w-4"/>}
                                        {t==='income'?'Ingreso':'Egreso'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="description">Descripción *</Label>
                            <Input id="description" value={data.description} onChange={(e)=>setData('description',e.target.value)} placeholder="Ej: Pago de servicio de corte"/>
                            {errors.description && <p className="text-xs text-danger">{errors.description}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="amount">Monto *</Label>
                                <Input id="amount" type="number" step="0.01" min="0.01" value={data.amount} onChange={(e)=>setData('amount',e.target.value)} placeholder="0.00"/>
                                {errors.amount && <p className="text-xs text-danger">{errors.amount}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="date">Fecha *</Label>
                                <Input id="date" type="date" value={data.date} onChange={(e)=>setData('date',e.target.value)}/>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="category">Categoría</Label>
                            <Select value={data.transaction_category_id||'_none'} onValueChange={(v)=>setData('transaction_category_id',v==='_none'?'':v)}>
                                <SelectTrigger><SelectValue placeholder="Sin categoría"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin categoría</SelectItem>
                                    {filteredCats.map((c)=>(
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            <span className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full" style={{background:c.color}}/>{c.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="notes">Notas</Label>
                            <textarea id="notes" value={data.notes} onChange={(e)=>setData('notes',e.target.value)} rows={2}
                                style={{borderRadius:'var(--radius)'}}
                                className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Notas adicionales..."/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={()=>setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editingTx?'Guardar cambios':'Registrar'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
