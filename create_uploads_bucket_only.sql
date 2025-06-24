-- uploads 버킷만 생성 (가장 간단한 버전)
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- uploads 버킷 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 버킷 생성 확인
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'uploads'; 