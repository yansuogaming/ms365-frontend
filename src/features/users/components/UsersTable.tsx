import { ArrowDown, ArrowUp, ArrowUpDown, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatDate, formatDateTime, Tag } from "@/components/ui/admin";
import { formatBytes } from "@/lib/format";
import { Select, type SelectOption } from "@/components/ui/Select";
import type { SkuUsage, UserListQuery, UserRow, UserSort } from "../types";

interface UsersTableProps {
    rows: UserRow[];
    selected: Map<string, UserRow>;
    onToggle: (row: UserRow, checked: boolean) => void;
    onTogglePage: (checked: boolean) => void;
    sort: UserSort;
    onSort: (sort: UserSort) => void;
    /** A newer page is loading behind the rows on screen. */
    stale: boolean;
    /** Column filters, shared with the toolbar through the URL. */
    filters: Pick<UserListQuery, "status" | "license">;
    onFilter: (changes: Partial<Record<"status" | "license", string>>) => void;
    skus: SkuUsage[];
}

type SortKey = "displayName" | "createdAt" | "oneDrive";

export const statusOptions: SelectOption<UserListQuery["status"]>[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "blocked", label: "Blocked" },
];

/** Any / has / none, then one entry per plan. Shared by the column header and the toolbar. */
export function licenseOptions(skus: SkuUsage[]): SelectOption[] {
    return [
        { value: "", label: "Any" },
        { value: "has", label: "Has license" },
        { value: "none", label: "No license" },
        ...skus.map((s) => ({
            value: s.skuId,
            label: s.name,
            hint: `${s.consumed}/${s.enabled}`,
            group: "By license",
        })),
    ];
}

/** Phones have no column headers to click, so sorting is a menu there. */
const sortOptions: SelectOption<UserSort>[] = [
    { value: "createdAt:desc", label: "Newest first" },
    { value: "createdAt:asc", label: "Oldest first" },
    { value: "displayName:asc", label: "Name A–Z" },
    { value: "displayName:desc", label: "Name Z–A" },
    { value: "oneDrive:desc", label: "Most OneDrive used" },
    { value: "oneDrive:asc", label: "Least OneDrive used" },
];

function SortHeader({
    label,
    k,
    sort,
    onSort,
    align = "left",
    className = "",
}: {
    label: string;
    k: SortKey;
    sort: UserSort;
    onSort: (s: UserSort) => void;
    align?: "left" | "right";
    className?: string;
}) {
    const [key, dir] = sort.split(":") as [SortKey, "asc" | "desc"];
    const active = key === k;
    // first click: newest/largest first for dates and sizes, A→Z for names
    const next: UserSort = active
        ? (`${k}:${dir === "asc" ? "desc" : "asc"}` as UserSort)
        : k === "displayName"
          ? "displayName:asc"
          : (`${k}:desc` as UserSort);
    const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <th
            scope="col"
            aria-sort={
                active ? (dir === "asc" ? "ascending" : "descending") : "none"
            }
            className={`px-3 py-3 font-semibold ${align === "right" ? "text-right" : ""} ${className}`}
        >
            <button
                type="button"
                onClick={() => onSort(next)}
                className={`inline-flex items-center gap-1.5 uppercase transition-colors hover:text-ink ${active ? "text-ink" : ""}`}
            >
                {label}
                <Icon
                    className={`size-3.5 ${active ? "text-coral-ink" : "opacity-60"}`}
                    aria-hidden
                />
            </button>
        </th>
    );
}

