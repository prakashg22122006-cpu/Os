
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Semester, Course, StoredFile, AttendanceRecord, Assignment, Exam, Resource, Module, Quiz } from '../../types';
import { addFile, getFile, getFiles } from '../../utils/db';
import Card from '../ui/Card';


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

const SemesterEditModal: React.FC<{ semester: Semester, onSave: (data: Partial<Semester>) => void, onClose: () => void }> = ({ semester, onSave, onClose }) => {
    const [department, setDepartment] = useState(semester.department || '');
    const [year, setYear] = useState(semester.year || '');

    const handleSave = () => {
        onSave({ department, year });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--accent-color)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </footer>
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

    const handleSelectCourse = (semIndex: number, courseIndex: number) => {
        setSelectedCourseKey(`${semIndex}-${courseIndex}`);
    };

    const handleUpdateCourse = (semIndex: number, courseIndex: number, updatedCourse: Course) => {
        setSemesters(prev => prev.map((s, si) =>
            si === semIndex
                ? { ...s, courses: s.courses.map((c, ci) => ci === courseIndex ? updatedCourse : c) }
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

    const selectedCourseIndices = useMemo(() => {
        if (!selectedCourseKey) return null;
        const [semIndex, courseIndex] = selectedCourseKey.split('-').map(Number);
        return { semIndex, courseIndex };
    }, [selectedCourseKey]);

    const selectedCourseData = useMemo(() => {
        if (!selectedCourseIndices) return null;
        const { semIndex, courseIndex } = selectedCourseIndices;
        return semesters[semIndex]?.courses[courseIndex] || null;
    }, [selectedCourseIndices, semesters]);

    return (
      <div ref={containerRef} className={`bg-gradient-to-b from-[rgba(255,255,255,0.01)] to-[rgba(255,255,255,0.02)] p-4 rounded-xl ${isFullScreen ? 'h-screen w-screen overflow-y-auto' : ''}`}>
            {selectedCourseData && selectedCourseIndices ? (
                <CourseDetailView
                    course={selectedCourseData}
                    semIndex={selectedCourseIndices.semIndex}
                    courseIndex={selectedCourseIndices.courseIndex}
                    onUpdateCourse={handleUpdateCourse}
                    onBack={() => setSelectedCourseKey(null)}
                    isFullScreen={isFullScreen}
                    toggleFullScreen={toggleFullScreen}
                />
            ) : (
                <SemesterListView onSelectCourse={handleSelectCourse} isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
            )}
      </div>
    );
};


// List view of all semesters and courses
const SemesterListView: React.FC<{ onSelectCourse: (s: number, c: number) => void; isFullScreen: boolean; toggleFullScreen: () => void; }> = ({ onSelectCourse, isFullScreen, toggleFullScreen }) => {
    const { semesters, setSemesters } = useAppContext();
    const [newSemName, setNewSemName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const importFileRef = useRef<HTMLInputElement>(null);
    const [editingSemesterIndex, setEditingSemesterIndex] = useState<number | null>(null);

    const filteredSemesters = useMemo(() => {
        if (!searchTerm.trim()) return semesters;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return semesters
            .map(semester => ({
                ...semester,
                courses: semester.courses.filter(course =>
                    course.name.toLowerCase().includes(lowerCaseSearch) ||
                    course.code?.toLowerCase().includes(lowerCaseSearch)
                )
            }))
            .filter(semester => semester.courses.length > 0);
    }, [semesters, searchTerm]);


    const addSemester = () => {
        if (!newSemName.trim()) return;
        setSemesters(prev => [{ name: newSemName, courses: [], department: '', year: '' }, ...prev]);
        setNewSemName('');
    };
    
    const addCourse = async (semIndex: number, courseData: Omit<Course, 'attachments' | 'syllabusFileId' | 'attendance' | 'assignments' | 'exams' | 'resources' | 'modules' | 'quizzes'>, syllabusFile: File | null) => {
        let syllabusFileId: number | undefined = undefined;
        if (syllabusFile) {
            try {
                syllabusFileId = await addFile(syllabusFile);
            } catch (e) {
                alert('Failed to save syllabus file.');
                console.error(e);
                return;
            }
        }
        
        const newCourse: Course = {
            ...courseData,
            credits: Number(courseData.credits) || 0,
            syllabusFileId,
            attachments: [],
            attendance: [],
            assignments: [],
            exams: [],
            resources: [],
            modules: [],
            quizzes: [],
        };
        
        setSemesters(prev => prev.map((s, i) => i === semIndex ? { ...s, courses: [...s.courses, newCourse] } : s));
    };

    const deleteSemester = (index: number) => {
        if (window.confirm('Delete semester? This will also delete all its courses.')) {
            setSemesters(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSaveSemester = (index: number, updatedData: Partial<Semester>) => {
        setSemesters(prev => prev.map((s, i) => i === index ? { ...s, ...updatedData } : s));
        setEditingSemesterIndex(null);
    };
    
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = JSON.parse(e.target?.result as string);
                if (Array.isArray(result)) {
                    setSemesters(result); alert('Imported semesters');
                } else { alert('Invalid JSON format'); }
            } catch (error) { alert('Invalid JSON file'); }
        };
        reader.readAsText(file);
    };

    return (
        <>
         <div className="flex justify-between items-center">
            <CardHeader title="Academics System" subtitle="Course & GPA Manager" />
            <Button variant="outline" onClick={toggleFullScreen}>{isFullScreen ? 'Exit Full-Screen' : 'Full-Screen'}</Button>
        </div>
        <div className="flex gap-2 mb-2">
            <Input value={newSemName} onChange={e => setNewSemName(e.target.value)} placeholder="Semester name (e.g., Fall 2025)" />
            <Button onClick={addSemester}>Add Semester</Button>
        </div>
        <div className="mb-4">
             <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search courses by name or code..." />
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {filteredSemesters.length === 0 ? <p className="text-[#9fb3cf]">No semesters found.</p> :
                filteredSemesters.map((sem, si) => (
                    <Card key={si} className="bg-black/20">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="m-0 font-semibold text-lg">{sem.name}</h4>
                            <div className="flex gap-2">
                                <Button variant="outline" className="text-xs !px-2 !py-1" onClick={() => setEditingSemesterIndex(si)}>Edit</Button>
                                <Button variant="outline" className="text-xs !px-2 !py-1" onClick={() => deleteSemester(si)}>Delete Sem</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                           {sem.courses.map((course, ci) => (
                               <div key={ci} className="flex justify-between items-center p-2 rounded-md bg-white/5 hover:bg-white/10" onClick={() => onSelectCourse(semesters.findIndex(s => s.name === sem.name), ci)}>
                                   <p className="cursor-pointer">{course.code && `[${course.code}]`} {course.name}</p>
                                   <Button variant="outline" className="text-xs">Manage</Button>
                               </div>
                           ))}
                           <AddCourseForm semIndex={semesters.findIndex(s => s.name === sem.name)} onAddCourse={addCourse} />
                        </div>
                    </Card>
                ))
            }
        </div>
        <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
            <Button variant="outline" onClick={() => downloadJSON(semesters, 'academics-export.json')}>Export All</Button>
            <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import All</Button>
            <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept="application/json" />
        </div>
        {editingSemesterIndex !== null && (
            <SemesterEditModal
                semester={semesters[editingSemesterIndex]}
                onSave={(data) => handleSaveSemester(editingSemesterIndex, data)}
                onClose={() => setEditingSemesterIndex(null)}
            />
        )}
        </>
    );
};

// Form to add a new course
const AddCourseForm: React.FC<{ semIndex: number; onAddCourse: (si: number, c: Omit<Course, 'attachments' | 'syllabusFileId' | 'attendance' | 'assignments' | 'exams' | 'resources' | 'modules' | 'quizzes'>, f: File | null) => void }> = ({ semIndex, onAddCourse }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [credits, setCredits] = useState('');
    const [instructor, setInstructor] = useState('');
    const [schedule, setSchedule] = useState('');
    const [room, setRoom] = useState('');
    const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (!name.trim()) return alert('Course name is required.');
        onAddCourse(semIndex, { name, code, credits: Number(credits) || 0, grade: '', status: 'active', instructor, schedule, room }, syllabusFile);
        setName(''); setCode(''); setCredits(''); setSyllabusFile(null); setInstructor(''); setSchedule(''); setRoom('');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <details className="mt-2">
            <summary className="cursor-pointer text-sm font-semibold p-2 bg-black/20 rounded-lg">Add New Course</summary>
            <div className="p-2 space-y-2 mt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Course name"/>
                    <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Course Code"/>
                    <Input value={credits} onChange={e => setCredits(e.target.value)} placeholder="Credits" type="number"/>
                    <Input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="Instructor"/>
                    <Input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="Schedule"/>
                    <Input value={room} onChange={e => setRoom(e.target.value)} placeholder="Room"/>
                </div>
                 <div className="text-sm">
                    <label>Syllabus (PDF): </label>
                    <input type="file" accept=".pdf" ref={fileInputRef} onChange={e => setSyllabusFile(e.target.files?.[0] || null)} className="text-xs"/>
                </div>
                <Button onClick={handleSubmit} className="text-sm">Add Course</Button>
            </div>
        </details>
    );
};

type CourseTab = 'Overview' | 'Modules' | 'Quizzes' | 'Attendance' | 'Assignments' | 'Exams' | 'Resources' | 'Files';

// Detailed view for a single course with tabs
const CourseDetailView: React.FC<{ course: Course; semIndex: number; courseIndex: number; onUpdateCourse: (s: number, c: number, u: Course) => void; onBack: () => void; isFullScreen: boolean; toggleFullScreen: () => void; }> = ({ course, semIndex, courseIndex, onUpdateCourse, onBack, isFullScreen, toggleFullScreen }) => {
    const [activeTab, setActiveTab] = useState<CourseTab>('Overview');
    
    const updateField = (field: keyof Course, value: any) => {
        onUpdateCourse(semIndex, courseIndex, { ...course, [field]: value });
    };

    const TABS: CourseTab[] = ['Overview', 'Modules', 'Quizzes', 'Attendance', 'Assignments', 'Exams', 'Resources', 'Files'];

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <Button variant="outline" onClick={onBack} className="mb-2">← Back to Semesters</Button>
                    <h2 className="text-2xl font-bold">{course.name}</h2>
                    <p className="text-gray-400">{course.code}</p>
                </div>
                <Button variant="outline" onClick={toggleFullScreen}>{isFullScreen ? 'Exit Full-Screen' : 'Full-Screen'}</Button>
            </div>
            <div className="flex border-b border-white/10 mb-4 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab ? 'text-[#5aa1ff] border-b-2 border-[#5aa1ff]' : 'text-gray-400 hover:text-white'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'Overview' && <OverviewTab course={course} updateField={updateField} />}
                {activeTab === 'Modules' && <ModulesTab course={course} updateField={updateField} />}
                {activeTab === 'Quizzes' && <QuizzesTab course={course} updateField={updateField} />}
                {activeTab === 'Attendance' && <AttendanceTab course={course} updateField={updateField} />}
                {activeTab === 'Assignments' && <AssignmentsTab course={course} updateField={updateField} />}
                {activeTab === 'Exams' && <ExamsTab course={course} updateField={updateField} />}
                {activeTab === 'Resources' && <ResourcesTab course={course} updateField={updateField} />}
                {activeTab === 'Files' && <FilesTab course={course} updateField={updateField} />}
            </div>
        </div>
    );
};


const OverviewTab: React.FC<{course: Course, updateField: (f: keyof Course, v: any) => void}> = ({course, updateField}) => {
    const [syllabusUrl, setSyllabusUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (course.syllabusFileId) {
            getFile(course.syllabusFileId).then(fileData => {
                if (fileData && fileData.data.type === 'application/pdf') {
                    objectUrl = URL.createObjectURL(fileData.data);
                    setSyllabusUrl(objectUrl);
                }
            });
        }
        return () => { if(objectUrl) URL.revokeObjectURL(objectUrl); }
    }, [course.syllabusFileId]);

    const attendanceStats = useMemo(() => {
        const total = course.attendance.length;
        if (total === 0) return { present: 0, total: 0, percentage: 100 };
        const present = course.attendance.filter(a => a.status === 'present').length;
        return { present, total, percentage: (present / total) * 100 };
    }, [course.attendance]);

    const handleSyllabusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            try {
                const fileId = await addFile(file);
                updateField('syllabusFileId', fileId);
            } catch (error) { alert("Failed to upload syllabus."); }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
                 <Card>
                    <h4 className="font-bold mb-2">Goals & Reflections</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Goal Grade</label>
                            <Input 
                                value={course.goalGrade || ''}
                                onChange={e => updateField('goalGrade', e.target.value)}
                                placeholder="e.g., A+"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Notes & Reflections</label>
                            <textarea
                                value={course.notes || ''}
                                onChange={e => updateField('notes', e.target.value)}
                                rows={5}
                                className="bg-transparent border border-[var(--input-border-color)] text-[var(--text-color-dim)] p-2 rounded-lg w-full box-border mt-1"
                                placeholder="What are your strategies for this course? What went well?"
                            />
                        </div>
                    </div>
                </Card>
                <Card>
                    <h4 className="font-bold mb-2">Syllabus</h4>
                    {syllabusUrl ? (
                         <embed src={syllabusUrl} type="application/pdf" className="w-full h-96 rounded" />
                    ) : (
                        <div className="text-center py-8">
                            <p className="mb-2">No syllabus uploaded.</p>
                            <input type="file" accept=".pdf" onChange={handleSyllabusUpload} className="text-sm" />
                        </div>
                    )}
                </Card>
            </div>
            <div className="space-y-4">
                <Card>
                    <h4 className="font-bold mb-2">Attendance</h4>
                    <div className="text-center">
                        <p className="text-4xl font-bold">{attendanceStats.percentage.toFixed(0)}%</p>
                        <p className="text-sm text-gray-400">({attendanceStats.present} / {attendanceStats.total} classes)</p>
                    </div>
                </Card>
                <Card>
                    <h4 className="font-bold mb-2">Course Details</h4>
                    <div className="space-y-3 text-sm">
                        <div>
                            <label className="font-semibold text-gray-400">Instructor</label>
                            <Input 
                                value={course.instructor || ''}
                                onChange={e => updateField('instructor', e.target.value)}
                                placeholder="e.g., Prof. Smith"
                                className="mt-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="font-semibold text-gray-400">Schedule</label>
                            <Input 
                                value={course.schedule || ''}
                                onChange={e => updateField('schedule', e.target.value)}
                                placeholder="e.g., MWF 10:00 - 11:00"
                                className="mt-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="font-semibold text-gray-400">Room</label>
                            <Input 
                                value={course.room || ''}
                                onChange={e => updateField('room', e.target.value)}
                                placeholder="e.g., Building A, Room 101"
                                className="mt-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="font-semibold text-gray-400">Credits</label>
                            <Input 
                                type="number"
                                value={course.credits || ''}
                                onChange={e => updateField('credits', Number(e.target.value))}
                                placeholder="e.g., 3"
                                className="mt-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="font-semibold text-gray-400">Status</label>
                            <select 
                                value={course.status || 'active'} 
                                onChange={e => updateField('status', e.target.value as 'active' | 'completed')}
                                className="bg-transparent border border-[var(--input-border-color)] text-[var(--text-color-dim)] p-2 rounded-lg w-full box-border mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                            >
                                <option value="active" className="bg-[var(--option-bg-color)]">Active</option>
                                <option value="completed" className="bg-[var(--option-bg-color)]">Completed</option>
                            </select>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const ModulesTab: React.FC<{course: Course, updateField: (f: 'modules', v: Module[]) => void}> = ({course, updateField}) => {
    const [title, setTitle] = useState('');

    const handleAdd = () => {
        if (!title.trim()) return;
        const newModule: Module = { id: Date.now(), title, completed: false };
        updateField('modules', [...(course.modules || []), newModule]);
        setTitle('');
    };

    const handleDelete = (id: number) => {
        updateField('modules', (course.modules || []).filter(m => m.id !== id));
    };

    const handleToggle = (id: number) => {
        updateField('modules', (course.modules || []).map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    };
    
    return (
        <div className="max-w-md">
            <div className="flex gap-2 mb-4 p-2 bg-black/20 rounded-lg">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="New module title..." />
                <Button onClick={handleAdd}>Add</Button>
            </div>
            <div className="space-y-2">
                {(course.modules || []).map(mod => (
                    <div key={mod.id} className="flex justify-between items-center p-2 rounded bg-white/5">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={mod.completed} onChange={() => handleToggle(mod.id)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--accent-color)] focus:ring-0" />
                            <span className={mod.completed ? 'line-through text-gray-500' : ''}>{mod.title}</span>
                        </label>
                        <Button variant="outline" className="text-xs !p-1" onClick={() => handleDelete(mod.id)}>Delete</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuizzesTab: React.FC<{course: Course, updateField: (f: 'quizzes', v: Quiz[]) => void}> = ({course, updateField}) => {
    const [title, setTitle] = useState('');

    const handleAdd = () => {
        if (!title.trim()) return;
        const newQuiz: Quiz = { id: Date.now(), title, score: null, status: 'pending' };
        updateField('quizzes', [...(course.quizzes || []), newQuiz]);
        setTitle('');
    };

    const handleDelete = (id: number) => {
        updateField('quizzes', (course.quizzes || []).filter(q => q.id !== id));
    };

    const handleUpdate = (id: number, updates: Partial<Quiz>) => {
        updateField('quizzes', (course.quizzes || []).map(q => q.id === id ? { ...q, ...updates } : q));
    };
    
    return (
        <div className="max-w-lg">
            <div className="flex gap-2 mb-4 p-2 bg-black/20 rounded-lg">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="New quiz title..." />
                <Button onClick={handleAdd}>Add</Button>
            </div>
            <div className="space-y-2">
                {(course.quizzes || []).map(quiz => (
                    <div key={quiz.id} className="grid grid-cols-4 items-center gap-2 p-2 rounded bg-white/5">
                        <span className="col-span-2">{quiz.title}</span>
                        <Input type="number" placeholder="Score %" value={quiz.score ?? ''} onChange={e => handleUpdate(quiz.id, { score: e.target.value ? Number(e.target.value) : null })} />
                        <select value={quiz.status} onChange={e => handleUpdate(quiz.id, { status: e.target.value as Quiz['status'] })} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg text-sm">
                            <option value="pending" className="bg-[#0b1626]">Pending</option>
                            <option value="passed" className="bg-[#0b1626]">Passed</option>
                            <option value="failed" className="bg-[#0b1626]">Failed</option>
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AttendanceTab: React.FC<{course: Course, updateField: (f: 'attendance', v: AttendanceRecord[]) => void}> = ({course, updateField}) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<AttendanceRecord['status']>('present');

    const handleAdd = () => {
        if (course.attendance.some(a => a.date === date)) return alert('Attendance for this date already recorded.');
        const newRecord: AttendanceRecord = { date, status };
        updateField('attendance', [...course.attendance, newRecord].sort((a,b) => b.date.localeCompare(a.date)));
    };

    const handleDelete = (dateToDelete: string) => {
        updateField('attendance', course.attendance.filter(a => a.date !== dateToDelete));
    };
    
    return (
        <div className="max-w-md">
            <div className="flex gap-2 mb-4 p-2 bg-black/20 rounded-lg">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border focus:outline-none focus:ring-2 focus:ring-[#5aa1ff]">
                    <option value="present" className="bg-[#0b1626]">Present</option>
                    <option value="absent" className="bg-[#0b1626]">Absent</option>
                    <option value="late" className="bg-[#0b1626]">Late</option>
                </select>
                <Button onClick={handleAdd}>Log</Button>
            </div>
            <div className="space-y-2">
                {course.attendance.map(rec => (
                    <div key={rec.date} className="flex justify-between items-center p-2 rounded bg-white/5">
                        <p>{rec.date}</p>
                        <p className={`capitalize font-semibold ${rec.status === 'present' ? 'text-green-400' : rec.status === 'absent' ? 'text-red-400' : 'text-yellow-400'}`}>{rec.status}</p>
                        <Button variant="outline" className="text-xs !p-1" onClick={() => handleDelete(rec.date)}>Delete</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Generic CRUD component for items like Assignments, Exams, Resources
const CrudManager: React.FC<{
    items: (Assignment | Exam | Resource)[];
    onUpdate: (items: any[]) => void;
    itemSchema: { field: string, label: string, type: string }[];
    itemName: string;
}> = ({ items, onUpdate, itemSchema, itemName }) => {
    const [formState, setFormState] = useState<any>({});
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleSave = () => {
        if (editingId) {
            onUpdate(items.map(item => item.id === editingId ? { ...item, ...formState } : item));
        } else {
            onUpdate([{ ...formState, id: Date.now() }, ...items]);
        }
        setFormState({});
        setEditingId(null);
    };
    
    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormState(item);
    };
    
    const handleDelete = (id: number) => {
        onUpdate(items.filter(item => item.id !== id));
    };

    return (
        <div>
            <details className="mb-4">
                <summary className="cursor-pointer font-semibold p-2 bg-black/20 rounded-lg">
                    {editingId ? `Editing ${itemName}`: `Add New ${itemName}`}
                </summary>
                 <div className="p-2 space-y-2 mt-1 border border-white/10 rounded-lg">
                     {itemSchema.map(s => (
                         <div key={s.field}>
                             <label className="text-sm text-gray-400">{s.label}</label>
                             <Input 
                                 type={s.type}
                                 value={formState[s.field] || ''}
                                 onChange={e => setFormState({...formState, [s.field]: e.target.value})}
                                 className="mt-1"
                             />
                         </div>
                     ))}
                     <div className="flex gap-2">
                        <Button onClick={handleSave}>{editingId ? 'Save Changes' : `Add ${itemName}`}</Button>
                        {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setFormState({}); }}>Cancel</Button>}
                     </div>
                 </div>
            </details>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className="p-2 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-start">
                           <p className="font-semibold">{item.title}</p>
                           <div>
                                <Button variant="outline" className="text-xs !p-1" onClick={() => handleEdit(item)}>Edit</Button>
                                <Button variant="outline" className="text-xs !p-1 ml-1" onClick={() => handleDelete(item.id)}>Del</Button>
                           </div>
                        </div>
                        {Object.entries(item).filter(([k]) => k !== 'title' && k !== 'id').map(([k,v]) => (
                            <p key={k} className="text-sm text-gray-300 capitalize">{k}: {String(v)}</p>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

const AssignmentsTab: React.FC<{course: Course, updateField: (f: 'assignments', v: Assignment[]) => void}> = ({course, updateField}) => (
    <CrudManager 
        items={course.assignments}
        onUpdate={(newItems) => updateField('assignments', newItems)}
        itemName="Assignment"
        itemSchema={[
            { field: 'title', label: 'Title', type: 'text' },
            { field: 'dueDate', label: 'Due Date', type: 'date' },
            { field: 'grade', label: 'Grade', type: 'text' },
            { field: 'totalPoints', label: 'Total Points', type: 'number' },
        ]}
    />
);

const ExamsTab: React.FC<{course: Course, updateField: (f: 'exams', v: Exam[]) => void}> = ({course, updateField}) => (
    <CrudManager 
        items={course.exams}
        onUpdate={(newItems) => updateField('exams', newItems)}
        itemName="Exam"
        itemSchema={[
            { field: 'title', label: 'Title', type: 'text' },
            { field: 'date', label: 'Date', type: 'date' },
            { field: 'time', label: 'Time', type: 'time' },
            { field: 'grade', label: 'Grade', type: 'text' },
            { field: 'totalPoints', label: 'Total Points', type: 'number' },
        ]}
    />
);

const ResourcesTab: React.FC<{course: Course, updateField: (f: 'resources', v: Resource[]) => void}> = ({course, updateField}) => (
     <CrudManager 
        items={course.resources}
        onUpdate={(newItems) => updateField('resources', newItems)}
        itemName="Resource"
        itemSchema={[
            { field: 'title', label: 'Title', type: 'text' },
            { field: 'url', label: 'URL', type: 'url' },
            { field: 'description', label: 'Description', type: 'text' },
        ]}
    />
);


const FilesTab: React.FC<{course: Course, updateField: (f: 'attachments', v: number[]) => void}> = ({course, updateField}) => {
    const { setViewingFile } = useAppContext();
    const [allFiles, setAllFiles] = useState<StoredFile[]>([]);
    const attachFileRef = useRef<HTMLInputElement>(null);

    const loadFiles = useCallback(async () => {
        setAllFiles(await getFiles());
    }, []);

    useEffect(() => { loadFiles() }, [loadFiles]);
    
    const courseFiles = useMemo(() => {
        return allFiles.filter(f => course.attachments?.includes(f.id));
    }, [allFiles, course.attachments]);

    const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newId = await addFile(file);
            updateField('attachments', [...(course.attachments || []), newId]);
            loadFiles();
        }
    };
    
    const handleView = async (id: number) => {
        const fileData = await getFile(id);
        if (fileData) setViewingFile(fileData);
    };

    return (
        <div>
            <Button onClick={() => attachFileRef.current?.click()}>Attach New File</Button>
            <input type="file" ref={attachFileRef} className="hidden" onChange={handleAttach} />
            <div className="mt-4 space-y-2">
                {courseFiles.map(file => (
                    <div key={file.id} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                        <p>{file.name}</p>
                        <Button variant="outline" onClick={() => handleView(file.id)}>View</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default AcademicsManager;
