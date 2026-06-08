import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { KeyRound, Palette, UserCircle } from 'lucide-react';

const sidebarNavItems: (NavItem & { icon: React.ReactNode })[] = [
    { title: 'Perfil', url: '/settings/profile', icon: <UserCircle className="h-4 w-4" /> },
    { title: 'Contraseña', url: '/settings/password', icon: <KeyRound className="h-4 w-4" /> },
    { title: 'Apariencia', url: '/settings/appearance', icon: <Palette className="h-4 w-4" /> },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const currentPath = window.location.pathname;
    const { auth } = usePage<any>().props;
    const user = auth?.user;

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '??';

    return (
        <div className="px-4 py-6 space-y-6">
            {/* Header card with avatar */}
            <div className="card-berry rounded-xl bg-white p-6">
                <div className="flex items-center gap-5">
                    {/* Avatar circle */}
                    <div className="relative h-20 w-20 shrink-0">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-md">
                            {initials}
                        </div>
                        <span className="absolute right-0.5 bottom-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">{user?.name ?? 'Usuario'}</h2>
                        <p className="text-sm text-gray-500">{user?.email ?? ''}</p>
                        {auth?.roles?.length > 0 && (
                            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                                {auth.roles[0]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content card */}
            <div className="card-berry rounded-xl bg-white overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    {/* Sidebar nav */}
                    <aside className="border-b lg:border-b-0 lg:border-r border-gray-100 lg:w-52 shrink-0">
                        <nav className="flex flex-row lg:flex-col p-3 gap-1">
                            {sidebarNavItems.map((item) => (
                                <Link
                                    key={item.url}
                                    href={item.url}
                                    prefetch
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        currentPath === item.url
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    )}
                                >
                                    <span className={cn(currentPath === item.url ? 'text-primary' : 'text-gray-400')}>
                                        {item.icon}
                                    </span>
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main content */}
                    <div className="flex-1 p-6 lg:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
