
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Eye } from "lucide-react";
import { JournalEntry } from "@/hooks/use-journal";

interface JournalCardProps {
  journal: JournalEntry;
  onClick: (id: string) => void;
}

export default function JournalCard({ journal, onClick }: JournalCardProps) {
  return (
    <Card key={journal.id} className="hover:border-blue-300 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{journal.title}</CardTitle>
        </div>
        <div className="text-xs text-slate-500 mt-1 flex gap-2 items-center">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {journal.userName}
          </span>
          <span>•</span>
          <span>{journal.department}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-3">
          {journal.content}
        </p>
        <div className="mt-4 text-xs text-slate-500">
          작성일: {new Date(journal.createdAt).toLocaleDateString('ko-KR')}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onClick(journal.id)}
          className="w-full text-sm"
        >
          <Eye className="mr-2 h-3 w-3" />
          상세정보
        </Button>
      </CardFooter>
    </Card>
  );
}
