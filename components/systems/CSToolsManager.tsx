
import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

// --- Roadmaps Data & Components ---

interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    resources?: { name: string; url: string }[];
}

interface RoadmapTrack {
    id: string;
    title: string;
    description: string;
    steps: RoadmapItem[];
}

const ROADMAPS: RoadmapTrack[] = [
    {
        id: 'fullstack',
        title: 'Full Stack Web Dev',
        description: 'Master frontend and backend technologies.',
        steps: [
            { id: 'fs_html_css', title: 'HTML & CSS', description: 'Semantic HTML, Flexbox, Grid, Responsive Design.', resources: [{name: 'MDN Web Docs', url: 'https://developer.mozilla.org/'}] },
            { id: 'fs_js', title: 'JavaScript Deep Dive', description: 'ES6+, Async/Await, DOM Manipulation, Event Loop.', resources: [{name: 'JS.info', url: 'https://javascript.info/'}] },
            { id: 'fs_react', title: 'Frontend Framework (React)', description: 'Components, Hooks, State Management, Routing.', resources: [{name: 'React Docs', url: 'https://react.dev/'}] },
            { id: 'fs_node', title: 'Backend Runtime (Node.js)', description: 'Express/NestJS, REST APIs, Middleware.' },
            { id: 'fs_db', title: 'Databases', description: 'SQL (PostgreSQL) vs NoSQL (MongoDB), ORMs.' },
            { id: 'fs_auth', title: 'Authentication', description: 'JWT, OAuth, Session Management, Security best practices.' },
            { id: 'fs_deploy', title: 'Deployment & DevOps', description: 'Docker, CI/CD, AWS/Vercel, Nginx.' },
        ]
    },
    {
        id: 'ai_ml',
        title: 'AI & Data Science',
        description: 'From data analysis to deep learning.',
        steps: [
            { id: 'ai_python', title: 'Python Mastery', description: 'Data structures, OOP, decorators, virtual environments.' },
            { id: 'ai_math', title: 'Math Foundations', description: 'Linear Algebra, Calculus, Probability & Statistics.' },
            { id: 'ai_pandas', title: 'Data Manipulation', description: 'NumPy, Pandas, Data Cleaning, Visualization (Matplotlib).' },
            { id: 'ai_ml_algs', title: 'Classical ML', description: 'Regression, Classification, Clustering, Scikit-Learn.' },
            { id: 'ai_dl', title: 'Deep Learning', description: 'Neural Networks, Backprop, TensorFlow/PyTorch.' },
            { id: 'ai_nlp_cv', title: 'Specialization (NLP/CV)', description: 'Transformers, CNNs, RNNs, GANs.' },
            { id: 'ai_ops', title: 'MLOps', description: 'Model serving, monitoring, pipeline automation.' },
        ]
    },
    {
        id: 'cybersec',
        title: 'Cybersecurity',
        description: 'Protect systems and networks.',
        steps: [
            { id: 'sec_net', title: 'Networking Basics', description: 'OSI Model, TCP/IP, DNS, HTTP/HTTPS, Subnetting.' },
            { id: 'sec_linux', title: 'Linux Administration', description: 'Bash scripting, File permissions, System processes.' },
            { id: 'sec_script', title: 'Scripting (Python/Bash)', description: 'Automating scans, simple exploits.' },
            { id: 'sec_eth', title: 'Ethical Hacking', description: 'Reconnaissance, Scanning, Enumeration, Exploitation.' },
            { id: 'sec_web', title: 'Web Security', description: 'OWASP Top 10, SQLi, XSS, CSRF.' },
            { id: 'sec_crypto', title: 'Cryptography', description: 'Encryption, Hashing, PKI, Digital Signatures.' },
        ]
    }
];

