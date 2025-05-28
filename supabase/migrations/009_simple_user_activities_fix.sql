-- user_activities 테이블의 403 오류를 간단하게 해결하는 스크립트

-- 기존 정책 삭제 (존재하지 않아도 오류 없음)
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON user_activities;

-- user_activities 테이블이 존재하는지 확인하고 RLS 활성화
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activities') THEN
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
            
        -- 기본 인덱스만 생성 (user_id와 created_at)
        CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
            
        -- 30일 이상 된 로그 삭제
        DELETE FROM user_activities WHERE created_at < now() - INTERVAL '30 days';
        
        RAISE NOTICE 'user_activities 테이블 RLS 정책이 성공적으로 적용되었습니다.';
    ELSE
        RAISE NOTICE 'user_activities 테이블이 존재하지 않습니다. 필요시 별도로 생성해주세요.';
    END IF;
END $$; 