// Global translations
export interface GlobalTranslations {
  searchPlaceholder?: string;
  dashboard?: string;
  projects?: string;
  tasks?: string;
  team?: string;
  calendar?: string;
  reports?: string;
  clients?: string;
  settings?: string;
  logout?: string;
  profile?: string;
  admin?: string;
  notifications?: string;
  language?: string;
  save?: string;
  cancel?: string;
  edit?: string;
  delete?: string;
  add?: string;
  filter?: string;
  sort?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  search?: string;
  loading?: string;
  checkingAuth?: string;
  actions?: string;
  country?: string;
  update?: string;
  error?: string;
  department?: string;
  project?: string;
  details?: string;
  
  // Status translations
  statusCompleted?: string;
  statusInProgress?: string;
  statusDelayed?: string;
  statusNotStarted?: string;
  statusActive?: string;
  statusOnHold?: string;
  
  // Priority translations
  priorityHigh?: string;
  priorityMedium?: string;
  priorityLow?: string;
  
  // Department names
  sales?: string;
  development?: string;
  manufacturing?: string;
  quality?: string;
  finance?: string;
  administration?: string;
  management?: string;
  engineering?: string;
  rnd?: string;
  production?: string;
  qa?: string;
}

// Sidebar translations
export interface SidebarTranslations {
  dashboard?: string;
  projects?: string;
  tasks?: string;
  team?: string;
  calendar?: string;
  reports?: string;
  clients?: string;
  admin?: string;
  adminPanel?: string;
  settings?: string;
  profile?: string;
  logout?: string;
  clientsAndPartners?: string;
  taskManagement?: string;
  taskJournal?: string;
  taskJournalList?: string;
  byCompany?: string;
  teamCorporation?: string;
  byDepartment?: string;
  teamDepartment?: string;
  byExecutive?: string;
  teamExecutive?: string;
  byEmployee?: string;
}

// Notification translations
export interface NotificationTranslations {
  markAllAsRead?: string;
  noNotifications?: string;
  viewAll?: string;
  title?: string;
}

// Dashboard translations
export interface DashboardTranslations {
  welcomeBack?: string;
  summary?: string;
  recentTasks?: string;
  upcomingDeadlines?: string;
  projectProgress?: string;
  tasksByDepartment?: string;
  recentDocuments?: string;
  productSchedule?: string;
  viewAll?: string;
  taskStatus?: string;
  pending?: string;
  inProgress?: string;
  completed?: string;
  overdue?: string;
  today?: string;
  noTasks?: string;
  noDeadlines?: string;
  noProjects?: string;
  noDocuments?: string;
  totalProgress?: string;
  completedTasks?: string;
  inProgressTasks?: string;
  delayedTasks?: string;
  outOf?: string;
  recentFiles?: string;
  byDepartment?: string;
  overview?: string;
  schedule?: string;
  daysLeft?: string;
  daysOverdue?: string;
  dueToday?: string;
  projectPhases?: string;
  todaysTasks?: string;
  upcomingTasks?: string;
  departmentStatistics?: string;
  salesDepartment?: string;
  developmentDepartment?: string;
  qualityDepartment?: string;
  manufacturingDepartment?: string;
  productionDepartment?: string;
  managementDepartment?: string;
  administrationDepartment?: string;
  financeDepartment?: string;
  engineeringDepartment?: string;
  rndDepartment?: string;
  qaDepatment?: string;
  tasksCompleted?: string;
  tasksInProgress?: string;
  tasksDelayed?: string;
  tasksPending?: string;
  departments?: string;
  deadlinesToday?: string;
  deadlinesThisWeek?: string;
  staffStatus?: string;
  staffCount?: string;
  staffByDepartment?: string;
  staffProjects?: string;
  staffSchedule?: string;
  staffWorkload?: string;
  staffMembers?: string;
  staffNoTasks?: string;
  staffWorkloadByDepartment?: string;
  staffWorkloadByIndividual?: string;
  memberCount?: string;
  projectComplete?: string;
  projectProgressAverage?: string;
  documentTypeMarketResearch?: string;
  documentTypeCostAnalysis?: string;
  documentTypeDrawing?: string;
  documentTypeCertification?: string;
  documentTypeEquipment?: string;
  documentTypeRawMaterial?: string;
  documentTypeOther?: string;
  view?: string;
}

