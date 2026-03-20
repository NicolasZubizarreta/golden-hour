import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api, { getApiErrorMessage } from '../api/axiosConfig';
import { getInitials, getMediaUrl } from '../utils/media';

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // --- ÉTATS : INFOS PERSONNELLES ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [infoMessage, setInfoMessage] = useState({ type: '', text: '' });
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ type: '', text: '' });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // --- ÉTATS : MOT DE PASSE ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- ÉTATS : SUPPRESSION COMPTE ---
  const [isDeleting, setIsDeleting] = useState(false);
  const avatarInputRef = useRef(null);

  // Remplir les champs avec les infos de l'utilisateur au chargement
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAvatarMessage({ type: '', text: '' });
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await api.post('/users/me/avatar', formData);

      setUser(data.user);
      setAvatarMessage({ type: 'success', text: 'Avatar mis à jour avec succès.' });
      setTimeout(() => setAvatarMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setAvatarMessage({ type: 'error', text: getApiErrorMessage(err, "Erreur lors de l'envoi de l'avatar.") });
    } finally {
      event.target.value = '';
      setIsUploadingAvatar(false);
    }
  };

  // METTRE À JOUR LES INFOS (PUT /api/users/me)
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setInfoMessage({ type: '', text: '' });
    setIsUpdatingInfo(true);

    try {
      const { data } = await api.put('/users/me', { name, email });

      // On met à jour le store Zustand avec les nouvelles infos (data.user)
      setUser(data.user);
      setInfoMessage({ type: 'success', text: 'Informations mises à jour avec succès.' });
      
      // On efface le message de succès après 3s
      setTimeout(() => setInfoMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setInfoMessage({ type: 'error', text: getApiErrorMessage(err, 'Erreur lors de la mise à jour.') });
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  // METTRE À JOUR LE MOT DE PASSE (PUT /api/users/me/password)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    setIsUpdatingPassword(true);

    try {
      await api.put('/users/me/password', { oldPassword: currentPassword, newPassword });

      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: getApiErrorMessage(err, 'Erreur lors du changement de mot de passe.') });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // SUPPRIMER LE COMPTE (DELETE /api/users/me)
  const handleDeleteAccount = async () => {
    if (!window.confirm("🚨 DANGER : Voulez-vous vraiment supprimer votre compte ? Cette action est IRRÉVERSIBLE et supprimera toutes vos données.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/users/me');

      // Si succès, on déconnecte l'utilisateur (qui efface le store et le localStorage)
      logout();
      navigate('/'); // Retour à l'accueil public
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la suppression.'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <Link to="/hub" className="text-sm text-blue-500 hover:underline mb-4 inline-block">← Retour au Hub</Link>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations personnelles et la sécurité de votre compte.</p>
        </div>

        <div className="space-y-8">
          
          {/* BLOC 1 : INFOS PERSONNELLES */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Informations Personnelles</h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                {user?.avatar ? (
                  <img src={getMediaUrl(user.avatar)} alt={`Avatar de ${user.name}`} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </div>

              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                >
                  {isUploadingAvatar ? "Upload..." : "Changer l'avatar"}
                </button>
                <p className="text-xs text-gray-500 mt-2">Formats image uniquement, 5 MB maximum.</p>
              </div>
            </div>

            {avatarMessage.text && (
              <div className={`p-3 rounded mb-4 text-sm ${avatarMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {avatarMessage.text}
              </div>
            )}
            
            {infoMessage.text && (
              <div className={`p-3 rounded mb-4 text-sm ${infoMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {infoMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateInfo} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={isUpdatingInfo}
                className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                {isUpdatingInfo ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>

          {/* BLOC 2 : SÉCURITÉ */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Sécurité (Mot de passe)</h2>

            {passwordMessage.text && (
              <div className={`p-3 rounded mb-4 text-sm ${passwordMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={isUpdatingPassword}
                className="bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>

          {/* BLOC 3 : ZONE DE DANGER */}
          <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <h2 className="text-xl font-bold text-red-700 mb-2">Zone de Danger</h2>
            <p className="text-sm text-red-600 mb-4">
              La suppression de votre compte est définitive. Toutes vos données (groupes créés, participation) seront effacées.
            </p>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Suppression en cours...' : 'Supprimer mon compte définitivement'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
