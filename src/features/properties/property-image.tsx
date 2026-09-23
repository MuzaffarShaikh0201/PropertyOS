import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { usePropertyImageUrl } from './hooks';

const SIZE_CLASSES = {
  thumbnail: 'h-10 w-10 rounded-full',
  hero: 'h-44 w-full rounded-md',
} as const;

const ICON_SIZE = {
  thumbnail: 16,
  hero: 32,
} as const;

type PropertyImageProps = {
  imagePath: string | null;
  size?: keyof typeof SIZE_CLASSES;
};

// A property's photo is optional — this always renders *something*: the
// uploaded photo (resolved to a signed URL, since the storage bucket is
// private), or a flat, on-brand placeholder while there's no photo or the
// signed URL hasn't loaded yet, so callers never have to branch on it.
export function PropertyImage({ imagePath, size = 'thumbnail' }: PropertyImageProps) {
  const { data: signedUrl } = usePropertyImageUrl(imagePath);
  const shapeClass = SIZE_CLASSES[size];

  if (imagePath && signedUrl) {
    return (
      <Image
        source={{ uri: signedUrl }}
        contentFit="cover"
        transition={120}
        className={`${shapeClass} border border-border bg-surface-2`}
      />
    );
  }

  return (
    <View className={`items-center justify-center border border-border bg-info-bg ${shapeClass}`}>
      <Ionicons name="home" size={ICON_SIZE[size]} color="#1F7A6E" />
    </View>
  );
}
