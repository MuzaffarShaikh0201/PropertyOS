import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/nav/screen-header';
import { useToast } from '@/components/ui/toast';
import { recordBillPaidNotification } from '@/features/notifications/api';
import { useCreateUtilityBill, useSetUtilityBillProof } from '@/features/utility-bills/hooks';
import { uploadUtilityBillProof } from '@/features/utility-bills/image';
import { UtilityBillForm } from '@/features/utility-bills/utility-bill-form';

export default function RecordUtilityBillScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const createBill = useCreateUtilityBill();
  const setProof = useSetUtilityBillProof();
  const toast = useToast();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Record utility bill" mode="close" />
      <UtilityBillForm
        initialPropertyId={propertyId}
        submitLabel="Save bill entry"
        submittingLabel="Saving…"
        onSubmit={async (input, proofChange) => {
          try {
            const bill = await createBill.mutateAsync(input);
            if (proofChange.kind === 'upload') {
              const path = await uploadUtilityBillProof(bill.id, proofChange.localUri, proofChange.mimeType);
              await setProof.mutateAsync({ id: bill.id, proofDocumentPath: path });
            }
            if (bill.status === 'paid') {
              await recordBillPaidNotification(bill.id).catch(() => undefined);
            }
            toast.success('Bill recorded.');
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
