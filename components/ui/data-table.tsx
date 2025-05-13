import { JSX, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface DataTableProps {
  columns: {
    accessorKey?: string;
    header: string;
    cell?: ({ row }: any) => JSX.Element;
    id?: string;
  }[];
  data: any[];
  loading?: boolean;
  searchColumn?: string;
}

export function DataTable({
  columns,
  data,
  loading = false,
  searchColumn,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = searchColumn
    ? data.filter((item) => {
        const value = searchColumn.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : data;

  return (
    <div className="space-y-4">
      {searchColumn && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey || column.id}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey || column.id}>
                      {column.cell
                        ? column.cell({ row })
                        : column.accessorKey
                        ? column.accessorKey.split('.').reduce((obj, key) => obj?.[key], row)
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
