import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  height = 300,
  disabled = false
}) => {
  const quillRef = useRef<ReactQuill>(null);

  // 이미지 업로드 핸들러
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('이미지 크기는 5MB 이하여야 합니다.');
          return;
        }

        // 안전한 파일명 생성
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `image_${timestamp}_${randomId}.${fileExtension}`;

        // Supabase Storage에 업로드
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(`work-journals/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Image upload error:', error);
          toast.error('이미지 업로드에 실패했습니다.');
          return;
        }

        // 공개 URL 가져오기
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(`work-journals/${fileName}`);

        if (urlData?.publicUrl) {
          // Quill 에디터에 이미지 삽입
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, 'image', urlData.publicUrl);
            quill.setSelection((range?.index || 0) + 1, 0);
          }
          toast.success('이미지가 성공적으로 업로드되었습니다.');
        } else {
          toast.error('이미지 URL 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('Unexpected error during image upload:', error);
        toast.error('이미지 업로드 중 오류가 발생했습니다.');
      }
    };
  };

  // 테이블 핸들러 - 간단한 HTML 테이블 삽입
  const tableHandler = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
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
        quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
        quill.setSelection(range.index + 1, 0);
        toast.success('테이블이 삽입되었습니다.');
      }
    }
  };

  // Quill 모듈 설정
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'font': [] }],
          [{ 'size': ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'script': 'sub' }, { 'script': 'super' }],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'indent': '-1' }, { 'indent': '+1' }],
          [{ 'direction': 'rtl' }],
          [{ 'align': [] }],
          ['link', 'image', 'video'],
          ['blockquote', 'code-block'],
          [{ 'table': 'TD' }],
          ['clean']
        ],
        handlers: {
          image: imageHandler,
          table: tableHandler
        }
      },
      clipboard: {
        matchVisual: false
      }
    }),
    []
  );

  // Quill 포맷 설정
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block',
    'table'
  ];

  return (
    <div 
      className="quill-editor-container"
      style={{
        '--editor-height': `${height}px`
      } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .quill-editor-container .ql-editor {
            min-height: ${height}px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .quill-editor-container .ql-toolbar {
            border-top: 1px solid #ccc;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
            border-bottom: none;
            border-radius: 6px 6px 0 0;
          }
          
          .quill-editor-container .ql-container {
            border-bottom: 1px solid #ccc;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
            border-top: none;
            border-radius: 0 0 6px 6px;
          }

          .quill-editor-container .ql-editor.ql-blank::before {
            color: #9ca3af;
            font-style: italic;
          }

          .quill-editor-container .ql-editor table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
          }
          
          .quill-editor-container .ql-editor table td,
          .quill-editor-container .ql-editor table th {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          .quill-editor-container .ql-editor table th {
            background-color: #f2f2f2;
            font-weight: bold;
          }

          .quill-editor-container .ql-editor img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 10px 0;
          }

          /* 커스텀 테이블 버튼 스타일 */
          .quill-editor-container .ql-toolbar .ql-table {
            width: 28px;
            height: 24px;
          }
          
          .quill-editor-container .ql-toolbar .ql-table:after {
            content: "⊞";
            font-size: 16px;
            line-height: 1;
            color: #444;
          }
          
          .quill-editor-container .ql-toolbar .ql-table:hover:after {
            color: #06c;
          }

          /* 폰트 드롭다운 개선 */
          .quill-editor-container .ql-picker-options {
            max-height: 200px;
            overflow-y: auto;
          }

          /* 한국어 폰트 추가 */
          .quill-editor-container .ql-font-serif {
            font-family: 'Times New Roman', serif;
          }
          
          .quill-editor-container .ql-font-monospace {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          }

          .quill-editor-container .ql-font-korean {
            font-family: 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', sans-serif;
          }
        `
      }} />
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        readOnly={disabled}
      />
    </div>
  );
}; 