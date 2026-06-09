export default function AppLogo() {
    return (
        <>
            <div className="flex size-9 shrink-0 items-center justify-center">
                <img
                    src="/images/logo.png"
                    alt="Bellilusión"
                    className="size-9 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-base font-bold leading-none tracking-tight text-foreground">
                    Bellilusión
                </span>
            </div>
        </>
    );
}
