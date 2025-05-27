-- projects 테이블에 이미지 컬럼 추가
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS image TEXT;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.projects.image IS '프로젝트 메인 이미지 URL 또는 Base64 데이터'; 