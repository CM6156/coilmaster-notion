-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('project-files', 'project-files', false),
    ('project-images', 'project-images', false),
    ('task-files', 'task-files', false),
    ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 버킷에 대한 RLS 정책 설정
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update project files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete project files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view project files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

-- 프로젝트 이미지 버킷 정책
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-images' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update project images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'project-images' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete project images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-images' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- 태스크 파일 버킷 정책
CREATE POLICY "Authenticated users can upload task files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update task files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'task-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete task files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view task files"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-files');

-- 사용자 아바타 버킷 정책
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'user-avatars' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-avatars' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars'); 