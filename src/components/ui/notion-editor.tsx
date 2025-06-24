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
  Grip
} from "lucide-react";

interface NotionEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'quote' | 'code' | 'image' | 'table';
  content: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    backgroundColor?: string;
    align?: 'left' | 'center' | 'right';
  };
}

export const NotionEditor: React.FC<NotionEditorProps> = ({
  value = "",
  onChange,
  placeholder = "내용을 입력하세요. '/' 를 입력하면 블록 메뉴가 나타납니다.",
  height = 400,
  disabled = false
}) => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<Block[]>([
    { id: Date.now().toString(), type: 'paragraph', content: '' }
  ]);
  const [activeBlockId, setActiveBlockId] = useState<string>('');
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  // 초기값 로드
  useEffect(() => {
    if (value && value !== getEditorContent()) {
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
              }
              
              newBlocks.push({
                id: `${Date.now()}_${index}`,
                type,
                content
              });
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
        case 'table':
          return `<table border="1" style="width: 100%; border-collapse: collapse; margin: 10px 0;"><tr><td style="padding: 8px;">${block.content}</td></tr></table>`;
        default:
          return `<p ${style} ${alignClass}>${block.content}</p>`;
      }
    }).join('\n');
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
      content: ''
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
          .upload(`notion-editor/${fileName}`, file);

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
          .getPublicUrl(`notion-editor/${fileName}`);

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
    }
  }, [blocks, addBlock, deleteBlock]);

  // 블록 메뉴 항목들
  const blockMenuItems = [
    { type: 'paragraph' as const, icon: <div className="w-4 h-4 border rounded bg-gray-100" />, label: '텍스트', description: '일반 텍스트를 입력합니다.' },
    { type: 'heading1' as const, icon: <Heading1 className="w-4 h-4" />, label: '제목 1', description: '가장 큰 제목입니다.' },
    { type: 'heading2' as const, icon: <Heading2 className="w-4 h-4" />, label: '제목 2', description: '중간 크기 제목입니다.' },
    { type: 'heading3' as const, icon: <Heading3 className="w-4 h-4" />, label: '제목 3', description: '작은 크기 제목입니다.' },
    { type: 'bullet' as const, icon: <List className="w-4 h-4" />, label: '글머리 기호', description: '글머리 기호 목록을 만듭니다.' },
    { type: 'numbered' as const, icon: <ListOrdered className="w-4 h-4" />, label: '번호 매기기', description: '번호가 매겨진 목록을 만듭니다.' },
    { type: 'quote' as const, icon: <Quote className="w-4 h-4" />, label: '인용구', description: '인용구를 추가합니다.' },
    { type: 'code' as const, icon: <Code className="w-4 h-4" />, label: '코드', description: '코드 블록을 추가합니다.' },
    { type: 'image' as const, icon: <Image className="w-4 h-4" />, label: '이미지', description: '이미지를 업로드합니다.' },
    { type: 'table' as const, icon: <Table className="w-4 h-4" />, label: '테이블', description: '간단한 테이블을 추가합니다.' },
  ];

  // 블록 타입 변경
  const changeBlockType = useCallback((blockId: string, newType: Block['type']) => {
    if (newType === 'image') {
      handleImageUpload(blockId);
    } else {
      updateBlock(blockId, { type: newType });
    }
    setShowBlockMenu(false);
  }, [updateBlock, handleImageUpload]);

  // 텍스트 스타일 토글
  const toggleStyle = useCallback((blockId: string, styleProp: keyof NonNullable<Block['style']>) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const currentStyle = block.style || {};
    const newStyle = {
      ...currentStyle,
      [styleProp]: !currentStyle[styleProp]
    };
    
    updateBlock(blockId, { style: newStyle });
  }, [blocks, updateBlock]);

  return (
    <div className="notion-editor relative" style={{ minHeight: height }}>
      {/* 툴바 */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg">
        <span className="text-sm text-gray-600 mr-2">서식:</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="굵게">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="기울임">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="밑줄">
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="왼쪽 정렬">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="가운데 정렬">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="오른쪽 정렬">
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="색상">
          <Palette className="h-4 w-4" />
        </Button>
      </div>

      {/* 에디터 영역 */}
      <div 
        ref={editorRef}
        className="p-4 bg-white border-l border-r border-b rounded-b-lg"
        style={{ minHeight: height - 50 }}
      >
        {blocks.map((block, index) => (
          <div key={block.id} className="group relative mb-2">
            {/* 블록 핸들 */}
            <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Grip className="w-4 h-4 text-gray-400 cursor-grab" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-1"
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
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 블록 콘텐츠 */}
            {block.type === 'image' ? (
              <div className="my-4">
                <img 
                  src={block.content} 
                  alt="이미지" 
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  onClick={() => handleImageUpload(block.id)}
                />
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
                className={`w-full border-0 outline-none resize-none bg-transparent ${getBlockStyles(block)}`}
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
            className="fixed z-50 bg-white border rounded-lg shadow-lg py-2 w-80 max-h-96 overflow-y-auto"
            style={{
              left: blockMenuPosition.x,
              top: blockMenuPosition.y
            }}
          >
            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
              블록 유형을 선택하세요
            </div>
            {blockMenuItems.map((item) => (
              <button
                key={item.type}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                onClick={() => changeBlockType(activeBlockId, item.type)}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
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
    case 'heading1': return '제목 1';
    case 'heading2': return '제목 2';
    case 'heading3': return '제목 3';
    case 'bullet': return '• 목록 항목';
    case 'numbered': return '1. 목록 항목';
    case 'quote': return '인용구를 입력하세요...';
    case 'code': return 'console.log("코드를 입력하세요...");';
    case 'table': return '테이블 내용';
    default: return '텍스트를 입력하세요...';
  }
}

// 블록 타입별 스타일
function getBlockStyles(block: Block): string {
  const baseStyles = 'py-1 px-0';
  
  switch (block.type) {
    case 'heading1':
      return `${baseStyles} text-3xl font-bold text-gray-900`;
    case 'heading2':
      return `${baseStyles} text-2xl font-semibold text-gray-800`;
    case 'heading3':
      return `${baseStyles} text-xl font-medium text-gray-700`;
    case 'bullet':
      return `${baseStyles} pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-gray-600`;
    case 'numbered':
      return `${baseStyles} pl-6 relative`;
    case 'quote':
      return `${baseStyles} pl-4 border-l-4 border-gray-300 italic text-gray-600 bg-gray-50`;
    case 'code':
      return `${baseStyles} font-mono text-sm bg-gray-100 px-2 py-1 rounded border`;
    default:
      return `${baseStyles} text-gray-900`;
  }
}

export default NotionEditor; 