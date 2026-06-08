export interface Menu {
    id: number;
    label: string;
    href: string;
    icon: string | null;
    parent_id: number | null;
    parent: Menu | null;
    order: number | null;
    created_at: string | null;
    updated_at: string | null;
    permission: string | null;
    permissions?: Permission[];
    children?: Menu[];
}

export interface MenuSidebarItem {
    current_page: number;
    data: Menu[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface Route {
    name: string;
    uri: string;
    methods: string[];
}

export interface Permission {
    id: number;
    name: string;
}

export interface Props {
    menus?: MenuSidebarItem;
    permissions?: Permission[];
    routes?: Route[];
}

export interface SharedProps {
    [key: string]: unknown;
    auth: {
        user: unknown;
        permissions?: string[];
        menuSidebar?: Menu[];
    };
}
