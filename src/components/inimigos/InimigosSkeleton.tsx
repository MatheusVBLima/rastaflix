import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
