import { Menu, Search, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { LogoMark } from "@/components/brand/Logo";
import type { Session } from "@/features/auth/types";
import { useSession } from "@/features/auth/useSession";
import { findNavItem } from "../navigation";
import { ApiStatus } from "./ApiStatus";
import { Clock } from "./Clock";
import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";

// Sidebar collapsed or not, remembered per browser (same as the Family Photos admin).
const RAIL_KEY = "m365-nav";
const railListeners = new Set<() => void>();
const readRail = () => localStorage.getItem(RAIL_KEY) === "rail";
function setRail(rail: boolean) {
    localStorage.setItem(RAIL_KEY, rail ? "rail" : "full");
    railListeners.forEach((l) => l());
}
function useRail() {
    return useSyncExternalStore((cb) => {
        railListeners.add(cb);
        return () => railListeners.delete(cb);
    }, readRail);
}

/** Phones and small tablets: the sidebar slides in as a drawer. */
function Drawer({
    open,
    onClose,
    session,
}: {
    open: boolean;
    onClose: () => void;
    session: Session;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const reduce = useReducedMotion();
    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        if (open && !d.open) d.showModal();
        else if (!open && d.open) d.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-label="Menu"
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
            className="m-0 h-dvh max-h-none w-[min(18rem,85vw)] max-w-none bg-transparent p-0 backdrop:bg-[oklch(0.2_0.04_262/0.55)]"
        >
            {open && (
                <motion.div
                    initial={reduce ? false : { x: "-100%" }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="vinyl relative h-full text-on-cover"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="absolute top-5 right-2 z-10 inline-flex size-10 items-center justify-center rounded-full text-on-cover/80 hover:bg-[oklch(1_0_0/0.08)]"
                    >
                        <X className="size-5" aria-hidden />
                    </button>
                    <Sidebar
                        session={session}
                        layoutId="nav-drawer"
                        onNavigate={onClose}
                    />
                </motion.div>
            )}
        </dialog>
    );
}

export function AppShell() {
    const { data: session, isPending, isError } = useSession();
    const location = useLocation();
    const rail = useRail();
    const [menu, setMenu] = useState(false);
    const [palette, setPalette] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const key = e.key.toLowerCase();
            if (key === "k") {
                e.preventDefault();
                setPalette(true);
            } else if (
                key === "b" &&
                !(e.target as HTMLElement)?.closest?.(
                    "input, textarea, [contenteditable]",
                )
            ) {
                e.preventDefault();
                setRail(!readRail());
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    if (isPending) return <ShellLoading />;
    if (isError || !session)
        return (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
        );

    const current = findNavItem(location.pathname);

    return (
        <div
            className={`min-h-dvh lg:grid lg:transition-[grid-template-columns] lg:duration-300 lg:ease-[var(--ease-out-expo)] ${
                rail
                    ? "lg:grid-cols-[76px_minmax(0,1fr)]"
                    : "lg:grid-cols-[272px_minmax(0,1fr)]"
            }`}
        >
            <aside className="vinyl sticky top-0 z-40 hidden h-dvh text-on-cover lg:block">
                <Sidebar
                    session={session}
                    layoutId="nav"
                    rail={rail}
                    onToggleRail={() => setRail(!rail)}
                />
            </aside>

            <div className="flex min-w-0 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-3 backdrop-blur-md sm:px-8">
                    <button
                        type="button"
                        onClick={() => setMenu(true)}
                        aria-label="Open menu"
                        aria-expanded={menu}
                        className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 lg:hidden"
                    >
                        <Menu className="size-5" aria-hidden />
                    </button>
                    <LogoMark className="size-8 lg:hidden" />

                    <div className="min-w-0 flex-1">
                        {current && (
                            <p className="hidden text-xs font-semibold tracking-wide text-ink-3 uppercase sm:block">
                                {current.group.label}
                            </p>
                        )}
                        <h1 className="truncate text-xl font-semibold">
                            {current?.label ?? "Not found"}
                        </h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <ApiStatus className="hidden md:inline-flex" />
                        <Clock className="hidden xl:inline-flex" />
                        <button
                            type="button"
                            onClick={() => setPalette(true)}
                            aria-label="Search tools (Ctrl K)"
                            className="inline-flex size-10 items-center justify-center gap-2 rounded-full border border-line bg-paper text-sm text-ink-3 transition-colors hover:border-ink-3 hover:text-ink sm:h-10 sm:w-52 sm:justify-start sm:px-3.5 lg:w-60"
                        >
                            <Search className="size-4" aria-hidden />
                            <span className="hidden sm:inline">
                                Search tools…
                            </span>
                            <kbd className="ml-auto hidden rounded-md border border-line px-1.5 text-[11px] font-medium text-ink-3 sm:inline">
                                Ctrl K
                            </kbd>
                        </button>
                    </div>
                </header>

                <Drawer
                    open={menu}
                    onClose={() => setMenu(false)}
                    session={session}
                />

                <main className="mx-auto w-full min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                    <Outlet />
                </main>
            </div>

            <CommandPalette open={palette} onClose={() => setPalette(false)} />
        </div>
    );
}

function ShellLoading() {
    return (
        <div className="vinyl grid min-h-dvh place-items-center text-on-cover">
            <div role="status" className="flex flex-col items-center gap-4">
                <LogoMark className="size-12 animate-spin [animation-duration:3s]" />
                <span className="text-sm text-on-cover/70">
                    Opening session…
                </span>
            </div>
        </div>
    );
}
