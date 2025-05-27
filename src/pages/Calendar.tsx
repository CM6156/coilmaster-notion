
// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Calendar as CalendarComponent } from "@/components/ui/calendar";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/components/ui/use-toast";
// import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { useAppContext } from "@/context/AppContext";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// // 샘플 일정 데이터 타입 정의
// interface EventType {
//   id: string;
//   title: string;
//   date: string;
//   startTime?: string;
//   endTime?: string;
//   description?: string;
//   corporation: string;
//   color: string;
//   allDay?: boolean;
//   projectId?: string;
// }

// export default function CalendarPage() {
//   const [date, setDate] = useState<Date | undefined>(new Date());
//   const [view, setView] = useState<"month" | "week" | "day">("month");
//   const [showEventDialog, setShowEventDialog] = useState(false);
//   const [selectedCorporation, setSelectedCorporation] = useState<string | "all">("all");
//   const { toast } = useToast();
//   const { currentUser } = useAppContext();

//   // 샘플 법인 목록
//   const corporations = [
//     { id: "corp1", name: "본사" },
//     { id: "corp2", name: "제1공장" },
//     { id: "corp3", name: "제2공장" },
//     { id: "corp4", name: "연구소" },
//   ];

//   // 샘플 이벤트 데이터
//   const [events, setEvents] = useState<EventType[]>([
//     {
//       id: "e1",
//       title: "공급업체 미팅",
//       date: "2025-05-20",
//       startTime: "10:00",
//       endTime: "11:30",
//       description: "신규 부품 공급업체와 미팅",
//       corporation: "corp1",
//       color: "blue"
//     },
//     {
//       id: "e2",
//       title: "프로토타입 검토",
//       date: "2025-05-20",
//       startTime: "14:00",
//       endTime: "15:30",
//       description: "신제품 프로토타입 검토 회의",
//       corporation: "corp3",
//       color: "green"
//     },
//     {
//       id: "e3",
//       title: "품질 테스트 일정",
//       date: "2025-05-20",
//       startTime: "16:00",
//       endTime: "17:30",
//       description: "생산라인 품질 테스트",
//       corporation: "corp2",
//       color: "amber"
//     },
//     {
//       id: "e4",
//       title: "연구 발표",
//       date: "2025-05-22",
//       startTime: "13:00",
//       endTime: "15:00",
//       description: "신기술 연구 발표",
//       corporation: "corp4",
//       color: "purple"
//     }
//   ]);

//   // 새 일정 등록 상태
//   const [newEvent, setNewEvent] = useState({
//     title: "",
//     date: "",
//     startTime: "",
//     endTime: "",
//     description: "",
//     corporation: "corp1",
//     allDay: false,
//     projectId: ""
//   });

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { id, value } = e.target;
//     setNewEvent({
//       ...newEvent,
//       [id]: value
//     });
//   };

//   const handleCheckboxChange = (checked: boolean) => {
//     setNewEvent({
//       ...newEvent,
//       allDay: checked
//     });
//   };

//   const handleAddEvent = (event: React.FormEvent) => {
//     event.preventDefault();
    
//     const colorMap: Record<string, string> = {
//       corp1: "blue",
//       corp2: "green", 
//       corp3: "amber",
//       corp4: "purple"
//     };
    
//     // 새 이벤트 생성
//     const newEventObj: EventType = {
//       id: `e${events.length + 1}`,
//       title: newEvent.title,
//       date: newEvent.date,
//       startTime: newEvent.startTime,
//       endTime: newEvent.endTime,
//       description: newEvent.description,
//       corporation: newEvent.corporation,
//       color: colorMap[newEvent.corporation] || "gray",
//       allDay: newEvent.allDay,
//       projectId: newEvent.projectId || undefined
//     };
    
//     // 이벤트 목록에 추가
//     setEvents([...events, newEventObj]);
//     setShowEventDialog(false);
    
//     // 입력 폼 초기화
//     setNewEvent({
//       title: "",
//       date: "",
//       startTime: "",
//       endTime: "",
//       description: "",
//       corporation: "corp1",
//       allDay: false,
//       projectId: ""
//     });
    
//     // 알림 표시
//     toast({
//       title: "일정이 추가되었습니다",
//       description: "새로운 일정이 성공적으로 추가되었습니다.",
//     });
//   };

//   const handlePrevMonth = () => {
//     if (date) {
//       const newDate = new Date(date);
//       newDate.setMonth(date.getMonth() - 1);
//       setDate(newDate);
//     }
//   };

