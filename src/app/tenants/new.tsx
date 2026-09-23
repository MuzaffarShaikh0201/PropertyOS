import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/nav/screen-header';
import { useToast } from '@/components/ui/toast';
import { updateAgreementDraft } from '@/features/agreements/draft-store';
import { useCreateTenant, useSetTenantPhoto } from '@/features/tenants/hooks';
import { uploadTenantPhoto } from '@/features/tenants/image';
import { TenantForm } from '@/features/tenants/tenant-form';

export default function AddTenantProfileScreen() {
  const createTenant = useCreateTenant();
  const setTenantPhoto = useSetTenantPhoto();
  const toast = useToast();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Add tenant" mode="close" />
      <TenantForm
        submitLabel="Save & continue"
        submittingLabel="Saving…"
        onSubmit={async (input, photoChange) => {
          try {
            const tenant = await createTenant.mutateAsync(input);
            if (photoChange.kind === 'upload') {
              const path = await uploadTenantPhoto(tenant.id, photoChange.localUri, photoChange.mimeType);
              await setTenantPhoto.mutateAsync({ id: tenant.id, photoPath: path });
            }
            // Returns to the agreement wizard's Step 1 with this tenant now
            // selected as Licensee — tenant profiles aren't reusable/searchable
            // across agreements in v1, so there's no list to pick from instead.
            updateAgreementDraft({ tenantId: tenant.id });
            toast.success('Tenant added.');
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
