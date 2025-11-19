
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Semester, Course, StoredFile, Assignment } from '../../types';
import { getFile, addFile } from '../../utils/db';
import Card from '../ui/Card';
import DropZone from '../ui/DropZone';


const downloadJSON = (obj: any, name = 'export.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

const SemesterEditModal: React.FC<{ semester: Semester, onSave: (data: Partial<Semester>) => void, onClose: () => void }> = ({ semester, onSave, onClose }) => {
    const [department, setDepartment] = useState(semester.department || '');
    const [year, setYear] = useState(semester.year || '');

    const handleSave = () => {
        onSave({ department, year });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--grad-1)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10">
                    <h4 className="font-semibold text-lg">Edit Semester: {semester.name}</h4>
                </header>
                <main className="p-4 space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-400">Department (optional)</label>
                        <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g., Computer Science" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400">Academic Year (optional)</label>
                        <Input value={year} onChange={e => setYear(e.target.value)} placeholder="e.g., 2024-2025" />
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
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
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--grad-1)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10">
                    <h4 className="font-semibold text-lg">Add New Course</h4>
                </header>
                <main className="p-4 space-y-3">
                    <div>
                         <label className="text-xs text-gray-400 mb-1 block">Course Name</label>
                         <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Calculus I" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">Credits</label>
                            <Input type="number" value={credits} onChange={e => setCredits(Number(e.target.value))} placeholder="Credits" />
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">Current Grade</label>
                            <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="Grade (opt)" />
                         </div>
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Add Course</Button>
                </footer>
            </div>
        </div>
    );
};

