# Mani Premium Gift Box Builder - Implementation Strategy

## Executive Summary
A completely new enterprise-grade module allowing customers to build custom premium dry fruit gift boxes with configurable rules, product selection, and luxury gifting experience.

---

## Phase 1: Database Design & Prisma Models

### New Models (in `prisma/schema.prisma`)

```prisma
model GiftBox {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  description     String?
  heroImage       String?
  thumbnail       String?
  gallery         String?  @db.LongText
  seoTitle        String?
  seoDescription  String?
  seoKeywords     String?  @db.LongText
  metaImage       String?
  ogTitle         String?
  ogDescription   String?
  ogImage         String?
  
  fixedPrice      Float    // Fixed price for the gift box
  originalPrice   Float?   // Optional: show original price with discount
  discount        Float?   // Discount amount
  offerPrice      Float?   // Final offer price
  gstRate         Float?   @default(18)
  packagingCharge Float?   @default(0)
  deliveryCharge  Float?   @default(0)
  
  isActive        Boolean  @default(false)
  isFeatured      Boolean  @default(false)
  isTodayOffer    Boolean  @default(false)
  sortOrder       Int      @default(0)
  
  startDate       DateTime?
  endDate         DateTime?
  maxOrdersPerCustomer Int? @default(0) // 0 = unlimited
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relationships
  eligibleProducts     GiftBoxEligibleProduct[]
  rules                  GiftBoxRule[]
  orders                 GiftBoxOrder[]
  savedConfigurations    GiftBoxSavedConfiguration[]
  
  @@map("gift_boxes")
}

model GiftBoxEligibleProduct {
  id          String  @id @default(cuid())
  giftBoxId   String
  productId   String
  sortOrder   Int     @default(0)
  
  giftBox     GiftBox @relation(fields: [giftBoxId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([giftBoxId, productId])
  @@map("gift_box_eligible_products")
}

model GiftBoxRule {
  id              String   @id @default(cuid())
  giftBoxId       String
  ruleType        String   // "minProducts", "maxProducts", "minWeight", "maxWeight", "weightPerSelection", etc.
  ruleValue       String   // JSON string or simple value
  description     String?
  
  giftBox         GiftBox  @relation(fields: [giftBoxId], references: [id], onDelete: Cascade)
  
  @@map("gift_box_rules")
}

model GiftBoxOrder {
  id              String   @id @default(cuid())
  giftBoxId       String
  userId          String?
  userName        String
  userPhone       String
  userEmail       String?
  
  // Selected products in this order
  items           Json     @db.LongText  // Store selected items with quantities
  
  totalWeight     Int      // Total grams
  totalPrice      Float
  discount        Float    @default(0)
  GST             Float    @default(0)
  packagingCharge Float    @default(0)
  deliveryCharge  Float    @default(0)
  finalTotal      Float
  
  status          String   @default("pending")
  paymentMethod   String   @default("cod")
  razorpayOrderId String?
  razorpayPaymentId String?
  
  address         String
  city            String
  state           String
  pincode         String
  
  notes           String?  @db.LongText
  giftWrap        Boolean  @default(false)
  ribbonColor     String?
  greetingCard    Boolean  @default(false)
  giftMessage     String?  @db.LongText
  theme           String?  // birthday, wedding, corporate, festival, etc.
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  giftBox         GiftBox  @relation(fields: [giftBoxId], references: [id], onDelete: Cascade)
  user            User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@map("gift_box_orders")
}

model GiftBoxSavedConfiguration {
  id          String   @id @default(cuid())
  giftBoxId   String
  userId      String?
  guestId     String?  // For non-logged-in users
  name        String?
  items       Json     @db.LongText  // Saved selections
  totalWeight Int
  totalPrice  Float
  isDefault   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  giftBox       GiftBox @relation(fields: [giftBoxId], references: [id], onDelete: Cascade)
  user          User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@map("gift_box_saved_configurations")
}

model GiftBoxAnalytics {
  id          String   @id @default(cuid())
  giftBoxId   String
  date        DateTime @default(now())
  
  totalOrders     Int    @default(0)
  totalRevenue    Float  @default(0)
  conversionRate  Float  @default(0)
  avgBasketValue  Float  @default(0)
  
  topProducts     Json   @db.LongText  // JSON array of top products
  lowStockAlerts  Json   @db.LongText  // JSON array of products needing restock
  
  giftBox         GiftBox @relation(fields: [giftBoxId], references: [id], onDelete: Cascade)
  
  @@map("gift_box_analytics")
}
```

