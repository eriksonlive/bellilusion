import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, Key, Shield, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { SharedProps } from '@/types/menu';

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         url: 'https://github.com/laravel/react-starter-kit',
//         icon: Folder,
//     },
//     {
//         title: 'Documentation',
//         url: 'https://laravel.com/docs/starter-kits',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {

    const { props } = usePage<SharedProps>();

    const menuItems = props.auth.menuSidebar ?? [];
    const permissions = props.auth.permissions ?? [];
    const roles: string[] = (props.auth as any).roles ?? [];
    const isAdmin = roles.includes('admin');

    const adminLinks = [
        { title: 'Usuarios', href: route('admin.users.index'), icon: Users },
        { title: 'Roles', href: route('admin.roles.index'), icon: Shield },
        { title: 'Permisos', href: route('admin.permissions.index'), icon: Key },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={menuItems} userPermissions={permissions} userRoles={roles} />

                {isAdmin && (
                    <SidebarGroup className="px-3 py-2">
                        <SidebarGroupLabel>Administración</SidebarGroupLabel>
                        <SidebarMenu>
                            {adminLinks.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={typeof window !== 'undefined' && window.location.pathname.startsWith(new URL(item.href).pathname)} tooltip={item.title}>
                                        <Link href={item.href} prefetch>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                { /* <NavFooter items={footerNavItems} className="mt-auto" /> */ }
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
