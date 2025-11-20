
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from './Button';

const FileViewerModal: React.FC = () => {
    const { viewingFile, setViewingFile, setEngagementLogs } = useAppContext();
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!viewingFile) return;

        setIsLoading(true);
        setObjectUrl(null);
        setTextContent(null);

        setEngagementLogs(prev => [...prev, {
            ts: Date.now(),
            activity: 'view_resource',
            details: { id: viewingFile.id, name: viewingFile.name }
        }]);

        const fileType = viewingFile.type;
        const fileData = viewingFile.data;
        
        let url: string | null = null;
        if (fileType.startsWith('image/') || fileType === 'application/pdf') {
            url = URL.createObjectURL(fileData);
            setObjectUrl(url);
            setIsLoading(false);
        } else if (fileType.startsWith('text/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setTextContent(e.target?.result as string);
                setIsLoading(false);
            };
            reader.onerror = () => {
                setTextContent('Error reading text file.');
                setIsLoading(false);
            };
            reader.readAsText(fileData);
        } else {
            setIsLoading(false);
        }

        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [viewingFile, setEngagementLogs]);

    if (!viewingFile) return null;
    
    const handleDownload = () => {
        const url = URL.createObjectURL(viewingFile.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = viewingFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClose = () => {
        setViewingFile(null);
    };

    const renderPreview = () => {
        if (isLoading) {
            return <p className="text-center">Loading preview...</p>;
        }
        if (objectUrl) {
            if (viewingFile.type.startsWith('image/')) {
                return <img src={objectUrl} alt={viewingFile.name} className="max-w-full max-h-full mx-auto object-contain" />;
            }
            if (viewingFile.type === 'application/pdf') {
                return <embed src={objectUrl} type="application/pdf" className="w-full h-full" />;
            }
        }
        if (textContent) {
            return <pre className="whitespace-pre-wrap text-sm p-4 bg-black/20 rounded-lg">{textContent}</pre>;
        }
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                <p className="text-xl mb-4 text-[#9fb3cf]">Cannot preview this file type.</p>
                <Button onClick={handleDownload}>Download File</Button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[#5aa1ff]/20 rounded-xl shadow-2xl w-full max-w-4xl h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
                    <h4 className="font-semibold truncate text-lg">{viewingFile.name}</h4>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleDownload}>Download</Button>
                        <Button variant="primary" onClick={handleClose}>Close</Button>
                    </div>
                </header>
                <main className="p-4 overflow-auto flex-grow">
                    {renderPreview()}
                </main>
            </div>
        </div>
    );
};

export default FileViewerModal;
