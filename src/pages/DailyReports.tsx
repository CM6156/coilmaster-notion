import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Notification, User, TaskLog } from "@/types";
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useJournal } from "@/hooks/use-journal";

interface Report {
  id: string;
  userId: string;
  date: string;
  content: string;
}

const DailyReports = () => {
  const { users, currentUser, addNotification } = useAppContext();
  const { toast } = useToast();
  const { addJournalEntry } = useJournal();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [reportContent, setReportContent] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  
  useEffect(() => {
    // Load reports from local storage on component mount
    const storedReports = localStorage.getItem("dailyReports");
    if (storedReports) {
      setReports(JSON.parse(storedReports));
    }
  }, []);
  
  useEffect(() => {
    // Save reports to local storage whenever reports state changes
    localStorage.setItem("dailyReports", JSON.stringify(reports));
  }, [reports]);
  
  const handleUserSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setSelectedUser(user || null);
    setSelectedReport(null);
    setReportContent("");
    
    // Load existing report for selected user and date
    const existingReport = reports.find(
      (report) => report.userId === userId && report.date === formatDate(selectedDate)
    );
    
    if (existingReport) {
      setSelectedReport(existingReport);
      setReportContent(existingReport.content);
    } else {
      setReportContent("");
    }
  };
  
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedReport(null);
    setReportContent("");
    
    if (selectedUser && date) {
      // Load existing report for selected user and date
      const existingReport = reports.find(
        (report) => report.userId === selectedUser.id && report.date === formatDate(date)
      );
      
      if (existingReport) {
        setSelectedReport(existingReport);
        setReportContent(existingReport.content);
      } else {
        setReportContent("");
      }
    }
  };
  
  const handleReportSubmit = () => {
    if (!selectedUser) {
      toast({
        title: "오류",
        description: "사용자를 선택해주세요.",
      });
      return;
    }
    
    if (!selectedDate) {
      toast({
        title: "오류",
        description: "날짜를 선택해주세요.",
      });
      return;
    }
    
    const reportDate = formatDate(selectedDate);
    
    if (selectedReport) {
      // Update existing report
      const updatedReports = reports.map((report) =>
        report.id === selectedReport.id ? { ...report, content: reportContent } : report
      );
      setReports(updatedReports);
      setSelectedReport({ ...selectedReport, content: reportContent });
      
      addJournalEntry(
        currentUser?.id || "",
        `${selectedUser.name}의 ${reportDate} 보고서가 수정되었습니다.`,
        "report",
        selectedReport.id
      );
      
      toast.success("보고서가 수정되었습니다.");
    } else {
      // Create new report
      const newReport: Report = {
        id: Date.now().toString(),
        userId: selectedUser.id,
        date: reportDate,
        content: reportContent,
      };
      setReports([...reports, newReport]);
      setSelectedReport(newReport);
      
      addJournalEntry(
        currentUser?.id || "",
        `${selectedUser.name}의 ${reportDate} 보고서가 등록되었습니다.`,
        "report",
        newReport.id
      );
      
      createNotification();
    }
  };
  
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd", { locale: ko });
  };

  // Fix the isRead property in notification creation
  const createNotification = () => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: "report",
      message: `${selectedUser?.name}의 일일 보고서가 등록되었습니다.`,
      read: false,
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || "",
      relatedId: selectedReport?.id || "",
      timestamp: new Date().toLocaleString()
    };
    
    addNotification(newNotification);
    toast.success("보고서가 등록되었습니다.");
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">일일 보고서</h1>
        <p className="text-slate-600">직원별 일일 업무 보고서 작성 및 관리</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>보고서 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">사용자 선택</Label>
                <Select onValueChange={handleUserSelect}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="사용자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>날짜 선택</Label>
                <div className="relative">
                  <Input
                    placeholder="날짜 선택"
                    value={selectedDate ? formatDate(selectedDate) : ""}
                    readOnly
                  />
                  <Calendar className="absolute top-2 right-2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>보고서 내용</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="textarea"
                placeholder="보고서 내용을 입력하세요..."
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                className="min-h-[150px]"
              />
              
              <Button onClick={handleReportSubmit}>보고서 제출</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyReports;
