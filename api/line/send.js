// LINE 메시지 발송 API
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📤 LINE 메시지 발송 요청:', req.body);

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

    if (!LINE_ACCESS_TOKEN) {
      return res.status(500).json({ 
        error: 'LINE_ACCESS_TOKEN이 설정되지 않았습니다.' 
      });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ LINE API 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ LINE 메시지 발송 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ LINE 메시지 발송 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'LINE 메시지 발송 중 오류가 발생했습니다.'
    });
  }
} 