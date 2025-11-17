import React from 'react';

const ModernSidebar: React.FC = () => {
    return (
        <aside className="modern-sidebar fixed top-0 left-0 h-full w-64 lg:w-72 p-6 flex-col hidden md:flex">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-lg bg-gray-500 flex-shrink-0"></div>
                <h1 className="text-xl font-bold">Studyos</h1>
            </div>
        </aside>
    );
};

export default ModernSidebar;