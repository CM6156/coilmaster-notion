-- 파일 업로드를 위한 Storage 버킷 및 테이블 생성
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 1. project-files 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files', 
  true,  -- 공개 버킷으로 설정
  10485760,  -- 10MB 제한
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. project_attachments 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS project_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_path TEXT,
  content_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. project_attachments 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_created_at ON project_attachments(created_at DESC);

-- 4. project_attachments 테이블의 RLS (Row Level Security) 정책 설정
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY IF NOT EXISTS "project_attachments_select_policy" ON project_attachments
  FOR SELECT USING (true);

-- 인증된 사용자만 삽입 가능
CREATE POLICY IF NOT EXISTS "project_attachments_insert_policy" ON project_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 파일을 업로드한 사용자 또는 관리자만 삭제 가능
CREATE POLICY IF NOT EXISTS "project_attachments_delete_policy" ON project_attachments
  FOR DELETE USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = auth.users.id 
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 5. Storage에 대한 RLS 정책 설정
-- project-files 버킷에 대한 SELECT 정책 (모든 사용자 읽기 가능)
CREATE POLICY IF NOT EXISTS "project_files_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-files');

-- project-files 버킷에 대한 INSERT 정책 (인증된 사용자만 업로드 가능)
CREATE POLICY IF NOT EXISTS "project_files_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND 
    auth.role() = 'authenticated'
  );

-- project-files 버킷에 대한 DELETE 정책 (인증된 사용자만 삭제 가능)
CREATE POLICY IF NOT EXISTS "project_files_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files' AND 
    auth.role() = 'authenticated'
  );

-- 6. 업데이트 트리거 함수 및 트리거 생성
CREATE OR REPLACE FUNCTION update_project_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS project_attachments_updated_at
  BEFORE UPDATE ON project_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_attachments_updated_at();

-- 완료 메시지
SELECT 'Storage 버킷과 project_attachments 테이블이 성공적으로 생성되었습니다!' as result; 