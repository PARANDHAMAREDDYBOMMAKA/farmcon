const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farmcon.in'

export function StructuredData() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FarmCon',
    url: APP_URL,
    logo: `${APP_URL}/farmcon.jpg`,
    description:
      'Smart agricultural commerce platform for Indian farmers — live mandi prices, AI crop advisory, equipment rentals, direct-to-buyer sales.',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-1800-XXX-XXXX',
        contactType: 'customer support',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    sameAs: [
      'https://twitter.com/farmcon',
      'https://www.facebook.com/farmcon',
      'https://www.instagram.com/farmcon',
    ],
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FarmCon',
    url: APP_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${APP_URL}/dashboard/browse?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FarmCon',
    operatingSystem: 'Web, Android, iOS',
    applicationCategory: 'BusinessApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      ratingCount: '10243',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }}
      />
    </>
  )
}