function OneDriveCell({ oneDrive }: { oneDrive: UserRow["oneDrive"] }) {
    if (!oneDrive) return <span className="text-ink-3">Not provisioned</span>;
    const pct =
        oneDrive.quotaBytes > 0
            ? Math.min(100, (oneDrive.usedBytes / oneDrive.quotaBytes) * 100)
            : 0;
    return (
        <div className="ml-auto w-32">
            <p className="tabular text-right text-ink-2">
                {formatBytes(oneDrive.usedBytes)}{" "}
                <span className="text-ink-3">
                    / {formatBytes(oneDrive.quotaBytes)}
                </span>
            </p>
            <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-3"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
                aria-label="OneDrive storage used"
            >
                <span
                    className={`block h-full rounded-full ${pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warn" : "bg-ink-3/60"}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                />
            </div>
        </div>
    );
}

export function UsersTable({
    rows,
    selected,
    onToggle,
    onTogglePage,
    sort,
    onSort,
    stale,
    filters,
    onFilter,
    skus,
}: UsersTableProps) {
    const onPage = rows.filter((r) => selected.has(r.id)).length;
    const all = rows.length > 0 && onPage === rows.length;

    return (
        <div
            className={`transition-opacity ${stale ? "opacity-60" : ""}`}
            aria-busy={stale}
        >
            {/* phones: one card per user */}
            <div className="md:hidden">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                    <Checkbox
                        checked={all}
                        indeterminate={selected.size > 0 && !all}
                        onChange={() => onTogglePage(selected.size === 0)}
                        label={<span className="text-ink-2">{selected.size ? "Clear selection" : "Select page"}</span>}
                    />
                    <Select
                        label="Sort by"
                        value={sort}
                        onChange={onSort}
                        options={sortOptions}
                    />
                </div>
                <ul className="divide-y divide-line">
                    {rows.map((u) => {
                        const isSelected = selected.has(u.id);
                        return (
                            <li
                                key={u.id}
                                className={`flex gap-3 px-4 py-3.5 ${isSelected ? "bg-coral-wash/60" : ""}`}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onChange={(c) => onToggle(u, c)}
                                    aria-label={`Select ${u.displayName}`}
                                    className="pt-1"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="min-w-0 truncate font-semibold">
                                            {u.displayName}
                                        </p>
                                        {u.status === "active" ? (
                                            <Tag tone="ok">Active</Tag>
                                        ) : (
                                            <Tag tone="danger">Blocked</Tag>
                                        )}
                                    </div>
                                    <p className="truncate text-sm text-ink-2">
                                        {u.upn}
                                    </p>
                                    {u.roles.length > 0 && (
                                        <p className="mt-1 flex items-center gap-1 text-xs text-coral-ink">
                                            <ShieldCheck
                                                className="size-3.5 shrink-0"
                                                aria-hidden
                                            />
                                            <span className="truncate">
                                                {u.roles.join(", ")}
                                            </span>
                                        </p>
                                    )}
                                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
                                        <span>
                                            {u.licenses.length === 0
                                                ? "Unlicensed"
                                                : u.licenses.length === 1
                                                  ? u.licenses[0].name
                                                  : `${u.licenses.length} licenses`}
                                        </span>
                                        <time dateTime={u.createdAt}>
                                            {formatDateTime(u.createdAt)}
                                        </time>
                                        {u.oneDrive && (
                                            <span className="tabular">
                                                OneDrive{" "}
                                                {formatBytes(
                                                    u.oneDrive.usedBytes,
                                                )}{" "}
                                                /{" "}
                                                {formatBytes(
                                                    u.oneDrive.quotaBytes,
                                                )}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* tablet and up: the full table */}
            <div className="@container hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                    <thead>
                        <tr className="border-b border-line text-left text-xs tracking-wide text-ink-3">
                            <th scope="col" className="w-12 py-3 pl-6">
                                <Checkbox
                                    checked={all}
                                    indeterminate={selected.size > 0 && !all}
                                    onChange={() => onTogglePage(selected.size === 0)}
                                    aria-label={selected.size ? "Clear selection" : "Select all users on this page"}
                                />
                            </th>
                            <SortHeader
                                label="Name"
                                k="displayName"
                                sort={sort}
                                onSort={onSort}
                            />
                            <th
                                scope="col"
                                className="px-3 py-3 font-semibold uppercase"
                            >
                                UPN
                            </th>
                            <th scope="col" className="px-3 py-3">
                                <Select
                                    variant="header"
                                    label="Filter by status"
                                    display="Status"
                                    filtered={filters.status !== "all"}
                                    value={filters.status}
                                    onChange={(status) => onFilter({ status })}
                                    options={statusOptions}
                                />
                            </th>
                            <th scope="col" className="px-3 py-3">
                                <Select
                                    variant="header"
                                    label="Filter by license"
                                    display="Licenses"
                                    filtered={filters.license !== ""}
                                    value={filters.license}
                                    onChange={(license) =>
                                        onFilter({ license })
                                    }
                                    options={licenseOptions(skus)}
                                />
                            </th>
                            <SortHeader
                                label="Created"
                                k="createdAt"
                                sort={sort}
                                onSort={onSort}
                            />
                            {/* OneDrive needs room: shown only when the table's own container is wide enough */}
                            <SortHeader
                                label="OneDrive"
                                k="oneDrive"
                                sort={sort}
                                onSort={onSort}
                                align="right"
                                className="hidden @min-[1060px]:table-cell"
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((u) => {
                            const isSelected = selected.has(u.id);
                            return (
                                <tr
                                    key={u.id}
                                    className={`border-b border-line transition-colors last:border-b-0 ${isSelected ? "bg-coral-wash/60" : "hover:bg-paper-2"}`}
                                >
                                    <td className="py-3 pl-6">
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={(c) => onToggle(u, c)}
                                            aria-label={`Select ${u.displayName}`}
                                        />
                                    </td>
                                    <td className="max-w-[13rem] px-3 py-3">
                                        <span className="flex items-center gap-3">
                                            <span
                                                aria-hidden
                                                className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-3 font-display text-xs font-bold text-ink-2"
                                            >
                                                {u.displayName
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold">
                                                    {u.displayName}
                                                </span>
                                                {u.roles.length > 0 && (
                                                    <span
                                                        className="mt-0.5 flex items-center gap-1 text-xs text-coral-ink"
                                                        title={u.roles.join(
                                                            ", ",
                                                        )}
                                                    >
                                                        <ShieldCheck
                                                            className="size-3.5 shrink-0"
                                                            aria-hidden
                                                        />
                                                        <span className="truncate">
                                                            {u.roles.length ===
                                                            1
                                                                ? u.roles[0]
                                                                : `${u.roles.length} admin roles`}
                                                        </span>
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                    </td>
                                    <td
                                        className="max-w-[15rem] truncate px-3 py-3 text-ink-2"
                                        title={u.upn}
                                    >
                                        {u.upn}
                                    </td>
                                    <td className="px-3 py-3">
                                        {u.status === "active" ? (
                                            <Tag tone="ok">Active</Tag>
                                        ) : (
                                            <Tag tone="danger">Blocked</Tag>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        {u.licenses.length === 0 ? (
                                            <span className="inline-flex h-6 items-center py-2.5 text-xs text-ink-3">
                                                Unlicensed
                                            </span>
                                        ) : (
                                            <span
                                                className="flex flex-wrap items-center gap-1.5"
                                                title={u.licenses
                                                    .map((l) => l.name)
                                                    .join("\n")}
                                            >
                                                {u.licenses
                                                    .slice(0, 2)
                                                    .map((l) => (
                                                        <span
                                                            key={l.skuId}
                                                            className="inline-flex h-6 max-w-[11rem] items-center truncate rounded-full bg-paper-2 py-2.5 text-xs text-ink-2"
                                                        >
                                                            {l.name}
                                                        </span>
                                                    ))}
                                                {u.licenses.length > 2 && (
                                                    <span className="text-xs font-semibold text-ink-3">
                                                        +{u.licenses.length - 2}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className="tabular px-3 py-3 whitespace-nowrap text-ink-2">
                                        <time
                                            dateTime={u.createdAt}
                                            title={formatDateTime(u.createdAt)}
                                        >
                                            {formatDate(u.createdAt)}
                                        </time>
                                    </td>
                                    <td className="hidden py-3 pr-6 pl-3 text-right @min-[1060px]:table-cell">
                                        <OneDriveCell oneDrive={u.oneDrive} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
