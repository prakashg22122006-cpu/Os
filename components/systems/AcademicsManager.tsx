
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Semester, Course, Assignment, StoredFile } from '../../types';
import { getFile, addFile } from '../../utils/db';
import Card from '../ui/Card';
import DropZone from '../ui/DropZone';
import { useMobile } from '../../hooks/useMobile';

const downloadJSON = (obj: any, name = 'export.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

// --- Attachment Component ---
const AttachmentItem: React.FC<{ fileId: number, onRemove: () => void }> = ({ fileId, onRemove }) => {
    const { setViewingFile } = useAppContext();
    const [file, setFile] = useState<StoredFile | null>(null);
    
    useEffect(() => {
        getFile(fileId).then(f => { if (f) setFile(f); });
    }, [fileId]);

    if (!file) return <div className="animate-pulse h-10 bg-white/5 rounded mb-2"></div>;

    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 cursor-pointer overflow-hidden flex-grow" onClick={() => setViewingFile(file as any)}>
                <div className="w-8 h-8 rounded bg-black/20 flex items-center justify-center text-lg">
                    {file.type.includes('image') ? '🖼️' : file.type.includes('pdf') ? '📄' : '📁'}
                </div>
                <div className="flex flex-col min-w-0">
                     <span className="truncate text-sm font-medium text-gray-200">{file.name}</span>
                     <span className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB • {new Date(file.ts).toLocaleDateString()}</span>
                </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-full transition-all opacity-0 group-hover:opacity-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
};

// --- Modals ---

const SemesterModal: React.FC<{ 
    semester?: Semester; 
    onSave: (data: Semester) => void; 
    onClose: () => void 
}> = ({ semester, onSave, onClose }) => {
    const [name, setName] = useState(semester?.name || '');
    const [department, setDepartment] = useState(semester?.department || '');
    const [year, setYear] = useState(semester?.year || '');

    const handleSave = () => {
        if (!name.trim()) return alert("Semester name is required");
        onSave({ 
            name, 
            department, 
            year, 
            courses: semester?.courses || [] 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--grad-1)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-zoomIn" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h4 className="font-semibold text-lg text-white">{semester ? 'Edit Semester' : 'New Semester'}</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Semester Name</label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Fall 2024" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Department (Optional)</label>
                        <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g., Computer Science" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Academic Year (Optional)</label>
                        <Input value={year} onChange={e => setYear(e.target.value)} placeholder="e.g., 2024-2025" />
                    </div>
                </main>
                <footer className="p-4 flex gap-2 justify-end border-t border-white/10 bg-white/5">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>{semester ? 'Save Changes' : 'Create Semester'}</Button>
                </footer>
            </div>
        </div>
    );
};

const CourseAddModal: React.FC<{ onSave: (course: Course) => void, onClose: () => void }> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [credits, setCredits] = useState<number>(3);
    const [grade, setGrade] = useState('');

    const handleSave = () => {
        if (!name.trim()) return alert('Course name is required');
        const newCourse: Course = {
            name,
            credits,
            grade,
            attendance: [],
            assignments: [],
            exams: [],
            resources: [],
            modules: [],
            quizzes: []
        };
        onSave(newCourse);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--grad-1)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-zoomIn" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h4 className="font-semibold text-lg">Add New Course</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                         <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Course Name</label>
                         <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Calculus I" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Credits</label>
                            <Input type="number" value={credits} onChange={e => setCredits(Number(e.target.value))} placeholder="Credits" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Current Grade</label>
                            <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="Grade (opt)" />
                         </div>
                    </div>
                </main>
                <footer className="p-4 flex gap-2 justify-end border-t border-white/10 bg-white/5">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Add Course</Button>
                </footer>
            </div>
        </div>
    );
};

// --- Main Detail Panel ---

