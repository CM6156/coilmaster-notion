import { Translations } from '../types';
import { globalTranslations } from './ko/global';
import { sidebarTranslations } from './ko/sidebar';
import { notificationTranslations } from './ko/notification';
import { dashboardTranslations } from './ko/dashboard';
import { authTranslations } from './ko/auth';
import { projectsTranslations } from './ko/projects';
import { tasksTranslations, taskDetailsTranslations, taskCreateTranslations, subtaskCreateTranslations } from './ko/tasks';
import { teamTranslations } from './ko/team';
import { clientsTranslations } from './ko/clients';
import { reportsTranslations } from './ko/reports';
import { introTranslations } from './ko/intro';
import { calendarTranslations } from './ko/calendar';
import { adminTranslations } from './ko/admin';
import { profileTranslations } from './ko/profile';

export const koTranslations: Translations = {
  global: globalTranslations,
  sidebar: sidebarTranslations,
  notification: notificationTranslations,
  dashboard: dashboardTranslations,
  login: authTranslations.login,
  register: authTranslations.register,
  forgotPassword: authTranslations.forgotPassword,
  projects: projectsTranslations,
  tasks: tasksTranslations,
  taskDetails: taskDetailsTranslations,
  taskCreate: taskCreateTranslations,
  subtaskCreate: subtaskCreateTranslations,
  team: teamTranslations,
  clients: clientsTranslations,
  reports: reportsTranslations,
  intro: introTranslations,
  calendar: calendarTranslations,
  admin: adminTranslations,
  profile: profileTranslations,
};