//   const handleNextMonth = () => {
//     if (date) {
//       const newDate = new Date(date);
//       newDate.setMonth(date.getMonth() + 1);
//       setDate(newDate);
//     }
//   };

//   const handleToday = () => {
//     setDate(new Date());
//   };
  
//   // 선택된 날짜의 이벤트 필터링
//   const getEventsForSelectedDate = () => {
//     if (!date) return [];
    
//     const selectedDateStr = date.toISOString().split('T')[0];
//     let filteredEvents = events.filter(event => event.date === selectedDateStr);
    
//     // 법인 필터링
//     if (selectedCorporation !== "all") {
//       filteredEvents = filteredEvents.filter(event => event.corporation === selectedCorporation);
//     }
    
//     return filteredEvents;
//   };
  
//   // 법인별로 이벤트 그룹화
//   const getEventsByCorporation = () => {
//     const eventsByCorp: Record<string, EventType[]> = {};
    
//     corporations.forEach(corp => {
//       eventsByCorp[corp.id] = events.filter(event => event.corporation === corp.id);
//     });
    
//     return eventsByCorp;
//   };

//   return (
//     <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold">일정 관리</h1>
//           <p className="text-slate-600">프로젝트 및 업무 일정을 관리합니다</p>
//         </div>
        
//         <div className="flex items-center space-x-2">
//           <Button variant="outline" onClick={handleToday}>
//             오늘
//           </Button>
//           <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
//             <ChevronLeft className="h-4 w-4" />
//           </Button>
//           <Button variant="ghost" size="icon" onClick={handleNextMonth}>
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//           <Select value={view} onValueChange={(value) => setView(value as "month" | "week" | "day")}>
//             <SelectTrigger className="w-[120px]">
//               <SelectValue placeholder="View" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="month">월별 보기</SelectItem>
//               <SelectItem value="week">주간 보기</SelectItem>
//               <SelectItem value="day">일별 보기</SelectItem>
//             </SelectContent>
//           </Select>
          
//           <Select 
//             value={selectedCorporation} 
//             onValueChange={(value) => setSelectedCorporation(value as string | "all")}
//           >
//             <SelectTrigger className="w-[120px]">
//               <SelectValue placeholder="법인 선택" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">전체 법인</SelectItem>
//               {corporations.map(corp => (
//                 <SelectItem key={corp.id} value={corp.id}>{corp.name}</SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
          
