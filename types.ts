
export type EngagementActivity = 
  | 'app_session_started'
  | 'view_resource'
  | 'complete_task'
  | 'save_study_session'
  | 'complete_quiz';

export interface EngagementLog {
    ts: number; // timestamp
    activity: EngagementActivity;
    details?: {
        name?: string; // e.g., filename, task title
        id?: number;
    };
}

export interface Class {
  name: string;
  time: string;
  location: string;
  ts: number;
  endTime?: string;
  color?: string;
  note_richtext?: string;
  attachments?: number[];
}

export interface StudyLog {
  subject: string;
  hours: number;
  energy: number;
  focus: number;
  ts: number;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
}

export interface Assignment {
  id: number;
  title: string;
  dueDate: string; // YYYY-MM-DD
  grade?: string;
  totalPoints?: number;
  completed: boolean;
  notes?: string;
}

export interface Exam {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  grade?: string;
  totalPoints?: number;
  notes?: string;
}

export interface Resource {
  id: number;
  title: string;
  url: string;
  description?: string;
}

export interface Module {
  id: number;
  title: string;
  completed: boolean;
}

export interface Quiz {
  id: number;
  title: string;
  score: number | null;
  status: 'passed' | 'failed' | 'pending';
}

export interface Course {
  name: string;
  code?: string;
  credits: number;
  grade: string;
  instructor?: string;
  room?: string;
  schedule?: string;
  notes?: string;
  attachments?: number[];
  goalGrade?: string;
  status?: 'active' | 'completed';
  syllabusFileId?: number;
  attendance: AttendanceRecord[];
  assignments: Assignment[];
  exams: Exam[];
  resources: Resource[];
  modules: Module[];
  quizzes: Quiz[];
}

export interface Semester {
  name: string;
  courses: Course[];
  department?: string;
  year?: string;
}

export interface Project {
  name: string;
  desc: string;
  stack: string;
  ts: number;
}

// Old transaction type for migration
export interface Transaction {
  desc: string;
  amount: number;
  ts: number;
}

// New Personal Finance Types
export interface FinancialTransaction {
  id: number;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive for income, negative for expense
  categoryId: number;
  receiptFileId?: number;
  notes?: string;
}

export interface TransactionCategory {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: number; // compuesto: categoryId + month
  categoryId: number;
  amount: number;
  month: string; // YYYY-MM
}


export interface KanbanTask {
  ts: number;
  title: string;
  description?: string;
  importance: boolean;
  urgency: boolean;
  dueDate?: string;
  category?: string;
  notes?: string;
  linkedProjectId?: number;
  attachments?: number[];
  // old field for migration
  priority?: 'important' | 'urgent' | null;
}


export interface KanbanBoard {
  backlog: KanbanTask[];
  progress: KanbanTask[];
  done: KanbanTask[];
}

export interface WheelOption {
    id: number;
    type: 'text' | 'file';
    label: string;
    value: string | number;
}

export interface CustomWheel {
    id: number;
    name: string;
    options: WheelOption[];
}

// New Flashcard Types
export interface Flashcard {
  id: number;
  q: string; // HTML content
  a: string; // HTML content
  q_image_id?: number;
  a_image_id?: number;
  // SRS fields
  lastReviewed?: number; // timestamp
  nextReview: number; // timestamp
  interval: number; // days
  easeFactor: number; // starts at 2.5
  status: 'new' | 'learning' | 'review' | 'failed';
}

export interface Deck {
  name: string;
  cards: Flashcard[];
}

export interface MemoryLocus {
  id: number;
  name: string; // e.g., "Front Door", "Sofa"
  x: number; // relative position %
  y: number; // relative position %
  linkedCardId?: number;
}

export interface MemoryPalace {
  id: number;
  name: string;
  bgImageId?: number;
  loci: MemoryLocus[];
}

export type NoteTemplate = 'standard' | 'cornell' | 'zettel' | 'mindmap' | 'blurting' | 'feynman';

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: string[]; // ids of children
}

export interface Note {
  id: number;
  title: string;
  content: string; // Used for Standard, Zettel
  
  // Cornell specific
  cornellCues?: string;
  cornellSummary?: string;
  
  // Mindmap specific
  mindMapData?: {
      nodes: MindMapNode[];
      rootId: string;
  };

  // Blurting specific
  blurtingPrompt?: string;
  blurtingAnswer?: string; // what user typed

  template: NoteTemplate; 
  
  attachments: number[];
  ts: number; // createdAt
  updatedAt: number;
  tags?: string[];
  isPinned?: boolean;
  color?: string; // e.g., 'bg-yellow-500'
  category?: string;
  
  // Zettelkasten linking
  links?: number[]; // IDs of linked notes
}


export interface StoredFile {
    id: number;
    name: string;
    type: string;
    size: number;
    ts: number;
    tags?: string[];
    folder?: string;
}

export interface StoredFileData extends StoredFile {
    data: Blob;
}

