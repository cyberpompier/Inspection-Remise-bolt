import React, { useState, useRef, useEffect } from 'react';
import { InspectionProvider, useInspection } from './context/InspectionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { VehicleImageView } from './components/VehicleImageView';
import { ChecklistView } from './components/ChecklistView';
import { ReportView } from './components/ReportView';
import { ProfileModal } from './components/ProfileModal';
import { VehicleAdminView } from './components/VehicleAdminView';
import { CameraIcon, CheckSquareIcon, FileTextIcon, LogoutIcon, UserCircleIcon, PencilIcon, CogIcon } from './components/icons';
import type { VehicleSide, VehicleWithPublicUrls } from './types';
import { supabase } from './services/supabaseClient';

type ActiveTab = VehicleSide | 'checklist' | 'report' | 'manage-vehicles';

const BUCKET_NAME = 'vehicle_images';

const MainApp: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('avant');
  const [vehicles, setVehicles] = useState<VehicleWithPublicUrls[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { resetInspection } = useInspection();

  const handleDataChange = () => {
    setRefreshTrigger(t => t + 1);
  };

  // Effect to fetch vehicles when profile is loaded or a refresh is triggered
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!profile?.caserne) {
        setVehicles([]);
        setVehiclesLoading(false);
        return;
      }
      setVehiclesLoading(true);
      try {
        const { data: vehiclesData, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('caserne', profile.caserne)
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        const vehiclesWithUrls = (vehiclesData || []).map(v => {
          const getUrl = (path: string | null) => path ? supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl : null;
          return {
            ...v,
            image_avant_url: getUrl(v.image_avant_path),
            image_droite_url: getUrl(v.image_droite_path),
            image_arriere_url: getUrl(v.image_arriere_path),
            image_gauche_url: getUrl(v.image_gauche_path),
          };
        });

        setVehicles(vehiclesWithUrls);

      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setVehicles([]);
      } finally {
        setVehiclesLoading(false);
      }
    };
    
    fetchVehicles();
  }, [profile?.caserne, refreshTrigger]);
  
  // Effect to manage the selected vehicle ID when the list of vehicles changes.
  useEffect(() => {
    if (vehiclesLoading) return;

    const currentVehicleExists = vehicles.some(v => v.id === selectedVehicleId);
    
    if (currentVehicleExists) {
      return; // The current selection is valid, do nothing.
    }

    if (vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id); // Default to first vehicle
    } else {
      setSelectedVehicleId(null); // No vehicles, no selection
    }
  }, [vehicles, vehiclesLoading, selectedVehicleId]);


  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const vehicleViews: { id: VehicleSide, name: string, imageUrl?: string | null }[] = selectedVehicle ? [
    { id: 'avant', name: 'Avant', imageUrl: selectedVehicle.image_avant_url },
    { id: 'droite', name: 'Côté Droit', imageUrl: selectedVehicle.image_droite_url },
    { id: 'arriere', name: 'Arrière', imageUrl: selectedVehicle.image_arriere_url },
    { id: 'gauche', name: 'Côté Gauche', imageUrl: selectedVehicle.image_gauche_url },
  ] : [];

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    resetInspection();
    await supabase.auth.signOut();
  };

  const handleVehicleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newVehicleId = parseInt(event.target.value, 10);
    setSelectedVehicleId(newVehicleId);
    resetInspection();
    setActiveTab('avant');
  };

  const renderContent = () => {
    if (activeTab === 'manage-vehicles') {
      return <VehicleAdminView vehicles={vehicles} onDataChange={handleDataChange} />;
    }
    if (vehiclesLoading) {
      return <div className="flex items-center justify-center h-full"><p className="text-gray-300">Chargement des véhicules...</p></div>;
    }
    if (!selectedVehicle) {
        return <div className="flex items-center justify-center h-full text-center p-4"><p className="text-gray-300">Aucun véhicule disponible pour votre caserne. Allez à la section "Gestion" pour en ajouter un.</p></div>;
    }
    const sideView = vehicleViews.find(s => s.id === activeTab);
    if (sideView && sideView.imageUrl) {
      return <VehicleImageView key={`${selectedVehicle.id}-${sideView.id}`} side={sideView.id} imageUrl={sideView.imageUrl} />;
    }
     if (sideView && !sideView.imageUrl) {
      return <div className="flex items-center justify-center h-full"><p className="text-gray-300">Image non disponible pour cette vue.</p></div>;
    }
    switch (activeTab) {
      case 'checklist':
        return <ChecklistView />;
      case 'report':
        return <ReportView />;
      default:
        return null;
    }
  };

  const navItems = [
    ...vehicleViews.map(view => ({ id: view.id, name: view.name, icon: CameraIcon })),
    { id: 'checklist', name: 'Checklist', icon: CheckSquareIcon },
    { id: 'report', name: 'Rapport IA', icon: FileTextIcon },
    { id: 'manage-vehicles', name: 'Gestion', icon: CogIcon }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-500 flex-shrink-0">Inspection Pompier IA</h1>
            {vehiclesLoading ? (
                <p className="text-gray-400">Chargement...</p>
            ) : (
              <select
                  value={selectedVehicleId ?? ''}
                  onChange={handleVehicleChange}
                  aria-label="Sélectionner un véhicule"
                  className="bg-gray-700 border border-gray-600 rounded-md py-1 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={vehicles.length === 0}
              >
                  {vehicles.length === 0 && <option>Aucun véhicule</option>}
                  {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                      </option>
                  ))}
              </select>
            )}
        </div>
        <div className="relative" ref={profileMenuRef}>
            <button
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                aria-label="Ouvrir le menu du profil"
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
            >
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                )}
            </button>
            {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right bg-gray-800 border border-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                        <div className="px-4 py-3 border-b border-gray-700">
                            <p className="text-sm font-medium text-white truncate">{profile?.name || 'Utilisateur'}</p>
                            <p className="text-xs text-gray-400 truncate">{profile?.rank || 'Grade non défini'}</p>
                            <p className="text-xs text-gray-500 truncate">{profile?.caserne || 'Caserne non définie'}</p>
                        </div>
                        <button
                            onClick={() => { setIsProfileMenuOpen(false); setIsProfileModalOpen(true); }}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            role="menuitem"
                        >
                            <PencilIcon className="w-5 h-5 mr-3" />
                            Modifier le profil
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            role="menuitem"
                        >
                            <LogoutIcon className="w-5 h-5 mr-3" />
                            Déconnexion
                        </button>
                    </div>
                </div>
            )}
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <nav className="w-16 md:w-64 bg-gray-800 p-2 md:p-4 overflow-y-auto border-r border-gray-700">
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`w-full flex items-center p-3 rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  disabled={!selectedVehicle && item.id !== 'manage-vehicles'}
                >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  <span className="hidden md:inline md:ml-4 font-semibold">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 p-2 md:p-4 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (!session) {
        return <LoginScreen />;
    }
    
    return (
        <InspectionProvider>
            <MainApp />
        </InspectionProvider>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
