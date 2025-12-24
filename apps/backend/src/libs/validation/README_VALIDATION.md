# ✅ Validation Stricte - Guide d'utilisation

## Vue d'ensemble

Le système de validation utilise **class-validator** et **Zod** pour une validation stricte et uniforme sur tous les endpoints.

## Caractéristiques

- ✅ **Validation stricte** : whitelist, forbidNonWhitelisted
- ✅ **Transformation automatique** : types convertis automatiquement
- ✅ **Messages d'erreur détaillés** : format structuré
- ✅ **Sanitization** : protection XSS et HTML
- ✅ **Validators personnalisés** : helpers réutilisables

## Validation Pipe

Le `ValidationPipe` est configuré globalement avec :

```typescript
{
  whitelist: true,              // Supprime les propriétés non décorées
  forbidNonWhitelisted: true,   // Rejette les propriétés non autorisées
  transform: true,              // Transforme les types
  transformOptions: {
    enableImplicitConversion: true, // Conversion implicite
  },
}
```

## Utilisation avec class-validator

### DTO de base

```typescript
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ description: 'Password', minLength: 8 })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;
}
```

### Validators personnalisés

```typescript
import { IsUrlOrEmpty, IsStrongPassword } from '@/libs/validation/validation-helpers';

export class UpdateProfileDto {
  @IsOptional()
  @IsUrlOrEmpty({ message: 'Avatar must be a valid URL or empty' })
  avatar?: string;

  @IsStrongPassword({ message: 'Password is too weak' })
  password: string;
}
```

## Utilisation avec Zod

Pour les cas complexes ou la validation runtime :

```typescript
import { createZodPipe } from '@/libs/validation/zod-validation.pipe';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  description: z.string().optional(),
});

@Post()
@UsePipes(createZodPipe(createProductSchema))
async create(@Body() data: z.infer<typeof createProductSchema>) {
  // data est validé et typé
}
```

## Helpers Zod

```typescript
import { CommonZodSchemas, createPaginationSchema } from '@/libs/validation/validation-helpers';

// Schémas communs
const emailSchema = CommonZodSchemas.email;
const passwordSchema = CommonZodSchemas.password;
const uuidSchema = CommonZodSchemas.uuid;

// Pagination
const paginationSchema = createPaginationSchema();
```

## Décorateurs disponibles

### class-validator standards

- `@IsString()` - Doit être une chaîne
- `@IsEmail()` - Doit être un email valide
- `@IsNotEmpty()` - Ne doit pas être vide
- `@IsOptional()` - Optionnel
- `@MinLength(n)` - Longueur minimale
- `@MaxLength(n)` - Longueur maximale
- `@IsNumber()` - Doit être un nombre
- `@IsInt()` - Doit être un entier
- `@IsPositive()` - Doit être positif
- `@IsEnum()` - Doit être une valeur d'enum
- `@IsUrl()` - Doit être une URL valide
- `@IsUUID()` - Doit être un UUID
- `@IsDate()` - Doit être une date
- `@IsBoolean()` - Doit être un booléen
- `@IsArray()` - Doit être un tableau
- `@IsObject()` - Doit être un objet
- `@ValidateNested()` - Valider les objets imbriqués
- `@Type()` - Type de transformation

### Validators personnalisés

- `@IsStrongPassword()` - Mot de passe fort
- `@IsUrlOrEmpty()` - URL valide ou vide
- `@IsJsonString()` - Chaîne JSON valide

## Exemples

### Exemple 1: DTO simple

```typescript
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

### Exemple 2: DTO avec validation imbriquée

```typescript
export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  designId: string;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}
```

### Exemple 3: DTO avec options

```typescript
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
```

## Messages d'erreur

Les erreurs de validation sont retournées au format :

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Email must be a valid email address"],
    "password": [
      "Password must be at least 8 characters",
      "Password must contain at least one uppercase letter"
    ]
  }
}
```

## Bonnes pratiques

1. **Toujours utiliser `@IsNotEmpty()`** pour les champs requis
2. **Utiliser `@IsOptional()`** pour les champs optionnels
3. **Ajouter `@MaxLength()`** pour limiter la taille des chaînes
4. **Utiliser `@ValidateNested()`** pour les objets imbriqués
5. **Ajouter des messages personnalisés** pour une meilleure UX
6. **Utiliser Zod** pour les validations complexes ou runtime

## Sanitization

Le `ValidationPipe` sanitize automatiquement :
- **XSS** : Protection contre les attaques XSS
- **HTML** : Suppression des balises HTML
- **Nested objects** : Sanitization récursive

## Performance

- **Validation synchrone** : class-validator (rapide)
- **Validation asynchrone** : Zod (pour cas complexes)
- **Cache** : Les validators sont mis en cache

