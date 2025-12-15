import React from 'react';
import { FileText, Sparkles, Moon, Sun } from 'lucide-react';

interface HeaderProps {
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleTheme }) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-lg text-white shadow-md shadow-indigo-500/20">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                PicToPDF <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Convertidor Inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Powered by Gemini</span>
              </div>
              
              <button 
                onClick={onToggleTheme}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;