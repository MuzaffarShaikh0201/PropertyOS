import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/nav/screen-header';
import { useToast } from '@/components/ui/toast';
import { useTenant, useUpdateTenant, useSetTenantPhoto } from '@/features/tenants/hooks';
import { uploadTenantPhoto } from '@/features/tenants/image';
import { TenantForm } from '@/features/tenants/tenant-form';

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: tenant, isLoading } = useTenant(id);
  const updateTenant = useUpdateTenant(id);
  const setTenantPhoto = useSetTenantPhoto();
  const toast = useToast();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title={tenant?.name ?? 'Tenant'} />
      {isLoading || !tenant ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : (
        <TenantForm
          initialValues={tenant}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onSubmit={async (input, photoChange) => {
            try {
              await updateTenant.mutateAsync(input);
              if (photoChange.kind === 'upload') {
                const path = await uploadTenantPhoto(tenant.id, photoChange.localUri, photoChange.mimeType);
                await setTenantPhoto.mutateAsync({ id: tenant.id, photoPath: path });
              }
              toast.success('Tenant updated.');
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
