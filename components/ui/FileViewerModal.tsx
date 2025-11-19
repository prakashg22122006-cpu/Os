import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from './Button';
import Card from './Card';

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
        if (fileType.startsWith('image/') || fileType === 'application/pdf' || fileType.startsWith('video/')) {
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
            return <p className="text-center text-text-dim">Loading preview...</p>;
        }
        if (objectUrl) {
            if (viewingFile.type.startsWith('image/')) {
                return <img src={objectUrl} alt={viewingFile.name} className="max-w-full max-h-full mx-auto object-contain rounded-lg" />;
            }
            if (viewingFile.type.startsWith('video/')) {
                return <video src={objectUrl} controls autoPlay className="max-w-full max-h-full mx-auto object-contain rounded-lg" />;
            }
            if (viewingFile.type === 'application/pdf') {
                return <iframe src={objectUrl} className="w-full h-full border-0 rounded-lg" title={viewingFile.name} />;
            }
        }
        if (textContent) {
            return <pre className="whitespace-pre-wrap text-sm p-4 bg-black/30 rounded-lg text-text-dim">{textContent}</pre>;
        }
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                <p className="text-xl mb-4 text-text-dim">Cannot preview this file type.</p>
                <Button variant="gradient" onClick={handleDownload}>Download File</Button>
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content w-full max-w-4xl h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <Card title={viewingFile.name} onClose={handleClose} className="p-4 w-full h-full">
                   <div className="flex-grow min-h-0 flex items-center justify-center">
                    {renderPreview()}
                   </div>
                   <div className="flex-shrink-0 pt-4 flex justify-end">
                     <Button variant="glass" onClick={handleDownload}>Download</Button>
                   </div>
                </Card>
            </div>
        </div>
    );
};

export default FileViewerModal;
