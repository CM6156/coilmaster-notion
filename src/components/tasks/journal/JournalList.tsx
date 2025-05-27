
import React from 'react';
import { User, Calendar } from "lucide-react";
import JournalCard from './JournalCard';
import { JournalEntry } from '@/hooks/use-journal';

interface JournalGroupList {
  [key: string]: JournalEntry[];
}

interface JournalListProps {
  groupedJournals: JournalGroupList;
  groupBy: "none" | "user" | "date" | "department";
  onJournalClick: (id: string) => void;
}

export default function JournalList({ groupedJournals, groupBy, onJournalClick }: JournalListProps) {
  return (
    <div className="space-y-6">
      {Object.entries(groupedJournals).map(([groupName, entries]) => (
        <div key={groupName} className="space-y-4">
          {groupBy !== "none" && (
            <h2 className="text-xl font-medium flex items-center gap-2">
              {groupBy === "user" && <User className="h-5 w-5" />}
              {groupBy === "date" && <Calendar className="h-5 w-5" />}
              {groupName} <span className="text-sm text-slate-500">({entries.length})</span>
            </h2>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((journal) => (
              <JournalCard key={journal.id} journal={journal} onClick={onJournalClick} />
            ))}
          </div>
          
          {entries.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-slate-50">
              <p className="text-slate-500">업무일지가 없습니다.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
