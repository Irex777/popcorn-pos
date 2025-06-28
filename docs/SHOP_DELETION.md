# Shop Deletion Functionality

This document describes the shop deletion functionality implemented in the Popcorn POS system.

## Overview

The system supports secure shop deletion with confirmation requirements:

1. **Empty Shop Deletion** - Immediate deletion for shops with no data
2. **Confirmation-Based Deletion** - Requires typing shop name to confirm cascade deletion

## API Endpoint

```
DELETE /api/shops/:id
```

### Request Body

```json
{
  "confirmationName": "Shop Name" // Required only for shops with data
}
```

### Parameters

- `id` (required) - The shop ID to delete
- `confirmationName` (conditional) - Exact shop name required for shops with data

### Authentication

- Requires admin privileges
- Returns 403 if user is not an administrator

## Empty Shop Deletion

When shop has no categories, products, or orders:

### Behavior
- Immediately deletes the shop without confirmation
- Only deletes user-shop assignments, Stripe settings, and shop record

### Response Example

**Success:**
```json
{
  "success": true,
  "message": "Empty shop deleted successfully",
  "shop": { ... },
  "cascadeDelete": false
}
```

## Confirmation-Based Deletion

When shop contains data (categories, products, or orders):

### First Request (without confirmation)
Returns confirmation requirement with data summary:

```json
{
  "error": "Shop contains data that will be permanently deleted",
  "requiresConfirmation": true,
  "shopName": "My Restaurant",
  "dataToBeDeleted": {
    "categories": 5,
    "products": 23,
    "orders": 156
  },
  "message": "This shop contains 5 categories, 23 products, and 156 orders. All data will be permanently deleted. Type the shop name \"My Restaurant\" to confirm deletion."
}
```

### Second Request (with confirmation)
User must provide exact shop name:

**Request:**
```json
{
  "confirmationName": "My Restaurant"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Shop and all related data have been permanently deleted",
  "shop": { ... },
  "cascadeDelete": true
}
```

**Failure (wrong name):**
```json
{
  "error": "Shop name confirmation does not match",
  "message": "Please type the exact shop name \"My Restaurant\" to confirm deletion."
}
```

## Usage Examples

### Empty Shop Delete
```bash
curl -X DELETE "http://localhost:3002/api/shops/123" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b "session_cookie"
```

### Shop with Data (Two-Step Process)

**Step 1: Check what data exists**
```bash
curl -X DELETE "http://localhost:3002/api/shops/123" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b "session_cookie"
```

**Step 2: Confirm with shop name**
```bash
curl -X DELETE "http://localhost:3002/api/shops/123" \
  -H "Content-Type: application/json" \
  -d '{"confirmationName": "My Restaurant"}' \
  -b "session_cookie"
```

### JavaScript/Frontend
```javascript
// First attempt (check if confirmation needed)
const response = await fetch(`/api/shops/${shopId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({})
});

if (response.status === 400) {
  const error = await response.json();
  if (error.requiresConfirmation) {
    // Show confirmation dialog to user
    const shopName = error.shopName;
    const userInput = prompt(`Type "${shopName}" to confirm deletion:`);
    
    if (userInput === shopName) {
      // Confirm deletion
      const confirmResponse = await fetch(`/api/shops/${shopId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmationName: userInput })
      });
    }
  }
}
```

## Data Cleanup Order

When using force delete, data is cleaned up in this specific order to avoid foreign key constraint violations:

1. **Order Items** - Deleted first as they reference orders and products
2. **Orders** - Deleted after order items are removed
3. **Products** - Deleted after no order items reference them
4. **Categories** - Deleted after no products reference them
5. **User-Shop Assignments** - Deleted to remove user access
6. **Stripe Settings** - Deleted to clean up payment configuration
7. **Shop** - Finally deleted after all references are removed

## Error Handling

### Common Error Responses

- `404` - Shop not found
- `403` - Not authorized (admin required)
- `400` - Safe delete failed due to existing data
- `500` - Server error during deletion

### Error Messages

The system provides descriptive error messages:
- Indicates what type of data prevents deletion
- Suggests using `force=true` for cascade deletion
- Shows count of related items (e.g., "shop has 5 categories")

## Testing

### Automated Tests

Run the shop deletion tests:
```bash
npm run test:shop-deletion
```

### System Test

The system test endpoint (`POST /api/system-test`) includes comprehensive shop deletion testing:
- Creates test data (shop, category, product, order)
- Tests safe delete (should fail)
- Tests force delete (should succeed)
- Verifies all data was properly cleaned up

### Manual Testing

1. Create a shop with categories, products, and orders
2. Try safe delete - should fail with descriptive error
3. Try force delete - should succeed and clean up all data
4. Verify shop and all related data is gone

## Security Considerations

- Only administrators can delete shops
- Confirmation-based deletion prevents accidental data loss
- Exact shop name must be typed to confirm deletion
- User-shop assignments are cleaned up to prevent orphaned references
- No soft delete - data is permanently removed from database
- Two-step process provides clear warning about data loss

## Best Practices

1. **Review data summary** before confirming deletion
2. **Type shop name carefully** - confirmation is case-sensitive
3. **Backup important data** before deletion if needed for records
4. **Consider exporting data** before deletion for historical records
5. **Understand that deletion is irreversible** - all data is permanently lost
6. **Use empty shop deletion** when possible to avoid confirmation step

## Related Documentation

- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Testing Guide](./TESTING.md)