import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, Crown, Sparkles, Quote, Star, Building2 } from 'lucide-react';

interface ChairmanMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChairmanMessageDialog = ({ open, onOpenChange }: ChairmanMessageDialogProps) => {
  const [dontShowToday, setDontShowToday] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 팝업 닫기 처리
  const handleClose = () => {
    if (dontShowToday) {
      // 로컬 스토리지에 오늘 날짜 저장
      localStorage.setItem('chairmanMessageHidden', getTodayString());
    }
    setIsVisible(false);
    setTimeout(() => onOpenChange(false), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`
        w-[700px] h-[900px] mx-auto p-0 overflow-hidden flex flex-col
        bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 
        dark:from-slate-900 dark:via-blue-950 dark:to-purple-950
        border-2 border-white/30 dark:border-white/10
        backdrop-blur-xl
        shadow-2xl shadow-blue-900/20 dark:shadow-blue-500/20
        transition-all duration-700 ease-out transform
        ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        relative
        fixed top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]
        max-h-[98vh] max-w-[98vw]
      `}>
        {/* 배경 패턴 및 효과 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-20 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* 헤더 섹션 */}
        <DialogHeader className="p-0 flex-shrink-0 relative z-10">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-6 relative overflow-hidden">
            {/* 헤더 배경 패턴 */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2247%22%20cy%3D%227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2227%22%20cy%3D%2227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2247%22%20cy%3D%2227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2247%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2227%22%20cy%3D%2247%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2247%22%20cy%3D%2247%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <Crown className="h-8 w-8 text-white animate-pulse" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    회장님의 말씀
                    <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                  </DialogTitle>
                  <p className="text-blue-100 text-sm font-medium">CoilMaster Chairman's Message</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-10 w-10 p-0 rounded-full text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* 장식 요소 */}
            <div className="absolute top-0 right-0 w-32 h-32 border border-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 border border-white/10 rounded-full transform -translate-x-12 translate-y-12"></div>
          </div>
        </DialogHeader>
        
        {/* 메인 콘텐츠 영역 - 세로 레이아웃 */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10 p-6 space-y-6 overflow-y-auto">
          
          {/* 1. 상단 텍스트 - 인용 섹션 */}
          <div className="relative">
            <div className="absolute -top-2 -left-2">
              <Quote className="h-8 w-8 text-blue-500/30 transform rotate-180" />
            </div>
            <div className="bg-white/80 dark:bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                코일마스터의 비전
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed italic font-medium">
                "혁신적인 기술로 글로벌 시장을 선도하며, 고객과 함께 성장하는 기업이 되겠습니다."
              </p>
            </div>
          </div>

          {/* 2. 중간 이미지 - 명확히 표시 */}
          <div className="flex justify-center items-center py-4">
            <div className="relative group">
              {/* 이미지 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              
              {/* 실제 이미지 */}
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/60 shadow-2xl">
                <img
                  src="/코일마스터_스티커디자인_0523_emb5.jpg"
                  alt="코일마스터 스티커 디자인"
                  className="w-full max-w-[350px] h-[280px] object-contain rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* 장식 별들 */}
              <Star className="absolute -top-3 -right-3 h-6 w-6 text-yellow-400 animate-pulse" />
              <Star className="absolute -bottom-2 -left-2 h-4 w-4 text-blue-400 animate-pulse delay-500" />
              <Star className="absolute top-1/2 -right-4 h-3 w-3 text-purple-400 animate-pulse delay-1000" />
            </div>
          </div>

          {/* 3. 슬로건 텍스트 - 이미지 바로 아래 */}
          <div className="relative">
            <div className="bg-white/90 dark:bg-white/20 backdrop-blur-md rounded-2xl p-6 border-2 border-white/70 shadow-2xl">
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                "Move Fast, Break Things"
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-base text-center italic leading-relaxed font-medium">
                빠르게 움직이고, 기존의 틀을 깨뜨려라.<br/>
                혁신은 안전지대를 벗어날 때 시작됩니다.
              </p>
            </div>
          </div>

        </div>

        {/* 하단 액션 영역 - 고정 */}
        <div className="flex-shrink-0 p-6 pt-0 relative z-10">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-lg">
            {/* 오늘은 표시 안함 체크박스 */}
            <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
              <Checkbox
                id="dontShowToday"
                checked={dontShowToday}
                onCheckedChange={(checked) => setDontShowToday(checked as boolean)}
                className="border-2 border-blue-300 dark:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md w-5 h-5"
              />
              <label
                htmlFor="dontShowToday"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-2"
              >
                <span>오늘은 표시 안함</span>
                <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                  Today Only
                </div>
              </label>
            </div>

            {/* 확인 버튼 */}
            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-white/20"
            >
              <span className="flex items-center justify-center gap-2">
                확인
                <Sparkles className="h-4 w-4 animate-pulse" />
              </span>
            </Button>
          </div>
        </div>

        {/* 추가 장식 요소 */}
        <div className="absolute top-1/2 left-0 w-1 h-20 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full opacity-60"></div>
        <div className="absolute top-1/2 right-0 w-1 h-20 bg-gradient-to-b from-purple-500 to-blue-500 rounded-l-full opacity-60"></div>
      </DialogContent>
    </Dialog>
  );
};

export default ChairmanMessageDialog; 