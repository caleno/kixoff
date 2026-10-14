import { colors, typography } from '../types/design';

/**
 * Settings — Game configuration screen
 * Aura (UI) — KIXoff
 */

interface SettingsProps {
  settings: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    graphicsQuality: 'low' | 'medium' | 'high';
    showFps: boolean;
    cameraShake: boolean;
  };
  onUpdate: (key: string, value: any) => void;
  onBack: () => void;
}

export function Settings({ settings, onUpdate, onBack }: SettingsProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.base,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      fontFamily: typography.body,
      color: colors.textPrimary,
    }}>
      <h1 style={{ fontFamily: typography.heading, fontSize: '48px', margin: 0 }}>SETTINGS</h1>

      <div style={{
        background: colors.baseLight,
        borderRadius: '12px',
        padding: '32px',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <SliderRow label="Master Volume" value={settings.masterVolume} onChange={(v) => onUpdate('masterVolume', v)} />
        <SliderRow label="SFX Volume" value={settings.sfxVolume} onChange={(v) => onUpdate('sfxVolume', v)} />
        <SliderRow label="Music Volume" value={settings.musicVolume} onChange={(v) => onUpdate('musicVolume', v)} />

        <SelectRow label="Graphics" value={settings.graphicsQuality} options={['low', 'medium', 'high']} onChange={(v) => onUpdate('graphicsQuality', v)} />

        <ToggleRow label="Show FPS" value={settings.showFps} onChange={(v) => onUpdate('showFps', v)} />
        <ToggleRow label="Camera Shake" value={settings.cameraShake} onChange={(v) => onUpdate('cameraShake', v)} />
      </div>

      <button
        onClick={onBack}
        style={{
          padding: '10px 32px',
          borderRadius: '8px',
          border: 'none',
          fontFamily: typography.heading,
          fontSize: '16px',
          cursor: 'pointer',
          background: colors.baseLighter,
          color: colors.textPrimary,
        }}
      >
        BACK
      </button>
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px' }}>{label}</span>
        <span style={{ fontSize: '14px', color: colors.accent }}>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0" max="1" step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: colors.accent }}
      />
    </div>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: colors.baseLighter,
          color: colors.textPrimary,
          border: `1px solid ${colors.accent}30`,
          borderRadius: '6px',
          padding: '6px 12px',
          fontFamily: typography.body,
        }}
      >
        {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          background: value ? colors.accent : colors.baseLighter,
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#FFF',
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}