---

## Phase 2: Backend APIs

### API Endpoints to Create:

1. **GET /api/gift-boxes** - List all active gift boxes
2. **GET /api/gift-boxes/[slug]** - Get single gift box with rules and eligible products
3. **POST /api/gift-boxes** - Create new gift box (admin)
4. **PUT /api/gift-boxes/[id]** - Update gift box (admin)
5. **DELETE /api/gift-boxes/[id]** - Delete/archive gift box (admin)
6. **GET /api/gift-boxes/[id]/preview** - Preview gift box with mock data
7. **POST /api/gift-box-orders** - Create gift box order
8. **GET /api/gift-box-saved** - Get saved configurations (requires auth)
9. **POST /api/gift-box-saved** - Save configuration
10. **GET /api/gift-box-availability** - Check how many boxes can be sold based on stock

### Key API Features:

1. **Stock Validation**: Check product availability before allowing selection
2. **Rule Validation**: Validate selections against configurable rules
3. **Availability Engine**: Calculate how many gift boxes can still be sold
4. **Inventory Deduction**: Same pattern as regular orders - deduct product stockGrams after order

---

## Phase 3: Admin UI

### Admin Pages Structure:

```
app/admin/gift-boxes/
├── page.tsx              # List all gift boxes
├── create/page.tsx       # Create new gift box
├── [id]/page.tsx         # Edit gift box
├── [id]/preview/page.tsx # Preview gift box
├── [id]/rules/page.tsx   # Manage rules
├── [id]/products/page.tsx # Manage eligible products
└── [id]/analytics/page.tsx # View analytics
```

### Admin Features:

1. **Gift Box Management**:
   - Create/Edit/Delete
   - Duplicate
   - Preview
   - Archive/Restore
   - Feature toggle
   - Schedule start/end dates
   - Sort order

2. **Product Selection**:
   - Checkbox list from all products
   - Search & filter products
   - Set sort order per product

3. **Rule Management**:
   - Minimum/Maximum products
   - Weight per selection
   - Duplicate product limits
   - Stock buffer
   - Date scheduling

4. **Analytics Dashboard**:
   - Sales performance
   - Top products
   - Low stock alerts
   - Conversion rates

---

## Phase 4: Customer UI

### Customer Pages:

```
app/gift-boxes/
├── page.tsx              # List all gift boxes
├── [slug]/page.tsx       # Build gift box
├── builder/              # Main builder page
└── [id]/checkout/page.tsx # Checkout for gift box
```

### Customer Experience Flow:

1. **Landing Page**: Hero image, description, featured gift boxes
2. **Builder Page**: 
   - Progress indicator (Products → Customize → Review → Checkout)
   - Product grid with search & filters
   - Live gift box visualization
   - Real-time weight/price calculation
3. **Customization**:
   - Gift wrap options
   - Ribbon color selection
   - Greeting card with message
   - Theme selection (Birthday, Wedding, Corporate, Festival)
4. **Review Page**:
   - Summary of selections
   - Stock validation
   - Price breakdown
5. **Checkout**:
   - Same as regular checkout but with gift box items
   - Additional gift options

### UI Components to Create:

