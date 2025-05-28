import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserCheck,
  Send,
  Search,
  Plus,
  Phone,
  Video,
  Settings,
  MoreVertical,
  Paperclip,
  Image,
  Smile,
  Star,
  Pin,
  Archive,
  Shield,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getDirectConversations,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  startDirectConversation,
  subscribeToRoomMessages,
  DirectConversation,
  ChatMessage
} from "@/lib/api/chat";
import { useToast } from "@/hooks/use-toast";

const DirectMessages = () => {
  const { language, translations } = useLanguage();
  const { currentUser } = useAppContext();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  const t = translations?.sidebar || {
    directMessages: "개인 메시지"
  };

  // 데이터 로딩
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const convs = await getDirectConversations();
        setConversations(convs);
      } catch (error) {
        console.error('대화 목록 로딩 오류:', error);
        toast({
          title: "오류",
          description: "대화 목록을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [toast]);

  // 메시지 로딩
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }

      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation?.room_id) return;

      try {
        const roomMessages = await getChatMessages(conversation.room_id);
        setMessages(roomMessages);
        
        // 메시지 읽음 처리
        await markMessagesAsRead(conversation.room_id);
      } catch (error) {
        console.error('메시지 로딩 오류:', error);
        toast({
          title: "오류",
          description: "메시지를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      }
    };

    loadMessages();
  }, [selectedConversation, conversations, toast]);

  // 실시간 메시지 구독
  useEffect(() => {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation?.room_id) return;

    // 기존 구독 해제
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // 새 구독 시작
    subscriptionRef.current = subscribeToRoomMessages(conversation.room_id, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [selectedConversation, conversations]);

  const filteredConversations = conversations.filter(conv => 
    conv.other_user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversationData = selectedConversation 
    ? conversations.find(c => c.id === selectedConversation) 
    : null;

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || sendingMessage) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation?.room_id) return;

    try {
      setSendingMessage(true);
      await sendMessage(conversation.room_id, message);
      setMessage("");
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      toast({
        title: "오류",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const isUserOnline = (user: any) => {
    // 실제 온라인 상태 확인 로직 (나중에 구현)
    // 현재는 임시로 false 반환
    return false;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">대화 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 h-full">
        {/* 헤더 */}
        <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-600 p-6 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">{t.directMessages || "개인 메시지"}</h1>
                <p className="text-white/80">팀원들과 1:1로 소통하세요</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100%-8rem)]">
          {/* 대화 목록 */}
          <div className="col-span-4">
            <Card className="h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">대화 목록</CardTitle>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="사람 또는 부서 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-1 p-3">
                    {filteredConversations.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>아직 대화가 없습니다</p>
                        <p className="text-sm">새로운 대화를 시작해보세요</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 relative",
                            selectedConversation === conversation.id && "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                          )}
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={conversation.other_user?.avatar} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {(conversation.other_user?.name || "?").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {isUserOnline(conversation.other_user) ? (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                            ) : (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {conversation.other_user?.name || "알 수 없음"}
                              </h3>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                              {conversation.other_user?.department?.name || "부서 정보 없음"}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {isUserOnline(conversation.other_user) 
                                ? "온라인" 
                                : "오프라인"
                              }
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 메시지 영역 */}
          <div className="col-span-8">
            {selectedConversationData ? (
              <Card className="h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                {/* 대화 헤더 */}
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedConversationData.other_user?.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {(selectedConversationData.other_user?.name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {isUserOnline(selectedConversationData.other_user) ? (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                        ) : (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {selectedConversationData.other_user?.name || "알 수 없음"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedConversationData.other_user?.department?.name || "부서 정보 없음"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {isUserOnline(selectedConversationData.other_user) 
                            ? "온라인" 
                            : "오프라인"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* 메시지 목록 */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>아직 메시지가 없습니다</p>
                          <p className="text-sm">첫 번째 메시지를 보내보세요</p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMyMessage = msg.sender_id === currentUser?.id;
                          
                          return (
                            <div key={msg.id} className={cn(
                              "flex gap-3",
                              isMyMessage ? "justify-end" : "justify-start"
                            )}>
                              {!isMyMessage && (
                                <Avatar className="h-8 w-8 mt-1">
                                  <AvatarImage src={selectedConversationData.other_user?.avatar} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                                    {(selectedConversationData.other_user?.name || "?").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                "max-w-[70%] space-y-1",
                                isMyMessage ? "items-end" : "items-start"
                              )}>
                                <div className={cn(
                                  "p-3 rounded-2xl text-sm",
                                  isMyMessage 
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md" 
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                                )}>
                                  {msg.content}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTime(msg.created_at)}
                                  </span>
                                </div>
                              </div>
                              {isMyMessage && (
                                <Avatar className="h-8 w-8 mt-1">
                                  <AvatarImage src={currentUser?.avatar} />
                                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm">
                                    {(currentUser?.name || "나").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* 메시지 입력 */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`${selectedConversationData.other_user?.name || "상대방"}님에게 메시지 보내기...`}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      disabled={sendingMessage}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendingMessage}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <UserCheck className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">대화를 선택하세요</h3>
                    <p className="text-gray-500 dark:text-gray-400">좌측에서 팀원을 선택하여 개인 메시지를 시작하세요</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages; 