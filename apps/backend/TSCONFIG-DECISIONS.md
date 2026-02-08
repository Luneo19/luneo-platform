# Backend tsconfig.json – documented decisions

This file documents the main compiler options in `tsconfig.json` and why some strict options are left disabled.

## `strictPropertyInitialization: false`

**Reason:** NestJS relies on dependency injection. Controllers and services declare injected dependencies as class properties without initializers, e.g.:

```ts
@Injectable()
export class SomeService {
  constructor(private readonly other: OtherService) {}  // no initializer
}
```

With `strictPropertyInitialization: true`, TypeScript would require every such property to be definitely assigned (e.g. in the constructor body or with `!`). That would force `!` assertions or redundant initializers across the whole backend. Keeping this **false** is the usual NestJS convention and avoids hundreds of noisy changes.

## Other strict / unused options

- **`noUnusedLocals` / `noUnusedParameters`: false**  
  Enabling these would flag many existing unused variables and parameters (e.g. in handlers, guards, or tests). Left disabled to avoid breaking the build; can be turned on gradually and cleaned up over time.

- **`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `strictFunctionTypes`: true**  
  These remain enabled for type safety.

- **`noImplicitReturns`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`: true**  
  Kept for consistency and safer control flow.
