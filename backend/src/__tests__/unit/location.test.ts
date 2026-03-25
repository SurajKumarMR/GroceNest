
import { addressSchema, storeSchema } from '../../utils/validation';

describe('Location & Postcode Validation', () => {
    describe('UK Postcode Regex', () => {
        it('should accept valid UK postcodes with different formats', () => {
            const validPostcodes = [
                'B10 0XE',
                'SW1A 1AA',
                'M1 1AA',
                'CR2 6XH',
                'DN55 1PT',
                'B1 1BB'
            ];

            validPostcodes.forEach(postcode => {
                const result = addressSchema.shape.zipCode.safeParse(postcode);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid UK postcodes', () => {
            const invalidPostcodes = [
                '12345',
                'ABC DE',
                'B100XE', // Missing space (schema requires space per regex)
                'INVALID',
                '1A 1AA'
            ];

            invalidPostcodes.forEach(postcode => {
                const result = addressSchema.shape.zipCode.safeParse(postcode);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('Store Location Schema', () => {
        it('should validate complete store location data', () => {
            const validStore = {
                name: 'Test Store',
                slug: 'test-store',
                streetAddress: '123 Fake St',
                city: 'Birmingham',
                postalCode: 'B10 0XE',
                country: 'UK',
                latitude: 52.4862,
                longitude: -1.8904,
                cuisineTypes: ['Caribbean']
            };
            const result = storeSchema.safeParse(validStore);
            expect(result.success).toBe(true);
        });

        it('should reject missing coordinates', () => {
            const invalidStore = {
                name: 'Test Store',
                slug: 'test-store',
                streetAddress: '123 Fake St',
                city: 'Birmingham',
                postalCode: 'B10 0XE',
                country: 'UK',
                cuisineTypes: ['Caribbean']
            };
            const result = storeSchema.safeParse(invalidStore);
            expect(result.success).toBe(false);
        });
    });
});