export interface FocusSettings {
  theme: string;
  timerSize: number;
}

export interface Event {
  ts: number;
  date: string; // YYYY-MM-DD
  time?: string;
  title: string;
  description?: string;
  attachments?: number[];
}

export interface PomodoroLog {
  ts: number;
  focusTime: number; // in minutes
  breakTime: number; // in minutes
  cycles: number;
  variant: 'classic' | '52/17' | '90-deep';
  notes?: string;
}

export interface LearningLog {
    date: string; // YYYY-MM-DD
    minutes: number;
}

export interface Track {
  id: number;
  fileId: number;
  title: string;
  artist?: string;
  duration: number; // in seconds
}

export interface Playlist {
  id: number;
  name: string;
  trackIds: number[];
}

export interface MusicPlayerState {
    currentTrackId: number | null;
    currentPlaylistId: number | null; // null is library mode
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    isShuffled: boolean;
}

export interface Habit {
  id: number;
  name: string;
  completedDates: string[]; // YYYY-MM-DD
}

export interface InterviewStage {
  id: number;
  date: string; // YYYY-MM-DD
  type: string; // e.g., "Phone Screen", "Technical Interview"
  notes?: string;
}

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: 'Wishlist' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  resumeFileId?: number;
  coverLetterFileId?: number;
  interviews: InterviewStage[];
  notes?: string;
  ts: number; // created at timestamp
}

// New Task Management System Types
export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'None' | 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  attachments: number[]; // array of file IDs
  subtasks: Subtask[];
  dependencies: number[]; // array of other Task IDs
  tags?: string[];
  difficulty?: number; // 1-5 for Hard-First Method
}

export type Mood = 'Happy' | 'Productive' | 'Neutral' | 'Sad' | 'Stressed';

export interface VisionCard {
    id: number;
    type: 'goal' | 'image';
    content: string; // text for goal, file ID for image
    position: { x: number, y: number };
}

export interface JournalEntry {
    id: number;
    date: string; // YYYY-MM-DD
    mood: Mood;
    content: string; // rich text
    attachments: number[];
    ts: number;
}

// New App Settings
export interface DashboardWidgetSetting {
    id: string;
    enabled: boolean;
    colSpan: number;
    name: string;
    minimized?: boolean;
}

export interface SystemModuleSetting {
    id: string;
    enabled: boolean;
    name: string;
    minimized?: boolean;
}

export interface ThemeConfig {
    accentHue: number;
    accentSaturation: number;
    accentLightness: number;
    bgHue: number;
    bgSaturation: number;
    bgLightness: number;
}

export interface WallpaperConfig {
    type: 'default' | 'image' | 'live';
    imageId?: number;
    liveConfig?: {
        particleDensity: number; // 0 to 1
        particleOpacity: number; // 0 to 1
        liveImageId?: number;
    };
}

export interface AppSettings {
    theme: 'dark' | 'light';
    uiStyle: 'classic' | 'modern';
    themeConfig: ThemeConfig;
    layout: 'spacious' | 'cozy' | 'compact';
    fontFamily: 'sans' | 'serif' | 'mono';
    dashboardColumns: '2' | '3';
    dashboardWidgets: DashboardWidgetSetting[];
    systemModules: SystemModuleSetting[];
    wallpaper: WallpaperConfig;
    defaults: {
        pomodoro: {
            work: number;
            break: number;
            deep: number;
        };
        quickNote: {
            color: string;
            isPinned: boolean;
        };
    };
    timeFormat: '12h' | '24h';
    focusMode: {
        defaultTheme: string;
        defaultTimerSize: number;
    };
}

export interface LinkResource {
  id: number;
  type: 'link' | 'tool';
  title: string;
  url: string;
  description?: string;
  ts: number;
  tags?: string[];
  folder?: string;
}

// --- CS WORKSPACE TYPES ---

export interface SnippetVersion {
    id: string;
    ts: number;
    code: string;
    label?: string;
}

export interface CodeSnippet {
    id: number;
    title: string;
    language: string;
    code: string;
    tags: string[];
    category?: string;
    ts: number;
    versions?: SnippetVersion[];
}

export interface Algorithm {
    id: number;
    name: string;
    type: 'Sorting' | 'Searching' | 'Graph' | 'DP' | 'Tree' | 'Other';
    complexityTime: string; // Big O
    complexitySpace: string; // Big O
    description?: string;
    codeExample?: string; // Usage example
    status: 'To Learn' | 'Learning' | 'Mastered';
    notes?: string;
}

export interface BugLog {
    id: number;
    issue: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'In Progress' | 'Resolved';
    project?: string;
    stepsToReproduce?: string;
    resolution?: string;
    ts: number;
}

export interface LabRecord {
    id: number;
    name: string;
    subject: string;
    date: string;
    procedure?: string;
    observations?: string;
    ts: number;
}

export interface ResearchPaper {
    id: number;
    title: string;
    field: string;
    authors?: string;
    link?: string;
    notes?: string;
    ts: number;
}
