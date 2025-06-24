import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Table,
  Quote,
  Code,
  Link,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Grip,
  Type,
  Hash,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface ExcelNotionEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'quote' | 'code' | 'image' | 'table' | 'excel-table';
  content: string;
  data?: any; // Excel 테이블 데이터
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    backgroundColor?: string;
    align?: 'left' | 'center' | 'right';
  };
}

interface ExcelTableData {
  rows: string[][];
  headers?: string[];
}

export const ExcelNotionEditor: React.FC<ExcelNotionEditorProps> = ({
  value = "",
  onChange,
  placeholder = "내용을 입력하세요. '/' 를 입력하면 블록 메뉴, '@' 를 입력하면 Excel 스타일 테이블이 나타납니다.",
  height = 400,
  disabled = false
}) => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<Block[]>([
    { id: Date.now().toString(), type: 'paragraph', content: '' }
  ]);
  const [activeBlockId, setActiveBlockId] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{blockId: string, row: number, col: number} | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);

  // 초기값 로드
  useEffect(() => {
    if (value && value.trim() !== '') {
      try {
        // HTML을 블록으로 변환
        const htmlToBlocks = (html: string): Block[] => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newBlocks: Block[] = [];
          
          doc.body.childNodes.forEach((node, index) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              let type: Block['type'] = 'paragraph';
              let content = element.textContent || '';
              
              switch (element.tagName.toLowerCase()) {
                case 'h1': type = 'heading1'; break;
                case 'h2': type = 'heading2'; break;
                case 'h3': type = 'heading3'; break;
                case 'ul': 
                  element.querySelectorAll('li').forEach((li, liIndex) => {
                    newBlocks.push({
                      id: `${Date.now()}_${index}_${liIndex}`,
                      type: 'bullet',
                      content: li.textContent || ''
                    });
                  });
                  return;
                case 'ol':
                  element.querySelectorAll('li').forEach((li, liIndex) => {
                    newBlocks.push({
                      id: `${Date.now()}_${index}_${liIndex}`,
                      type: 'numbered',
                      content: li.textContent || ''
                    });
                  });
                  return;
                case 'blockquote': type = 'quote'; break;
                case 'pre': 
                case 'code': type = 'code'; break;
                case 'img':
                  newBlocks.push({
                    id: `${Date.now()}_${index}`,
                    type: 'image',
                    content: (element as HTMLImageElement).src || ''
                  });
                  return;
                case 'table':
                  const tableData: ExcelTableData = { rows: [] };
                  const tableRows = element.querySelectorAll('tr');
                  tableRows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll('td, th');
                    const rowData: string[] = [];
                    cells.forEach(cell => {
                      rowData.push(cell.textContent || '');
                    });
                    if (rowIndex === 0 && row.querySelector('th')) {
                      tableData.headers = rowData;
                    } else {
                      tableData.rows.push(rowData);
                    }
                  });
                  newBlocks.push({
                    id: `${Date.now()}_${index}`,
                    type: 'excel-table',
                    content: 'Excel 스타일 테이블',
                    data: tableData
                  });
                  return;
              }
              
              if (content.trim()) {
                newBlocks.push({
                  id: `${Date.now()}_${index}`,
                  type,
                  content
                });
              }
            } else if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent?.trim();
              if (text) {
                newBlocks.push({
                  id: `${Date.now()}_text_${index}`,
                  type: 'paragraph',
                  content: text
                });
              }
            }
          });
          
          return newBlocks.length > 0 ? newBlocks : [{ id: Date.now().toString(), type: 'paragraph', content: '' }];
        };
        
        setBlocks(htmlToBlocks(value));
      } catch (error) {
        console.error('HTML 파싱 오류:', error);
        setBlocks([{ id: Date.now().toString(), type: 'paragraph', content: value }]);
      }
    }
  }, []);

  // 에디터 내용을 HTML로 변환
  const getEditorContent = useCallback(() => {
    return blocks.map(block => {
      const style = block.style ? 
        `style="${Object.entries(block.style)
          .filter(([key, value]) => value && key !== 'align')
          .map(([key, value]) => {
            switch (key) {
              case 'bold': return 'font-weight: bold';
              case 'italic': return 'font-style: italic';
              case 'underline': return 'text-decoration: underline';
              case 'color': return `color: ${value}`;
              case 'backgroundColor': return `background-color: ${value}`;
              default: return '';
            }
          })
          .filter(Boolean)
          .join('; ')}"` : '';
      
      const alignClass = block.style?.align ? `class="text-${block.style.align}"` : '';
      
      switch (block.type) {
        case 'heading1':
          return `<h1 ${style} ${alignClass}>${block.content}</h1>`;
        case 'heading2':
          return `<h2 ${style} ${alignClass}>${block.content}</h2>`;
        case 'heading3':
          return `<h3 ${style} ${alignClass}>${block.content}</h3>`;
        case 'bullet':
          return `<ul><li ${style} ${alignClass}>${block.content}</li></ul>`;
        case 'numbered':
          return `<ol><li ${style} ${alignClass}>${block.content}</li></ol>`;
        case 'quote':
          return `<blockquote ${style} ${alignClass}>${block.content}</blockquote>`;
        case 'code':
          return `<pre ${style} ${alignClass}><code>${block.content}</code></pre>`;
        case 'image':
          return `<img src="${block.content}" alt="이미지" style="max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0;" />`;
        case 'excel-table':
          const tableData = block.data as ExcelTableData;
          let tableHtml = '<table border="1" style="width: 100%; border-collapse: collapse; margin: 10px 0;">';
          
          if (tableData.headers) {
            tableHtml += '<thead><tr>';
            tableData.headers.forEach(header => {
              tableHtml += `<th style="padding: 8px; background-color: #f5f5f5; font-weight: bold;">${header}</th>`;
            });
            tableHtml += '</tr></thead>';
          }
          
          tableHtml += '<tbody>';
          tableData.rows.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => {
              tableHtml += `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`;
            });
            tableHtml += '</tr>';
          });
          tableHtml += '</tbody></table>';
          
          return tableHtml;
        default:
          return block.content ? `<p ${style} ${alignClass}>${block.content}</p>` : '';
      }
    }).filter(Boolean).join('\n');
  }, [blocks]);

  // 내용 변경 시 부모에게 알림
  useEffect(() => {
    if (onChange) {
      onChange(getEditorContent());
    }
  }, [blocks, onChange, getEditorContent]);

  // 블록 업데이트
  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, []);

  // 새 블록 추가
  const addBlock = useCallback((afterId: string, type: Block['type'] = 'paragraph') => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      data: type === 'excel-table' ? { rows: [['', '', ''], ['', '', ''], ['', '', '']], headers: ['열 1', '열 2', '열 3'] } : undefined
    };
    
    setBlocks(prev => {
      const index = prev.findIndex(block => block.id === afterId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
    
    return newBlock.id;
  }, []);

  // 블록 삭제
  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => {
      if (prev.length === 1) return [{ id: Date.now().toString(), type: 'paragraph', content: '' }];
      return prev.filter(block => block.id !== id);
    });
  }, []);

  // Excel 테이블 셀 업데이트
  const updateTableCell = useCallback((blockId: string, row: number, col: number, value: string) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId && block.type === 'excel-table' && block.data) {
        const tableData = { ...block.data };
        if (row === -1) {
          // 헤더 업데이트
          if (!tableData.headers) tableData.headers = [];
          tableData.headers[col] = value;
        } else {
          // 데이터 셀 업데이트
          if (!tableData.rows[row]) tableData.rows[row] = [];
          tableData.rows[row][col] = value;
        }
        return { ...block, data: tableData };
      }
      return block;
    }));
  }, []);

  // 테이블 행/열 추가
  const addTableRow = useCallback((blockId: string) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId && block.type === 'excel-table' && block.data) {
        const tableData = { ...block.data };
        const colCount = tableData.headers?.length || Math.max(...tableData.rows.map(row => row.length));
        tableData.rows.push(new Array(colCount).fill(''));
        return { ...block, data: tableData };
      }
      return block;
    }));
  }, []);

  const addTableColumn = useCallback((blockId: string) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId && block.type === 'excel-table' && block.data) {
        const tableData = { ...block.data };
        if (tableData.headers) {
          tableData.headers.push(`열 ${tableData.headers.length + 1}`);
        }
        tableData.rows.forEach(row => row.push(''));
        return { ...block, data: tableData };
      }
      return block;
    }));
  }, []);

  // 셀 편집 시작
  const startCellEdit = useCallback((blockId: string, row: number, col: number) => {
    setEditingCell({ blockId, row, col });
    setTimeout(() => {
      if (cellInputRef.current) {
        cellInputRef.current.focus();
        cellInputRef.current.select();
      }
    }, 0);
  }, []);

  // 셀 편집 완료
  const finishCellEdit = useCallback((save: boolean = true) => {
    if (editingCell && save && cellInputRef.current) {
      updateTableCell(editingCell.blockId, editingCell.row, editingCell.col, cellInputRef.current.value);
    }
    setEditingCell(null);
  }, [editingCell, updateTableCell]);

  // 셀 값 가져오기
  const getCellValue = useCallback((block: Block, row: number, col: number): string => {
    if (block.type !== 'excel-table' || !block.data) return '';
    const tableData = block.data as ExcelTableData;
    
    if (row === -1) {
      return tableData.headers?.[col] || '';
    } else {
      return tableData.rows[row]?.[col] || '';
    }
  }, []);

  // 이미지 업로드
  const handleImageUpload = useCallback(async (blockId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "오류",
            description: "이미지 크기는 5MB 이하여야 합니다.",
            variant: "destructive"
          });
          return;
        }

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `image_${timestamp}_${randomId}.${fileExtension}`;

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(`excel-notion-editor/${fileName}`, file);

        if (error) {
          toast({
            title: "오류",
            description: "이미지 업로드에 실패했습니다.",
            variant: "destructive"
          });
          return;
        }

        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(`excel-notion-editor/${fileName}`);

        if (urlData?.publicUrl) {
          updateBlock(blockId, { type: 'image', content: urlData.publicUrl });
          toast({
            title: "성공",
            description: "이미지가 성공적으로 업로드되었습니다."
          });
        }
      } catch (error) {
        console.error('Image upload error:', error);
        toast({
          title: "오류",
          description: "이미지 업로드 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      }
    };

    input.click();
  }, [updateBlock, toast]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newBlockId = addBlock(blockId);
      // 새 블록에 포커스
      setTimeout(() => {
        const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"]`) as HTMLInputElement;
        if (newBlockElement) {
          newBlockElement.focus();
        }
      }, 0);
    } else if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '') {
        e.preventDefault();
        deleteBlock(blockId);
        // 이전 블록에 포커스
        const currentIndex = blocks.findIndex(b => b.id === blockId);
        if (currentIndex > 0) {
          const prevBlock = blocks[currentIndex - 1];
          setTimeout(() => {
            const prevBlockElement = document.querySelector(`[data-block-id="${prevBlock.id}"]`) as HTMLInputElement;
            if (prevBlockElement) {
              prevBlockElement.focus();
            }
          }, 0);
        }
      }
    } else if (e.key === '/' && e.target instanceof HTMLInputElement && e.target.value === '') {
      e.preventDefault();
      setActiveBlockId(blockId);
      setShowBlockMenu(true);
      
      // 메뉴 위치 계산
      const rect = e.target.getBoundingClientRect();
      setBlockMenuPosition({
        x: rect.left,
        y: rect.bottom + 5
      });
    } else if (e.key === '@' && e.target instanceof HTMLInputElement && e.target.value === '') {
      e.preventDefault();
      updateBlock(blockId, { 
        type: 'excel-table', 
        content: 'Excel 스타일 테이블', 
        data: { rows: [['', '', ''], ['', '', ''], ['', '', '']], headers: ['열 1', '열 2', '열 3'] }
      });
    }
  }, [blocks, addBlock, deleteBlock, updateBlock]);

  // 블록 메뉴 항목들
  const blockMenuItems = [
    { type: 'paragraph' as const, icon: <Type className="w-4 h-4" />, label: '텍스트', description: '일반 텍스트를 입력합니다.' },
    { type: 'heading1' as const, icon: <Heading1 className="w-4 h-4" />, label: '제목 1', description: '가장 큰 제목입니다.' },
    { type: 'heading2' as const, icon: <Heading2 className="w-4 h-4" />, label: '제목 2', description: '중간 크기 제목입니다.' },
    { type: 'heading3' as const, icon: <Heading3 className="w-4 h-4" />, label: '제목 3', description: '작은 크기 제목입니다.' },
    { type: 'bullet' as const, icon: <List className="w-4 h-4" />, label: '글머리 기호', description: '글머리 기호 목록을 만듭니다.' },
    { type: 'numbered' as const, icon: <ListOrdered className="w-4 h-4" />, label: '번호 매기기', description: '번호가 매겨진 목록을 만듭니다.' },
    { type: 'quote' as const, icon: <Quote className="w-4 h-4" />, label: '인용구', description: '인용구를 추가합니다.' },
    { type: 'code' as const, icon: <Code className="w-4 h-4" />, label: '코드', description: '코드 블록을 추가합니다.' },
    { type: 'image' as const, icon: <Image className="w-4 h-4" />, label: '이미지', description: '이미지를 업로드합니다.' },
    { type: 'excel-table' as const, icon: <Hash className="w-4 h-4" />, label: 'Excel 테이블', description: 'Excel 스타일의 편집 가능한 테이블을 추가합니다.' },
  ];

  // 블록 타입 변경
  const changeBlockType = useCallback((blockId: string, newType: Block['type']) => {
    if (newType === 'image') {
      handleImageUpload(blockId);
    } else if (newType === 'excel-table') {
      updateBlock(blockId, { 
        type: newType, 
        content: 'Excel 스타일 테이블',
        data: { rows: [['', '', ''], ['', '', ''], ['', '', '']], headers: ['열 1', '열 2', '열 3'] }
      });
    } else {
      updateBlock(blockId, { type: newType });
    }
    setShowBlockMenu(false);
  }, [updateBlock, handleImageUpload]);

  return (
    <div className="excel-notion-editor relative bg-white rounded-lg border shadow-sm" style={{ minHeight: height }}>
      {/* 툴바 */}
      <div className="flex items-center gap-1 p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <span className="text-sm text-gray-600 mr-2">✨</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100" title="굵게">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100" title="기울임">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100" title="밑줄">
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100" title="왼쪽 정렬">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100" title="가운데 정렬">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100" title="오른쪽 정렬">
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <span className="text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full border shadow-sm">
          <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">/</span> 블록 메뉴 | 
          <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded text-green-700 ml-2">@</span> Excel 테이블
        </span>
      </div>

      {/* 에디터 영역 */}
      <div 
        ref={editorRef}
        className="p-4 bg-white"
        style={{ minHeight: height - 80 }}
      >
        {blocks.map((block, index) => (
          <div key={block.id} className="group relative mb-3">
            {/* 블록 핸들 */}
            <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="블록 이동"
                >
                  <Grip className="w-3 h-3 text-gray-400 cursor-grab" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-100"
                  title="블록 추가"
                  onClick={() => {
                    setActiveBlockId(block.id);
                    setShowBlockMenu(true);
                    const element = document.querySelector(`[data-block-id="${block.id}"]`);
                    if (element) {
                      const rect = element.getBoundingClientRect();
                      setBlockMenuPosition({
                        x: rect.left,
                        y: rect.bottom + 5
                      });
                    }
                  }}
                >
                  <Plus className="h-3 w-3 text-blue-500" />
                </Button>
              </div>
            </div>

            {/* 블록 콘텐츠 */}
            {block.type === 'image' ? (
              <div className="my-4">
                <img 
                  src={block.content} 
                  alt="이미지" 
                  className="max-w-full h-auto rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleImageUpload(block.id)}
                />
              </div>
            ) : block.type === 'excel-table' ? (
              <div className="my-4 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-green-600" />
                    Excel 스타일 테이블
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs hover:bg-green-100 border-green-200"
                      onClick={() => addTableRow(block.id)}
                    >
                      + 행
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs hover:bg-green-100 border-green-200"
                      onClick={() => addTableColumn(block.id)}
                    >
                      + 열
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    {/* 헤더 */}
                    {block.data?.headers && (
                      <thead>
                        <tr>
                          {block.data.headers.map((header: string, colIndex: number) => (
                            <th key={colIndex} className="relative group">
                              {editingCell?.blockId === block.id && editingCell.row === -1 && editingCell.col === colIndex ? (
                                <div className="flex items-center p-1">
                                  <Input
                                    ref={cellInputRef}
                                    defaultValue={header}
                                    className="h-8 border-0 bg-blue-50 font-semibold text-center focus:bg-blue-100"
                                    onBlur={() => finishCellEdit(true)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishCellEdit(true);
                                      if (e.key === 'Escape') finishCellEdit(false);
                                    }}
                                  />
                                  <div className="flex ml-1">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-green-100" onClick={() => finishCellEdit(true)}>
                                      <Check className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-red-100" onClick={() => finishCellEdit(false)}>
                                      <X className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="p-3 bg-blue-50 font-semibold text-gray-700 border-b cursor-cell hover:bg-blue-100 transition-colors min-h-[40px] flex items-center justify-center"
                                  onClick={() => startCellEdit(block.id, -1, colIndex)}
                                >
                                  {header || `열 ${colIndex + 1}`}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    
                    {/* 데이터 행들 */}
                    <tbody>
                      {block.data?.rows?.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {row.map((cell: string, colIndex: number) => (
                            <td key={colIndex} className="relative group">
                              {editingCell?.blockId === block.id && editingCell.row === rowIndex && editingCell.col === colIndex ? (
                                <div className="flex items-center p-1">
                                  <Input
                                    ref={cellInputRef}
                                    defaultValue={cell}
                                    className="h-8 border-0 bg-yellow-50 focus:bg-yellow-100"
                                    onBlur={() => finishCellEdit(true)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishCellEdit(true);
                                      if (e.key === 'Escape') finishCellEdit(false);
                                      if (e.key === 'Tab') {
                                        e.preventDefault();
                                        finishCellEdit(true);
                                        // 다음 셀로 이동
                                        const nextCol = colIndex + 1;
                                        const nextRow = nextCol >= row.length ? rowIndex + 1 : rowIndex;
                                        const finalCol = nextCol >= row.length ? 0 : nextCol;
                                        if (nextRow < (block.data?.rows.length || 0)) {
                                          setTimeout(() => startCellEdit(block.id, nextRow, finalCol), 0);
                                        }
                                      }
                                    }}
                                  />
                                  <div className="flex ml-1">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-green-100" onClick={() => finishCellEdit(true)}>
                                      <Check className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-red-100" onClick={() => finishCellEdit(false)}>
                                      <X className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="p-3 border-r border-b cursor-cell hover:bg-yellow-50 transition-colors min-h-[40px] flex items-center"
                                  onClick={() => startCellEdit(block.id, rowIndex, colIndex)}
                                >
                                  {cell || (
                                    <span className="text-gray-400 italic text-sm">클릭하여 편집</span>
                                  )}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <input
                data-block-id={block.id}
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder={index === 0 ? placeholder : getBlockPlaceholder(block.type)}
                disabled={disabled}
                className={`w-full border-0 outline-none resize-none bg-transparent transition-all duration-200 hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-2 ${getBlockStyles(block)}`}
                style={{
                  fontWeight: block.style?.bold ? 'bold' : 'normal',
                  fontStyle: block.style?.italic ? 'italic' : 'normal',
                  textDecoration: block.style?.underline ? 'underline' : 'none',
                  color: block.style?.color || '#000',
                  backgroundColor: block.style?.backgroundColor || 'transparent',
                  textAlign: block.style?.align || 'left'
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 블록 메뉴 */}
      {showBlockMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowBlockMenu(false)}
          />
          <div 
            className="fixed z-50 bg-white border rounded-xl shadow-xl py-2 w-80 max-h-96 overflow-y-auto"
            style={{
              left: blockMenuPosition.x,
              top: blockMenuPosition.y
            }}
          >
            <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-b bg-gray-50">
              블록 유형을 선택하세요
            </div>
            {blockMenuItems.map((item) => (
              <button
                key={item.type}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors"
                onClick={() => changeBlockType(activeBlockId, item.type)}
              >
                <div className="flex-shrink-0 p-1 bg-gray-100 rounded">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500 truncate">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// 블록 타입별 플레이스홀더
function getBlockPlaceholder(type: Block['type']): string {
  switch (type) {
    case 'heading1': return '📝 제목 1';
    case 'heading2': return '📄 제목 2';
    case 'heading3': return '📋 제목 3';
    case 'bullet': return '• 목록 항목';
    case 'numbered': return '1. 목록 항목';
    case 'quote': return '💭 인용구를 입력하세요...';
    case 'code': return '💻 console.log("코드를 입력하세요...");';
    case 'excel-table': return '📊 Excel 스타일 테이블';
    default: return '텍스트를 입력하세요...';
  }
}

// 블록 타입별 스타일
function getBlockStyles(block: Block): string {
  const baseStyles = 'py-2 px-0';
  
  switch (block.type) {
    case 'heading1':
      return `${baseStyles} text-3xl font-bold text-gray-900`;
    case 'heading2':
      return `${baseStyles} text-2xl font-semibold text-gray-800`;
    case 'heading3':
      return `${baseStyles} text-xl font-medium text-gray-700`;
    case 'bullet':
      return `${baseStyles} pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-blue-600 before:font-bold`;
    case 'numbered':
      return `${baseStyles} pl-6 relative`;
    case 'quote':
      return `${baseStyles} pl-4 border-l-4 border-blue-300 italic text-gray-600 bg-blue-50 rounded-r`;
    case 'code':
      return `${baseStyles} font-mono text-sm bg-gray-100 px-3 py-2 rounded border border-gray-200`;
    default:
      return `${baseStyles} text-gray-900`;
  }
}

export default ExcelNotionEditor; 