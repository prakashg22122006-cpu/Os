import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { StudyLog, Semester, Project, Transaction, KanbanBoard, Note, Class, Deck, StoredFileData, KanbanTask, Event, PomodoroLog, Track, Playlist, MusicPlayerState, Habit, JobApplication, Task, TaskStatus, TaskPriority, VisionCard, JournalEntry, FinancialTransaction, TransactionCategory, Budget, AppSettings, DashboardWidgetSetting, SystemModuleSetting, LearningLog, Course, EngagementLog, CustomWheel, LinkResource } from '../types';
import { addBackup, getBackups, deleteBackup } from '../utils/db';

const DEFAULT_WIDGETS: DashboardWidgetSetting[] = [
    { id: 'summary', enabled: true, colSpan: 3, name: 'Progress Summary', minimized: false },
    { id: 'clock', enabled: true, colSpan: 3, name: 'Calendar & Clock', minimized: false },
    { id: 'pomodoro', enabled: true, colSpan: 1, name: 'Pomodoro Timer', minimized: false },
    { id: 'tasks', enabled: true, colSpan: 2, name: 'Today\'s Tasks', minimized: false },
    { id: 'classes', enabled: true, colSpan: 1, name: 'Today\'s Schedule', minimized: false },
    { id: 'progress', enabled: true, colSpan: 2, name: 'Study Progress', minimized: false },
    { id: 'note', enabled: true, colSpan: 3, name: 'Quick Note', minimized: false },
    { id: 'music', enabled: false, colSpan: 2, name: 'Music Player', minimized: false },
    { id: 'habits', enabled: false, colSpan: 1, name: 'Habit Streaks', minimized: false },
    { id: 'focus', enabled: false, colSpan: 3, name: 'Focus Mode', minimized: false },
];

