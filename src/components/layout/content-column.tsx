import type { ReactNode } from 'react';
import { View } from 'react-native';

type ContentColumnProps = {
  children: ReactNode;
  className?: string;
  /**
   * `center` (default) for a single-purpose screen (a form, a document) that
   * should sit centered with widened margins on larger screens. `start` for
   * a menu/index screen that already lives inside other navigation chrome
   * (e.g. the laptop sidebar) and should stay left-anchored under it instead.
   */
  align?: 'center' | 'start';
};

// Per the wireframe spec's responsive rules: forms and reference content
// "stay single-column and simply widen their margins on larger screens
// rather than reflowing into multiple columns" (unlike card/grid screens
// such as Property Registry). `self-center`/`self-start` makes this a
// drop-in wrapper regardless of the parent's own alignItems.
export function ContentColumn({ children, className = '', align = 'center' }: ContentColumnProps) {
  const alignClass = align === 'start' ? 'self-start' : 'self-center';
  return <View className={`w-full max-w-2xl ${alignClass} ${className}`}>{children}</View>;
}
