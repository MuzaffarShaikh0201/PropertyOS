import { LegalDocument } from '@/components/legal/legal-document';
import { useTerms } from '@/features/legal-content/hooks';

export default function TermsScreen() {
  const { data, isLoading, error } = useTerms();
  return <LegalDocument title="Terms of Service" content={data} isLoading={isLoading} error={error} />;
}
