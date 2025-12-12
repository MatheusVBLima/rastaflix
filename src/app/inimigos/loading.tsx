import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
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
    </div>
  );
}
