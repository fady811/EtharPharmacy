export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  sale_price: string | null;
  final_price: string;
  category_name: string;
  featured: boolean;
  is_on_sale: boolean;
  has_stock: boolean;
  primary_image: string | null;
  thumbnail_url?: string | null;
  stock_quantity: number;
  discount_percentage: number;
  created_at: string;
  updated_at?: string;
}


export interface ProductDetail extends Product {
  description: string;
  category: Category;
  subcategory?: Category;
  images: ProductImage[];
  stock_quantity: number;
}

export interface Category {
  id: number;
  name: string;
  parent: number | null;
  children: Category[];
  product_count: number;
  depth: number;
}

export interface ProductVariation {
  id: number;
  name: string;
  value: string;
  stock_quantity: number;
  is_available: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  image_url: string;
  thumbnail_url: string;
  order: number;
}

export interface StockInfo {
  total_stock: number;
  available_variations: number;
  total_variations: number;
  in_stock: boolean;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: string | null;
  previous_page: string | null;
}

export interface ProductsResponse {
  success: boolean;
  status: number;
  pagination: Pagination;
  data: Product[];
}

export interface ProductDetailResponse {
  success: boolean;
  status: number;
  data: ProductDetail;
}

export interface CategoriesResponse {
  success: boolean;
  status: number;
  data: Category[];
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data: T;
}

export interface ApiError {
  success: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ProductFilters {
  search?: string;
  category?: number;
  subcategory?: number;
  min_price?: number;
  max_price?: number;
  price_range?: 'budget' | 'standard' | 'premium' | 'luxury';
  featured?: boolean;
  in_stock?: boolean;
  on_sale?: boolean;
  created_after?: string;
  created_before?: string;
  sort?: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'featured' | 'popular';
  page?: number;
  page_size?: number;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

export interface OrderFormData {
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
}

export interface OrderResponse {
  success: boolean;
  status: number;
  data: {
    id: number;
    order_number: string;
    total: string;
    items: CartItem[];
    created_at: string;
  };
}
