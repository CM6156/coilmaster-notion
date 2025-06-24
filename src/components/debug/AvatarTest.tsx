import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AvatarTest = () => {
  const testUrls = [
    'https://via.placeholder.com/150/0066cc/ffffff?text=T1', // 테스트 이미지 1
    'https://via.placeholder.com/150/ff6b6b/ffffff?text=T2', // 테스트 이미지 2
    'invalid-url', // 잘못된 URL (fallback 테스트)
    '' // 빈 URL (fallback 테스트)
  ];

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold">Avatar 컴포넌트 테스트</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {testUrls.map((url, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border rounded">
            <Avatar className="w-16 h-16">
              <AvatarImage 
                src={url} 
                alt={`테스트 이미지 ${index + 1}`}
                onError={() => console.log(`테스트 ${index + 1} 이미지 로드 실패:`, url)}
                onLoad={() => console.log(`테스트 ${index + 1} 이미지 로드 성공:`, url)}
              />
              <AvatarFallback className="text-white bg-gradient-to-r from-blue-500 to-purple-500">
                T{index + 1}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">테스트 {index + 1}</p>
              <p className="text-xs text-muted-foreground break-all">{url || '빈 URL'}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>브라우저 콘솔을 확인하세요:</strong> 각 이미지의 로드 성공/실패 로그가 표시됩니다.
        </p>
      </div>
    </div>
  );
};

export default AvatarTest; 