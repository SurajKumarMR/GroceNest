# GroceNest Merchant API Integration Guide

Welcome to the **GroceNest Merchant API Specification & Integration Guide**. This document provides merchant partners, store managers, and software developers with the complete technical instructions to integrate custom Point of Sale (POS) systems, inventory management software, and order fulfillment workflows with GroceNest.

---

## 1. Overview & Base URLs

The GroceNest Merchant API allows you to programmatically manage your store profile, catalog inventory, track live customer orders, update fulfillment statuses, query revenue analytics, and request Stripe payouts.

### Base URLs

- **Development / Staging**: `http://localhost:8000/api`
- **Production**: `https://api.grocenest.co.uk/api`
- **Interactive OpenAPI / Swagger Documentation**: [https://api.grocenest.co.uk/api/docs](https://api.grocenest.co.uk/api/docs)
- **Raw OpenAPI JSON Spec**: [https://api.grocenest.co.uk/api/docs.json](https://api.grocenest.co.uk/api/docs.json)

---

## 2. Authentication & Authorization

All merchant endpoints require **JSON Web Token (JWT)** authentication.

### Obtaining a Merchant Token

Authenticate via the login endpoint with your registered merchant credentials:

`POST /api/auth/login`

#### Request Body
```json
{
  "email": "merchant@store.com",
  "password": "YourSecurePassword123!"
}
```

#### Successful Response (`200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_m12345",
    "email": "merchant@store.com",
    "firstName": "Alex",
    "lastName": "Merchant",
    "role": "MERCHANT"
  }
}
```

### Passing the Token in Requests

Include the token in the `Authorization` HTTP header for all protected merchant API calls:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Merchant Endpoint Reference

### 3.1 Store Management

#### Get Store Profile
`GET /api/owner/my-store`

**Headers**: `Authorization: Bearer <token>`

##### Response (`200 OK`)
```json
{
  "id": "str_8877",
  "name": "Organic Greens Grocers",
  "slug": "organic-greens-grocers",
  "streetAddress": "45 High Street",
  "city": "London",
  "postalCode": "EC1A 1BB",
  "country": "UK",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "cuisineTypes": ["organic", "fresh_produce"],
  "stripeAccountId": "acct_1Nxxxxxxxxxxxx",
  "stripeOnboardingStatus": "completed"
}
```

#### Update Store Profile
`PUT /api/owner/my-store`

**Headers**: `Authorization: Bearer <token>`

##### Request Body
```json
{
  "name": "Organic Greens Grocers & Bakery",
  "streetAddress": "47 High Street",
  "city": "London",
  "postalCode": "EC1A 1BB"
}
```

---

### 3.2 Product Catalog Management

#### Create Product
`POST /api/owner/products`

**Headers**: `Authorization: Bearer <token>`

##### Request Body
```json
{
  "name": "Organic British Strawberries 400g",
  "description": "Sweet, locally-grown British strawberries",
  "price": 3.99,
  "category": "Fresh Fruit",
  "stockQuantity": 100
}
```

##### Response (`201 Created`)
```json
{
  "id": "prd_991122",
  "storeId": "str_8877",
  "name": "Organic British Strawberries 400g",
  "price": 3.99,
  "category": "Fresh Fruit",
  "stockQuantity": 100,
  "imageUrl": null,
  "createdAt": "2026-07-24T18:00:00.000Z"
}
```

#### Update Product
`PUT /api/owner/products/:productId`

##### Request Body
```json
{
  "price": 3.49,
  "stockQuantity": 85
}
```

#### Delete Product
`DELETE /api/owner/products/:productId`

##### Response (`200 OK`)
```json
{
  "message": "Product deleted successfully"
}
```

#### Upload Product Image
`POST /api/owner/products/:productId/image`

**Content-Type**: `multipart/form-data`  
**Field Name**: `product` (image file)

---

### 3.3 Order Fulfillment Workflow

#### List Store Orders
`GET /api/owner/orders`

##### Response (`200 OK`)
```json
[
  {
    "id": "ord_5544",
    "orderNumber": "ORD-20260724-5001",
    "subtotal": 15.50,
    "deliveryFee": 2.99,
    "totalAmount": 18.49,
    "status": "CONFIRMED",
    "paymentStatus": "paid",
    "placedAt": "2026-07-24T18:15:00.000Z",
    "orderItems": [
      {
        "id": "item_1",
        "productId": "prd_991122",
        "quantity": 2,
        "price": 3.99
      }
    ]
  }
]
```

#### Update Order Status
`PUT /api/owner/orders/:orderId/status`

##### Request Body
```json
{
  "status": "PREPARING"
}
```
*Supported statuses*: `CONFIRMED`, `PREPARING`, `READY`, `CANCELLED`.

---

### 3.4 Revenue Analytics & Payouts

#### Query Merchant Revenue & Commission
`GET /api/owner/analytics/revenue?days=30`

##### Response (`200 OK`)
```json
{
  "storeId": "str_8877",
  "timeframeDays": 30,
  "totalGrossSales": 1250.50,
  "platformFee": 125.05,
  "totalNetPayout": 1125.45,
  "totalOrderCount": 65,
  "averageOrderValue": 19.24,
  "dailySales": [
    {
      "date": "2026-07-24",
      "grossSales": 150.00,
      "orderCount": 8
    }
  ]
}
```

#### Initiate Merchant Payout
`POST /api/owner/payouts`

##### Response (`200 OK`)
```json
{
  "message": "Merchant payout triggered successfully",
  "payout": {
    "netAmount": 1125.45,
    "transferredAt": "2026-07-24T18:25:00.000Z"
  }
}
```

---

## 4. Multi-Language Code Examples

### 4.1 cURL

```bash
# 1. Login to get JWT Token
curl -X POST https://api.grocenest.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"merchant@store.com","password":"YourPassword123!"}'

