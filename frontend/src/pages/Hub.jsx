import useAuthStore from '../store/authStore';

export default function Hub() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Mon Hub (Accueil des groupes)</h1>
      <button onClick={logout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
        Se déconnecter
      </button>
    </div>
  );
}