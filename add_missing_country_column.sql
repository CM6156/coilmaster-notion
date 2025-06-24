-- users 테이블에 country 컬럼 추가
-- 오류: Could not find the 'country' column of 'users' in the schema cache

-- 1. country 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country VARCHAR(10);

-- 2. 컬럼 설명 추가  
COMMENT ON COLUMN public.users.country IS '사용자 소속 국가 코드 (KR, TH, CN 등)';

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users(country);

-- 4. 기존 사용자들의 기본값 설정 (한국으로 설정)
UPDATE public.users 
SET country = 'KR'
WHERE country IS NULL;

-- 성공 메시지
SELECT 'users 테이블에 country 컬럼이 성공적으로 추가되었습니다!' as message; 