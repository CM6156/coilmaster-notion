-- ========================================
-- 할일 관리 및 개인 업무 일지 테이블 생성
-- ========================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 할일 관리 테이블 (todos)
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    completed BOOLEAN DEFAULT false,
    due_date DATE,
    completion_date TIMESTAMP WITH TIME ZONE,
    
    -- 소유자 정보
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID, -- employees 테이블 참조 (있는 경우)
    
    -- 연관 정보 (선택사항)
    project_id UUID, -- projects 테이블 참조
    task_id UUID,    -- tasks 테이블 참조
    
    -- 메타데이터
    tags TEXT[], -- 태그 배열
    notes TEXT,
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 개인 업무 일지 테이블 (personal_journals)
CREATE TABLE IF NOT EXISTS public.personal_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    
    -- 일지 내용 (EmployeeDetail.tsx에서 사용하는 구조)
    plans TEXT,         -- 오늘의 계획
    completed TEXT,     -- 완료한 업무
    notes TEXT,         -- 특이사항 및 메모
    next_day_plans TEXT, -- 내일 할 일
    
    -- 소유자 정보
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID, -- employees 테이블 참조 (있는 경우)
    author_name VARCHAR(255),
    
    -- 메타데이터
    mood VARCHAR(20), -- 기분 상태 (선택사항)
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    total_hours DECIMAL(4,2), -- 총 근무시간
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- 한 사용자당 하루에 하나의 일지만 허용
    UNIQUE(user_id, date)
);

-- 3. 인덱스 생성
-- todos 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_employee_id ON public.todos(employee_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_status ON public.todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON public.todos(created_at);

-- personal_journals 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_personal_journals_user_id ON public.personal_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_journals_employee_id ON public.personal_journals(employee_id);
CREATE INDEX IF NOT EXISTS idx_personal_journals_date ON public.personal_journals(date);
CREATE INDEX IF NOT EXISTS idx_personal_journals_created_at ON public.personal_journals(created_at);

-- 4. 트리거 함수 생성 (업데이트 시간 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 설정
-- todos 테이블 트리거
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON public.todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- personal_journals 테이블 트리거
DROP TRIGGER IF EXISTS update_personal_journals_updated_at ON public.personal_journals;
CREATE TRIGGER update_personal_journals_updated_at 
    BEFORE UPDATE ON public.personal_journals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 설정
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_journals ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 설정

-- todos 테이블 정책
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
CREATE POLICY "Users can view their own todos" 
ON public.todos 
FOR SELECT
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own todos" ON public.todos;
CREATE POLICY "Users can create their own todos" 
ON public.todos 
FOR INSERT
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
CREATE POLICY "Users can update their own todos" 
ON public.todos 
FOR UPDATE
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;
CREATE POLICY "Users can delete their own todos" 
ON public.todos 
FOR DELETE
TO authenticated 
USING (auth.uid() = user_id);

-- personal_journals 테이블 정책
DROP POLICY IF EXISTS "Users can view their own personal journals" ON public.personal_journals;
CREATE POLICY "Users can view their own personal journals" 
ON public.personal_journals 
FOR SELECT
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own personal journals" ON public.personal_journals;
CREATE POLICY "Users can create their own personal journals" 
ON public.personal_journals 
FOR INSERT
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own personal journals" ON public.personal_journals;
CREATE POLICY "Users can update their own personal journals" 
ON public.personal_journals 
FOR UPDATE
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own personal journals" ON public.personal_journals;
CREATE POLICY "Users can delete their own personal journals" 
ON public.personal_journals 
FOR DELETE
TO authenticated 
USING (auth.uid() = user_id);

-- 8. 관리자 정책 (모든 데이터 접근 가능)
-- todos 관리자 정책
DROP POLICY IF EXISTS "Admins can access all todos" ON public.todos;
CREATE POLICY "Admins can access all todos" 
ON public.todos 
FOR ALL
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        JOIN public.user_profiles ON auth.users.id = user_profiles.id
        WHERE auth.users.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        JOIN public.user_profiles ON auth.users.id = user_profiles.id
        WHERE auth.users.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- personal_journals 관리자 정책
DROP POLICY IF EXISTS "Admins can access all personal journals" ON public.personal_journals;
CREATE POLICY "Admins can access all personal journals" 
ON public.personal_journals 
FOR ALL
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        JOIN public.user_profiles ON auth.users.id = user_profiles.id
        WHERE auth.users.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        JOIN public.user_profiles ON auth.users.id = user_profiles.id
        WHERE auth.users.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- 9. 샘플 데이터 (선택사항)
-- INSERT INTO public.todos (title, description, priority, due_date, user_id) VALUES 
-- ('프로젝트 계획서 작성', '새 프로젝트의 초기 계획서를 작성합니다.', 'High', CURRENT_DATE + INTERVAL '3 days', auth.uid());

-- INSERT INTO public.personal_journals (date, plans, completed, notes, next_day_plans, user_id) VALUES 
-- (CURRENT_DATE, '프로젝트 회의 참석\n코드 리뷰 진행', '회의록 작성 완료\n3개 버그 수정', '클라이언트 요구사항 변경됨', '새로운 기능 설계 시작', auth.uid());

-- 완료 메시지
SELECT '✅ 할일 관리 및 개인 업무 일지 테이블이 성공적으로 생성되었습니다!' as message;
SELECT '📋 다음 테이블들이 생성되었습니다:' as tables_created;
SELECT '  - todos: 개인 할일 관리' as table_1;
SELECT '  - personal_journals: 개인 업무 일지 (plans, completed, notes, next_day_plans)' as table_2;
SELECT '🔒 RLS 보안 정책이 적용되었습니다.' as security_status; 