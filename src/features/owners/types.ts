export type Owner = {
  id: string;
  userId: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  aadhaarNumber: string | null;
  panNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnerInput = {
  name: string;
  relation: string;
  phone: string;
  email?: string | null;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
};
