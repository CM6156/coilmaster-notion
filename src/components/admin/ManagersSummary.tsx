'use client';

import { useEffect, useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Manager } from "@/types";

export default function ManagersSummary() {
  const { managers, corporations, departments, positions } = useAppContext();
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  const [selectedCorporation, setSelectedCorporation] = useState<string>("all");

  // 샘플 담당자 데이터 (실제 데이터가 없는 경우 표시용)
  const sampleManagers: Manager[] = [
    {
      id: "sample-1",
      name: "김철수",
      email: "kim@example.com",
      profile_image: "https://ui-avatars.com/api/?name=김철수&background=0D8ABC&color=fff",
      department_id: "dept-1",
      corporation_id: "corp-1",
      position_id: "pos-1",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      department: { id: "dept-1", name: "영업부", code: "sales" },
      corporation: { id: "corp-1", name: "본사", code: "HQ" },
      position: { id: "pos-1", name: "팀장", code: "manager" }
    },
    {
      id: "sample-2",
      name: "이영희",
      email: "lee@example.com",
      profile_image: "https://ui-avatars.com/api/?name=이영희&background=4CAF50&color=fff",
      department_id: "dept-2",
      corporation_id: "corp-1",
      position_id: "pos-2",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      department: { id: "dept-2", name: "마케팅부", code: "marketing" },
      corporation: { id: "corp-1", name: "본사", code: "HQ" },
      position: { id: "pos-2", name: "대리", code: "assistant" }
    },
    {
      id: "sample-3",
      name: "박지훈",
      email: "park@example.com",
      profile_image: "https://ui-avatars.com/api/?name=박지훈&background=FF5722&color=fff",
      department_id: "dept-3",
      corporation_id: "corp-2",
      position_id: "pos-3",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      department: { id: "dept-3", name: "개발부", code: "dev" },
      corporation: { id: "corp-2", name: "연구소", code: "RD" },
      position: { id: "pos-3", name: "과장", code: "manager" }
    }
  ];

  // 실제 데이터와 샘플 데이터 결합
  const displayManagers = useMemo(() => {
    if (managers && managers.length > 0) {
      return managers;
    }
    return sampleManagers;
  }, [managers]);

  // 담당자 필터링
  useEffect(() => {
    if (!displayManagers) return;
    
    let filtered = [...displayManagers];
    
    if (selectedCorporation !== "all") {
      filtered = filtered.filter(m => m.corporation_id === selectedCorporation);
    }
    
    setFilteredManagers(filtered);
  }, [displayManagers, selectedCorporation]);

  // 법인 이름 가져오기
  const getCorporationName = (manager: any) => {
    if (manager.corporation && typeof manager.corporation === 'object' && manager.corporation.name) {
      return manager.corporation.name;
    }
    
    if (manager.corporation_id) {
      const corp = corporations.find(c => c.id === manager.corporation_id);
      if (corp) {
        return corp.name;
      }
    }
    
    return '-';
  };

  // 부서 이름 가져오기
  const getDepartmentName = (manager: any) => {
    if (manager.department && typeof manager.department === 'object' && manager.department.name) {
      return manager.department.name;
    }
    
    if (manager.department_id) {
      const dept = departments.find(d => d.id === manager.department_id);
      if (dept) {
        return dept.name;
      }
    }
    
    return '-';
  };

  // 직책 이름 가져오기
  const getPositionName = (manager: any) => {
    if (manager.position && typeof manager.position === 'object' && manager.position.name) {
      return manager.position.name;
    }
    
    if (manager.position_id) {
      const pos = positions.find(p => p.id === manager.position_id);
      if (pos) {
        return pos.name;
      }
    }
    
    return '-';
  };

  // 이니셜 생성 함수
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // 법인별 담당자 그룹화
  const managersByGroup = corporations.map(corp => {
    const managersInCorp = managers.filter(m => m.corporation_id === corp.id);
    return {
      corporation: corp,
      managers: managersInCorp
    };
  });

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>담당자 요약</CardTitle>
        <CardDescription>부서 및 법인별 담당자 정보</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="grid">그리드 보기</TabsTrigger>
            <TabsTrigger value="list">목록 보기</TabsTrigger>
            <TabsTrigger value="corporation">법인별 보기</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredManagers.map(manager => (
                <Card key={manager.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex items-center p-4">
                    <Avatar className="h-16 w-16 mr-4">
                      <AvatarImage src={manager.profile_image || ''} alt={manager.name} />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {getInitials(manager.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{manager.name}</h3>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          {getDepartmentName(manager)}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                          {getPositionName(manager)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted px-4 py-2 text-xs font-medium">
                    {getCorporationName(manager)}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="list">
            <div className="space-y-2">
              {filteredManagers.map(manager => (
                <div key={manager.id} className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={manager.profile_image || ''} alt={manager.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(manager.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{manager.name}</h3>
                      <Badge variant="outline">{getCorporationName(manager)}</Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{getDepartmentName(manager)}</span>
                      <span className="mx-2">•</span>
                      <span>{getPositionName(manager)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="corporation">
            <div className="space-y-6">
              {managersByGroup.filter(group => group.managers.length > 0).map(group => (
                <div key={group.corporation.id}>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                    {group.corporation.name} ({group.managers.length}명)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.managers.map(manager => (
                      <div key={manager.id} className="flex items-center p-3 border rounded-lg">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={manager.profile_image || ''} alt={manager.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials(manager.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{manager.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {getDepartmentName(manager)} / {getPositionName(manager)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 