/**
 * mapBoundary.ts — Zillow-style geographic boundary system
 *
 * Draws a boundary polygon on the MapBox map and emits events
 * so the properties list can filter to only properties within it.
 *
 * Race-condition safety:
 *  - _searchVersion increments on every new search and every clear.
 *  - Any async Nominatim response with an old version is discarded.
 *  - _pendingDraw keeps a reference to any queued map-event callback
 *    so clearSearchBoundary() can cancel it immediately via map.off().
 *  - Version is checked INSIDE draw() so even a callback that already
 *    entered the event queue before clear was pressed is a no-op.
 *
 * City boundary fix:
 *  - map.once('styledata', ...) fires prematurely while tiles are loading
 *    and paintLayers() throws (caught silently) — no border visible.
 *  - We now use map.once('style.load', ...) which only fires after the
 *    full style is ready, making city boundaries reliable.
 */

const SOURCE_ID = 'sb-source';
const HALO_ID   = 'sb-halo';
const LINE_ID   = 'sb-line';
const FILL_ID   = 'sb-fill';

// Module-level state
let _geojson: any = null;
let _styleOff: (() => void) | null = null;
let _pollId: ReturnType<typeof setInterval> | null = null;
let _searchVersion = 0;

// Track queued draw callbacks so we can cancel them on clear
let _pendingDraw: (() => void) | null = null;
let _pendingDrawMap: any = null;

export function getActiveBoundaryPolygon(): any {
  return _geojson;
}

function getMap(): any {
  return (window as any).__simpleMap ?? null;
}

// ─── Map layer helpers ────────────────────────────────────────────────────────

function dropLayers(map: any): void {
  for (const id of [HALO_ID, LINE_ID, FILL_ID]) {
    try { if (map.getLayer(id)) map.removeLayer(id); } catch { /* */ }
  }
  try { if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID); } catch { /* */ }
}

function paintLayers(map: any, geojson: any): void {
  dropLayers(map);
  map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

  const styleName = map.getStyle()?.name?.toLowerCase() ?? '';
  const isSatellite = styleName.includes('satellite') || styleName.includes('hybrid');

  // Zillow-style: very subtle fill, thin crisp border, no chunky halo
  const blue = '#0061ff';

  // 1. Barely-visible fill (just a hint of tint inside the boundary)
  map.addLayer({
    id: FILL_ID, type: 'fill', source: SOURCE_ID,
    paint: { 'fill-color': blue, 'fill-opacity': isSatellite ? 0.06 : 0.04 },
  });

  // 2. Thin soft glow line so the edge reads on satellite dark tiles
  map.addLayer({
    id: HALO_ID, type: 'line', source: SOURCE_ID,
    paint: {
      'line-color': '#ffffff',
      'line-width': isSatellite ? 2.5 : 2,
      'line-opacity': isSatellite ? 0.5 : 0.35,
      'line-blur': 0.5,
    },
  });

  // 3. Primary border — thin and crisp like Zillow
  map.addLayer({
    id: LINE_ID, type: 'line', source: SOURCE_ID,
    paint: {
      'line-color': blue,
      'line-width': isSatellite ? 1.5 : 1.5,
      'line-opacity': 0.9,
    },
  });

  console.log(`[mapBoundary] ✅ Layers painted (${isSatellite ? 'satellite' : 'street'})`);
}

// ─── Style-reload listener ────────────────────────────────────────────────────

function watchStyleChanges(map: any): void {
  if (_styleOff) { _styleOff(); _styleOff = null; }
  const handler = () => {
    if (_geojson) {
      console.log('[mapBoundary] style.load — redrawing boundary');
      paintLayers(map, _geojson);
    }
  };
  map.on('style.load', handler);
  _styleOff = () => map.off('style.load', handler);
}

// ─── Cancel any queued draw callback ─────────────────────────────────────────

function cancelPendingDraw(): void {
  if (_pendingDraw && _pendingDrawMap) {
    try {
      _pendingDrawMap.off('style.load', _pendingDraw);
      _pendingDrawMap.off('idle',       _pendingDraw);
    } catch { /* */ }
  }
  _pendingDraw    = null;
  _pendingDrawMap = null;
}

// ─── Core draw ───────────────────────────────────────────────────────────────

function stopPoll(): void {
  if (_pollId !== null) { clearInterval(_pollId); _pollId = null; }
}

