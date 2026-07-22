import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { OrderStatus, Role } from '@prisma/client';

jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: () => 'KVKFKRJTMR2HSKSK',
        check: () => true,
        keyuri: () => 'otpauth://totp/GroceNest:test@example.com?secret=KVKFKRJTMR2HSKSK&issuer=GroceNest'
    }
}));

jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock'
}));

describe('Driver Dispatch & Acceptance Integration Tests', () => {
    let customerToken: string;
    let customerId: string;
    
    let merchantToken: string;
    let merchantId: string;
    
    let driver1Token: string;
    let driver1Id: string;
    
    let driver2Token: string;
    let driver2Id: string;

    let storeId: string;
    let productId: string;
    let addressId: string;
    let orderId: string;

    beforeAll(async () => {
        // 1. Register Customer
        const customerRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: `customer-${Date.now()}@example.com`,
                password: 'GrocNest-Secure-Pass-2026!',
                firstName: 'Test',
                lastName: 'Customer',
                phone: '+447000000010'
            });
        customerToken = customerRes.body.token;
        customerId = customerRes.body.user.id;

        // 2. Register Merchant
        const merchantRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: `merchant-${Date.now()}@example.com`,
                password: 'GrocNest-Secure-Pass-2026!',
                firstName: 'Test',
                lastName: 'Merchant',
                phone: '+447000000011',
                role: Role.MERCHANT
            });
        merchantToken = merchantRes.body.token;
        merchantId = merchantRes.body.user.id;

        // 3. Register Driver 1 (Unapproved initially)
        const driver1Res = await request(app)
            .post('/api/auth/register')
            .send({
                email: `driver1-${Date.now()}@example.com`,
                password: 'GrocNest-Secure-Pass-2026!',
                firstName: 'Test',
                lastName: 'Driver1',
                phone: '+447000000012',
                role: Role.DRIVER
            });
        driver1Token = driver1Res.body.token;
        driver1Id = driver1Res.body.user.id;

        // 4. Register Driver 2 (Approved immediately)
        const driver2Res = await request(app)
            .post('/api/auth/register')
            .send({
                email: `driver2-${Date.now()}@example.com`,
                password: 'GrocNest-Secure-Pass-2026!',
                firstName: 'Test',
                lastName: 'Driver2',
                phone: '+447000000013',
                role: Role.DRIVER
            });
        driver2Token = driver2Res.body.token;
        driver2Id = driver2Res.body.user.id;

        // Set driver2 to approved
        await prisma.user.update({
            where: { id: driver2Id },
            data: { isDriverApproved: true }
        });

        // 5. Create Address for Customer
        const addrRes = await request(app)
            .post('/api/users/addresses')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                street: '20 High St',
                city: 'Birmingham',
                state: 'West Midlands',
                zipCode: 'B1 1BB',
                country: 'UK',
                isDefault: true
            });
        addressId = addrRes.body.id;

        // 6. Create Store for Merchant
        const storeRes = await request(app)
            .post('/api/stores')
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({
                name: 'Driver Test Store',
                slug: `driver-store-${Date.now()}`,
                streetAddress: '123 Test St',
                city: 'Birmingham',
                postalCode: 'B10 1AA',
                country: 'UK',
                latitude: 52.4862,
                longitude: -1.8904,
                cuisineTypes: ['Caribbean']
            });
        storeId = storeRes.body.id;

        // 7. Create Product
        const prodRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({
                storeId,
                name: 'Driver Test Plantain',
                slug: `driver-plantain-${Date.now()}`,
                regularPrice: 3.50,
                stockQuantity: 100,
                status: 'active'
            });
        productId = prodRes.body.id;
    });

    afterAll(async () => {
        // Cleanup all records created
        const userIds = [customerId, merchantId, driver1Id, driver2Id].filter(Boolean);
        if (userIds.length > 0) {
            await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
        }
        if (storeId) {
            await prisma.store.delete({ where: { id: storeId } }).catch(() => {});
        }
        await prisma.$disconnect();
    });

    it('should place an order, prepare it, and follow driver flows', async () => {
        // 1. Add product to cart
        await request(app)
            .post('/api/cart/items')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ productId, quantity: 1 });

        // 2. Place Order
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                deliveryAddressId: addressId,
                paymentMethod: 'CASH',
                tipAmount: 2.00
            });

        expect(orderRes.status).toBe(201);
        orderId = orderRes.body.orders[0].id;
        expect(orderId).toBeDefined();

        // 3. Unapproved driver tries to view available orders -> should be rejected
        const unapprovedAvailRes = await request(app)
            .get('/api/driver/available')
            .set('Authorization', `Bearer ${driver1Token}`);
        expect(unapprovedAvailRes.status).toBe(403);

        // 4. Unapproved driver tries to accept order -> should be rejected
        const unapprovedAcceptRes = await request(app)
            .post(`/api/driver/orders/${orderId}/accept`)
            .set('Authorization', `Bearer ${driver1Token}`);
        expect(unapprovedAcceptRes.status).toBe(403);

        // 5a. Merchant updates order status to CONFIRMED
        const statusRes1 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: OrderStatus.CONFIRMED });
        expect(statusRes1.status).toBe(200);

        // 5b. Merchant updates order status to PREPARING
        const statusRes2 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: OrderStatus.PREPARING });
        expect(statusRes2.status).toBe(200);

        // 5c. Merchant updates order status to READY
        const statusRes3 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: OrderStatus.READY });
        expect(statusRes3.status).toBe(200);

        // 6. Approved driver views available orders -> should see it
        const approvedAvailRes = await request(app)
            .get('/api/driver/available')
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(approvedAvailRes.status).toBe(200);
        const availOrders = approvedAvailRes.body;
        const found = availOrders.find((o: any) => o.id === orderId);
        expect(found).toBeDefined();

        // 7. Approved driver accepts the order
        const acceptRes = await request(app)
            .post(`/api/driver/orders/${orderId}/accept`)
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(acceptRes.status).toBe(200);
        expect(acceptRes.body.driverId).toBe(driver2Id);
        expect(acceptRes.body.status).toBe(OrderStatus.OUT_FOR_DELIVERY);

        // 8. Approved driver tries to accept again -> should be rejected (double-assignment prevention)
        const reAcceptRes = await request(app)
            .post(`/api/driver/orders/${orderId}/accept`)
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(reAcceptRes.status).toBe(400);

        // 9. Check driver's active deliveries
        const myDeliveriesRes = await request(app)
            .get('/api/driver/my-deliveries')
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(myDeliveriesRes.status).toBe(200);
        expect(myDeliveriesRes.body.find((o: any) => o.id === orderId)).toBeDefined();

        // 10. Driver marks order as delivered
        const deliverRes = await request(app)
            .post(`/api/driver/orders/${orderId}/deliver`)
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(deliverRes.status).toBe(200);
        expect(deliverRes.body.status).toBe(OrderStatus.DELIVERED);
        expect(deliverRes.body.deliveredAt).toBeDefined();
    });
});
