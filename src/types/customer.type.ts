export interface Customer {
  _id: string;
  username: string;
  full_name: string;
  avatar?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  point?: number;
  totalSpent?: number;
  is_active: boolean;
  createdAt: string;
}
