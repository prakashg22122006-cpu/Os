import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Note, Task, Project, Course, StoredFile } from '../../types';
import { getFiles, getFile } from '../../utils/db';

const stripHtml = (html: string | undefined) => (html || '').replace(/<[^>]+>/g, '');

const ResultSection = ({ title, items, renderItem }: { title: string; items: any[]; renderItem: (item: any) => React.ReactNode }) => (
    <div>
        <h4 className="font-semibold mb-2 text-text">{title} ({items.length})</h4>
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={item.id || item.ts || (item.course && item.course.name) || index} className="p-2 bg-black/10 rounded-lg">
                    {renderItem(item)}
                </div>
            ))}
        </div>
    </div>
);

const GlobalSearch: React.FC = () => {
    const {
        notes, tasks, projects, semesters,
        setViewingTask, setViewingFile,
    } = useAppContext();
    const [files, setFiles] = useState<StoredFile[]>([]);
    
    useEffect(() => {
        getFiles().then(setFiles);
    }, []);

    const [searchTerm, setSearchTerm] = useState('');

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
        tasks.forEach(t => t.tags?.forEach(t => tagSet.add(t)));
        files.forEach(f => f.tags?.forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }, [notes, tasks, files]);

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return null;
        const term = searchTerm.toLowerCase();
        
        const foundNotes = notes.filter(n => 
            n.title.toLowerCase().includes(term) ||
            stripHtml(n.content).toLowerCase().includes(term) ||
            n.tags?.some(t => t.toLowerCase().includes(term))
        );

        const foundTasks = tasks.filter(t => 
            t.title.toLowerCase().includes(term) ||
            (t.description || '').toLowerCase().includes(term) ||
            t.tags?.some(t => t.toLowerCase().includes(term))
        );
        
        const foundProjects = projects.filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.desc.toLowerCase().includes(term) ||
            p.stack.toLowerCase().includes(term)
        );

        const foundCourses: {course: Course, semester: string}[] = [];
        semesters.forEach(s => {
            s.courses.forEach(c => {
                if (c.name.toLowerCase().includes(term) || (c.code || '').toLowerCase().includes(term)) {
                    foundCourses.push({ course: c, semester: s.name });
                }
            });
        });

        const foundFiles = files.filter(f => 
            f.name.toLowerCase().includes(term) ||
            f.tags?.some(t => t.toLowerCase().includes(term))
        );

        return {
            notes: foundNotes,
            tasks: foundTasks,
            projects: foundProjects,
            courses: foundCourses,
            files: foundFiles,
        };
    }, [searchTerm, notes, tasks, projects, semesters, files]);

    return (
        <>
            <div className="flex gap-2 mb-4">
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search across all your data..."
                    className="text-lg"
                />
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
                <span className="text-sm text-text-dim my-auto">Tags:</span>
                {allTags.map(tag => (
                    <Button key={tag} variant="outline" className="text-xs" onClick={() => setSearchTerm(tag)}>#{tag}</Button>
                ))}
            </div>

            {searchResults && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {searchResults.notes.length > 0 && <ResultSection title="Notes" items={searchResults.notes} renderItem={(item: Note) => <div><strong>{item.title}</strong><p className="text-xs text-text-dim truncate">{stripHtml(item.content)}</p></div>} />}
                    {searchResults.tasks.length > 0 && <ResultSection title="Tasks" items={searchResults.tasks} renderItem={(item: Task) => <div onClick={() => setViewingTask(item)} className="cursor-pointer"><strong>{item.title}</strong></div>} />}
                    {searchResults.projects.length > 0 && <ResultSection title="Projects" items={searchResults.projects} renderItem={(item: Project) => <div><strong>{item.name}</strong><p className="text-xs text-text-dim">{item.stack}</p></div>} />}
                    {searchResults.courses.length > 0 && <ResultSection title="Courses" items={searchResults.courses} renderItem={(item: {course: Course, semester: string}) => <div><strong>{item.course.name}</strong><p className="text-xs text-text-dim">{item.semester}</p></div>} />}
                    {searchResults.files.length > 0 && <ResultSection title="Files" items={searchResults.files} renderItem={(item: StoredFile) => <div onClick={async () => setViewingFile(await getFile(item.id))} className="cursor-pointer"><strong>{item.name}</strong></div>} />}
                    
                    {searchResults.notes.length === 0 && searchResults.tasks.length === 0 && searchResults.projects.length === 0 && searchResults.courses.length === 0 && searchResults.files.length === 0 && (
                        <p className="text-center text-text-dim p-4">No results found for "{searchTerm}".</p>
                    )}
                </div>
            )}
        </>
    );
};

export default GlobalSearch;
