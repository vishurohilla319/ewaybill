export type UserRole = "Admin" | "Accountant" | "Taxpayer" | "Transporter";

export interface UserAccount {
  id: string;
  userId: string; // Unique username for login
  fullName: string;
  email: string;
  password: string; // Stored securely
  role: UserRole;
  companyId: string;
  companyName: string;
  companyGstin: string;
  createdAt: string;
  lastLogin?: string;
  avatarColor?: string;
}

export interface AuthSession {
  user: UserAccount;
  token: string;
  loginTime: string;
}

export interface LoginCredentials {
  userId: string;
  password: string;
}

export interface RegisterPayload {
  userId: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  companyName: string;
  companyGstin: string;
  stateCode: number;
  pincode: string;
  address: string;
  place: string;
}
