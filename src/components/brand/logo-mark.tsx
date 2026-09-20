import PropertyOSIconSvg from '@/assets/images/brand/propertyos-icon.svg';

type LogoMarkProps = {
  size?: number;
};

export function LogoMark({ size = 64 }: LogoMarkProps) {
  return <PropertyOSIconSvg width={size} height={size} accessibilityLabel="PropertyOS" />;
}