// Auth translations
export interface LoginTranslations {
  title?: string;
  description?: string;
  email?: string;
  password?: string;
  rememberMe?: string;
  forgotPassword?: string;
  login?: string;
  noAccount?: string;
  register?: string;
  processing?: string;
  or?: string;
  registerAccount?: string;
}

export interface RegisterTranslations {
  title?: string;
  description?: string;
  name?: string;
  namePlaceholder?: string;
  email?: string;
  emailPlaceholder?: string;
  password?: string;
  passwordPlaceholder?: string;
  confirmPassword?: string;
  department?: string;
  departmentPlaceholder?: string;
  position?: string;
  positionPlaceholder?: string;
  terms?: string;
  register?: string;
  haveAccount?: string;
  alreadyHaveAccount?: string;
  login?: string;
  processing?: string;
  passwordStrength?: string;
  veryWeak?: string;
  weak?: string;
  medium?: string;
  strong?: string;
  veryStrong?: string;
}

export interface ForgotPasswordTranslations {
  title?: string;
  description?: string;
  sendLink?: string;
  processing?: string;
  backToLogin?: string;
  successMessage?: string;
  successDescription?: string;
  errorMessage?: string;
}

export interface AuthTranslations {
  login: LoginTranslations;
  register: RegisterTranslations;
  forgotPassword: ForgotPasswordTranslations;
}

// Projects translations
export interface ProjectsTranslations {
  title?: string;
  subtitle?: string;
  new?: string;
  filter?: string;
  status?: string;
  progress?: string;
  deadline?: string;
  members?: string;
  viewDetails?: string;
  edit?: string;
  delete?: string;
  allProjects?: string;
  createProject?: string;
  projectName?: string;
  name?: string; // Added for compatibility
  description?: string;
  client?: string;
  startDate?: string;
  dueDate?: string;
  manager?: string;
  team?: string;
  addMember?: string;
  save?: string;
  cancel?: string;
  projectDetails?: string;
  tasks?: string;
  documents?: string;
  phase?: string;
  noProjects?: string;
  createFirst?: string;
  requestDate?: string;
  targetSOPDate?: string;
  type?: string; // Added for compatibility
  department?: string; // Added for compatibility
  
  // Project status translations
  statusCompleted?: string;
  statusActive?: string;
  statusDelayed?: string;
  statusOnHold?: string;
  
  // Phase translations
  phasePlanning?: string;
  phaseDevelopment?: string;
  phaseManufacturing?: string;
  phaseQuality?: string;
  phaseProduction?: string;
  phaseSales?: string;
}

// Tasks translations
export interface TasksTranslations {
  title?: string;
  subtitle?: string;
  newTask?: string;
  filter?: string;
  status?: string;
  department?: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string;
  search?: string;
  all?: string;
  completed?: string;
  inProgress?: string;
  delayed?: string;
  overdue?: string;
  taskDetails?: string;
  edit?: string;
  delete?: string;
  noTasks?: string;
  createFirst?: string;
}

export interface TaskDetailsTranslations {
  description?: string;
  completionRate?: string;
  assignedTo?: string;
  startDate?: string;
  dueDate?: string;
  taskDescription?: string;
  attachments?: string;
  dependencies?: string;
  subtasks?: string;
  addSubtask?: string;
  noSubtasks?: string;
  daysLeft?: string;
  daysOverdue?: string;
  dueToday?: string;
  overdue?: string;
  priorityHigh?: string;
  priorityMedium?: string;
  priorityLow?: string;
  statusCompleted?: string;
  statusInProgress?: string;
  statusDelayed?: string;
  statusNotStarted?: string;
}

