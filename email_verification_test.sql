-- ========================================
-- 이메일 인증 기능 테스트 및 확인 SQL 스크립트
-- ========================================

-- 1. 현재 users 테이블의 email_verified 컬럼 상태 확인
SELECT 
    id,
    email,
    name,
    email_verified,
    created_at,
    updated_at,
    CASE 
        WHEN email_verified = true THEN '✅ 인증완료'
        WHEN email_verified = false THEN '❌ 미인증'
        ELSE '❓ 알 수 없음'
    END as "인증상태"
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- 2. 특정 이메일의 인증 상태 확인
-- (테스트할 이메일로 변경하세요)
SELECT 
    email,
    email_verified,
    created_at,
    '이메일 인증 테스트 대상' as memo
FROM public.users 
WHERE email = 'test@coilmaster.com';

-- 3. 이메일 인증이 안된 사용자들 조회
SELECT 
    email,
    name,
    email_verified,
    created_at,
    '미인증 사용자' as status
FROM public.users 
WHERE email_verified = false 
ORDER BY created_at DESC;

-- 4. 테스트를 위한 임시 사용자 생성 (이메일 미인증 상태)
INSERT INTO public.users (
    email, 
    name, 
    email_verified, 
    role, 
    is_active, 
    login_method,
    created_at,
    updated_at
) 
SELECT 
    'verification-test@coilmaster.com',
    'Email Verification Test User',
    false,  -- 미인증 상태로 생성
    'user',
    true,
    'email',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = 'verification-test@coilmaster.com'
);

-- 5. 생성된 테스트 사용자 확인
SELECT 
    email,
    name,
    email_verified,
    '테스트 사용자 생성 완료' as status
FROM public.users 
WHERE email = 'verification-test@coilmaster.com';

-- 6. 이메일 인증 상태를 수동으로 업데이트하는 함수 (테스트용)
-- 사용법: SELECT verify_user_email('test@coilmaster.com');
CREATE OR REPLACE FUNCTION verify_user_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.users 
    SET 
        email_verified = true,
        updated_at = NOW()
    WHERE email = user_email;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    IF rows_updated > 0 THEN
        RETURN '✅ 이메일 인증 완료: ' || user_email;
    ELSE
        RETURN '❌ 사용자를 찾을 수 없음: ' || user_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. 이메일 인증 상태를 리셋하는 함수 (테스트용)
-- 사용법: SELECT reset_user_email('test@coilmaster.com');
CREATE OR REPLACE FUNCTION reset_user_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.users 
    SET 
        email_verified = false,
        updated_at = NOW()
    WHERE email = user_email;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    IF rows_updated > 0 THEN
        RETURN '🔄 이메일 인증 리셋 완료: ' || user_email;
    ELSE
        RETURN '❌ 사용자를 찾을 수 없음: ' || user_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. 이메일 인증 통계 조회
SELECT 
    COUNT(*) as "전체사용자",
    COUNT(CASE WHEN email_verified = true THEN 1 END) as "인증완료",
    COUNT(CASE WHEN email_verified = false THEN 1 END) as "미인증",
    ROUND(
        COUNT(CASE WHEN email_verified = true THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as "인증율%"
FROM public.users;

-- 9. 테스트 시나리오 예시
/*
테스트 순서:
1. 위 스크립트 실행으로 테스트 사용자 생성
2. 웹에서 verification-test@coilmaster.com으로 회원가입
3. 이메일 인증 링크 클릭하여 /email-verification 페이지 접속
4. "이메일 인증하기" 버튼 클릭
5. 아래 쿼리로 결과 확인:
*/

SELECT 
    email,
    email_verified,
    updated_at,
    CASE 
        WHEN email_verified = true THEN '🎉 인증 성공!'
        ELSE '⏳ 인증 대기 중...'
    END as result
FROM public.users 
WHERE email = 'verification-test@coilmaster.com';

-- 10. 테스트 데이터 정리 (필요시 사용)
-- DELETE FROM public.users WHERE email = 'verification-test@coilmaster.com';

-- 완료 메시지
SELECT '✅ 이메일 인증 테스트 스크립트 실행 완료!' as message; 