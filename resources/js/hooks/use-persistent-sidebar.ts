import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

const SIDEBAR_STORAGE_KEY = 'bellilusion.sidebar.open';

export function usePersistentSidebar(defaultOpen = true): [boolean, Dispatch<SetStateAction<boolean>>] {
    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        const savedState = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

        if (savedState !== null) {
            setOpen(savedState === 'true');
        }
    }, []);

    const setPersistentOpen: Dispatch<SetStateAction<boolean>> = useCallback((value) => {
        setOpen((current) => {
            const nextValue = typeof value === 'function'
                ? value(current)
                : value;

            window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));

            return nextValue;
        });
    }, []);

    return [open, setPersistentOpen];
}
