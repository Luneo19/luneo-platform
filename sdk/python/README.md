# luneo-api-sdk

Official Python SDK for Luneo Public API.

## Installation

```bash
pip install luneo-api-sdk
```

Or from source:

```bash
git clone https://github.com/luneo-platform/luneo-sdk-python
cd luneo-sdk-python
pip install -e .
```

## Quick Start

```python
from luneo import LuneoClient

# Initialize the client
client = LuneoClient(api_key="your_api_key_here")

# Check API health
health = client.health()
print(f"API Status: {health['status']}")

# List products
products = client.products.list(limit=10)
print(f"Found {products['total']} products")

# Get a specific product
product = client.products.get("prod_123")
print(f"Product: {product['name']}")

# Create a design
design = client.designs.create(
    product_id="prod_123",
    prompt="Collier minimaliste or 18k, pendentif coeur",
    options={
        "material": "gold",
        "size": "M",
    }
)
print(f"Design created: {design['id']}")

# Wait for design completion
completed_design = client.designs.wait_for_completion(design['id'])
print(f"Design completed: {completed_design['previewUrl']}")

# Create an order
order = client.orders.create(
    items=[
        {
            "productId": "prod_123",
            "designId": completed_design['id'],
            "quantity": 1,
            "unitPrice": 4900,
        }
    ],
    shipping={
        "address": "123 Rue de la Paix, 75001 Paris, France",
        "method": "express",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+33123456789",
    },
    currency="EUR",
)
print(f"Order created: {order['id']}")
print(f"Payment URL: {order['paymentUrl']}")

# Get analytics
analytics = client.analytics.overview()
print(f"Total Revenue: {analytics['totalRevenue']}")
```

## API Reference

### Client Initialization

```python
client = LuneoClient(
    api_key="your_api_key",
    base_url="https://api.luneo.com/api/v1",  # Optional
    timeout=30,  # Optional, seconds
)
```

### Products

#### `client.products.list(limit=None, offset=None, category=None, search=None)`

List all products.

**Parameters:**
- `limit` (int, optional): Number of results (default: 20, max: 100)
- `offset` (int, optional): Pagination offset (default: 0)
- `category` (str, optional): Filter by category
- `search` (str, optional): Search query

**Returns:** `dict` - Paginated response with products

#### `client.products.get(product_id)`

Get a specific product by ID.

**Parameters:**
- `product_id` (str): Product ID

**Returns:** `dict` - Product data

### Designs

#### `client.designs.create(product_id, prompt, options=None)`

Create a new design with AI.

**Parameters:**
- `product_id` (str): Product ID
- `prompt` (str): Design prompt description
- `options` (dict, optional): Design options

**Returns:** `dict` - Created design data

#### `client.designs.get(design_id)`

Get a specific design by ID.

**Parameters:**
- `design_id` (str): Design ID

**Returns:** `dict` - Design data

#### `client.designs.wait_for_completion(design_id, interval=2, timeout=300)`

Wait for design completion with polling.

**Parameters:**
- `design_id` (str): Design ID
- `interval` (int): Polling interval in seconds (default: 2)
- `timeout` (int): Maximum wait time in seconds (default: 300)

**Returns:** `dict` - Completed design data

### Orders

#### `client.orders.create(items, shipping, currency)`

Create a new order.

**Parameters:**
- `items` (list): List of order items
- `shipping` (dict): Shipping information
- `currency` (str): Currency code

**Returns:** `dict` - Created order data

#### `client.orders.get(order_id)`

Get a specific order by ID.

**Parameters:**
- `order_id` (str): Order ID

**Returns:** `dict` - Order data

#### `client.orders.cancel(order_id)`

Cancel an order.

**Parameters:**
- `order_id` (str): Order ID

**Returns:** `dict` - Cancelled order data

### Analytics

#### `client.analytics.overview(start=None, end=None)`

Get analytics overview.

**Parameters:**
- `start` (str, optional): Start date (ISO 8601 format)
- `end` (str, optional): End date (ISO 8601 format)

**Returns:** `dict` - Analytics overview data

## Error Handling

```python
from luneo import LuneoClient, LuneoAPIError

try:
    product = client.products.get("invalid_id")
except LuneoAPIError as e:
    print(f"API Error: {e.code} - {e.message}")
    print(f"Details: {e.details}")
    print(f"Status Code: {e.status_code}")
except Exception as e:
    print(f"Unknown error: {e}")
```

## Rate Limiting

The SDK automatically handles rate limiting. Rate limit information is available in response headers (implementation needed for full support).

## Requirements

- Python 3.8+
- requests >= 2.31.0

## License

MIT

## Support

- **Documentation**: https://docs.luneo.com
- **API Reference**: https://docs.luneo.com/api
- **Support Email**: api-support@luneo.com
