
import React, { useMemo, useRef } from 'react';
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import type { StudyLog } from '../../types';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({title, subtitle}) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

const COLORS = ['#5aa1ff', '#3bb0ff', '#23c4ff', '#00d7ff', '#00e7f5'];

const downloadJSON = (obj: any, name='export.json') => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
};

const CircularProgress: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({ progress, size = 80, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle
                className="modern-attendance-circle-bg"
                strokeWidth={strokeWidth}
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <circle
                className="modern-attendance-circle-progress"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
        </svg>
    );
};


const StudyProgress: React.FC = () => {
  const { studyLogs, setStudyLogs, appSettings } = useAppContext();
  const importFileRef = useRef<HTMLInputElement>(null);

  const chartData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    studyLogs.forEach(log => {
      grouped[log.subject] = (grouped[log.subject] || 0) + log.hours;
    });
    return Object.entries(grouped)
        .map(([name, hours], index) => ({ 
            name, 
            hours: parseFloat(hours.toFixed(2)),
            fill: COLORS[index % COLORS.length] 
        }))
        .sort((a,b) => b.hours - a.hours);
  }, [studyLogs]);
  
  const { insights, moodColor } = useMemo(() => {
    if (studyLogs.length === 0) return { insights: [], moodColor: 'var(--accent-color)' };

    const recentLogs = studyLogs.filter(log => {
        const logDate = new Date(log.ts);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return logDate > threeDaysAgo;
    });
    
    // Mood Color calculation
    let moodColor = '#a855f7'; // default purple
    if (recentLogs.length > 0) {
        const avgEnergy = recentLogs.reduce((acc, log) => acc + log.energy, 0) / recentLogs.length;
        const avgFocus = recentLogs.reduce((acc, log) => acc + log.focus, 0) / recentLogs.length;
        const score = (avgEnergy + avgFocus) / 2; // out of 10
        if (score > 7) moodColor = '#34d399'; // green
        else if (score > 4) moodColor = '#f59e0b'; // yellow
        else moodColor = '#ef4444'; // red
    }
    
    // Insights calculation
    const insights: string[] = [];
    if (chartData.length > 0) {
        insights.push(`Your top subject is ${chartData[0].name}.`);
    }
    const hoursByTime = Array(24).fill(0);
    studyLogs.forEach(log => {
        const hour = new Date(log.ts).getHours();
        hoursByTime[hour] += log.hours;
    });
    const peakHour = hoursByTime.indexOf(Math.max(...hoursByTime));
    insights.push(`You study most often around ${peakHour}:00.`);
    
    return { insights, moodColor };
  }, [studyLogs, chartData]);

  const logSession = () => {
    const subject = prompt('Subject:', 'General');
    if (!subject) return;
    const hoursStr = prompt('Hours (decimal):', '0.5');
    const hours = parseFloat(hoursStr || '0');
    if (isNaN(hours) || hours <= 0) return;
    const energyStr = prompt('Energy (1-10):', '6');
    const energy = parseInt(energyStr || '5');
    const focusStr = prompt('Focus (1-10):', '6');
    const focus = parseInt(focusStr || '5');

    const newLog: StudyLog = { subject, hours, energy, focus, ts: Date.now() };
    setStudyLogs(prev => [newLog, ...prev]);
  };

  const exportLogs = () => {
    downloadJSON(studyLogs, 'study-logs.json');
  };

  const importLogs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data) && data.every(item => 'subject' in item && 'hours' in item)) {
                setStudyLogs(data as StudyLog[]);
                alert('Study logs imported successfully.');
            } else {
                alert('Invalid file format for study logs.');
            }
        } catch (err) {
            alert('Invalid file format: Not a valid JSON file.');
        } finally {
            if(importFileRef.current) {
                importFileRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
  };
  
  if (appSettings.uiStyle === 'modern') {
    const maxHours = Math.max(...chartData.map(d => d.hours), 1); // Avoid division by zero
    
    return (
      <div>
        <h3 className="text-xl font-bold mb-2">Attendance</h3>
        <div className="modern-attendance-grid">
          {chartData.map((data, index) => (
            <div key={index} className="modern-attendance-card">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <CircularProgress progress={(data.hours / maxHours) * 90 + 10} />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                  {Math.round((data.hours / maxHours) * 90 + 10)}%
                </div>
              </div>
              <p className="font-semibold text-sm truncate">{data.name}</p>
              <p className="text-xs">{data.hours} / {Math.ceil(maxHours)} hrs</p>
            </div>
          ))}
          {chartData.length === 0 && <p>No study data yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between" style={{'--dynamic-accent': moodColor} as React.CSSProperties}>
      <div>
        <CardHeader title="Knowledge Bank: Study Tracker" />
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[#9fb3cf] text-xs mb-2">Hours by Subject</div>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 150 }}>
                <ResponsiveContainer>
                  <RadialBarChart 
                      innerRadius="30%" 
                      outerRadius="100%" 
                      data={chartData} 
                      startAngle={180} 
                      endAngle={0}
                      barSize={10}
                  >
                      <RadialBar
                          minAngle={15}
                          background
                          clockWise
                          dataKey='hours'
                          animationDuration={1500}
                      />
                      <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                      <Tooltip contentStyle={{ backgroundColor: '#0b1626', border: '1px solid var(--dynamic-accent)' }}/>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[150px] w-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center rounded-md">
                  <p className="text-[#9fb3cf]">No study data yet.</p>
              </div>
            )}
          </div>
          <div className="w-full md:w-64 space-y-3">
              <div>
                  <div className="text-[#9fb3cf] text-xs mb-1">Quick Insights</div>
                  <div className="text-xs p-2 bg-[rgba(255,255,255,0.03)] rounded-md space-y-1">
                      {insights.map((insight, i) => <p key={i}>- {insight}</p>)}
                  </div>
              </div>
              <div>
                  <div className="text-[#9fb3cf] text-xs mb-1">Recent Sessions</div>
                  <div className="space-y-1 max-h-20 overflow-y-auto pr-2">
                      {studyLogs.slice(0, 5).map(log => (
                          <div key={log.ts} className="flex justify-between items-center text-xs">
                              <strong className="text-white">{log.subject}</strong>
                              <div className="text-[#9fb3cf]">{log.hours.toFixed(1)} hrs</div>
                          </div>
                      ))}
                  </div>
              </div>
            <Button onClick={logSession} className="w-full" style={{backgroundColor: 'var(--dynamic-accent)'}}>Log Session</Button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-[rgba(255,255,255,0.08)] pt-3">
        <Button variant="outline" onClick={exportLogs}>Export Logs</Button>
        <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import Logs</Button>
        <input type="file" ref={importFileRef} onChange={importLogs} className="hidden" accept="application/json" />
      </div>
    </div>
  );
};

export default StudyProgress;