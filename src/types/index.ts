export interface GlobalTranslations {
  dashboard?: string;
  projects?: string;
  tasks?: string;
  team?: string;
  calendar?: string;
  reports?: string;
  clients?: string;
  settings?: string;
  profile?: string;
  logout?: string;
  searchPlaceholder?: string;
  details?: string;
  edit?: string;
  delete?: string;
  save?: string;
  cancel?: string;
  new?: string;
  viewAll?: string;
  view?: string;
  noData?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  actions?: string;
  confirm?: string;
  success?: string;
  error?: string;
  home?: string;
  search?: string;
  department?: string;
  status?: string;
  progress?: string;
  client?: string;
  admin?: string;
  unset?: string;
  notifications?: string;
  language?: string;
  add?: string;
  filter?: string;
  sort?: string;
  priority?: string;
  deadline?: string;
  loading?: string;
  checkingAuth?: string;
  country?: string;
  update?: string;
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
  // Admin panel specific
  adminPanel?: string;
  userManagement?: string;
  employeeManagement?: string;
  managerManagement?: string;
  clientManagement?: string;
  corporationManagement?: string;
  positionManagement?: string;
  departmentManagement?: string;
  dataManagement?: string;
  settingsManagement?: string;
  competitorManagement?: string;
  statusManagement?: string;
  phaseManagement?: string;
  // Common actions
  create?: string;
  register?: string;
  modify?: string;
  remove?: string;
  submit?: string;
  reset?: string;
  backup?: string;
  restore?: string;
  optimize?: string;
  export?: string;
  import?: string;
  cleanup?: string;
  // Status messages
  saving?: string;
  processing?: string;
  deleting?: string;
  creating?: string;
  updating?: string;
  // Common phrases
  selectDepartment?: string;
  selectPosition?: string;
  selectCorporation?: string;
  selectCountry?: string;
  noDataAvailable?: string;
  noResultsFound?: string;
  // Validation messages
  required?: string;
  minLength?: string;
  invalidEmail?: string;
  passwordMismatch?: string;
  // Corporation management specific
  headquarters?: string;
  salesOffice?: string;
  factory?: string;
  manageCorporationInfo?: string;
  registerNewCorporation?: string;
  searchCorporation?: string;
  corporationType?: string;
  all?: string;
  corporationName?: string;
  code?: string;
  type?: string;
  modifyCorporation?: string;
  enterCorporationName?: string;
  enterCode?: string;
  enterCountry?: string;
  selectCorporationType?: string;
  deleteCorporation?: string;
  confirmDeleteCorporation?: string;
  // Status management specific
  projectStatus?: string;
  taskStatus?: string;
  
  // Position translations
  position_staff?: string;
  position_associate?: string;
  position_assistant_manager?: string;
  position_manager?: string;
  position_deputy_manager?: string;
  position_general_manager?: string;
  position_director?: string;
  position_executive_director?: string;
  position_managing_director?: string;
  position_vice_president?: string;
  position_president?: string;
  position_chairman?: string;
  position_intern?: string;
  position_contractor?: string;
  position_freelancer?: string;
  
  // Department translations
  department_development?: string;
  department_planning?: string;
  department_sales?: string;
  department_hr?: string;
  department_finance?: string;
  department_operations?: string;
  department_qa?: string;
  department_design?: string;
  department_marketing?: string;
  department_administration?: string;
  
  // Additional position translations (current system)
  position_employee?: string;
  position_senior_staff?: string;
  position_pro?: string;
  position_leader?: string;
  position_mentor?: string;
  position_md?: string;
  position_ceo?: string;
  position_founder?: string;
  
  // Additional department translations (current system)
  department_digital_m?: string;
  department_procurement?: string;
  department_server_management?: string;
  department_management?: string;
  department_it?: string;
  department_quality?: string;
  department_production?: string;
  priorityLevel?: string;
  statusName?: string;
  statusColor?: string;
  statusDescription?: string;
  statusOrder?: string;
  statusActive?: string;
  statusInactive?: string;
  addNewStatus?: string;
  editStatus?: string;
  deleteStatus?: string;
  confirmDeleteStatus?: string;
  statusAddedSuccess?: string;
  statusUpdatedSuccess?: string;
  statusDeletedSuccess?: string;
  enterStatusName?: string;
  enterStatusDescription?: string;
  selectStatusColor?: string;
  projectStatusManagement?: string;
  taskStatusManagement?: string;
  priorityManagement?: string;
  manageProjectStatuses?: string;
  manageTaskStatuses?: string;
  managePriorities?: string;
  // Phase management specific
  phaseName?: string;
  phaseOrder?: string;
  addNewPhase?: string;
  editPhase?: string;
  deletePhase?: string;
  confirmDeletePhase?: string;
  phaseAddedSuccess?: string;
  phaseUpdatedSuccess?: string;
  phaseDeletedSuccess?: string;
  enterPhaseName?: string;
  enterPhaseDescription?: string;
  manageProjectPhases?: string;
  // Status names - Project
  statusPlanning?: string;
  statusInProgress?: string;
  statusCompleted?: string;
  statusOnHold?: string;
  // Status names - Task
  statusTodo?: string;
  statusDoing?: string;
  statusReviewing?: string;
  statusDone?: string;
  // Status names - Priority
  priorityLow?: string;
  priorityNormal?: string;
  priorityHigh?: string;
  priorityUrgent?: string;
  // Status descriptions - Project
  statusPlanningDesc?: string;
  statusInProgressDesc?: string;
  statusCompletedDesc?: string;
  statusOnHoldDesc?: string;
  // Status descriptions - Task
  statusTodoDesc?: string;
  statusDoingDesc?: string;
  statusReviewingDesc?: string;
  statusDoneDesc?: string;
  // Status descriptions - Priority
  priorityLowDesc?: string;
  priorityNormalDesc?: string;
  priorityHighDesc?: string;
  priorityUrgentDesc?: string;
  back?: string;
}

