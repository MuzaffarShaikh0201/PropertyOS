import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/nav/screen-header';
import { useToast } from '@/components/ui/toast';
import { recordBillPaidNotification } from '@/features/notifications/api';
import { useDeleteUtilityBill, useSetUtilityBillProof, useUpdateUtilityBill, useUtilityBill } from '@/features/utility-bills/hooks';
import { uploadUtilityBillProof } from '@/features/utility-bills/image';
import { UtilityBillForm } from '@/features/utility-bills/utility-bill-form';

const DELETE_ICON_COLOR = { light: '#A23B2E', dark: '#F08A75' };

export default function UtilityBillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bill, isLoading } = useUtilityBill(id);
  const updateBill = useUpdateUtilityBill(id);
  const setProof = useSetUtilityBillProof();
  const deleteBill = useDeleteUtilityBill();
  const toast = useToast();
  const { colorScheme } = useColorScheme();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteBill.mutateAsync(id);
      toast.success('Bill removed.');
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove bill.');
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader
        title="Utility bill"
        trailing={
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Delete bill"
            className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
            <Ionicons name="trash-outline" size={16} color={DELETE_ICON_COLOR[colorScheme === 'dark' ? 'dark' : 'light']} />
          </Pressable>
        }
      />
      {isLoading || !bill ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : (
        <UtilityBillForm
          initialValues={bill}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onSubmit={async (input, proofChange) => {
            try {
              await updateBill.mutateAsync(input);
              if (proofChange.kind === 'upload') {
                const path = await uploadUtilityBillProof(bill.id, proofChange.localUri, proofChange.mimeType);
                await setProof.mutateAsync({ id: bill.id, proofDocumentPath: path });
              }
              if (input.status === 'paid') {
                await recordBillPaidNotification(bill.id).catch(() => undefined);
              }
              toast.success('Bill updated.');
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
