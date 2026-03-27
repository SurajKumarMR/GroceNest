
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';
    profilePhotoUrl?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface Store {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    coverPhotoUrl?: string;
    cuisineTypes: string[];
    averageRating: number;
    totalReviews: number;
}

export interface Product {
    id: string;
    storeId: string;
    name: string;
    slug: string;
    description?: string;
    regularPrice: number;
    salePrice?: number;
    unit?: string;
    images: ProductImage[];
    store?: {
        name: string;
    };
}

export interface ProductImage {
    id: string;
    url: string;
}

export interface CartItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
}

export interface Address {
    id: string;
    userId: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    totalAmount: number;
    placedAt: string;
    storeId: string;
    store: {
        name: string;
        logoUrl?: string;
    };
    orderItems: OrderItem[];
    reviews?: any[];
}

export interface OrderItem {
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
}
