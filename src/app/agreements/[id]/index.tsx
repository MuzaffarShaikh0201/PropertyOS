import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { type ReactNode, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import { useToast } from '@/components/ui/toast';
import {
  computeRegistrationDeadline,
  daysUntil,
  formatInr,
  tenureMonths,
} from '@/features/agreements/calculations';
import { getAgreementDocumentSignedUrl } from '@/features/agreements/documents';
import {
  useAgreement,
  useDeleteAgreement,
  useEndAgreementAndVacate,
  useMarkAgreementRegistered,
  useRenewedIntoAgreement,
  useWithdrawNotice,
} from '@/features/agreements/hooks';
import { getLifecycleStatus, LIFECYCLE_LABELS, type LifecycleStatus } from '@/features/agreements/lifecycle';
import { AGREEMENT_STATUSES, agreementDocLabel } from '@/features/agreements/types';
import { useOwner } from '@/features/owners/hooks';
import { useProperty } from '@/features/properties/hooks';
import { useTenant } from '@/features/tenants/hooks';

const STATUS_CHIP_VARIANT: Record<LifecycleStatus, 'success' | 'warning' | 'neutral' | 'info'> = {
  upcoming: 'info',
  active: 'success',
  on_notice: 'warning',
  ended: 'neutral',
  renewed: 'info',
};

const DELETE_ICON_COLOR = { light: '#A23B2E', dark: '#F08A75' };

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-1.5 rounded-md border border-border bg-surface px-3.5 py-3">
      <Text className="font-body-bold text-[11px] uppercase tracking-wide text-text-muted">{label}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="font-body text-[12.5px] text-text-muted">{label}</Text>
      <Text className="font-body-bold text-[12.5px] text-text">{value}</Text>
    </View>
  );
}

