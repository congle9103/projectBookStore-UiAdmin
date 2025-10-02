export interface Product {
  _id: string;
  product_name: string;
  category_id: string;
  isNew: boolean;
  isPopular: boolean;
  isFlashSale: boolean;
  slug: string;
  thumbnails?: string[];
  supplier: string;
  publisher: string;
  authors: string[];
  length?: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  publicationYear?: number;
  language?: string;
  weight?: number;
  dimensions?: string;
  pages?: number;
  format?: string;
  createdAt: string; // thường API trả ISO date string
  updatedAt: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
}

