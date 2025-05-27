
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FilterX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Block } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface DatabaseBlockProps {
  block: Block;
  addDatabaseColumn: (blockId: string) => void;
  addDatabaseRow: (blockId: string) => void;
  updateDatabaseCell: (blockId: string, rowId: string, columnId: string, value: any) => void;
}

export default function DatabaseBlock({ 
  block, 
  addDatabaseColumn, 
  addDatabaseRow, 
  updateDatabaseCell 
}: DatabaseBlockProps) {
  const isMobile = useIsMobile();
  
  if (!block.database) return null;
  
  return (
    <div className={`mb-4 ${block.type === "databaseFullPage" ? 'w-full' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
        <div className="font-medium text-lg">데이터베이스</div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => addDatabaseRow(block.id)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-1" /> 행
          </Button>
          <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => addDatabaseColumn(block.id)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-1" /> 컬럼
          </Button>
          <Button variant="ghost" size={isMobile ? "sm" : "default"} className="flex-none">
            <FilterX className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                {block.database.columns.map((column) => (
                  <TableHead key={column.id} className="font-medium py-2">
                    <Input 
                      value={column.name} 
                      className="border-0 focus-visible:ring-0 p-1 font-medium bg-transparent" 
                      onChange={(e) => {
                        updateDatabaseCell(block.id, "column-name-change", column.id, e.target.value);
                      }}
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.database.rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/80">
                  {block.database!.columns.map((column) => (
                    <TableCell key={`${row.id}-${column.id}`} className="p-0">
                      <Input 
                        value={row.cells[column.id] || ''} 
                        placeholder={isMobile ? "..." : "내용 입력"}
                        className="border-0 focus-visible:ring-0 p-2 w-full focus:bg-primary/5 transition-colors"
                        onChange={(e) => updateDatabaseCell(block.id, row.id, column.id, e.target.value)} 
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
