export interface ProductSchemaInput {
  id: string
  name: string
  slug: string
  description: string
  images: string[]
  sku: string
  brand: string
  category: string
  price: number
  currency: string
  availability: 'InStock' | 'OutOfStock'
  url: string
  reviewCount?: number
  averageRating?: number
  seller: string
  mpn?: string
}

export function generateProductSchema(input: ProductSchemaInput) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: input.name,
    image: input.images,
    description: input.description,
    sku: input.sku,
    mpn: input.mpn,
    brand: {
      '@type': 'Brand',
      name: input.brand
    },
    category: input.category,
    offers: {
      '@type': 'Offer',
      url: input.url,
      priceCurrency: input.currency,
      price: input.price,
      availability: `https://schema.org/${input.availability}`,
      seller: {
        '@type': 'Organization',
        name: input.seller
      }
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: input.currency
      },
      deliveryTime: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '21:00'
      }
    },
    returnPolicy: {
      '@type': 'MerchantReturnPolicy',
      returnable: true,
      returnPeriod: 'P30D',
      returnPolicyCategory: 'https://schema.org/ReturnPolicyOnlineOnly',
      returnMethod: 'https://schema.org/ReturnMethod',
      applicableCountry: 'IN',
      returnShippingFeesAmount: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: input.currency
      }
    }
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function generateOrganizationSchema(options: {
  name: string
  url: string
  logo?: string
  phone?: string
  email?: string
  address?: string
  socialLinks?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name,
    url: options.url,
    ...(options.logo && { logo: options.logo }),
    ...(options.phone && { telephone: options.phone }),
    ...(options.email && { email: options.email }),
    ...(options.address && { address: { '@type': 'PostalAddress', streetAddress: options.address } }),
    ...(options.socialLinks && { sameAs: options.socialLinks })
  }
}

export function generateWebsiteSchema(options: {
  name: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options.name,
    url: options.url
  }
}

export function generateAggregateRatingSchema(productUrl: string, ratingValue: number, reviewCount: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: productUrl,
    ratingValue: ratingValue,
    reviewCount: reviewCount
  }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

export function generateLocalBusinessSchema(options: {
  name: string
  url: string
  images?: string[]
  phone?: string
  address?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: options.name,
    url: options.url,
    ...(options.images && { image: options.images }),
    ...(options.address && {
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
        streetAddress: options.address
      }
    }),
    contactPoint: options.phone ? {
      '@type': 'ContactPoint',
      telephone: options.phone,
      contactType: 'customer service'
    } : undefined
  }
}