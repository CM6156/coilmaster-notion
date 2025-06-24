import React, { useRef, useCallback, useState, useEffect } from 'react';
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
  Image,
  Table,
  Undo,
  Redo,
  Type,
  Palette
} from 'lucide-react';
import { Button } from './button';

interface SimpleRichEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export const SimpleRichEditor: React.FC<SimpleRichEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  height = 300
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('14px');
  const [fontColor, setFontColor] = useState('#000000');

  // 에디터 내용 업데이트
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // 내용 변경 핸들러
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // 명령 실행 함수
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // 폰트 크기 변경
  const changeFontSize = useCallback((size: string) => {
    setFontSize(size);
    if (window.getSelection()?.toString()) {
      execCommand('fontSize', '7'); // 임시로 큰 크기 설정
      // 선택된 텍스트의 font-size 스타일 직접 변경
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size;
        try {
          range.surroundContents(span);
        } catch {
          span.appendChild(range.extractContents());
          range.insertNode(span);
        }
        selection.removeAllRanges();
        handleInput();
      }
    }
  }, [execCommand, handleInput]);

  // 폰트 색상 변경
  const changeFontColor = useCallback((color: string) => {
    setFontColor(color);
    execCommand('foreColor', color);
  }, [execCommand]);

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
          // 이미지 삽입
          const img = `<img src="${urlData.publicUrl}" alt="업로드된 이미지" style="max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0;" />`;
          execCommand('insertHTML', img);
          toast.success('이미지가 성공적으로 업로드되었습니다.');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('이미지 업로드 중 오류가 발생했습니다.');
      }
    };

    input.click();
  }, [execCommand]);

  // 테이블 삽입 핸들러
  const handleTableInsert = useCallback(() => {
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
            <td style="border: 1px solid #ddd; padding: 12px;">내용 2</td>
            <td style="border: 1px solid #ddd; padding: 12px;">내용 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px;">내용 4</td>
            <td style="border: 1px solid #ddd; padding: 12px;">내용 5</td>
            <td style="border: 1px solid #ddd; padding: 12px;">내용 6</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    execCommand('insertHTML', tableHtml);
    toast.success('테이블이 삽입되었습니다.');
  }, [execCommand]);

  // 헤딩 변경
  const changeHeading = useCallback((tag: string) => {
    if (tag === 'p') {
      execCommand('formatBlock', '<p>');
    } else {
      execCommand('formatBlock', `<${tag}>`);
    }
  }, [execCommand]);

  return (
    <div className="simple-rich-editor border rounded-lg overflow-hidden">
      {/* 툴바 */}
      <div className="toolbar flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* 실행 취소/다시 실행 */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('undo')}
            className="h-8 w-8 p-0"
            title="실행 취소"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('redo')}
            className="h-8 w-8 p-0"
            title="다시 실행"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* 헤딩 선택 */}
        <select
          className="px-2 py-1 border rounded text-sm mr-2"
          onChange={(e) => changeHeading(e.target.value)}
          defaultValue="p"
        >
          <option value="p">본문</option>
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
          onChange={(e) => changeFontSize(e.target.value)}
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
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            className="h-8 w-8 p-0"
            title="굵게"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            className="h-8 w-8 p-0"
            title="기울임"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('underline')}
            className="h-8 w-8 p-0"
            title="밑줄"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        {/* 폰트 색상 */}
        <div className="flex items-center gap-1 mr-2">
          <input
            type="color"
            value={fontColor}
            onChange={(e) => changeFontColor(e.target.value)}
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
            onClick={() => execCommand('justifyLeft')}
            className="h-8 w-8 p-0"
            title="왼쪽 정렬"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyCenter')}
            className="h-8 w-8 p-0"
            title="가운데 정렬"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyRight')}
            className="h-8 w-8 p-0"
            title="오른쪽 정렬"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* 목록 */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertUnorderedList')}
            className="h-8 w-8 p-0"
            title="순서 없는 목록"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertOrderedList')}
            className="h-8 w-8 p-0"
            title="순서 있는 목록"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* 이미지 및 테이블 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImageUpload}
            className="h-8 w-8 p-0"
            title="이미지 삽입"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTableInsert}
            className="h-8 w-8 p-0"
            title="테이블 삽입"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={(e) => {
          // 붙여넣기 시 일반 텍스트로 변환
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          execCommand('insertText', text);
        }}
        className="editor-content"
        style={{
          minHeight: height,
          padding: '12px',
          outline: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* 스타일 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .editor-content:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
          }
          
          .editor-content h1 { font-size: 2em; font-weight: bold; margin: 16px 0 8px 0; }
          .editor-content h2 { font-size: 1.5em; font-weight: bold; margin: 14px 0 8px 0; }
          .editor-content h3 { font-size: 1.25em; font-weight: bold; margin: 12px 0 8px 0; }
          .editor-content h4 { font-size: 1.1em; font-weight: bold; margin: 10px 0 8px 0; }
          .editor-content h5 { font-size: 1em; font-weight: bold; margin: 8px 0 6px 0; }
          .editor-content h6 { font-size: 0.9em; font-weight: bold; margin: 8px 0 6px 0; }
          
          .editor-content p { margin: 0 0 8px 0; }
          
          .editor-content ul, .editor-content ol {
            margin: 8px 0;
            padding-left: 24px;
          }
          
          .editor-content li {
            margin: 4px 0;
          }
          
          .editor-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
            border: 1px solid #ddd;
          }
          
          .editor-content table th,
          .editor-content table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          
          .editor-content table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          
          .editor-content table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .editor-content img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 10px 0;
          }
          
          .editor-content blockquote {
            border-left: 4px solid #ccc;
            margin: 16px 0;
            padding: 8px 16px;
            background-color: #f9f9f9;
            font-style: italic;
          }
        `
      }} />
    </div>
  );
}; 