
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import ProgressBar from '../ui/ProgressBar';

const CardHeader: React.FC<{ title: string }> = ({title}) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">{title}</h3>
);

const ProgressSummary: React.FC = () => {
    const { semesters, learningLogs, tasks } = useAppContext();

    const stats = React.useMemo(() => {
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

        const totalAssignments = tasks.length;
        const completedAssignments = tasks.filter(t => t.status === 'Done').length;

        const courseCompletion = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
        const quizCompletion = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 0;
        const assignmentCompletion = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
        const totalLearningTime = learningLogs.reduce((acc, log) => acc + log.minutes, 0);

        return { courseCompletion, quizCompletion, assignmentCompletion, totalLearningTime };
    }, [semesters, learningLogs, tasks]);

    return (
        <div>
            <CardHeader title="Overall Progress Summary" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="text-xs text-gray-400">Course Completion</label>
                    <div className="flex items-center gap-2">
                        <ProgressBar value={stats.courseCompletion} />
                        <span className="font-semibold text-sm">{stats.courseCompletion.toFixed(0)}%</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-400">Quiz Pass Rate</label>
                    <div className="flex items-center gap-2">
                        <ProgressBar value={stats.quizCompletion} />
                        <span className="font-semibold text-sm">{stats.quizCompletion.toFixed(0)}%</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-400">Assignments Done</label>
                    <div className="flex items-center gap-2">
                        <ProgressBar value={stats.assignmentCompletion} />
                        <span className="font-semibold text-sm">{stats.assignmentCompletion.toFixed(0)}%</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-400">Total Learning Time</label>
                    <p className="font-semibold text-lg">{(stats.totalLearningTime / 60).toFixed(1)} hrs</p>
                </div>
            </div>
        </div>
    );
};

export default ProgressSummary;
