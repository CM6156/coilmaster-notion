// 브라우저 콘솔에서 실행할 429 오류 해결 스크립트

// Rate Limit 초기화
function clearRateLimit() {
  localStorage.removeItem('lastSignupRequest');
  console.log('✅ Rate Limit 초기화 완료!');
}

// 429 오류 완전 해결
function fix429Error() {
  localStorage.removeItem('lastSignupRequest');
  sessionStorage.clear();
  console.log('🚀 429 오류 해결 완료!');
  console.log('이제 회원가입을 다시 시도하세요.');
}

// 사용법: 브라우저 콘솔에서 fix429Error() 실행
fix429Error(); 