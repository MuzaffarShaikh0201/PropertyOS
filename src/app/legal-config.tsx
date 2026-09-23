import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import { useLegalConfig, useLegalConfigVersions } from '@/features/legal-content/hooks';

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5 rounded-md border border-border bg-surface px-3.5 py-3">
      <Text className="font-body-bold text-[11px] uppercase tracking-wide text-text-muted">{label}</Text>
      {children}
    </View>
  );
}

export default function LegalConfigScreen() {
  const { data: config, isLoading, error } = useLegalConfig();
  const { data: versions } = useLegalConfigVersions();
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Maharashtra Compliance" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : error || !config ? (
        <View className="flex-1 items-center justify-center px-6">
          <Banner variant="error">
            <Text className="font-body text-[12.5px] leading-5 text-danger-fg">
              Couldn&apos;t load the compliance reference. Check your connection and try again.
            </Text>
          </Banner>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' }}>
          <ContentColumn className="gap-3">
            <View className="flex-row items-center justify-between rounded-md border border-border bg-surface px-3.5 py-3">
              <View className="gap-0.5">
                <Text className="font-body-bold text-[13px] text-text">Legal Config v{config.version}</Text>
                <Text className="font-body text-[12px] text-text-muted">Last updated {config.lastUpdated}</Text>
              </View>
              <Pressable onPress={() => setShowChangelog((v) => !v)} accessibilityRole="button">
                <Text className="font-body-bold text-[13px] text-primary">Changelog</Text>
              </Pressable>
            </View>

            {showChangelog ? (
              <View className="gap-2 rounded-md border border-border bg-surface-2 px-3.5 py-3">
                {(versions ?? []).length === 0 ? (
                  <Text className="font-body text-[12px] text-text-muted">No history available.</Text>
                ) : (
                  versions
                    ?.slice()
                    .reverse()
                    .map((version) => (
                      <Text key={version} className="font-body-bold text-[12.5px] text-text">
                        {version}
                      </Text>
                    ))
                )}
              </View>
            ) : null}

            <Card label="Registration">
              <Text className="font-body-medium text-[13px] text-text">{config.registration.summary}</Text>
              <Text className="font-body text-[12px] leading-4 text-text-muted">
                Window: {config.registration.windowMonths} months from execution date · duty on{' '}
                {config.registration.dutyOn} · {config.registration.nonRegistrationRisk}
              </Text>
            </Card>

            <Card label="Maximum tenure">
              <Text className="font-body-medium text-[13px] text-text">
                {config.maxTenureMonths} months ({Math.round(config.maxTenureMonths / 12)} years) per agreement
              </Text>
            </Card>

            <Card label="Stamp duty formula">
              <Text className="font-body-medium text-[13px] text-text">{config.stampDuty.formula}</Text>
            </Card>

            <Card label="Witnesses">
              <Text className="font-body-medium text-[13px] text-text">
                {config.witnessesRequired} required for a registered agreement
              </Text>
            </Card>

            <Card label="Police verification">
              <Text className="font-body-medium text-[13px] text-text">{config.policeVerification.summary}</Text>
              <Text className="font-body text-[12px] leading-4 text-text-muted">
                {config.policeVerification.note}
              </Text>
            </Card>

            <Banner variant="warning">
              <Text className="font-body text-[12.5px] leading-5 text-warning-fg">{config.disclaimer}</Text>
            </Banner>
          </ContentColumn>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
