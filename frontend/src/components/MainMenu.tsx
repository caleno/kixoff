import type { PlayerProfile, Screen } from '../types';

interface Props {
  player: PlayerProfile;
  navigate: (screen: Screen) => void;
}

export function MainMenu({ player, navigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-6">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-12">
        <h1 className="font-display font-bold text-5xl text-kix-cyan neon-cyan tracking-wide">
          KIX<span className="text-kix-pink neon-pink">off</span>
        </h1>
        <div className="glass-card px-4 py-2 flex items-center gap-4">
          <span className="font-display text-kix-text-primary text-lg">{player.username}</n          <span className="text-kix-gold font-display">★ {player.rating}</span>
          <span className="text-kix-cyan font-display">Lv.{player.level}</span>
        </div>
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 w-full max-w-md animate-slide-up">
        <button className="btn-neon" onClick={() => navigate('matchmaking')}>
          ⚡ PLAY RANKED
        </button>
        <button className="btn-neon-pink" onClick={() => navigate('matchmaking')}>
          🎮 PLAY CASUAL
        </button>
        <button className="glass-card px-6 py-3 font-display font-semibold text-lg text-kix-text-primary hover:border-kix-cyan/30 transition-all" onClick={() => navigate('profile')}>
          👤 PROFILE
        </button>
        <button className="glass-card px-6 py-3 font-display font-semibold text-lg text-kix-text-primary hover:border-kix-pink/30 transition-all" onClick={() => navigate('shop')}>
          🛒 SHOP
        </button>
        <button className="glass-card px-6 py-3 font-display font-semibold text-lg text-kix-text-secondary hover:border-white/20 transition-all" onClick={() => navigate('settings')}>
          ⚙️ SETTINGS
        </button>
      </div>

      {/* Footer */}
      <p className="mt-16 text-kix-text-muted text-sm font-body">
        Season 1 • Cloduron Platform
      </p>
    </div>
  );
}
