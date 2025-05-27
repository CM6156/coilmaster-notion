# 프로필 시스템 설정 가이드

## 개요
이 가이드는 Coilmaster Notion 시스템의 프로필 기능과 부서 연동을 위한 Supabase 설정 방법을 설명합니다.

## 1. Supabase 마이그레이션 실행

### 1.1 마이그레이션 파일 적용
다음 마이그레이션 파일을 Supabase SQL 에디터에서 실행하세요:

```sql
-- 파일: supabase/migrations/20240101000012_fix_user_profile_system.sql
```

이 마이그레이션은 다음을 수행합니다:
- 사용자 테이블에 필요한 컬럼 추가 (role, avatar, last_seen, current_page, status)
- 부서, 직책, 법인 정보를 포함한 사용자 프로필 뷰 생성
- 프로필 업데이트를 위한 Supabase 함수들 생성
- 온라인 사용자 추적 함수들 생성
- 기본 부서, 직책, 법인 데이터 삽입

### 1.2 수동 마이그레이션 (자동 실행 실패 시)

만약 마이그레이션 자동 실행이 실패한다면, Supabase Dashboard의 SQL Editor에서 다음 단계를 수동으로 실행하세요:

#### 단계 1: 컬럼 추가
```sql
-- users 테이블에 필요한 컬럼들 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_page VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'offline';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
```

#### 단계 2: 뷰 생성
```sql
-- 기존 뷰 삭제 (있다면)
DROP VIEW IF EXISTS public.user_profiles;

-- 사용자 프로필 뷰 생성
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.avatar_url,
    u.avatar,
    u.phone,
    u.login_method,
    u.last_login,
    u.last_seen,
    u.current_page,
    u.status,
    u.created_at,
    u.updated_at,
    d.id as department_id,
    d.name as department_name,
    d.code as department_code,
    p.id as position_id,
    p.name as position_name,
    p.code as position_code,
    c.id as corporation_id,
    c.name as corporation_name,
    c.code as corporation_code,
    c.country as corporation_country
FROM public.users u
LEFT JOIN public.departments d ON u.department_id = d.id
LEFT JOIN public.positions p ON u.position_id = p.id
LEFT JOIN public.corporations c ON u.corporation_id = c.id;
```

#### 단계 3: 함수 생성
마이그레이션 파일의 나머지 함수들을 순서대로 실행하세요.

## 2. 기능 설명

### 2.1 개선된 프로필 기능
- **실시간 부서 목록**: 관리자 패널에서 등록된 부서가 프로필 페이지에 자동 반영
- **Supabase 연동**: 프로필 수정 시 실제 데이터베이스에 저장
- **다국어 지원**: 모든 텍스트가 번역 키를 사용하여 다국어 지원
- **전화번호 필드**: 새로운 전화번호 입력 필드 추가

### 2.2 부서 관리 시스템
- **관리자 패널**: `/admin` → 부서 관리에서 부서 추가/수정 가능
- **실시간 연동**: 부서 추가 시 프로필 페이지 드롭다운에 즉시 반영
- **코드 기반**: 부서 코드를 통한 일관된 데이터 관리

### 2.3 온라인 사용자 추적
- **실시간 상태**: 사용자의 온라인/오프라인 상태 실시간 추적
- **페이지 추적**: 현재 사용자가 어느 페이지에 있는지 추적
- **자동 오프라인**: 5분 이상 비활성 시 자동 오프라인 처리

## 3. 사용 방법

### 3.1 부서 등록
1. 관리자 권한으로 로그인
2. 사이드바에서 "관리자 패널" 클릭
3. "부서 관리" 탭 선택
4. "새 부서 등록" 버튼 클릭
5. 부서명, 코드, 설명 입력 후 저장

### 3.2 프로필 수정
1. 사이드바 하단의 프로필 아이콘 클릭
2. "개인 정보" 탭에서 정보 수정
3. 부서 드롭다운에서 새로 등록된 부서 선택 가능
4. "저장" 버튼 클릭하여 Supabase에 업데이트

## 4. 문제 해결

### 4.1 부서 목록이 로드되지 않는 경우
```sql
-- departments 테이블 확인
SELECT * FROM public.departments;

-- get_departments 함수 확인
SELECT * FROM get_departments();
```

### 4.2 프로필 업데이트가 실패하는 경우
```sql
-- users 테이블 구조 확인
\d public.users

-- update_user_profile 함수 확인
SELECT update_user_profile(
    '사용자ID'::uuid,
    '이름',
    'email@example.com',
    '부서ID'::uuid,
    null,
    null,
    '전화번호',
    null
);
```

### 4.3 권한 문제
RLS 정책이 올바르게 설정되었는지 확인:
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 5. 데이터베이스 스키마

### 5.1 users 테이블
```sql
users (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255),
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    corporation_id UUID REFERENCES corporations(id),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    avatar TEXT,
    phone VARCHAR(50),
    login_method VARCHAR(50),
    last_login TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    current_page VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline',
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

### 5.2 departments 테이블
```sql
departments (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

## 6. API 함수들

### 6.1 프로필 관련
- `update_user_profile()`: 사용자 프로필 업데이트
- `get_departments()`: 부서 목록 조회

### 6.2 온라인 상태 관련
- `update_user_activity()`: 사용자 활동 상태 업데이트
- `get_online_users()`: 온라인 사용자 목록 조회
- `set_user_offline()`: 사용자 오프라인 상태 설정

## 7. 지원

문제가 발생하거나 추가 기능이 필요한 경우 개발팀에 문의하세요.

---

**마지막 업데이트**: 2024년 1월
**버전**: 1.0.0 