# Zod Validation Pipe

## Usage

### 1. Define Zod Schema

```typescript
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  brandId: z.string().uuid(),
  isPublic: z.boolean().default(false),
});
```

### 2. Use in Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ZodValidationPipe } from '@/common/validation/zod-validation.pipe';
import { CreateProductSchema } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  @Post()
  async create(
    @Body(new ZodValidationPipe()) data: z.infer<typeof CreateProductSchema>
  ) {
    // data is now fully typed and validated
    return this.productsService.create(data);
  }
}
```

### 3. Use in DTO

```typescript
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
```

## Benefits

- ✅ Type-safe validation
- ✅ Automatic error messages
- ✅ Sanitized error logging
- ✅ Works with TypeScript inference
- ✅ Composable schemas

