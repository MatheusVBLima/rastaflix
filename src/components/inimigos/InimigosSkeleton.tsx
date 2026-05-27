import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Render a centered, bordered table skeleton used as a placeholder for an enemies list.
 *
 * The table includes a header with "Nome do Inimigo" and "Status da Vinganca" and five body rows
 * containing skeleton placeholders for the enemy name and vengeance status.
 *
 * @returns A JSX element containing the skeleton table with five placeholder rows.
 */
export function InimigosSkeleton() {
  return (
    <div className="border rounded-md p-4 max-w-2xl mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70%]">Nome do Inimigo</TableHead>
            <TableHead className="text-right">Status da Vinganca</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-3/4" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-20 inline-block" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