export interface TaskCreateTranslations {
  title?: string;
  name?: string;
  description?: string;
  project?: string;
  department?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  assignTo?: string;
  dependencies?: string;
  save?: string;
  cancel?: string;
  selectProject?: string;
  selectDepartment?: string;
  selectStatus?: string;
  selectPriority?: string;
  selectAssignee?: string;
  selectDependencies?: string;
}

export interface SubtaskCreateTranslations {
  title?: string;
  parentTask?: string;
  createSubtask?: string;
  name?: string;
  description?: string;
  department?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  assignTo?: string;
  save?: string;
  cancel?: string;
  high?: string;
  medium?: string;
  low?: string;
  selectDepartment?: string;
}

// Team translations
export interface TeamTranslations {
  title?: string;
  subTitle?: string;
  staffCount?: string;
  completionRate?: string;
  progressRate?: string;
  viewDetails?: string;
  noData?: string;
  byDepartment?: string;
  byExecutive?: string;
  byEmployee?: string;
  byCompany?: string;
  teamCorporation?: string;
  teamDepartment?: string;
  teamExecutive?: string;
  members?: string;
  tasks?: string;
  projects?: string;
  performance?: string;
  details?: string;
  name?: string;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  taskProgress?: string;
  assignedTasks?: string;
  completedTasks?: string;
  pendingTasks?: string;
  overduePercent?: string;
  noDepartmentData?: string;
}

// Clients translations
export interface ClientsTranslations {
  clientDB?: string;
  addClient?: string;
  clientList?: string;
  searchClientOrRep?: string;
  name?: string;
  salesRep?: string;
  addNewClient?: string;
  editClientInfo?: string;
  clientAddSuccess?: string;
  clientAddedDescription?: string;
  clientUpdateSuccess?: string;
  clientUpdatedDescription?: string;
  noCustomersFound?: string;
  title?: string;
  description?: string;
  newPartner?: string;
  new?: string;
  partnersList?: string;
  contactPerson?: string;
  contactEmail?: string;
  requirements?: string;
  client?: string;
  partner?: string;
  company?: string;
  country?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  actions?: string;
  viewDetails?: string;
  cancel?: string;
  save?: string;
  homepage?: string;
}

// Reports translations
export interface ReportsTranslations {
  noData?: string;
  title?: string;
  subtitle?: string;
  exportReport?: string;
  filterByDate?: string;
  filterByDepartment?: string;
  thisWeek?: string;
  thisMonth?: string;
  thisQuarter?: string;
  thisYear?: string;
  projectReport?: string;
  taskReport?: string;
  teamReport?: string;
  projectProgress?: string;
  projectByStatus?: string;
  tasksByDepartment?: string;
  tasksByStatus?: string;
  taskCompletion?: string;
  teamPerformance?: string;
  topPerformers?: string;
  lowPerformers?: string;
  departmentComparison?: string;
  weeklyProgress?: string;
  monthlyProgress?: string;
  quarterlyProgress?: string;
  yearlyProgress?: string;
  companyOverview?: string;
  projectOverview?: string;
  taskOverview?: string;
  peopleOverview?: string;
  exportToPDF?: string;
  exportToExcel?: string;
  generateReport?: string;
  projectProgressReport?: string;
  departmentTaskReport?: string;
  taskStatusReport?: string;
  corporationTaskReport?: string;
  period?: string;
  weekly?: string;
  monthly?: string;
  quarterly?: string;
  yearly?: string;
  filter?: string;
  export?: string;
  completionRate?: string;
  progressRate?: string;
  taskCount?: string;
  projectCount?: string;
  notStarted?: string;
  inProgress?: string;
  completed?: string;
  delayed?: string;
  departmentName?: string;
  taskDistribution?: string;
  documentTypeMarketResearch?: string;
  documentTypeCostAnalysis?: string;
  documentTypeDrawing?: string;
  documentTypeCertification?: string;
  documentTypeEquipment?: string;
  documentTypeRawMaterial?: string;
  documentTypeOther?: string;
}