const CourseDetailPanel: React.FC<{
    course: Course;
    onUpdate: (updatedCourse: Course) => void;
}> = ({ course, onUpdate }) => {
    const { setViewingFile, setNotifications } = useAppContext();
    const [localCourse, setLocalCourse] = useState(course);
    const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'resources' | 'grades'>('overview');
    const [syllabusFileName, setSyllabusFileName] = useState<string | null>(null);
    const syllabusInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Use spread and defaults to safely handle potentially missing arrays in legacy data
        setLocalCourse({
            ...course,
            assignments: course.assignments || [],
            exams: course.exams || [],
            resources: course.resources || [],
            modules: course.modules || [],
            quizzes: course.quizzes || [],
            attendance: course.attendance || []
        });
        if (course.syllabusFileId) {
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
        if (file && file.type === 'application/pdf') {
            try {
                const fileId = await addFile(file);
                handleChange('syllabusFileId', fileId);
                setSyllabusFileName(file.name);
            } catch (error) {
                alert('Failed to upload syllabus.');
            }
        } else if (file) {
            alert('Please upload a PDF file for the syllabus.');
        }
    };
    
    const handleAssignmentSubmit = (assignmentId: number) => {
        // Immediate local update
        const updatedAssignments = (localCourse.assignments || []).map(a => 
            a.id === assignmentId ? { ...a, completed: true, grade: 'Pending' } : a
        );
        onUpdate({ ...localCourse, assignments: updatedAssignments });
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
            onUpdate({ ...localCourse, assignments: [...(localCourse.assignments || []), newAssignment] });
        }
    };

    const viewSyllabus = async () => {
        if (localCourse.syllabusFileId) {
            const fileData = await getFile(localCourse.syllabusFileId);
            if (fileData) setViewingFile(fileData);
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 pb-0">
                 <Input value={localCourse.name} onChange={e => handleChange('name', e.target.value)} className="text-2xl font-bold !p-1 !border-0 mb-2" />
                 <div className="flex gap-4 text-sm text-gray-400 mb-4">
                     <span>Credits: {localCourse.credits}</span>
                     <span>Grade: {localCourse.grade || 'N/A'}</span>
                 </div>
                 <div className="flex border-b border-white/10">
                    {['overview', 'assignments', 'resources', 'grades'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 text-sm font-semibold capitalize ${activeTab === tab ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                 </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <DropZone onDrop={handleSyllabusUpload}>
                                    <div className="min-h-[100px] flex flex-col items-center justify-center p-4 border border-dashed border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                                        {localCourse.syllabusFileId ? (
                                            <div className="text-center">
                                                <p className="font-semibold text-[var(--grad-1)]">{syllabusFileName || 'Syllabus.pdf'}</p>
                                                <Button onClick={viewSyllabus} className="mt-2 text-xs">View Syllabus</Button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <p className="text-sm">Drag & drop PDF</p>
                                                <Button variant="glass" onClick={() => syllabusInputRef.current?.click()} className="mt-2 text-xs">Upload</Button>
                                                <input type="file" ref={syllabusInputRef} onChange={(e) => handleSyllabusUpload(e.target.files)} accept=".pdf" className="hidden" />
                                            </div>
                                        )}
                                    </div>
                                </DropZone>
                            </Card>
                        </div>
                        <Card title="Quick Notes">
                             <textarea 
                                value={localCourse.notes || ''} 
                                onChange={e => handleChange('notes', e.target.value)}
                                className="glass-textarea w-full h-32"
                                placeholder="Jot down course-specific notes here..."
                            />
                        </Card>
                    </div>
                )}
                
                {activeTab === 'assignments' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold">Assignments</h4>
                            <Button onClick={addAssignment} className="text-xs">+ Add Assignment</Button>
                        </div>
                        {(localCourse.assignments || []).length === 0 ? <p className="text-gray-500 italic">No assignments yet.</p> : 
                            (localCourse.assignments || []).map(assign => (
                                <div key={assign.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <p className="font-semibold">{assign.title}</p>
                                        <p className="text-xs text-gray-400">Due: {assign.dueDate} • Status: <span className={assign.completed ? "text-green-400" : "text-yellow-400"}>{assign.completed ? "Submitted" : "Pending"}</span></p>
                                    </div>
                                    <div>
                                        {assign.completed ? (
                                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Done</span>
                                        ) : (
                                            <Button onClick={() => handleAssignmentSubmit(assign.id)} className="text-xs">Mark Done</Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}

                {activeTab === 'resources' && (
                     <div className="text-center p-8 text-gray-500">
                         <p>Course specific resources (PDFs, Lecture slides) can be managed here.</p>
                         <Button variant="glass" className="mt-4">Upload Resource</Button>
                     </div>
                )}

                {activeTab === 'grades' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-lg">
                             <span>Current Grade</span>
                             <span className="text-2xl font-bold text-[var(--grad-1)]">{localCourse.grade || '-'}</span>
                        </div>
                        <p className="text-sm text-gray-400">Grade breakdown available in analytics.</p>
                    </div>
                )}
            </div>
            
             <div className="p-4 border-t border-white/10 flex justify-end gap-2">
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
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
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
        // Safe check for course existence in case of data corruption
        const course = semester?.courses?.[courseIndex];
        return { selectedCourse: course, selectedSemIndex: semIndex, selectedCourseIndex: courseIndex };
    }, [selectedCourseKey, semesters]);

    const addSemester = () => {
        const name = prompt("Enter new semester name (e.g., Fall 2024):");
        if (name && !semesters.some(s => s.name === name)) {
            setSemesters(prev => [...prev, { name, courses: [] }]);
        }
    };

    const handleSaveNewCourse = (course: Course) => {
        if (addingCourseSemIndex !== null) {
            setSemesters(prev => prev.map((s, si) => si === addingCourseSemIndex ? { ...s, courses: [...(s.courses || []), course] } : s));
            setAddingCourseSemIndex(null);
        }
    };

    const handleUpdateSemester = (semName: string, data: Partial<Semester>) => {
        setSemesters(prev => prev.map(s => s.name === semName ? {...s, ...data} : s));
    };

    return (
        <div ref={containerRef} className={`bg-transparent rounded-xl ${isFullScreen ? 'h-screen w-screen overflow-y-auto p-4' : 'h-full'}`}>
            {editingSemester && (
                <SemesterEditModal 
                    semester={editingSemester} 
                    onClose={() => setEditingSemester(null)}
                    onSave={(data) => handleUpdateSemester(editingSemester.name, data)}
                />
            )}
            {addingCourseSemIndex !== null && (
                <CourseAddModal 
                    onSave={handleSaveNewCourse}
                    onClose={() => setAddingCourseSemIndex(null)}
                />
            )}

            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <div className="flex gap-2">
                    <Button variant="glass" onClick={addSemester}>+ New Semester</Button>
                    <Button variant="glass" onClick={() => downloadJSON(semesters, 'academics.json')}>Export</Button>
                    <Button variant="glass" onClick={toggleFullScreen}>{isFullScreen ? 'Exit Full-Screen' : 'Full-Screen'}</Button>
                </div>
            </div>
            
            <div className={`flex ${isFullScreen ? 'h-[calc(100vh-6rem)]' : 'h-[calc(100%-6rem)]'}`}>
                <div className="w-1/3 border-r border-[var(--border-color)] p-2 overflow-y-auto">
                    {semesters.map((semester, semIndex) => (
                        <div key={semester.name} className="mb-4">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="font-semibold text-lg">{semester.name}</h4>
                                <Button variant="glass" className="text-xs !p-1" onClick={() => setEditingSemester(semester)}>Edit</Button>
                            </div>
                            <div className="space-y-1 mt-1">
                                {(semester.courses || []).map((course, courseIndex) => (
                                    <button 
                                        key={`${course.name}-${courseIndex}`} 
                                        onClick={() => handleSelectCourse(semIndex, courseIndex)}
                                        className={`w-full text-left p-2 rounded text-sm ${selectedCourseKey === `${semIndex}-${courseIndex}` ? 'bg-[var(--grad-1)]/20' : 'hover:bg-white/5'}`}
                                    >
                                        {course.name}
                                    </button>
                                ))}
                                <Button variant="glass" className="w-full text-xs" onClick={() => setAddingCourseSemIndex(semIndex)}>+ Add Course</Button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="w-2/3">
                    {selectedCourse ? (
                        <CourseDetailPanel 
                            course={selectedCourse}
                            onUpdate={(updated) => handleUpdateCourse(selectedSemIndex, selectedCourseIndex, updated)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a course to view its details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default AcademicsManager;
