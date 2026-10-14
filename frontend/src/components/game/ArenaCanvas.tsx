import { motion } from 'framer-motion';
import { colors, spacing, fonts, fontSizes, radii } from '../../styles/tokens';

interface ArenaCanvasProps {
  width?: number;
  height?: number;
}

export function ArenaCanvas({ width = 800, height = 500 }: ArenaCanvasProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <motion.canvas
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        width={width}
        height={height}
        style={{
          borderRadius: radii.lg,
          background: colors.base,
          border: `2px solid ${colors.surfaceHi}`,
          boxShadow: `0 0 40px rgba(0, 240, 255, 0.15), inset 0 0 60px rgba(0, 0, 0, 0.5)`,
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
}
