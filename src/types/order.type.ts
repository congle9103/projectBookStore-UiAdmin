export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    product_name: string;
    price: number;
  };
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  _id: string;
  customer: {
    _id: string;
    full_name: string;
    phone: string;
  };
  staff: {
    _id: string;
    full_name: string;
  };
  items: OrderItem[];
  status: "pending" | "processing" | "shipping" | "completed" | "cancelled";
  payment_method:
    | "cash_on_delivery"
    | "zalopay"
    | "vnpay"
    | "shopeepay"
    | "momo"
    | "atm"
    | "visa";
  total_amount: number;
  shipping_address: string;
  city: "Hà Nội" | "TP Hồ Chí Minh" | "Đà Nẵng";
  recipient_name: string;
  recipient_phone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  data: Order[];
  total: number;
}

// Khai báo type cho params
export type OrderQueryParams = {
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
};
