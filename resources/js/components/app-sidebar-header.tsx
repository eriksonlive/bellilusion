import { Breadcrumbs } from '@/components/breadcrumbs';
import NotificationBell from '@/components/notification-bell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Search } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-3 bg-card px-4 shadow-[0_1px_4px_0_rgba(32,40,45,0.08)] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            {/* Left: toggle + breadcrumbs */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <div className="hidden sm:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Center: search */}
            <div className="mx-auto hidden w-full max-w-sm md:flex">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Buscar..."
                        className="h-9 w-full rounded-[var(--radius)] border border-input bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Right: notifications */}
            <div className="ml-auto flex items-center">
                <NotificationBell />
            </div>
        </header>
    );
}
