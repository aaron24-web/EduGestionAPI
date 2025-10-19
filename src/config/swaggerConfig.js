import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduGestión API',
      version: '1.0.0',
      description: 'API para la plataforma SaaS EduGestión (Modelo Consultivo) [cite: 3, 4, 84]',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Servidor de Desarrollo',
      },
    ],
    // Definir la seguridad para JWT (Token Bearer)
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT de Supabase Auth',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Apunta a los archivos que contienen la documentación
  apis: ['./src/routes/*.js'], 
};

export const swaggerSpec = swaggerJsdoc(options);