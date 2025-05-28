-- 사용자 온라인 상태 관리를 위한 컬럼 추가
-- 파일명: 013_add_online_status_columns.sql

-- users 테이블에 온라인 상태 관련 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS current_page TEXT DEFAULT NULL;

-- 기존 updated_at 컬럼이 없는 경우에만 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_is_online ON public.users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at);

-- 기본값 설정: 기존 사용자들을 오프라인으로 설정
UPDATE public.users 
SET 
    is_online = false,
    last_seen = NOW(),
    updated_at = NOW()
WHERE is_online IS NULL;

-- 주석 추가
COMMENT ON COLUMN public.users.is_online IS '현재 온라인 상태 여부';
COMMENT ON COLUMN public.users.last_seen IS '마지막 활동 시간';
COMMENT ON COLUMN public.users.current_page IS '현재 방문 중인 페이지';
COMMENT ON COLUMN public.users.updated_at IS '마지막 업데이트 시간'; 