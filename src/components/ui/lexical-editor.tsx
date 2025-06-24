import React, { useState, useCallback } from 'react';
import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { 
  $createHeadingNode,
  $createQuoteNode
} from '@lexical/rich-text';
import { 
  $createParagraphNode, 
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND
} from 'lexical';
import { 
  $setBlocksType,
  $patchStyleText
} from '@lexical/selection';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Image,
  Table,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from './button';

// 에디터 테마
const theme = {
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
  },
};

// 에러 처리
function onError(error: Error) {
  console.error('Lexical Editor Error:', error);
}

// 노드 설정
const nodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  LinkNode,
];

// 툴바 컴포넌트
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState('14px');
  const [fontColor, setFontColor] = useState('#000000');

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('이미지 크기는 5MB 이하여야 합니다.');
          return;
        }

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `image_${timestamp}_${randomId}.${fileExtension}`;

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(`work-journals/${fileName}`, file);

        if (error) {
          console.error('Image upload error:', error);
          toast.error('이미지 업로드에 실패했습니다.');
          return;
        }

        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(`work-journals/${fileName}`);

        if (urlData?.publicUrl) {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const imageHtml = `<img src="${urlData.publicUrl}" alt="업로드된 이미지" style="max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0;" />`;
              
              // DOM parser를 사용하여 HTML을 노드로 변환
              const parser = new DOMParser();
              const dom = parser.parseFromString(imageHtml, 'text/html');
              const nodes = $generateNodesFromDOM(editor, dom);
              
              // 노드들을 삽입
              selection.insertNodes(nodes);
            }
          });
          toast.success('이미지가 성공적으로 업로드되었습니다.');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('이미지 업로드 중 오류가 발생했습니다.');
      }
    };

    input.click();
  }, [editor]);

  // 테이블 삽입 핸들러
  const handleTableInsert = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const tableHtml = `
          <table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">제목 1</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">제목 2</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">제목 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">내용 1</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">내용 2</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">내용 3</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">내용 4</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">내용 5</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">내용 6</td>
              </tr>
            </tbody>
          </table>
        `;
        
        // DOM parser를 사용하여 HTML을 노드로 변환
        const parser = new DOMParser();
        const dom = parser.parseFromString(tableHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        
        // 노드들을 삽입
        selection.insertNodes(nodes);
        toast.success('테이블이 삽입되었습니다.');
      }
    });
  }, [editor]);

  return (
    <div className="lexical-toolbar flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      {/* 실행 취소/다시 실행 */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* 헤딩 선택 */}
      <select
        className="px-2 py-1 border rounded text-sm mr-2"
        onChange={(e) => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              if (e.target.value === 'paragraph') {
                $setBlocksType(selection, () => $createParagraphNode());
              } else {
                $setBlocksType(selection, () => $createHeadingNode(e.target.value as any));
              }
            }
          });
        }}
      >
        <option value="paragraph">본문</option>
        <option value="h1">제목 1</option>
        <option value="h2">제목 2</option>
        <option value="h3">제목 3</option>
        <option value="h4">제목 4</option>
        <option value="h5">제목 5</option>
        <option value="h6">제목 6</option>
      </select>

      {/* 폰트 크기 */}
      <select
        className="px-2 py-1 border rounded text-sm mr-2"
        value={fontSize}
        onChange={(e) => {
          setFontSize(e.target.value);
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, { 'font-size': e.target.value });
            }
          });
        }}
      >
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="32px">32px</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* 텍스트 서식 */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant={isBold ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            setIsBold(!isBold);
          }}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            setIsItalic(!isItalic);
          }}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            setIsUnderline(!isUnderline);
          }}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      {/* 폰트 색상 */}
      <div className="flex items-center gap-1 mr-2">
        <input
          type="color"
          value={fontColor}
          onChange={(e) => {
            setFontColor(e.target.value);
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $patchStyleText(selection, { color: e.target.value });
              }
            });
          }}
          className="w-8 h-8 border rounded cursor-pointer"
          title="폰트 색상"
        />
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* 정렬 */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* 인용문 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createQuoteNode());
            }
          });
        }}
        className="h-8 w-8 p-0 mr-2"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* 이미지 및 테이블 */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
          className="h-8 w-8 p-0"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTableInsert}
          className="h-8 w-8 p-0"
        >
          <Table className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// 메인 에디터 컴포넌트
interface LexicalEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  height = 300
}) => {
  const initialConfig = {
    namespace: 'LexicalEditor',
    theme,
    onError,
    nodes,
  };

  return (
    <div className="lexical-editor-container border rounded-lg overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          .lexical-editor-content {
            min-height: ${height}px;
            padding: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            outline: none;
          }
          
          .lexical-editor-content:focus {
            outline: none;
          }
          
          .editor-paragraph {
            margin: 0 0 8px 0;
          }
          
          .editor-heading-h1 { font-size: 2em; font-weight: bold; margin: 16px 0 8px 0; }
          .editor-heading-h2 { font-size: 1.5em; font-weight: bold; margin: 14px 0 8px 0; }
          .editor-heading-h3 { font-size: 1.25em; font-weight: bold; margin: 12px 0 8px 0; }
          .editor-heading-h4 { font-size: 1.1em; font-weight: bold; margin: 10px 0 8px 0; }
          .editor-heading-h5 { font-size: 1em; font-weight: bold; margin: 8px 0 6px 0; }
          .editor-heading-h6 { font-size: 0.9em; font-weight: bold; margin: 8px 0 6px 0; }
          
          .editor-quote {
            border-left: 4px solid #ccc;
            margin: 16px 0;
            padding: 8px 16px;
            background-color: #f9f9f9;
            font-style: italic;
          }
          
          .editor-list-ul, .editor-list-ol {
            margin: 8px 0;
            padding-left: 24px;
          }
          
          .editor-listitem {
            margin: 4px 0;
          }
          
          .editor-text-bold { font-weight: bold; }
          .editor-text-italic { font-style: italic; }
          .editor-text-underline { text-decoration: underline; }
          .editor-text-strikethrough { text-decoration: line-through; }
          
          .editor-link {
            color: #0066cc;
            text-decoration: underline;
          }
          
          /* 테이블 스타일 */
          .lexical-editor-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
            border: 1px solid #ddd;
          }
          
          .lexical-editor-content table th,
          .lexical-editor-content table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          
          .lexical-editor-content table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          
          .lexical-editor-content table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          /* 이미지 스타일 */
          .lexical-editor-content img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 10px 0;
          }
        `
      }} />
      
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="lexical-editor-content" 
                style={{ minHeight: height }}
              />
            }
            placeholder={
              <div className="absolute top-3 left-3 text-gray-400 pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin 
            onChange={(editorState, editor) => {
              editorState.read(() => {
                const htmlString = $generateHtmlFromNodes(editor, null);
                onChange(htmlString);
              });
            }} 
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}; 