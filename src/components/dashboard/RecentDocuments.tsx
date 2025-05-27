// Fix type error by converting string sizes to numbers
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FilePen,
  File,
  ExternalLink,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface Document {
  id: string;
  title: string;
  type: string;
  category: string;
  uploadDate: string;
  size: number;
  url: string;
}

export const RecentDocuments = () => {
  const { translations } = useLanguage();
  const t = translations.dashboard || {};

  // 실제 등록된 문서가 없으므로 빈 배열로 설정
  const documents: Document[] = [];

  // Choose icon based on document type
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'drawing':
        return <FileImage className="h-4 w-4 text-orange-500" />;
      case 'note':
        return <FilePen className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Convert bytes to readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Translate document category
  const translateCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'market-research': t.documentTypeMarketResearch || '시장 조사',
      'cost-analysis': t.documentTypeCostAnalysis || '비용 분석',
      'drawing': t.documentTypeDrawing || '도면',
      'certification': t.documentTypeCertification || '인증',
      'equipment': t.documentTypeEquipment || '장비',
      'raw-material': t.documentTypeRawMaterial || '원재료',
      'other': t.documentTypeOther || '기타'
    };
    
    return categoryMap[category] || category;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          {t.recentDocuments || "최근 문서"}
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs">
          {t.viewAll || "전체 보기"} <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center">
                  {getDocumentIcon(doc.type)}
                  <div className="ml-2">
                    <div className="text-sm font-medium">{doc.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {translateCategory(doc.category)} • {formatFileSize(doc.size)}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs" asChild>
                  <a href={doc.url}>
                    {t.view || "보기"}
                  </a>
                </Button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2 font-medium">등록된 문서가 없습니다</p>
              <p className="text-sm">
                문서 관리 시스템이 구축되면 여기에 최근 문서들이 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Add a default export to fix the import in Dashboard.tsx
export default RecentDocuments;
