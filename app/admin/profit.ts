import { boilerCatalog } from '../boiler-catalog';
export type ProfitRecord = { id: string; date: string; model: string; reference: string; quantity: number; sale: number; cost: number | null; labor: number; other: number; status: 'estimate' | 'actual' | 'void' };
export const referencePrices: Record<string,number> = { 'NAV-NGB554-15K':700000,'NAV-NGB554-20K':750000,'NAV-NGB554-25K':800000,'NAV-NCB354-13K':750000,'NAV-NCB354-15K':800000,'NAV-NCB354-18K':850000,'NAV-NCB354-22K':900000,'NAV-NCB354-27K':950000,'NAV-NCB354-33K':1000000 };
export function profitOf(row: Pick<ProfitRecord,'sale'|'cost'|'quantity'|'labor'|'other'>) {
  const revenue = row.sale * row.quantity;
  const profit = row.cost === null ? null : revenue - row.cost * row.quantity - row.labor - row.other;
  return { revenue, profit, margin: profit === null || revenue === 0 ? null : profit / revenue * 100 };
}

// Transcribed from the user's 2026-08-20 quotation photos; these are not purchase costs.
export const profitCatalog = [...boilerCatalog,
  {sku:'NAV-NGB554-13K',brand:'경동나비엔',model:'NGB 554-13K'},
  ...['13H','16H','20H','25H','30H'].map(capacity=>({sku:`KIT-L11-${capacity}`,brand:'귀뚜라미',model:`트윈 L11-${capacity}`})),
  ...['15H','18H','22H','27H','33H','36H'].map(capacity=>({sku:`KIT-L20-${capacity}`,brand:'귀뚜라미',model:`ECO L20-${capacity}`})),
  ...['13KF','16KF','20KF','25KF','30KF'].map(capacity=>({sku:`RIN-R331-${capacity}`,brand:'린나이',model:`R331-${capacity}`})),
  ...['15KF','18KF','22KF','27KF','30KF'].map(capacity=>({sku:`RIN-RC600-${capacity}`,brand:'린나이',model:`RC600-${capacity}`}))
];
Object.assign(referencePrices, {'NAV-NGB554-13K':650000,'KIT-L11-13H':600000,'KIT-L11-16H':650000,'KIT-L11-20H':700000,'KIT-L11-25H':750000,'KIT-L11-30H':800000,'KIT-L20-15H':700000,'KIT-L20-18H':750000,'KIT-L20-22H':800000,'KIT-L20-27H':850000,'KIT-L20-33H':900000,'KIT-L20-36H':950000});

// Later quotation photographed 2026-08-21 supersedes the earlier condensing quotations.
Object.assign(referencePrices, {'NAV-NCB354-13K':800000,'NAV-NCB354-15K':850000,'NAV-NCB354-18K':900000,'NAV-NCB354-22K':950000,'NAV-NCB354-27K':1000000,'NAV-NCB354-33K':1050000,'KIT-L20-15H':750000,'KIT-L20-18H':800000,'KIT-L20-22H':850000,'KIT-L20-27H':900000,'KIT-L20-33H':950000,'KIT-L20-36H':1000000,'RIN-R331-13KF':630000,'RIN-R331-16KF':680000,'RIN-R331-20KF':730000,'RIN-R331-25KF':780000,'RIN-R331-30KF':830000,'RIN-RC600-15KF':780000,'RIN-RC600-18KF':830000,'RIN-RC600-22KF':880000,'RIN-RC600-27KF':930000,'RIN-RC600-30KF':980000});
