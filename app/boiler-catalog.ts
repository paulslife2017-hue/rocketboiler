// Existing website quotation models. Prices are quotations, not inventory costs.
export const boilerCatalog = [
  { sku: 'NAV-NGB554-15K', brand: '경동나비엔', model: 'NGB 554-15K', type: '일반형', check: true },
  { sku: 'NAV-NGB554-20K', brand: '경동나비엔', model: 'NGB 554-20K', type: '일반형', check: false },
  { sku: 'NAV-NGB554-25K', brand: '경동나비엔', model: 'NGB 554-25K', type: '일반형', check: false },
  { sku: 'NAV-NCB354-13K', brand: '경동나비엔', model: 'NCB 354-13K', type: '콘덴싱', check: true },
  ...['15K', '18K', '22K', '27K', '33K'].map(capacity => ({ sku: `NAV-NCB354-${capacity}`, brand: '경동나비엔', model: `NCB 354-${capacity}`, type: '콘덴싱', check: false })),
];