// Calendar translations
export interface CalendarTranslations {
  title?: string;
  subtitle?: string;
  today?: string;
  month?: string;
  week?: string;
  day?: string;
  agenda?: string;
  addEvent?: string;
  editEvent?: string;
  deleteEvent?: string;
  eventName?: string;
  startDate?: string;
  endDate?: string;
  allDay?: string;
  description?: string;
  repeat?: string;
  save?: string;
  cancel?: string;
  delete?: string;
  confirmDelete?: string;
  noEvents?: string;
  previousMonth?: string;
  nextMonth?: string;
  projectEvent?: string;
  taskEvent?: string;
  personalEvent?: string;
  holidayEvent?: string;
  filter?: string;
  filterAll?: string;
  filterProjects?: string;
  filterTasks?: string;
  filterPersonal?: string;
  filterHolidays?: string;
}

// Admin translations
export interface AdminTranslations {
  title?: string;
  subtitle?: string;
  users?: string;
  clients?: string;
  data?: string;
  settings?: string;
  userManagement?: string;
  clientManagement?: string;
  dataManagement?: string;
  systemSettings?: string;
  addUser?: string;
  editUser?: string;
  deleteUser?: string;
  resetPassword?: string;
  userName?: string;
  userEmail?: string;
  userDepartment?: string;
  userRole?: string;
  userStatus?: string;
  active?: string;
  inactive?: string;
  suspended?: string;
  userPermissions?: string;
  admin?: string;
  manager?: string;
  user?: string;
  guest?: string;
  lastLogin?: string;
  actions?: string;
  confirmDelete?: string;
  userAddSuccess?: string;
  userAddedDescription?: string;
  userUpdateSuccess?: string;
  userUpdatedDescription?: string;
  userDeleteSuccess?: string;
  userDeletedDescription?: string;
  passwordResetSuccess?: string;
  passwordResetDescription?: string;
  addClient?: string;
  editClient?: string;
  deleteClient?: string;
  clientName?: string;
  country?: string;
  contactPerson?: string;
  projects?: string;
  confirmDeleteClient?: string;
  dataExport?: string;
  dataImport?: string;
  backup?: string;
  restore?: string;
  deleteOldData?: string;
  exportFormat?: string;
  csv?: string;
  excel?: string;
  json?: string;
  selectData?: string;
  projectData?: string;
  taskData?: string;
  clientData?: string;
  userData?: string;
  backupData?: string;
  restoreData?: string;
  selectBackupFile?: string;
  dangerZone?: string;
  deleteOldTasks?: string;
  archiveCompletedProjects?: string;
  deleteAllLogs?: string;
  companySettings?: string;
  companyName?: string;
  timezone?: string;
  defaultLanguage?: string;
  dateFormat?: string;
  saveSettings?: string;
  systemInfo?: string;
  version?: string;
  lastUpdate?: string;
  databaseSize?: string;
  totalProjects?: string;
  totalTasks?: string;
  totalUsers?: string;
  totalClients?: string;
  refresh?: string;
}

export interface IntroTranslations {
  title?: string;
  start?: string;
  login?: string;
  teamCollaboration?: string;
  description?: string;
  keyFeatures?: string;
  taskJournal?: string;
  taskJournalDesc?: string;
  calendar?: string;
  calendarDesc?: string;
  teamManagement?: string;
  teamManagementDesc?: string;
  dataManagement?: string;
  dataManagementDesc?: string;
  allRightsReserved?: string;
}

// Combined Translations interface
export interface Translations {
  global: GlobalTranslations;
  sidebar: SidebarTranslations;
  notification: NotificationTranslations;
  dashboard: DashboardTranslations;
  login: LoginTranslations;
  register: RegisterTranslations;
  forgotPassword: ForgotPasswordTranslations;
  projects: ProjectsTranslations;
  tasks: TasksTranslations;
  taskDetails: TaskDetailsTranslations;
  taskCreate: TaskCreateTranslations;
  subtaskCreate: SubtaskCreateTranslations;
  team: TeamTranslations;
  clients: ClientsTranslations;
  reports: ReportsTranslations;
  intro: IntroTranslations;
  calendar: CalendarTranslations;
  admin: AdminTranslations;
}
