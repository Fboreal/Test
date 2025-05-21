import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Package, ArrowRight } from 'lucide-react';

type FormData = {
  email: string;
  password: string;
  confirmPassword?: string;
};

const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormData>();
  
  const password = watch('password');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up flow
        const { error } = await signUp(data.email, data.password);
        if (error) {
          if (error.message.includes('email already in use')) {
            throw new Error('Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.');
          } else {
            throw error;
          }
        }
        toast.success('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
        setIsSignUp(false);
        reset({ email: data.email, password: '' });
      } else {
        // Sign in flow
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes('invalid_credentials') || error.message.includes('Invalid login credentials')) {
            throw new Error('Email ou mot de passe incorrect. Veuillez réessayer.');
          } else {
            throw error;
          }
        }
        toast.success('Connexion réussie');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error with authentication:', error.message);
      toast.error(error.message || (isSignUp 
        ? 'Échec de l\'inscription. Veuillez réessayer.' 
        : 'Échec de la connexion. Vérifiez vos identifiants.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
      <div className="flex flex-col items-center mb-6">
        <Package className="h-12 w-12 text-orange-600 mb-2" />
        <h1 className="text-2xl font-bold text-gray-800">
          {isSignUp ? 'Créer un compte Etandstock' : 'Connexion à Etandstock'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email', { 
              required: 'L\'email est requis',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Adresse email invalide'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            {...register('password', { 
              required: 'Le mot de passe est requis',
              minLength: isSignUp ? {
                value: 6,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
              } : undefined
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={loading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        
        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', { 
                required: 'Veuillez confirmer votre mot de passe',
                validate: value => value === password || 'Les mots de passe ne correspondent pas'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            'Chargement...'
          ) : isSignUp ? (
            'Créer un compte'
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
      
      <div className="mt-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="px-4 text-sm text-gray-500">ou</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <button
        onClick={toggleMode}
        className="w-full mt-4 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
      >
        {isSignUp ? 'J\'ai déjà un compte' : 'Créer un nouveau compte'}
        <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    </div>
  );
};

export default Login;