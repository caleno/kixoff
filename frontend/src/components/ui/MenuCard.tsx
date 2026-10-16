import { motion } from 'framer-motion';
import { colors, spacing, fonts, fontSizes, radii, shadows } from '../../styles/tokens';

interface MenuCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  accentColor?: string;
}

export function MenuCard({ title, description, icon, onClick, accentColor = colors.accent }: MenuCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.xl,
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.surfaceHi}`,
        cursor: 'pointer',
        width: '200px',
        boxShadow: shadows.md,
        transition: 'border-color 0.2s',
      }}
    >
      <span style={{ fontSize: '2.5rem' }}>{icon}</span>
      <span style={{
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        fontWeight: 700,
        color: accentColor,
        letterSpacing: '0.05em',
      }}>
        {title}
      </span>
      <span style={{
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        textAlign: 'center',
      }}>
        {description}
      </span>
    </motion.div>
  );
}
