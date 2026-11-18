import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { FlanneryPage } from './pages/FlanneryPage';
import { WeakTwoPage } from './pages/WeakTwoPage';
import { PrecisionPage } from './pages/PrecisionPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { OlapColumns, loadOlapDataset, runBridgeQuery } from './engine/bridgeQueryEngine';
import { SampleDealsDataset, loadSampleDeals } from './engine/sampleDealsEngine';
import { Database, Cpu, ExternalLink } from 'lucide-react';

export function App() {
  // Simple hash or path routing for GitHub Pages compatibility
  const getInitialPath = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.startsWith('/')) return hash;
    const path = window.location.pathname;
    if (path.includes('/flannery')) return '/flannery';
    if (path.includes('/weak-two')) return '/weak-two';
    if (path.includes('/precision')) return '/precision';
    if (path.includes('/explorer')) return '/explorer';
    return '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath());
  const [olapDb, setOlapDb] = useState<OlapColumns | null>(null);
  const [sampleDb, setSampleDb] = useState<SampleDealsDataset | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(undefined);

  // Static summaries for 0 ms initial render
  const [summaries, setSummaries] = useState<{
    global?: any;
    flannery?: any;
    weakTwo?: any;
    precision?: any;
  }>({});

  const totalDeals = olapDb 
    ? olapDb.deal_count.reduce((a, b) => a + b, 0) 
    : (summaries.global?.totalDeals ?? 500000);

  // Update hash when navigating
  const navigate = (path: string) => {
    setCurrentPath(path);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('/')) {
        setCurrentPath(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [dataSource, setDataSource] = useState<'GCS' | 'Local'>('Local');

  // 1. Instant 0 ms Initial Render: Fetch tiny static JSON summaries
  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
        const [gRes, fRes, wRes, pRes] = await Promise.allSettled([
          fetch(`${basePath}/data/global_summary.json`).then(r => r.json()),
          fetch(`${basePath}/data/flannery_summary.json`).then(r => r.json()),
          fetch(`${basePath}/data/weak_two_summary.json`).then(r => r.json()),
          fetch(`${basePath}/data/precision_summary.json`).then(r => r.json()),
        ]);

        setSummaries({
          global: gRes.status === 'fulfilled' ? gRes.value : undefined,
          flannery: fRes.status === 'fulfilled' ? fRes.value : undefined,
          weakTwo: wRes.status === 'fulfilled' ? wRes.value : undefined,
          precision: pRes.status === 'fulfilled' ? pRes.value : undefined,
        });
      } catch (e) {
        console.warn('Could not load static summaries:', e);
      }
    };
    loadSummaries();
  }, []);

  // 2. Client-Side Parquet In-Memory Engine Loader (GCS with local fallback)
  useEffect(() => {
    const initEngine = async () => {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
      const GCS_BASE = 'https://storage.googleapis.com/bridge-dds-explorer-data/v1';

      try {
        // Try Google Cloud Storage Always Free bucket first
        console.log('[DDS Engine] Fetching Parquet dataset from GCS Always Free bucket...');
        const [loadedOlap, loadedSamples] = await Promise.all([
          loadOlapDataset(`${GCS_BASE}/bridge_olap.parquet`),
          loadSampleDeals(`${GCS_BASE}/sample_deals.parquet`),
        ]);

        setOlapDb(loadedOlap);
        setSampleDb(loadedSamples);
        setDataSource('GCS');
        setIsEngineReady(true);
        console.log(`[DDS Engine] Loaded from GCS: ${loadedOlap.length} OLAP rows and ${loadedSamples.length} sample deals into TypedArrays.`);
      } catch (gcsErr) {
        console.warn('[DDS Engine] GCS fetch failed, falling back to local dataset:', gcsErr);
        try {
          const [loadedOlap, loadedSamples] = await Promise.all([
            loadOlapDataset(`${basePath}/data/bridge_olap.parquet`),
            loadSampleDeals(`${basePath}/data/sample_deals.parquet`),
          ]);

          setOlapDb(loadedOlap);
          setSampleDb(loadedSamples);
          setDataSource('Local');
          setIsEngineReady(true);
          console.log(`[DDS Engine] Loaded from local: ${loadedOlap.length} OLAP rows and ${loadedSamples.length} sample deals into TypedArrays.`);
        } catch (localErr) {
          console.error('[DDS Engine] Fatal error loading Parquet datasets:', localErr);
        }
      }
    };

    initEngine();
  }, []);

  // Compute global summary when olapDb is ready
  const globalResult = React.useMemo(() => {
    if (olapDb) {
      return runBridgeQuery(olapDb, {});
    }
    if (summaries.global) {
      return summaries.global;
    }
    return null;
  }, [olapDb, summaries.global]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        isEngineReady={isEngineReady}
        totalDeals={totalDeals}
        lastLatencyMs={lastLatencyMs}
        dataSource={dataSource}
      />

      {/* Main Content Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPath === '/' && (
          <HomePage
            onNavigate={navigate}
            globalResult={globalResult}
            totalDealsCount={totalDeals}
          />
        )}

        {currentPath === '/flannery' && (
          <FlanneryPage
            olapDb={olapDb}
            sampleDb={sampleDb}
            totalDeals={totalDeals}
            fallbackSummary={summaries.flannery}
            onLatencyUpdate={setLastLatencyMs}
          />
        )}

        {currentPath === '/weak-two' && (
          <WeakTwoPage
            olapDb={olapDb}
            sampleDb={sampleDb}
            totalDeals={totalDeals}
            fallbackSummary={summaries.weakTwo}
            onLatencyUpdate={setLastLatencyMs}
          />
        )}

        {currentPath === '/precision' && (
          <PrecisionPage
            olapDb={olapDb}
            sampleDb={sampleDb}
            totalDeals={totalDeals}
            fallbackSummary={summaries.precision}
            onLatencyUpdate={setLastLatencyMs}
          />
        )}

        {currentPath === '/explorer' && (
          <ExplorerPage
            olapDb={olapDb}
            sampleDb={sampleDb}
            totalDeals={totalDeals}
            fallbackSummary={summaries.global}
            onLatencyUpdate={setLastLatencyMs}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-8 text-xs text-slate-400 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center text-white font-bold text-xs">
              ♠
            </div>
            <div>
              <span className="font-bold text-slate-200">Bridge DDS Explorer</span>
              <p className="text-[11px] text-slate-400">
                Deterministisk analyseportal med Bo Haglund Double Dummy Solver
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hyparquet & TypedArray In-Memory</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Google Cloud Storage Always Free</span>
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Pages</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
