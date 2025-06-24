-- Supabase Storage 정책 설정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. uploads 버킷에 대한 정책 설정
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- 인증된 사용자가 업로드 가능하도록 설정
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- 인증된 사용자가 자신의 파일을 업데이트 가능하도록 설정
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated') WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- 인증된 사용자가 자신의 파일을 삭제 가능하도록 설정
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- 2. work-journal-images 버킷에 대한 정책 설정 (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'work-journal-images') THEN
    -- 모든 사용자가 읽기 가능
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access work-journal-images') THEN
      EXECUTE 'CREATE POLICY "Public Access work-journal-images" ON storage.objects FOR SELECT USING (bucket_id = ''work-journal-images'')';
    END IF;
    
    -- 인증된 사용자가 업로드 가능
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated upload work-journal-images') THEN
      EXECUTE 'CREATE POLICY "Authenticated upload work-journal-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''work-journal-images'' AND auth.role() = ''authenticated'')';
    END IF;
  END IF;
END $$;

-- 3. 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
ORDER BY policyname; 