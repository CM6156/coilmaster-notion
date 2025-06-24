// 매우 간단한 LINE Webhook - 항상 200 응답
export default async function handler(req, res) {
  try {
    // 모든 요청에 대해 즉시 200 응답
    console.log('📨 LINE Webhook 요청 수신:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Body:', req.body);

    // LINE에서 요구하는 200 응답을 즉시 반환
    res.status(200).json({
      status: 'success',
      message: 'OK',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook 오류:', error);
    // 에러가 발생해도 200 응답 (LINE 요구사항)
    res.status(200).json({
      status: 'error',
      message: 'Error handled',
      timestamp: new Date().toISOString()
    });
  }
} 