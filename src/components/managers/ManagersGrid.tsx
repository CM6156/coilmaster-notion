import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { 
  Grid2X2, 
  List, 
  Building2, 
  Search, 
  Phone, 
  Mail
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// 샘플 데이터 타입
type Manager = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position_id?: string;
  corporation_id?: string;
  profile_image?: string;
  created_at?: string;
};

const ManagersGrid = () => {
  const navigate = useNavigate();
  const { managers, departments, corporations, positions, getTranslatedDepartmentName, getTranslatedPositionName } = useAppContext();
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "corporation">("grid");
  const [searchQuery, setSearchQuery] = useState("");

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

  // 검색 필터링
  const filteredManagers = useMemo(() => {
    if (!managers || !Array.isArray(managers)) return [];
    
    return managers.filter(manager => {
      const searchLower = searchQuery.toLowerCase();
      return (
        manager.name?.toLowerCase().includes(searchLower) ||
        manager.email?.toLowerCase().includes(searchLower) ||
        getDepartmentName(manager.department_id)?.toLowerCase().includes(searchLower) ||
        getPositionName(manager.position_id)?.toLowerCase().includes(searchLower)
      );
    });
  }, [managers, searchQuery]);

  // 법인별 그룹화
  const managersByCorps = useMemo(() => {
    if (!filteredManagers.length || !corporations) return {};
    
    return filteredManagers.reduce((acc: Record<string, Manager[]>, manager) => {
      const corpId = manager.corporation_id || 'unknown';
      if (!acc[corpId]) {
        acc[corpId] = [];
      }
      acc[corpId].push(manager);
      return acc;
    }, {});
  }, [filteredManagers, corporations]);

  // 부서명 가져오기 (번역 지원)
  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return getText('미지정', 'Unassigned', '未指定', 'ยังไม่กำหนด');
    
    // 실제 데이터에서 찾기
    if (departments && departments.length > 0) {
      const department = departments.find(d => d.id === departmentId);
      if (department) return getTranslatedDepartmentName(department, language);
    }
    
    // 샘플 데이터 매핑
    const sampleDeptMapping: Record<string, string> = {
      'dept-sales': getText('영업', 'Sales', '销售', 'การขาย'),
      'dept-dev': getText('개발', 'Development', '开发', 'การพัฒนา'),
      'dept-marketing': getText('마케팅', 'Marketing', '营销', 'การตลาด')
    };
    
    return sampleDeptMapping[departmentId] || getText('미지정', 'Unassigned', '未指定', 'ยังไม่กำหนด');
  };

  // 직책명 가져오기 (번역 지원)
  const getPositionName = (positionId?: string) => {
    if (!positionId) return getText('미지정', 'Unassigned', '未指定', 'ยังไม่กำหนด');
    
    // 실제 데이터에서 찾기
    if (positions && positions.length > 0) {
      const position = positions.find(p => p.id === positionId);
      if (position) return getTranslatedPositionName(position, language);
    }
    
    // 샘플 데이터 매핑
    const samplePosMapping: Record<string, string> = {
      'pos-manager': getText('매니저', 'Manager', '经理', 'ผู้จัดการ'),
      'pos-senior': getText('시니어', 'Senior', '高级', 'อาวุโส'),
      'pos-lead': getText('리드', 'Lead', '负责人', 'หัวหน้า')
    };
    
    return samplePosMapping[positionId] || getText('미지정', 'Unassigned', '未指定', 'ยังไม่กำหนด');
  };

  // 법인명 가져오기
  const getCorporationName = (corporationId?: string) => {
    if (!corporationId) return getText('미지정', 'Unassigned', '未指定', 'ยังไม่กำหนด');
    
    // 실제 데이터에서 찾기
    if (corporations && corporations.length > 0) {
      const corporation = corporations.find(c => c.id === corporationId);
      if (corporation) return corporation.name;
    }
    
    // 샘플 데이터 매핑
    const sampleCorpMapping: Record<string, string> = {
      'corp-kr': 'Coilmaster Sales Office (KOREA)',
      'corp-th': 'Coilmaster Thailand',
      'corp-us': 'Coilmaster Sales/Warehouse (USA)'
    };
    
    return sampleCorpMapping[corporationId] || getText('미지정', 'Unassigned', '未指定', 'ยังไม่กำหนด');
  };

  // 이니셜 생성
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // 상세 페이지로 이동
  const handleManagerClick = (managerId: string) => {
    navigate(`/managers/${managerId}`);
  };

  // 담당자 데이터가 없을 경우를 대비한 샘플 데이터
  const sampleManagers: Manager[] = [
    {
      id: 'sample-1',
      name: 'David(장문성)',
      email: 'david@coilmaster.co.kr',
      phone: '010-1234-5678',
      department_id: 'dept-sales',
      position_id: 'pos-manager',
      corporation_id: 'corp-kr',
      profile_image: ''
    },
    {
      id: 'sample-2',
      name: 'Justin(장석구)',
      email: 'justin@coilmaster.co.kr',
      phone: '010-9876-5432',
      department_id: 'dept-sales',
      position_id: 'pos-manager',
      corporation_id: 'corp-kr',
      profile_image: ''
    },
    {
      id: 'sample-3',
      name: 'Jenna-Sam(유상용)',
      email: 'jenna@coilmaster.co.th',
      phone: '+66-123-456789',
      department_id: 'dept-sales',
      position_id: 'pos-manager',
      corporation_id: 'corp-th',
      profile_image: ''
    },
    {
      id: 'sample-4',
      name: 'Mike Johnson',
      email: 'mike@coilmaster-usa.com',
      phone: '+1-555-123-4567',
      department_id: 'dept-sales',
      position_id: 'pos-manager',
      corporation_id: 'corp-us',
      profile_image: ''
    }
  ];

  // 실제 렌더링에 사용할 데이터 (실제 데이터 또는 샘플 데이터)
  const displayManagers = filteredManagers.length > 0 ? filteredManagers : sampleManagers;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-2xl">
            {getText('담당자 목록', 'Manager List', '负责人列表', 'รายชื่อผู้รับผิดชอบ')}
          </CardTitle>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {getText('그리드 보기', 'Grid View', '网格视图', 'มุมมองตาราง')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {getText('목록 보기', 'List View', '列表视图', 'มุมมองรายการ')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "corporation" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("corporation")}
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {getText('법인별 보기', 'By Corporation', '按公司查看', 'มุมมองตามบริษัท')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={getText(
              "담당자 검색 (이름, 이메일, 부서, 직책)",
              "Search managers (name, email, department, position)",
              "搜索负责人（姓名、邮箱、部门、职位）",
              "ค้นหาผู้รับผิดชอบ (ชื่อ, อีเมล, แผนก, ตำแหน่ง)"
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayManagers.map((manager) => (
              <div
                key={manager.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleManagerClick(manager.id)}
              >
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={manager.profile_image} alt={manager.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(manager.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center">
                    <h3 className="font-medium">{manager.name}</h3>
                    <p className="text-sm text-muted-foreground">{getPositionName(manager.position_id)}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{getDepartmentName(manager.department_id)}</Badge>
                      <Badge variant="secondary" className="text-xs">{getCorporationName(manager.corporation_id)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {viewMode === "list" && (
          <div className="space-y-3">
            {displayManagers.map((manager) => (
              <div
                key={manager.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleManagerClick(manager.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={manager.profile_image} alt={manager.name} />
                    <AvatarFallback className="bg-primary">
                      {getInitials(manager.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{manager.name}</h3>
                    <p className="text-sm text-muted-foreground">{getPositionName(manager.position_id)}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{getDepartmentName(manager.department_id)}</Badge>
                      <Badge variant="secondary" className="text-xs">{getCorporationName(manager.corporation_id)}</Badge>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {manager.email}
                    </div>
                    {manager.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {manager.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {viewMode === "corporation" && (
          <Tabs defaultValue={Object.keys(managersByCorps)[0] || "corp-kr"} className="w-full">
            <TabsList className={`grid w-full mb-4 ${Object.keys(managersByCorps).length > 0 ? `grid-cols-${Math.min(Object.keys(managersByCorps).length, 4)}` : 'grid-cols-3'}`}>
              {Object.keys(managersByCorps).length > 0 ? (
                Object.keys(managersByCorps).map((corpId) => (
                  <TabsTrigger key={corpId} value={corpId}>
                    {getCorporationName(corpId)} ({managersByCorps[corpId]?.length || 0})
                  </TabsTrigger>
                ))
              ) : (
                // 기본 샘플 탭
                <>
                  <TabsTrigger value="corp-kr">
                    Coilmaster Sales Office (KOREA) (2)
                  </TabsTrigger>
                  <TabsTrigger value="corp-th">
                    Coilmaster Thailand (1)
                  </TabsTrigger>
                  <TabsTrigger value="corp-us">
                    Coilmaster Sales/Warehouse (USA) (1)
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            {Object.keys(managersByCorps).length > 0 ? (
              Object.entries(managersByCorps).map(([corpId, managers]) => (
                <TabsContent key={corpId} value={corpId} className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {managers.map((manager) => (
                      <div
                        key={manager.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleManagerClick(manager.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={manager.profile_image} alt={manager.name} />
                            <AvatarFallback className="bg-primary">
                              {getInitials(manager.name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <h3 className="font-medium">{manager.name}</h3>
                            <p className="text-sm text-muted-foreground">{getPositionName(manager.position_id)}</p>
                            <div className="flex flex-col gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">{getDepartmentName(manager.department_id)}</Badge>
                              <Badge variant="secondary" className="text-xs">{getCorporationName(manager.corporation_id)}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))
            ) : (
              // 샘플 탭 컨텐츠
              <>
                <TabsContent value="corp-kr" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {sampleManagers
                      .filter(m => m.corporation_id === 'corp-kr')
                      .map((manager) => (
                        <div
                          key={manager.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleManagerClick(manager.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={manager.profile_image} alt={manager.name} />
                              <AvatarFallback className="bg-primary">
                                {getInitials(manager.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h3 className="font-medium">{manager.name}</h3>
                              <p className="text-sm text-muted-foreground">{getPositionName(manager.position_id)}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">{getDepartmentName(manager.department_id)}</Badge>
                                <Badge variant="secondary" className="text-xs">{getCorporationName(manager.corporation_id)}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="corp-th" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {sampleManagers
                      .filter(m => m.corporation_id === 'corp-th')
                      .map((manager) => (
                        <div
                          key={manager.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleManagerClick(manager.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={manager.profile_image} alt={manager.name} />
                              <AvatarFallback className="bg-primary">
                                {getInitials(manager.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h3 className="font-medium">{manager.name}</h3>
                              <p className="text-sm text-muted-foreground">{getPositionName(manager.position_id)}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">{getDepartmentName(manager.department_id)}</Badge>
                                <Badge variant="secondary" className="text-xs">{getCorporationName(manager.corporation_id)}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="corp-us" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {sampleManagers
                      .filter(m => m.corporation_id === 'corp-us')
                      .map((manager) => (
                        <div
                          key={manager.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleManagerClick(manager.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={manager.profile_image} alt={manager.name} />
                              <AvatarFallback className="bg-primary">
                                {getInitials(manager.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h3 className="font-medium">{manager.name}</h3>
                              <p className="text-sm text-muted-foreground">{getPositionName(manager.position_id)}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">{getDepartmentName(manager.department_id)}</Badge>
                                <Badge variant="secondary" className="text-xs">{getCorporationName(manager.corporation_id)}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
        
        {displayManagers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">
              {getText(
                '담당자 정보가 없습니다',
                'No manager information available',
                '没有负责人信息',
                'ไม่มีข้อมูลผู้รับผิดชอบ'
              )}
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              {getText('검색 초기화', 'Reset Search', '重置搜索', 'รีเซ็ตการค้นหา')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManagersGrid; 