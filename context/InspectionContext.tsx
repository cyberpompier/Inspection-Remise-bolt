import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { Defect, ChecklistItem, VehicleSide } from '../types';

interface InspectionContextType {
  defects: Defect[];
  addDefect: (defect: Omit<Defect, 'id'>) => void;
  checklistItems: ChecklistItem[];
  toggleChecklistItem: (id: string) => void;
  resetInspection: () => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

const initialChecklistItems: ChecklistItem[] = [
    { id: 'cl-1', label: 'Pression des pneus', checked: false },
    { id: 'cl-2', label: 'Niveaux des fluides (huile, liquide de refroidissement)', checked: false },
    { id: 'cl-3', label: 'Fonctionnement des feux (phares, clignotants, gyrophares)', checked: false },
    { id: 'cl-4', label: 'État des équipements de secours (lances, tuyaux, etc.)', checked: false },
    { id: 'cl-5', label: 'Propreté du véhicule (intérieur et extérieur)', checked: false },
    { id: 'cl-6', label: 'État de la carrosserie (hors impacts signalés)', checked: false },
    { id: 'cl-7', label: 'Test de la sirène et des avertisseurs sonores', checked: false },
];


export const InspectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(initialChecklistItems);

  const addDefect = (defect: Omit<Defect, 'id'>) => {
    setDefects(prev => [...prev, { ...defect, id: `defect-${Date.now()}` }]);
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };
  
  const resetInspection = () => {
    setDefects([]);
    setChecklistItems(initialChecklistItems.map(item => ({ ...item, checked: false })));
  };

  return (
    <InspectionContext.Provider value={{ defects, addDefect, checklistItems, toggleChecklistItem, resetInspection }}>
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspection = (): InspectionContextType => {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
};
