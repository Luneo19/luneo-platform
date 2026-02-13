import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for test webhook endpoint
 * Accepts any object payload for testing webhook functionality
 * 
 * Note: This DTO provides type safety and Swagger documentation.
 * Validation that the payload is an object is handled by NestJS ValidationPipe
 * configured to accept any object structure for this flexible endpoint.
 */
export class TestWebhookDto implements Record<string, unknown> {
  // Flexible payload structure - accepts any object properties
  [key: string]: unknown;
}