export interface SidebarTranslations {
  dashboard?: string;
  projects?: string;
  employees?: string;
  employees_list?: string;
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
  home?: string;
  clientsAndPartners?: string;
  taskManagement?: string;
  taskJournal?: string;
  taskJournalList?: string;
  chat?: string;
  chatRooms?: string;
  directMessages?: string;
  byCompany?: string;
  teamCorporation?: string;
  byDepartment?: string;
  teamDepartment?: string;
  byExecutive?: string;
  teamExecutive?: string;
  byEmployee?: string;
  notifications?: string;
  online?: string;
  systemStatus?: string;
  serverStatus?: string;
  currentPage?: string;
  managers?: string;
  managersJournal?: string;
  allJournals?: string;
  onlineUsers?: string;
  workJournal?: string;
  myWorkJournal?: string;
  allWorkJournal?: string;
}

export interface NotificationTranslations {
  title?: string;
  markAllAsRead?: string;
  noNotifications?: string;
  showMore?: string;
  showLess?: string;
  all?: string;
  unread?: string;
  today?: string;
  thisWeek?: string;
  thisMonth?: string;
  journal?: {
    created?: string;
    createdAt?: string;
  };
}

export interface DashboardTranslations {
  welcomeBack?: string;
  summary?: string;
  totalProgress?: string;
  projectProgress?: string;
  completedTasks?: string;
  inProgressTasks?: string;
  delayedTasks?: string;
  outOf?: string;
  recentTasks?: string;
  todaysTasks?: string;
  upcomingDeadlines?: string;
  noDeadlines?: string;
  deadlinesToday?: string;
  deadlinesThisWeek?: string;
  daysLeft?: string;
  dueToday?: string;
  viewAll?: string;
  recentDocuments?: string;
  noDocuments?: string;
  view?: string;
  tasksByDepartment?: string;
  noTasks?: string;
  productSchedule?: string;
  staffStatus?: string;
  staffWorkloadByIndividual?: string;
  byDepartment?: string;
  byIndividual?: string;
  projectComplete?: string;
  staffProjectOverview?: string;
  allDepartments?: string;
  allStatus?: string;
  staffName?: string;
  clientName?: string;
  period?: string;
  duration?: string;
  unset?: string;
  unassigned?: string;
  planned?: string;
  noMatchingProjects?: string;
  schedule?: string;
  taskStatus?: string;
  pending?: string;
  inProgress?: string;
  completed?: string;
  overdue?: string;
  today?: string;
  recentFiles?: string;
  overview?: string;
  daysOverdue?: string;
  projectPhases?: string;
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
  staffCount?: string;
  staffByDepartment?: string;
  staffProjects?: string;
  staffSchedule?: string;
  staffWorkload?: string;
  staffMembers?: string;
  staffNoTasks?: string;
  staffWorkloadByDepartment?: string;
  memberCount?: string;
  projectProgressAverage?: string;
  documentTypeMarketResearch?: string;
  documentTypeCostAnalysis?: string;
  documentTypeDrawing?: string;
  documentTypeCertification?: string;
  documentTypeEquipment?: string;
  documentTypeRawMaterial?: string;
  documentTypeOther?: string;
  recentProjects?: string;
  completionRateLabel?: string;
  dueDate?: string;
  staffProjectRegistrationRate?: string;
  staffTaskRegistrationRate?: string;
  staffProjectCompletionRate?: string;
  staffTaskCompletionRate?: string;
  staffWorkDetails?: string;
  projectsRegistered?: string;
  tasksRegistered?: string;
  projectsCompleted?: string;
  overallProgress?: string;
  workloadAnalysis?: string;
  registrationStats?: string;
  completionStats?: string;
  goodMorning?: string;
  goodAfternoon?: string;
  goodEvening?: string;
  hello?: string;
  teamCollaborationMessage?: string;
  staffProjectProgress?: string;
  staffWorkPerformanceRanking?: string;
  realTimeUpdate?: string;
  departmentTaskStatus?: string;
  staffProjectStatus?: string;
  staffWorkTab?: string;
  staffRankingTab?: string;
}

