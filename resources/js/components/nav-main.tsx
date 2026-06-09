import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Menu } from '@/types/menu';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface NavMainProps {
    items: Menu[];
    userPermissions: string[];
    userRoles?: string[];
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

function canSeeMenu(item: Menu, userPermissions: string[], userRoles: string[]): boolean {
    // Chequea el campo `permission` contra permisos Spatie Y contra nombres de roles
    if (item.permission) {
        const roles = userRoles ?? [];
        const hasPermission = userPermissions.includes(item.permission);
        const hasRole = roles.some(
            (r) => r.toLowerCase() === item.permission!.toLowerCase(),
        );
        if (!hasPermission && !hasRole) return false;
    }

    // Chequea la relación many-to-many `permissions`
    if (!item.permissions || item.permissions.length === 0) {
        return true;
    }

    return item.permissions.some((permission: { name: string }) =>
        userPermissions.includes(permission.name),
    );
}

function filterMenuByPermissions(
    items: Menu[],
    userPermissions: string[],
    userRoles: string[],
): Menu[] {
    return items
        .filter((item) => canSeeMenu(item, userPermissions, userRoles ?? []))
        .map((item) => ({
            ...item,
            children: filterMenuByPermissions(item.children ?? [], userPermissions, userRoles ?? []),
        }))
        .filter((item) => {
            const hasHref = Boolean(item.href);
            const hasChildren = Boolean(item.children && item.children.length > 0);

            return hasHref || hasChildren;
        });
}

export function NavMain({ items = [], userPermissions = [], userRoles = [] }: NavMainProps) {
    const page = usePage();
    const [openMenus, setOpenMenus] = useState<OpenMenus>({});

    const filteredItems = useMemo(() => {
        return filterMenuByPermissions(items, userPermissions, userRoles);
    }, [items, userPermissions, userRoles]);

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
                            <DynamicIcon value={item.icon} className="h-4 w-4 shrink-0" />
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
                            <DynamicIcon value={item.icon} className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            );
        });
    };

    return (
        <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarMenu>
                {renderItems(filteredItems)}
            </SidebarMenu>
        </SidebarGroup>
    );
}
