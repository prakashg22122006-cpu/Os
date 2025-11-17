
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Semester, Course, EngagementLog } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
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
            <Card className="text-center">
                <h4 className="text-sm font-semibold text-gray-400">Overall GPA</h4>
                <p className="text-4xl font-bold text-[var(--accent-color)]">{stats.gpa.toFixed(2)}</p>
            </Card>
            <Card className="text-center">
                <h4 className="text-sm font-semibold text-gray-400">Attendance</h4>
                <p className="text-4xl font-bold text-[var(--accent-color)]">{stats.attendancePercentage.toFixed(0)}%</p>
            </Card>
            <Card className="text-center">
                <h4 className="text-sm font-semibold text-gray-400">Average Grade</h4>
                <p className="text-4xl font-bold text-[var(--accent-color)]">{stats.averageGrade > 0 ? `${stats.averageGrade.toFixed(1)}%` : 'N/A'}</p>
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
            <select onChange={e => setSelectedSemester(e.target.value)} className="bg-transparent border border-[var(--input-border-color)] p-2 rounded-lg mb-4">
                <option value="all" className="bg-[#0b1626]">All Semesters</option>
                {semesters.map(s => <option key={s.name} value={s.name} className="bg-[#0b1626]">{s.name}</option>)}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold mb-2">Attendance Trend (%)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={attendanceData.lineData}>
                            <XAxis dataKey="date" fontSize={10} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="percentage" stroke="var(--accent-color)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Overall Attendance</h4>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={attendanceData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {attendanceData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const GradesTab: React.FC = () => {
    const { semesters } = useAppContext();
    const [selectedSemester, setSelectedSemester] = useState<string>(semesters[0]?.name || '');
    
    const allCourses = useMemo(() => semesters.flatMap(s => s.courses), [semesters]);

    const gradeData = useMemo(() => allCourses.map(c => ({
        name: c.code || c.name,
        grade: getGradeValue(c.grade),
    })).filter(c => c.grade > 0), [allCourses]);
    
    const semesterGradeData = useMemo(() => {
        const courses = semesters.find(s => s.name === selectedSemester)?.courses || [];
        return courses.map(c => ({
            subject: c.code || c.name,
            A: getGradeValue(c.grade),
            fullMark: getGradeValue(c.grade) > 4 ? 100 : 4.0,
        })).filter(c => c.A > 0);
    }, [semesters, selectedSemester]);
    
    return (
        <div>
            <h4 className="font-semibold mb-2">Grades Across All Courses</h4>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeData}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="grade" fill="var(--accent-color)" />
                </BarChart>
            </ResponsiveContainer>

            <h4 className="font-semibold my-4">Semester Performance Breakdown</h4>
            <select onChange={e => setSelectedSemester(e.target.value)} value={selectedSemester} className="bg-transparent border border-[var(--input-border-color)] p-2 rounded-lg mb-4">
                {semesters.map(s => <option key={s.name} value={s.name} className="bg-[#0b1626]">{s.name}</option>)}
            </select>
             <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={semesterGradeData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar name="Grade" dataKey="A" stroke="var(--accent-color)" fill="var(--accent-color)" fillOpacity={0.6} />
                    <Tooltip />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

const EngagementTab: React.FC = () => {
    const { engagementLogs } = useAppContext();
    const today = new Date();
    const days = 90;

    const dataByDay = useMemo(() => {
        const map = new Map<string, number>();
        engagementLogs.forEach(log => {
            const dateStr = new Date(log.ts).toISOString().split('T')[0];
            map.set(dateStr, (map.get(dateStr) || 0) + 1);
        });
        return map;
    }, [engagementLogs]);
    
    const activityByType = useMemo(() => {
        const map = new Map<string, number>();
        engagementLogs.forEach(log => {
            map.set(log.activity, (map.get(log.activity) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, value]) => ({name, value}));
    }, [engagementLogs]);

    const renderHeatmap = () => {
        const squares = [];
        const startDate = new Date();
        startDate.setDate(today.getDate() - days + 1);
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const count = dataByDay.get(dateStr) || 0;
            
            let colorClass = 'bg-gray-700/50';
            if (count > 0) colorClass = 'bg-green-500/30';
            if (count > 5) colorClass = 'bg-green-500/60';
            if (count > 10) colorClass = 'bg-green-500/90';
            
            squares.push(
                <div key={i} className={`w-4 h-4 rounded-sm ${colorClass}`} title={`${dateStr}: ${count} activities`} />
            );
        }
        return squares;
    };

    return (
        <div>
            <h4 className="font-semibold mb-2">Activity Heatmap (Last 90 Days)</h4>
            <div className="flex flex-wrap gap-1 bg-black/20 p-2 rounded-lg">{renderHeatmap()}</div>

            <h4 className="font-semibold my-4">Activity Breakdown</h4>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityByType} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--accent-color)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- MAIN COMPONENT ---
type AnalyticsTab = 'overview' | 'attendance' | 'grades' | 'engagement';

const AnalyticsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

    const TABS: { id: AnalyticsTab, label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'grades', label: 'Grades & Performance' },
        { id: 'engagement', label: 'Engagement' },
    ];
    
    return (
        <div>
            <CardHeader title="Real-Time Analytics" subtitle="Insights into your academic life" />
            <div className="flex border-b border-white/10 mb-4">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-gray-400 hover:text-white'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'attendance' && <AttendanceTab />}
                {activeTab === 'grades' && <GradesTab />}
                {activeTab === 'engagement' && <EngagementTab />}
            </div>
        </div>
    );
};

export default AnalyticsManager;
