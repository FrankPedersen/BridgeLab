import { parquetRead } from 'hyparquet';
import { BridgeFilter } from './bridgeQueryEngine';

export interface SampleDealRecord {
  dealId: number;
  openerHcp: number;
  spades: number;
  hearts: number;
  diamonds: number;
  clubs: number;
  convFlags: number;
  ddsS: number;
  ddsH: number;
  ddsD: number;
  ddsC: number;
  ddsNt: number;
}

export interface SampleDealsDataset {
  length: number;
  deal_id: Float64Array; // safely stores 53-bit integers
  opener_hcp: Uint8Array;
  spades: Uint8Array;
  hearts: Uint8Array;
  diamonds: Uint8Array;
  clubs: Uint8Array;
  conv_flags: Uint8Array;
  dds_s: Uint8Array;
  dds_h: Uint8Array;
  dds_d: Uint8Array;
  dds_c: Uint8Array;
  dds_nt: Uint8Array;
}

/**
 * Loads sample_deals.parquet into memory
 */
export async function loadSampleDeals(source: string | ArrayBuffer): Promise<SampleDealsDataset> {
  let arrayBuffer: ArrayBuffer;
  if (typeof source === 'string') {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Failed to load sample deals from ${source}: ${res.statusText}`);
    }
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = source;
  }

  const ds: Partial<SampleDealsDataset> = {};

  await parquetRead({
    file: arrayBuffer,
    onComplete: (data: any[][]) => {
      const n = data.length;
      ds.length = n;
      ds.deal_id = new Float64Array(n);
      ds.opener_hcp = new Uint8Array(n);
      ds.spades = new Uint8Array(n);
      ds.hearts = new Uint8Array(n);
      ds.diamonds = new Uint8Array(n);
      ds.clubs = new Uint8Array(n);
      ds.conv_flags = new Uint8Array(n);
      ds.dds_s = new Uint8Array(n);
      ds.dds_h = new Uint8Array(n);
      ds.dds_d = new Uint8Array(n);
      ds.dds_c = new Uint8Array(n);
      ds.dds_nt = new Uint8Array(n);

      for (let i = 0; i < n; i++) {
        const row = data[i];
        // deal_id is bigint in parquet, cast to number
        ds.deal_id![i] = Number(row[0]);
        ds.opener_hcp![i] = row[1];
        ds.spades![i] = row[2];
        ds.hearts![i] = row[3];
        ds.diamonds![i] = row[4];
        ds.clubs![i] = row[5];
        ds.conv_flags![i] = row[6];
        ds.dds_s![i] = row[7];
        ds.dds_h![i] = row[8];
        ds.dds_d![i] = row[9];
        ds.dds_c![i] = row[10];
        ds.dds_nt![i] = row[11];
      }
    },
  });

  return ds as SampleDealsDataset;
}

/**
 * Fast search through sample deals for rows matching the current filter.
 */
export function queryMatchingSamples(
  dataset: SampleDealsDataset,
  filter: BridgeFilter,
  limit: number = 5
): SampleDealRecord[] {
  const matches: SampleDealRecord[] = [];
  const {
    length, deal_id, opener_hcp, spades, hearts, diamonds, clubs, conv_flags,
    dds_s, dds_h, dds_d, dds_c, dds_nt
  } = dataset;

  for (let i = 0; i < length; i++) {
    // 1. Convention check
    if (filter.convMask !== undefined && filter.convMask > 0) {
      if ((conv_flags[i] & filter.convMask) === 0) continue;
    }

    // 2. Opener HCP
    const hcp = opener_hcp[i];
    if (filter.minHcp !== undefined && hcp < filter.minHcp) continue;
    if (filter.maxHcp !== undefined && hcp > filter.maxHcp) continue;

    // 3. Exact suit lengths
    if (filter.exactClubs !== undefined && clubs[i] !== filter.exactClubs) continue;
    if (filter.exactDiamonds !== undefined && diamonds[i] !== filter.exactDiamonds) continue;
    if (filter.exactSpades !== undefined && spades[i] !== filter.exactSpades) continue;
    if (filter.exactHearts !== undefined && hearts[i] !== filter.exactHearts) continue;

    matches.push({
      dealId: deal_id[i],
      openerHcp: opener_hcp[i],
      spades: spades[i],
      hearts: hearts[i],
      diamonds: diamonds[i],
      clubs: clubs[i],
      convFlags: conv_flags[i],
      ddsS: dds_s[i],
      ddsH: dds_h[i],
      ddsD: dds_d[i],
      ddsC: dds_c[i],
      ddsNt: dds_nt[i],
    });

    if (matches.length >= limit) {
      break;
    }
  }

  return matches;
}
