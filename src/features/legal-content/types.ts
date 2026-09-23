export type LegalConfig = {
  version: string;
  state: string;
  lastUpdated: string;
  registration: {
    summary: string;
    windowMonths: number;
    dutyOn: string;
    nonRegistrationRisk: string;
  };
  maxTenureMonths: number;
  stampDuty: { formula: string };
  witnessesRequired: number;
  policeVerification: { summary: string; note: string };
  disclaimer: string;
};

export type LegalDocumentSection = {
  heading: string;
  body: string;
};

export type LegalDocumentContent = {
  effectiveDate: string;
  intro: string;
  sections: LegalDocumentSection[];
};
