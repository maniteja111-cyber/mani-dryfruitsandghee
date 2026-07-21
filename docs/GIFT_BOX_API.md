# Gift Box Builder API Documentation

## Overview
The Gift Box Builder API provides endpoints for managing gift boxes, orders, and availability.

## Authentication
All admin endpoints require authentication. Customer endpoints are public.

## Endpoints

### Gift Boxes

#### GET /api/gift-boxes
List all active gift boxes.

**Query Parameters:**
- `featured` (boolean, optional): Filter featured gift boxes
- `active` (boolean, optional, default: true): Filter active gift boxes

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "slug": "string",
    "description": "string?",
    "heroImage": "string?",
    "thumbnail": "string?",
    "gallery": "string?",
    "fixedPrice": number,
    "originalPrice": "number?",
    "discount": "number",
    "offerPrice": "number?",
    "isActive": "boolean",
    "isFeatured": "boolean",
    "isTodayOffer": "boolean",
    "sortOrder": "number",
    "startDate": "DateTime?",
    "endDate": "DateTime?",
    "maxOrdersPerCustomer": "number",
    "eligibleProducts": [...],
    "_count": { "orders": "number" }
  }
]
```

#### GET /api/gift-boxes/[slug]
Get a single gift box by slug.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string?",
  "heroImage": "string?",
  "thumbnail": "string?",
  "gallery": "string?",
  "seoTitle": "string?",
  "seoDescription": "string?",
  "seoKeywords": "string?",
  "metaImage": "string?",
  "ogTitle": "string?",
  "ogDescription": "string?",
  "ogImage": "string?",
  "fixedPrice": "number",
  "originalPrice": "number?",
  "discount": "number",
  "offerPrice": "number?",
  "gstRate": "number",
  "packagingCharge": "number",
  "deliveryCharge": "number",
  "isActive": "boolean",
  "isFeatured": "boolean",
  "isTodayOffer": "boolean",
  "sortOrder": "number",
  "startDate": "DateTime?",
  "endDate": "DateTime?",
  "maxOrdersPerCustomer": "number",
  "eligibleProducts": [
    {
      "id": "string",
      "productId": "string",
      "sortOrder": "number",
      "product": {
        "id": "string",
        "name": "string",
        "slug": "string",
        "pricePerKg": "number?",
        "stockGrams": "number",
        "images": "string"
      }
    }
  ],
  "rules": [...]
}
```

#### POST /api/gift-boxes
Create a new gift box (Admin only).

**Body:**
```json
{
  "name": "string",
  "slug": "string",
  "description": "string?",
  "heroImage": "string?",
  "thumbnail": "string?",
  "gallery": "string?",
  "seoTitle": "string?",
  "seoDescription": "string?",
  "seoKeywords": "string?",
  "metaImage": "string?",
  "ogTitle": "string?",
  "ogDescription": "string?",
  "ogImage": "string?",
  "fixedPrice": "number",
  "originalPrice": "number?",
  "discount": "number?",
  "offerPrice": "number?",
  "gstRate": "number?",
  "packagingCharge": "number?",
  "deliveryCharge": "number?",
  "isActive": "boolean?",
  "isFeatured": "boolean?",
  "isTodayOffer": "boolean?",
  "sortOrder": "number?",
  "startDate": "string?",
  "endDate": "string?",
  "maxOrdersPerCustomer": "number?",
  "eligibleProductIds": ["string"],
  "rules": [
    {
      "type": "string",
      "value": "any",
      "description": "string?"
    }
  ]
}
```

#### PUT /api/gift-boxes/[slug]
Update a gift box (Admin only).

#### DELETE /api/gift-boxes/[slug]
Delete a gift box (Admin only).

### Gift Box Orders

#### GET /api/gift-box-orders
Get gift box orders.

**Query Parameters:**
- `userId` (string, optional): Filter by user
- `status` (string, optional): Filter by status

**Response:**
```json
[
  {
    "id": "string",
    "giftBoxId": "string",
    "userId": "string?",
    "userName": "string",
    "userPhone": "string",
    "userEmail": "string?",
    "items": "string", // JSON stringified
    "totalWeight": "number",
    "totalPrice": "number",
    "discount": "number",
    "GST": "number",
    "packagingCharge": "number",
    "deliveryCharge": "number",
    "finalTotal": "number",
    "status": "string",
    "paymentMethod": "string",
    "razorpayOrderId": "string?",
    "razorpayPaymentId": "string?",
    "address": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "notes": "string?",
    "giftWrap": "boolean",
    "ribbonColor": "string?",
    "greetingCard": "boolean",
    "giftMessage": "string?",
    "theme": "string?",
    "createdAt": "DateTime",
    "updatedAt": "DateTime"
  }
]
```

#### POST /api/gift-box-orders
Create a new gift box order.

**Body:**
```json
{
  "giftBoxId": "string",
  "userId": "string?",
  "userName": "string",
  "userPhone": "string",
  "userEmail": "string?",
  "items": [
    {
      "productId": "string",
      "quantity": "number",
      "selectedVariant": {
        "size": "string",
        "grams": "number"
      },
      "name": "string",
      "price": "number",
      "images": ["string"],
      "stock": "number"
    }
  ],
  "address": "string",
  "city": "string",
  "state": "string",
  "pincode": "string",
  "notes": "string?",
  "giftWrap": "boolean?",
  "ribbonColor": "string?",
  "greetingCard": "boolean?",
  "giftMessage": "string?",
  "theme": "string?",
  "paymentMethod": "string?"
}
```

### Availability

#### GET /api/gift-box-availability
Check how many gift boxes can be sold based on product stock.

**Query Parameters:**
- `giftBoxId` (string, required): The gift box ID

**Response:**
```json
{
  "available": "number",
  "giftBox": {
    "id": "string",
    "name": "string",
    "fixedPrice": "number"
  },
  "canOrder": "boolean"
}
```

## Rule Types

The following rule types can be configured:

| Type | Description | Value Format |
|------|-------------|--------------|
| `minProducts` | Minimum products required | number |
| `maxProducts` | Maximum products allowed | number |
| `minTotalWeight` | Minimum total weight in grams | number |
| `maxTotalWeight` | Maximum total weight in grams | number |
| `weightPerSelection` | Weight per product selection | number |
| `allowDuplicates` | Allow duplicate products | boolean |
| `maxDuplicateCount` | Max times same product can be selected | number |
| `hideOutOfStock` | Hide out of stock products | boolean |
| `startDate` | Availability start date | ISO date string |
| `endDate` | Availability end date | ISO date string |

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created (for POST)
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error