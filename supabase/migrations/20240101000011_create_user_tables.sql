-- 부서 테이블
CREATE TABLE public.departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 직책 테이블
CREATE TABLE public.positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  level INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 법인 테이블
CREATE TABLE public.corporations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  country VARCHAR(100),
  type VARCHAR(50) CHECK (type IN ('headquarters', 'sales', 'factory')),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 사용자 테이블 (Supabase Auth와 연동)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  position_id UUID REFERENCES public.positions(id),
  corporation_id UUID REFERENCES public.corporations(id),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  phone VARCHAR(50),
  login_method VARCHAR(50) DEFAULT 'email',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 매니저 테이블
CREATE TABLE public.managers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 직원 테이블 (상세 정보)
CREATE TABLE public.employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  english_name VARCHAR(100),
  user_id UUID REFERENCES public.users(id),
  corporation_id UUID REFERENCES public.corporations(id),
  department_id UUID REFERENCES public.departments(id),
  position_id UUID REFERENCES public.positions(id),
  hire_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_department_id ON public.users(department_id);
CREATE INDEX idx_users_corporation_id ON public.users(corporation_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);

CREATE INDEX idx_managers_email ON public.managers(email);
CREATE INDEX idx_managers_department_id ON public.managers(department_id);

CREATE INDEX idx_employees_employee_number ON public.employees(employee_number);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_department_id ON public.employees(department_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON public.departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at 
    BEFORE UPDATE ON public.positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporations_updated_at 
    BEFORE UPDATE ON public.corporations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_managers_updated_at 
    BEFORE UPDATE ON public.managers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON public.employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 부서 정책 (모든 사용자 읽기 가능, 관리자만 수정)
CREATE POLICY "Anyone can read departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 직책 정책
CREATE POLICY "Anyone can read positions" ON public.positions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage positions" ON public.positions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 법인 정책
CREATE POLICY "Anyone can read corporations" ON public.corporations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage corporations" ON public.corporations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 사용자 정책
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 매니저 정책
CREATE POLICY "Anyone can read managers" ON public.managers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage managers" ON public.managers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 직원 정책
CREATE POLICY "Users can read employees" ON public.employees
  FOR SELECT USING (true);

CREATE POLICY "Users can update own employee record" ON public.employees
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 기본 부서 데이터 삽입
INSERT INTO public.departments (name, code, description) VALUES
('영업', 'sales', '영업 및 고객 관리'),
('개발', 'development', '제품 개발 및 연구'),
('제조', 'manufacturing', '제품 제조 및 생산'),
('품질', 'quality', '품질 관리 및 보증'),
('경리', 'finance', '재무 및 회계'),
('경영', 'management', '경영 및 전략'),
('관리', 'administration', '총무 및 인사'),
('엔지니어링', 'engineering', '기술 엔지니어링'),
('연구개발', 'rnd', '연구 개발'),
('생산', 'production', '생산 관리'),
('품질보증', 'qa', '품질 보증');

-- 기본 직책 데이터 삽입
INSERT INTO public.positions (name, code, level, description) VALUES
('사원', 'associate', 1, '신입 사원'),
('사우', 'staff', 2, '일반 직원'),
('프로', 'pro', 3, '전문가'),
('리더', 'leader', 4, '팀 리더'),
('멘토', 'mentor', 5, '멘토'),
('대표', 'ceo', 10, '최고 경영자'),
('회장', 'chairman', 11, '회장');

-- 기본 법인 데이터 삽입
INSERT INTO public.corporations (name, code, country, type) VALUES
('코일마스터 본사', 'CM_HQ', 'Korea', 'headquarters'),
('코일마스터 영업', 'CM_SALES', 'Korea', 'sales'),
('코일마스터 공장', 'CM_FACTORY', 'Korea', 'factory');

-- 테이블 코멘트
COMMENT ON TABLE public.departments IS '부서 정보';
COMMENT ON TABLE public.positions IS '직책 정보';
COMMENT ON TABLE public.corporations IS '법인 정보';
COMMENT ON TABLE public.users IS '사용자 정보 (Supabase Auth 연동)';
COMMENT ON TABLE public.managers IS '매니저 정보';
COMMENT ON TABLE public.employees IS '직원 상세 정보';

-- 컬럼 코멘트
COMMENT ON COLUMN public.users.id IS 'Supabase Auth 사용자 ID와 연동';
COMMENT ON COLUMN public.users.role IS '사용자 역할: admin, manager, user';
COMMENT ON COLUMN public.users.login_method IS '로그인 방식: email, microsoft, google';
COMMENT ON COLUMN public.corporations.type IS '법인 유형: headquarters, sales, factory'; 