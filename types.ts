

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
  day?: string; // 'Monday', 'Tuesday', etc.
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
  status: 'new' | 'learning' | 'review';
}

export interface Deck {
  name: string;
  cards: Flashcard[];
}


export interface Note {
  id: number;
  title: string;
  content: string;
  attachments: number[];
  ts: number; // createdAt
  updatedAt: number;
  tags?: string[];
  isPinned?: boolean;
  color?: string; // e.g., 'bg-yellow-500'
  // for migration
  category?: string;
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
  duration: number; // in minutes
  startTime?: number; // Log start timestamp
  endTime?: number;   // Log end timestamp
  modeName: string;
  presetName: string;
  completed: boolean; // Did they finish the whole duration?
  
  // For intelligence
  linkedTaskId?: number;
  sessionGoal?: string;
  distractionCount?: number;
  focusRating?: number; // 1-5
  energyRating?: number; // 1-5
  notes?: string;
  taskCompleted?: boolean;
  
  // Old fields for migration
  focusTime?: number; 
  breakTime?: number;
  cycles?: number;
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
  dueDate?: string; // YYYY-MM-DD
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

// New Pomodoro System Types
export interface TimerMode {
  id: string;
  name: string;
  duration: number; // in minutes
  color: string;
}

export interface PomodoroPreset {
  id: number;
  name: string;
  modes: TimerMode[];
  sequence: string[]; // array of TimerMode IDs
  environment?: {
    theme?: 'dark' | 'light' | 'system';
    playlistId?: number | null;
  };
}

export interface LiveCalendarType {
  id: number;
  name: string;
  description: string;
}

export interface LiveClockType {
  id: number;
  name: string;
  description: string;
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

export interface ToolbarItem {
    id: string;
    icon: 'search' | 'focus' | 'add' | 'theme' | 'settings' | 'music';
    label: string;
    enabled: boolean;
}

export interface ThemeConfig {
    accentHue: number;
    accentSaturation: number;
    accentLightness: number;
    bgHue: number;
    bgSaturation: number;
    bgLightness: number;
    // Advanced Appearance
    glassOpacity?: number; // 0-100
    glassBlur?: number; // px
    borderRadius?: number; // px
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
    customFont?: string; // User defined font family string
    dashboardColumns: '2' | '3';
    dashboardWidgets: DashboardWidgetSetting[];
    systemModules: SystemModuleSetting[];
    toolbar: ToolbarItem[];
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
    customCSS?: string;
    timetableReferenceId?: number;
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

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface ChatMessage {
  id: number;
  sender: string;
  content: string;
  timestamp: number;
  channel: string;
  isMe: boolean;
}

export interface CodeSnippet {
  id: number;
  title: string;
  language: string;
  code: string;
  updatedAt: number;
}