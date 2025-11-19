import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Semester, Course, EngagementLog } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-text">
        {title} {subtitle && <small className="text-text-dim font-normal ml-1">{subtitle}</small>}
    </h3>
);

const GRADE_MAP: { [key: string]: number } = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const getGradeValue = (grade: string): number => {
    const numGrade = parseFloat(grade);
    if (!isNaN(numGrade) && numGrade >= 0 && numGrade <= 100) return numGrade;
    return GRADE_MAP[grade.toUpperCase()] || 0;
};


// --- TABS ---

const OverviewTab: React.FC = () => {
    const { semesters } = useAppContext();
    const stats = useMemo(() => {
        const allCourses = semesters.flatMap(s => s.courses);
        let totalCredits = 0;
        let weightedGradePoints = 0;
        let totalAttendance = 0;
        let presentAttendance = 0;
        let gradeSum = 0;
        let gradedCoursesCount = 0;

        allCourses.forEach(c => {
            const credits = Number(c.credits) || 0;
            if (c.grade && credits > 0) {
                const gradePoint = getGradeValue(c.grade);
                if (gradePoint > 4) { // Assume it's a percentage
                    gradeSum += gradePoint;
                    gradedCoursesCount++;
                } else { // Assume it's a GPA scale grade
                    weightedGradePoints += credits * gradePoint;
                    totalCredits += credits;
                }
            }
            c.attendance.forEach(a => {
                totalAttendance++;
                if (a.status === 'present') presentAttendance++;
            });
        });
        
        const gpa = totalCredits > 0 ? (weightedGradePoints / totalCredits) : 0;
        const attendancePercentage = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 100;
        const averageGrade = gradedCoursesCount > 0 ? (gradeSum / gradedCoursesCount) : 0;

        return { gpa, attendancePercentage, averageGrade };
    }, [semesters]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center p-4">
                <h4 className="text-sm font-semibold text-gray-400">Overall GPA</h4>
                <p className="text-4xl font-bold text-[var(--grad-1)]">{stats.gpa.toFixed(2)}</p>
            </Card>
            <Card className="text-center p-4">
                <h4 className="text-sm font-semibold text-gray-400">Attendance</h4>
                <p className="text-4xl font-bold text-[var(--grad-1)]">{stats.attendancePercentage.toFixed(0)}%</p>
            </Card>
            <Card className="text-center p-4">
                <h4 className="text-sm font-semibold text-gray-400">Average Grade</h4>
                <p className="text-4xl font-bold text-[var(--grad-1)]">{stats.averageGrade > 0 ? `${stats.averageGrade.toFixed(1)}%` : 'N/A'}</p>
            </Card>
        </div>
    );
};

const AttendanceTab: React.FC = () => {
    const { semesters } = useAppContext();
    const [selectedSemester, setSelectedSemester] = useState<string>('all');
    
    const attendanceData = useMemo(() => {
        const courses = selectedSemester === 'all'
            ? semesters.flatMap(s => s.courses)
            : semesters.find(s => s.name === selectedSemester)?.courses || [];

        const daily: { [date: string]: { present: number, total: number } } = {};
        let totalPresent = 0, totalAbsent = 0;

        courses.forEach(c => {
            c.attendance.forEach(a => {
                if (!daily[a.date]) daily[a.date] = { present: 0, total: 0 };
                daily[a.date].total++;
                if (a.status === 'present') {
                    daily[a.date].present++;
                    totalPresent++;
                } else {
                    totalAbsent++;
                }
            });
        });

        const lineData = Object.entries(daily)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, { present, total }]) => ({
                date,
                percentage: total > 0 ? (present / total) * 100 : 0,
            }));
        
        const pieData = [
            { name: 'Present', value: totalPresent },
            { name: 'Absent', value: totalAbsent },
        ];

        return { lineData, pieData };
    }, [semesters, selectedSemester]);
    
    const COLORS = ['#34d399', '#ef4444'];

    return (
        <div>
            <select onChange={e => setSelectedSemester(e.target.value)} className="glass-select mb-4">
                <option value="all">All Semesters</option>
                {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold mb-2">Attendance Trend (%)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={attendanceData.lineData}>
                            <XAxis dataKey="date" fontSize={10} stroke="var(--text-dim)" />
                            <YAxis domain={[0, 100]} stroke="var(--text-dim)"/>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-offset)', border: '1px solid var(--border-color)' }}/>
                            <Line type="monotone" dataKey="percentage" stroke="var(--grad-1)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Overall Attendance</h4>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={attendanceData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {attendanceData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: 'var(--bg-offset)', border: '1px solid var(--border-color)' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const EngagementTab: React.FC = () => {
    const { engagementLogs } = useAppContext();
    const engagementData = useMemo(() => {
        const activityCounts = new Map<EngagementLog['activity'], number>();
        engagementLogs.forEach(log => {
            activityCounts.set(log.activity, (activityCounts.get(log.activity) || 0) + 1);
        });

        const radarData = Array.from(activityCounts.entries()).map(([name, value]) => ({
            activity: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count: value,
        }));
        
        return { radarData };
    }, [engagementLogs]);

    return (
         <div>
            <h4 className="font-semibold mb-2">Activity Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={engagementData.radarData}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="activity" fontSize={12} stroke="var(--text-dim)" />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 5']} tick={false} axisLine={false} />
                    <Radar name="Activity Count" dataKey="count" stroke="var(--grad-1)" fill="var(--grad-1)" fillOpacity={0.6} />
                     <Tooltip contentStyle={{ backgroundColor: 'var(--bg-offset)', border: '1px solid var(--border-color)' }}/>
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- MAIN ---
type AnalyticsTab = 'overview' | 'attendance' | 'engagement';

const AnalyticsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

    const TABS: { id: AnalyticsTab, label: string }[] = [
        { id: 'overview', label: 'Overall GPA' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'engagement', label: 'Engagement' },
    ];
    
    return (
        <div>
            <CardHeader title="Analytics & Insights" subtitle="Visualize your academic performance" />
            <div className="flex border-b border-white/10 mb-4">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-text-dim hover:text-white'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'attendance' && <AttendanceTab />}
                {activeTab === 'engagement' && <EngagementTab />}
            </div>
        </div>
    );
};

export default AnalyticsManager;