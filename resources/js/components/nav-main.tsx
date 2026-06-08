import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Menu } from '@/types/menu';
import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    LayoutGrid,
    LucideIcon,
    Menu as MenuIcon,
    Shield,
    Users,
    UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
// import type { MenuSidebarItem } from '@/components/app-sidebar';

const icons: Record<string, LucideIcon> = {
    dashboard: LayoutGrid,
    admin: Shield,
    menus: MenuIcon,
    users: Users,
    equipos: UserRound,
};

interface NavMainProps {
    items: Menu[];
    userPermissions: string[];
}

type OpenMenus = Record<number, boolean>;

function normalizeUrl(url: string) {
    return url.replace(/\/+$/, '') || '/';
}

function isItemActive(item: Menu, currentUrl: string): boolean {
    const current = normalizeUrl(currentUrl);

    if (item.href) {
        const href = normalizeUrl(item.href);

        if (current === href) {
            return true;
        }

        if (href !== '/' && current.startsWith(`${href}/`)) {
            return true;
        }
    }

    return (item.children ?? []).some((child: Menu) => isItemActive(child, currentUrl));
}

function findOpenMenusByUrl(items: Menu[], currentUrl: string): OpenMenus {
    const openMenus: OpenMenus = {};

    const check = (menuItems: Menu[]): boolean => {
        for (const item of menuItems) {
            const childIsActive = check(item.children ?? []);

            if (childIsActive) {
                openMenus[item.id] = true;
                return true;
            }

            if (item.href && isItemActive(item, currentUrl)) {
                openMenus[item.id] = true;
                return true;
            }
        }

        return false;
    };

    check(items);

    return openMenus;
}

function canSeeMenu(item: Menu, userPermissions: string[]): boolean {
    if (item.permission && !userPermissions.includes(item.permission)) {
        return false;
    }

    if (!item.permissions || item.permissions.length === 0) {
        return true;
    }

    return item.permissions.some((permission: { name: string }) =>
        userPermissions.includes(permission.name)
    );
}

function filterMenuByPermissions(
    items: Menu[],
    userPermissions: string[]
): Menu[] {
    return items
        .filter((item) => canSeeMenu(item, userPermissions))
        .map((item) => ({
            ...item,
            children: filterMenuByPermissions(item.children ?? [], userPermissions),
        }))
        .filter((item) => {
            const hasHref = Boolean(item.href);
            const hasChildren = Boolean(item.children && item.children.length > 0);

            return hasHref || hasChildren;
        });
}

export function NavMain({ items = [], userPermissions = [] }: NavMainProps) {
    const page = usePage();
    const [openMenus, setOpenMenus] = useState<OpenMenus>({});

    const filteredItems = useMemo(() => {
        return filterMenuByPermissions(items, userPermissions);
    }, [items, userPermissions]);

    useEffect(() => {
        setOpenMenus(findOpenMenusByUrl(filteredItems, page.url));
    }, [page.url, filteredItems]);

    const toggleMenu = (id: number) => {
        setOpenMenus((current) => ({
            ...current,
            [id]: !current[id],
        }));
    };

    const renderItems = (menuItems: Menu[], level = 0) => {
        return menuItems.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isActive = isItemActive(item, page.url);
            const isOpen = openMenus[item.id] ?? false;
            const Icon = item.icon ? icons[item.icon] : undefined;

            const paddingLeft = `${level * 16 + 8}px`;

            if (hasChildren) {
                return (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                            type="button"
                            isActive={isActive}
                            onClick={() => toggleMenu(item.id)}
                            style={{ paddingLeft }}
                        >
                            {Icon && <Icon />}
                            <span>{item.label}</span>

                            {isOpen ? (
                                <ChevronDown className="ml-auto h-4 w-4" />
                            ) : (
                                <ChevronRight className="ml-auto h-4 w-4" />
                            )}
                        </SidebarMenuButton>

                        {isOpen && (
                            <div className="mt-1 space-y-1">
                                {renderItems(item.children ?? [], level + 1)}
                            </div>
                        )}
                    </SidebarMenuItem>
                );
            }

            if (!item.href) {
                return null;
            }

            return (
                <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        style={{ paddingLeft }}
                    >
                        <Link href={item.href} prefetch>
                            {Icon && <Icon />}
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            );
        });
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu>
                {renderItems(filteredItems)}
            </SidebarMenu>
        </SidebarGroup>
    );
}
