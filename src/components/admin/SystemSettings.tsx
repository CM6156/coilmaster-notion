
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cog } from "lucide-react";
import { Project, Task, User, Client } from "@/types";

interface SystemSettingsProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  clients: Client[];
}

export const SystemSettings = ({ projects, tasks, users, clients }: SystemSettingsProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>시스템 설정</CardTitle>
          <CardDescription>
            기본 설정을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">회사명</Label>
              <Input id="companyName" defaultValue="(주)테크솔루션" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="timezone">시간대</Label>
              <Select defaultValue="asia-seoul">
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="시간대 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia-seoul">아시아/서울 (GMT+9)</SelectItem>
                  <SelectItem value="america-la">미국/로스앤젤레스 (GMT-8)</SelectItem>
                  <SelectItem value="europe-london">유럽/런던 (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="language">기본 언어</Label>
              <Select defaultValue="ko">
                <SelectTrigger id="language">
                  <SelectValue placeholder="언어 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">영어</SelectItem>
                  <SelectItem value="ja">일본어</SelectItem>
                  <SelectItem value="zh">중국어</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dateFormat">날짜 형식</Label>
              <Select defaultValue="yyyy-mm-dd">
                <SelectTrigger id="dateFormat">
                  <SelectValue placeholder="날짜 형식 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                  <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button>
              <Cog className="mr-2 h-4 w-4" />
              설정 저장
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>시스템 정보</CardTitle>
          <CardDescription>
            현재 시스템 상태 및 정보를 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">버전</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">마지막 업데이트</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">데이터베이스 크기</span>
              <span>2.4 MB</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">총 프로젝트</span>
              <span>{projects.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">총 업무</span>
              <span>{tasks.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">사용자 수</span>
              <span>{users.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">고객사 수</span>
              <span>{clients.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
