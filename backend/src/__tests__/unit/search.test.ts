
// Simple mock for search result filtering logic as found in product.controller.ts
export const filterProductsByQuery = (products: any[], q: string) => {
    if (!q) return products;
    const searchTerms = q.toLowerCase().split(' ').filter(term => term.length > 0);
    return products.filter(product => {
        const searchableText = `${product.name} ${product.description || ''}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
    });
};

describe('Search Query Logic', () => {
    const mockProducts = [
        { name: 'Fresh Ackee', description: 'Canned or fresh ackee for breakfast' },
        { name: 'Red Onions', description: 'Organic red onions' },
        { name: 'Green Plantains', description: 'Hard green plantains' }
    ];

    it('should find products by name (case-insensitive)', () => {
        const results = filterProductsByQuery(mockProducts, 'ACKEE');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fresh Ackee');
    });

    it('should find products by description', () => {
        const results = filterProductsByQuery(mockProducts, 'organic');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Red Onions');
    });

    it('should handle multi-word queries (AND logic)', () => {
        const results = filterProductsByQuery(mockProducts, 'fresh ackee');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fresh Ackee');
    });

    it('should return all products for empty query', () => {
        const results = filterProductsByQuery(mockProducts, '');
        expect(results).toHaveLength(3);
    });

    it('should return empty array for no match', () => {
        const results = filterProductsByQuery(mockProducts, 'pizza');
        expect(results).toHaveLength(0);
    });
});