const CourseDetailPanel: React.FC<{
    course: Course;
    onUpdate: (updatedCourse: Course) => void;
    onBack?: () => void; // Added for mobile
}> = ({ course, onUpdate, onBack }) => {
    const { setViewingFile, setNotifications } = useAppContext();
    const [localCourse, setLocalCourse] = useState<Course>(course);
    const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'resources' | 'grades'>('overview');
    const [syllabusFileName, setSyllabusFileName] = useState<string | null>(null);
    const syllabusInputRef = useRef<HTMLInputElement>(null);
    const resourceInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalCourse({
            ...course,
            assignments: course?.assignments || [],
            exams: course?.exams || [],
            resources: course?.resources || [],
            modules: course?.modules || [],
            quizzes: course?.quizzes || [],
            attendance: course?.attendance || [],
            attachments: course?.attachments || []
        });
        if (course?.syllabusFileId) {
            getFile(course.syllabusFileId).then(fileData => {
                if (fileData) setSyllabusFileName(fileData.name);
            })
        } else {
            setSyllabusFileName(null);
        }
    }, [course]);

    const handleChange = (field: keyof Course, value: any) => {
        setLocalCourse(prev => ({ ...prev, [field]: value }));
    };

    const handleSyllabusUpload = async (files: FileList | null) => {
        const file = files?.[0];
        if (file) {
            try {
                const fileId = await addFile(file);
                const updatedCourse = { ...localCourse, syllabusFileId: fileId };
                setLocalCourse(updatedCourse);
                setSyllabusFileName(file.name);
                onUpdate(updatedCourse); // Auto-save
            } catch (error) {
                alert('Failed to upload syllabus.');
            }
        }
    };
    
    const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
        const files = 'target' in e ? e.target.files : e;
        if (!files || files.length === 0) return;
        
        try {
            const newIds: number[] = [];
            // Manually iterate over FileList to ensure correct type
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file) {
                    const id = await addFile(file);
                    newIds.push(id);
                }
            }
            const updatedAttachments = [...(localCourse.attachments || []), ...newIds];
            const updatedCourse = { ...localCourse, attachments: updatedAttachments };
            setLocalCourse(updatedCourse);
            onUpdate(updatedCourse);
            if ('target' in e && resourceInputRef.current) resourceInputRef.current.value = '';
        } catch (error) {
            alert('Failed to upload file(s).');
        }
    };

    const handleRemoveAttachment = (fileId: number) => {
        if(window.confirm("Remove this file from the course?")) {
            const updatedAttachments = (localCourse.attachments || []).filter(id => id !== fileId);
            const updatedCourse = { ...localCourse, attachments: updatedAttachments };
            setLocalCourse(updatedCourse);
            onUpdate(updatedCourse);
        }
    };

    const handleAssignmentSubmit = (assignmentId: number) => {
        const updatedAssignments = (localCourse.assignments || []).map(a => 
            a.id === assignmentId ? { ...a, completed: true, grade: 'Pending' } : a
        );
        const updatedCourse = { ...localCourse, assignments: updatedAssignments };
        setLocalCourse(updatedCourse);
        onUpdate(updatedCourse);
        
        setNotifications(prev => [...prev, {
            id: Date.now().toString(),
            type: 'success',
            title: 'Assignment Completed',
            message: 'Marked as done.',
            timestamp: Date.now(),
            read: false
        }]);
    };
    
    const addAssignment = () => {
        const title = prompt("Assignment Title:");
        if(title) {
            const newAssignment: Assignment = {
                id: Date.now(),
                title,
                dueDate: new Date().toISOString().split('T')[0],
                completed: false
            };
            const updatedAssignments = [...(localCourse.assignments || []), newAssignment];
            const updatedCourse = { ...localCourse, assignments: updatedAssignments };
            setLocalCourse(updatedCourse);
            onUpdate(updatedCourse);
        }
    };

    const viewSyllabus = async () => {
        if (localCourse.syllabusFileId) {
            const fileData = await getFile(localCourse.syllabusFileId);
            if (fileData) setViewingFile(fileData);
        }
    };
    
    if (!localCourse) return <div className="p-4 text-gray-400">Loading course details...</div>;

    return (
        <div className="h-full flex flex-col bg-[var(--bg-offset)]">
            {onBack && (
                <div className="p-2 border-b border-white/10 md:hidden">
                    <Button variant="glass" onClick={onBack} className="text-xs flex items-center gap-1">
                        ← Back to Courses
                    </Button>
                </div>
            )}
            <div className="p-4 pb-0 flex-shrink-0">
                 <Input value={localCourse.name} onChange={e => handleChange('name', e.target.value)} className="text-xl md:text-2xl font-bold !p-1 !border-0 mb-2 bg-transparent" />
                 <div className="flex gap-4 text-sm text-gray-400 mb-4">
                     <span>Credits: {localCourse.credits}</span>
                     <span>Grade: {localCourse.grade || 'N/A'}</span>
                 </div>
                 <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
                    {['overview', 'assignments', 'resources', 'grades'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 text-sm font-semibold capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                 </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                             <Card title="Course Info">
                                 <div className="space-y-2 p-2">
                                     <Input value={localCourse.instructor || ''} onChange={e => handleChange('instructor', e.target.value)} placeholder="Instructor Name" />
                                     <Input value={localCourse.room || ''} onChange={e => handleChange('room', e.target.value)} placeholder="Room / Location" />
                                     <Input value={localCourse.schedule || ''} onChange={e => handleChange('schedule', e.target.value)} placeholder="Schedule (e.g. Mon 9am)" />
                                     <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                         <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Credits</label>
                                            <Input type="number" value={localCourse.credits} onChange={e => handleChange('credits', parseFloat(e.target.value))} placeholder="Credits" />
                                         </div>
                                         <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Grade</label>
                                            <Input value={localCourse.grade} onChange={e => handleChange('grade', e.target.value)} placeholder="Grade" />
                                         </div>
                                     </div>
                                 </div>
                             </Card>
                             <Card title="Syllabus">
                                <DropZone onDrop={handleSyllabusUpload} className="h-full">
                                    <div className="h-full min-h-[100px] flex flex-col items-center justify-center p-4 border border-dashed border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                                        {localCourse.syllabusFileId ? (
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">📄</div>
                                                <p className="font-semibold text-[var(--grad-1)] mb-2 truncate max-w-[150px] mx-auto">{syllabusFileName || 'Syllabus'}</p>
                                                <div className="flex gap-2 justify-center">
                                                    <Button onClick={viewSyllabus} className="text-xs">View</Button>
                                                    <Button variant="glass" onClick={() => syllabusInputRef.current?.click()} className="text-xs">Change</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <p className="text-sm mb-2">Drag & drop Syllabus</p>
                                                <Button variant="glass" onClick={() => syllabusInputRef.current?.click()} className="text-xs">Upload PDF</Button>
                                            </div>
                                        )}
                                        <input type="file" ref={syllabusInputRef} onChange={(e) => handleSyllabusUpload(e.target.files)} accept=".pdf, image/*" className="hidden" />
                                    </div>
                                </DropZone>
                            </Card>
                        </div>
                        <Card title="Quick Notes">
                             <textarea 
                                value={localCourse.notes || ''} 
                                onChange={e => handleChange('notes', e.target.value)}
                                className="glass-textarea w-full h-32 resize-none"
                                placeholder="Jot down course-specific notes here..."
                            />
                        </Card>
                    </div>
                )}
                
                {activeTab === 'assignments' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-300">Assignments</h4>
                            <Button onClick={addAssignment} className="text-xs">+ Add Assignment</Button>
                        </div>
                        {(localCourse.assignments || []).length === 0 ? (
                            <div className="text-center p-8 bg-white/5 rounded-lg border border-dashed border-white/10">
                                <p className="text-gray-500 italic">No assignments yet.</p>
                            </div>
                        ) : (
                            (localCourse.assignments || []).map(assign => (
                                <div key={assign.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <div>
                                        <p className="font-semibold text-sm">{assign.title}</p>
                                        <p className="text-xs text-gray-400">Due: {assign.dueDate} • Status: <span className={assign.completed ? "text-green-400" : "text-yellow-400"}>{assign.completed ? "Submitted" : "Pending"}</span></p>
                                    </div>
                                    <div>
                                        {assign.completed ? (
                                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">Done</span>
                                        ) : (
                                            <Button onClick={() => handleAssignmentSubmit(assign.id)} variant="glass" className="text-xs">Mark Done</Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'resources' && (
                     <div className="h-full flex flex-col">
                         <div className="flex justify-between items-center mb-4">
                             <div>
                                 <h4 className="font-bold text-gray-300">Course Materials</h4>
                                 <p className="text-xs text-gray-500">Readings, slides, and other files.</p>
                             </div>
                             <div className="flex gap-2">
                                 <Button onClick={() => resourceInputRef.current?.click()} className="text-xs flex items-center gap-1">
                                     <span>+</span> Upload
                                 </Button>
                                 <input type="file" ref={resourceInputRef} multiple className="hidden" onChange={handleResourceUpload} />
                             </div>
                         </div>
                         
                         <DropZone onDrop={handleResourceUpload} className="flex-grow">
                             {(localCourse.attachments || []).length === 0 ? (
                                 <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-lg border-2 border-dashed border-white/10 text-gray-400">
                                     <div className="text-4xl mb-2 opacity-50">📂</div>
                                     <p className="text-sm font-medium">No files attached</p>
                                     <p className="text-xs mt-1 opacity-70">Drag & drop files here or click Upload</p>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-1 gap-2">
                                     {(localCourse.attachments || []).map(fileId => (
                                         <AttachmentItem 
                                             key={fileId} 
                                             fileId={fileId} 
                                             onRemove={() => handleRemoveAttachment(fileId)} 
                                         />
                                     ))}
                                 </div>
                             )}
                         </DropZone>
                     </div>
                )}

                {activeTab === 'grades' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-lg border border-white/5">
                             <span>Current Grade</span>
                             <span className="text-2xl font-bold text-[var(--grad-1)]">{localCourse.grade || '-'}</span>
                        </div>
                        <p className="text-sm text-gray-400">Grade breakdown available in analytics.</p>
                    </div>
                )}
            </div>
            
             <div className="p-4 border-t border-white/10 flex justify-end gap-2 flex-shrink-0">
                <Button variant="glass" onClick={() => setLocalCourse(course)}>Reset</Button>
                <Button onClick={() => onUpdate(localCourse)}>Save Changes</Button>
            </div>
        </div>
    );
};


// Main component
const AcademicsManager: React.FC = () => {
    const { semesters, setSemesters } = useAppContext();
    const [selectedCourseKey, setSelectedCourseKey] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMobile = useMobile();
    
    // Modal States
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null); // If null but showSemesterModal is true, it's Add mode
    const [addingCourseSemIndex, setAddingCourseSemIndex] = useState<number | null>(null);

    const handleSelectCourse = (semIndex: number, courseIndex: number) => {
        setSelectedCourseKey(`${semIndex}-${courseIndex}`);
    };

    const handleUpdateCourse = (semIndex: number, courseIndex: number, updatedCourse: Course) => {
        setSemesters(prev => prev.map((s, si) =>
            si === semIndex
                ? { ...s, courses: (s.courses || []).map((c, ci) => ci === courseIndex ? updatedCourse : c) }
                : s
        ));
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    useEffect(() => {
        const handler = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const { selectedCourse, selectedSemIndex, selectedCourseIndex } = useMemo(() => {
        if (!selectedCourseKey) return { selectedCourse: null, selectedSemIndex: -1, selectedCourseIndex: -1 };
        const [semIndex, courseIndex] = selectedCourseKey.split('-').map(Number);
        const semester = semesters[semIndex];
        const course = semester?.courses?.[courseIndex];
        return { selectedCourse: course, selectedSemIndex: semIndex, selectedCourseIndex: courseIndex };
    }, [selectedCourseKey, semesters]);

    const handleOpenAddSemester = () => {
        setEditingSemester(null);
        setShowSemesterModal(true);
    };

    const handleOpenEditSemester = (semester: Semester) => {
        setEditingSemester(semester);
        setShowSemesterModal(true);
    };

    const handleSaveSemester = (semesterData: Semester) => {
        if (editingSemester) {
            // Edit Mode
            setSemesters(prev => prev.map(s => s.name === editingSemester.name ? { ...s, ...semesterData } : s));
        } else {
            // Add Mode
            if (semesters.some(s => s.name === semesterData.name)) {
                alert("A semester with this name already exists.");
                return;
            }
            setSemesters(prev => [...prev, semesterData]);
        }
        setShowSemesterModal(false);
        setEditingSemester(null);
    };

    const handleSaveNewCourse = (course: Course) => {
        if (addingCourseSemIndex !== null) {
            setSemesters(prev => prev.map((s, si) => si === addingCourseSemIndex ? { ...s, courses: [...(s.courses || []), course] } : s));
            setAddingCourseSemIndex(null);
        }
    };

    const handleDeleteSemester = (semName: string) => {
        if(window.confirm(`Delete ${semName} and all its courses?`)) {
             setSemesters(prev => prev.filter(s => s.name !== semName));
             if(selectedCourseKey?.startsWith(`${semesters.findIndex(s => s.name === semName)}-`)) {
                 setSelectedCourseKey(null);
             }
        }
    };

    // Mobile view logic: If a course is selected, hide the list on mobile.
    const showList = !isMobile || !selectedCourse;
    const showDetail = selectedCourse;

    return (
        <div ref={containerRef} className={`flex flex-col bg-transparent rounded-xl ${isFullScreen ? 'fixed inset-0 z-50 bg-[var(--bg)] p-4' : 'h-full'}`}>
            {showSemesterModal && (
                <SemesterModal 
                    semester={editingSemester || undefined}
                    onClose={() => setShowSemesterModal(false)}
                    onSave={handleSaveSemester}
                />
            )}
            {addingCourseSemIndex !== null && (
                <CourseAddModal 
                    onSave={handleSaveNewCourse}
                    onClose={() => setAddingCourseSemIndex(null)}
                />
            )}

            {showList && (
                <div className="flex-shrink-0 flex justify-between items-center mb-4 px-4 pt-4">
                    <h2 className="text-xl font-bold hidden md:block">Academics Manager</h2>
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        <Button variant="glass" onClick={handleOpenAddSemester} className="text-xs md:text-sm flex-1 md:flex-none">+ New Semester</Button>
                        <Button variant="glass" onClick={() => downloadJSON(semesters, 'academics.json')} className="text-xs md:text-sm hidden sm:block">Export</Button>
                        <Button variant="glass" onClick={toggleFullScreen} className="text-xs md:text-sm">{isFullScreen ? 'Exit Full' : 'Full Screen'}</Button>
                    </div>
                </div>
            )}
            
            {semesters.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center p-8 opacity-60">
                     <svg className="w-20 h-20 mb-4 text-[var(--grad-1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                     <h3 className="text-2xl font-bold mb-2">Start your academic journey</h3>
                     <p className="mb-6 max-w-md">Create a semester to begin tracking your courses, grades, and assignments.</p>
                     <Button onClick={handleOpenAddSemester} className="px-8 py-3 text-lg">Create First Semester</Button>
                 </div>
            ) : (
                <div className="flex-grow flex overflow-hidden relative">
                    {/* Sidebar List */}
                    <div className={`${showList ? 'flex' : 'hidden'} w-full md:w-1/3 flex-col flex-shrink-0 md:border-r border-[var(--border-color)] p-2 overflow-y-auto custom-scrollbar bg-[var(--bg)] md:bg-transparent z-10`}>
                        {semesters.map((semester, semIndex) => (
                            <div key={semester.name} className="mb-4 bg-white/5 rounded-lg overflow-hidden border border-white/5">
                                <div className="flex justify-between items-center p-3 bg-white/5 cursor-default">
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-sm md:text-base truncate">{semester.name}</h4>
                                        {(semester.department || semester.year) && (
                                            <p className="text-[10px] text-gray-400 truncate">{semester.department} {semester.year}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => handleOpenEditSemester(semester)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors" title="Edit Semester">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDeleteSemester(semester.name)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors" title="Delete Semester">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    {(semester.courses || []).length === 0 && <p className="text-xs text-gray-500 text-center py-2">No courses.</p>}
                                    {(semester.courses || []).map((course, courseIndex) => (
                                        <button 
                                            key={`${course.name}-${courseIndex}`} 
                                            onClick={() => handleSelectCourse(semIndex, courseIndex)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex justify-between items-center ${selectedCourseKey === `${semIndex}-${courseIndex}` ? 'bg-[var(--grad-1)] text-white font-medium shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                        >
                                            <span className="truncate">{course.name}</span>
                                            {course.grade && <span className="text-[10px] bg-black/20 px-1.5 rounded ml-2">{course.grade}</span>}
                                        </button>
                                    ))}
                                    <Button variant="glass" className="w-full text-xs mt-2 border-dashed border-white/10" onClick={() => setAddingCourseSemIndex(semIndex)}>+ Add Course</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Detail Panel */}
                    <div className={`${showDetail ? 'flex' : 'hidden md:flex'} flex-col flex-grow w-full md:w-2/3 min-w-0 bg-black/10 border-l border-white/5 absolute md:relative inset-0 z-20 md:z-auto`}>
                        {selectedCourse ? (
                            <CourseDetailPanel 
                                key={selectedCourseKey} // Force re-render on course switch to reset state
                                course={selectedCourse}
                                onUpdate={(updated) => handleUpdateCourse(selectedSemIndex, selectedCourseIndex, updated)}
                                onBack={() => setSelectedCourseKey(null)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                                <p className="mb-2 text-lg">Select a course to view details</p>
                                <p className="text-xs max-w-xs">Manage assignments, view syllabus, upload resources, and track grades for your selected course.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default AcademicsManager;
