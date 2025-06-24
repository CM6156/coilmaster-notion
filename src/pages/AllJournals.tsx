import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Textarea } from "../components/ui/textarea";
import { format, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Users,
  ArrowLeft,
  Eye,
  Clock,
  Check,
  ImageIcon,
  User,
  MessageCircle,
  Send,
  X,
  Link,
  Copy
} from "lucide-react";

const AllJournals = () => {
  const navigate = useNavigate();
  const { 
    managers, 
    workJournals, 
    departments, 
    positions, 
    corporations,
    loadWorkJournals,
    getTranslatedDepartmentName,
    getTranslatedPositionName
  } = useAppContext();
  const { language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  
  // 모든 담당자의 업무일지를 통합하는 상태
  const [allManagerJournals, setAllManagerJournals] = useState<any[]>([]);
  
  // 슬라이드 패널 관련 상태
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // 댓글 관련 상태
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState("");
  
  // 링크 생성 관련 상태
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // 번역 헬퍼 함수
  const getText = (ko: string, en: string, zh: string, th: string) => {
    switch (language) {
      case "en": return en;
      case "zh": return zh;
      case "th": return th;
      case "ko":
      default: return ko;
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadWorkJournals();
  }, []);

  // 모든 담당자의 업무일지를 통합하는 함수
  useEffect(() => {
    const integratedJournals: any[] = [];

    // workJournals 데이터만 추가 (실제 데이터베이스에서 가져온 데이터)
    workJournals.forEach(journal => {
      const manager = getManagerInfo(journal.user_id);
      if (manager) {
        integratedJournals.push({
          ...journal,
          id: journal.id,
          source: 'database',
          author: manager,
          created_at: journal.created_at,
          content: journal.content,
          status: journal.status,
          title: getText('업무일지', 'Work Journal', '工作日志', 'บันทึกการทำงาน')
        });
      }
    });

    setAllManagerJournals(integratedJournals);
  }, [workJournals, managers, language]);

  // 이니셜 생성 함수
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return getText("날짜 없음", "No Date", "无日期", "ไม่มีวันที่");
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return getText("잘못된 날짜", "Invalid Date", "无效日期", "วันที่ไม่ถูกต้อง");
      
      return format(date, 'yyyy년 MM월 dd일 (E)', { locale: ko });
    } catch (error) {
      return getText("날짜 오류", "Date Error", "日期错误", "ข้อผิดพลาดวันที่");
    }
  };

  // 담당자 정보 가져오기
  const getManagerInfo = (managerId: string) => {
    return managers.find(m => m.id === managerId) || null;
  };

  // 부서명 가져오기 (번역 지원)
  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return getText("부서 없음", "No Department", "无部门", "ไม่มีแผนก");
    const dept = departments.find(d => d.id === departmentId);
    return dept ? getTranslatedDepartmentName(dept, language) : getText("알 수 없는 부서", "Unknown Department", "未知部门", "แผนกที่ไม่รู้จัก");
  };

  // 직책명 가져오기 (번역 지원)
  const getPositionName = (positionId?: string) => {
    if (!positionId) return getText("직책 없음", "No Position", "无职位", "ไม่มีตำแหน่ง");
    const position = positions.find(p => p.id === positionId);
    return position ? getTranslatedPositionName(position, language) : getText("알 수 없는 직책", "Unknown Position", "未知职位", "ตำแหน่งที่ไม่รู้จัก");
  };

  // 상태 번역
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return getText('완료', 'Completed', '已完成', 'เสร็จสิ้น');
      case 'in-progress':
        return getText('진행중', 'In Progress', '进行中', 'กำลังดำเนินการ');
      case 'pending':
        return getText('보류', 'Pending', '待处理', 'รอดำเนินการ');
      default:
        return getText('알 수 없음', 'Unknown', '未知', 'ไม่ทราบ');
    }
  };

  // 필터링된 업무 일지 목록 (통합된 데이터 사용)
  const filteredJournals = allManagerJournals
    .filter(journal => {
      // 검색어 필터
      if (searchTerm) {
        const manager = journal.author || getManagerInfo(journal.user_id);
        const searchLower = searchTerm.toLowerCase();
        if (!journal.content?.toLowerCase().includes(searchLower) && 
            !manager?.name?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // 담당자 필터
      if (selectedManager !== "all" && journal.user_id !== selectedManager) {
        return false;
      }

      // 부서 필터
      if (selectedDepartment !== "all") {
        const manager = journal.author || getManagerInfo(journal.user_id);
        if (manager?.department_id !== selectedDepartment) {
          return false;
        }
      }

      // 상태 필터
      if (selectedStatus !== "all" && journal.status !== selectedStatus) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "manager":
          const managerA = (a.author || getManagerInfo(a.user_id))?.name || "";
          const managerB = (b.author || getManagerInfo(b.user_id))?.name || "";
          return managerA.localeCompare(managerB);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // 통계 데이터
  const stats = {
    total: filteredJournals.length,
    completed: filteredJournals.filter(j => j.status === 'completed').length,
    inProgress: filteredJournals.filter(j => j.status === 'in-progress').length,
    totalManagers: [...new Set(filteredJournals.map(j => j.user_id))].length,
    totalRegisteredManagers: managers.length
  };

  // 업무일지 상세보기 열기
  const openJournalDetail = (journal: any) => {
    setSelectedJournal(journal);
    setIsSheetOpen(true);
  };

  // 업무일지 링크 생성
  const generateJournalLink = async (journalId: string) => {
    setIsGeneratingLink(true);
    
    try {
      // 공유 가능한 링크 생성 (실제로는 API를 통해 생성)
      const baseUrl = window.location.origin;
      const shareableLink = `${baseUrl}/shared-journal/${journalId}`;
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareableLink);
      
      // 성공 메시지 (UI 라이브러리가 있다면 toast 사용)
      console.log('링크가 클립보드에 복사되었습니다:', shareableLink);
      alert(getText(
        '업무일지 공유 링크가 클립보드에 복사되었습니다.',
        'Work journal share link copied to clipboard.',
        '工作日志分享链接已复制到剪贴板。',
        'ลิงก์แชร์บันทึกการทำงานได้คัดลอกไปยังคลิปบอร์ดแล้ว'
      ));
      
    } catch (error) {
      console.error('링크 생성 오류:', error);
      alert(getText(
        '링크 생성 중 오류가 발생했습니다.',
        'An error occurred while generating the link.',
        '生成链接时发生错误。',
        'เกิดข้อผิดพลาดในการสร้างลิงก์'
      ));
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // 댓글 추가
  const addComment = () => {
    if (!newComment.trim() || !selectedJournal) return;

    const comment = {
      id: Date.now().toString(),
      content: newComment,
      author: getText("현재 사용자", "Current User", "当前用户", "ผู้ใช้ปัจจุบัน"),
      created_at: new Date().toISOString()
    };

    setComments(prev => ({
      ...prev,
      [selectedJournal.id]: [...(prev[selectedJournal.id] || []), comment]
    }));

    setNewComment("");
  };

  // 댓글 삭제
  const deleteComment = (commentId: string) => {
    if (!selectedJournal) return;

    setComments(prev => ({
      ...prev,
      [selectedJournal.id]: (prev[selectedJournal.id] || []).filter(c => c.id !== commentId)
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/managers')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {getText('담당자 목록으로', 'Back to Manager List', '返回负责人列表', 'กลับไปยังรายชื่อผู้รับผิดชอบ')}
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {getText('모든 업무 일지', 'All Work Journals', '所有工作日志', 'บันทึกการทำงานทั้งหมด')}
          </h1>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {getText('전체 일지', 'Total Journals', '总日志', 'บันทึกทั้งหมด')}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {getText('완료', 'Completed', '已完成', 'เสร็จสิ้น')}
                </p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {getText('진행중', 'In Progress', '进行中', 'กำลังดำเนินการ')}
                </p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {getText('작성 담당자', 'Active Managers', '活跃负责人', 'ผู้รับผิดชอบที่ใช้งาน')}
                </p>
                <p className="text-2xl font-bold">{stats.totalManagers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {getText('전체 담당자', 'Total Managers', '总负责人', 'ผู้รับผิดชอบทั้งหมด')}
                </p>
                <p className="text-2xl font-bold">{stats.totalRegisteredManagers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={getText(
                  "일지 내용이나 담당자명 검색...",
                  "Search journal content or manager name...",
                  "搜索日志内容或负责人姓名...",
                  "ค้นหาเนื้อหาบันทึกหรือชื่อผู้รับผิดชอบ..."
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 담당자 필터 */}
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger>
                <SelectValue placeholder={getText("담당자 선택", "Select Manager", "选择负责人", "เลือกผู้รับผิดชอบ")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {getText('모든 담당자', 'All Managers', '所有负责人', 'ผู้รับผิดชอบทั้งหมด')}
                </SelectItem>
                {managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 부서 필터 */}
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder={getText("부서 선택", "Select Department", "选择部门", "เลือกแผนก")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {getText('모든 부서', 'All Departments', '所有部门', 'แผนกทั้งหมด')}
                </SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {getTranslatedDepartmentName(dept, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={getText("상태 선택", "Select Status", "选择状态", "เลือกสถานะ")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {getText('모든 상태', 'All Status', '所有状态', 'สถานะทั้งหมด')}
                </SelectItem>
                <SelectItem value="completed">
                  {getText('완료', 'Completed', '已完成', 'เสร็จสิ้น')}
                </SelectItem>
                <SelectItem value="in-progress">
                  {getText('진행중', 'In Progress', '进行中', 'กำลังดำเนินการ')}
                </SelectItem>
                <SelectItem value="pending">
                  {getText('보류', 'Pending', '待处理', 'รอดำเนินการ')}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* 정렬 */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder={getText("정렬 기준", "Sort By", "排序方式", "จัดเรียงตาม")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">
                  {getText('최신순', 'Latest First', '最新优先', 'ล่าสุดก่อน')}
                </SelectItem>
                <SelectItem value="date-asc">
                  {getText('오래된순', 'Oldest First', '最旧优先', 'เก่าที่สุดก่อน')}
                </SelectItem>
                <SelectItem value="manager">
                  {getText('담당자순', 'By Manager', '按负责人', 'ตามผู้รับผิดชอบ')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 메인 콘텐츠 - 업무일지 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {getText('업무일지 목록', 'Work Journal List', '工作日志列表', 'รายการบันทึกการทำงาน')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {getText('링크', 'Link', '链接', 'ลิงก์')}
                </TableHead>
                <TableHead>
                  {getText('작성 날짜', 'Created Date', '创建日期', 'วันที่สร้าง')}
                </TableHead>
                <TableHead>
                  {getText('담당자명', 'Manager Name', '负责人姓名', 'ชื่อผู้รับผิดชอบ')}
                </TableHead>
                <TableHead>
                  {getText('부서', 'Department', '部门', 'แผนก')}
                </TableHead>
                <TableHead>
                  {getText('직책', 'Position', '职位', 'ตำแหน่ง')}
                </TableHead>
                <TableHead>
                  {getText('상태', 'Status', '状态', 'สถานะ')}
                </TableHead>
                <TableHead>
                  {getText('업무일지', 'Work Journal', '工作日志', 'บันทึกการทำงาน')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJournals.map((journal, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateJournalLink(journal.id)}
                      disabled={isGeneratingLink}
                      className="flex items-center gap-1 h-8 px-2"
                    >
                      {isGeneratingLink ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-current"></div>
                      ) : (
                        <Link className="h-3 w-3" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      try {
                        const date = parseISO(journal.created_at);
                        return isValid(date) ? format(date, 'yyyy.MM.dd HH:mm', { locale: ko }) : getText('날짜 없음', 'No Date', '无日期', 'ไม่มีวันที่');
                      } catch {
                        return getText('날짜 없음', 'No Date', '无日期', 'ไม่มีวันที่');
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={journal.author?.profile_image} />
                        <AvatarFallback className="text-xs">
                          {journal.author?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{journal.author?.name || getText('알 수 없음', 'Unknown', '未知', 'ไม่ทราบ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDepartmentName(journal.author?.department_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getPositionName(journal.author?.position_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        journal.status === 'completed' ? 'default' : 
                        journal.status === 'in-progress' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {getStatusText(journal.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openJournalDetail(journal)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      {getText('상세보기', 'View Details', '查看详情', 'ดูรายละเอียด')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredJournals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedManager !== "all" || selectedDepartment !== "all" || selectedStatus !== "all"
                ? getText(
                    '조건에 맞는 업무일지가 없습니다.',
                    'No work journals match the criteria.',
                    '没有符合条件的工作日志。',
                    'ไม่มีบันทึกการทำงานที่ตรงกับเงื่อนไข'
                  )
                : getText(
                    '등록된 업무일지가 없습니다.',
                    'No registered work journals.',
                    '没有注册的工作日志。',
                    'ไม่มีบันทึกการทำงานที่ลงทะเบียน'
                  )
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* 업무일지 상세보기 슬라이드 패널 */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[600px] max-w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {getText('업무일지 상세보기', 'Work Journal Details', '工作日志详情', 'รายละเอียดบันทึกการทำงาน')}
            </SheetTitle>
          </SheetHeader>
          
          {selectedJournal && (
            <div className="space-y-6 mt-6">
              {/* 작성자 정보 */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedJournal.author?.profile_image} />
                  <AvatarFallback>
                    {selectedJournal.author?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedJournal.author?.name || getText('알 수 없음', 'Unknown', '未知', 'ไม่ทราบ')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getDepartmentName(selectedJournal.author?.department_id)} • {getPositionName(selectedJournal.author?.position_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      try {
                        const date = parseISO(selectedJournal.created_at);
                        return isValid(date) ? format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko }) : getText('날짜 없음', 'No Date', '无日期', 'ไม่มีวันที่');
                      } catch {
                        return getText('날짜 없음', 'No Date', '无日期', 'ไม่มีวันที่');
                      }
                    })()}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge 
                    variant={
                      selectedJournal.status === 'completed' ? 'default' : 
                      selectedJournal.status === 'in-progress' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {getStatusText(selectedJournal.status)}
                  </Badge>
                </div>
              </div>

              {/* 업무일지 내용 */}
              <div>
                <h4 className="font-semibold mb-3">
                  {getText('업무일지 내용', 'Work Journal Content', '工作日志内容', 'เนื้อหาบันทึกการทำงาน')}
                </h4>
                <div className="p-4 border rounded-lg bg-white space-y-4">
                  {selectedJournal.content ? (
                    (() => {
                      try {
                        // JSON 형태인지 확인하고 파싱
                        const parsedContent = JSON.parse(selectedJournal.content);
                        if (Array.isArray(parsedContent)) {
                          // 다중 업무 항목인 경우
                          return parsedContent.map((task: any, index: number) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                              <h5 className="font-semibold text-lg mb-2">
                                {task.title || getText(`업무 ${index + 1}`, `Task ${index + 1}`, `任务 ${index + 1}`, `งาน ${index + 1}`)}
                              </h5>
                              <div 
                                className="text-gray-700 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: task.content || '' }}
                              />
                            </div>
                          ));
                        } else {
                          // 단일 객체인 경우
                          return (
                            <div className="border-l-4 border-blue-500 pl-4 py-2">
                              <h5 className="font-semibold text-lg mb-2">
                                {parsedContent.title || getText('업무일지', 'Work Journal', '工作日志', 'บันทึกการทำงาน')}
                              </h5>
                              <div 
                                className="text-gray-700 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: parsedContent.content || '' }}
                              />
                            </div>
                          );
                        }
                      } catch {
                        // JSON 파싱 실패 시 일반 텍스트로 표시
                        return (
                          <div className="border-l-4 border-blue-500 pl-4 py-2">
                            <h5 className="font-semibold text-lg mb-2">
                              {getText('업무일지', 'Work Journal', '工作日志', 'บันทึกการทำงาน')}
                            </h5>
                            <div className="text-gray-700 whitespace-pre-wrap">
                              {selectedJournal.content}
                            </div>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <p className="text-muted-foreground">
                      {getText('내용이 없습니다.', 'No content available.', '没有内容。', 'ไม่มีเนื้อหา')}
                    </p>
                  )}
                </div>
              </div>

              {/* 댓글 섹션 */}
              <div>
                <h4 className="font-semibold mb-3">
                  {getText('댓글', 'Comments', '评论', 'ความคิดเห็น')} 
                  ({(comments[selectedJournal.id] || []).length})
                </h4>
                
                {/* 댓글 목록 */}
                <div className="space-y-3 mb-4">
                  {(comments[selectedJournal.id] || []).map(comment => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{comment.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(comment.created_at), 'MM/dd HH:mm')}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteComment(comment.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 댓글 작성 */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder={getText(
                      "댓글을 입력하세요...",
                      "Enter a comment...",
                      "输入评论...",
                      "ป้อนความคิดเห็น..."
                    )}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AllJournals; 