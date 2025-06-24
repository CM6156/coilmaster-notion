// LINE Bot 정보 조회 API
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🤖 LINE Bot 정보 조회 요청');

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

    if (!LINE_ACCESS_TOKEN) {
      return res.status(500).json({ 
        error: 'LINE_ACCESS_TOKEN이 설정되지 않았습니다.' 
      });
    }

    const response = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ LINE Bot 정보 조회 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ LINE Bot 정보 조회 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ LINE Bot 정보 조회 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'LINE Bot 정보 조회 중 오류가 발생했습니다.'
    });
  }
} 