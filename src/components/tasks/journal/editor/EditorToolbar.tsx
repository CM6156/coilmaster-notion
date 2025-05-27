
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, 
  ChevronDown, Download
} from "lucide-react";
import { BlockType } from "@/types";

interface EditorToolbarProps {
  currentBlockId: string | null;
  blocks: any[];
  toggleFormatting: (id: string, format: 'bold' | 'italic' | 'underline') => void;
  setAlignment: (id: string, alignment: 'left' | 'center' | 'right') => void;
  addBlock: (type: BlockType, afterId?: string) => void;
  exportToExcel: () => void;
}

const blockOptions = [
  { label: '텍스트', value: 'paragraph', icon: <AlignLeft className="mr-2 h-4 w-4" /> },
  { label: '제목 1', value: 'heading1', icon: <FileText className="mr-2 h-4 w-4" /> },
  { label: '제목 2', value: 'heading2', icon: <FileText className="mr-2 h-4 w-4" /> },
  { label: '제목 3', value: 'heading3', icon: <FileText className="mr-2 h-4 w-4" /> },
  { label: '글머리 기호 목록', value: 'bulletList', icon: <ListOrdered className="mr-2 h-4 w-4" /> },
  { label: '체크리스트', value: 'checkList', icon: <ListChecks className="mr-2 h-4 w-4" /> },
  { label: '표', value: 'table', icon: <Table className="mr-2 h-4 w-4" /> },
  { label: '코드', value: 'code', icon: <Code className="mr-2 h-4 w-4" /> },
  { label: '인용구', value: 'quote', icon: <TextQuote className="mr-2 h-4 w-4" /> },
  { label: '이미지', value: 'image', icon: <Image className="mr-2 h-4 w-4" /> },
  { label: '데이터베이스 (인라인)', value: 'database', icon: <Database className="mr-2 h-4 w-4" /> },
  { label: '데이터베이스 (전체 페이지)', value: 'databaseFullPage', icon: <Grid className="mr-2 h-4 w-4" /> },
];

export default function EditorToolbar({
  currentBlockId,
  blocks,
  toggleFormatting,
  setAlignment,
  addBlock,
  exportToExcel
}: EditorToolbarProps) {
  // Find the current block
  const currentBlock = currentBlockId ? blocks.find(b => b.id === currentBlockId) : null;
  
  return (
    <div className="flex items-center mb-4 pb-2 border-b">
      <div className="flex space-x-2 mr-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (currentBlockId) {
              toggleFormatting(currentBlockId, 'bold');
            }
          }}
          className={currentBlock?.textFormatting?.bold ? 'bg-slate-100' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (currentBlockId) {
              toggleFormatting(currentBlockId, 'italic');
            }
          }}
          className={currentBlock?.textFormatting?.italic ? 'bg-slate-100' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (currentBlockId) {
              toggleFormatting(currentBlockId, 'underline');
            }
          }}
          className={currentBlock?.textFormatting?.underline ? 'bg-slate-100' : ''}
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex space-x-2 border-l pl-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (currentBlockId) {
              setAlignment(currentBlockId, 'left');
            }
          }}
          className={currentBlock?.textFormatting?.alignment === 'left' ? 'bg-slate-100' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (currentBlockId) {
              setAlignment(currentBlockId, 'center');
            }
          }}
          className={currentBlock?.textFormatting?.alignment === 'center' ? 'bg-slate-100' : ''}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (currentBlockId) {
              setAlignment(currentBlockId, 'right');
            }
          }}
          className={currentBlock?.textFormatting?.alignment === 'right' ? 'bg-slate-100' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="ml-auto flex space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={exportToExcel}
          className="flex items-center"
        >
          <Download className="h-4 w-4 mr-1" />
          엑셀로 내보내기
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              추가 <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="end">
            <Command>
              <CommandList>
                <CommandGroup heading="블록 추가">
                  {blockOptions.map((option) => (
                    <CommandItem 
                      key={option.value}
                      onSelect={() => addBlock(option.value as BlockType)}
                      className="cursor-pointer"
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// Don't forget to import all necessary icons
import { 
  FileText, ListOrdered, ListChecks, Table, 
  Image, Database, Grid, Code, TextQuote 
} from "lucide-react";
