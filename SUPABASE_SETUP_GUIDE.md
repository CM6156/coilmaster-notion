# Supabase 설정 가이드

이 가이드는 Coilmaster 기업 시스템에 필요한 Supabase 데이터베이스 테이블을 설정하는 방법을 안내합니다.

## 필수 테이블 생성하기

데이터 관리 기능을 사용하기 위해서는 다음 테이블들이 필요합니다:
- `system_logs`: 시스템 로그를 저장하는 테이블
- `backup_records`: 백업 기록을 저장하는 테이블
- `export_records`: 데이터 내보내기 기록을 저장하는 테이블
- `import_records`: 데이터 가져오기 기록을 저장하는 테이블
- `database_statistics`: 데이터베이스 통계를 저장하는 테이블

## 방법 1: SQL 편집기 사용하기

1. [Supabase 대시보드](https://supabase.com)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 **SQL 편집기**를 클릭합니다.
4. 새 쿼리를 생성하고 `create_essential_tables.sql` 파일의 내용을 복사하여 붙여넣습니다.
5. **실행** 버튼을 클릭하여 SQL을 실행합니다.

## 방법 2: 마이그레이션 사용하기

Supabase CLI를 사용하여 마이그레이션을 적용할 수 있습니다:

1. Supabase CLI가 설치되어 있는지 확인합니다.
   ```bash
   npm install -g supabase
   ```

2. 로컬 개발 환경에서 Supabase 로그인:
   ```bash
   supabase login
   ```

3. 마이그레이션 실행:
   ```bash
   supabase db push
   ```

## 방법 3: 테이블 UI로 직접 생성하기

Supabase 대시보드에서 테이블을 직접 생성할 수도 있습니다:

1. [Supabase 대시보드](https://supabase.com)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 **테이블 편집기**를 클릭합니다.
4. **테이블 생성** 버튼을 클릭합니다.
5. 필요한 각 테이블을 생성하고 필드를 추가합니다. 스키마는 `create_essential_tables.sql` 파일을 참조하세요.

## 주의사항

- 테이블이 생성되기 전까지 애플리케이션은 모의 데이터를 사용하여 UI를 표시합니다.
- 데이터베이스 테이블 생성 후에는 애플리케이션을 재시작하세요.
- 모든 테이블에 RLS(Row Level Security) 정책이 적용되어 있으며, 현재 모든 사용자가 접근 가능하도록 설정되어 있습니다. 필요한 경우 RLS 정책을 수정하세요.

## 문제 해결

테이블 생성 중 오류가 발생하는 경우:

1. Supabase 프로젝트의 PostgreSQL 버전이 14 이상인지 확인하세요.
2. `gen_random_uuid()` 함수가 지원되지 않는 경우 `uuid_generate_v4()`로 대체할 수 있습니다.
3. RLS 정책 적용 중 오류가 발생하면, RLS 부분을 제외하고 먼저 테이블만 생성한 후 나중에 RLS를 적용하세요.
