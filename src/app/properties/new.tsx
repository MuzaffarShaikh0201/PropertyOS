import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/nav/screen-header';
import { useToast } from '@/components/ui/toast';
import { useCreateProperty, useProperty, useSetPropertyImage, useUpdateProperty } from '@/features/properties/hooks';
import { deletePropertyImage, uploadPropertyImage } from '@/features/properties/image';
import { PropertyForm } from '@/features/properties/property-form';

export default function AddEditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const { data: property, isLoading } = useProperty(id ?? '');
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty(id ?? '');
  const setPropertyImage = useSetPropertyImage();
  const toast = useToast();

  if (isEditing && (isLoading || !property)) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ScreenHeader title="Edit property" mode="close" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title={isEditing ? 'Edit property' : 'Add property'} mode="close" />
      <PropertyForm
        initialValues={property}
        submitLabel={isEditing ? 'Save changes' : 'Save property'}
        submittingLabel="Saving…"
        onSubmit={async (input, imageChange) => {
          try {
            const saved = isEditing ? await updateProperty.mutateAsync(input) : await createProperty.mutateAsync(input);

            if (imageChange.kind === 'upload') {
              const path = await uploadPropertyImage(saved.id, imageChange.localUri, imageChange.mimeType);
              // A previous photo with a different extension would otherwise be
              // left behind in storage now that image_path points elsewhere.
              if (saved.imagePath && saved.imagePath !== path) {
                await deletePropertyImage(saved.imagePath).catch(() => undefined);
              }
              await setPropertyImage.mutateAsync({ id: saved.id, imagePath: path });
            } else if (imageChange.kind === 'remove' && saved.imagePath) {
              await deletePropertyImage(saved.imagePath).catch(() => undefined);
              await setPropertyImage.mutateAsync({ id: saved.id, imagePath: null });
            }

            toast.success(isEditing ? 'Property updated.' : 'Property added.');
            router.back();
            return { error: null };
          } catch (err) {
            return { error: err instanceof Error ? err.message : 'Something went wrong. Try again.' };
          }
        }}
      />
    </SafeAreaView>
  );
}
