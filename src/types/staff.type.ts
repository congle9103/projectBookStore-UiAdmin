export interface Staff {
  _id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "admin" | "dev";
  salary?: number;
  hire_date?: string;
  is_active: boolean;
  createdAt: string;
}