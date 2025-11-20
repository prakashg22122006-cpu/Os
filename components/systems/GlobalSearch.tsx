
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Course, StoredFile } from '../../types';
import { getFiles, getFile } from '../../utils/db';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const GlobalSearch: React.FC = () => {
    const {
        notes, tasks, semesters,
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
        
        const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

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
        
        const foundCourses: {course: Course, semester: string}[] = [];
        semesters.forEach(s => {
            s.courses.forEach(c => {
                if (c.name.toLowerCase().includes(term) || (c.code || '').toLowerCase().includes(term) || (c.notes || '').toLowerCase().includes(term)) {
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
            courses: foundCourses,
            files: foundFiles,
        };
    }, [searchTerm, notes, tasks, semesters, files]);

    const handleViewFile = async (id: number) => {
        const fileData = await getFile(id);
        if (fileData) setViewingFile(fileData);
    };

    return (
        <div>
            <CardHeader title="Global Search & Tags" subtitle="Find anything across your OS" />
            <Input 
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search notes, tasks, files, courses..."
                className="w-full text-base p-3"
            />
            {searchTerm.trim().length === 0 && (
                 <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2 text-gray-300">Unified Tag System</h4>
                    <div className="flex flex-wrap gap-2">
                        {allTags.length > 0 ? allTags.map(tag => (
                            <button key={tag} onClick={() => setSearchTerm(t => t.toLowerCase().includes(tag.toLowerCase()) ? t : `${t} #${tag}`.trim())} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full hover:bg-blue-500/40">
                                #{tag}
                            </button>
                        )) : <p className="text-sm text-gray-500">No tags found. Add tags to notes, tasks, and files to see them here.</p>}
                    </div>
                </div>
            )}
            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                {searchResults?.notes.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-300">Notes ({searchResults.notes.length})</h4>
                        {searchResults.notes.map(item => (
                            <div key={item.id} className="p-2 bg-black/20 rounded mt-1 text-sm">
                                <p className="font-bold">{item.title}</p>
                            </div>
                        ))}
                    </div>
                )}
                 {searchResults?.tasks.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-300">Tasks ({searchResults.tasks.length})</h4>
                        {searchResults.tasks.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-black/20 rounded mt-1 text-sm">
                                <p className="font-bold">{item.title}</p>
                                <Button variant="outline" className="text-xs !p-1" onClick={() => setViewingTask(item)}>View</Button>
                            </div>
                        ))}
                    </div>
                )}
                 {searchResults?.files.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-300">Files ({searchResults.files.length})</h4>
                        {searchResults.files.map(item => (
                             <div key={item.id} className="flex justify-between items-center p-2 bg-black/20 rounded mt-1 text-sm">
                                <p className="font-bold">{item.name}</p>
                                <Button variant="outline" className="text-xs !p-1" onClick={() => handleViewFile(item.id)}>View</Button>
                            </div>
                        ))}
                    </div>
                )}
                 {searchResults?.courses.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-300">Courses ({searchResults.courses.length})</h4>
                        {searchResults.courses.map(item => (
                            <div key={item.course.name + item.semester} className="p-2 bg-black/20 rounded mt-1 text-sm">
                                <p className="font-bold">{item.course.name} <span className="text-xs text-gray-400">({item.semester})</span></p>
                            </div>
                        ))}
                    </div>
                )}
                 {searchResults && Object.values(searchResults).every((arr: any[]) => arr.length === 0) && (
                    <p className="text-center text-gray-400 p-8">No results found for "{searchTerm}".</p>
                )}
            </div>
        </div>
    );
}

export default GlobalSearch;
