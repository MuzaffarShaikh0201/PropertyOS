import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DatePickerField } from '@/components/form/date-picker-field';
import { TextField } from '@/components/form/text-field';
import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import { useToast } from '@/components/ui/toast';
import { computeExpectedVacateDate, isValidIsoDate, todayIsoDate } from '@/features/agreements/calculations';
import { useAgreement, useGiveNotice } from '@/features/agreements/hooks';
import { NOTICE_RAISED_BY, type NoticeRaisedBy } from '@/features/agreements/types';

export default function GiveNoticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: agreement, isLoading } = useAgreement(id);
  const giveNotice = useGiveNotice();
  const toast = useToast();

  const [raisedBy, setRaisedBy] = useState<NoticeRaisedBy>('owner');
  const [noticeDate, setNoticeDate] = useState(todayIsoDate());
  // Auto-calculated from notice date + notice period until the person types
  // into the field themselves, at which point their value takes over —
  // derived at render time rather than mirrored into state via an effect.
  const [manualVacateDate, setManualVacateDate] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const computedVacateDate =
    agreement && isValidIsoDate(noticeDate) ? computeExpectedVacateDate(noticeDate, agreement.noticePeriodDays) : '';
  const expectedVacateDate = manualVacateDate ?? computedVacateDate;

  if (isLoading || !agreement) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ScreenHeader title="Give notice" mode="close" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit = isValidIsoDate(noticeDate) && isValidIsoDate(expectedVacateDate) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await giveNotice.mutateAsync({
        id: agreement.id,
        input: { raisedBy, noticeDate, expectedVacateDate, note: note.trim() || null },
      });
      toast.success('Notice recorded.');
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record the notice. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Give notice" mode="close" />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="gap-4 py-4">
          <View className="gap-1 rounded-md border border-border bg-surface px-3.5 py-3">
            <Text className="font-body-bold text-[13px] text-text">Notice period on this agreement</Text>
            <Text className="font-body text-[12.5px] text-text-muted">{agreement.noticePeriodDays} days</Text>
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Notice raised by</Text>
            <View className="flex-row gap-2">
              {NOTICE_RAISED_BY.map((option) => {
                const isActive = option.value === raisedBy;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setRaisedBy(option.value)}
                    accessibilityRole="button"
                    className={`flex-1 items-center rounded-sm border px-3 py-2.5 ${
                      isActive ? 'border-primary bg-primary' : 'border-border bg-surface'
                    }`}>
                    <Text className={`font-body-bold text-[13px] ${isActive ? 'text-on-primary' : 'text-text-muted'}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <DatePickerField
            label="Notice date"
            value={noticeDate}
            onChangeDate={(iso) => {
              setNoticeDate(iso);
              // A vacate date the person already typed in can become invalid
              // (before the new notice date) — drop it back to auto-calculated.
              if (manualVacateDate && manualVacateDate < iso) setManualVacateDate(null);
            }}
            accessibilityLabel="Notice date"
          />

          <DatePickerField
            label="Expected vacate date"
            value={expectedVacateDate}
            onChangeDate={setManualVacateDate}
            minimumDate={noticeDate}
            accessibilityLabel="Expected vacate date"
          />
          <Text className="-mt-2 font-body text-[12px] text-text-faint">
            Auto-calculated as notice date + notice period — editable if both parties agree to a different date.
          </Text>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Note (optional)</Text>
            <TextField
              value={note}
              onChangeText={setNote}
              placeholder="Anything worth recording about this notice"
              multiline
              numberOfLines={3}
              accessibilityLabel="Note"
            />
          </View>

          <Banner variant="info">
            <Text className="font-body text-[12.5px] leading-5 text-info-fg">
              This is a manual, deliberate action — nothing infers a notice from a conversation or a missed payment.
            </Text>
          </Banner>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            className={`w-full items-center justify-center rounded-sm px-4 py-3 active:opacity-90 ${
              canSubmit ? 'bg-primary' : 'bg-surface-2'
            }`}>
            <Text className={`font-body-bold text-[14px] ${canSubmit ? 'text-on-primary' : 'text-text-faint'}`}>
              {submitting ? 'Confirming…' : 'Confirm notice'}
            </Text>
          </Pressable>
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}
