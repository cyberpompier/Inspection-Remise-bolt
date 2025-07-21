import React, { useState } from 'react';
import type { VehicleWithPublicUrls } from '../types';
import { supabase } from '../services/supabaseClient';
import { VehicleFormModal } from './VehicleFormModal';
import { PencilIcon, PlusIcon, TrashIcon } from './icons';

interface VehicleAdminViewProps {
  vehicles: VehicleWithPublicUrls[];
  onDataChange: () => void;
}

const BUCKET_NAME = 'vehicle_images';

export const VehicleAdminView: React.FC<VehicleAdminViewProps> = ({ vehicles, onDataChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithPublicUrls | null>(null);
  const [loading, setLoading] = useState(false);

  const openAddModal = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: VehicleWithPublicUrls) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleDelete = async (vehicle: VehicleWithPublicUrls) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le véhicule "${vehicle.name}" ? Cette action est irréversible.`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete images from storage
      const pathsToDelete = [
        vehicle.image_avant_path,
        vehicle.image_droite_path,
        vehicle.image_arriere_path,
        vehicle.image_gauche_path
      ].filter((p): p is string => p !== null && p !== '');

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove(pathsToDelete);
        if (storageError) {
          console.error("Error deleting storage files, but proceeding to delete DB record:", storageError);
        }
      }

      // Delete vehicle from database
      const { error: dbError } = await supabase.from('vehicles').delete().eq('id', vehicle.id);
      if (dbError) throw dbError;

      onDataChange();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-900 rounded-lg h-full">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-blue-500">Gestion des Véhicules</h2>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Ajouter un véhicule
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <ul className="divide-y divide-gray-700">
          {vehicles.length === 0 && (
            <li className="p-4 text-center text-gray-400">Aucun véhicule trouvé pour votre caserne.</li>
          )}
          {vehicles.map(vehicle => (
            <li key={vehicle.id} className="p-4 flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src={vehicle.image_avant_url || 'https://via.placeholder.com/150/1f2937/FFFFFF?text=N/A'} 
                  alt={`Avant de ${vehicle.name}`} 
                  className="w-16 h-12 object-cover rounded-md mr-4 bg-gray-700"
                />
                <div>
                  <p className="font-semibold text-lg text-white">{vehicle.name}</p>
                  <p className="text-sm text-gray-400">{vehicle.caserne || 'Caserne non assignée'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openEditModal(vehicle)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                  aria-label={`Modifier ${vehicle.name}`}
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(vehicle)}
                  disabled={loading}
                  className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/50 rounded-md transition-colors"
                   aria-label={`Supprimer ${vehicle.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <VehicleFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        vehicleToEdit={editingVehicle}
        onSuccess={() => {
          closeModal();
          onDataChange();
        }}
      />
    </div>
  );
};
