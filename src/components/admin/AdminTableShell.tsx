import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Col<T> = { key: string; header: string; render: (row: T) => React.ReactNode };

type Props<T> = {
  title?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
  empty?: string;
  rows: T[];
  columns: Col<T>[];
  onRowClick?: (row: T) => void;
};

export function AdminTableShell<T extends { id?: string } | Record<string, unknown>>({
  search,
  onSearchChange,
  searchPlaceholder = "Поиск…",
  loading,
  empty = "Нет данных",
  rows,
  columns,
  onRowClick,
}: Props<T>) {
  return (
    <div className="space-y-4">
      {onSearchChange && (
        <Input
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-sm"
        />
      )}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                    {empty}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow
                    key={String((row as { id?: string }).id ?? i)}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key}>{c.render(row)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
