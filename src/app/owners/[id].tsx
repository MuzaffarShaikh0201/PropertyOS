import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/nav/screen-header';
import { useToast } from '@/components/ui/toast';
import { useDeleteOwner, useOwner, useUpdateOwner } from '@/features/owners/hooks';
import { OwnerForm } from '@/features/owners/owner-form';

const DELETE_ICON_COLOR = { light: '#A23B2E', dark: '#F08A75' };

export default function OwnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: owner, isLoading } = useOwner(id);
  const updateOwner = useUpdateOwner(id);
  const deleteOwner = useDeleteOwner();
  const toast = useToast();
  const { colorScheme } = useColorScheme();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteOwner.mutateAsync(id);
      toast.success('Owner removed.');
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove owner.');
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader
        title={owner?.name ?? 'Owner'}
        trailing={
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Delete owner"
            className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
            <Ionicons
              name="trash-outline"
              size={16}
              color={DELETE_ICON_COLOR[colorScheme === 'dark' ? 'dark' : 'light']}
            />
          </Pressable>
        }
      />
      {isLoading || !owner ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : (
        <OwnerForm
          initialValues={owner}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onSubmit={async (input) => {
            try {
              await updateOwner.mutateAsync(input);
              toast.success('Owner updated.');
              router.back();
              return { error: null };
            } catch (err) {
              return { error: err instanceof Error ? err.message : 'Something went wrong. Try again.' };
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
