import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Package, Calendar, DollarSign, AlertCircle, FileText, ZoomIn } from 'lucide-react';
import { format, isAfter, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import ImageViewer from '../components/ImageViewer';

type Article = Database['public']['Tables']['articles']['Row'];

const ArticleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreviewMode, setImagePreviewMode] = useState<'contain' | 'cover'>('contain');
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setArticle(data);
      } catch (error) {
        console.error('Error fetching article:', error);
        toast.error('Erreur lors du chargement de l\'article');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!article) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        const { error } = await supabase
          .from('articles')
          .delete()
          .eq('id', article.id);
          
        if (error) throw error;
        toast.success('Article supprimé avec succès');
        navigate('/');
      } catch (error) {
        console.error('Error deleting article:', error);
        toast.error('Erreur lors de la suppression de l\'article');
      }
    }
  };

  const toggleImagePreviewMode = () => {
    setImagePreviewMode(prev => prev === 'contain' ? 'cover' : 'contain');
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Article non trouvé</h2>
        <p className="text-gray-600 mb-6">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const expiryStatus = getExpiryStatus(article);

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Retour
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gray-100 flex items-center justify-center">
            {article.image_url ? (
              <div className="relative w-full h-full max-h-96 flex items-center justify-center p-4">
                <img 
                  src={article.image_url} 
                  alt={article.name} 
                  className={`max-w-full max-h-full object-${imagePreviewMode} cursor-pointer`}
                  onClick={() => setShowFullscreenImage(true)}
                />
                <button
                  type="button"
                  onClick={toggleImagePreviewMode}
                  className="absolute bottom-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 transition-colors"
                  title={imagePreviewMode === 'contain' ? 'Passer en mode remplissage' : 'Passer en mode contenu'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {imagePreviewMode === 'contain' 
                      ? <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /> // expand
                      : <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />} {/* compress */}
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullscreenImage(true)}
                  className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 transition-colors"
                  title="Voir en plein écran"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                {expiryStatus === 'expired' && (
                  <div className="absolute top-2 right-2 translate-x-12 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                    Périmé
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full min-h-64 flex items-center justify-center">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{article.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    {article.category}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {article.agency}
                  </span>
                  {expiryStatus === 'expired' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Périmé
                    </span>
                  )}
                  {expiryStatus === 'expiring-soon' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Expire bientôt
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/articles/edit/${article.id}`}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Edit className="h-5 w-5 text-gray-600" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </div>
            
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Informations détaillées</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Quantité</h3>
                  <p className="text-lg font-semibold text-gray-800">
                    {article.quantity} {article.unit}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fournisseur</h3>
                  <p className="text-lg font-semibold text-gray-800">{article.supplier}</p>
                </div>
                
                {article.unit_price !== null && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Prix unitaire</h3>
                    <p className="text-lg font-semibold text-gray-800 flex items-center">
                       <DollarSign className="h-5 w-5 mr-1 text-green-500" />
                      {article.unit_price === 0 ? (
                        <span className="text-green-600">Gratuit</span>
                      ) : (
                        `${article.unit_price.toFixed(2)} €`
                      )}
                    </p>
                  </div>
                )}
                
                {article.total_price !== null && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Prix total</h3>
                    <p className="text-lg font-semibold text-gray-800 flex items-center">
                      <DollarSign className="h-5 w-5 mr-1 text-green-500" />
                      {article.total_price === 0 ? (
                        <span className="text-green-600">Gratuit</span>
                      ) : (
                        `${article.total_price.toFixed(2)} €`
                      )}
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date de mise à jour</h3>
                  <p className="text-lg font-semibold text-gray-800">
                    {format(new Date(article.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                
                {article.expiry_date && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date de péremption</h3>
                    <p
                      className={`text-lg flex items-center ${
                        expiryStatus === 'expired' || expiryStatus === 'expiring-soon'
                          ? 'font-bold text-red-600'
                          : 'font-semibold text-gray-800'
                      }`}
                    >
                      <Calendar
                        className={`h-5 w-5 mr-1 ${
                          expiryStatus === 'expired' || expiryStatus === 'expiring-soon'
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                      />
                      {format(new Date(article.expiry_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                 </div>
               )}
              </div>
            </div>

            {/* Section de description */}
            {article.description && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-500" />
                  Description
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {article.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Retour à la liste
              </Link>
              <Link
                to={`/articles/edit/${article.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier l'article
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {showFullscreenImage && article.image_url && (
        <ImageViewer 
          imageUrl={article.image_url} 
          alt={article.name} 
          onClose={() => setShowFullscreenImage(false)} 
        />
      )}
    </div>
  );
};

export default ArticleDetails;