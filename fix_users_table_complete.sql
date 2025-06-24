-- users 테이블 완전 수정 스크립트 (사용자 편집 문제 해결)
-- 모든 누락된 컬럼과 제약조건을 한번에 해결

-- 1. 기본 프로필 관련 컬럼들 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_page TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- 2. 관계형 참조 컬럼들 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS corporation_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS position_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. 국가 정보 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country VARCHAR(10);

-- 4. 추가 메타데이터 컬럼들
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. 컬럼 설명 추가
COMMENT ON COLUMN public.users.avatar IS '사용자 프로필 이미지 URL';
COMMENT ON COLUMN public.users.current_page IS '현재 사용자가 보고 있는 페이지';
COMMENT ON COLUMN public.users.is_online IS '사용자 온라인 상태';
COMMENT ON COLUMN public.users.last_seen IS '마지막 접속 시간';
COMMENT ON COLUMN public.users.department_id IS '부서 참조 ID';
COMMENT ON COLUMN public.users.corporation_id IS '법인 참조 ID';
COMMENT ON COLUMN public.users.position_id IS '직책 참조 ID';
COMMENT ON COLUMN public.users.is_active IS '계정 활성화 상태';
COMMENT ON COLUMN public.users.country IS '사용자 소속 국가 코드';
COMMENT ON COLUMN public.users.phone IS '연락처';

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_corporation_id ON public.users(corporation_id);
CREATE INDEX IF NOT EXISTS idx_users_position_id ON public.users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users(country);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 7. 기존 사용자들의 기본값 설정
UPDATE public.users 
SET 
  country = 'KR',
  is_active = true,
  created_at = COALESCE(created_at, NOW()),
  updated_at = NOW()
WHERE country IS NULL OR is_active IS NULL;

-- 8. updated_at 자동 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 성공 메시지
SELECT 'users 테이블이 완전히 수정되었습니다!' as message; 