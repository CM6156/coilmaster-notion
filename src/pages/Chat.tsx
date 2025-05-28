import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  Users,
  Hash,
  Lock,
  Settings,
  MoreVertical,
  Phone,
  Video,
  UserPlus,
  Archive,
  Bell,
  BellOff,
  Smile,
  Paperclip,
  Image,
  File,
  Mic,
  Heart,
  ThumbsUp,
  Reply,
  Forward
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getChatRooms, 
  getChatMessages, 
  sendMessage, 
  markMessagesAsRead,
  subscribeToRoomMessages,
  ChatRoom,
  ChatMessage 
} from "@/lib/api/chat";
import { useToast } from "@/hooks/use-toast";

// 인터페이스는 chat.ts에서 import하여 사용

const Chat = () => {
  const { language, translations } = useLanguage();
  const { currentUser } = useAppContext();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  const t = translations?.sidebar || {
    chat: "채팅",
    chatRooms: "채팅방",
    directMessages: "개인 메시지"
  };

  // 데이터 로딩
  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        setLoading(true);
        const rooms = await getChatRooms();
        setChatRooms(rooms);
      } catch (error) {
        console.error('채팅방 로딩 오류:', error);
        toast({
          title: "오류",
          description: "채팅방을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();
  }, [toast]);

  // 메시지 로딩
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedRoom) {
        setMessages([]);
        return;
      }

      try {
        const roomMessages = await getChatMessages(selectedRoom);
        setMessages(roomMessages);
        
        // 메시지 읽음 처리
        await markMessagesAsRead(selectedRoom);
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
  }, [selectedRoom, toast]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!selectedRoom) return;

    // 기존 구독 해제
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // 새 구독 시작
    subscriptionRef.current = subscribeToRoomMessages(selectedRoom, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [selectedRoom]);

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRoomData = selectedRoom ? chatRooms.find(r => r.id === selectedRoom) : null;

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRoom || sendingMessage) return;

    try {
      setSendingMessage(true);
      await sendMessage(selectedRoom, message);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    }
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">채팅방을 불러오는 중...</p>
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
              <MessageCircle className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">{t.chat || "채팅"}</h1>
                <p className="text-white/80">팀원들과 실시간으로 소통하세요</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100%-8rem)]">
          {/* 채팅방 목록 */}
          <div className="col-span-3">
            <Card className="h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">{t.chatRooms || "채팅방"}</CardTitle>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="채팅방 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-1 p-3">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                          selectedRoom === room.id && "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.avatar_url} />
                            <AvatarFallback className={cn(
                              "text-white",
                              room.type === 'group' ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"
                            )}>
                              {room.type === 'group' ? (
                                <Hash className="h-4 w-4" />
                              ) : (
                                room.name.charAt(0)
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {room.name}
                            </h3>
                            {room.unread_count > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {room.unread_count > 9 ? '9+' : room.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {room.last_message?.content || room.description || "채팅을 시작하세요"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 채팅 메시지 영역 */}
          <div className="col-span-9">
            {selectedRoomData ? (
              <Card className="h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                {/* 채팅방 헤더 */}
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedRoomData.avatar_url} />
                        <AvatarFallback className={cn(
                          "text-white",
                          selectedRoomData.type === 'group' ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"
                        )}>
                          {selectedRoomData.type === 'group' ? (
                            <Hash className="h-4 w-4" />
                          ) : (
                            selectedRoomData.name.charAt(0)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">{selectedRoomData.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedRoomData.type === 'group' 
                            ? `${selectedRoomData.participants?.length || 0}명 참여중`
                            : "개인 대화"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRoomData.type === 'direct' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Video className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* 메시지 목록 */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((msg, index) => {
                        const isMyMessage = msg.sender_id === currentUser?.id;
                        const showDate = index === 0 || 
                          formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);
                        
                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                                  {formatDate(msg.created_at)}
                                </span>
                              </div>
                            )}
                            <div className={cn(
                              "flex gap-3",
                              isMyMessage ? "justify-end" : "justify-start"
                            )}>
                              {!isMyMessage && (
                                <Avatar className="h-8 w-8 mt-1">
                                  <AvatarImage src={msg.sender?.avatar} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                                    {(msg.sender?.name || "?").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                "max-w-[70%] space-y-1",
                                isMyMessage ? "items-end" : "items-start"
                              )}>
                                {!isMyMessage && (
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {msg.sender?.name || "알 수 없음"}
                                  </span>
                                )}
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
                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {msg.reactions.map((reaction, idx) => (
                                      <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                                        {reaction.emoji} 1
                                      </span>
                                    ))}
                                  </div>
                                )}
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
                          </div>
                        );
                      })}
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
                      placeholder="메시지를 입력하세요..."
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
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">채팅방을 선택하세요</h3>
                    <p className="text-gray-500 dark:text-gray-400">좌측에서 채팅방을 선택하여 대화를 시작하세요</p>
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

export default Chat; 