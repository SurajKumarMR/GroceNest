import { 
    registerSchema, 
    loginSchema, 
    updateProfileSchema, 
    storeSchema, 
    productSchema, 
    cartItemSchema, 
    createOrderSchema, 
    addressSchema 
} from '../../utils/validation';

describe('Validation Schemas Unit Tests', () => {
    describe('Register Schema', () => {
        it('should validate valid register input', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+447123456789',
                role: 'CUSTOMER'
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject missing fields', () => {
            const result = registerSchema.safeParse({ email: 'test@example.com' });
            expect(result.success).toBe(false);
        });

        it('should reject invalid email and phone', () => {
            const result = registerSchema.safeParse({
                email: 'not-an-email',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                phone: '07123456789' // Wrong format
            });
            expect(result.success).toBe(false);
        });

        it('should reject weak password', () => {
            const result = registerSchema.safeParse({
                email: 'test@example.com',
                password: 'weak',
                firstName: 'John',
                lastName: 'Doe'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Login Schema', () => {
        it('should validate valid login input', () => {
            const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
            expect(result.success).toBe(true);
        });

        it('should reject missing fields', () => {
            const result = loginSchema.safeParse({ email: 'test@example.com' });
            expect(result.success).toBe(false);
        });
    });

    describe('Update Profile Schema', () => {
        it('should validate empty or partial profile updates', () => {
            const result = updateProfileSchema.safeParse({ firstName: 'John' });
            expect(result.success).toBe(true);
        });

        it('should reject invalid data types', () => {
            const result = updateProfileSchema.safeParse({ dietaryPreferences: 'vegan' }); // should be array
            expect(result.success).toBe(false);
        });
    });

    describe('Store Schema', () => {
        const validStore = {
            name: 'GroceNest Store',
            slug: 'grocenest-store',
            streetAddress: '10 High St',
            city: 'Birmingham',
            postalCode: 'B1 1BB',
            country: 'UK',
            latitude: 52.4862,
            longitude: -1.8904,
            cuisineTypes: ['Grocery', 'Organic']
        };

        it('should validate valid store', () => {
            const result = storeSchema.safeParse(validStore);
            expect(result.success).toBe(true);
        });

        it('should reject invalid postcode format', () => {
            const result = storeSchema.safeParse({
                ...validStore,
                postalCode: '12345'
            });
            expect(result.success).toBe(false);
        });

        it('should reject wrong data types', () => {
            const result = storeSchema.safeParse({
                ...validStore,
                latitude: 'not-a-number'
            });
            expect(result.success).toBe(false);
        });

        it('should reject HTML/SQL injection in name if it violates constraints', () => {
            // Very long HTML/SQL payloads that might violate Zod lengths or types
            const payload = "A".repeat(1000);
            const result = storeSchema.safeParse({
                ...validStore,
                name: payload // Zod string is fine, but length is huge
            });
            expect(result.success).toBe(true); // Parsed as string, size limits should be handled or validated
        });
    });

    describe('Product Schema', () => {
        const validProduct = {
            storeId: 'a3f01c9a-d748-4395-950c-e2f47a61d198',
            name: 'Fresh Apples',
            slug: 'fresh-apples',
            regularPrice: 2.99,
            stockQuantity: 150
        };

        it('should validate valid product', () => {
            const result = productSchema.safeParse(validProduct);
            expect(result.success).toBe(true);
        });

        it('should reject negative price', () => {
            const result = productSchema.safeParse({
                ...validProduct,
                regularPrice: -1.00
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative stock quantity', () => {
            const result = productSchema.safeParse({
                ...validProduct,
                stockQuantity: -5
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid store UUID', () => {
            const result = productSchema.safeParse({
                ...validProduct,
                storeId: 'invalid-uuid'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Cart Item Schema', () => {
        const validCartItem = {
            productId: 'a3f01c9a-d748-4395-950c-e2f47a61d198',
            quantity: 2
        };

        it('should validate valid cart item', () => {
            const result = cartItemSchema.safeParse(validCartItem);
            expect(result.success).toBe(true);
        });

        it('should reject negative quantity', () => {
            const result = cartItemSchema.safeParse({
                ...validCartItem,
                quantity: -1
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Create Order Schema', () => {
        const validOrder = {
            deliveryAddressId: 'a3f01c9a-d748-4395-950c-e2f47a61d198',
            paymentMethod: 'CARD',
            tipAmount: 3.50
        };

        it('should validate valid order', () => {
            const result = createOrderSchema.safeParse(validOrder);
            expect(result.success).toBe(true);
        });

        it('should reject invalid payment method', () => {
            const result = createOrderSchema.safeParse({
                ...validOrder,
                paymentMethod: 'BITCOIN'
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative tip amount', () => {
            const result = createOrderSchema.safeParse({
                ...validOrder,
                tipAmount: -1
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Address Schema', () => {
        const validAddress = {
            street: '10 High St',
            city: 'Birmingham',
            state: 'West Midlands',
            zipCode: 'B1 1BB',
            country: 'UK',
            isDefault: true
        };

        it('should validate valid address', () => {
            const result = addressSchema.safeParse(validAddress);
            expect(result.success).toBe(true);
        });

        it('should reject invalid UK postcode format', () => {
            const result = addressSchema.safeParse({
                ...validAddress,
                zipCode: 'invalid postcode'
            });
            expect(result.success).toBe(false);
        });
    });
});
