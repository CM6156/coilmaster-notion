-- managers 테이블에 profile_image 컬럼 추가
ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN public.managers.profile_image IS '담당자 프로필 이미지 URL';

-- 기존 데이터 확인
SELECT 
    id, 
    name, 
    email, 
    profile_image,
    created_at
FROM public.managers 
LIMIT 5;

-- 스키마 캐시 새로고침을 위해 PostgREST 재시작이 필요할 수 있습니다.
-- Supabase Dashboard에서 Settings > API > PostgREST 재시작을 해주세요. 