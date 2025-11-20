


import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { StudyLog, Semester, Project, Transaction, KanbanBoard, Note, Class, Deck, StoredFileData, KanbanTask, Event, PomodoroLog, Track, Playlist, MusicPlayerState, Habit, JobApplication, Task, TaskStatus, TaskPriority, VisionCard, JournalEntry, FinancialTransaction, TransactionCategory, Budget, AppSettings, DashboardWidgetSetting, SystemModuleSetting, LearningLog, Course, EngagementLog, CustomWheel, LinkResource, PomodoroPreset, LiveCalendarType, LiveClockType, ToolbarItem, Notification, ChatMessage, CodeSnippet, PracticeItem, DesignDiagram, AlgoVisual, FeynmanSession, KnowledgeMap, ReferenceItem } from '../types';
import { addBackup, getBackups, deleteBackup } from '../utils/db';

const DEFAULT_WIDGETS: DashboardWidgetSetting[] = [
    { id: 'summary', enabled: true, colSpan: 3, name: 'Progress Summary', minimized: false },
    { id: 'clock', enabled: true, colSpan: 3, name: 'Calendar & Clock', minimized: false },
    { id: 'pomodoro', enabled: true, colSpan: 1, name: 'Focus System', minimized: false },
    { id: 'tasks', enabled: true, colSpan: 2, name: 'Today\'s Tasks', minimized: false },
    { id: 'classes', enabled: true, colSpan: 1, name: 'Today\'s Schedule', minimized: false },
    { id: 'progress', enabled: true, colSpan: 2, name: 'Study Progress', minimized: false },
    { id: 'note', enabled: true, colSpan: 3, name: 'Quick Note', minimized: false },
    { id: 'music', enabled: false, colSpan: 2, name: 'Music Player', minimized: false },
    { id: 'habits', enabled: false, colSpan: 1, name: 'Habit Streaks', minimized: false },
];

const DEFAULT_SYSTEM_MODULES: SystemModuleSetting[] = [
    { id: 'notes', name: 'Knowledge Base', enabled: true, minimized: false },
    { id: 'academics', name: 'Academics Manager', enabled: true, minimized: false },
    { id: 'projects', name: 'Projects Manager', enabled: true, minimized: false },
    { id: 'finance', name: 'Finance Manager', enabled: true, minimized: false },
    { id: 'tasks', name: 'Task Manager', enabled: true, minimized: false },
    { id: 'backup', name: 'Backup & Restore', enabled: true, minimized: false },
    { id: 'settings', name: 'Settings', enabled: true, minimized: false },
];

const DEFAULT_TOOLBAR: ToolbarItem[] = [
    { id: 'search', icon: 'search', label: 'Search', enabled: true },
    { id: 'focus', icon: 'focus', label: 'Focus Mode', enabled: true },
    { id: 'add', icon: 'add', label: 'Quick Add', enabled: true },
    { id: 'music', icon: 'music', label: 'Music', enabled: true },
    { id: 'theme', icon: 'theme', label: 'Toggle Theme', enabled: true },
];

interface ActivePomodoroState {
  presetId: number | null;
  sequenceIndex: number;
  remaining: number; // in seconds
  running: boolean;
  startTime: number | null; // for logging
  isPaused: boolean;
}

export type AppSpace = 'dashboard' | 'workspace';