const DEFAULT_SYSTEM_MODULES: SystemModuleSetting[] = [
    { id: 'notes', name: 'Notes & Resource Library', enabled: true, minimized: false },
    { id: 'files', name: 'Resource Manager', enabled: true, minimized: false },
    { id: 'academics', name: 'Academics Manager', enabled: true, minimized: false },
    { id: 'projects', name: 'Projects Manager', enabled: true, minimized: false },
    { id: 'finance', name: 'Finance Manager', enabled: true, minimized: false },
    { id: 'tasks', name: 'Task Manager', enabled: true, minimized: false },
    { id: 'backup', name: 'Backup & Restore', enabled: true, minimized: false },
    { id: 'settings', name: 'Settings', enabled: true, minimized: false },
];

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useLocalStorage<Class[]>('classes', []);
  const [studyLogs, setStudyLogs] = useLocalStorage<StudyLog[]>('studyLogs', []);
  const [semesters, setSemesters] = useLocalStorage<Semester[]>('semesters', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('txns', []);
  const [kanbanBoard, setKanbanBoard] = useLocalStorage<KanbanBoard>('kanban', { backlog: [], progress: [], done: [] });
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [decks, setDecks] = useLocalStorage<Deck[]>('decks', []);
  const [viewingFile, setViewingFile] = useState<StoredFileData | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [viewingScheduleItem, setViewingScheduleItem] = useState<Class | null>(null);
  const [events, setEvents] = useLocalStorage<Event[]>('events', []);
  const [pomodoroLogs, setPomodoroLogs] = useLocalStorage<PomodoroLog[]>('pomodoroLogs', []);
  const [learningLogs, setLearningLogs] = useLocalStorage<LearningLog[]>('learningLogs', []);
  const [tracks, setTracks] = useLocalStorage<Track[]>('musicTracks', []);
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('musicPlaylists', []);
  const [musicPlayerState, setMusicPlayerState] = useLocalStorage<MusicPlayerState>('musicPlayerState', {
    currentTrackId: null,
    currentPlaylistId: null,
    isPlaying: false,
    currentTime: 0,
    volume: 0.8,
    isShuffled: false,
  });
  const [habits, setHabits] = useLocalStorage<Habit[]>('habits', []);
  const [jobApplications, setJobApplications] = useLocalStorage<JobApplication[]>('jobApplications', []);
  const [visionBoardCards, setVisionBoardCards] = useLocalStorage<VisionCard[]>('visionBoardCards', []);
  const [journalEntries, setJournalEntries] = useLocalStorage<JournalEntry[]>('journalEntries', []);
  const [customWheels, setCustomWheels] = useLocalStorage<CustomWheel[]>('customWheels', []);
  const [linkResources, setLinkResources] = useLocalStorage<LinkResource[]>('linkResources', []);
  
  // New Finance State
  const [financialTransactions, setFinancialTransactions] = useLocalStorage<FinancialTransaction[]>('financialTransactions', []);
  const [transactionCategories, setTransactionCategories] = useLocalStorage<TransactionCategory[]>('transactionCategories', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);

  // Analytics State
  const [engagementLogs, setEngagementLogs] = useLocalStorage<EngagementLog[]>('engagementLogs', []);
  
  // App Settings
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('appSettings', {
    theme: 'dark',
    uiStyle: 'classic',
    themeConfig: {
      accentHue: 211,
      accentSaturation: 100,
      accentLightness: 65,
      bgHue: 215,
      bgSaturation: 25,
      bgLightness: 10,
    },
    layout: 'spacious',
    fontFamily: 'sans',
    dashboardColumns: '3',
    dashboardWidgets: DEFAULT_WIDGETS,
    systemModules: DEFAULT_SYSTEM_MODULES,
    wallpaper: { 
        type: 'default',
        liveConfig: {
            particleDensity: 0.5,
            particleOpacity: 0.5,
            liveImageId: undefined,
        }
    },
    defaults: {
        pomodoro: { work: 25, break: 5, deep: 50 },
        quickNote: { color: 'Default', isPinned: false },
    },
    timeFormat: '12h',
    focusMode: { defaultTheme: 'deep_space', defaultTimerSize: 300 },
  });

  // Interaction Mechanics State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [visualizerCanvasRef, setVisualizerCanvasRef] = useState<React.MutableRefObject<HTMLCanvasElement | null> | null>(null);
  const [backgroundOverlay, setBackgroundOverlay] = useState<'paper' | 'none'>('none');

  // Automated Backup System
    useEffect(() => {
        const handleAutomatedBackup = async () => {
            try {
                const backups = await getBackups();
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;
                const latestBackup = backups[0]?.timestamp || 0;

                if (now - latestBackup > oneDay) {
                    console.log('Creating automated daily backup...');
                    const allData = {
                        classes, studyLogs, semesters, projects, transactions, financialTransactions,
                        transactionCategories, budgets, tasks, notes, decks, events, pomodoroLogs,
                        learningLogs, tracks, playlists, musicPlayerState, habits, jobApplications,
                        visionBoardCards, journalEntries, appSettings, engagementLogs, linkResources,
                    };
                    await addBackup(allData);
                    console.log('Automated backup successful.');

                    // Rotate backups, keeping the last 7
                    if (backups.length >= 7) {
                        const oldestBackup = backups[backups.length - 1];
                        console.log(`Deleting old backup from ${new Date(oldestBackup.timestamp).toLocaleString()}`);
                        await deleteBackup(oldestBackup.timestamp);
                    }
                }
            } catch (error) {
                console.error("Failed to perform automated backup:", error);
            }
        };
        // Run backup check shortly after app starts
        const timer = setTimeout(handleAutomatedBackup, 5000);
        return () => clearTimeout(timer);
    }, [
      classes, studyLogs, semesters, projects, transactions, financialTransactions,
      transactionCategories, budgets, tasks, notes, decks, events, pomodoroLogs,
      learningLogs, tracks, playlists, musicPlayerState, habits, jobApplications,
      visionBoardCards, journalEntries, appSettings, engagementLogs, linkResources,
    ]);


  useEffect(() => {
    // Migration for Tasks from Kanban
    const oldTasksExist = kanbanBoard.backlog.length > 0 || kanbanBoard.progress.length > 0 || kanbanBoard.done.length > 0;
    const newTasksEmpty = tasks.length === 0;

    if (oldTasksExist && newTasksEmpty) {
      console.log('Migrating old Kanban tasks to new Tasks system...');
      const migratedTasks: Task[] = [];
      const migrate = (oldTask: KanbanTask, status: TaskStatus) => {
        let priority: TaskPriority = 'None';
        if (oldTask.importance && oldTask.urgency) priority = 'Urgent';
        else if (oldTask.importance) priority = 'High';
        else if (oldTask.urgency) priority = 'Medium';
        migratedTasks.push({
          id: oldTask.ts,
          title: oldTask.title,
          description: oldTask.description || oldTask.notes,
          status: status,
          priority: priority,
          dueDate: oldTask.dueDate,
          createdAt: oldTask.ts,
          updatedAt: oldTask.ts,
          attachments: oldTask.attachments || [],
          subtasks: [],
          dependencies: [],
          tags: oldTask.category ? [oldTask.category] : [],
        });
      };
      kanbanBoard.backlog.forEach(t => migrate(t, 'Backlog'));
      kanbanBoard.progress.forEach(t => migrate(t, 'In Progress'));
      kanbanBoard.done.forEach(t => migrate(t, 'Done'));
      setTasks(migratedTasks);
      setKanbanBoard({ backlog: [], progress: [], done: [] }); // Clear old board
      console.log('Migration complete.');
    }
  }, [kanbanBoard, tasks, setTasks, setKanbanBoard]);

  const value = {
    classes, setClasses,
    studyLogs, setStudyLogs,
    semesters, setSemesters,
    projects, setProjects,
    transactions, setTransactions,
    financialTransactions, setFinancialTransactions,
    transactionCategories, setTransactionCategories,
    budgets, setBudgets,
    tasks, setTasks,
    notes, setNotes,
    decks, setDecks,
    viewingFile, setViewingFile,
    viewingTask, setViewingTask,
    viewingScheduleItem, setViewingScheduleItem,
    events, setEvents,
    pomodoroLogs, setPomodoroLogs,
    learningLogs, setLearningLogs,
    tracks, setTracks,
    playlists, setPlaylists,
    musicPlayerState, setMusicPlayerState,
    habits, setHabits,
    jobApplications, setJobApplications,
    visionBoardCards, setVisionBoardCards,
    journalEntries, setJournalEntries,
    appSettings, setAppSettings,
    engagementLogs, setEngagementLogs,
    isCommandPaletteOpen, setIsCommandPaletteOpen,
    isQuickCreateOpen, setIsQuickCreateOpen,
    visualizerCanvasRef, setVisualizerCanvasRef,
    setBackgroundOverlay,
    customWheels, setCustomWheels,
    linkResources, setLinkResources,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
