// LINE Webhook 테스트 API - 환경변수 없이도 작동
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-line-signature');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 LINE Webhook 테스트 수신');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
    
    // 환경변수 상태 확인
    const envStatus = {
      LINE_ACCESS_TOKEN: !!LINE_ACCESS_TOKEN,
      LINE_CHANNEL_SECRET: !!process.env.LINE_CHANNEL_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'unknown'
    };

    console.log('환경변수 상태:', envStatus);

    // 이벤트 처리 (간단한 로깅만)
    if (req.body && req.body.events) {
      const events = req.body.events;
      
      console.log(`받은 이벤트 수: ${events.length}`);
      
      events.forEach((event, index) => {
        console.log(`이벤트 ${index + 1}:`, {
          type: event.type,
          sourceType: event.source?.type,
          userId: event.source?.userId,
          groupId: event.source?.groupId,
          message: event.message?.text,
          timestamp: new Date(event.timestamp).toLocaleString('ko-KR')
        });
      });
    }

    // 항상 200 응답 반환 (LINE 요구사항)
    res.status(200).json({ 
      success: true,
      message: 'Webhook 테스트 완료',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      receivedEvents: req.body?.events?.length || 0
    });

  } catch (error) {
    console.error('❌ Webhook 테스트 오류:', error);
    
    // 에러가 발생해도 200 응답 (LINE 요구사항)
    res.status(200).json({ 
      success: false,
      message: 'Webhook 테스트 중 오류 발생',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 