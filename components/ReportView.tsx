import React, { useState } from 'react';
import { useInspection } from '../context/InspectionContext';
import { generateInspectionReport } from '../services/geminiService';
import { SparklesIcon, FileTextIcon } from './icons';

export const ReportView: React.FC = () => {
  const { defects, checklistItems } = useInspection();
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await generateInspectionReport(defects, checklistItems);
      setReport(result);
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Une erreur inconnue est survenue.";
        setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // A simple markdown to HTML converter
  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-blue-500 my-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-4 mb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-200 mt-3 mb-1">$1</h3>')
      .replace(/^- (.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
    
    // Wrap list items in ul
    html = html.replace(/(<li.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul><br \/><ul>/g, '');


    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="p-4 md:p-6 bg-gray-900 rounded-lg h-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <h2 className="text-2xl font-bold text-blue-500 mb-2 sm:mb-0">Compte Rendu IA</h2>
            <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                <SparklesIcon className="w-5 h-5 mr-2"/>
                {isLoading ? 'Génération...' : 'Générer le rapport'}
            </button>
        </div>
      
        <div className="flex-grow bg-gray-800 rounded-md p-4 overflow-y-auto border border-gray-700">
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4">L'IA analyse les données de l'inspection...</p>
                </div>
            )}
            {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md"><strong>Erreur:</strong> {error}</div>}
            {report && (
                <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300">
                    {renderMarkdown(report)}
                </div>
            )}
            {!isLoading && !report && !error && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FileTextIcon className="w-16 h-16 mb-4"/>
                    <p>Le rapport d'inspection apparaîtra ici.</p>
                </div>
            )}
        </div>
    </div>
  );
};
