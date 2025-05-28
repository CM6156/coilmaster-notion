-- user_activities 테이블 처리
DO $$
BEGIN
    -- 테이블이 존재하지 않으면 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activities') THEN
        CREATE TABLE user_activities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            action VARCHAR(255) NOT NULL,
            page VARCHAR(255),
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    ELSE
        -- 기존 테이블에 필요한 컬럼들을 안전하게 추가
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_activities' AND column_name = 'action') THEN
            ALTER TABLE user_activities ADD COLUMN action VARCHAR(255) NOT NULL DEFAULT 'unknown';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_activities' AND column_name = 'page') THEN
            ALTER TABLE user_activities ADD COLUMN page VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_activities' AND column_name = 'ip_address') THEN
            ALTER TABLE user_activities ADD COLUMN ip_address INET;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_activities' AND column_name = 'user_agent') THEN
            ALTER TABLE user_activities ADD COLUMN user_agent TEXT;
        END IF;
    END IF;
END $$;

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON user_activities;

-- RLS 활성화
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- 새로운 RLS 정책 생성
-- 사용자는 자신의 활동만 볼 수 있음
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

-- 사용자는 자신의 활동만 삽입할 수 있음
CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 관리자는 모든 활동을 볼 수 있음
CREATE POLICY "Admins can view all activities" ON user_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 인덱스 생성 (성능 향상) - 안전하게 처리
DO $$
BEGIN
    -- 각 인덱스를 안전하게 생성
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_activities_user_id') THEN
        CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_activities_created_at') THEN
        CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);
    END IF;
    
    -- action 컬럼이 존재하는 경우에만 인덱스 생성
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_activities' AND column_name = 'action') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_activities_action') THEN
            CREATE INDEX idx_user_activities_action ON user_activities(action);
        END IF;
    END IF;
END $$;

-- 기존 데이터 정리 (30일 이상 된 활동 로그 삭제) - 안전하게 처리
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activities') THEN
        DELETE FROM user_activities WHERE created_at < now() - INTERVAL '30 days';
    END IF;
END $$; 