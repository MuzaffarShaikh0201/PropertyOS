import { LegalDocument } from '@/components/legal/legal-document';
import { usePrivacy } from '@/features/legal-content/hooks';

export default function PrivacyScreen() {
  const { data, isLoading, error } = usePrivacy();
  return <LegalDocument title="Privacy Policy" content={data} isLoading={isLoading} error={error} />;
}
