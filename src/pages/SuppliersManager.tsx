import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

const SuppliersManager: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSupplier, setNewSupplier] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editName, setEditName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const sortSuppliersList = (list: Supplier[]) =>
    [...list].sort((a, b) => {
      if (a.name === 'Autre') return 1;
      if (b.name === 'Autre') return -1;
      return a.name.localeCompare(b.name);
    });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(sortSuppliersList(data || []));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) {
      toast.error('Le nom du fournisseur ne peut pas être vide');
      return;
    }

    setProcessingAction(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ name: newSupplier.trim() }])
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          toast.error('Ce fournisseur existe déjà');
        } else {
          throw error;
        }
        return;
      }
      
      setSuppliers(sortSuppliersList([...suppliers, data]));
      setNewSupplier('');
      setAddingNew(false);
      toast.success('Fournisseur ajouté avec succès');
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Erreur lors de l\'ajout du fournisseur');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;
    if (!editName.trim()) {
      toast.error('Le nom du fournisseur ne peut pas être vide');
      return;
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ name: editName.trim() })
        .eq('id', editingSupplier.id);
        
      if (error) {
        if (error.code === '23505') {
          toast.error('Ce fournisseur existe déjà');
          return;
        }
        throw error;
      }
      
      const updated = suppliers.map(sup =>
        sup.id === editingSupplier.id ? { ...sup, name: editName.trim() } : sup
      );
      setSuppliers(sortSuppliersList(updated));
      setEditingSupplier(null);
      toast.success('Fournisseur mis à jour avec succès');
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Erreur lors de la mise à jour du fournisseur');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      setProcessingAction(true);
      try {
        const { error } = await supabase
          .from('suppliers')
          .delete()
          .eq('id', id);
          
        if (error) {
          if (error.code === '23503') {
            toast.error('Ce fournisseur est utilisé par des articles et ne peut pas être supprimé');
            return;
          }
          throw error;
        }
        
        setSuppliers(sortSuppliersList(suppliers.filter(sup => sup.id !== id)));
        toast.success('Fournisseur supprimé avec succès');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Erreur lors de la suppression du fournisseur');
      } finally {
        setProcessingAction(false);
      }
    }
  };

  const startEditing = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditName(supplier.name);
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des fournisseurs</h1>
        
        <div className="mb-6">
          {addingNew ? (
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                placeholder="Nom du fournisseur"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSupplier();
                  }
                }}
                disabled={processingAction}
              />
              <button
                onClick={handleAddSupplier}
                className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processingAction}
              >
                <Save className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setAddingNew(false);
                  setNewSupplier('');
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
              <span>Ajouter un fournisseur</span>
            </button>
          )}
        </div>
        
        {suppliers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun fournisseur disponible. Ajoutez-en un !
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
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSupplier?.id === supplier.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleUpdateSupplier();
                            }
                          }}
                          disabled={processingAction}
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingSupplier?.id === supplier.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleUpdateSupplier}
                            className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingSupplier(null)}
                            className="p-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => startEditing(supplier)}
                            className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
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

export default SuppliersManager;