export interface LoginTranslations {
  title?: string;
  description?: string;
  email?: string;
  username?: string;
  password?: string;
  rememberMe?: string;
  forgotPassword?: string;
  login?: string;
  loginButton?: string;
  noAccount?: string;
  register?: string;
  registerLink?: string;
  forgotPasswordLink?: string;
  loginFailed?: string;
  invalidCredentials?: string;
  processing?: string;
  or?: string;
  registerAccount?: string;
}

export interface RegisterTranslations {
  title?: string;
  description?: string;
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
  position?: string;
  terms?: string;
  register?: string;
  haveAccount?: string;
  alreadyHaveAccount?: string;
  login?: string;
  registerButton?: string;
  loginLink?: string;
  registrationSuccess?: string;
  registrationFailed?: string;
  passwordMismatch?: string;
  processing?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  acceptTerms?: string;
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
  email?: string;
  submit?: string;
  sendLink?: string;
  backToLogin?: string;
  resetButton?: string;
  loginLink?: string;
  resetSuccess?: string;
  resetFailed?: string;
  invalidEmail?: string;
  processing?: string;
  success?: string;
  successMessage?: string;
  successDescription?: string;
  errorMessage?: string;
}

export interface TasksTranslations {
  title?: string;
  subtitle?: string;
  new?: string;
  newTask?: string;
  filter?: string;
  filterByStatus?: string;
  filterByPriority?: string;
  filterByAssignee?: string;
  sort?: string;
  sortByDueDate?: string;
  sortByPriority?: string;
  sortByStatus?: string;
  allTasks?: string;
  myTasks?: string;
  name?: string;
  description?: string;
  project?: string;
  createTask?: string;
  updateTask?: string;
  details?: string;
  subtasks?: string;
  comments?: string;
  files?: string;
  addSubtask?: string;
  addComment?: string;
  uploadFile?: string;
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
  taskJournal?: string;
  taskJournalList?: string;
  viewDetails?: string;
  searchPlaceholder?: string;
  allDepartments?: string;
  allStatus?: string;
  statusNotStarted?: string;
  statusInProgress?: string;
  statusCompleted?: string;
  statusDelayed?: string;
  taskJournalDescription?: string;
  createJournal?: string;
  totalJournals?: string;
  urgent?: string;
  // Task status and progress
  databaseConnectionProgress?: string;
  sqlConnectionProgress?: string;
  competitorAnalysis?: string;
  competitorAnalysisDescription?: string;
  daysRemaining?: string;
  progressPercent?: string;
  completionRate?: string;
  // Korean status labels for compatibility
  진행중?: string;
  완료?: string;
  지연?: string;
  // Journal related
  journal?: {
    create?: string;
    title?: string;
    content?: string;
    date?: string;
    yourTitle?: string;
    titlePlaceholder?: string;
    contentPlaceholder?: string;
    save?: string;
    cancel?: string;
    currentDate?: string;
    taskJournalDesc?: string;
    writeJournal?: string;
    writeJournalDesc?: string;
    titleContentRequired?: string;
    journalCreated?: string;
    journalCreatedDesc?: string;
  };
  
