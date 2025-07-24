import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Leave Management API",
      version: "1.0.0",
      description: "API for submitting and managing leave applications.",
    },
    servers: [
      {
        url: "http://localhost:5000", // update this if needed
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // path to your route files for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