const RoadmapsView: React.FC = () => {
    const [activeTrackId, setActiveTrackId] = useState(ROADMAPS[0].id);
    const [progress, setProgress] = useLocalStorage<Record<string, boolean>>('roadmapProgress', {});
    const [searchQuery, setSearchQuery] = useState('');

    const activeTrack = useMemo(() => ROADMAPS.find(t => t.id === activeTrackId) || ROADMAPS[0], [activeTrackId]);

    const filteredSteps = useMemo(() => {
        if (!searchQuery) return activeTrack.steps;
        const lowerQuery = searchQuery.toLowerCase();
        return activeTrack.steps.filter(step => 
            step.title.toLowerCase().includes(lowerQuery) || 
            step.description.toLowerCase().includes(lowerQuery)
        );
    }, [activeTrack, searchQuery]);

    const toggleStep = (stepId: string) => {
        setProgress(prev => ({ ...prev, [stepId]: !prev[stepId] }));
    };

    const calculateProgress = (track: RoadmapTrack) => {
        const completed = track.steps.filter(s => progress[s.id]).length;
        return Math.round((completed / track.steps.length) * 100);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-2">
                 <div className="flex gap-2 overflow-x-auto pb-2">
                    {ROADMAPS.map(track => (
                        <button
                            key={track.id}
                            onClick={() => setActiveTrackId(track.id)}
                            className={`px-4 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                                activeTrackId === track.id 
                                    ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-lg' 
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {track.title}
                            <div className="w-full bg-black/30 h-1 mt-1 rounded-full overflow-hidden">
                                <div className="bg-white/50 h-full" style={{ width: `${calculateProgress(track)}%` }}></div>
                            </div>
                        </button>
                    ))}
                </div>
                <Input 
                    placeholder="Search topics..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="text-sm !p-2"
                />
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                    <h2 className="text-2xl font-bold mb-2">{activeTrack.title}</h2>
                    <p className="text-gray-400 mb-6">{activeTrack.description}</p>
                    
                    <div className="relative space-y-8">
                        {/* Vertical Line */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/10"></div>
                        
                        {filteredSteps.length > 0 ? filteredSteps.map((step, index) => {
                            const isCompleted = !!progress[step.id];
                            return (
                                <div key={step.id} className="relative flex gap-4 group animate-in" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div 
                                        onClick={() => toggleStep(step.id)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg cursor-pointer z-10 transition-all duration-300 border-4 flex-shrink-0 ${
                                            isCompleted 
                                                ? 'bg-green-500 border-[#0b1626] text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                                                : 'bg-[#0b1626] border-gray-600 text-gray-500 group-hover:border-[var(--accent-color)]'
                                        }`}
                                    >
                                        {isCompleted ? '✓' : index + 1}
                                    </div>
                                    <div className={`flex-1 p-4 rounded-lg border transition-all duration-300 ${isCompleted ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/30' : 'bg-white/5 border-white/5 group-hover:bg-white/10'}`}>
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-bold text-lg ${isCompleted ? 'text-[var(--accent-color)]' : 'text-gray-200'}`}>{step.title}</h3>
                                            <input 
                                                type="checkbox" 
                                                checked={isCompleted} 
                                                onChange={() => toggleStep(step.id)}
                                                className="form-checkbox h-5 w-5 rounded bg-transparent border-gray-500 text-green-500 focus:ring-0 cursor-pointer"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                                        {step.resources && step.resources.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <p className="text-xs font-bold text-gray-500 mb-1 uppercase">Resources</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {step.resources.map((res, i) => (
                                                        <a key={i} href={res.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline bg-blue-500/10 px-2 py-1 rounded">
                                                            {res.name} ↗
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-center text-gray-500 py-8">No topics match your search.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Toolbox Components ---

const RegexTester: React.FC = () => {
    const [pattern, setPattern] = useState('');
    const [flags, setFlags] = useState('gm');
    const [text, setText] = useState('The quick brown fox jumps over the lazy dog.\nContact: test@example.com');
    const [matchHtml, setMatchHtml] = useState('');

    useEffect(() => {
        if (!pattern) {
            setMatchHtml(text);
            return;
        }
        try {
            const regex = new RegExp(`(${pattern})`, flags);
            const parts = text.split(regex);
            const highlighted = parts.map((part, i) => {
                if (regex.test(part)) {
                    return `<span class="bg-yellow-500/50 text-white rounded px-0.5 border-b-2 border-yellow-500">${part}</span>`;
                }
                return part;
            }).join('');
            setMatchHtml(highlighted);
        } catch (e) {
            setMatchHtml(text); // Fallback on error
        }
    }, [pattern, flags, text]);

    return (
        <Card className="h-full flex flex-col bg-black/20 border-white/10">
            <h4 className="font-bold mb-3 flex items-center gap-2"><span className="text-purple-400">.*</span> Regex Tester</h4>
            <div className="flex gap-2 mb-2">
                <Input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="Pattern (e.g. \w+)" className="flex-grow font-mono text-sm" />
                <Input value={flags} onChange={e => setFlags(e.target.value)} placeholder="Flags" className="w-20 font-mono text-sm text-center" />
            </div>
            <textarea 
                value={text} 
                onChange={e => setText(e.target.value)} 
                className="w-full h-24 bg-[#0f172a] border border-white/10 rounded p-2 text-xs font-mono text-gray-400 mb-2 resize-none focus:outline-none"
                placeholder="Test string here..."
            />
            <div className="flex-grow bg-[#0f172a] border border-white/10 rounded p-2 overflow-auto">
                <p className="font-mono text-xs text-gray-300 whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: matchHtml }} />
            </div>
        </Card>
    );
};

const ChmodCalculator: React.FC = () => {
    const [permissions, setPermissions] = useState([
        { name: 'Owner', r: true, w: true, x: true },
        { name: 'Group', r: true, w: false, x: true },
        { name: 'Public', r: true, w: false, x: true },
    ]);

    const toggle = (index: number, type: 'r' | 'w' | 'x') => {
        const newPerms = [...permissions];
        newPerms[index][type] = !newPerms[index][type];
        setPermissions(newPerms);
    };

    const octal = useMemo(() => {
        return permissions.map(p => (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0)).join('');
    }, [permissions]);

    const symbolic = useMemo(() => {
        return permissions.map(p => (p.r ? 'r' : '-') + (p.w ? 'w' : '-') + (p.x ? 'x' : '-')).join('');
    }, [permissions]);

    return (
        <Card className="h-full flex flex-col bg-black/20 border-white/10">
            <h4 className="font-bold mb-3 flex items-center gap-2"><span className="text-green-400">777</span> Chmod Calculator</h4>
            <div className="flex-grow flex flex-col justify-center gap-4">
                {permissions.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between bg-white/5 p-2 rounded">
                        <span className="text-sm w-16 font-semibold">{p.name}</span>
                        <div className="flex gap-2">
                            {['r', 'w', 'x'].map(type => (
                                <label key={type} className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={(p as any)[type]} onChange={() => toggle(i, type as any)} className="accent-[var(--accent-color)]" />
                                    <span className="uppercase text-xs font-mono text-gray-400">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-[#0f172a] p-2 rounded text-center">
                    <div className="text-[10px] text-gray-500 uppercase">Octal</div>
                    <div className="text-xl font-mono text-[var(--accent-color)] font-bold">{octal}</div>
                </div>
                <div className="bg-[#0f172a] p-2 rounded text-center">
                    <div className="text-[10px] text-gray-500 uppercase">Symbolic</div>
                    <div className="text-xl font-mono text-white font-bold">{symbolic}</div>
                </div>
            </div>
        </Card>
    );
};

const BaseConverter: React.FC = () => {
    const [dec, setDec] = useState<string>('');

    const handleChange = (val: string, base: number) => {
        if (val === '') {
            setDec('');
            return;
        }
        const num = parseInt(val, base);
        if (!isNaN(num)) {
            setDec(num.toString());
        }
    };

    const displayVal = (base: number) => {
        const num = parseInt(dec, 10);
        return isNaN(num) ? '' : num.toString(base).toUpperCase();
    };

    return (
        <Card className="h-full flex flex-col bg-black/20 border-white/10">
            <h4 className="font-bold mb-3 flex items-center gap-2"><span className="text-blue-400">0x</span> Base Converter</h4>
            <div className="space-y-3 flex-grow">
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Decimal</label>
                    <Input value={dec} onChange={e => setDec(e.target.value)} placeholder="Decimal" className="font-mono" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Hexadecimal</label>
                    <Input value={displayVal(16)} onChange={e => handleChange(e.target.value, 16)} placeholder="Hex" className="font-mono text-yellow-200" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Binary</label>
                    <Input value={displayVal(2)} onChange={e => handleChange(e.target.value, 2)} placeholder="Binary" className="font-mono text-green-200" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Octal</label>
                    <Input value={displayVal(8)} onChange={e => handleChange(e.target.value, 8)} placeholder="Octal" className="font-mono text-blue-200" />
                </div>
            </div>
        </Card>
    );
};

const JsonTools: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

    const format = () => {
        try {
            const obj = JSON.parse(input);
            setOutput(JSON.stringify(obj, null, 2));
            setStatus('valid');
        } catch (e) {
            setOutput((e as Error).message);
            setStatus('invalid');
        }
    };

    const minify = () => {
        try {
            const obj = JSON.parse(input);
            setOutput(JSON.stringify(obj));
            setStatus('valid');
        } catch (e) {
            setOutput((e as Error).message);
            setStatus('invalid');
        }
    };

    return (
        <Card className="h-full flex flex-col bg-black/20 border-white/10">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold flex items-center gap-2"><span className="text-orange-400">{`{}`}</span> JSON Tools</h4>
                <span className={`text-xs px-2 py-1 rounded ${status === 'valid' ? 'bg-green-500/20 text-green-400' : status === 'invalid' ? 'bg-red-500/20 text-red-400' : 'opacity-0'}`}>
                    {status === 'valid' ? 'Valid JSON' : 'Invalid'}
                </span>
            </div>
            <div className="flex-grow grid grid-rows-2 gap-2 h-full">
                <textarea 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    className="bg-[#0f172a] border border-white/10 rounded p-2 text-xs font-mono text-gray-300 resize-none focus:outline-none focus:border-[var(--accent-color)]"
                    placeholder="Paste JSON here..."
                />
                <textarea 
                    readOnly
                    value={output} 
                    className={`bg-[#0f172a] border border-white/10 rounded p-2 text-xs font-mono resize-none focus:outline-none ${status === 'invalid' ? 'text-red-300' : 'text-green-300'}`}
                    placeholder="Output..."
                />
            </div>
            <div className="flex gap-2 mt-2">
                <Button onClick={format} className="flex-1 text-xs">Prettify</Button>
                <Button onClick={minify} variant="outline" className="flex-1 text-xs">Minify</Button>
                <Button onClick={() => { setInput(''); setOutput(''); setStatus('idle'); }} variant="outline" className="w-16 text-xs">Clear</Button>
            </div>
        </Card>
    );
};

// --- New Widgets ---

const CronGenerator: React.FC = () => {
    const [mins, setMins] = useState('*');
    const [hours, setHours] = useState('*');
    const [dom, setDom] = useState('*');
    const [month, setMonth] = useState('*');
    const [dow, setDow] = useState('*');

    const expression = `${mins} ${hours} ${dom} ${month} ${dow}`;

    return (
        <Card className="h-full flex flex-col bg-black/20 border-white/10">
            <h4 className="font-bold mb-3 flex items-center gap-2"><span className="text-pink-400">⏰</span> Cron Generator</h4>
            <div className="grid grid-cols-5 gap-1 text-center mb-4">
                <div>
                    <Input value={mins} onChange={e => setMins(e.target.value)} className="text-center font-mono text-sm !p-1" />
                    <label className="text-[10px] text-gray-400">Min</label>
                </div>
                 <div>
                    <Input value={hours} onChange={e => setHours(e.target.value)} className="text-center font-mono text-sm !p-1" />
                    <label className="text-[10px] text-gray-400">Hour</label>
                </div>
                 <div>
                    <Input value={dom} onChange={e => setDom(e.target.value)} className="text-center font-mono text-sm !p-1" />
                    <label className="text-[10px] text-gray-400">Day</label>
                </div>
                 <div>
                    <Input value={month} onChange={e => setMonth(e.target.value)} className="text-center font-mono text-sm !p-1" />
                    <label className="text-[10px] text-gray-400">Mon</label>
                </div>
                 <div>
                    <Input value={dow} onChange={e => setDow(e.target.value)} className="text-center font-mono text-sm !p-1" />
                    <label className="text-[10px] text-gray-400">Week</label>
                </div>
            </div>
            <div className="mt-auto bg-[#0f172a] p-4 rounded text-center">
                 <div className="text-lg font-mono text-green-400 font-bold tracking-wider">{expression}</div>
                 <p className="text-[10px] text-gray-500 mt-1">Minute Hour Day Month Weekday</p>
            </div>
        </Card>
    );
};

const SqlBuilder: React.FC = () => {
    const [table, setTable] = useState('users');
    const [cols, setCols] = useState('*');
    const [where, setWhere] = useState('');
    
    const query = `SELECT ${cols} FROM ${table}${where ? ` WHERE ${where}` : ''};`;

    return (
        <Card className="h-full flex flex-col bg-black/20 border-white/10">
             <h4 className="font-bold mb-3 flex items-center gap-2"><span className="text-blue-400">SQL</span> Query Builder</h4>
             <div className="space-y-2 mb-4">
                 <div>
                     <label className="text-[10px] uppercase text-gray-400">Table</label>
                     <Input value={table} onChange={e => setTable(e.target.value)} className="text-sm font-mono !p-1.5" />
                 </div>
                 <div>
                     <label className="text-[10px] uppercase text-gray-400">Columns</label>
                     <Input value={cols} onChange={e => setCols(e.target.value)} className="text-sm font-mono !p-1.5" />
                 </div>
                 <div>
                     <label className="text-[10px] uppercase text-gray-400">Where Condition</label>
                     <Input value={where} onChange={e => setWhere(e.target.value)} placeholder="e.g. id > 5" className="text-sm font-mono !p-1.5" />
                 </div>
             </div>
             <div className="mt-auto bg-[#0f172a] p-3 rounded border border-white/10">
                 <code className="text-xs font-mono text-blue-300 break-all">{query}</code>
             </div>
        </Card>
    );
};

const DiffViewer: React.FC = () => {
    const [left, setLeft] = useState('Original text');
    const [right, setRight] = useState('Modified text');

    return (
        <Card className="h-full flex flex-col bg-black/20 border-white/10 col-span-1 md:col-span-2">
             <h4 className="font-bold mb-2 flex items-center gap-2"><span className="text-yellow-400">↔</span> Quick Diff</h4>
             <div className="flex gap-2 h-full min-h-[150px]">
                 <textarea value={left} onChange={e => setLeft(e.target.value)} className="w-1/2 bg-[#0f172a] p-2 text-xs font-mono resize-none rounded border border-white/10 focus:outline-none" />
                 <textarea value={right} onChange={e => setRight(e.target.value)} className="w-1/2 bg-[#0f172a] p-2 text-xs font-mono resize-none rounded border border-white/10 focus:outline-none" />
             </div>
             <p className="text-[10px] text-gray-500 mt-1 text-center">Simple side-by-side comparison (visual check only)</p>
        </Card>
    );
};

const ColorConverter: React.FC = () => {
    const [hex, setHex] = useState('#3bb0ff');
    
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 'Invalid';
    }

    return (
         <Card className="h-full flex flex-col bg-black/20 border-white/10">
             <h4 className="font-bold mb-3 flex items-center gap-2"><span className="text-red-400">#</span> Color Converter</h4>
             <div className="flex gap-4 items-center mb-4">
                 <div className="w-12 h-12 rounded border border-white/20 shadow-inner" style={{backgroundColor: hex}}></div>
                 <Input value={hex} onChange={e => setHex(e.target.value)} className="font-mono" />
             </div>
             <div className="space-y-2">
                 <div className="bg-[#0f172a] p-2 rounded flex justify-between items-center">
                     <span className="text-xs text-gray-400">RGB</span>
                     <span className="font-mono text-xs select-all">{hexToRgb(hex)}</span>
                 </div>
                  <div className="bg-[#0f172a] p-2 rounded flex justify-between items-center">
                     <span className="text-xs text-gray-400">CSS</span>
                     <span className="font-mono text-xs select-all">rgb({hexToRgb(hex)})</span>
                 </div>
             </div>
        </Card>
    );
};


const ToolboxView: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full overflow-y-auto pb-2 pr-2">
            <div className="h-[22rem]"><RegexTester /></div>
            <div className="h-[22rem]"><ChmodCalculator /></div>
            <div className="h-[22rem]"><BaseConverter /></div>
            <div className="h-[22rem]"><JsonTools /></div>
            <div className="h-[22rem]"><CronGenerator /></div>
            <div className="h-[22rem]"><SqlBuilder /></div>
            <div className="h-[22rem]"><ColorConverter /></div>
            <div className="h-[22rem] md:col-span-2 xl:col-span-2"><DiffViewer /></div>
        </div>
    );
};

// --- Main Component ---

const CSToolsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'roadmap' | 'toolbox'>('toolbox');

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-end mb-4">
                <div>
                     <h3 className="text-lg font-bold text-[#cfe8ff]">Advanced CS Tools</h3>
                     <p className="text-xs text-gray-400">Developer utilities & learning paths</p>
                </div>
                <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('roadmap')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'roadmap' ? 'bg-[var(--accent-color)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>Roadmaps</button>
                    <button onClick={() => setActiveTab('toolbox')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'toolbox' ? 'bg-[var(--accent-color)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>Toolbox</button>
                </div>
            </div>
            
            <div className="flex-grow min-h-0">
                {activeTab === 'roadmap' ? <RoadmapsView /> : <ToolboxView />}
            </div>
        </div>
    );
};

export default CSToolsManager;