  // Tasks Database page related
  taskDatabase?: string;
  taskDatabaseSubtitle?: string;
  readOnlyMode?: string;
  searchTasks?: string;
  stage?: string;
  taskName?: string;
  assignee?: string;
  stageUnassigned?: string;
  unassigned?: string;
  daysDelayed?: string;
  normal?: string;
  dataLink?: string;
  noSearchResults?: string;
  tryDifferentSearch?: string;
  databaseInfo?: string;
  databaseDescription?: string;
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
  taskJournalDescription?: string;
  createJournal?: string;
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
  urgent?: string;
}

export interface IntroTranslations {
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
  step1Title?: string;
  step1Description?: string;
  step2Title?: string;
  step2Description?: string;
  step3Title?: string;
  step3Description?: string;
  startNow?: string;
}

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
  activeProjects?: string;
  completedProjects?: string;
  createProject?: string;
  updateProject?: string;
  projectName?: string;
  name?: string;
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
  type?: string;
  department?: string;
  statusCompleted?: string;
  statusActive?: string;
  statusDelayed?: string;
  statusOnHold?: string;
  statusNotStarted?: string;
  statusInProgress?: string;
  phasePlanning?: string;
  phaseDevelopment?: string;
  phaseManufacturing?: string;
  phaseQuality?: string;
  phaseProduction?: string;
  phaseSales?: string;
  
  // Promotion stage translations
  promotionStagePromotion?: string;
  promotionStageSample?: string;
  promotionStage1stVerification?: string;
  promotionStageDesignVerification?: string;
  promotionStageSetVerification?: string;
  promotionStageApproval?: string;
  promotionStageOrder?: string;
  promotionStageDrop?: string;
  
  // Project type translations
  projectType11?: string;
  projectType12?: string;
  projectType21?: string;
  projectType31?: string;
  projectType32?: string;
  projectType41?: string;
  projectType42?: string;
  projectType51?: string;
  projectType61?: string;
  projectType71?: string;
  projectType72?: string;
  projectType81?: string;
  projectType91?: string;
  
  // Table headers
  tableProject?: string;
  tablePromotionStage?: string;
  tableProgress?: string;
  tableStartDate?: string;
  tableDueDate?: string;
  tableRemainingTime?: string;
  tableManager?: string;
  
  // Common terms
  all?: string;
  projectsCount?: string;
  averageProgress?: string;
  totalRatio?: string;
  daysDelayed?: string;
  daysRemaining?: string;
  
  clientName?: string;
  projectType?: string;
  assignedDepartment?: string;
  currentPhase?: string;
  targetProductionDate?: string;
  assignee?: string;
  projectCompletionRate?: string;
  parentProject?: string;
  subProjects?: string;
  relatedTasks?: string;
  addTask?: string;
  noRelatedTasks?: string;
  unassigned?: string;
  subtaskProgress?: string;
  priority?: string;
  priorityHigh?: string;
  priorityMedium?: string;
  priorityLow?: string;
  subtasks?: string;
  add?: string;
  moreItems?: string;
  count?: string;
  days?: string;
  remaining?: string;
  overdue?: string;
  dueToday?: string;
  completionRateLabel?: string;
  recentProjects?: string;
  details?: string;
  
  // MyProjects 페이지 관련
  myProjects?: string;
  myProjectsSubtitle?: string;
  totalProjectsCount?: string;
  searchProjectsPlaceholder?: string;
  statusFilter?: string;
  assigneeFilter?: string;
  allStatuses?: string;
  allAssignees?: string;
  sortByName?: string;
  sortByDueDate?: string;
  sortByProgress?: string;
  tabOverdue?: string;
  tabInProgress?: string;
  tabCompleted?: string;
  tabTimeline?: string;
  excellentMessage?: string;
  noOverdueProjects?: string;
  urgent?: string;
  planning?: string;
  onHold?: string;
}

