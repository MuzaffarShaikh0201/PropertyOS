import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import type { LegalDocumentContent } from '@/features/legal-content/types';

type LegalDocumentProps = {
  title: string;
  content: LegalDocumentContent | undefined;
  isLoading: boolean;
  error: unknown;
};

export function LegalDocument({ title, content, isLoading, error }: LegalDocumentProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title={title} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : error || !content ? (
        <View className="flex-1 items-center justify-center px-6">
          <Banner variant="error">
            <Text className="font-body text-[12.5px] leading-5 text-danger-fg">
              Couldn&apos;t load {title.toLowerCase()}. Check your connection and try again.
            </Text>
          </Banner>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' }}>
          <ContentColumn className="gap-4">
            <View className="gap-1">
              <Text className="font-body text-[12px] text-text-muted">Effective {content.effectiveDate}</Text>
              <Text className="font-body text-[13px] leading-5 text-text-muted">{content.intro}</Text>
            </View>

            {content.sections.map((section) => (
              <View key={section.heading} className="gap-1.5">
                <Text className="font-display-extrabold text-[14px] text-text">{section.heading}</Text>
                <Text className="font-body text-[13px] leading-5 text-text-muted">{section.body}</Text>
              </View>
            ))}
          </ContentColumn>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
