import { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GroceNest API Specification',
            version: '1.0.0',
            description: 'Comprehensive API documentation for GroceNest Backend services',
            contact: {
                name: 'GroceNest Team',
                email: 'dev@grocenest.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your Bearer token in the format: Bearer <JWT>'
                }
            }
        }
    },
    // Scan both TypeScript source files and compiled JavaScript files
    apis: [
        './src/routes/*.ts',
        './src/routes/*.js',
        './src/docs/*.ts',
        './src/docs/*.js',
        './src/docs/*.yaml',
        './dist/routes/*.js'
    ]
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
export { swaggerSpec };
