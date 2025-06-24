import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  height = 400,
  disabled = false
}) => {
  const editorRef = useRef<any>(null);

  // 안전한 파일명 생성 함수
  const createSafeFileName = (originalName: string): string => {
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    // 허용된 확장자 확인
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const safeExtension = allowedExtensions.includes(fileExtension) ? fileExtension : 'jpg';
    
    // 안전한 파일명 생성 (영문, 숫자, 하이픈, 언더스코어만 사용)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    return `image_${timestamp}_${randomId}.${safeExtension}`;
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const file = blobInfo.blob();
        // 안전한 파일명 생성
        const originalName = file.name || 'image.jpg';
        const fileName = createSafeFileName(originalName);

        progress(10);

        // uploads 버킷에 이미지 업로드 (가장 안정적)
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(`work-journals/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        progress(50);

        if (error) {
          console.error('Image upload error:', error);
          reject('이미지 업로드 실패: ' + error.message);
          return;
        }

        progress(80);

        // 공개 URL 가져오기
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(`work-journals/${fileName}`);

        progress(100);

        if (urlData?.publicUrl) {
          resolve(urlData.publicUrl);
        } else {
          reject('이미지 URL 생성 실패');
        }
      } catch (error) {
        console.error('Unexpected error during image upload:', error);
        reject('이미지 업로드 중 오류가 발생했습니다.');
      }
    });
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Editor
        apiKey="wj1bvstq9ypfuqq9x6nz5kr8mly0zno63yqci9lh5epns5vs"
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={(newValue) => onChange(newValue)}
        disabled={disabled}
        init={{
                    height: height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
            'importcss', 'autosave', 'powerpaste', 'advcode', 'visualchars', 
            'pagebreak', 'nonbreaking', 'directionality', 'quickbars'
          ],
          toolbar: 'undo redo | formatselect fontsize | ' +
            'bold italic underline strikethrough | forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | blockquote | ' +
            'removeformat | link image table emoticons | ' +
            'preview code fullscreen help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              font-size: 14px; 
              line-height: 1.6;
              margin: 1rem;
              color: #333;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            blockquote {
              border-left: 4px solid #ddd;
              margin: 1rem 0;
              padding-left: 1rem;
              color: #666;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            table td, table th {
              border: 1px solid #ddd;
              padding: 8px;
            }
          `,
                    placeholder: placeholder,
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
          resize: 'both',
          statusbar: true,
          elementpath: false,
          paste_data_images: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          images_upload_handler: handleImageUpload,
          images_upload_url: '',
          convert_urls: false,
          relative_urls: false,
          image_advtab: true,
          image_caption: true,
          quickbars_selection_toolbar: 'bold italic | link h2 h3 blockquote',
          quickbars_insert_toolbar: 'image table',
          contextmenu: 'link image table',
          setup: (editor) => {
            // 이미지 드롭 허용
            editor.on('drop', (e) => {
              const files = e.dataTransfer?.files;
              if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                  e.preventDefault();
                  // TinyMCE가 자동으로 처리하도록 함
                }
              }
            });
            
            // 클립보드에서 이미지 붙여넣기
            editor.on('paste', (e) => {
              const clipboardData = e.clipboardData || (window as any).clipboardData;
              if (clipboardData && clipboardData.files && clipboardData.files.length > 0) {
                const file = clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                  e.preventDefault();
                  // TinyMCE가 자동으로 처리하도록 함
                }
              }
            });
          },
          file_picker_callback: (callback, value, meta) => {
            // 파일 선택기
            if (meta.filetype === 'image') {
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    callback(reader.result as string, {
                      alt: file.name,
                      title: file.name
                    });
                  };
                  reader.readAsDataURL(file);
                }
              };
              
              input.click();
            }
          }
        }}
      />
    </div>
  );
}; 