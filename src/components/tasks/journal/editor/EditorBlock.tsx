
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckSquare, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Block, DatabaseColumn, DatabaseRow } from "@/types";
import DatabaseBlockComponent from "./blocks/DatabaseBlock";
import TableBlockComponent from "./blocks/TableBlock";
import { useToast } from "@/hooks/use-toast";

interface EditorBlockProps {
  block: Block;
  handleBlockChange: (id: string, content: string) => void;
  toggleCheck: (id: string) => void;
  updateTableCell: (blockId: string, rowIndex: number, colIndex: number, value: string) => void;
  updateDatabaseCell: (blockId: string, rowId: string, columnId: string, value: any) => void;
  addDatabaseRow: (blockId: string) => void;
  addDatabaseColumn: (blockId: string) => void;
  deleteBlock: (id: string) => void;
}

export default function EditorBlock({ 
  block, 
  handleBlockChange, 
  toggleCheck, 
  updateTableCell,
  updateDatabaseCell,
  addDatabaseRow,
  addDatabaseColumn,
  deleteBlock
}: EditorBlockProps) {
  const { toast } = useToast();

  // Get formatting styles
  const getFormatStyle = (block: Block) => {
    const formatting = block.textFormatting || {};
    return {
      fontWeight: formatting.bold ? 'bold' : 'normal',
      fontStyle: formatting.italic ? 'italic' : 'normal',
      textDecoration: formatting.underline ? 'underline' : 'none',
      textAlign: formatting.alignment || 'left',
    };
  };

  switch (block.type) {
    case 'heading1':
      return (
        <div className="group relative">
          <Textarea
            className="text-3xl font-bold mb-3 outline-none resize-none overflow-hidden border-none p-0 focus-visible:ring-0"
            placeholder="제목 1"
            value={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            style={getFormatStyle(block)}
          />
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
    
    case 'heading2':
      return (
        <div className="group relative">
          <Textarea
            className="text-2xl font-bold mb-2 outline-none resize-none overflow-hidden border-none p-0 focus-visible:ring-0"
            placeholder="제목 2"
            value={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            style={getFormatStyle(block)}
          />
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    case 'heading3':
      return (
        <div className="group relative">
          <Textarea
            className="text-xl font-bold mb-2 outline-none resize-none overflow-hidden border-none p-0 focus-visible:ring-0"
            placeholder="제목 3"
            value={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            style={getFormatStyle(block)}
          />
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    case 'bulletList':
      return (
        <div className="group relative">
          <div className="flex items-start mb-1">
            <div className="mt-1 mr-2">•</div>
            <Textarea
              className="outline-none flex-1 resize-none overflow-hidden border-none p-0 focus-visible:ring-0"
              placeholder="글머리 기호 항목"
              value={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              style={getFormatStyle(block)}
            />
          </div>
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    case 'checkList':
      return (
        <div className="group relative">
          <div className="flex items-center mb-1">
            <div
              className={cn(
                "mr-2 h-4 w-4 border rounded cursor-pointer flex items-center justify-center", 
                block.checked ? "bg-primary border-primary" : "bg-transparent border-gray-300"
              )}
              onClick={() => toggleCheck(block.id)}
            >
              {block.checked && <CheckSquare className="h-3 w-3 text-white" />}
            </div>
            <Textarea
              className={cn(
                "outline-none flex-1 resize-none overflow-hidden border-none p-0 focus-visible:ring-0", 
                block.checked ? "line-through opacity-70" : ""
              )}
              placeholder="체크리스트 항목"
              value={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              style={getFormatStyle(block)}
            />
          </div>
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    case 'table':
      return (
        <div className="group relative">
          <TableBlockComponent 
            block={block} 
            updateTableCell={updateTableCell} 
            getFormatStyle={getFormatStyle}
          />
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
    
    case 'database':
    case 'databaseFullPage':
      return (
        <div className="group relative">
          <DatabaseBlockComponent
            block={block}
            addDatabaseColumn={addDatabaseColumn}
            addDatabaseRow={addDatabaseRow}
            updateDatabaseCell={updateDatabaseCell}
          />
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    case 'code':
      return (
        <div className="group relative">
          <div className="mb-4 bg-gray-100 p-3 rounded-md font-mono">
            <Textarea
              className="outline-none whitespace-pre-wrap w-full resize-none overflow-hidden bg-transparent border-none focus-visible:ring-0"
              placeholder="코드 작성"
              value={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
            />
          </div>
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    case 'quote':
      return (
        <div className="group relative">
          <blockquote className="pl-4 border-l-4 border-gray-300 mb-4 italic">
            <Textarea
              className="outline-none w-full resize-none overflow-hidden border-none p-0 focus-visible:ring-0"
              placeholder="인용구"
              value={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              style={getFormatStyle(block)}
            />
          </blockquote>
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    case 'image':
      return (
        <div className="group relative mb-4">
          <div className="flex items-center mb-2">
            <Input 
              type="text" 
              placeholder="이미지 URL 입력"
              value={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              style={getFormatStyle(block)}
            />
          </div>
          {block.content && (
            <img 
              src={block.content} 
              alt="User provided" 
              className="max-w-full rounded-md"
              onError={() => {
                toast({
                  title: "이미지 로드 실패",
                  description: "유효한 이미지 URL을 입력해주세요.",
                  variant: "destructive"
                });
              }}
            />
          )}
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
      
    // Default paragraph
    default:
      return (
        <div className="group relative">
          <Textarea
            className="mb-3 outline-none w-full resize-none overflow-hidden min-h-[80px] border-none p-0 focus-visible:ring-0"
            placeholder="텍스트를 입력하세요"
            value={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            style={getFormatStyle(block)}
          />
          <BlockActionButton deleteBlock={() => deleteBlock(block.id)} />
        </div>
      );
  }
}

// Helper component for block actions
function BlockActionButton({ deleteBlock }: { deleteBlock: () => void }) {
  return (
    <div className="absolute right-0 top-0 hidden group-hover:flex bg-white shadow-md rounded-md p-1">
      <Button variant="ghost" size="icon" onClick={deleteBlock} className="h-6 w-6">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