1. **GiftBoxCard** - Display gift box in grid
2. **ProductSelector** - Grid for selecting products
3. **SelectionSummary** - Show selected products
4. **GiftBoxVisualization** - 3D-like gift box with products
5. **ProgressIndicator** - Multi-step progress bar
6. **CustomizationOptions** - Gift wrap, ribbon, message
7. **AvailabilityBadge** - Show how many boxes can still be sold

---

## Phase 5: Integration Points

### How Gift Box Integrates with Existing Systems:

1. **Inventory**:
   - Uses existing `Product.stockGrams`
   - Same deduction logic as regular orders
   - Same validation logic

2. **Pricing**:
   - Uses existing `Product.pricePerKg`
   - Calculates variant prices (125g, 250g, 500g, 1kg)
   - Fixed gift box price overrides product prices

3. **Orders**:
   - New `gift_box_orders` table
   - Same checkout flow with modifications
   - Same payment integration (Razorpay, COD)

4. **User**:
   - Uses existing User model
   - Saves configurations for logged-in users
   - Guest saves in localStorage

5. **Coupons**:
   - Same coupon system applies
   - Can create gift box-specific coupons

---

## Phase 6: Performance Optimizations

1. **Lazy Loading**: Load products as user scrolls
2. **Image Optimization**: Use next/image with lazy loading
3. **Code Splitting**: Separate gift box module
4. **Memoization**: Use React.memo for product cards
5. **Server Components**: Fetch gift box data on server
6. **Caching**: Cache eligible products and rules

---

## Phase 7: Testing Plan

1. **Unit Tests**:
   - Rule validation logic
   - Stock calculation
   - Price calculation
   - Availability engine

2. **Integration Tests**:
   - Gift box creation
   - Order flow
   - Inventory deduction
   - Checkout

3. **E2E Tests**:
   - Full customer journey
   - Admin management
   - Mobile responsiveness

4. **Load Testing**:
   - Concurrent gift box builders
   - Order creation under load

---

## Phase 8: Security Considerations

1. **Server-side Validation**:
   - Validate all rules on server
   - Validate stock availability
   - Validate product eligibility

2. **API Security**:
   - Admin routes protected
   - Rate limiting for order creation
   - Input sanitization

3. **Data Validation**:
   - Prevent negative quantities
   - Prevent weight manipulation
   - Prevent price manipulation

---

## File Structure Overview

```
New Files:
├── prisma/schema.prisma (add new models)
├── app/api/gift-boxes/route.ts
├── app/api/gift-boxes/[id]/route.ts
├── app/api/gift-box-orders/route.ts
├── app/api/gift-box-availability/route.ts
├── app/gift-boxes/page.tsx
├── app/gift-boxes/[slug]/page.tsx
├── app/gift-boxes/builder/page.tsx
├── app/gift-boxes/[id]/checkout/page.tsx
├── app/admin/gift-boxes/page.tsx
├── app/admin/gift-boxes/create/page.tsx
├── app/admin/gift-boxes/[id]/page.tsx
├── components/GiftBoxCard.tsx
├── components/GiftBoxBuilder.tsx
├── components/ProductSelector.tsx
├── components/SelectionSummary.tsx
├── components/GiftBoxVisualization.tsx
├── components/ProgressIndicator.tsx
├── components/CustomizationOptions.tsx
├── hooks/useGiftBox.ts
├── utils/giftBoxValidation.ts
└── lib/giftBox.ts

Modified Files:
├── prisma/schema.prisma (migration required)
├── app/api/orders/route.ts (add gift box support)
├── app/checkout/page.tsx (add gift box support)
└── next.config.ts (if needed for new routes)
```

---

## Timeline Estimate

- Phase 1 (Database): 2 days
- Phase 2 (APIs): 3 days
- Phase 3 (Admin UI): 4 days
- Phase 4 (Customer UI): 5 days
- Phase 5 (Integration): 2 days
- Phase 6 (Performance): 1 day
- Phase 7 (Testing): 2 days
- Phase 8 (Security): 1 day

**Total: ~20 days**