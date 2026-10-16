import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { colors, radii, spacing, fonts, shadows } from '../../styles/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: colors.accent,
    color: colors.base,
    border: 'none',
    boxShadow: shadows.glow,
  },
  secondary: {
    background: 'transparent',
    color: colors.accent,
    border: `2px solid ${colors.accent}`,
  },
  ghost: {
    background: 'transparent',
    color: colors.textSecondary,
    border: 'none',
  },
  danger: {
    background: colors.danger,
    color: colors.textPrimary,
    border: 'none',
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: `${spacing.xs} ${spacing.md}`, fontSize: '0.875rem' },
  md: { padding: `${spacing.sm} ${spacing.lg}`, fontSize: '1rem' },
  lg: { padding: `${spacing.md} ${spacing.xl}`, fontSize: '1.25rem' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, style, children, ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        style={{
          fontFamily: fonts.heading,
          fontWeight: 600,
          borderRadius: radii.md,
          cursor: 'pointer',
          width: fullWidth ? '100%' : 'auto',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        {...rest}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