export interface CalendarTranslations {
  title?: string;
  subtitle?: string;
  new?: string;
  today?: string;
  month?: string;
  week?: string;
  day?: string;
  agenda?: string;
  previous?: string;
  next?: string;
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
  createFirst?: string;
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
  filter?: string;
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
  edit?: string;
  delete?: string;
  save?: string;
  homepage?: string;
  clientProjects?: string;
  clientProjectDescription?: string;
  searchClientsPlaceholder?: string;
  allClients?: string;
  activeClients?: string;
  inactiveClients?: string;
  createClient?: string;
  updateClient?: string;
  details?: string;
  projects?: string;
  contacts?: string;
  addProject?: string;
  addContact?: string;
  noClients?: string;
  createFirst?: string;
  clientsList?: string;
}

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
  taskStatus?: string;
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
  pending?: string;
  departmentName?: string;
  taskDistribution?: string;
  documentTypeMarketResearch?: string;
  documentTypeCostAnalysis?: string;
  documentTypeDrawing?: string;
  documentTypeCertification?: string;
  documentTypeEquipment?: string;
  documentTypeRawMaterial?: string;
  documentTypeOther?: string;
  byDepartment?: string;
  byCorporation?: string;
  timeFrame?: string;
  lastWeek?: string;
  lastMonth?: string;
  lastQuarter?: string;
  lastYear?: string;
  custom?: string;
  exportPDF?: string;
  exportExcel?: string;
  summary?: string;
  details?: string;
  loading?: string;
}

export interface TeamTranslations {
  title?: string;
  subTitle?: string;
  corporation?: string;
  executive?: string;
  employeeList?: string;
  position?: string;
  contact?: string;
  actions?: string;
  viewDetails?: string;
  sendMessage?: string;
  completionRate?: string;
  progressRate?: string;
  departmentDistribution?: string;
  staffCount?: string;
  completionRateByDepartment?: string;
  progressRateByDepartment?: string;
  employees?: string;
  details?: string;
  message?: string;
  email?: string;
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
  name?: string;
  role?: string;
  department?: string;
  phone?: string;
  taskProgress?: string;
  assignedTasks?: string;
  completedTasks?: string;
  pendingTasks?: string;
  overduePercent?: string;
  noDepartmentData?: string;
}

export interface AdminTranslations {
  title?: string;
  subtitle?: string;
  users?: string;
  newUser?: string;
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
  userDetails?: string;
  database?: string;
  general?: string;
  security?: string;
  notifications?: string;
  system?: string;
  lastUpdated?: string;
  status?: string;
  logs?: string;
  permissions?: string;
  roles?: string;
  newRole?: string;
  editRole?: string;
  deleteRole?: string;
  roleDetails?: string;
}

export interface ProfileTranslations {
  title?: string;
  personalInfo?: string;
  personalInfoDescription?: string;
  passwordChange?: string;
  accountSettings?: string;
  accountSettingsDescription?: string;
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  contact?: string;
  loginInfo?: string;
  loginMethod?: string;
  lastLogin?: string;
  save?: string;
  saving?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  changePassword?: string;
  deleteAccount?: string;
  deleteWarning?: string;
  deleteConfirm?: string;
  cancel?: string;
  emailReset?: string;
  sendEmailReset?: string;
  passwordReset?: string;
  sendPasswordReset?: string;
  profileUpdateSuccess?: string;
  profileUpdateError?: string;
  passwordChangeSuccess?: string;
  passwordChangeError?: string;
  emailResetSuccess?: string;
  emailResetError?: string;
  passwordResetSuccess?: string;
  passwordResetError?: string;
  passwordMismatch?: string;
  passwordTooShort?: string;
  currentPasswordRequired?: string;
  nameRequired?: string;
  emailRequired?: string;
  invalidEmail?: string;
  update?: string;
  // Additional profile keys
  updateProfileInfo?: string;
  emailResetDescription?: string;
  selectDepartment?: string;
  securityDescription?: string;
  directPasswordChange?: string;
  passwordResetDescription?: string;
  sendingInProgress?: string;
  changingInProgress?: string;
  currentAccountInfo?: string;
  role?: string;
  dangerZone?: string;
  microsoftLogin?: string;
  emailPasswordLogin?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  translation_key?: string;
  name_en?: string;
  name_zh?: string;
  name_th?: string;
  created_at: string;
  updated_at: string;
}

export enum DepartmentCode {
  SALES = "sales",
  DEVELOPMENT = "development",
  MANUFACTURING = "manufacturing",
  QUALITY = "quality",
  FINANCE = "finance",
  ADMINISTRATION = "administration",
  MANAGEMENT = "management",
  ENGINEERING = "engineering",
  RND = "rnd",
  PRODUCTION = "production",
  QA = "qa"
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  // Additional fields for Contacts.tsx
  division?: string;
  customerId?: string;
  customerName?: string;
  department?: string;
  position?: string;
  remark?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  department: DepartmentCode;
  position?: string;
  country?: string;
  legalEntity?: string;
  corporation?: string;
  password?: string;
  isActive?: boolean;
  timezone?: string;
}