export default function AgreementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: agreement, isLoading } = useAgreement(id);
  const { data: property } = useProperty(agreement?.propertyId ?? '');
  const { data: owner } = useOwner(property?.ownerId ?? '');
  const { data: tenant } = useTenant(agreement?.tenantId);
  const markRegistered = useMarkAgreementRegistered();
  const withdrawNotice = useWithdrawNotice();
  const endAndVacate = useEndAgreementAndVacate();
  const deleteAgreement = useDeleteAgreement();
  const toast = useToast();
  const { colorScheme } = useColorScheme();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const lifecycleStatus = agreement ? getLifecycleStatus(agreement) : null;
  const { data: renewedInto } = useRenewedIntoAgreement(lifecycleStatus === 'renewed' ? id : null);

  if (isLoading || !agreement || !property || !lifecycleStatus) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ScreenHeader title="Agreement" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      </SafeAreaView>
    );
  }

  const months = tenureMonths(agreement.startDate, agreement.endDate);
  const registrationDeadline = computeRegistrationDeadline(
    agreement.startDate,
    agreement.legalConfigSnapshot.registration.windowMonths
  );
  const isRegistered = Boolean(agreement.registeredAt);
  const daysToDeadline = daysUntil(registrationDeadline);
  const deadlineUrgency = daysToDeadline <= 7 ? 'error' : daysToDeadline <= 30 ? 'warning' : 'success';
  const deadlineBarColor = { error: 'bg-danger-fg', warning: 'bg-warning-fg', success: 'bg-primary' }[deadlineUrgency];
  const windowDays = agreement.legalConfigSnapshot.registration.windowMonths * 30;
  const elapsedFraction = isRegistered ? 1 : Math.min(1, Math.max(0, 1 - daysToDeadline / windowDays));

  const documentEntries = Object.entries(agreement.documents);

  const handleMarkRegistered = async () => {
    setBusy(true);
    try {
      await markRegistered.mutateAsync(agreement.id);
      toast.success('Marked registered.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the agreement.');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdrawNotice = async () => {
    setBusy(true);
    try {
      await withdrawNotice.mutateAsync(agreement.id);
      toast.success('Notice withdrawn.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not withdraw the notice.');
    } finally {
      setBusy(false);
    }
  };

  const handleEndAndVacate = async () => {
    setBusy(true);
    try {
      await endAndVacate.mutateAsync({ agreementId: agreement.id, propertyId: property.id });
      toast.success('Property marked vacant.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the property.');
    } finally {
      setBusy(false);
    }
  };

  const handleRenew = () => {
    router.push({ pathname: '/agreements/new/step1', params: { propertyId: property.id, renewFrom: agreement.id } });
  };

  const handleOpenDocument = async (path: string) => {
    try {
      const url = await getAgreementDocumentSignedUrl(path);
      await Linking.openURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open the document.');
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAgreement.mutateAsync({ id: agreement.id, propertyId: property.id });
      toast.success('Agreement removed.');
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove agreement.');
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader
        title={property.name}
        trailing={
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Delete agreement"
            className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
            <Ionicons name="trash-outline" size={16} color={DELETE_ICON_COLOR[colorScheme === 'dark' ? 'dark' : 'light']} />
          </Pressable>
        }
      />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="gap-4 py-4">
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Chip variant={STATUS_CHIP_VARIANT[lifecycleStatus]}>{LIFECYCLE_LABELS[lifecycleStatus]}</Chip>
              <Text className="font-body text-[12px] text-text-muted">
                {tenant?.name ?? '—'} · {agreement.startDate} → {agreement.endDate}
              </Text>
            </View>
            <View className="flex-row gap-1.5">
              {AGREEMENT_STATUSES.map((status) => (
                <View
                  key={status}
                  className={`h-1.5 flex-1 rounded-pill ${status === lifecycleStatus ? 'bg-primary' : 'bg-surface-2'}`}
                />
              ))}
            </View>
          </View>

          {lifecycleStatus === 'upcoming' ? (
            <Banner variant="info">
              <Text className="font-body text-[12.5px] leading-5 text-info-fg">
                This tenancy starts on {agreement.startDate}. The property is already marked Rented, but the
                agreement itself becomes Active on that date.
              </Text>
            </Banner>
          ) : null}

          {lifecycleStatus === 'on_notice' ? (
            <Banner variant="warning">
              <Text className="font-body-bold text-[13px] text-warning-fg">
                Notice raised by {agreement.noticeRaisedBy === 'tenant' ? 'the tenant' : 'the owner'} on{' '}
                {agreement.noticeDate}
              </Text>
              <Text className="font-body text-[12.5px] leading-5 text-warning-fg">
                Notice period: {agreement.noticePeriodDays} days · expected vacate date:{' '}
                {agreement.expectedVacateDate}
              </Text>
              {agreement.noticeNote ? (
                <Text className="font-body text-[12.5px] leading-5 text-warning-fg">{agreement.noticeNote}</Text>
              ) : null}
              <View className="flex-row gap-2 pt-1">
                <Pressable
                  onPress={handleEndAndVacate}
                  disabled={busy}
                  accessibilityRole="button"
                  className="flex-1 items-center rounded-sm bg-primary px-3 py-2.5 active:opacity-90">
                  <Text className="font-body-bold text-[13px] text-on-primary">Mark vacated</Text>
                </Pressable>
                <Pressable
                  onPress={handleWithdrawNotice}
                  disabled={busy}
                  accessibilityRole="button"
                  className="flex-1 items-center rounded-sm border border-border-strong bg-surface px-3 py-2.5 active:bg-surface-2">
                  <Text className="font-body-bold text-[13px] text-text">Withdraw notice</Text>
                </Pressable>
              </View>
            </Banner>
          ) : null}

          {lifecycleStatus === 'ended' ? (
            <Banner variant="info">
              <Text className="font-body-bold text-[13px] text-info-fg">
                This agreement&apos;s term ended on {agreement.endDate}
              </Text>
              <Text className="font-body text-[12.5px] leading-5 text-info-fg">
                The property stays Rented until you choose what happens next.
              </Text>
              <View className="flex-row gap-2 pt-1">
                <Pressable
                  onPress={handleEndAndVacate}
                  disabled={busy}
                  accessibilityRole="button"
                  className="flex-1 items-center rounded-sm border border-border-strong bg-surface px-3 py-2.5 active:bg-surface-2">
                  <Text className="font-body-bold text-[13px] text-text">Mark property vacant</Text>
                </Pressable>
                <Pressable
                  onPress={handleRenew}
                  disabled={busy}
                  accessibilityRole="button"
                  className="flex-1 items-center rounded-sm bg-primary px-3 py-2.5 active:opacity-90">
                  <Text className="font-body-bold text-[13px] text-on-primary">Renew with same tenant</Text>
                </Pressable>
              </View>
            </Banner>
          ) : null}

          {lifecycleStatus === 'renewed' ? (
            <Banner variant="info">
              <Text className="font-body-bold text-[13px] text-info-fg">Renewed → new agreement</Text>
              <Text className="font-body text-[12.5px] leading-5 text-info-fg">
                {renewedInto ? `New term: ${renewedInto.startDate} → ${renewedInto.endDate}` : 'Loading the new agreement…'}
              </Text>
              {renewedInto ? (
                <Pressable
                  onPress={() => router.push(`/agreements/${renewedInto.id}`)}
                  accessibilityRole="button"
                  className="self-start rounded-sm border border-border-strong bg-surface px-3 py-1.5">
                  <Text className="font-body-bold text-[12px] text-text">Open new agreement</Text>
                </Pressable>
              ) : null}
            </Banner>
          ) : null}

          <Card label="Registration status">
            <View className="flex-row items-center justify-between">
              <Text className="font-body-bold text-[14px] text-text">
                {isRegistered ? 'Registered' : `${registrationDeadline}`}
              </Text>
              {!isRegistered ? (
                <Chip variant={deadlineUrgency === 'error' ? 'error' : deadlineUrgency === 'warning' ? 'warning' : 'success'}>
                  {daysToDeadline >= 0 ? `${daysToDeadline}d left` : 'Overdue'}
                </Chip>
              ) : null}
            </View>
            <View className="h-1.5 rounded-pill bg-surface-2">
              <View
                className={`h-1.5 rounded-pill ${deadlineBarColor}`}
                style={{ width: `${Math.round(elapsedFraction * 100)}%` }}
              />
            </View>
            <View className="flex-row items-center justify-between pt-1">
              {['Executed', 'Registration due', 'Registered'].map((stage, index) => {
                const currentIndex = isRegistered ? 2 : 1;
                const isDone = index <= currentIndex;
                return (
                  <View key={stage} className="flex-1 items-center gap-1">
                    <View className={`h-2 w-2 rounded-pill ${isDone ? 'bg-primary' : 'bg-surface-2'}`} />
                    <Text className={`font-body text-[10.5px] ${isDone ? 'text-text' : 'text-text-faint'}`}>{stage}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[11px] uppercase tracking-wide text-text-muted">
              Licensee (tenant)
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: '/tenants/[id]', params: { id: agreement.tenantId } })}
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-md border border-border bg-surface px-3.5 py-3 active:bg-surface-2">
              <View>
                <Text className="font-body-bold text-[14px] text-text">{tenant?.name ?? '—'}</Text>
                <Text className="font-body text-[12.5px] text-text-muted">{tenant?.phone ?? ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#5B6363" />
            </Pressable>
          </View>

          <Card label="Key terms">
            <DetailRow label="Monthly rent" value={formatInr(agreement.monthlyRent)} />
            <View className="h-px bg-border" />
            <DetailRow label="Security deposit" value={formatInr(agreement.securityDeposit)} />
            <View className="h-px bg-border" />
            <DetailRow
              label="Escalation"
              value={agreement.escalationFrequency === 'annual' ? `${agreement.escalationPercent ?? 0}% annually` : 'None'}
            />
            <View className="h-px bg-border" />
            <DetailRow label="Notice period" value={`${agreement.noticePeriodDays} days`} />
            <View className="h-px bg-border" />
            <DetailRow label="Tenure" value={`${months} months`} />
            <View className="h-px bg-border" />
            <DetailRow label="Owner" value={owner?.name ?? '—'} />
          </Card>

          <Card label="Legal Config — Pinned">
            <Text className="font-body-bold text-[14px] text-text">v{agreement.legalConfigVersion}</Text>
            <Text className="font-body text-[12px] leading-4 text-text-muted">
              As of {agreement.legalConfigSnapshot.lastUpdated}. Locked in at creation — a later law update never
              recomputes these numbers.
            </Text>
          </Card>

          <Card label="Stamp duty & witnesses">
            <DetailRow
              label="Stamp duty estimate"
              value={agreement.stampDutyEstimate != null ? formatInr(agreement.stampDutyEstimate) : '—'}
            />
            <View className="h-px bg-border" />
            <DetailRow
              label="Witness 1"
              value={agreement.witness1Name ? `${agreement.witness1Name} (${agreement.witness1Phone ?? '—'})` : '—'}
            />
            <View className="h-px bg-border" />
            <DetailRow
              label="Witness 2"
              value={agreement.witness2Name ? `${agreement.witness2Name} (${agreement.witness2Phone ?? '—'})` : '—'}
            />
            <View className="h-px bg-border" />
            <DetailRow label="Police verification" value={agreement.policeVerificationDone ? 'Completed' : 'Not recorded'} />
          </Card>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Document vault</Text>
            {documentEntries.length === 0 ? (
              <Text className="font-body text-[12.5px] text-text-faint">No documents uploaded yet.</Text>
            ) : (
              <View className="rounded-md border border-border bg-surface px-3.5">
                {documentEntries.map(([docType, entry], index) => (
                  <View key={docType}>
                    <Pressable
                      onPress={() => entry && handleOpenDocument(entry.path)}
                      accessibilityRole="button"
                      className="flex-row items-center justify-between py-3">
                      <Text className="font-body-bold text-[13px] text-text">{agreementDocLabel(docType)}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#5B6363" />
                    </Pressable>
                    {index < documentEntries.length - 1 ? <View className="h-px bg-border" /> : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          {lifecycleStatus === 'active' || lifecycleStatus === 'upcoming' ? (
            <View className="gap-2">
              {!isRegistered ? (
                <Pressable
                  onPress={handleMarkRegistered}
                  disabled={busy}
                  accessibilityRole="button"
                  className="w-full items-center justify-center rounded-sm bg-primary px-4 py-3 active:opacity-90">
                  <Text className="font-body-bold text-[14px] text-on-primary">Mark registered</Text>
                </Pressable>
              ) : null}
              {lifecycleStatus === 'active' ? (
                <Pressable
                  onPress={() => router.push(`/agreements/${agreement.id}/give-notice`)}
                  disabled={busy}
                  accessibilityRole="button"
                  className="w-full items-center justify-center rounded-sm border border-border-strong bg-surface px-4 py-3 active:bg-surface-2">
                  <Text className="font-body-bold text-[14px] text-text">Give notice</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}
