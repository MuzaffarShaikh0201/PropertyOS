import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { DatePickerField } from '@/components/form/date-picker-field';
import { TextField } from '@/components/form/text-field';
import { ChipSelect } from '@/components/ui/chip-select';
import { formatInr, isValidIsoDate, todayIsoDate } from '@/features/agreements/calculations';

import { PAYMENT_MODES, type PaymentMode, type RentLedgerEntry } from './types';

type Choice = 'paid' | 'partial' | 'unpaid';

type RecordPaymentSheetProps = {
  entry: RentLedgerEntry | null;
  busy: boolean;
  onClose: () => void;
  onMarkPaid: (paymentMode: string | null) => void;
  onMarkPartial: (amountPaid: number, paidAt: string, paymentMode: string | null) => void;
  onMarkUnpaid: () => void;
};

/** The modal shell + visibility gate. The form itself is keyed by entry.id
 * below, so it remounts (and re-derives its initial state from that entry)
 * every time a different row is tapped, rather than syncing via an effect. */
export function RecordPaymentSheet({ entry, ...rest }: RecordPaymentSheetProps) {
  if (!entry) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={rest.onClose}>
      <RecordPaymentSheetForm key={entry.id} entry={entry} {...rest} />
    </Modal>
  );
}

function RecordPaymentSheetForm({
  entry,
  busy,
  onClose,
  onMarkPaid,
  onMarkPartial,
  onMarkUnpaid,
}: RecordPaymentSheetProps & { entry: RentLedgerEntry }) {
  const [choice, setChoice] = useState<Choice>(entry.status === 'unpaid' ? 'paid' : entry.status);
  const [amountPaid, setAmountPaid] = useState(entry.amountPaid ? String(entry.amountPaid) : '');
  const [paidAt, setPaidAt] = useState(entry.paidAt ?? todayIsoDate());
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>((entry.paymentMode as PaymentMode) ?? null);

  const isPartialValid =
    choice !== 'partial' || (amountPaid.trim().length > 0 && Number(amountPaid) > 0 && Number(amountPaid) < entry.amountDue);
  const isDateValid = choice !== 'partial' || isValidIsoDate(paidAt);
  const canSave = isPartialValid && isDateValid && !busy;

  const handleSave = () => {
    if (!canSave) return;
    if (choice === 'paid') onMarkPaid(paymentMode);
    else if (choice === 'partial') onMarkPartial(Number(amountPaid), paidAt, paymentMode);
    else onMarkUnpaid();
  };

  return (
    <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/40 px-6" accessibilityRole="button" accessibilityLabel="Close">
      <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm gap-3 rounded-md border border-border bg-surface p-4">
        <View>
          <Text className="font-display-extrabold text-[15px] text-text">{entry.periodStart}</Text>
          <Text className="font-body text-[12.5px] text-text-muted">Amount due: {formatInr(entry.amountDue)}</Text>
        </View>

        <ChipSelect
          options={[
            { value: 'paid' as Choice, label: 'Paid' },
            { value: 'partial' as Choice, label: 'Partial' },
            { value: 'unpaid' as Choice, label: 'Unpaid' },
          ]}
          value={choice}
          onChange={setChoice}
        />

        {choice === 'partial' ? (
          <View className="gap-3">
            <View className="gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">Amount paid (₹)</Text>
              <TextField
                value={amountPaid}
                onChangeText={(text) => setAmountPaid(text.replace(/\D/g, ''))}
                placeholder="15000"
                keyboardType="number-pad"
                accessibilityLabel="Amount paid"
              />
            </View>
            <DatePickerField label="Date paid" value={paidAt} onChangeDate={setPaidAt} accessibilityLabel="Date paid" />
          </View>
        ) : null}

        {choice !== 'unpaid' ? (
          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Payment mode (optional)</Text>
            <ChipSelect
              options={PAYMENT_MODES.map((mode) => ({ value: mode, label: mode }))}
              value={paymentMode}
              onChange={setPaymentMode}
            />
          </View>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          className={`w-full items-center justify-center rounded-sm px-4 py-2.5 active:opacity-90 ${
            canSave ? 'bg-primary' : 'bg-surface-2'
          }`}>
          <Text className={`font-body-bold text-[13px] ${canSave ? 'text-on-primary' : 'text-text-faint'}`}>
            {busy ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}