export interface Client {
  id: string;
  name: string;
  manager_id?: string;
  country?: string;
  contact_number?: string;
  contact_person?: string;
  contact_email?: string;
  sales_rep_id?: string;
  requirements?: string;
  homepage?: string;
  flag?: string;
  remark?: string;
  files?: string[];
  created_at: string;
  updated_at: string;
  // 관계형 데이터
  manager?: Manager;
  projects?: Project[];
  // 호환성을 위한 legacy 필드들
  contactPerson?: string;
  contactEmail?: string;
  salesRepId?: string;
  salesRepName?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  dueDate: string;
  endDate?: string;
  team: string[];
  manager: string;
  clientId: string;
  clientName?: string;
  department?: string;
  createdAt: string;
  updatedAt?: string;
  phase?: string;
  type?: string;
  projectType?: string;
  averageAmount?: number;
  managerId?: string;
  requestDate?: string;
  targetSOPDate?: string;
  currentPhase?: string;
  annualQuantity?: number;
  annualAmount?: number;
  promotionStatus?: PromotionStatuses;
  promotionStage?: 'Promotion' | 'Sample' | '1차검증' | '설계검증' | 'Set검증' | '승인' | '수주' | 'Drop';
  competitor?: string;
  issueCorporation?: string;
  completed?: boolean;
  image?: string;
}

// 업무 담당자 타입 정의
export interface TaskAssignee {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_department?: string;
  is_primary: boolean;
  assigned_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  dueDate: string;
  projectId: string;
  assignedTo?: string;
  assignees?: TaskAssignee[];
  department?: string;
  taskPhase?: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
  completionFiles?: TaskFile[];
  completionLinks?: TaskLink[];
  attachments?: TaskAttachment[];
}

export interface TaskFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt?: string;
}

export interface TaskLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  createdAt?: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_id?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  attachment_type: 'file' | 'link';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  userId?: string;
  type: string;
  message: string;
  read: boolean;
  timestamp: string;
  createdAt: string;
  relatedId?: string; // Added for use-journal.ts
  metadata?: {
    userTimezone?: string;
    isOptimalTime?: boolean;
    scheduleDelay?: number;
    originalMessage?: string;
    formattedTime?: string;
    [key: string]: any;
  };
}

export interface DailyReport {
  id: string;
  userId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface CompetitorInfo {
  id: string;
  name: string;
  country: string;
  product: string;
  price?: number;
  marketShare?: number;
  strengths?: string[];
  weaknesses?: string[];
  createdAt: string;
  updatedAt?: string;
}

export const promotionStatusesList = ['planned', 'hold', 'in_progress', 'drop', 'development', 'mass_production', 'stopped'] as const;
export type PromotionStatuses = typeof promotionStatusesList[number];

export const defaultCompetitors = [
  '경쟁사 A',
  '경쟁사 B',
  '경쟁사 C',
  '경쟁사 D',
  '경쟁사 E',
] as const;

export type Competitor = typeof defaultCompetitors[number];

export const promotionStatusOptions = [
  { value: 'planned', label: '예정' },
  { value: 'hold', label: '보류' },
  { value: 'in_progress', label: '진행중' },
  { value: 'drop', label: 'DROP' },
  { value: 'development', label: '개발' },
  { value: 'mass_production', label: '양산' },
  { value: 'stopped', label: '중단' }
] as const;

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
  profile: ProfileTranslations;
  managers?: any;
  workJournals?: any;
  journal?: TasksTranslations['journal'];
}

export interface Position {
  id: string;
  name: string;
  code: string;
  level: number;
  description?: string;
  translation_key?: string;
  name_en?: string;
  name_zh?: string;
  name_th?: string;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  name: string;
  order: number;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  type?: 'project' | 'task';
}

