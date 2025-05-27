# 데이터베이스 설정 가이드

## 📁 파일 구조

```
database/
├── phases.sql                    # phases 테이블 생성 및 기본 데이터
├── update_projects_for_phases.sql # projects 테이블 단계 연동 업데이트
└── README.md                     # 이 파일
```

## 🚀 설정 순서

### 1. phases 테이블 생성
```sql
-- database/phases.sql 파일 실행
\i database/phases.sql
```

### 2. projects 테이블 업데이트
```sql
-- database/update_projects_for_phases.sql 파일 실행
\i database/update_projects_for_phases.sql
```

## 📊 phases 테이블 구조

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 단계 고유 식별자 (Primary Key) |
| `name` | VARCHAR(100) | 단계명 (NOT NULL) |
| `description` | TEXT | 단계 설명 |
| `color` | VARCHAR(7) | 표시 색상 (HEX 코드) |
| `order_index` | INTEGER | 단계 순서 (NOT NULL) |
| `is_active` | BOOLEAN | 활성 상태 여부 |
| `created_at` | TIMESTAMP | 생성 일시 |
| `updated_at` | TIMESTAMP | 수정 일시 |

## 🔐 보안 정책 (RLS)

### 읽기 권한
- **모든 인증된 사용자**: phases 테이블 조회 가능

### 쓰기 권한 
- **관리자만**: phases 생성/수정/삭제 가능
- 관리자 판별 방법:
  1. JWT 토큰의 role이 'admin'
  2. users 테이블의 role이 'admin'

## 📋 기본 데이터

테이블 생성 시 다음 기본 단계들이 자동으로 추가됩니다:

1. **기획** (파란색) - 프로젝트 기획 및 계획 수립 단계
2. **개발** (주황색) - 제품 개발 및 설계 단계  
3. **제조** (초록색) - 제조 공정 설계 및 준비 단계
4. **품질** (보라색) - 품질 검증 및 테스트 단계
5. **양산** (빨간색) - 대량 생산 및 출하 단계
6. **영업** (분홍색) - 영업 및 마케팅 단계

## 🔄 projects 테이블 연동

### 기존 데이터 마이그레이션
- 기존 `current_phase` 문자열 값을 `current_phase_id` UUID로 자동 변환
- 매핑 규칙:
  - `'planning'` 또는 `'기획'` → 기획 단계 ID
  - `'development'` 또는 `'개발'` → 개발 단계 ID
  - 기타 등등...

### 새로운 컬럼
- `current_phase_id`: phases 테이블의 ID를 참조하는 외래키

### 편의 뷰
`projects_with_phases` 뷰를 통해 프로젝트와 단계 정보를 조인하여 조회 가능

## 🛠️ Supabase 설정

### 1. Supabase Dashboard에서 실행
1. Supabase 프로젝트 대시보드 접속
2. **SQL Editor** 탭 이동
3. 위 SQL 파일들을 순서대로 실행

### 2. CLI를 통한 실행
```bash
# Supabase CLI 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_ID

# SQL 파일 실행
supabase db push

# 또는 개별 파일 실행
psql -h YOUR_DB_HOST -U postgres -d postgres -f database/phases.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f database/update_projects_for_phases.sql
```

## ✅ 확인 방법

설정이 완료되면 다음을 확인해보세요:

```sql
-- phases 테이블 확인
SELECT * FROM phases ORDER BY order_index;

-- projects와 phases 조인 확인
SELECT 
    p.name as project_name,
    ph.name as phase_name,
    ph.color as phase_color
FROM projects p
LEFT JOIN phases ph ON p.current_phase_id = ph.id
LIMIT 5;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'phases';
```

## 🐛 트러블슈팅

### 권한 오류
```sql
-- 사용자에게 관리자 권한 부여
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 데이터 확인
```sql
-- 기본 단계 데이터가 제대로 들어갔는지 확인
SELECT COUNT(*) FROM phases WHERE is_active = true;
-- 결과: 6개 행이 나와야 함
```

### 외래키 제약조건 오류
```sql
-- projects 테이블의 current_phase_id가 유효한지 확인
SELECT p.id, p.name, p.current_phase_id, ph.name as phase_name
FROM projects p
LEFT JOIN phases ph ON p.current_phase_id = ph.id
WHERE p.current_phase_id IS NOT NULL AND ph.id IS NULL;
-- 결과가 없어야 함 (모든 참조가 유효해야 함)
``` 