-- Drop existing extension tables from previous failed migration
DROP TABLE IF EXISTS `product_product_variants`;
DROP TABLE IF EXISTS `product_extensions`;
DROP TABLE IF EXISTS `pricing_rules`;
DROP TABLE IF EXISTS `pricing_templates`;
DROP TABLE IF EXISTS `master_variants`;
DROP TABLE IF EXISTS `master_units`;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_usages` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `coupon_usages_couponId_userId_orderId_key`(`couponId`, `userId`, `orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `discountType` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `minOrder` DOUBLE NULL,
    `expiry` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `maxDiscount` DOUBLE NULL,
    `perUserLimit` INTEGER NULL,
    `usageLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `coupons_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `loyalty_transactions_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `variant` LONGTEXT NULL,

    INDEX `order_items_orderId_fkey`(`orderId`),
    INDEX `order_items_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `total` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `paymentMethod` VARCHAR(191) NOT NULL,
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `pincode` VARCHAR(191) NOT NULL,
    `couponCode` VARCHAR(191) NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `email` VARCHAR(191) NULL,

    INDEX `orders_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `images` LONGTEXT NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isTodayOffer` BOOLEAN NOT NULL DEFAULT false,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `faqs` LONGTEXT NULL,
    `ingredients` VARCHAR(191) NULL,
    `productOverview` VARCHAR(191) NULL,
    `seoKeywords` VARCHAR(191) NULL,
    `shippingInfo` VARCHAR(191) NULL,
    `storageInstructions` VARCHAR(191) NULL,
    `whyChoose` VARCHAR(191) NULL,
    `benefits` VARCHAR(191) NULL,
    `nutritionalInfo` VARCHAR(191) NULL,
    `origin` VARCHAR(191) NULL,
    `shelfLife` VARCHAR(191) NULL,
    `shortDescription` VARCHAR(191) NULL,
    `pricePerKg` DOUBLE NULL,
    `stockGrams` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `id` VARCHAR(191) NOT NULL,
    `referrerId` VARCHAR(191) NOT NULL,
    `referredPhone` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `pointsAwarded` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `referrals_referredPhone_fkey`(`referredPhone`),
    UNIQUE INDEX `referrals_referrerId_referredPhone_key`(`referrerId`, `referredPhone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `comment` VARCHAR(191) NOT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reviews_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_visits` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `count` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `loyaltyPoints` INTEGER NOT NULL DEFAULT 0,
    `referralCode` VARCHAR(191) NULL,
    `referredBy` VARCHAR(191) NULL,
    `firstPurchase` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginDate` DATETIME(3) NULL,
    `securityAnswer` VARCHAR(191) NULL,
    `securityQuestion` VARCHAR(191) NULL,
    `addressBook` LONGTEXT NULL,

    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_referralCode_key`(`referralCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlists` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wishlists_productId_fkey`(`productId`),
    UNIQUE INDEX `wishlists_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gift_boxes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `heroImage` VARCHAR(191) NULL,
    `thumbnail` VARCHAR(191) NULL,
    `gallery` LONGTEXT NULL,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` VARCHAR(191) NULL,
    `seoKeywords` LONGTEXT NULL,
    `metaImage` VARCHAR(191) NULL,
    `ogTitle` VARCHAR(191) NULL,
    `ogDescription` VARCHAR(191) NULL,
    `ogImage` VARCHAR(191) NULL,
    `fixedPrice` DOUBLE NOT NULL,
    `originalPrice` DOUBLE NULL,
    `discount` DOUBLE NULL DEFAULT 0,
    `offerPrice` DOUBLE NULL,
    `gstRate` DOUBLE NULL DEFAULT 18,
    `packagingCharge` DOUBLE NULL DEFAULT 0,
    `deliveryCharge` DOUBLE NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isTodayOffer` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `maxOrdersPerCustomer` INTEGER NULL DEFAULT 0,
    `minQuantity` INTEGER NOT NULL DEFAULT 125,
    `maxQuantity` INTEGER NOT NULL DEFAULT 1000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gift_boxes_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gift_box_eligible_products` (
    `id` VARCHAR(191) NOT NULL,
    `giftBoxId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `price` DOUBLE NOT NULL,
    `pricePerUnit` VARCHAR(191) NULL,

    UNIQUE INDEX `gift_box_eligible_products_giftBoxId_productId_key`(`giftBoxId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gift_box_rules` (
    `id` VARCHAR(191) NOT NULL,
    `giftBoxId` VARCHAR(191) NOT NULL,
    `ruleType` VARCHAR(191) NOT NULL,
    `ruleValue` LONGTEXT NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gift_box_orders` (
    `id` VARCHAR(191) NOT NULL,
    `giftBoxId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userPhone` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NULL,
    `items` LONGTEXT NOT NULL,
    `totalWeight` INTEGER NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `GST` DOUBLE NOT NULL DEFAULT 0,
    `packagingCharge` DOUBLE NOT NULL DEFAULT 0,
    `deliveryCharge` DOUBLE NOT NULL DEFAULT 0,
    `finalTotal` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cod',
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `pincode` VARCHAR(191) NOT NULL,
    `notes` LONGTEXT NULL,
    `giftWrap` BOOLEAN NOT NULL DEFAULT false,
    `ribbonColor` VARCHAR(191) NULL,
    `greetingCard` BOOLEAN NOT NULL DEFAULT false,
    `giftMessage` LONGTEXT NULL,
    `theme` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gift_box_saved_configurations` (
    `id` VARCHAR(191) NOT NULL,
    `giftBoxId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `guestId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `items` LONGTEXT NOT NULL,
    `totalWeight` INTEGER NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gift_box_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `giftBoxId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `totalRevenue` DOUBLE NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `avgBasketValue` DOUBLE NOT NULL DEFAULT 0,
    `topProducts` LONGTEXT NOT NULL,
    `lowStockAlerts` LONGTEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_units` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `master_units_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_variants` (
    `id` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `master_variants_unitId_value_key`(`unitId`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pricing_templates_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_rules` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pricing_rules_templateId_variantId_key`(`templateId`, `variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_extensions` (
    `productId` VARCHAR(191) NOT NULL,
    `unitTypeId` VARCHAR(191) NULL,
    `basePrice` DOUBLE NULL,
    `pricingTemplateId` VARCHAR(191) NULL,
    `stockQuantity` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_extensions_unitTypeId_idx`(`unitTypeId`),
    INDEX `product_extensions_pricingTemplateId_idx`(`pricingTemplateId`),
    PRIMARY KEY (`productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_product_variants` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `product_product_variants_productId_variantId_key`(`productId`, `variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referredPhone_fkey` FOREIGN KEY (`referredPhone`) REFERENCES `users`(`phone`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_eligible_products` ADD CONSTRAINT `gift_box_eligible_products_giftBoxId_fkey` FOREIGN KEY (`giftBoxId`) REFERENCES `gift_boxes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_eligible_products` ADD CONSTRAINT `gift_box_eligible_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_rules` ADD CONSTRAINT `gift_box_rules_giftBoxId_fkey` FOREIGN KEY (`giftBoxId`) REFERENCES `gift_boxes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_orders` ADD CONSTRAINT `gift_box_orders_giftBoxId_fkey` FOREIGN KEY (`giftBoxId`) REFERENCES `gift_boxes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_orders` ADD CONSTRAINT `gift_box_orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_saved_configurations` ADD CONSTRAINT `gift_box_saved_configurations_giftBoxId_fkey` FOREIGN KEY (`giftBoxId`) REFERENCES `gift_boxes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_saved_configurations` ADD CONSTRAINT `gift_box_saved_configurations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_box_analytics` ADD CONSTRAINT `gift_box_analytics_giftBoxId_fkey` FOREIGN KEY (`giftBoxId`) REFERENCES `gift_boxes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `master_variants` ADD CONSTRAINT `master_variants_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `master_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pricing_rules` ADD CONSTRAINT `pricing_rules_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `pricing_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pricing_rules` ADD CONSTRAINT `pricing_rules_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `master_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_extensions` ADD CONSTRAINT `product_extensions_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_extensions` ADD CONSTRAINT `product_extensions_unitTypeId_fkey` FOREIGN KEY (`unitTypeId`) REFERENCES `master_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_extensions` ADD CONSTRAINT `product_extensions_pricingTemplateId_fkey` FOREIGN KEY (`pricingTemplateId`) REFERENCES `pricing_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_product_variants` ADD CONSTRAINT `product_product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_product_variants` ADD CONSTRAINT `product_product_variants_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `master_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

