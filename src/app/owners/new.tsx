import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/nav/screen-header';
import { useToast } from '@/components/ui/toast';
import { useCreateOwner } from '@/features/owners/hooks';
import { OwnerForm } from '@/features/owners/owner-form';

export default function NewOwnerScreen() {
  const createOwner = useCreateOwner();
  const toast = useToast();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Add owner" mode="close" />
      <OwnerForm
        submitLabel="Save owner"
        submittingLabel="Saving…"
        onSubmit={async (input) => {
          try {
            await createOwner.mutateAsync(input);
            toast.success('Owner added.');
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
