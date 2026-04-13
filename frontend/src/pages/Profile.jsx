import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api, { getApiErrorMessage } from '../api/axiosConfig';
import { getInitials, getMediaUrl } from '../utils/media';

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const firstName = user?.name?.trim()?.split(/\s+/)?.[0] || 'Aventurier';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [infoMessage, setInfoMessage] = useState({ type: '', text: '' });
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ type: '', text: '' });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarMessage({ type: '', text: '' });
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await api.post('/users/me/avatar', formData);
      setUser(data.user);
      setAvatarMessage({ type: 'success', text: 'Avatar mis a jour avec succes.' });
      setTimeout(() => setAvatarMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setAvatarMessage({ type: 'error', text: getApiErrorMessage(err, "Erreur lors de l'envoi de l'avatar.") });
    } finally {
      event.target.value = '';
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setInfoMessage({ type: '', text: '' });
    setIsUpdatingInfo(true);

    try {
      const { data } = await api.put('/users/me', { name, email });
      setUser(data.user);
      setInfoMessage({ type: 'success', text: 'Informations mises a jour avec succes.' });
      setTimeout(() => setInfoMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setInfoMessage({ type: 'error', text: getApiErrorMessage(err, 'Erreur lors de la mise a jour.') });
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    setIsUpdatingPassword(true);

    try {
      await api.put('/users/me/password', { oldPassword: currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Mot de passe modifie avec succes.' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: getApiErrorMessage(err, 'Erreur lors du changement de mot de passe.') });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('DANGER : Voulez-vous vraiment supprimer votre compte ? Cette action est irreversible et supprimera toutes vos donnees.')) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.delete('/users/me');
      logout();
      navigate('/');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la suppression.'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-golden-bg from-80% to-[#faeec5] font-inter text-golden-text">
      <header className="relative z-20 bg-golden-bg shadow-halo">
        <div className="container-golden py-[32px] flex justify-start md:justify-between items-start md:items-center gap-6">
          <Link to="/hub" className="flex w-full min-w-0 items-center gap-4 justify-start hover:scale-[1.02] transition-transform cursor-pointer md:w-auto">
            <div className="w-14 h-14 shrink-0 rounded-golden overflow-hidden bg-gray-200 shadow-halo flex items-center justify-center text-lg font-bold text-gray-500">
              {user?.avatar ? (
                <img src={getMediaUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.name || 'A')
              )}
            </div>
            <h1 className="min-w-0 flex-1 truncate whitespace-nowrap font-outfit font-black text-2xl uppercase tracking-wider text-gray-900 text-left md:flex-none md:overflow-visible md:text-clip md:whitespace-normal">
              Bonjour, {firstName} 👋
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={logout} className="px-6 py-3 bg-red-100 text-red-500 font-bold rounded-golden shadow-halo hover:bg-red-200 transition text-sm cursor-pointer">
              Deconnexion
            </button>
            <Link to="/profile" className="w-12 h-12 bg-[#fef2cd] text-golden-primary shadow-halo rounded-golden flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container-golden py-[48px] flex flex-col items-center justify-center">
        <div className="w-full max-w-lg space-y-8 flex flex-col items-center">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-golden overflow-hidden bg-gray-200 shadow-halo border-4 border-golden-bg flex items-center justify-center text-3xl font-bold text-gray-500">
                {user?.avatar ? (
                  <img src={getMediaUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.name || 'A')
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-1 right-1 bg-golden-primary text-golden-text w-10 h-10 rounded-golden flex items-center justify-center shadow-halo hover:scale-110 transition-transform cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <h2 className="text-3xl font-outfit font-black text-gray-900 text-center">Informations Personnelles</h2>
            <p className="text-sm text-golden-muted text-center">Gerez vos informations et preferences</p>

            {avatarMessage.text && (
              <div className={`mt-4 p-3 rounded-golden text-sm font-medium w-full text-center shadow-halo ${avatarMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {avatarMessage.text}
              </div>
            )}
          </div>

          <div className="bg-golden-card p-8 rounded-golden shadow-halo w-full">
            {infoMessage.text && (
              <div className={`p-3 rounded-golden mb-6 text-sm text-center font-medium shadow-halo ${infoMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {infoMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateInfo} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Nom</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-golden-input shadow-creuse rounded-golden py-3.5 pl-12 pr-5 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Email</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-golden-input shadow-creuse rounded-golden py-3.5 pl-12 pr-5 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingInfo}
                className="w-full bg-golden-primary text-golden-text font-bold text-sm py-4 rounded-golden shadow-halo hover:scale-[1.02] transition-transform mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                {isUpdatingInfo ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>

          <div className="bg-golden-card p-8 rounded-golden shadow-halo w-full">
            {passwordMessage.text && (
              <div className={`p-3 rounded-golden mb-6 text-sm text-center font-medium shadow-halo ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Mot de passe actuel</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-golden-input shadow-creuse rounded-golden py-3.5 pl-12 pr-5 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Nouveau mot de passe</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-golden-input shadow-creuse rounded-golden py-3.5 pl-12 pr-5 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-golden-primary text-golden-text font-bold text-sm py-4 rounded-golden shadow-halo hover:scale-[1.02] transition-transform mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                {isUpdatingPassword ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>

          <div className="bg-[#ffcccc] p-8 rounded-golden w-full text-center shadow-halo">
            <h2 className="text-xl font-black text-red-600 mb-2 uppercase tracking-wide">Zone de Danger</h2>
            <p className="text-xs font-bold text-red-600 mb-6 px-4">
              La suppression de votre compte est definitive. Toutes vos donnees (groupes crees, participation) seront effacees.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full bg-red-600 text-white font-bold text-sm py-4 rounded-golden shadow-halo hover:bg-red-700 hover:scale-[1.02] transition-transform cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="mx-auto flex max-w-full items-center justify-center gap-2 px-4">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                <span className="text-center">{isDeleting ? 'Suppression...' : 'Supprimer mon compte definitivement'}</span>
              </span>
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full flex justify-center gap-6 text-xs font-bold text-golden-muted pb-10">
        <Link to="/privacy" className="hover:text-golden-text flex items-center gap-1 cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          Securite
        </Link>
        <button onClick={logout} className="hover:text-golden-text flex items-center gap-1 cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Deconnexion
        </button>
      </footer>
    </div>
  );
}