//           <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
//             <DialogTrigger asChild>
//               <Button>
//                 <Plus className="mr-2 h-4 w-4" /> 일정 추가
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>새 일정 추가</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleAddEvent}>
//                 <div className="grid gap-4 py-4">
//                   <div className="grid gap-2">
//                     <Label htmlFor="title">제목</Label>
//                     <Input 
//                       id="title" 
//                       placeholder="일정 제목" 
//                       value={newEvent.title} 
//                       onChange={handleInputChange} 
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="date">날짜</Label>
//                     <Input 
//                       id="date" 
//                       type="date" 
//                       value={newEvent.date} 
//                       onChange={handleInputChange} 
//                       required
//                     />
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="grid gap-2">
//                       <Label htmlFor="startTime">시작 시간</Label>
//                       <Input 
//                         id="startTime" 
//                         type="time" 
//                         value={newEvent.startTime} 
//                         onChange={handleInputChange} 
//                         disabled={newEvent.allDay}
//                       />
//                     </div>
//                     <div className="grid gap-2">
//                       <Label htmlFor="endTime">종료 시간</Label>
//                       <Input 
//                         id="endTime" 
//                         type="time" 
//                         value={newEvent.endTime} 
//                         onChange={handleInputChange} 
//                         disabled={newEvent.allDay}
//                       />
//                     </div>
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="description">설명</Label>
//                     <Textarea 
//                       id="description" 
//                       placeholder="일정에 대한 상세 내용" 
//                       value={newEvent.description} 
//                       onChange={handleInputChange} 
//                     />
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Checkbox 
//                       id="allday" 
//                       checked={newEvent.allDay}
//                       onCheckedChange={handleCheckboxChange}
//                     />
//                     <Label htmlFor="allday" className="text-sm font-normal">
//                       종일
//                     </Label>
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="corporation">법인</Label>
//                     <Select 
//                       value={newEvent.corporation}
//                       onValueChange={(value) => setNewEvent({...newEvent, corporation: value})}
//                     >
//                       <SelectTrigger id="corporation">
//                         <SelectValue placeholder="법인 선택" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {corporations.map(corp => (
//                           <SelectItem key={corp.id} value={corp.id}>{corp.name}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="project">관련 프로젝트</Label>
//                     <Select 
//                       value={newEvent.projectId}
//                       onValueChange={(value) => setNewEvent({...newEvent, projectId: value})}
//                     >
//                       <SelectTrigger id="project">
//                         <SelectValue placeholder="프로젝트 선택" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="">프로젝트 없음</SelectItem>
//                         <SelectItem value="p1">OLED 드라이버 IC</SelectItem>
//                         <SelectItem value="p2">스마트 센서 모듈</SelectItem>
//                         <SelectItem value="p3">전력 관리 칩</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//                 <DialogFooter>
//                   <Button type="button" variant="outline" onClick={() => setShowEventDialog(false)}>
//                     취소
//                   </Button>
//                   <Button type="submit">저장</Button>
//                 </DialogFooter>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       <div className="grid md:grid-cols-3 gap-4">
//         <Card className="md:col-span-2">
//           <CardHeader>
//             <CardTitle>
//               {date ? date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) : ''}
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="p-2">
//               <CalendarComponent
//                 mode="single"
//                 selected={date}
//                 onSelect={setDate}
//                 className="rounded-md border w-full pointer-events-auto"
//               />
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardHeader className="pb-2">
//             <Tabs defaultValue="daily">
//               <TabsList className="grid w-full grid-cols-2">
//                 <TabsTrigger value="daily">일별 일정</TabsTrigger>
//                 <TabsTrigger value="corporation">법인별 일정</TabsTrigger>
//               </TabsList>
//               <CardTitle className="mt-4">
//                 {date ? date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }) : ''} 일정
//               </CardTitle>
//             </Tabs>
//           </CardHeader>
//           <CardContent>
//             <Tabs defaultValue="daily">
//               <TabsContent value="daily" className="space-y-2">
//                 {getEventsForSelectedDate().length > 0 ? (
//                   getEventsForSelectedDate().map(event => (
//                     <div 
//                       key={event.id} 
//                       className={`flex items-center p-2 rounded-md border border-${event.color}-200 bg-${event.color}-50`}
//                     >
//                       <div className={`w-2 h-10 bg-${event.color}-500 rounded-full mr-3`}></div>
//                       <div>
//                         <p className="font-medium">{event.title}</p>
//                         <p className="text-sm text-gray-500">
//                           {event.allDay ? '종일' : `${event.startTime} - ${event.endTime}`}
//                         </p>
//                         <div className="flex items-center mt-1">
//                           <Badge variant="outline" className="text-xs">
//                             {corporations.find(c => c.id === event.corporation)?.name}
//                           </Badge>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="text-center py-6 text-gray-500">
//                     선택한 날짜에 일정이 없습니다
//                   </div>
//                 )}
//               </TabsContent>
//               <TabsContent value="corporation">
//                 {corporations.map(corp => {
//                   const corpEvents = events.filter(e => e.corporation === corp.id);
//                   if (corpEvents.length === 0) return null;
                  
//                   return (
//                     <div key={corp.id} className="mb-4">
//                       <h3 className="font-medium text-sm text-gray-500 mb-2">{corp.name}</h3>
//                       <div className="space-y-2">
//                         {corpEvents.slice(0, 3).map(event => (
//                           <div 
//                             key={event.id} 
//                             className={`flex items-center p-2 rounded-md border border-${event.color}-200 bg-${event.color}-50`}
//                           >
//                             <div className={`w-2 h-10 bg-${event.color}-500 rounded-full mr-3`}></div>
//                             <div>
//                               <p className="font-medium">{event.title}</p>
//                               <p className="text-sm text-gray-500">
//                                 {new Date(event.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
//                                 {!event.allDay && ` · ${event.startTime} - ${event.endTime}`}
//                               </p>
//                             </div>
//                           </div>
//                         ))}
//                         {corpEvents.length > 3 && (
//                           <p className="text-xs text-blue-600 text-right">+ {corpEvents.length - 3}개 더보기</p>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//                 {!corporations.some(corp => events.filter(e => e.corporation === corp.id).length > 0) && (
//                   <div className="text-center py-6 text-gray-500">
//                     등록된 일정이 없습니다
//                   </div>
//                 )}
//               </TabsContent>
//             </Tabs>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
