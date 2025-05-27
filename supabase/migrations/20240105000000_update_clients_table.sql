-- 클라이언트 테이블에 필요한 컬럼들 추가
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_rep_id UUID,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS homepage TEXT,
ADD COLUMN IF NOT EXISTS flag VARCHAR(10),
ADD COLUMN IF NOT EXISTS remark TEXT,
ADD COLUMN IF NOT EXISTS files TEXT[];

-- RLS (Row Level Security) 활성화
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 클라이언트 조회 가능
CREATE POLICY IF NOT EXISTS "Everyone can view clients" ON public.clients
  FOR SELECT USING (true);

-- 인증된 사용자만 클라이언트 생성 가능
CREATE POLICY IF NOT EXISTS "Authenticated users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (true);

-- 인증된 사용자만 클라이언트 수정 가능
CREATE POLICY IF NOT EXISTS "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (true);

-- 인증된 사용자만 클라이언트 삭제 가능
CREATE POLICY IF NOT EXISTS "Authenticated users can delete clients" ON public.clients
 