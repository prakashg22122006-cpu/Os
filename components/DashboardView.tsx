import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import ClockCalendar from './dashboard/ClockCalendar';
import PomodoroTimer from './dashboard/PomodoroTimer';
import TasksWidget from './dashboard/TasksWidget';
import ClassesWidget from './dashboard/ClassesWidget';
import StudyProgress from './dashboard/StudyProgress';
import QuickNote from './dashboard/QuickNote';
import MusicPlayer from './dashboard/MusicPlayer';
import FocusMode from './dashboard/FocusMode';
import HabitStreak from './dashboard/HabitStreak';
import { useAppContext } from '../context/AppContext';
import ProgressSummary from './dashboard/ProgressSummary';
import { DashboardWidgetSetting } from '../types';
import GamificationWidget from './dashboard/GamificationWidget';

const WIDGETS_MAP: { [key: string]: React.FC<any> } = {
    summary: ProgressSummary,
    clock: ClockCalendar,
    pomodoro: PomodoroTimer,
    tasks: TasksWidget,
    classes: ClassesWidget,
    progress: StudyProgress,
    note: QuickNote,
    music: MusicPlayer,
    habits: HabitStreak,
    gamification: GamificationWidget,
    focus: FocusMode,
};

const FullScreenWrapper: React.FC<{
    widget: { id: string; Component: React.FC<any>; settings?: DashboardWidgetSetting };
    onClose: () => void;
}> = ({ widget, onClose }) => {
    const { Component, settings } = widget;
    return (
        <div className="fullscreen-overlay" onClick={onClose}>
            <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
                <Card
                    className={`xl:col-span-${settings?.colSpan || 1}`}
                    widgetName={settings?.name || 'Widget'}
                    isMinimized={false}
                    onToggleMinimize={() => {}}
                    onToggleFullScreen={onClose}
                >
                    <Component />
                </Card>
            </div>
        </div>
    );
};

interface DashboardViewProps {
    setIsFocusMode: (isFocus: boolean) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ setIsFocusMode }) => {
    const { appSettings, setAppSettings } = useAppContext();
    const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
    const [fullScreenWidgetId, setFullScreenWidgetId] = useState<string | null>(null);

    const dashboardLayout = useMemo(() => {
        const widgets = Array.isArray(appSettings.dashboardWidgets) ? appSettings.dashboardWidgets : [];
        return widgets
            .filter(w => w && w.id) // Guard against malformed widget settings
            .map((settings) => ({ 
                id: settings.id, 
                Component: WIDGETS_MAP[settings.id], 
                settings,
            }))
            .filter(w => w.settings?.enabled && w.Component);
    }, [appSettings.dashboardWidgets]);

    const handleWidgetSettingChange = (widgetId: string, updates: Partial<DashboardWidgetSetting>) => {
        const newSettings = appSettings.dashboardWidgets.map(w => 
            w.id === widgetId ? { ...w, ...updates } : w
        );
        setAppSettings(prev => ({ ...prev, dashboardWidgets: newSettings }));
    };
    
    const gridColsClass = useMemo(() => appSettings.dashboardColumns === '3' ? 'xl:grid-cols-3' : 'xl:grid-cols-2', [appSettings.dashboardColumns]);
    const fullScreenWidget = useMemo(() => fullScreenWidgetId ? dashboardLayout.find(w => w.id === fullScreenWidgetId) : null, [fullScreenWidgetId, dashboardLayout]);

    return (
        <>
            <div className={`grid grid-cols-1 lg:grid-cols-2 ${gridColsClass}`} style={{ gap: 'var(--widget-gap)' }}>
                {dashboardLayout.map(({ id, Component, settings }, index) => (
                    <div
                        key={id}
                        className={`xl:col-span-${settings?.colSpan || 1} animate-in`}
                        style={{ animationDelay: `${index * 70}ms` }}
                    >
                        <Card
                            widgetName={settings?.name || 'Widget'}
                            isMinimized={!!settings?.minimized}
                            onToggleMinimize={() => handleWidgetSettingChange(id, { minimized: !settings?.minimized })}
                            onToggleFullScreen={() => setFullScreenWidgetId(id)}
                        >
                            <Component 
                                onRunningStateChange={id === 'pomodoro' ? setIsPomodoroRunning : undefined} 
                                setIsFocusMode={setIsFocusMode}
                            />
                        </Card>
                    </div>
                ))}
            </div>
            {fullScreenWidget && (
                <FullScreenWrapper
                    widget={fullScreenWidget}
                    onClose={() => setFullScreenWidgetId(null)}
                />
            )}
        </>
    );
};

export default DashboardView;