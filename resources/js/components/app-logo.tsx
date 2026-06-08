import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-base font-bold leading-none tracking-tight text-foreground">
                    Bellilusion
                </span>
            </div>
        </>
    );
}
