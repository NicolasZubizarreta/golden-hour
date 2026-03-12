import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
      <h1 className="text-5xl font-bold text-yellow-500 mb-6">Golden Hour 🌅</h1>
      <p className="text-xl mb-8 text-gray-600 max-w-lg">
        L'application pour organiser vos meilleurs voyages et moments inoubliables entre amis ou en couple.
      </p>
      <div className="flex gap-4">
        <Link 
          to="/login" 
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Se connecter
        </Link>
        <Link 
          to="/register" 
          className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition"
        >
          Créer un compte
        </Link>
      </div>
    </div>
  );
}