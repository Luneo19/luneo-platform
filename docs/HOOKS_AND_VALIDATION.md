# Hooks React et Validation - Guide Professionnel

## 📋 Vue d'ensemble

Ce document décrit les hooks React professionnels et les utilitaires de validation pour la plateforme Luneo, garantissant une qualité mondiale et une cohérence parfaite.

## 🎣 Hooks React Professionnels

### useApi

Hook générique pour les appels API avec gestion automatique des états.

```typescript
import { useApi } from '@/lib/hooks/useApi';

function MyComponent() {
  const { data, loading, error, execute, refetch } = useApi(
    async (id: string) => {
      const response = await fetch(`/api/data/${id}`);
      const result = await response.json();
      return result.data;
    },
    {
      immediate: true, // Exécuter automatiquement
      onSuccess: (data) => console.log('Success:', data),
      onError: (error) => console.error('Error:', error),
      retry: {
        attempts: 3,
        delay: 1000,
      },
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

**Fonctionnalités**:
- ✅ Gestion automatique des états (loading, error, data)
- ✅ Retry automatique
- ✅ Annulation de requêtes (AbortController)
- ✅ Callbacks onSuccess/onError
- ✅ Refetch manuel

### useMutation

Hook pour les mutations API (POST, PUT, DELETE).

```typescript
import { useMutation } from '@/lib/hooks/useApi';

function CreateUserForm() {
  const { mutate, loading, error, data } = useMutation(
    async (userData: { name: string; email: string }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const result = await response.json();
      return result.data;
    },
    {
      onSuccess: (data) => {
        console.log('User created:', data);
        // Redirect or show success message
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate({ name: 'John', email: 'john@example.com' });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={loading}>Create</button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

### useQuery

Hook pour les requêtes GET avec cache.

```typescript
import { useQuery } from '@/lib/hooks/useApi';

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, refetch, isFetching, isSuccess } = useQuery(
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const result = await response.json();
      return result.data;
    },
    {
      enabled: !!userId, // Exécuter seulement si userId existe
      immediate: true,
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### usePaginatedQuery

Hook pour les requêtes paginées.

```typescript
import { usePaginatedQuery } from '@/lib/hooks/useApi';

function PaginatedList() {
  const {
    data,
    loading,
    error,
    page,
    total,
    hasMore,
    nextPage,
    previousPage,
    goToPage,
  } = usePaginatedQuery(
    async ({ page, limit, offset }) => {
      const response = await fetch(`/api/items?page=${page}&limit=${limit}`);
      const result = await response.json();
      return {
        data: result.data.items,
        total: result.data.total,
        page,
        limit,
        hasMore: result.data.hasMore,
      };
    },
    {
      initialPage: 1,
      initialLimit: 20,
      enabled: true,
    }
  );

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      <div>
        <button onClick={previousPage} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page} of {Math.ceil(total / 20)}</span>
        <button onClick={nextPage} disabled={!hasMore}>
          Next
        </button>
      </div>
    </div>
  );
}
```

## ✅ Utilitaires de Validation

### Validation Basique

```typescript
import {
  validateEmail,
  validatePassword,
  validateUrl,
  validatePhone,
  validateLength,
  validateRequired,
  validateRange,
} from '@/lib/utils/validation';

// Email
const isValidEmail = validateEmail('user@example.com'); // true

// Password
const passwordResult = validatePassword('SecurePass123');
if (!passwordResult.valid) {
  console.log(passwordResult.errors);
}

// URL
const isValidUrl = validateUrl('https://example.com'); // true

// Phone
const isValidPhone = validatePhone('+33612345678'); // true

// Length
const lengthResult = validateLength('text', 3, 10);
if (!lengthResult.valid) {
  console.log(lengthResult.errors);
}

// Required
const requiredResult = validateRequired(value, 'fieldName');
if (!requiredResult.valid) {
  console.log(requiredResult.errors);
}

// Range
const rangeResult = validateRange(42, 0, 100, 'age');
if (!rangeResult.valid) {
  console.log(rangeResult.errors);
}
```

### Validation avec Schéma

```typescript
import { validateSchema } from '@/lib/utils/validation';

const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  website: 'https://example.com',
};

const result = validateSchema(userData, {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
  },
  email: {
    required: true,
    type: 'string',
    email: true,
  },
  age: {
    required: true,
    type: 'number',
    min: 18,
    max: 120,
  },
  website: {
    required: false,
    type: 'string',
    url: true,
  },
});

