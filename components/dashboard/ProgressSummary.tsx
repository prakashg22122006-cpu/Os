
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CardHeader: React.FC<{ title: string }> = ({title}) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">{title}</h3>
);

const COLORS = ['#3bb0ff', '#00d7ff', '#a855f7', '#f43f5e', '#fbbf24'];
const TASK_COLORS = ['#10b981', '#334155']; // Green for done, Slate for pending

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0b1626] border border-white/10 p-2 rounded shadow-xl text-xs">
                <p className="label text-white font-bold">{`${payload[0].name} : ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const ProgressSummary: React.FC = () => {
    const { semesters, learningLogs, studyLogs, tasks } = useAppContext();

    // 1. Task Data for Donut Chart
    const taskData = useMemo(() => {
        const completed = tasks.filter(t => t.status === 'Done').length;
        const pending = tasks.length - completed;
        return [
            { name: 'Done', value: completed },
            { name: 'Pending', value: pending }
        ];
    }, [tasks]);

    // 2. Academic Data for Bar Chart
    const academicData = useMemo(() => {
        let totalModules = 0;
        let completedModules = 0;
        let totalQuizzes = 0;
        let passedQuizzes = 0;

        semesters.forEach(semester => {
            semester.courses.forEach(course => {
                totalModules += course.modules?.length || 0;
                completedModules += course.modules?.filter(m => m.completed).length || 0;
                totalQuizzes += course.quizzes?.length || 0;
                passedQuizzes += course.quizzes?.filter(q => q.status === 'passed').length || 0;
            });
        });

        const modulePct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        const quizPct = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

        return [
            { name: 'Modules', percentage: modulePct },
            { name: 'Quizzes', percentage: quizPct },
        ];
    }, [semesters]);

    // 3. Subject Distribution for Pie Chart
    const subjectData = useMemo(() => {
        const map = new Map<string, number>();
        studyLogs.forEach(log => {
            map.set(log.subject, (map.get(log.subject) || 0) + log.hours);
        });
        // Take top 4 and group rest as 'Other'
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        if (sorted.length <= 4) return sorted.map(([name, value]) => ({ name, value }));
        
        const top4 = sorted.slice(0, 4).map(([name, value]) => ({ name, value }));
        const other = sorted.slice(4).reduce((acc, curr) => acc + curr[1], 0);
        return [...top4, { name: 'Other', value: other }];
    }, [studyLogs]);

    const renderTabContent = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[180px]">
            
            {/* Task Donut */}
            <div className="flex flex-col items-center justify-center bg-white/5 rounded-lg p-2 relative">
                <h4 className="text-[10px] uppercase text-gray-400 font-bold absolute top-2 left-2">Tasks</h4>
                <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={taskData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={50}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {taskData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={TASK_COLORS[index % TASK_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">
                                {tasks.length > 0 ? Math.round((taskData[0].value / tasks.length) * 100) : 0}%
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Academic Bar */}
            <div className="flex flex-col items-center justify-center bg-white/5 rounded-lg p-2 relative">
                <h4 className="text-[10px] uppercase text-gray-400 font-bold absolute top-2 left-2">Academics</h4>
                <div className="w-full h-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={academicData} margin={{top: 10, right: 0, left: -25, bottom: 0}}>
                            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                            <Bar dataKey="percentage" fill="#3bb0ff" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Subject Pie */}
            <div className="flex flex-col items-center justify-center bg-white/5 rounded-lg p-2 relative">
                <h4 className="text-[10px] uppercase text-gray-400 font-bold absolute top-2 left-2">Focus</h4>
                <div className="w-full h-full">
                    {subjectData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={subjectData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={50}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {subjectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500">No data</div>
                    )}
                </div>
            </div>

        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <CardHeader title="Progress Report" />
            <div className="flex-grow">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProgressSummary;
