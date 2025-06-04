import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Search, Filter, Package, Calendar, Trash2, Edit, DollarSign, AlertCircle, Plus, ZoomIn, MoreVertical, MessageCircle } from 'lucide-react';
import { format, isAfter, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import ImageViewer from '../components/ImageViewer';

type Article = Database['public']['Tables']['articles']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type Agency = Database['public']['Tables']['agencies']['Row'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    agency: '',
    expiryStatus: '', // 'expired', 'expiring-soon', 'valid'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<{field: string, direction: 'asc' | 'desc'}>({
    field: 'created_at',
    direction: 'desc'
  });
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [fullscreenImage, setFullscreenImage] = useState<{url: string, alt: string} | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (articlesError) throw articlesError;
        setArticles(articlesData || []);
        setFilteredArticles(articlesData || []);

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        setCategories(categoriesData || []);

        // Fetch suppliers
        const { data: suppliersData } = await supabase
          .from('suppliers')
          .select('*')
          .order('name');
        setSuppliers(suppliersData || []);

        // Fetch agencies
        const { data: agenciesData } = await supabase
          .from('agencies')
          .select('*')
          .order('name');
        setAgencies(agenciesData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('articles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'articles' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setArticles(prev => [payload.new as Article, ...prev]);
          toast.success('Nouvel article ajouté !');
        } else if (payload.eventType === 'UPDATE') {
          setArticles(prev => 
            prev.map(article => 
              article.id === payload.new.id ? payload.new as Article : article
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setArticles(prev => 
            prev.filter(article => article.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Fonction pour normaliser le texte (enlever les accents, mettre en minuscule)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Fonction pour vérifier si un texte contient un terme de recherche
  const textContainsSearchTerm = (text: string, term: string): boolean => {
    const normalizedText = normalizeText(text);
    const normalizedTerm = normalizeText(term);
    return normalizedText.includes(normalizedTerm);
  };

  // Générer des suggestions de recherche basées sur le terme actuel
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const normalizedSearchTerm = normalizeText(searchTerm);
    
    // Collecter tous les termes possibles pour les suggestions
    const allTerms = new Set<string>();
    
    // Ajouter les noms d'articles
    articles.forEach(article => {
      if (textContainsSearchTerm(article.name, searchTerm)) {
        allTerms.add(article.name);
      }
    });
    
    // Ajouter les noms de fournisseurs
    suppliers.forEach(supplier => {
      if (textContainsSearchTerm(supplier.name, searchTerm)) {
        allTerms.add(supplier.name);
      }
    });
    
    // Ajouter les noms de catégories
    categories.forEach(category => {
      if (textContainsSearchTerm(category.name, searchTerm)) {
        allTerms.add(category.name);
      }
    });
    
    // Ajouter les noms d'agences
    agencies.forEach(agency => {
      if (textContainsSearchTerm(agency.name, searchTerm)) {
        allTerms.add(agency.name);
      }
    });
    
    // Convertir en tableau et limiter à 5 suggestions
    const suggestions = Array.from(allTerms).slice(0, 5);
    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [searchTerm, articles, suppliers, categories, agencies]);

  // Vérifier si un article est expiré ou expire bientôt
  const getExpiryStatus = (article: Article): 'expired' | 'expiring-soon' | 'valid' | null => {
    if (!article.expiry_date) return null;

    const today = new Date();
    const expiryDate = new Date(article.expiry_date);

    if (isBefore(expiryDate, today)) {
      return 'expired';
    } else if (isBefore(expiryDate, addDays(today, 15))) {
      return 'expiring-soon';
    } else {
      return 'valid';
    }
  };

  // Toggle description expansion
  const toggleDescriptionExpand = (articleId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  // Toggle action menu
  const toggleActionMenu = (articleId: string) => {
    setOpenActionMenuId(prev => prev === articleId ? null : articleId);
  };

  const getCategoryStyles = (category: string) =>
    category.toLowerCase() === 'résine'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-blue-100 text-blue-800';

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionMenuId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = articles;
    
    // Apply search term with improved search
    if (searchTerm) {
      result = result.filter(article => {
        // Recherche dans le nom de l'article
        if (textContainsSearchTerm(article.name, searchTerm)) {
          return true;
        }
        
        // Recherche dans la catégorie
        if (textContainsSearchTerm(article.category, searchTerm)) {
          return true;
        }
        
        // Recherche dans le fournisseur
        if (textContainsSearchTerm(article.supplier, searchTerm)) {
          return true;
        }
        
        // Recherche dans l'agence
        if (textContainsSearchTerm(article.agency, searchTerm)) {
          return true;
        }
        
        return false;
      });
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(article => article.category === filters.category);
    }
    
    // Apply supplier filter
    if (filters.supplier) {
      result = result.filter(article => article.supplier === filters.supplier);
    }
    
    // Apply agency filter
    if (filters.agency) {
      result = result.filter(article => article.agency === filters.agency);
    }

    // Apply expiry status filter
    if (filters.expiryStatus) {
      result = result.filter(article => {
        const status = getExpiryStatus(article);
        return status === filters.expiryStatus;
      });
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy.field) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'quantity':
          valueA = a.quantity;
          valueB = b.quantity;
          break;
        case 'unit_price':
          valueA = a.unit_price || 0;
          valueB = b.unit_price || 0;
          break;
        case 'total_price':
          valueA = a.total_price || 0;
          valueB = b.total_price || 0;
          break;
        case 'expiry_date':
          valueA = a.expiry_date ? new Date(a.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
          valueB = b.expiry_date ? new Date(b.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
          break;
        case 'created_at':
        default:
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
      }
      
      if (sortBy.direction === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredArticles(result);
  }, [articles, searchTerm, filters, sortBy]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        const { error } = await supabase
          .from('articles')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setArticles(prev => prev.filter(article => article.id !== id));
        setFilteredArticles(prev => prev.filter(article => article.id !== id));
        setOpenActionMenuId(null);

        toast.success('Article supprimé avec succès');
      } catch (error) {
        console.error('Error deleting article:', error);
        toast.error('Erreur lors de la suppression de l\'article');
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      supplier: '',
      agency: '',
      expiryStatus: '',
    });
    setSearchTerm('');
    setSortBy({
      field: 'created_at',
      direction: 'desc'
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Liste des articles</h1>
        </div>
        
        {/* Bouton d'ajout d'article - visible uniquement sur les écrans non-mobiles */}
        {user && (
          <Link 
            to="/articles/new" 
            className="hidden md:flex items-center space-x-1 px-4 py-2 mt-4 md:mt-0 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un article</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un article, fournisseur, catégorie..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => {
                e.stopPropagation();
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-orange-50 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSuggestionClick(suggestion);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="bg-orange-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                  Fournisseur
                </label>
                <select
                  id="supplier"
                  value={filters.supplier}
                  onChange={(e) => setFilters({...filters, supplier: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Tous les fournisseurs</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="agency" className="block text-sm font-medium text-gray-700 mb-1">
                  Agence
                </label>
                <select
                  id="agency"
                  value={filters.agency}
                  onChange={(e) => setFilters({...filters, agency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Toutes les agences</option>
                  {agencies.map(agency => (
                    <option key={agency.id} value={agency.name}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="expiryStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Statut de péremption
                </label>
                <select
                  id="expiryStatus"
                  value={filters.expiryStatus}
                  onChange={(e) => setFilters({...filters, expiryStatus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="expired">Périmés</option>
                  <option value="expiring-soon">Expire bientôt (30 jours)</option>
                  <option value="valid">Valides</option>
                </select>
              </div>

              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Trier par
                </label>
                <div className="flex space-x-2">
                  <select
                    id="sortBy"
                    value={sortBy.field}
                    onChange={(e) => handleSort(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="created_at">Date d'ajout</option>
                    <option value="name">Nom</option>
                    <option value="quantity">Quantité</option>
                    <option value="unit_price">Prix unitaire</option>
                    <option value="total_price">Prix total</option>
                    <option value="expiry_date">Date de péremption</option>
                  </select>
                  <button
                    onClick={() => setSortBy(prev => ({...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc'}))}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    title={sortBy.direction === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
                  >
                    {sortBy.direction === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-orange-600 hover:text-orange-800 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bouton d'ajout d'article pour mobile - visible uniquement sur les écrans mobiles */}
      {user && (
        <div className="md:hidden mb-6">
          <Link 
            to="/articles/new" 
            className="flex items-center justify-center space-x-1 w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Ajouter un article</span>
          </Link>
        </div>
      )}

      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun article trouvé</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filters.category || filters.supplier || filters.agency || filters.expiryStatus
              ? "Aucun article ne correspond à vos critères de recherche."
              : "Commencez par ajouter votre premier article."}
          </p>
          {searchTerm || filters.category || filters.supplier || filters.agency || filters.expiryStatus ? (
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Réinitialiser les filtres
            </button>
          ) : (
            <Link
              to="/articles/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Ajouter un article
            </Link>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArticles.map(article => {
              const expiryStatus = getExpiryStatus(article);
              const hasDescription = article.description && article.description.trim().length > 0;
              const isDescriptionExpanded = expandedDescriptions.has(article.id);
              
              return (
                <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 sm:h-48 bg-gray-200 relative">
                    {article.image_url ? (
                      <div className="w-full h-full overflow-hidden">
                        <img
                          src={article.image_url}
                          alt={article.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setFullscreenImage({url: article.image_url!, alt: article.name})}
                        />
                        <button
                          onClick={() => setFullscreenImage({url: article.image_url!, alt: article.name})}
                          className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          title="Voir en plein écran"
                        >
                          <ZoomIn className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Menu d'actions */}
                    <div className="absolute top-2 right-2">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActionMenu(article.id);
                          }}
                          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                        
                        {openActionMenuId === article.id && (
                          <div 
                            className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              to={`/articles/${article.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              Voir les détails
                            </Link>
                            <Link
                              to={`/articles/edit/${article.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <span className="flex items-center">
                                <Edit className="h-4 w-4 mr-2 text-blue-500" />
                                Modifier
                              </span>
                            </Link>
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                            >
                              <span className="flex items-center">
                                <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                Supprimer
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                      {expiryStatus === 'expired' && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Périmé
                        </div>
                      )}
                    
                    {expiryStatus === 'expiring-soon' && (
                      <div className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expire bientôt
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/articles/${article.id}`} className="flex-1">
                        <h2 className="text-lg font-bold text-gray-800 hover:text-orange-600 transition-colors">
                          {article.name}
                        </h2>
                      </Link>
                      <div className="flex items-center text-sm text-gray-600 ml-2" title="Quantité">
                        <Package className="h-4 w-4 mr-1" />
                        <span className="font-medium">{article.quantity} {article.unit}</span>
                      </div>
                    </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryStyles(article.category)}`}>
                          {article.category}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {article.agency}
                        </span>
                      </div>

                    
                    {/* Description - affichée uniquement si elle existe */}
                    {hasDescription && (
                      <div className="mt-2 mb-3">
                        <div className="flex items-start text-sm text-gray-600">
                          <MessageCircle className="h-4 w-4 mr-1 mt-0.5 text-orange-500 flex-shrink-0" title="Remarque" />
                          <div>
                            <p className={isDescriptionExpanded ? "" : "line-clamp-2"}>
                              {article.description}
                            </p>
                            {article.description && article.description.length > 100 && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleDescriptionExpand(article.id);
                                }}
                                className="text-orange-600 hover:text-orange-800 text-xs mt-1 font-medium"
                              >
                                {isDescriptionExpanded ? "Voir moins" : "Voir plus"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 space-y-1">
                      {article.unit_price !== null && (
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-1 text-green-500" title="Prix unitaire" />
                          <span className={article.unit_price === 0 ? "text-green-600 font-medium" : "text-gray-700"}>
                            Prix unitaire: {article.unit_price === 0 ? 'Gratuit' : `${article.unit_price.toFixed(2)} €`}
                          </span>
                        </div>
                      )}
                      
                      {article.total_price !== null && (
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="h-4 w-4 mr-1 text-green-500" title="Prix total" />
                          <span className={article.total_price === 0 ? "text-green-600 font-medium" : "text-gray-700"}>
                            Prix total: {article.total_price === 0 ? 'Gratuit' : `${article.total_price.toFixed(2)} €`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                      {article.expiry_date && (
                        <div className="flex items-center text-sm mt-2"
                          style={{
                            color: expiryStatus === 'expired' ? '#e53e3e' :
                                   expiryStatus === 'expiring-soon' ? '#dd6b20' :
                                   '#718096'
                          }}
                        >
                            <Calendar className="h-4 w-4 mr-1" title="Date d'expiration" />
                          <span className="font-semibold">
                            {expiryStatus === 'expired' ? 'Expiré le ' : 'Expire le '}
                            {format(new Date(article.expiry_date), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      )}

                      <div className="bg-gray-50 p-2 rounded-md text-sm text-gray-600 space-y-1 mt-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" title="Date d'ajout" />
                          <span>
                            Ajouté le {format(new Date(article.created_at), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" title="Fournisseur" />
                          <span>{article.supplier}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <ImageViewer 
          imageUrl={fullscreenImage.url} 
          alt={fullscreenImage.alt} 
          onClose={() => setFullscreenImage(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
