import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Upload, Loader2, Camera, X, Calculator, AlertTriangle, Plus } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';

type FormData = {
  name: string;
  category: string;
  supplier: string;
  agency: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  unit_price: number;
  description: string;
};

export default function ArticleForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewSupplierInput, setShowNewSupplierInput] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [addingSupplier, setAddingSupplier] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, suppliersRes, agenciesRes] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('suppliers').select('*'),
          supabase.from('agencies').select('*'),
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (suppliersRes.error) throw suppliersRes.error;
        if (agenciesRes.error) throw agenciesRes.error;

        setCategories(categoriesRes.data || []);
        setSuppliers(suppliersRes.data || []);
        setAgencies(agenciesRes.data || []);

        if (id) {
          const { data: article, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (article) {
            setValue('name', article.name);
            setValue('category', article.category);
            setValue('supplier', article.supplier);
            setValue('agency', article.agency);
            setValue('quantity', article.quantity);
            setValue('unit', article.unit);
            setValue('expiry_date', article.expiry_date?.split('T')[0]);
            setValue('unit_price', article.unit_price);
            setValue('description', article.description);
            setImageUrl(article.image_url);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };

    fetchData();
  }, [id, setValue]);

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) {
      toast.error('Le nom du fournisseur ne peut pas être vide');
      return;
    }

    setAddingSupplier(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ name: newSupplierName.trim() }])
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

      setSuppliers([...suppliers, data]);
      setValue('supplier', data.name);
      setNewSupplierName('');
      setShowNewSupplierInput(false);
      toast.success('Fournisseur ajouté avec succès');
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Erreur lors de l\'ajout du fournisseur');
    } finally {
      setAddingSupplier(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const articleData = {
        ...data,
        expiry_date: data.expiry_date || null,
        user_id: user.id,
        image_url: imageUrl,
        total_price: data.quantity * (data.unit_price || 0),
      };

      let error;

      if (id) {
        ({ error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id));
      } else {
        ({ error } = await supabase.from('articles').insert([articleData]));
      }

      if (error) throw error;

      toast.success(id ? 'Article modifié avec succès' : 'Article créé avec succès');
      navigate('/');
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('articles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success('Image téléchargée avec succès');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCameraCapture = async (imageBlob: Blob) => {
    try {
      setUploadingImage(true);
      setShowCamera(false);

      const fileName = `${Math.random()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('articles')
        .upload(fileName, imageBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success('Photo capturée avec succès');
    } catch (error) {
      console.error('Error uploading camera image:', error);
      toast.error('Erreur lors de l\'enregistrement de la photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const quantity = watch('quantity') || 0;
  const unitPrice = watch('unit_price') || 0;
  const totalPrice = quantity * unitPrice;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour au tableau de bord
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {id ? 'Modifier l\'article' : 'Nouvel article'}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  {...register('name', { required: 'Le nom est requis' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                <select
                  {...register('category', { required: 'La catégorie est requise' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
                <div className="mt-1 flex space-x-2">
                  {showNewSupplierInput ? (
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        placeholder="Nom du nouveau fournisseur"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSupplier}
                        disabled={addingSupplier}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {addingSupplier ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          'Ajouter'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewSupplierInput(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <select
                        {...register('supplier', { required: 'Le fournisseur est requis' })}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un fournisseur</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewSupplierInput(true)}
                        className="px-3 py-2 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {errors.supplier && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplier.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Agence</label>
                <select
                  {...register('agency', { required: 'L\'agence est requise' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une agence</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.name}>
                      {agency.name}
                    </option>
                  ))}
                </select>
                {errors.agency && (
                  <p className="mt-1 text-sm text-red-600">{errors.agency.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantité</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('quantity', {
                    required: 'La quantité est requise',
                    min: { value: 0, message: 'La quantité doit être positive' },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unité</label>
                <input
                  type="text"
                  {...register('unit', { required: 'L\'unité est requise' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date d'expiration</label>
                <input
                  type="date"
                  {...register('expiry_date')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prix unitaire</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    {...register('unit_price', {
                      min: { value: 0, message: 'Le prix unitaire doit être positif' },
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {errors.unit_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit_price.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Télécharger une image
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  disabled={uploadingImage}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Prendre une photo
                </button>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt="Article"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700">
                  <Calculator className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Prix total:</span>
                </div>
                <span className="text-lg font-semibold">{totalPrice.toFixed(2)} €</span>
              </div>
              {(quantity === 0 || unitPrice === 0) && (
                <div className="flex items-center mt-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {quantity === 0
                      ? 'Veuillez entrer une quantité'
                      : unitPrice === 0
                      ? 'Veuillez entrer un prix unitaire'
                      : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer l\'article'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}