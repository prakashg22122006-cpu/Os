
import React, { useMemo, useState } from 'react';
import Card from './ui/Card';
import AcademicsManager from './systems/AcademicsManager';
import FinanceManager from './systems/FinanceManager';
import TaskManager from './systems/TaskManager';
import BackupRestoreManager from './systems/BackupRestoreManager';
import NotesManager from './systems/NotesManager';
import FileManager from './systems/FileManager';
import MemoryCenter from './systems/MemoryCenter'; 
import HabitsManager from './systems/HabitsManager';
import JobApplicationManager from './systems/JobApplicationManager';
import VisionAndJournalManager from './systems/VisionAndJournalManager';
import PriorityMatrix from './systems/PriorityMatrix';
import GlobalSearch from './systems/GlobalSearch';
import SettingsManager from './systems/SettingsManager';
import ProgressManager from './systems/ProgressManager';
import AnalyticsManager from './systems/AnalyticsManager';
import { useAppContext } from '../context/AppContext';
import LazyLoadModule from './ui/LazyLoadModule';
import { SystemModuleSetting } from '../types';

const MODULE_MAP: { [key: string]: React.FC } = {
    search: GlobalSearch,
    notes: NotesManager,
    files: FileManager,
    academics: AcademicsManager,
    analytics: AnalyticsManager,
    progress: ProgressManager,
    memory: MemoryCenter,
    habits: HabitsManager,
    jobs: JobApplicationManager,
    vision: VisionAndJournalManager,
    finance: FinanceManager,
    tasks: TaskManager,
    matrix: PriorityMatrix,
    backup: BackupRestoreManager,
    settings: SettingsManager,
};

const FullScreenWrapper: React.FC<{
    module: { id: string; settings: SystemModuleSetting };
    onClose: () => void;
}> = ({ module, onClose }) => {
    const Component = MODULE_MAP[module.id];
    if (!Component) return null;

    return (
        <div className="fullscreen-overlay" onClick={onClose}>
            <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
                <Card
                    widgetName={module.settings.name}
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


const SystemsView: React.FC = () => {
    const { appSettings, setAppSettings } = useAppContext();
    const [fullScreenModuleId, setFullScreenModuleId] = useState<string | null>(null);
    
    const enabledModules = useMemo(() => {
        const modules = Array.isArray(appSettings.systemModules) ? appSettings.systemModules : [];
        
        const sanitizedModuleSettings = modules.filter((m): m is SystemModuleSetting => !!(m && m.id));

        const settingsMap = new Map<string, SystemModuleSetting>(
            sanitizedModuleSettings.map(m => [m.id, m] as [string, SystemModuleSetting])
        );
        return Object.keys(MODULE_MAP)
            .map(id => ({ id, settings: settingsMap.get(id) }))
            .filter((m): m is { id: string, settings: SystemModuleSetting } => {
                return !!m.settings && m.settings.enabled;
            })
            .sort((a, b) => {
                const indexA = sanitizedModuleSettings.findIndex(s => s.id === a.id);
                const indexB = sanitizedModuleSettings.findIndex(s => s.id === b.id);
                return indexA - indexB;
            });
    }, [appSettings.systemModules]);

    const handleModuleSettingChange = (moduleId: string, updates: Partial<SystemModuleSetting>) => {
        const newSettings = appSettings.systemModules.map(m => 
            m.id === moduleId ? { ...m, ...updates } : m
        );
        setAppSettings(prev => ({ ...prev, systemModules: newSettings }));
    };

    const fullScreenModule = useMemo(() => {
        return fullScreenModuleId ? enabledModules.find(m => m.id === fullScreenModuleId) : null;
    }, [fullScreenModuleId, enabledModules]);
    
    return (
        <>
            <div className="flex flex-col" style={{ gap: 'var(--widget-gap)' }}>
                {enabledModules.map(({ id, settings }, index) => {
                    const Component = MODULE_MAP[id];
                    if (!Component || !settings) return null;
                    return (
                        <div key={id} className="animate-in" style={{ animationDelay: `${index * 70}ms` }}>
                            <LazyLoadModule
                                placeholder={
                                    <Card>
                                        <div className="h-48 flex items-center justify-center">
                                            <p className="text-[var(--text-color-dim)] animate-pulse">{settings?.name || 'Module'} loading...</p>
                                        </div>
                                    </Card>
                                }
                            >
                                <Card
                                    widgetName={settings?.name || 'Module'}
                                    isMinimized={!!settings?.minimized}
                                    onToggleMinimize={() => handleModuleSettingChange(id, { minimized: !settings?.minimized })}
                                    onToggleFullScreen={() => setFullScreenModuleId(id)}
                                >
                                    <Component />
                                </Card>
                            </LazyLoadModule>
                        </div>
                    );
                })}
            </div>
            {fullScreenModule && (
                <FullScreenWrapper
                    module={fullScreenModule}
                    onClose={() => setFullScreenModuleId(null)}
                />
            )}
        </>
    );
};

export default SystemsView;
