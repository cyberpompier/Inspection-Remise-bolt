import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { supabase } from '../services/supabaseClient';
import type { VehicleWithPublicUrls, VehicleInsert, VehicleUpdate } from '../types';
import { CloudArrowUpIcon, XIcon } from './icons';
import { useAuth } from '../context/AuthContext';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicleToEdit?: VehicleWithPublicUrls | null;
}

const BUCKET_NAME = 'vehicle_images';
type VehicleSideKey = 'avant' | 'droite' | 'arriere' | 'gauche';
const SIDES: VehicleSideKey[] = ['avant', 'droite', 'arriere', 'gauche'];

type ImageState = {
  file: File | null;
  previewUrl: string | null;
  path: string | null;
};

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose, onSuccess, vehicleToEdit }) => {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [images, setImages] = useState<Record<VehicleSideKey, ImageState>>({
    avant: { file: null, previewUrl: null, path: null },
    droite: { file: null, previewUrl: null, path: null },
    arriere: { file: null, previewUrl: null, path: null },
    gauche: { file: null, previewUrl: null, path: null },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      if (vehicleToEdit) {
        setName(vehicleToEdit.name);
        setImages({
          avant: { file: null, previewUrl: vehicleToEdit.image_avant_url, path: vehicleToEdit.image_avant_path },
          droite: { file: null, previewUrl: vehicleToEdit.image_droite_url, path: vehicleToEdit.image_droite_path },
          arriere: { file: null, previewUrl: vehicleToEdit.image_arriere_url, path: vehicleToEdit.image_arriere_path },
          gauche: { file: null, previewUrl: vehicleToEdit.image_gauche_url, path: vehicleToEdit.image_gauche_path },
        });
      } else {
        setName('');
        setImages({
          avant: { file: null, previewUrl: null, path: null },
          droite: { file: null, previewUrl: null, path: null },
          arriere: { file: null, previewUrl: null, path: null },
          gauche: { file: null, previewUrl: null, path: null },
        });
      }
    }
  }, [isOpen, vehicleToEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: VehicleSideKey) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImages(prev => ({
        ...prev,
        [side]: { ...prev[side], file, previewUrl: URL.createObjectURL(file) }
      }));
    }
  };

  const removeImage = (side: VehicleSideKey) => {
     setImages(prev => ({
        ...prev,
        [side]: { file: null, previewUrl: null, path: null }
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom du véhicule est obligatoire.");
      return;
    }
    if (!profile?.caserne) {
      setError("Impossible d'assigner le véhicule : caserne de l'utilisateur non définie.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const paths: Partial<Record<`image_${VehicleSideKey}_path`, string | null>> = {};
      const pathsToDelete: string[] = [];

      for (const side of SIDES) {
        const state = images[side];
        const oldPath = vehicleToEdit?.[`image_${side}_path` as keyof typeof vehicleToEdit] as string | null;

        if (state.file) { // New file uploaded
          if (oldPath) {
             pathsToDelete.push(oldPath);
          }
          const filePath = `${profile.caserne.replace(/\s+/g, '_')}/${name.replace(/\s+/g, '_')}-${side}-${Date.now()}`;
          const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, state.file);
          if (uploadError) throw new Error(`Erreur lors de l'upload de l'image ${side}: ${uploadError.message}`);
          paths[`image_${side}_path`] = filePath;
        } else if (!state.previewUrl && oldPath) { // Image was removed
           pathsToDelete.push(oldPath);
           paths[`image_${side}_path`] = null; // Set path to null
        } else if (state.path) { // Image is unchanged, preserve path from initial state
           paths[`image_${side}_path`] = state.path;
        } else {
           paths[`image_${side}_path`] = null;
        }
      }

      if (pathsToDelete.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(pathsToDelete);
      }
      
      if (vehicleToEdit) {
        const vehicleData: VehicleUpdate = {
          name,
          caserne: profile.caserne,
          ...paths
        };
        const { error: updateError } = await supabase.from('vehicles').update(vehicleData).eq('id', vehicleToEdit.id);
        if (updateError) throw updateError;
      } else {
        const vehicleData: VehicleInsert = {
          name,
          caserne: profile.caserne,
          ...paths
        };
        const { error: insertError } = await supabase.from('vehicles').insert([vehicleData]);
        if (insertError) throw insertError;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const renderFileInput = (side: VehicleSideKey, label: string) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        {images[side].previewUrl ? (
            <div className="relative group">
                <img src={images[side].previewUrl!} alt={`Aperçu ${label}`} className="w-full h-32 object-cover rounded-md bg-gray-700"/>
                <button
                    type="button"
                    onClick={() => removeImage(side)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-50 group-hover:opacity-100 transition-opacity"
                    aria-label={`Retirer l'image ${label}`}
                >
                    <XIcon className="w-4 h-4"/>
                </button>
            </div>
        ) : (
            <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:bg-gray-700/50 transition-colors">
                <CloudArrowUpIcon className="w-8 h-8 text-gray-500"/>
                <span className="text-sm text-gray-400 mt-1">Téléverser</span>
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, side)} className="hidden"/>
            </label>
        )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vehicleToEdit ? 'Modifier le véhicule' : 'Ajouter un véhicule'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md text-center">{error}</div>}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nom du véhicule</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            {renderFileInput('avant', 'Avant')}
            {renderFileInput('droite', 'Droite')}
            {renderFileInput('arriere', 'Arrière')}
            {renderFileInput('gauche', 'Gauche')}
        </div>
        <div className="flex justify-end pt-4 gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="py-2 px-4 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700">Annuler</button>
          <button type="submit" disabled={loading} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
            {loading ? 'Sauvegarde...' : (vehicleToEdit ? 'Mettre à jour' : 'Ajouter')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
