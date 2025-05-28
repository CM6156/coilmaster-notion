
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import ChairmanMessageDialog from "../ui/ChairmanMessageDialog";
import HelpChatbot from "../ui/HelpChatbot";

export default function Layout() {
  const [showChairmanMessage, setShowChairmanMessage] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 팝업 표시 여부 확인
    const checkShouldShowPopup = () => {
      const today = new Date().toISOString().split('T')[0];
      const hiddenDate = localStorage.getItem('chairmanMessageHidden');
      
      // 오늘 날짜와 숨김 날짜가 다르면 팝업 표시
      if (hiddenDate !== today) {
        setShowChairmanMessage(true);
      }
    };

    // 약간의 지연을 두고 팝업 표시 (로그인 후 자연스러운 표시를 위해)
    const timer = setTimeout(checkShouldShowPopup, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <MobileSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <Outlet />
        </main>
      </div>
      
      {/* 회장님의 말씀 팝업 */}
      <ChairmanMessageDialog
        open={showChairmanMessage}
        onOpenChange={setShowChairmanMessage}
      />
      
      {/* 도움말 챗봇 */}
      <HelpChatbot />
    </div>
  );
}