interface AppContextType {
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  studyLogs: StudyLog[];
  setStudyLogs: React.Dispatch<React.SetStateAction<StudyLog[]>>;
  semesters: Semester[];
  setSemesters: React.Dispatch<React.SetStateAction<Semester[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  financialTransactions: FinancialTransaction[];
  setFinancialTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  transactionCategories: TransactionCategory[];
  setTransactionCategories: React.Dispatch<React.SetStateAction<TransactionCategory[]>>;
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  decks: Deck[];
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  viewingFile: StoredFileData | null;
  setViewingFile: React.Dispatch<React.SetStateAction<StoredFileData | null>>;
  viewingTask: Task | null;
  setViewingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  viewingScheduleItem: Class | null;
  setViewingScheduleItem: React.Dispatch<React.SetStateAction<Class | null>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  pomodoroLogs: PomodoroLog[];
  setPomodoroLogs: React.Dispatch<React.SetStateAction<PomodoroLog[]>>;
  learningLogs: LearningLog[];
  setLearningLogs: React.Dispatch<React.SetStateAction<LearningLog[]>>;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  musicPlayerState: MusicPlayerState;
  setMusicPlayerState: React.Dispatch<React.SetStateAction<MusicPlayerState>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  jobApplications: JobApplication[];
  setJobApplications: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  visionBoardCards: VisionCard[];
  setVisionBoardCards: React.Dispatch<React.SetStateAction<VisionCard[]>>;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  engagementLogs: EngagementLog[];
  setEngagementLogs: React.Dispatch<React.SetStateAction<EngagementLog[]>>;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isQuickCreateOpen: boolean;
  setIsQuickCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  visualizerCanvasRef: React.MutableRefObject<HTMLCanvasElement | null> | null;
  setVisualizerCanvasRef: React.Dispatch<React.SetStateAction<React.MutableRefObject<HTMLCanvasElement | null> | null>>;
  setBackgroundOverlay: React.Dispatch<React.SetStateAction<'paper' | 'none'>>;
  customWheels: CustomWheel[];
  setCustomWheels: React.Dispatch<React.SetStateAction<CustomWheel[]>>;
  linkResources: LinkResource[];
  setLinkResources: React.Dispatch<React.SetStateAction<LinkResource[]>>;
  pomodoroPresets: PomodoroPreset[];
  setPomodoroPresets: React.Dispatch<React.SetStateAction<PomodoroPreset[]>>;
  activePomodoro: ActivePomodoroState;
  setActivePomodoro: React.Dispatch<React.SetStateAction<ActivePomodoroState>>;
  liveCalendarTypes: LiveCalendarType[];
  setLiveCalendarTypes: React.Dispatch<React.SetStateAction<LiveCalendarType[]>>;
  liveClockTypes: LiveClockType[];
  setLiveClockTypes: React.Dispatch<React.SetStateAction<LiveClockType[]>>;
  activeLiveCalendarTypeId: number | null;
  setActiveLiveCalendarTypeId: React.Dispatch<React.SetStateAction<number | null>>;
  activeLiveClockTypeId: number | null;
  setActiveLiveClockTypeId: React.Dispatch<React.SetStateAction<number | null>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  codeSnippets: CodeSnippet[];
  setCodeSnippets: React.Dispatch<React.SetStateAction<CodeSnippet[]>>;
  
  // New CS Workspace States
  practiceItems: PracticeItem[];
  setPracticeItems: React.Dispatch<React.SetStateAction<PracticeItem[]>>;
  designDiagrams: DesignDiagram[];
  setDesignDiagrams: React.Dispatch<React.SetStateAction<DesignDiagram[]>>;
  algoVisuals: AlgoVisual[];
  setAlgoVisuals: React.Dispatch<React.SetStateAction<AlgoVisual[]>>;
  feynmanSessions: FeynmanSession[];
  setFeynmanSessions: React.Dispatch<React.SetStateAction<FeynmanSession[]>>;
  knowledgeMap: KnowledgeMap;
  setKnowledgeMap: React.Dispatch<React.SetStateAction<KnowledgeMap>>;
  referenceLibrary: ReferenceItem[];
  setReferenceLibrary: React.Dispatch<React.SetStateAction<ReferenceItem[]>>;

  activeSpace: AppSpace;
  setActiveSpace: React.Dispatch<React.SetStateAction<AppSpace>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useLocalStorage<Class[]>('classes', []);
  const [studyLogs, setStudyLogs] = useLocalStorage<StudyLog[]>('studyLogs', []);
  const [semesters, setSemesters] = useLocalStorage<Semester[]>('semesters', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('txns', []);
  const [kanbanBoard, setKanbanBoard] = useLocalStorage<KanbanBoard>('kanban', { backlog: [], progress: [], done: [] });
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [decks, setDecks] = useLocalStorage<Deck[]>('decks', []);
  const [viewingFile, setViewingFile] = useState<StoredFileData | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [viewingScheduleItem, setViewingScheduleItem] = useState<Class | null>(null);
  const [events, setEvents] = useLocalStorage<Event[]>('events', []);
  const [pomodoroLogs, setPomodoroLogs] = useLocalStorage<PomodoroLog[]>('pomodoroLogs', []);
  const [learningLogs, setLearningLogs] = useLocalStorage<LearningLog[]>('learningLogs', []);
  const [tracks, setTracks] = useLocalStorage<Track[]>('tracks', []);
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('playlists', []);
  const [musicPlayerState, setMusicPlayerState] = useLocalStorage<MusicPlayerState>('musicPlayerState', {
    currentTrackId: null,
    currentPlaylistId: null,
    isPlaying: false,
    currentTime: 0,
    volume: 0.8,
    isShuffled: false,
  });
  const [habits, setHabits] = useLocalStorage<Habit[]>('habits', []);
  const [jobApplications, setJobApplications] = useLocalStorage<JobApplication[]>('jobApps', []);
  const [visionBoardCards, setVisionBoardCards] = useLocalStorage<VisionCard[]>('visionCards', []);
  const [journalEntries, setJournalEntries] = useLocalStorage<JournalEntry[]>('journalEntries', []);
  const [financialTransactions, setFinancialTransactions] = useLocalStorage<FinancialTransaction[]>('financial_txns_v2', []);
  const [transactionCategories, setTransactionCategories] = useLocalStorage<TransactionCategory[]>('txn_categories_v2', [
    { id: 1, name: 'Salary', type: 'income' },
    { id: 2, name: 'Food', type: 'expense' },
    { id: 3, name: 'Transport', type: 'expense' },
    { id: 4, name: 'Utilities', type: 'expense' },
  ]);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets_v2', []);
  const [engagementLogs, setEngagementLogs] = useLocalStorage<EngagementLog[]>('engagementLogs', []);
  const [customWheels, setCustomWheels] = useLocalStorage<CustomWheel[]>('customWheels', []);
  const [linkResources, setLinkResources] = useLocalStorage<LinkResource[]>('linkResources', []);
  const [pomodoroPresets, setPomodoroPresets] = useLocalStorage<PomodoroPreset[]>('pomodoroPresets', [
    { id: 1, name: 'Classic Pomodoro', modes: [{id: 'work', name: 'Work', duration: 25, color: '#ef4444'}, {id: 'break', name: 'Break', duration: 5, color: '#3b82f6'}], sequence: ['work', 'break', 'work', 'break', 'work', 'break', 'work'] },
    { id: 2, name: '50/10 Session', modes: [{id: 'work', name: 'Work', duration: 50, color: '#f97316'}, {id: 'break', name: 'Break', duration: 10, color: '#22c55e'}], sequence: ['work', 'break', 'work'] }
  ]);
  
  const [activePomodoro, setActivePomodoro] = useState<ActivePomodoroState>(() => {
    // Ensure presets is an array and handle potential corruption
    const presets = Array.isArray(pomodoroPresets) && pomodoroPresets.length > 0 ? pomodoroPresets : [
        { id: 1, name: 'Classic Pomodoro', modes: [{id: 'work', name: 'Work', duration: 25, color: '#ef4444'}, {id: 'break', name: 'Break', duration: 5, color: '#3b82f6'}], sequence: ['work', 'break', 'work', 'break', 'work', 'break', 'work'] }
    ];
    const firstPreset = presets[0];

    if (firstPreset && Array.isArray(firstPreset.modes) && Array.isArray(firstPreset.sequence) && firstPreset.sequence.length > 0) {
      const firstModeId = firstPreset.sequence[0];
      const firstMode = firstPreset.modes.find(m => m && m.id === firstModeId);
      
      return {
        presetId: firstPreset.id,
        sequenceIndex: 0,
        remaining: (firstMode?.duration || 25) * 60,
        running: false,
        startTime: null,
        isPaused: false,
      };
    }
    
    return {
      presetId: firstPreset?.id || 1,
      sequenceIndex: 0,
      remaining: 25 * 60,
      running: false,
      startTime: null,
      isPaused: false,
    };
  });
  
  const [liveCalendarTypes, setLiveCalendarTypes] = useLocalStorage<LiveCalendarType[]>('liveCalendarTypes', [
    { id: 1, name: 'Classic Live Calendar', description: 'A traditional time-blocking system where every minute of the day is scheduled in advance.' },
    { id: 2, name: 'Flexible Live Calendar', description: 'Time-blocks are assigned to tasks, but can be shifted and re-arranged as priorities change.' },
    { id: 3, name: 'Ultra-Minimal Calendar', description: 'Only essential, time-sensitive events are scheduled. The rest of the day is open.' },
  ]);
  const [liveClockTypes, setLiveClockTypes] = useLocalStorage<LiveClockType[]>('liveClockTypes', [
    { id: 1, name: 'Standard Digital', description: 'A classic digital display of the current time.' },
    { id: 2, name: 'Holographic', description: 'A futuristic, glowing projection of time.' },
    { id: 3, name: 'Minimalist Dot', description: 'Represents time with simple, moving dots or lines.' },
  ]);

  const [activeLiveCalendarTypeId, setActiveLiveCalendarTypeId] = useLocalStorage<number | null>('activeLiveCalendarTypeId', liveCalendarTypes?.[0]?.id || null);
  const [activeLiveClockTypeId, setActiveLiveClockTypeId] = useLocalStorage<number | null>('activeLiveClockTypeId', liveClockTypes?.[0]?.id || null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('chatMessages', []);
  const [codeSnippets, setCodeSnippets] = useLocalStorage<CodeSnippet[]>('codeSnippets', []);
  
  // New CS Workspace State
  const [practiceItems, setPracticeItems] = useLocalStorage<PracticeItem[]>('practiceItems', []);
  const [designDiagrams, setDesignDiagrams] = useLocalStorage<DesignDiagram[]>('designDiagrams', []);
  const [algoVisuals, setAlgoVisuals] = useLocalStorage<AlgoVisual[]>('algoVisuals', []);
  const [feynmanSessions, setFeynmanSessions] = useLocalStorage<FeynmanSession[]>('feynmanSessions', []);
  const [knowledgeMap, setKnowledgeMap] = useLocalStorage<KnowledgeMap>('knowledgeMap', { nodes: [], edges: [] });
  const [referenceLibrary, setReferenceLibrary] = useLocalStorage<ReferenceItem[]>('referenceLibrary', []);

  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('appSettings', {
      theme: 'dark',
      uiStyle: 'classic',
      themeConfig: {
        accentHue: 211, accentSaturation: 100, accentLightness: 65,
        bgHue: 215, bgSaturation: 25, bgLightness: 10,
      },
      layout: 'cozy',
      fontFamily: 'sans',
      dashboardColumns: '3',
      dashboardWidgets: DEFAULT_WIDGETS,
      systemModules: DEFAULT_SYSTEM_MODULES,
      toolbar: DEFAULT_TOOLBAR,
      wallpaper: { type: 'default' },
      defaults: {
          pomodoro: { work: 25, break: 5, deep: 50 },
          quickNote: { color: 'Default', isPinned: false }
      },
      timeFormat: '12h',
      focusMode: {
          defaultTheme: 'dark',
          defaultTimerSize: 150
      },
      customCSS: '',
  });
  
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks_v2', []);
  const [activeSpace, setActiveSpace] = useLocalStorage<AppSpace>('activeSpace', 'dashboard');

  // KANBAN MIGRATION
  useEffect(() => {
    if (kanbanBoard && kanbanBoard.backlog && kanbanBoard.progress && kanbanBoard.done) {
        if (kanbanBoard.backlog.length > 0 || kanbanBoard.progress.length > 0 || kanbanBoard.done.length > 0) {
          const migratedTasks: Task[] = [
            ...kanbanBoard.backlog.map(t => ({ id: t.ts, title: t.title, description: t.description, status: 'Backlog' as TaskStatus, priority: 'None' as TaskPriority, createdAt: t.ts, updatedAt: t.ts, attachments: t.attachments || [], subtasks: [], dependencies: [] })),
            ...kanbanBoard.progress.map(t => ({ id: t.ts, title: t.title, description: t.description, status: 'In Progress' as TaskStatus, priority: 'None' as TaskPriority, createdAt: t.ts, updatedAt: t.ts, attachments: t.attachments || [], subtasks: [], dependencies: [] })),
            ...kanbanBoard.done.map(t => ({ id: t.ts, title: t.title, description: t.description, status: 'Done' as TaskStatus, priority: 'None' as TaskPriority, createdAt: t.ts, updatedAt: t.ts, attachments: t.attachments || [], subtasks: [], dependencies: [] })),
          ];
          setTasks(prev => [...prev, ...migratedTasks]);
          setKanbanBoard({ backlog: [], progress: [], done: [] }); 
        }
    }
  }, [kanbanBoard, setKanbanBoard, setTasks]);
  
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [visualizerCanvasRef, setVisualizerCanvasRef] = useState<React.MutableRefObject<HTMLCanvasElement | null> | null>(null);
  const [backgroundOverlay, setBackgroundOverlay] = useState<'paper' | 'none'>('none');
  
  
  const value: AppContextType = {
    // SAFEGUARDS: Fallback to empty array if storage is corrupt/null to avoid crashes
    classes: Array.isArray(classes) ? classes : [], setClasses,
    studyLogs: Array.isArray(studyLogs) ? studyLogs : [], setStudyLogs,
    semesters: Array.isArray(semesters) ? semesters : [], setSemesters,
    projects: Array.isArray(projects) ? projects : [], setProjects,
    transactions: Array.isArray(transactions) ? transactions : [], setTransactions,
    financialTransactions: Array.isArray(financialTransactions) ? financialTransactions : [], setFinancialTransactions,
    transactionCategories: Array.isArray(transactionCategories) ? transactionCategories : [], setTransactionCategories,
    budgets: Array.isArray(budgets) ? budgets : [], setBudgets,
    tasks: Array.isArray(tasks) ? tasks : [], setTasks,
    notes: Array.isArray(notes) ? notes : [], setNotes,
    decks: Array.isArray(decks) ? decks : [], setDecks,
    viewingFile, setViewingFile,
    viewingTask, setViewingTask,
    viewingScheduleItem, setViewingScheduleItem,
    events: Array.isArray(events) ? events : [], setEvents,
    pomodoroLogs: Array.isArray(pomodoroLogs) ? pomodoroLogs : [], setPomodoroLogs,
    learningLogs: Array.isArray(learningLogs) ? learningLogs : [], setLearningLogs,
    tracks: Array.isArray(tracks) ? tracks : [], setTracks,
    playlists: Array.isArray(playlists) ? playlists : [], setPlaylists,
    musicPlayerState, setMusicPlayerState,
    habits: Array.isArray(habits) ? habits : [], setHabits,
    jobApplications: Array.isArray(jobApplications) ? jobApplications : [], setJobApplications,
    visionBoardCards: Array.isArray(visionBoardCards) ? visionBoardCards : [], setVisionBoardCards,
    journalEntries: Array.isArray(journalEntries) ? journalEntries : [], setJournalEntries,
    appSettings, setAppSettings,
    engagementLogs: Array.isArray(engagementLogs) ? engagementLogs : [], setEngagementLogs,
    isCommandPaletteOpen, setIsCommandPaletteOpen,
    isQuickCreateOpen, setIsQuickCreateOpen,
    visualizerCanvasRef, setVisualizerCanvasRef,
    setBackgroundOverlay,
    customWheels: Array.isArray(customWheels) ? customWheels : [], setCustomWheels,
    linkResources: Array.isArray(linkResources) ? linkResources : [], setLinkResources,
    pomodoroPresets: Array.isArray(pomodoroPresets) ? pomodoroPresets : [], setPomodoroPresets,
    activePomodoro, setActivePomodoro,
    liveCalendarTypes: Array.isArray(liveCalendarTypes) ? liveCalendarTypes : [], setLiveCalendarTypes,
    liveClockTypes: Array.isArray(liveClockTypes) ? liveClockTypes : [], setLiveClockTypes,
    activeLiveCalendarTypeId, setActiveLiveCalendarTypeId,
    activeLiveClockTypeId, setActiveLiveClockTypeId,
    notifications, setNotifications,
    chatMessages: Array.isArray(chatMessages) ? chatMessages : [], setChatMessages,
    codeSnippets: Array.isArray(codeSnippets) ? codeSnippets : [], setCodeSnippets,
    activeSpace, setActiveSpace,
    // New CS Data
    practiceItems: Array.isArray(practiceItems) ? practiceItems : [], setPracticeItems,
    designDiagrams: Array.isArray(designDiagrams) ? designDiagrams : [], setDesignDiagrams,
    algoVisuals: Array.isArray(algoVisuals) ? algoVisuals : [], setAlgoVisuals,
    feynmanSessions: Array.isArray(feynmanSessions) ? feynmanSessions : [], setFeynmanSessions,
    knowledgeMap, setKnowledgeMap,
    referenceLibrary: Array.isArray(referenceLibrary) ? referenceLibrary : [], setReferenceLibrary,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};