# 2. Add New Product to Store Catalog
curl -X POST https://api.grocenest.co.uk/api/owner/products \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Free Range Eggs 6pk",
    "price": 2.10,
    "category": "Dairy & Eggs",
    "stockQuantity": 40
  }'
```

### 4.2 JavaScript / Node.js (Axios)

```javascript
const axios = require('axios');

const API_BASE = 'https://api.grocenest.co.uk/api';

async function updateStoreOrderStatus(token, orderId, status) {
  try {
    const response = await axios.put(
      `${API_BASE}/owner/orders/${orderId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Order status updated:', response.data);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}
```

### 4.3 Python (Requests)

```python
import requests

API_BASE = "https://api.grocenest.co.uk/api"

def get_merchant_revenue(token, timeframe_days=30):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{API_BASE}/owner/analytics/revenue?days={timeframe_days}", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Gross Sales: £{data['totalGrossSales']}")
        print(f"Net Payout: £{data['totalNetPayout']}")
        return data
    else:
        print(f"Error {response.status_code}: {response.json()}")
        return None
```

---

## 5. Error Handling & Rate Limiting

### HTTP Status Codes

| Code | Status | Meaning & Troubleshooting |
| :--- | :--- | :--- |
| `200` | **OK** | Request succeeded. |
| `201` | **Created** | Resource (e.g. Product) created successfully. |
| `400` | **Bad Request** | Invalid payload schema or missing required fields. |
| `401` | **Unauthorized** | Missing or expired `Bearer` JWT token. |
| `403` | **Forbidden** | User account does not possess `MERCHANT` role or own the target store. |
| `404` | **Not Found** | Order, product, or store ID does not exist. |
| `429` | **Too Many Requests** | Rate limit exceeded. Back off and retry after `Retry-After` seconds. |
| `500` | **Internal Server Error** | Unexpected server failure. Contact GroceNest support. |

### Standard Error Response Format
```json
{
  "error": "Detailed description of error condition"
}
```

### Rate Limiting Headers
- `X-RateLimit-Limit`: Total requests allowed per 15-minute window (default: 100 in production).
- `X-RateLimit-Remaining`: Requests remaining in current window.
- `X-RateLimit-Reset`: Unix timestamp when quota resets.

---

## 6. Webhooks & Real-Time Events

GroceNest emits real-time events for order updates, payments, and payouts.

### 6.1 Stripe Connect Webhooks
GroceNest handles Stripe Connect destination charges automatically. Ensure your store is onboarded via `POST /api/payments/connect/onboard`. Stripe Connect webhook signatures are validated via the `Stripe-Signature` header.

### 6.2 Socket.io Real-Time Events
Merchants can connect to GroceNest Socket.io server to receive instantaneous order notifications:

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.grocenest.co.uk', {
  auth: { token: '<YOUR_JWT_TOKEN>' }
});

socket.on('connect', () => {
  console.log('Connected to GroceNest real-time gateway');
  socket.emit('join-store', { storeId: 'str_8877' });
});

socket.on('NEW_ORDER', (order) => {
  console.log('🔔 New order received:', order.orderNumber, order.totalAmount);
});

socket.on('ORDER_STATUS_CHANGED', (data) => {
  console.log('Order status updated:', data.orderId, data.status);
});
```

---

## 7. Support & Assistance

For developer support, API key management, or POS integration partnerships, contact:
- **Developer Support Email**: `dev@grocenest.co.uk`
- **Merchant Help Center**: [https://merchant.grocenest.co.uk/help](https://merchant.grocenest.co.uk/help)
