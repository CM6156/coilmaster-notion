import React from 'react';
import MyWorkLogs from '@/components/work-logs/MyWorkLogs';

const MyWorkLogsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <MyWorkLogs />
      </div>
    </div>
  );
};

export default MyWorkLogsPage; 