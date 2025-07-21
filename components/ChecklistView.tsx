import React from 'react';
import { useInspection } from '../context/InspectionContext';

export const ChecklistView: React.FC = () => {
  const { checklistItems, toggleChecklistItem } = useInspection();

  return (
    <div className="p-4 md:p-6 bg-gray-900 rounded-lg h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-blue-500 mb-6 border-b border-gray-700 pb-2">Checklist de Contrôle</h2>
      <ul className="space-y-4">
        {checklistItems.map(item => (
          <li key={item.id} className="bg-gray-800 p-4 rounded-md border border-gray-700 transition-all duration-300 hover:border-blue-500">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleChecklistItem(item.id)}
                className="h-6 w-6 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <span className={`ml-4 text-lg ${item.checked ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
