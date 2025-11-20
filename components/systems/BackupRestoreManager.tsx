
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { getBackups, getBackup } from '../../utils/db';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const downloadJSON = (obj: any, name = 'export.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

const BackupRestoreManager: React.FC = () => {
    const context = useAppContext();
    const importFileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<{ filename: string; content: any } | null>(null);
    const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
    const [snapshots, setSnapshots] = useState<{ timestamp: number }[]>([]);

    useEffect(() => {
        getBackups().then(setSnapshots);
    }, []);

    const MODULES = useMemo(() => [
        { key: 'classes', name: 'Classes Schedule', data: context.classes, setter: context.setClasses },
        { key: 'studyLogs', name: 'Study Logs', data: context.studyLogs, setter: context.setStudyLogs },
        { key: 'semesters', name: 'Academics', data: context.semesters, setter: context.setSemesters },
        { key: 'financialTransactions', name: 'Transactions', data: context.financialTransactions, setter: context.setFinancialTransactions },
        { key: 'transactionCategories', name: 'Finance Categories', data: context.transactionCategories, setter: context.setTransactionCategories },
        { key: 'budgets', name: 'Budgets', data: context.budgets, setter: context.setBudgets },
        { key: 'tasks', name: 'Tasks', data: context.tasks, setter: context.setTasks },
        { key: 'notes', name: 'Notes', data: context.notes, setter: context.setNotes },
        { key: 'decks', name: 'Flashcard Decks', data: context.decks, setter: context.setDecks },
        { key: 'events', name: 'Calendar Events', data: context.events, setter: context.setEvents },
        { key: 'pomodoroLogs', name: 'Pomodoro Logs', data: context.pomodoroLogs, setter: context.setPomodoroLogs },
        { key: 'tracks', name: 'Music Tracks', data: context.tracks, setter: context.setTracks },
        { key: 'playlists', name: 'Music Playlists', data: context.playlists, setter: context.setPlaylists },
        { key: 'musicPlayerState', name: 'Music Player State', data: context.musicPlayerState, setter: context.setMusicPlayerState },
        { key: 'habits', name: 'Habits', data: context.habits, setter: context.setHabits },
        { key: 'jobApplications', name: 'Job Applications', data: context.jobApplications, setter: context.setJobApplications },
        { key: 'visionBoardCards', name: 'Vision Board', data: context.visionBoardCards, setter: context.setVisionBoardCards },
        { key: 'journalEntries', name: 'Journal Entries', data: context.journalEntries, setter: context.setJournalEntries },
    ], [context]);

    const handleExport = (modulesToExport: string[] | 'all') => {
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const isFull = modulesToExport === 'all';
        const data: { [key: string]: any } = {};
        
        const modules = isFull ? MODULES : MODULES.filter(m => modulesToExport.includes(m.key));
        modules.forEach(m => {
            data[m.key] = m.data;
        });

        const backupObject = {
            metadata: {
                version: 1,
                timestamp: new Date().toISOString(),
                type: isFull ? 'full' : 'partial',
                modules: isFull ? ['all'] : modulesToExport,
            },
            data,
        };
        
        const moduleName = isFull ? 'full' : modulesToExport.join('-');
        downloadJSON(backupObject, `studyos-backup-${moduleName}-${timestamp}.json`);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target?.result as string);
                if (content.metadata && content.data) {
                    setPreview({ filename: file.name, content });
                    setRestoreMode(content.metadata.type === 'full' ? 'overwrite' : 'merge');
                } else {
                    alert('Invalid backup file format. Missing metadata or data key.');
                }
            } catch (err) {
                alert('Error parsing backup file. Make sure it is a valid JSON file.');
            } finally {
                if (importFileRef.current) importFileRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleRestore = () => {
        if (!preview) return;

        const backupData = preview.content.data;
        const isFullBackup = preview.content.metadata.type === 'full';
        const modulesInBackup = Object.keys(backupData);

        if (restoreMode === 'overwrite') {
            const modulesToProcess = isFullBackup ? MODULES : MODULES.filter(m => modulesInBackup.includes(m.key));
            modulesToProcess.forEach(module => {
                const data = backupData[module.key];
                const emptyState = Array.isArray(module.data) ? [] : {};
                (module.setter as any)(data || emptyState);
            });
            alert('Data overwritten successfully!');
        } else { // Merge
            modulesInBackup.forEach(key => {
                const module = MODULES.find(m => m.key === key);
                if (!module || !Array.isArray(module.data)) return; // Only merge array data
                
                (module.setter as any)((currentData: any[]) => {
                    const existingIds = new Set(currentData.map(item => item.id || item.ts));
                    const newItems = backupData[key].filter((item: any) => !existingIds.has(item.id || item.ts));
                    return [...currentData, ...newItems];
                });
            });
            alert('Data merged successfully! New items were added.');
        }

        setPreview(null);
    };
    
    const handleRestoreFromSnapshot = async (timestamp: number) => {
        const snapshot = await getBackup(timestamp);
        if (snapshot) {
            try {
                const data = JSON.parse(snapshot.data);
                const content = {
                    metadata: { type: 'full', timestamp: new Date(timestamp).toISOString() },
                    data: data,
                };
                setPreview({ filename: `Snapshot from ${new Date(timestamp).toLocaleString()}`, content });
                setRestoreMode('overwrite');
            } catch (e) {
                alert("Failed to read snapshot data.");
            }
        }
    };

    const renderPreviewModal = () => {
        if (!preview) return null;
        const { metadata, data } = preview.content;
        const modulesInBackup = Object.keys(data);

        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[#5aa1ff]/20 rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                    <header className="p-3 border-b border-white/10">
                        <h4 className="font-semibold text-lg">Restore Preview</h4>
                    </header>
                    <main className="p-4 space-y-4">
                        <p className="text-sm"><strong>File:</strong> {preview.filename}</p>
                        <p className="text-sm"><strong>Type:</strong> <span className="capitalize">{metadata.type}</span></p>
                        <p className="text-sm"><strong>Created:</strong> {new Date(metadata.timestamp).toLocaleString()}</p>
                        <div>
                            <h5 className="font-semibold mb-2">Data Found:</h5>
                            <ul className="text-xs list-disc list-inside bg-black/20 p-2 rounded max-h-32 overflow-y-auto">
                                {modulesInBackup.map(key => {
                                    const count = Array.isArray(data[key]) ? data[key].length : '1 item';
                                    const moduleName = MODULES.find(m => m.key === key)?.name || key;
                                    return <li key={key}>{moduleName}: {count}</li>;
                                })}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-2">Restore Method</h5>
                            <div className="space-y-2">
                                <label className="flex items-start gap-3 p-2 rounded bg-white/5 cursor-pointer">
                                    <input type="radio" name="restoreMode" value="overwrite" checked={restoreMode === 'overwrite'} onChange={() => setRestoreMode('overwrite')} className="mt-1"/>
                                    <div>
                                        <strong>Overwrite</strong>
                                        <p className="text-xs text-gray-300">Replaces current data with the backup. <span className="font-bold text-red-400">Warning: Existing data in the affected modules will be deleted.</span></p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-2 rounded bg-white/5 cursor-pointer">
                                    <input type="radio" name="restoreMode" value="merge" checked={restoreMode === 'merge'} onChange={() => setRestoreMode('merge')} className="mt-1"/>
                                    <div>
                                        <strong>Merge</strong>
                                        <p className="text-xs text-gray-300">Adds new items from the backup to your current data. Items with duplicate IDs will be ignored.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </main>
                    <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                        <Button variant="outline" onClick={() => setPreview(null)}>Cancel</Button>
                        <Button onClick={handleRestore}>Confirm Restore</Button>
                    </footer>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <CardHeader title="Backup & Restore" subtitle="Safeguard and manage your application data" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <h4 className="font-semibold mb-2">Manual Actions</h4>
                    <p className="text-xs text-gray-400 mb-3">Manually export your data or import from a file.</p>
                     <div className="flex gap-2">
                        <Button onClick={() => importFileRef.current?.click()} className="flex-1">Import from File...</Button>
                        <input type="file" ref={importFileRef} onChange={handleFileSelect} className="hidden" accept="application/json" />
                        <Button variant="outline" onClick={() => handleExport('all')} className="flex-1">Export All Data</Button>
                    </div>
                </Card>

                <Card>
                    <h4 className="font-semibold mb-2">Automated Snapshots</h4>
                    <p className="text-xs text-gray-400 mb-3">The app automatically creates a daily backup. You can restore from a recent snapshot below.</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {snapshots.length > 0 ? snapshots.map(snap => (
                            <div key={snap.timestamp} className="flex justify-between items-center p-2 bg-black/20 rounded">
                                <span className="text-sm">{new Date(snap.timestamp).toLocaleString()}</span>
                                <Button variant="outline" className="text-xs" onClick={() => handleRestoreFromSnapshot(snap.timestamp)}>Restore</Button>
                            </div>
                        )) : <p className="text-sm text-center text-gray-400 p-4">No snapshots found. One will be created automatically.</p>}
                    </div>
                </Card>
            </div>

            {renderPreviewModal()}
        </div>
    );
};

export default BackupRestoreManager;
