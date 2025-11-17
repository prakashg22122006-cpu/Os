
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Course, LearningLog, Quiz } from '../../types';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import Card from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const LearningTimeTracker: React.FC = () => {
    const { learningLogs, setLearningLogs } = useAppContext();
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = window.setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning]);

    const handleStartStop = () => {
        if (isRunning) {
            // Stopping timer
            if (time > 0) {
                const today = new Date().toISOString().split('T')[0];
                const minutes = Math.floor(time / 60);
                setLearningLogs(prev => {
                    const todayLogIndex = prev.findIndex(log => log.date === today);
                    if (todayLogIndex > -1) {
                        const newLogs = [...prev];
                        newLogs[todayLogIndex].minutes += minutes;
                        return newLogs;
                    } else {
                        return [...prev, { date: today, minutes }];
                    }
                });
            }
            setTime(0);
        }
        setIsRunning(!isRunning);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const weeklyChartData = useMemo(() => {
        const data: { name: string, minutes: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const log = learningLogs.find(l => l.date === dayStr);
            data.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                minutes: log ? log.minutes : 0,
            });
        }
        return data;
    }, [learningLogs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 flex flex-col items-center justify-center bg-black/20 p-4 rounded-lg">
                <p className="text-4xl font-mono mb-4">{formatTime(time)}</p>
                <Button onClick={handleStartStop} className="w-32">
                    {isRunning ? 'Stop & Save' : 'Start Timer'}
                </Button>
            </div>
            <div className="md:col-span-2">
                <h4 className="font-semibold mb-2">This Week's Learning Time (minutes)</h4>
                 <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyChartData}>
                        <XAxis dataKey="name" stroke="#9fb3cf" fontSize={12} />
                        <YAxis stroke="#9fb3cf" fontSize={12}/>
                        <Tooltip contentStyle={{ backgroundColor: '#0b1626', border: '1px solid var(--accent-color)' }} />
                        <Bar dataKey="minutes" fill="var(--accent-color)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const CourseProgressView: React.FC<{ courses: Course[] }> = ({ courses }) => (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {courses.map(course => {
            const total = course.modules.length;
            const completed = course.modules.filter(m => m.completed).length;
            const percentage = total > 0 ? (completed / total) * 100 : 0;
            return (
                <div key={course.name} className="bg-black/20 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                        <h5 className="font-semibold">{course.name}</h5>
                        <span className="text-sm font-semibold">{completed} / {total} Modules</span>
                    </div>
                    <ProgressBar value={percentage} />
                </div>
            )
        })}
    </div>
);

const QuizProgressView: React.FC<{ courses: Course[] }> = ({ courses }) => (
     <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {courses.filter(c => c.quizzes.length > 0).map(course => {
            const total = course.quizzes.length;
            const passed = course.quizzes.filter(q => q.status === 'passed').length;
            const percentage = total > 0 ? (passed / total) * 100 : 0;
            return (
                <div key={course.name} className="bg-black/20 p-3 rounded-lg">
                    <h5 className="font-semibold mb-2">{course.name}</h5>
                    {course.quizzes.map(quiz => (
                         <div key={quiz.id} className="text-sm flex justify-between items-center p-1">
                            <span>{quiz.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${quiz.status === 'passed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{quiz.status} {quiz.score && `(${quiz.score}%)`}</span>
                        </div>
                    ))}
                </div>
            )
        })}
    </div>
);

const AssignmentProgressView: React.FC<{ courses: Course[] }> = ({ courses }) => {
    const allAssignments = useMemo(() => courses.flatMap(c => c.assignments), [courses]);
    const completed = allAssignments.filter(a => a.completed).length;
    const total = allAssignments.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
        <div className="bg-black/20 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h5 className="font-semibold">Overall Assignment Completion</h5>
                <span className="text-sm font-semibold">{completed} / {total} Done</span>
            </div>
            <ProgressBar value={percentage} />
        </div>
    );
};

const ProgressManager: React.FC = () => {
    const { semesters } = useAppContext();
    const [activeTab, setActiveTab] = useState('time');
    const allCourses = useMemo(() => semesters.flatMap(s => s.courses), [semesters]);

    return (
        <div>
            <CardHeader title="Progress Monitor" subtitle="Track your learning and performance" />
             <div className="flex border-b border-white/10 mb-4">
                <button onClick={() => setActiveTab('time')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'time' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-gray-400'}`}>Learning Time</button>
                <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'courses' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-gray-400'}`}>Courses</button>
                <button onClick={() => setActiveTab('quizzes')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'quizzes' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-gray-400'}`}>Quizzes</button>
                <button onClick={() => setActiveTab('assignments')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'assignments' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-gray-400'}`}>Assignments</button>
            </div>
            <div>
                {activeTab === 'time' && <LearningTimeTracker />}
                {activeTab === 'courses' && <CourseProgressView courses={allCourses} />}
                {activeTab === 'quizzes' && <QuizProgressView courses={allCourses} />}
                {activeTab === 'assignments' && <AssignmentProgressView courses={allCourses} />}
            </div>
        </div>
    );
};

export default ProgressManager;
