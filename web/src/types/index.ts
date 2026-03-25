export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';
    profilePhotoUrl?: string;
    profile?: UserProfile;
}

export interface UserProfile {
    dietaryPreferences?: string[];
    cuisinePreferences?: string[];
}

export interface Store {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    coverPhotoUrl?: string;
    cuisineTypes: string[];
    specialtyTags?: string[];
    averageRating: number;
    deliveryRadiusKm?: number;
}

export interface Product {
    id: string;
    storeId: string;
    name: string;
    slug: string;
    description?: string;
    regularPrice: number;
    salePrice?: number;
    stockQuantity: number;
    unit?: string;
    images?: ProductImage[];
    store?: Store;
}

export interface ProductImage {
    id: string;
    url: string;
}

export interface CartItem {
    id: string;
    cartId: string;
    storeId: string;
    productId: string;
    product: Product;
    productVariantId?: string;
    quantity: number;
    createdAt: string;
}

export interface Cart {
    id: string;
    userId: string;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}
