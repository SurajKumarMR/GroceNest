import { Express, Request, Response } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GroceNest API Specification',
            version: '1.0.0',
            description: 'Comprehensive REST API documentation for GroceNest e-commerce, merchant, delivery, payment, notification, and admin services.',
            contact: {
                name: 'GroceNest Engineering Team',
                email: 'dev@grocenest.co.uk',
                url: 'https://grocenest.co.uk'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Local Development Server'
            },
            {
                url: 'https://api.grocenest.co.uk',
                description: 'Production Server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT Bearer token in the format: Bearer <JWT_TOKEN>'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'usr_12345' },
                        email: { type: 'string', example: 'customer@example.com' },
                        firstName: { type: 'string', example: 'Jane' },
                        lastName: { type: 'string', example: 'Doe' },
                        role: { type: 'string', enum: ['CUSTOMER', 'MERCHANT', 'DRIVER', 'ADMIN'], example: 'CUSTOMER' },
                        createdAt: { type: 'string', format: 'date-time', example: '2026-07-24T18:00:00.000Z' }
                    }
                },
                Store: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'str_67890' },
                        name: { type: 'string', example: 'Fresh Organic Grocery' },
                        slug: { type: 'string', example: 'fresh-organic-grocery' },
                        streetAddress: { type: 'string', example: '123 High Street' },
                        city: { type: 'string', example: 'London' },
                        postalCode: { type: 'string', example: 'EC1A 1BB' },
                        country: { type: 'string', example: 'UK font' },
                        latitude: { type: 'number', example: 51.5074 },
                        longitude: { type: 'number', example: -0.1278 },
                        cuisineTypes: { type: 'array', items: { type: 'string' }, example: ['organic', 'dairy', 'bakery'] },
                        ownerId: { type: 'string', example: 'usr_owner_123' }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'prd_11223' },
                        storeId: { type: 'string', example: 'str_67890' },
                        name: { type: 'string', example: 'Organic Semi-Skimmed Milk 2L' },
                        description: { type: 'string', example: 'Fresh organic British milk' },
                        price: { type: 'number', example: 2.45 },
                        category: { type: 'string', example: 'Dairy' },
                        stockQuantity: { type: 'integer', example: 50 },
                        imageUrl: { type: 'string', example: '/uploads/products/milk.jpg' }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'ord_99887' },
                        orderNumber: { type: 'string', example: 'ORD-20260724-1001' },
                        userId: { type: 'string', example: 'usr_12345' },
                        storeId: { type: 'string', example: 'str_67890' },
                        subtotal: { type: 'number', example: 15.50 },
                        deliveryFee: { type: 'number', example: 2.99 },
                        taxAmount: { type: 'number', example: 1.20 },
                        tipAmount: { type: 'number', example: 2.00 },
                        totalAmount: { type: 'number', example: 21.69 },
                        status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'], example: 'CONFIRMED' },
                        paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'failed', 'refunded'], example: 'paid' }
                    }
                },
                NotificationPreference: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'np_111' },
                        userId: { type: 'string', example: 'usr_12345' },
                        pushEnabled: { type: 'boolean', example: true },
                        smsEnabled: { type: 'boolean', example: true },
                        emailEnabled: { type: 'boolean', example: true }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Resource not found or unauthorized' }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Operation completed successfully' }
                    }
                }
            }
        }
    },
    apis: [
        './src/routes/*.ts',
        './src/routes/*.js',
        './src/config/*.ts',
        './dist/routes/*.js'
    ]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express): void => {
    // Serve JSON specification endpoint
    app.get('/api/docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Serve interactive Swagger UI
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'GroceNest API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true
        }
    }));
};

export { swaggerSpec };
