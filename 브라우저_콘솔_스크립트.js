// ========================================
// 🔧 브라우저 콘솔에서 실행할 Rate Limit 해결 스크립트
// ========================================

// 현재 Rate Limit 상태 확인
function checkRateLimit() {
  const lastRequest = localStorage.getItem('lastSignupRequest');
  const now = Date.now();
  
  if (!lastRequest) {
    console.log('✅ Rate Limit 없음 - 회원가입 가능');
    return;
  }
  
  const timeLeft = Math.max(0, 60000 - (now - parseInt(lastRequest)));
  
  if (timeLeft > 0) {
    console.log(`⏰ ${Math.ceil(timeLeft / 1000)}초 후 다시 시도 가능`);
  } else {
    console.log('✅ Rate Limit 해제됨 - 회원가입 가능');
  }
}

// Rate Limit 강제 초기화
function clearRateLimit() {
  localStorage.removeItem('lastSignupRequest');
  console.log('🚀 Rate Limit 강제 초기화 완료!');
  console.log('✅ 이제 즉시 회원가입할 수 있습니다.');
}

// 모든 회원가입 관련 데이터 삭제
function clearAllAuthData() {
  const authKeys = [
    'lastSignupRequest',
    'supabase.auth.token',
    'sb-auth-token',
    'auth-token'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('🧹 모든 인증 데이터 삭제 완료!');
  console.log('✅ 완전히 새로운 상태로 회원가입 가능합니다.');
}

// 429 오류 완전 해결
function fix429Error() {
  console.log('🚨 429 오류 해결 시작...');
  
  // 1. Rate Limit 초기화
  clearRateLimit();
  
  // 2. 모든 인증 관련 데이터 삭제
  clearAllAuthData();
  
  // 3. 페이지 새로고침 권장
  console.log('📍 다음 단계:');
  console.log('1. 페이지 새로고침 (F5)');
  console.log('2. 다른 이메일 주소 사용 권장 (예: test@gmail.com)');
  console.log('3. 회원가입 시도');
  
  // 자동 새로고침 옵션
  const autoRefresh = confirm('페이지를 자동으로 새로고침할까요?');
  if (autoRefresh) {
    window.location.reload();
  }
}

// ========================================
// 사용법
// ========================================
console.log('🔧 Rate Limit 해결 도구 로드 완료!');
console.log('');
console.log('📋 사용 가능한 명령어:');
console.log('checkRateLimit()     - 현재 상태 확인');
console.log('clearRateLimit()     - Rate Limit 초기화');
console.log('clearAllAuthData()   - 모든 인증 데이터 삭제');
console.log('fix429Error()        - 429 오류 완전 해결');
console.log('');
console.log('🚀 빠른 해결: fix429Error() 실행 후 다른 이메일로 회원가입');

// 즉시 상태 확인
checkRateLimit(); 