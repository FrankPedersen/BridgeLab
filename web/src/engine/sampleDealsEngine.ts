import { parquetRead } from 'hyparquet';
import type { BridgeFilter } from '../types/bridge';

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
  ddsSource: 'endplay_dds';
}

export interface SampleDealsDataset {
  length: number;
  deal_id: Float64Array;
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
  dds_source?: string[];
}

export async function loadSampleDeals(source: string | ArrayBuffer): Promise<SampleDealsDataset> {
  const arrayBuffer = typeof source === 'string'
    ? await (await fetch(source)).arrayBuffer()
    : source;
  const ds: Partial<SampleDealsDataset> = {};
  const expectedCols = [
    'deal_id', 'opener_hcp', 'spades', 'hearts', 'diamonds', 'clubs',
    'conv_flags', 'dds_s', 'dds_h', 'dds_d', 'dds_c', 'dds_nt'
  ];

  await parquetRead({
    file: arrayBuffer,
    columns: expectedCols,
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
      ds.dds_source = new Array(n).fill('endplay_dds');
      for (let i = 0; i < n; i++) {
        const row = data[i];
        ds.deal_id[i] = Number(row[0]);
        ds.opener_hcp[i] = row[1];
        ds.spades[i] = row[2];
        ds.hearts[i] = row[3];
        ds.diamonds[i] = row[4];
        ds.clubs[i] = row[5];
        ds.conv_flags[i] = row[6];
        ds.dds_s[i] = row[7];
        ds.dds_h[i] = row[8];
        ds.dds_d[i] = row[9];
        ds.dds_c[i] = row[10];
        ds.dds_nt[i] = row[11];
      }
    },
  });
  return ds as SampleDealsDataset;
}

export function queryMatchingSamples(
  dataset: SampleDealsDataset,
  filter: BridgeFilter,
  limit: number = 5
): SampleDealRecord[] {
  const matches: SampleDealRecord[] = [];
  for (let i = 0; i < dataset.length && matches.length < limit; i++) {
    if (filter.convMask && (dataset.conv_flags[i] & filter.convMask) === 0) continue;
    if (filter.minHcp !== undefined && dataset.opener_hcp[i] < filter.minHcp) continue;
    if (filter.maxHcp !== undefined && dataset.opener_hcp[i] > filter.maxHcp) continue;
    if (filter.exactClubs !== undefined && dataset.clubs[i] !== filter.exactClubs) continue;
    if (filter.exactDiamonds !== undefined && dataset.diamonds[i] !== filter.exactDiamonds) continue;
    if (filter.exactSpades !== undefined && dataset.spades[i] !== filter.exactSpades) continue;
    if (filter.exactHearts !== undefined && dataset.hearts[i] !== filter.exactHearts) continue;
    matches.push({
      dealId: dataset.deal_id[i],
      openerHcp: dataset.opener_hcp[i],
      spades: dataset.spades[i],
      hearts: dataset.hearts[i],
      diamonds: dataset.diamonds[i],
      clubs: dataset.clubs[i],
      convFlags: dataset.conv_flags[i],
      ddsS: dataset.dds_s[i],
      ddsH: dataset.dds_h[i],
      ddsD: dataset.dds_d[i],
      ddsC: dataset.dds_c[i],
      ddsNt: dataset.dds_nt[i],
      ddsSource: 'endplay_dds',
    });
  }
  return matches;
}
