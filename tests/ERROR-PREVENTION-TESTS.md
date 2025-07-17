# Error Prevention Test Suite

This test suite is designed to catch common runtime errors, authentication issues, translation problems, and other issues that could break the application in production.

## Test Files

### 1. `runtime-errors.spec.ts`
**Purpose**: Catches undefined variables and missing dependencies

**What it tests**:
- Missing variables like `categories` in analytics page
- Undefined query dependencies
- Component state errors
- Async operation failures
- Memory leaks and performance issues

**Example issues caught**:
- `categories is not defined` error in analytics
- Missing data queries in components
- Cart state management errors

### 2. `translation-keys.spec.ts`
**Purpose**: Ensures all translation keys are properly translated

**What it tests**:
- Raw translation keys displayed to users (e.g., `restaurant.selectTable`)
- Missing translation keys
- Language switching functionality
- Form validation message translations
- Dynamic content translation
- Accessibility text translations

**Example issues caught**:
- `restaurant.selectTableOccupied` showing as raw key
- Missing Czech translations
- Untranslated error messages

### 3. `auth-validation.spec.ts`
**Purpose**: Validates authentication flows and security

**What it tests**:
- Protected route access
- Session management
- Login form validation
- User context handling
- Shop context handling
- Authorization levels
- Demo mode functionality

**Example issues caught**:
- Accessing protected routes without authentication
- Session expiration handling
- Missing user/shop context errors

### 4. `common-runtime-errors.spec.ts`
**Purpose**: Catches common JavaScript runtime errors

**What it tests**:
- Schema validation errors (like date/string type mismatches)
- Null/undefined reference errors
- Array access errors
- Type conversion errors
- Event handler errors
- API failure handling
- Browser compatibility issues

**Example issues caught**:
- `Expected date, received string` schema errors
- `Cannot read properties of undefined` errors
- Form submission failures

## Running the Tests

### Run all error prevention tests:
```bash
npm run test:error-prevention
```

### Run specific test suites:
```bash
npm run test:runtime-errors      # Missing variables, undefined errors
npm run test:translation-keys    # Translation key issues
npm run test:auth-validation     # Authentication problems
npm run test:common-errors       # General runtime errors
```

### Run with specific focus:
```bash
npm run test:errors              # All error prevention tests
node tests/run-error-prevention-tests.js --errors       # Focus on error detection
node tests/run-error-prevention-tests.js --translations # Focus on translations
node tests/run-error-prevention-tests.js --auth         # Focus on authentication
```

## Test Configuration

The tests use a specialized configuration (`error-prevention.config.ts`) that:
- Focuses on error detection
- Captures traces and screenshots on failures
- Tests across multiple browsers
- Provides detailed error reporting
- Has appropriate timeouts for error scenarios

## What These Tests Prevent

### 1. **Production Runtime Errors**
- Undefined variable access
- Missing API data handling
- Type coercion errors
- Null reference exceptions

### 2. **User Experience Issues**
- Raw translation keys showing to users
- Broken authentication flows
- Form validation failures
- Accessibility problems

### 3. **Security Issues**
- Unauthorized route access
- Session management problems
- Authentication bypass

### 4. **Performance Issues**
- Memory leaks from improper cleanup
- Slow loading due to missing error handling
- Resource exhaustion from infinite loops

## Best Practices

1. **Run before deployment**: Always run these tests before deploying to production
2. **Add new tests**: When fixing bugs, add tests to prevent regression
3. **Monitor regularly**: Include in CI/CD pipeline
4. **Update translations**: Run translation tests when adding new features
5. **Test edge cases**: Include boundary conditions and error scenarios

## Common Patterns Tested

### Missing Variables
```typescript
// BAD - This will cause runtime error
const salesByCategory = products?.reduce((acc, product) => {
  const categoryName = categories?.find(c => c.id === product.categoryId)?.name;
  // categories is undefined!
});

// GOOD - Include the query
const { data: categories } = useQuery({
  queryKey: [`/api/shops/${currentShop?.id}/categories`],
  enabled: !!currentShop
});
```

### Translation Keys
```typescript
// BAD - Raw key shown to user
<span>{t('restaurant.selectTable')}</span>

// GOOD - Add translation
"selectTable": "Vyberte stůl"
```

### Authentication
```typescript
// BAD - Direct access without auth check
const UserDashboard = () => {
  return <div>Welcome {user.name}</div>; // user might be undefined
};

// GOOD - Handle auth state
const UserDashboard = () => {
  if (!user) return <LoginForm />;
  return <div>Welcome {user.name}</div>;
};
```

## Continuous Integration

Add to your CI/CD pipeline:
```yaml
- name: Run Error Prevention Tests
  run: npm run test:error-prevention
```

This ensures that common errors are caught before they reach production and affect users.