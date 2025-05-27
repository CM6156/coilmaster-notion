# 프로필 시스템 테스트 가이드 🧪

## 🚀 테스트 전 준비

### 1단계: 마이그레이션 실행
```bash
cd /c/Program/coilmaster-corporate-system-main
supabase db push
```

### 2단계: 브라우저 개발자 도구 열기
- F12 키 또는 우클릭 → 검사
- Console 탭과 Network 탭 확인 준비

## ✅ 테스트 시나리오

### 📝 시나리오 1: 기본 로그인 및 프로필 접근
1. **로그인 시도**: 정상적인 계정으로 로그인
2. **프로필 접근**: 사이드바 하단 프로필 아이콘 클릭
3. **예상 결과**: 
   - ❌ 이전: `invalid input syntax for type uuid: "default-user-001"` 오류
   - ✅ 현재: 정상적으로 프로필 페이지 로드

### 🏢 시나리오 2: 부서 목록 확인
1. **관리자 패널 접속**: `/admin` → 부서 관리
2. **부서 등록**: "테스트 부서" 추가
3. **프로필에서 확인**: 프로필 → 개인 정보 → 부서 드롭다운
4. **예상 결과**: 등록한 부서가 선택 목록에 표시

### 💾 시나리오 3: 프로필 정보 업데이트
1. **정보 수정**: 이름, 이메일, 부서, 전화번호 변경
2. **저장**: "저장" 버튼 클릭
3. **예상 결과**: 
   - 성공 토스트 메시지 표시
   - 변경사항 즉시 반영

### 👥 시나리오 4: 온라인 사용자 표시
1. **사이드바 확인**: 온라인 사용자 섹션
2. **예상 결과**: 
   - ❌ 이전: `get_online_users` 함수 오류
   - ✅ 현재: 현재 사용자가 온라인으로 표시

## 🐛 에러 확인 포인트

### Console에서 확인할 것들
```javascript
// ✅ 정상적인 로그
"사용자 활동 상태 업데이트 성공"
"부서 목록 로드 성공"
"프로필 업데이트 성공"

// ❌ 발생하면 안 되는 오류
"invalid input syntax for type uuid"
"structure of query does not match function result type"
"User can read user profiles policy violation"
```

### Network 탭에서 확인할 것들
```
✅ 200 OK: /rest/v1/departments
✅ 200 OK: /rest/v1/users
❌ 400 Bad Request: 모든 요청이 성공해야 함
```

## 🎯 핵심 개선사항

### Before (문제)
- 하드코딩된 사용자 ID로 인한 UUID 오류
- 복잡한 함수 호출로 인한 타입 불일치
- 프로필과 관리자 패널 부서 연동 안됨

### After (해결)
- 실제 인증된 사용자 ID 사용
- 직접 DB 쿼리로 안정성 향상  
- 관리자 패널 부서가 프로필에서 바로 연동

## 📋 체크리스트

- [ ] 로그인 시 UUID 오류 없음
- [ ] 프로필 페이지 정상 로드
- [ ] 부서 목록 정상 표시
- [ ] 프로필 정보 저장 성공
- [ ] 온라인 사용자 표시 정상
- [ ] Console 에러 없음

## 🔧 문제 발생시 해결책

### 여전히 UUID 오류가 발생하는 경우
```bash
# 로컬 스토리지 정리
localStorage.removeItem("userProfile");
localStorage.removeItem("user");
# 다시 로그인
```

### 부서 목록이 안 보이는 경우
1. 관리자 패널에서 부서 먼저 등록
2. 브라우저 새로고침
3. RLS 정책 확인 (Supabase Dashboard)

### 프로필 업데이트 실패하는 경우
- users 테이블에 department_id, phone, role 컬럼 존재 확인
- UPDATE 권한 정책 확인

## 🎉 성공 기준

**모든 기능이 정상 작동하고 Console에 에러가 없으면 성공!** ✨ 