import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import type { LoginCredentials } from '../../types';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = React.useState<LoginCredentials>({ username: '', password: '' });
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(formData);
      toast.success('Bienvenido!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Credenciales invalidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Papeleria POS</h1>
          <p className="text-gray-400 mt-2">Inicie sesion para continuar</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Input
              label="Usuario"
              type="text"
              placeholder="Usuario"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <Button type="submit" className="w-full" loading={isLoading}>
              Iniciar Sesion
            </Button>
          </form>


        </Card>
      </div>
    </div>
  );
};
