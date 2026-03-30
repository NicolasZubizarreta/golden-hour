import { Link } from 'react-router-dom';
import { HiUserGroup } from 'react-icons/hi2';
import { MdDashboardCustomize, MdOutlineVisibility } from 'react-icons/md';
import { BsImageFill, BsMusicNoteBeamed } from 'react-icons/bs';

export default function Home() {
  return (
    <div className="min-h-screen bg-golden-bg flex flex-col font-inter">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-10 py-8">
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
      <main className="flex flex-col lg:flex-row flex-1 items-center px-5 lg:px-12 gap-12 pb-10 py-[48px]">

        <div className="flex-1 min-w-0 max-w-xl overflow-hidden">
          <h1 className="font-outfit font-extrabold leading-[0.9] tracking-tight uppercase text-golden-text"
            style={{ fontSize: 'clamp(3rem, 6vw, 8rem)' }}>
            Planifies<br />
            Tes<br />
            <span className="text-golden-primary">Meilleurs</span><br />
            Moments
          </h1>

          <p className="mt-7 text-golden-muted leading-relaxed max-w-sm">
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

        <div className="w-full lg:flex-1 relative flex items-center justify-center px-6 lg:px-0" style={{ minHeight: '480px' }}>

          <div className="w-full h-130 bg-golden-card rounded-4xl shadow-halo relative overflow-visible">

            <div className="absolute -top-4 right-6 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-halo text-sm font-inter text-golden-text">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBD23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span>24°C Soleil</span>
            </div>

            <style>{`
              @keyframes eq1 {
                0%   { height: 4px  }
                15%  { height: 12px }
                30%  { height: 6px  }
                45%  { height: 11px }
                60%  { height: 4px  }
                75%  { height: 9px  }
                100% { height: 4px  }
              }
              @keyframes eq2 {
                0%   { height: 9px  }
                20%  { height: 4px  }
                40%  { height: 13px }
                55%  { height: 5px  }
                70%  { height: 11px }
                85%  { height: 4px  }
                100% { height: 9px  }
              }
              @keyframes eq3 {
                0%   { height: 6px  }
                25%  { height: 13px }
                40%  { height: 4px  }
                60%  { height: 10px }
                75%  { height: 5px  }
                90%  { height: 12px }
                100% { height: 6px  }
              }
              @keyframes eq4 {
                0%   { height: 11px }
                15%  { height: 4px  }
                35%  { height: 9px  }
                50%  { height: 13px }
                65%  { height: 5px  }
                80%  { height: 10px }
                100% { height: 11px }
              }
            `}</style>

            <div className="absolute bottom-40 -left-5 lg:bottom-12 lg:-left-14 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-halo">
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
              {/* Equalizer bars */}
              <div className="flex items-center gap-[3px] h-4 ml-1">
                {[
                  { anim: 'eq1 1.7s ease-in-out infinite' },
                  { anim: 'eq2 1.4s ease-in-out infinite' },
                  { anim: 'eq3 1.9s ease-in-out infinite' },
                  { anim: 'eq4 1.5s ease-in-out infinite' },
                ].map(({ anim }, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'block',
                      width: '2.5px',
                      borderRadius: '9999px',
                      backgroundColor: '#FBBD23',
                      opacity: 0.9,
                      animation: anim,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute -bottom-8 lg:-bottom-32 right-4 lg:right-6 rotate-6 bg-white p-3 lg:p-4 pb-8 lg:pb-10 shadow-xl w-28 lg:w-64 flex flex-col gap-2 lg:gap-3">
              <img src="/summer24.jpg" alt="Summer 24" className="w-full h-20 lg:h-52 object-cover rounded-sm" />
              <p className="text-xs font-inter font-bold text-golden-text tracking-widest uppercase text-center">
                Summer '24
              </p>
            </div>

          </div>
        </div>

      </main>

      {/* ── Features section ── */}
      <section className="px-10 py-12">
        <h2 className="font-outfit font-extrabold uppercase text-center mb-14"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <span className="text-golden-text">Conçu pour </span>
          <span className="text-blue-500">L'Action</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">

          <div className="bg-golden-card rounded-3xl p-10 shadow-halo flex flex-col gap-8 aspect-square justify-center">
            <div className="w-20 h-20 rounded-2xl bg-golden-primary flex items-center justify-center shrink-0">
              <HiUserGroup className="text-white text-4xl" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-3xl leading-tight mb-5">
                Groupes Amis
              </h3>
              <p className="text-golden-muted leading-relaxed">
                Créez des espaces dédiés pour vos cercles d'amis ou couples et planifiez ensemble sans limite.
              </p>
            </div>
          </div>

          <div className="bg-golden-card rounded-3xl p-10 shadow-halo flex flex-col gap-8 aspect-square justify-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <MdDashboardCustomize className="text-blue-500 text-4xl" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-3xl leading-tight mb-5">
                Widgets<br />Interactifs
              </h3>
              <p className="text-golden-muted leading-relaxed">
                Intégrez des listes de tâches partagées et des points de rendez-vous sur carte en un clic.
              </p>
            </div>
          </div>

          <div className="bg-golden-card rounded-3xl p-10 shadow-halo flex flex-col gap-8 aspect-square justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
              <BsImageFill className="text-golden-text text-4xl" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-3xl leading-tight mb-5">
                Souvenirs<br />Partagés
              </h3>
              <p className="text-golden-muted leading-relaxed">
                Archivez vos meilleurs moments dans des albums photos collectifs accessibles à tout moment.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Interface du futur section ── */}
      <section className="bg-white px-10 py-[64px]">

        <div className="flex items-center gap-3 mb-12">
          <MdOutlineVisibility className="text-golden-primary text-3xl shrink-0" />
          <h2 className="font-outfit font-extrabold uppercase text-golden-text tracking-wide"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
            L'Interface du futur
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          <div className="flex flex-col gap-6">
            <div className="bg-[#FDEAE4] rounded-3xl flex items-center justify-center overflow-hidden p-6" style={{ aspectRatio: '9/10' }}>
              <img
                src="/mockup-iphone.png"
                alt="Hub centralisé"
                className="w-auto h-full object-contain drop-shadow-2xl"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-xl mb-2">
                Votre Hub Centralisé
              </h3>
              <p className="text-golden-muted leading-relaxed">
                Assemblez les widgets indispensables à vos vacances : cartes, budgets, checklists et météo.
                Tout est au même endroit, clair et accessible pour tout le monde.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:mt-14">
            <div className="bg-[#1C3D3A] rounded-3xl overflow-hidden" style={{ aspectRatio: '9/10' }}>
              <img
                src="/mockup-nature.png"
                alt="Un carrefour clair et apaisant"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold uppercase text-golden-text text-xl mb-2">
                Un Carrefour Clair et Apaisant
              </h3>
              <p className="text-golden-muted leading-relaxed">
                Naviguez fluidement entre vos cercles d'amis, vos projets de voyage et votre famille.
                Chaque hub est un univers distinct, facile à identifier et à rejoindre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials section ── */}
      <section className="px-10 py-[64px]">
        <h2 className="font-outfit font-extrabold uppercase text-center text-golden-text mb-4"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          La Communauté Adore
        </h2>
        <div className="flex justify-center mb-14">
          <div className="h-1 w-16 rounded-full bg-golden-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="bg-white rounded-3xl p-10 shadow-halo flex flex-col gap-8 justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-golden-primary fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="font-outfit font-bold text-golden-text text-xl leading-snug">
                "Une expérience révolutionnaire. Le design est frais et l'immersion est totale."
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">MK</span>
              </div>
              <div>
                <p className="font-outfit font-extrabold uppercase text-golden-text text-sm tracking-wide">Marc-Kevin L.</p>
                <p className="text-golden-muted text-xs uppercase tracking-widest">Designer UX</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-halo flex flex-col gap-8 justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-golden-primary fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="font-outfit font-bold text-golden-text text-xl leading-snug">
                "Enfin un réseau social qui privilégie la qualité des interactions sur la quantité."
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-golden-primary flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">SJ</span>
              </div>
              <div>
                <p className="font-outfit font-extrabold uppercase text-golden-text text-sm tracking-wide">Sarah J.</p>
                <p className="text-golden-muted text-xs uppercase tracking-widest">Architecte 3D</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-halo flex flex-col gap-8 justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-golden-primary fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="font-outfit font-bold text-golden-text text-xl leading-snug">
                "L'interface est incroyablement intuitive. On s'y sent bien dès la première connexion."
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-golden-text flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">TL</span>
              </div>
              <div>
                <p className="font-outfit font-extrabold uppercase text-golden-text text-sm tracking-wide">Thomas L.</p>
                <p className="text-golden-muted text-xs uppercase tracking-widest">Entrepreneur</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-10 py-14" style={{ backgroundColor: '#0E0E0E' }}>
        <div className="flex flex-col lg:flex-row justify-between gap-12">

          <div className="flex flex-col gap-6 max-w-xs">
            <div className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="Golden Hour logo" className="w-10 h-10 rounded-full object-cover shadow-halo" />
              <span className="font-outfit font-extrabold text-md tracking-[0.15em] uppercase text-white">
                Golden Hour
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              © 2026 Golden Hour Universe. Tous droits réservés. Créé avec passion pour l'instant présent.
            </p>
          </div>

          <div className="flex gap-16">
            <div className="flex flex-col gap-4">
              <p className="font-outfit font-extrabold uppercase text-golden-primary text-xs tracking-[0.2em]">Produit</p>
              <a href="#" className="text-white/60 hover:text-white text-sm transition">Confidentialité</a>
              <a href="#" className="text-white/60 hover:text-white text-sm transition">Mentions légales</a>
              <a href="#" className="text-white/60 hover:text-white text-sm transition">Sécurité</a>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-outfit font-extrabold uppercase text-golden-primary text-xs tracking-[0.2em]">Réseaux</p>
              <a href="#" className="text-white/60 hover:text-white text-sm transition">Twitter</a>
              <a href="#" className="text-white/60 hover:text-white text-sm transition">Instagram</a>
              <a href="#" className="text-white/60 hover:text-white text-sm transition">Discord</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