function applyToMap(geojson: any, capturedVersion: number): void {
  const map = getMap();

  if (!map) {
    if (_pollId === null) {
      console.log('[mapBoundary] Map not ready — polling…');
      _pollId = setInterval(() => {
        const m = getMap();
        if (m) { stopPoll(); applyToMap(geojson, capturedVersion); }
      }, 300);
      setTimeout(stopPoll, 30_000);
    }
    return;
  }

  stopPoll();
  cancelPendingDraw();

  // Version-safe draw: if the boundary was cleared (or replaced) between
  // applyToMap being called and the map-event firing, this is a no-op.
  const draw = () => {
    _pendingDraw    = null;
    _pendingDrawMap = null;
    if (_searchVersion !== capturedVersion) {
      console.log(`[mapBoundary] draw() skipped — version mismatch (want ${capturedVersion}, now ${_searchVersion})`);
      return;
    }
    try {
      paintLayers(map, geojson);
      watchStyleChanges(map);
    } catch (err) {
      console.warn('[mapBoundary] paintLayers error:', err);
    }
  };

  if (map.isStyleLoaded()) {
    draw();
  } else {
    // Use 'style.load' (not 'styledata') so we wait for the style to be
    // fully ready before adding sources/layers. 'styledata' fires too early
    // (e.g., while tiles are loading) and causes silent failures for cities.
    console.log('[mapBoundary] Waiting for style.load before painting…');
    _pendingDraw    = draw;
    _pendingDrawMap = map;
    map.once('style.load', draw);

    // Belt-and-suspenders: if style.load never fires (already loaded between
    // the isStyleLoaded check and the once() call), fall back via idle.
    map.once('idle', () => {
      if (_pendingDraw === draw) {
        // style.load didn't fire; try drawing now
        map.off('style.load', draw);
        draw();
      }
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Immediately clears all boundary state and map layers. */
export function clearSearchBoundary(): void {
  _searchVersion++;
  _geojson = null;
  stopPoll();
  cancelPendingDraw();
  if (_styleOff) { _styleOff(); _styleOff = null; }

  const map = getMap();
  if (map) dropLayers(map);

  window.dispatchEvent(
    new CustomEvent('boundaryChanged', { detail: { active: false, polygon: null } })
  );
  console.log('[mapBoundary] Boundary cleared');
}

/**
 * Fetch a boundary polygon from Nominatim and draw it on the map.
 *
 * Strategy:
 *  1. Full place name query (e.g., "Dallas, Texas, United States")
 *  2. If no Polygon/MultiPolygon found → bbox rectangle fallback
 *  3. If still nothing → city-only retry (first segment before comma)
 *
 * Fires 'boundaryChanged' { active:true, polygon } as soon as data is
 * ready so the property list can filter before the map finishes painting.
 */
export async function drawSearchBoundary(placeName: string): Promise<void> {
  if (!placeName || placeName.trim().length < 2) return;

  const place = placeName.trim();

  _searchVersion++;
  const myVersion = _searchVersion;

  console.log(`[mapBoundary] Fetching boundary for: "${place}" (v${myVersion})`);

  try {
    const encoded = encodeURIComponent(place);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encoded}&format=geojson&polygon_geojson=1&limit=5&polygon_threshold=0.0001`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'TerraTracts/1.0' } }
    );

    if (myVersion !== _searchVersion) {
      console.log(`[mapBoundary] Stale result discarded v${myVersion}`);
      return;
    }

    if (!res.ok) {
      console.warn('[mapBoundary] Nominatim HTTP error:', res.status);
      return;
    }

    const data = await res.json();
    const features: any[] = data?.features ?? [];
    console.log(`[mapBoundary] Nominatim returned ${features.length} feature(s) for "${place}"`);
    features.forEach((f: any, i: number) =>
      console.log(`  [${i}] type=${f.geometry?.type} class=${f.properties?.class} type_prop=${f.properties?.type} display="${f.properties?.display_name?.slice(0, 60)}"`));

    // 1. Prefer highest-ranked Polygon or MultiPolygon
    let poly = features.find(
      (f: any) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
    );

    // 2. Bbox rectangle fallback
    if (!poly) {
      const withBbox = features.find((f: any) => Array.isArray(f.bbox) && f.bbox.length === 4);
      if (withBbox) {
        const [w, s, e, n] = withBbox.bbox;
        console.log(`[mapBoundary] No polygon — using bbox rectangle for "${place}"`);
        poly = {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
          properties: withBbox.properties ?? {},
        };
      }
    }

    // 3. Retry with city-only name (first comma segment)
    if (!poly && place.includes(',')) {
      const cityOnly = place.split(',')[0].trim();
      if (cityOnly && cityOnly !== place) {
        console.log(`[mapBoundary] Retrying with city-only: "${cityOnly}"`);
        // Don't manipulate _searchVersion here — pass through cleanly.
        // The recursive call will increment the version; if this version
        // is already stale that's fine, it will be discarded there.
        if (myVersion === _searchVersion) {
          _searchVersion--;   // Undo our increment so the recursive one takes over cleanly
          return drawSearchBoundary(cityOnly);
        }
        return;
      }
    }

    if (!poly) {
      console.warn(`[mapBoundary] No usable polygon for "${place}"`);
      return;
    }

    if (myVersion !== _searchVersion) {
      console.log(`[mapBoundary] Stale after processing — discarding`);
      return;
    }

    const geojson = { type: 'FeatureCollection', features: [poly] };
    _geojson = geojson;

    window.dispatchEvent(
      new CustomEvent('boundaryChanged', { detail: { active: true, polygon: geojson } })
    );
    console.log('[mapBoundary] 🔵 boundaryChanged fired — active=true');

    applyToMap(geojson, myVersion);

  } catch (err) {
    console.warn('[mapBoundary] Fetch error:', err);
  }
}
