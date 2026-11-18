import { parquetRead } from 'hyparquet';

export interface OlapColumns {
  length: number;
  opener_hcp: Uint8Array;
  spades: Uint8Array;
  hearts: Uint8Array;
  diamonds: Uint8Array;
  clubs: Uint8Array;
  conv_flags: Uint8Array;
  responder_hcp: Uint8Array;
  spade_fit: Uint8Array;
  heart_fit: Uint8Array;
  dds_s: Uint8Array;
  dds_h: Uint8Array;
  dds_nt: Uint8Array;
  opp_game: Uint8Array;
  deal_count: Uint32Array;
}

export interface BridgeFilter {
  convMask?: number;       // 1 = Flannery, 2 = Weak Two, 4 = Precision 1♣, 8 = Multi 2♦
  minHcp?: number;
  maxHcp?: number;
  exactClubs?: number;
  exactDiamonds?: number;
  exactSpades?: number;
  exactHearts?: number;
  minMajorFit?: number;
  minRespHcp?: number;
  maxRespHcp?: number;
}

export interface QueryResult {
  totalDeals: number;
  pct4H: number;
  pct4S: number;
  pct3NT: number;
  pctSlam: number;
  pctOppGame: number;
  distH: number[];
  distS: number[];
  distNT: number[];
  queryTimeMs: number;
}

/**
 * Loads and decodes bridge_olap.parquet directly into memory as contiguous TypedArrays.
 */
export async function loadOlapDataset(source: string | ArrayBuffer): Promise<OlapColumns> {
  let arrayBuffer: ArrayBuffer;
  if (typeof source === 'string') {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Failed to load Parquet dataset from ${source}: ${res.statusText}`);
    }
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = source;
  }

  const cols: Partial<OlapColumns> = {};

  await parquetRead({
    file: arrayBuffer,
    onComplete: (data: any[][]) => {
      const n = data.length;
      cols.length = n;
      cols.opener_hcp = new Uint8Array(n);
      cols.spades = new Uint8Array(n);
      cols.hearts = new Uint8Array(n);
      cols.diamonds = new Uint8Array(n);
      cols.clubs = new Uint8Array(n);
      cols.conv_flags = new Uint8Array(n);
      cols.responder_hcp = new Uint8Array(n);
      cols.spade_fit = new Uint8Array(n);
      cols.heart_fit = new Uint8Array(n);
      cols.dds_s = new Uint8Array(n);
      cols.dds_h = new Uint8Array(n);
      cols.dds_nt = new Uint8Array(n);
      cols.opp_game = new Uint8Array(n);
      cols.deal_count = new Uint32Array(n);

      for (let i = 0; i < n; i++) {
        const row = data[i];
        cols.opener_hcp![i] = row[0];
        cols.spades![i] = row[1];
        cols.hearts![i] = row[2];
        cols.diamonds![i] = row[3];
        cols.clubs![i] = row[4];
        cols.conv_flags![i] = row[5];
        cols.responder_hcp![i] = row[6];
        cols.spade_fit![i] = row[7];
        cols.heart_fit![i] = row[8];
        cols.dds_s![i] = row[9];
        cols.dds_h![i] = row[10];
        cols.dds_nt![i] = row[11];
        cols.opp_game![i] = row[12];
        cols.deal_count![i] = row[13];
      }
    },
  });

  return cols as OlapColumns;
}

/**
 * Executes sub-5ms in-memory aggregation loop directly on typed arrays.
 */
export function runBridgeQuery(db: OlapColumns, filter: BridgeFilter): QueryResult {
  const t0 = performance.now();

  let totalDeals = 0;
  let make4H = 0;
  let make4S = 0;
  let make3NT = 0;
  let makeSlam = 0;
  let oppGameCount = 0;

  const distH = new Array(14).fill(0);
  const distS = new Array(14).fill(0);
  const distNT = new Array(14).fill(0);

  const {
    length, opener_hcp, spades, hearts, clubs, diamonds, conv_flags,
    responder_hcp, spade_fit, heart_fit, dds_s, dds_h, dds_nt, opp_game, deal_count
  } = db;

  for (let i = 0; i < length; i++) {
    // 1. Convention bitmask check
    if (filter.convMask !== undefined && filter.convMask > 0) {
      if ((conv_flags[i] & filter.convMask) === 0) continue;
    }

    // 2. Opener HCP
    const hcp = opener_hcp[i];
    if (filter.minHcp !== undefined && hcp < filter.minHcp) continue;
    if (filter.maxHcp !== undefined && hcp > filter.maxHcp) continue;

    // 3. Opener suit lengths
    if (filter.exactClubs !== undefined && clubs[i] !== filter.exactClubs) continue;
    if (filter.exactDiamonds !== undefined && diamonds[i] !== filter.exactDiamonds) continue;
    if (filter.exactSpades !== undefined && spades[i] !== filter.exactSpades) continue;
    if (filter.exactHearts !== undefined && hearts[i] !== filter.exactHearts) continue;

    // 4. Responder HCP
    const respHcp = responder_hcp[i];
    if (filter.minRespHcp !== undefined && respHcp < filter.minRespHcp) continue;
    if (filter.maxRespHcp !== undefined && respHcp > filter.maxRespHcp) continue;

    // 5. Major fit (combined NS spades or hearts >= minMajorFit)
    if (filter.minMajorFit !== undefined) {
      if (spade_fit[i] < filter.minMajorFit && heart_fit[i] < filter.minMajorFit) continue;
    }

    const w = deal_count[i];
    const h = dds_h[i];
    const s = dds_s[i];
    const nt = dds_nt[i];

    totalDeals += w;
    if (h >= 10) make4H += w;
    if (s >= 10) make4S += w;
    if (nt >= 9) make3NT += w;
    if (h >= 12 || s >= 12 || nt >= 12) makeSlam += w;
    if (opp_game[i] === 1) oppGameCount += w;

    if (h >= 0 && h <= 13) distH[h] += w;
    if (s >= 0 && s <= 13) distS[s] += w;
    if (nt >= 0 && nt <= 13) distNT[nt] += w;
  }

  const div = totalDeals || 1;
  return {
    totalDeals,
    pct4H: Math.round((make4H * 1000) / div) / 10,
    pct4S: Math.round((make4S * 1000) / div) / 10,
    pct3NT: Math.round((make3NT * 1000) / div) / 10,
    pctSlam: Math.round((makeSlam * 1000) / div) / 10,
    pctOppGame: Math.round((oppGameCount * 1000) / div) / 10,
    distH: distH.map(v => Math.round((v * 1000) / div) / 10),
    distS: distS.map(v => Math.round((v * 1000) / div) / 10),
    distNT: distNT.map(v => Math.round((v * 1000) / div) / 10),
    queryTimeMs: Math.round((performance.now() - t0) * 10) / 10,
  };
}
