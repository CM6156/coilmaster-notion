import React, { useState } from "react";
import { Block } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableBlockProps {
  block: Block;
  updateTableCell: (blockId: string, rowIndex: number, colIndex: number, value: string) => void;
  getFormatStyle: (block: Block) => React.CSSProperties;
  // We need to add a fallback implementation for updateBlock
  updateBlock?: (blockId: string, data: Partial<Block>) => void;
}

export default function TableBlock({ block, updateTableCell, getFormatStyle, updateBlock }: TableBlockProps) {
  const isMobile = useIsMobile();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  
  const addRow = () => {
    const rows = block.rows || 3;
    const cols = block.cols || 3;
    const newCells = [...(block.cells || []), Array(cols).fill('')];
    
    if (updateBlock) {
      updateBlock(block.id, {
        type: block.type,
        content: block.content,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
        rows: rows + 1,
        cells: newCells
      });
    } else {
      // Fallback for when updateBlock is not provided
      console.warn("updateBlock function not provided to TableBlock");
      // Use updateTableCell as a fallback to add an empty row
      if (block.cells) {
        for (let i = 0; i < cols; i++) {
          updateTableCell(block.id, rows, i, '');
        }
      }
    }
  };
  
  const addColumn = () => {
    const rows = block.rows || 3;
    const cols = block.cols || 3;
    const newCells = (block.cells || []).map(row => [...row, '']);
    
    if (updateBlock) {
      updateBlock(block.id, {
        type: block.type,
        content: block.content,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
        cols: cols + 1,
        cells: newCells
      });
    } else {
      // Fallback for when updateBlock is not provided
      console.warn("updateBlock function not provided to TableBlock");
      // Use updateTableCell as a fallback to add an empty column
      if (block.cells) {
        for (let i = 0; i < rows; i++) {
          updateTableCell(block.id, i, cols, '');
        }
      }
    }
  };
  
  const removeRow = (rowIndex: number) => {
    const rows = block.rows || 3;
    if (rows <= 1) return;
    
    const newCells = (block.cells || []).filter((_, idx) => idx !== rowIndex);
    
    if (updateBlock) {
      updateBlock(block.id, {
        type: block.type,
        content: block.content,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
        rows: rows - 1,
        cells: newCells
      });
    }
  };
  
  const removeColumn = (colIndex: number) => {
    const cols = block.cols || 3;
    if (cols <= 1) return;
    
    const newCells = (block.cells || []).map(row => 
      row.filter((_, idx) => idx !== colIndex)
    );
    
    if (updateBlock) {
      updateBlock(block.id, {
        type: block.type,
        content: block.content,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
        cols: cols - 1,
        cells: newCells
      });
    }
  };
  
  return (
    <div className="mb-4 space-y-2">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full border-collapse">
          <tbody>
            {Array(block.rows || 3).fill(0).map((_, rowIndex) => (
              <tr key={`${block.id}-row-${rowIndex}`} className="border-b border-gray-200 last:border-b-0 relative group">
                {Array(block.cols || 3).fill(0).map((_, colIndex) => (
                  <td 
                    key={`${block.id}-cell-${rowIndex}-${colIndex}`} 
                    className="border-r border-gray-200 last:border-r-0 p-0 relative"
                  >
                    <input
                      className="w-full bg-transparent outline-none px-3 py-2 focus:bg-editor-highlight transition-colors"
                      value={block.cells?.[rowIndex]?.[colIndex] || ''}
                      onChange={(e) => updateTableCell(block.id, rowIndex, colIndex, e.target.value)}
                      style={getFormatStyle(block)}
                      placeholder={isMobile ? "..." : "내용 입력"}
                    />
                  </td>
                ))}
                <td className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 transform -translate-y-1/2 pr-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(rowIndex)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end space-x-2">
        <DropdownMenu open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <span>Table Options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={addRow} className="flex items-center gap-2 cursor-pointer">
              <PlusCircle className="h-4 w-4" />
              <span>Add Row</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addColumn} className="flex items-center gap-2 cursor-pointer">
              <PlusCircle className="h-4 w-4" />
              <span>Add Column</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
