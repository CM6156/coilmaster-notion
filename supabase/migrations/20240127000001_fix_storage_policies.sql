-- Storage 버킷 조회를 위한 RLS 정책 수정
-- 이 마이그레이션은 Storage 버킷 조회 권한 문제를 해결합니다.

-- 1. Storage buckets 테이블에 대한 정책 생성
-- 모든 인증된 사용자가 버킷 목록을 조회할 수 있도록 허용
CREATE POLICY "Allow authenticated users to list buckets" ON storage.buckets
FOR SELECT TO authenticated
USING (true);

-- 2. Storage objects 테이블에 대한 정책 생성
-- project-files 버킷의 파일들을 조회할 수 있도록 허용
CREATE POLICY "Allow authenticated users to view project files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'project-files');

-- 3. project-files 버킷의 파일 업로드 허용
CREATE POLICY "Allow authenticated users to upload project files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- 4. project-files 버킷의 파일 업데이트 허용
CREATE POLICY "Allow authenticated users to update project files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'project-files');

-- 5. project-files 버킷의 파일 삭제 허용
CREATE POLICY "Allow authenticated users to delete project files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'project-files');

-- 6. documents 버킷에 대한 정책들
CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

-- 7. avatars 버킷에 대한 정책들
CREATE POLICY "Allow authenticated users to view avatars" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 8. temp-files 버킷에 대한 정책들 (사용자별 제한)
CREATE POLICY "Allow users to manage their temp files" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'temp-files' AND auth.uid()::text = (storage.foldername(name))[1]); 