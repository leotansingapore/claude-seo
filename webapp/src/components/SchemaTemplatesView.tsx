import { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';

// Embedded from schema/templates.json
const TEMPLATES = [
  { type: 'VideoObject', description: 'Video content pages with thumbnails, duration, and playback URLs.', template: { '@context': 'https://schema.org', '@type': 'VideoObject', name: '[Video Title]', description: '[Video Description]', thumbnailUrl: '[Thumbnail Image URL]', uploadDate: '[YYYY-MM-DD]', duration: '[ISO 8601 Duration]', contentUrl: '[Direct Video File URL]', embedUrl: '[Embed Player URL]' } },
  { type: 'BroadcastEvent', description: 'Live streaming content for LIVE badge in Google Search results.', template: { '@context': 'https://schema.org', '@type': 'VideoObject', name: '[Live Stream Title]', description: '[Description]', publication: { '@type': 'BroadcastEvent', isLiveBroadcast: true, startDate: '[YYYY-MM-DDTHH:MM:SSZ]', endDate: '[YYYY-MM-DDTHH:MM:SSZ]' } } },
  { type: 'SoftwareSourceCode', description: 'Open source and code repository pages.', template: { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: '[Repository Name]', description: '[Description]', codeRepository: '[Repository URL]', programmingLanguage: '[Language]', license: '[License URL]' } },
  { type: 'ProductGroup', description: 'E-commerce product variants grouped by attributes like size, color.', template: { '@context': 'https://schema.org', '@type': 'ProductGroup', name: '[Product Name]', description: '[Description]', variesBy: ['https://schema.org/size', 'https://schema.org/color'], hasVariant: [{ '@type': 'Product', name: '[Variant Name]', sku: '[SKU]', offers: { '@type': 'Offer', price: '[Price]', priceCurrency: 'USD', availability: 'https://schema.org/InStock' } }] } },
  { type: 'ProfilePage', description: 'Author or team member profile pages. Enhances E-E-A-T signals.', template: { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: '[Author Name]', url: '[Profile URL]', description: '[Bio]', sameAs: ['[Twitter URL]', '[LinkedIn URL]'] } } },
  { type: 'Certification', description: 'Product certifications (Energy Star, safety, organic, etc.).', template: { '@context': 'https://schema.org', '@type': 'Product', name: '[Product Name]', hasCertification: { '@type': 'Certification', certificationIdentification: '[Cert Name]', issuedBy: { '@type': 'Organization', name: '[Issuing Org]' } } } },
  { type: 'OfferShippingDetails', description: 'Shipping and delivery information for e-commerce products.', template: { '@context': 'https://schema.org', '@type': 'Product', name: '[Product Name]', offers: { '@type': 'Offer', price: '[Price]', priceCurrency: 'USD', shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'USD' }, deliveryTime: { '@type': 'ShippingDeliveryTime', transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' } } } } } },
];

export default function SchemaTemplatesView() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const copy = (i: number) => {
    const json = JSON.stringify(TEMPLATES[i].template, null, 2);
    const wrapped = `<script type="application/ld+json">\n${json}\n</script>`;
    navigator.clipboard.writeText(wrapped);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-3">
      {TEMPLATES.map((t, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold">{t.type}</h3>
          <p className="text-xs text-gray-400 mt-1">{t.description}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => toggle(i)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-700 rounded-md hover:border-indigo-500 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded.has(i) ? 'rotate-180' : ''}`} />
              {expanded.has(i) ? 'Hide' : 'View'}
            </button>
            <button
              onClick={() => copy(i)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-700 rounded-md hover:border-indigo-500 transition-colors"
            >
              {copied === i ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === i ? 'Copied!' : 'Copy JSON-LD'}
            </button>
          </div>
          {expanded.has(i) && (
            <pre className="mt-3 p-3 bg-gray-950 border border-gray-800 rounded text-xs overflow-x-auto max-h-72 overflow-y-auto">
              {JSON.stringify(t.template, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
