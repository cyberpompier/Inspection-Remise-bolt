import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import type { UserProfileUpdate } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState<UserProfileUpdate>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        rank: profile.rank || '',
        caserne: profile.caserne || '',
        avatar_url: profile.avatar_url || '',
      });
    }
    setError(null);
    setSuccess(false);
  }, [isOpen, profile]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Filter out unchanged values to send a smaller payload
    const updates: UserProfileUpdate = {};
    if (formData.name !== (profile?.name || '')) updates.name = formData.name;
    if (formData.rank !== (profile?.rank || '')) updates.rank = formData.rank;
    if (formData.caserne !== (profile?.caserne || '')) updates.caserne = formData.caserne;
    if (formData.avatar_url !== (profile?.avatar_url || '')) updates.avatar_url = formData.avatar_url;

    if (Object.keys(updates).length === 0) {
      setSuccess(true); // Nothing to update
      setLoading(false);
      setTimeout(() => onClose(), 1500);
      return;
    }

    try {
      await updateProfile(updates);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le profil">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md text-center">{error}</div>}
        {success && <div className="bg-green-900/50 text-green-300 p-3 rounded-md text-center">Profil mis à jour avec succès !</div>}
        
        <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nom</label>
            <input
                id="name"
                name="name"
                type="text"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || success}
            />
        </div>

        <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-300">Grade</label>
            <input
                id="rank"
                name="rank"
                type="text"
                value={formData.rank || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || success}
            />
        </div>

        <div>
            <label htmlFor="caserne" className="block text-sm font-medium text-gray-300">Caserne</label>
            <input
                id="caserne"
                name="caserne"
                type="text"
                value={formData.caserne || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || success}
            />
        </div>
        
        <div>
            <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-300">URL de l'avatar</label>
            <input
                id="avatar_url"
                name="avatar_url"
                type="text"
                value={formData.avatar_url || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || success}
                placeholder="https://example.com/avatar.png"
            />
        </div>

        <div className="flex justify-end pt-4">
            <button
                type="button"
                onClick={onClose}
                disabled={loading || success}
                className="mr-3 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50"
            >
                Annuler
            </button>
            <button 
                type="submit"
                disabled={loading || success}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
        </div>
      </form>
    </Modal>
  );
};