export interface Corporation {
  id: string;
  name: string;
  code: string;
  country: string;
  type: 'headquarters' | 'sales' | 'factory';
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  employee_number: string;
  name: string;
  english_name?: string;
  corporation_id?: string;
  department_id?: string;
  position_id?: string;
  avatar?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
  // 관계형 데이터
  corporation?: Corporation;
  department?: Department;
  position?: Position;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department_id?: string;
  corporation_id?: string;
  position_id?: string;
  is_active?: boolean;
  profile_image?: string;
  created_at: string;
  updated_at: string;
  // 관계형 데이터 (JOIN으로 가져온 데이터)
  department?: {
    id: string;
    name: string;
    code?: string;
  };
  corporation?: {
    id: string;
    name: string;
    code?: string;
  };
  position?: {
    id: string;
    name: string;
    code?: string;
  };
}

// 새 항목 생성을 위한 타입
export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  password: string;
};

export type CreateEmployeeInput = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;

export type CreateManagerInput = Omit<Manager, 'id' | 'created_at' | 'updated_at' | 'department' | 'corporation' | 'position'> & {
  department_id?: string;
  corporation_id?: string;
  position_id?: string;
  profile_image?: string;
};

export type CreateClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export type CreateDepartmentInput = Omit<Department, 'id' | 'created_at' | 'updated_at'>;

export type CreatePositionInput = Omit<Position, 'id' | 'created_at' | 'updated_at'>;

export type CreatePhaseInput = Omit<Phase, 'id' | 'created_at' | 'updated_at'>;

export type CreateCorporationInput = Omit<Corporation, 'id' | 'created_at' | 'updated_at'>;

// 업무 일지 관련 타입
export interface WorkJournal {
  id: string;
  project_id?: string;
  task_id?: string;
  content: string;
  status: 'not-started' | 'in-progress' | 'delayed' | 'completed';
  user_id: string;
  author_id?: string; // 하위 호환성을 위해 유지
  author_name?: string;
  date?: string;
  title?: string;
  work_hours?: number;
  overtime_hours?: number;
  category?: string;
  has_attachments?: boolean;
  attachment_count?: number;
  created_at: string;
  updated_at: string;
  // 관계형 데이터
  project?: Project;
  task?: Task;
  files?: WorkJournalFile[];
  collaborators?: WorkJournalCollaborator[];
}

export interface WorkJournalFile {
  id: string;
  work_journal_id: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  file_url?: string;
  uploaded_at: string;
}

export interface WorkJournalCollaborator {
  id: string;
  work_journal_id: string;
  user_id: string;
  user_name: string;
  added_at: string;
}

export type CreateWorkJournalInput = Omit<WorkJournal, 'id' | 'created_at' | 'updated_at' | 'project' | 'task' | 'files' | 'collaborators'>;
export type CreateWorkJournalFileInput = Omit<WorkJournalFile, 'id' | 'uploaded_at'>;
export type CreateWorkJournalCollaboratorInput = Omit<WorkJournalCollaborator, 'id' | 'added_at'>;

// Journal Entry type
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  userId: string;
  taskId: string;
  date: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

// 댓글 첨부파일 타입
export interface TaskCommentAttachment {
  id: string;
  comment_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// 댓글 및 진행도 업데이트 관련 타입
export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  progress_update?: number;
  attachments?: TaskCommentAttachment[];
  created_at: string;
  updated_at: string;
}

export type CreateTaskCommentInput = Omit<TaskComment, 'id' | 'created_at' | 'updated_at' | 'attachments'> & {
  attachments?: File[];
};

// 업무일지 관련 타입 정의
export interface WorkLog {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  log_date: string; // YYYY-MM-DD 형식
  status: '진행중' | '완료' | '보류';
  priority: '높음' | '보통' | '낮음';
  tags?: string[];
  attachments?: WorkLogAttachment[];
  created_at: string;
  updated_at: string;
  // 관계형 데이터
  user?: {
    id: string;
    name: string;
    email: string;
    department?: string;
    avatar?: string;
  };
}

export interface WorkLogAttachment {
  id: string;
  work_log_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export type CreateWorkLogInput = Omit<WorkLog, 'id' | 'created_at' | 'updated_at' | 'user' | 'attachments'> & {
  attachments?: File[];
};

export type UpdateWorkLogInput = Partial<CreateWorkLogInput> & {
  id: string;
};

// 업무일지 통계 타입
export interface WorkLogStats {
  user_name: string;
  user_id: string;
  total_logs: number;
  completed_logs: number;
  in_progress_logs: number;
  on_hold_logs: number;
  completion_rate: number;
}
