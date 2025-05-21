import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';

type Agency = Database['public']['Tables']['agencies']['Row'];

const AgenciesManager: React.FC = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAgency, setNewAgency] = useState('');
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editName, setEditName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setAgencies(data || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      toast.error('Erreur lors du chargement des agences');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgency = async () => {
    if (!newAgency.trim()) {
      toast.error('Le nom de l\'agence ne peut pas être vide');
      return;
    }

    setProcessingAction(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .insert([{ name: newAgency.trim() }])
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          toast.error('Cette agence existe déjà');
        } else {
          throw error;
        }
        return;
      }
      
      setAgencies([...agencies, data]);
      setNewAgency('');
      setAddingNew(false);
      toast.success('Agence ajoutée avec succès');
    } catch (error) {
      console.error('Error adding agency:', error);
      toast.error('Erreur lors de l\'ajout de l\'agence');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateAgency = async () => {
    if (!editingAgency) return;
    if (!editName.trim()) {
      toast.error('Le nom de l\'agence ne peut pas être vide');
      return;
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ name: editName.trim() })
        .eq('id', editingAgency.id);
        
      if (error) {
        if (error.code === '23505') {
          toast.error('Cette agence existe déjà');
          return;
        }
        throw error;
      }
      
      setAgencies(agencies.map(agency => 
        agency.id === editingAgency.id ? { ...agency, name: editName.trim() } : agency
      ));
      setEditingAgency(null);
      toast.success('Agence mise à jour avec succès');
    } catch (error) {
      console.error('Error updating agency:', error);
      toast.error('Erreur lors de la mise à jour de l\'agence');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteAgency = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) {
      setProcessingAction(true);
      try {
        const { error } = await supabase
          .from('agencies')
          .delete()
          .eq('id', id);
          
        if (error) {
          if (error.code === '23503') {
            toast.error('Cette agence est utilisée par des articles et ne peut pas être supprimée');
            return;
          }
          throw error;
        }
        
        setAgencies(agencies.filter(agency => agency.id !== id));
        toast.success('Agence supprimée avec succès');
      } catch (error) {
        console.error('Error deleting agency:', error);
        toast.error('Erreur lors de la suppression de l\'agence');
      } finally {
        setProcessingAction(false);
      }
    }
  };

  const startEditing = (agency: Agency) => {
    setEditingAgency(agency);
    setEditName(agency.name);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Retour
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des agences</h1>
        
        <div className="mb-6">
          {addingNew ? (
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newAgency}
                onChange={(e) => setNewAgency(e.target.value)}
                placeholder="Nom de l'agence"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAgency();
                  }
                }}
                disabled={processingAction}
              />
              <button
                onClick={handleAddAgency}
                className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processingAction}
              >
                <Save className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setAddingNew(false);
                  setNewAgency('');
                }}
                className="p-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processingAction}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={processingAction}
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter une agence</span>
            </button>
          )}
        </div>
        
        {agencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune agence disponible. Ajoutez-en une !
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agencies.map((agency) => (
                  <tr key={agency.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingAgency?.id === agency.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleUpdateAgency();
                            }
                          }}
                          disabled={processingAction}
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingAgency?.id === agency.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleUpdateAgency}
                            className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingAgency(null)}
                            className="p-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => startEditing(agency)}
                            className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgency(agency.id)}
                            className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgenciesManager;