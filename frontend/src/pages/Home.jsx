import { Link } from 'react-router-dom';
import { HiUserGroup } from 'react-icons/hi2';
import { MdDashboardCustomize } from 'react-icons/md';
import { BsImageFill, BsMusicNoteBeamed } from 'react-icons/bs';

export default function Home() {
  return (
    <div className="min-h-screen bg-golden-bg flex flex-col font-inter">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-10 py-[32px]">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpeg" alt="Golden Hour logo" className="w-10 h-10 rounded-full object-cover shadow-halo" />
          <span className="font-outfit font-extrabold text-md tracking-[0.15em] uppercase text-golden-text">
            Golden Hour
          </span>
        </div>

        <Link
          to="/login"
          className="border border-golden-text/30 text-golden-text text-md font-inter rounded-full px-5 py-2 hover:bg-golden-text hover:text-white transition"
        >
          Connexion
        </Link>
      </nav>

      {/* ── Hero ── */}
      <main className="flex flex-col lg:flex-row flex-1 items-center px-10 gap-12 pb-10 py-[48px]">

        <div className="flex-1 max-w-xl">
          <h1 className="font-outfit font-extrabold leading-[0.9] tracking-tight uppercase text-golden-text"
            style={{ fontSize: 'clamp(4rem, 9vw, 8rem)' }}>
            Planifies<br />
            Tes<br />
            <span className="text-golden-primary">Meilleurs</span><br />
            Moments
          </h1>

          <p className="mt-7 text-golden-muted text-base leading-relaxed max-w-sm">
            Organisez vos aventures avec style. La plateforme sociale conçue pour
            transformer vos projets en souvenirs inoubliables.
          </p>

          <div className="mt-9 flex gap-4">
            <Link
              to="/register"
              className="bg-golden-primary text-golden-text font-outfit font-bold uppercase tracking-widest text-md px-8 py-4 rounded-full hover:brightness-95 transition"
            >
              S'inscrire
            </Link>
            <Link
              to="/login"
              className="bg-golden-text text-white font-outfit font-bold uppercase tracking-widest text-md px-8 py-4 rounded-full hover:bg-gray-800 transition"
            >
              Se connecter
            </Link>
          </div>
        </div>

        {/* Right – visual card + widgets */}
        <div className="flex-1 w-full relative flex items-center justify-center" style={{ minHeight: '480px' }}>

          {/* Main white card */}
          <div className="w-full max-w-160 h-130 bg-golden-card rounded-4xl shadow-halo relative overflow-visible">

            {/* Weather widget – top right, slightly outside */}
            <div className="absolute -top-4 right-6 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-halo text-sm font-inter text-golden-text">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBD23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span>24°C Soleil</span>
            </div>

            {/* Music widget – bottom left, overlapping card edge */}
            <div className="absolute bottom-12 -left-14 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-halo">
              <div className="w-10 h-10 rounded-full bg-golden-primary flex items-center justify-center shrink-0">
                <BsMusicNoteBeamed className="text-white text-sm" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-golden-muted uppercase tracking-widest leading-none mb-0.5">
                  Now Playing
                </p>
                <p className="text-sm font-semibold text-golden-text leading-none">
                  Golden Hour – JVKE
                </p>
              </div>
            </div>

            {/* Polaroid card – bottom right, overlapping card */}
            <div className="absolute -bottom-10 lg:-bottom-32 right-6 rotate-6 bg-white p-4 pb-10 shadow-xl w-36 lg:w-64 flex flex-col gap-3">
              <div className="w-full h-28 lg:h-52 bg-blue-100/60 rounded-sm" />
              <p className="text-xs font-inter font-bold text-golden-text tracking-widest uppercase text-center">
                Summer '24
              </p>
            </div>

          </div>
        </div>

      </main>

      {/* ── Features section ── */}
      <section className="px-10 py-[48px]">
        {/* Title */}
        <h2 className="font-outfit font-extrabold uppercase text-center mb-14"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <span className="text-golden-text">Conçu pour </span>
          <span className="text-blue-500">L'Action</span>
        </h2>

        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-6">

          {/* Card 1 – Groupes Amis */}
          <div className="bg-golden-card rounded-3xl p-8 shadow-halo flex flex-col gap-5">
            <div className="w-14 h-14 rounded-2xl bg-golden-primary flex items-center justify-center">
              <HiUserGroup className="text-white text-2xl" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-3xl leading-tight mb-3">
                Groupes Amis
              </h3>
              <p className="text-golden-muted text-sm leading-relaxed">
                Créez des espaces dédiés pour vos cercles d'amis ou couples et planifiez ensemble sans limite.
              </p>
            </div>
          </div>

          {/* Card 2 – Widgets Interactifs */}
          <div className="bg-golden-card rounded-3xl p-8 shadow-halo flex flex-col gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <MdDashboardCustomize className="text-blue-500 text-2xl" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-3xl leading-tight mb-3">
                Widgets<br />Interactifs
              </h3>
              <p className="text-golden-muted text-sm leading-relaxed">
                Intégrez des listes de tâches partagées et des points de rendez-vous sur carte en un clic.
              </p>
            </div>
          </div>

          {/* Card 3 – Souvenirs Partagés */}
          <div className="bg-golden-card rounded-3xl p-8 shadow-halo flex flex-col gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BsImageFill className="text-golden-text text-2xl" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-3xl leading-tight mb-3">
                Souvenirs<br />Partagés
              </h3>
              <p className="text-golden-muted text-sm leading-relaxed">
                Archivez vos meilleurs moments dans des albums photos collectifs accessibles à tout moment.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
