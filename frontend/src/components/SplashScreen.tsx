export function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg">
      <div className="animate-pulse-glow rounded-full p-8 mb-8">
        <h1 className="font-display font-bold text-7xl text-kix-cyan neon-cyan tracking-wider">
          KIX<span className="text-kix-pink neon-pink">off</span>
        </h1>
      </div>
      <p className="font-body text-kix-text-secondary text-lg animate-fade-in">
        Loading the arena...
      </p>
      <div className="mt-8 w-48 h-1 bg-kix-bg-card rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-kix-cyan to-kix-pink animate-pulse" style={{ width: '100%' }} />
      </div>
    </div>
  );
}