if (!result.valid) {
  console.log('Validation errors:', result.errors);
  // [
  //   { field: 'name', message: '...' },
  //   { field: 'email', message: '...' },
  // ]
}
```

### Validation d'Objet Complet

```typescript
import { validateObject } from '@/lib/utils/validation';

const userData = {
  name: 'John Doe',
  email: 'john@example.com',
};

const result = validateObject(userData, {
  name: [
    (value) => validateRequired(value, 'name'),
    (value) => validateLength(value as string, 2, 100),
  ],
  email: [
    (value) => validateRequired(value, 'email'),
    (value) => {
      if (typeof value === 'string' && !validateEmail(value)) {
        return {
          valid: false,
          errors: [{ field: 'email', message: 'Format d\'email invalide' }],
        };
      }
      return { valid: true, errors: [] };
    },
  ],
});

if (!result.valid) {
  const errors = formatValidationErrors(result.errors);
  console.log(errors);
}
```

### Exemple d'Intégration dans un Formulaire

```typescript
import { validateSchema, formatValidationErrors } from '@/lib/utils/validation';
import { useMutation } from '@/lib/hooks/useApi';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const { mutate, loading } = useMutation(
    async (data) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result.data;
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const result = validateSchema(
      { ...formData, age: parseInt(formData.age) },
      {
        name: {
          required: true,
          type: 'string',
          minLength: 2,
          maxLength: 100,
        },
        email: {
          required: true,
          type: 'string',
          email: true,
        },
        age: {
          required: true,
          type: 'number',
          min: 18,
          max: 120,
        },
      }
    );

    if (!result.valid) {
      setErrors(result.errors.map((err) => err.message));
      return;
    }

    // Submit
    await mutate({ ...formData, age: parseInt(formData.age) });
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.map((error, i) => (
        <div key={i} className="error">{error}</div>
      ))}
      {/* Form fields */}
      <button disabled={loading}>Submit</button>
    </form>
  );
}
```

## 📚 Bonnes Pratiques

### 1. Toujours Utiliser les Hooks Professionnels

❌ **Mauvais**:
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);
```

✅ **Bon**:
```typescript
const { data, loading, error } = useQuery(
  async () => {
    const response = await fetch('/api/data');
    const result = await response.json();
    return result.data;
  },
  { immediate: true }
);
```

### 2. Valider les Données Avant l'Envoi

❌ **Mauvais**:
```typescript
const handleSubmit = async (data) => {
  await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
```

✅ **Bon**:
```typescript
const handleSubmit = async (data) => {
  const result = validateSchema(data, schema);
  if (!result.valid) {
    setErrors(result.errors);
    return;
  }
  await mutate(data);
};
```

### 3. Utiliser le Retry pour les Requêtes Critiques

```typescript
const { data } = useApi(
  async () => fetchData(),
  {
    retry: {
      attempts: 3,
      delay: 1000,
    },
  }
);
```

### 4. Gérer l'Annulation des Requêtes

Les hooks utilisent automatiquement `AbortController` pour annuler les requêtes lorsque le composant est démonté ou qu'une nouvelle requête est lancée.

## 🔗 Références

- [API Response Standards](./API_RESPONSE_STANDARDS.md)
- [Logger Professionnel](./PROFESSIONNALISATION_CODE.md)

---

**Date**: $(date)
**Version**: 1.0.0
**Qualité**: Expert Mondial SaaS

