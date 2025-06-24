-- 가장 간단한 Storage 정책 설정
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- uploads 버킷에 대해 모든 사용자가 모든 작업 가능하도록 설정 (개발용)
CREATE POLICY "Allow all for uploads" ON storage.objects FOR ALL USING (bucket_id = 'uploads');

-- 정책 확인
SELECT policyname, cmd, bucket_id FROM (
  SELECT 
    policyname,
    cmd,
    CASE 
      WHEN qual LIKE '%uploads%' THEN 'uploads'
      WHEN qual LIKE '%work-journal-images%' THEN 'work-journal-images'
      ELSE 'other'
    END as bucket_id
  FROM pg_policies 
  WHERE tablename = 'objects'
) sub 
WHERE bucket_id IN ('uploads', 'work-journal-images')
ORDER BY bucket_id, cmd; 