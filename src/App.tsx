import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ui/theme-provider";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { UserActivityProvider } from "./context/UserActivityContext";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

// Pages
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
// import Calendar from "./pages/Calendar";
// import Reports from "./pages/Reports";
// import TeamView from "./pages/TeamView";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Intro from "./pages/Intro";
import Index from "./pages/Index";

// Tasks subpages
import TaskJournal from "./pages/tasks/TaskJournal";
import TaskJournalList from "./pages/tasks/TaskJournalList";

// Team subpages
// import TeamByCorporation from "./pages/team/TeamByCorporation";
// import TeamByDepartment from "./pages/team/TeamByDepartment";
// import TeamByExecutive from "./pages/team/TeamByExecutive";

// New pages
import Customers from "./pages/Customers";
import Contacts from "./pages/Contacts";
import DailyReports from "./pages/DailyReports";

// Chat pages (temporarily disabled)
// import Chat from "./pages/Chat";
// import DirectMessages from "./pages/DirectMessages";

import Layout from "./components/layout/Layout";
import { useAuth } from "./context/AuthContext";
import { Navigate } from "react-router-dom";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Root redirect component - checks auth status first
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/intro"} replace />;
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <LanguageProvider>
        <UserActivityProvider>
          <AppProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/intro" element={<Intro />} />
            
            {/* Root route - checks auth status first */}
            <Route index element={<RootRedirect />} />

            {/* Protected routes with Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/journal" element={<TaskJournal />} />
              <Route path="/tasks/journal/:id" element={<TaskJournal />} />
              <Route path="/tasks/journals" element={<TaskJournalList />} />
              {/* Add the journal-list route to fix the 404 error */}
              <Route path="/tasks/journal-list" element={<TaskJournalList />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/daily-reports" element={<DailyReports />} />
              {/* <Route path="/chat" element={<Chat />} /> */}
              {/* <Route path="/chat/direct" element={<DirectMessages />} /> */}
              {/* <Route path="/calendar" element={<Calendar />} /> */}
              {/* <Route path="/reports" element={<Reports />} /> */}
              {/* <Route path="/team" element={<TeamView />} /> */}
              {/* <Route path="/team/corporation" element={<TeamByCorporation />} /> */}
              {/* <Route path="/team/department" element={<TeamByDepartment />} /> */}
              {/* <Route path="/team/executive" element={<TeamByExecutive />} /> */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster />
        </AppProvider>
        </UserActivityProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
