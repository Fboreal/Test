import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';

type Category = Database['public']['Tables']['categories']['Row'];

const sortCategories = (cats: Category[]) =>
  [...cats].sort((a, b) => {
    if (a.name === 'Autre') return 1;
    if (b.name === 'Autre') return -1;
    return a.name.localeCompare(b.name);
  });

const CategoriesManager: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setCategories(sortCategories(data || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Le nom de la catégorie ne peut pas être vide');
      return;
    }

    setProcessingAction(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.trim() }])
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          toast.error('Cette catégorie existe déjà');
        } else {
          throw error;
        }
        return;
      }
      
      setCategories(sortCategories([...categories, data]));
      setNewCategory('');
      setAddingNew(false);
      toast.success('Catégorie ajoutée avec succès');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Erreur lors de l\'ajout de la catégorie');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    if (!editName.trim()) {
      toast.error('Le nom de la catégorie ne peut pas être vide');
      return;
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editName.trim() })
        .eq('id', editingCategory.id);
        
      if (error) {
        if (error.code === '23505') {
          toast.error('Cette catégorie existe déjà');
          return;
        }
        throw error;
      }
      
      setCategories(sortCategories(
        categories.map(cat =>
          cat.id === editingCategory.id ? { ...cat, name: editName.trim() } : cat
        )
      ));
      setEditingCategory(null);
      toast.success('Catégorie mise à jour avec succès');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Erreur lors de la mise à jour de la catégorie');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      setProcessingAction(true);
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
          
        if (error) {
          if (error.code === '23503') {
            toast.error('Cette catégorie est utilisée par des articles et ne peut pas être supprimée');
            return;
          }
          throw error;
        }
        
        setCategories(sortCategories(categories.filter(cat => cat.id !== id)));
        toast.success('Catégorie supprimée avec succès');
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Erreur lors de la suppression de la catégorie');
      } finally {
        setProcessingAction(false);
      }
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des catégories</h1>
        
        <div className="mb-6">
          {addingNew ? (
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nom de la catégorie"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                disabled={processingAction}
              />
              <button
                onClick={handleAddCategory}
                className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processingAction}
              >
                <Save className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setAddingNew(false);
                  setNewCategory('');
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
              <span>Ajouter une catégorie</span>
            </button>
          )}
        </div>
        
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune catégorie disponible. Ajoutez-en une !
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
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory?.id === category.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleUpdateCategory();
                            }
                          }}
                          disabled={processingAction}
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingCategory?.id === category.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleUpdateCategory}
                            className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => startEditing(category)}
                            className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processingAction}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
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

export default CategoriesManager;