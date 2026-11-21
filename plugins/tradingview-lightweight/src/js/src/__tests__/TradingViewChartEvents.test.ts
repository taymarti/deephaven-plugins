import TradingViewChartRenderer, {
  TVL_CHART_EVENT,
  TVL_RENDERER_KEY,
  type TvlChartEventDetail,
} from '../TradingViewChartRenderer';

// lightweight-charts is the manual mock in src/__mocks__ (moduleNameMapper).

function listen(el: HTMLElement): TvlChartEventDetail[] {
  const seen: TvlChartEventDetail[] = [];
  el.addEventListener(TVL_CHART_EVENT, e =>
    seen.push((e as CustomEvent<TvlChartEventDetail>).detail)
  );
  return seen;
}

const LINE = {
  id: 'line-1',
  type: 'Line' as const,
  options: {},
  dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
};

describe('chart lifecycle events', () => {
  it('announces ready, series and destroy, bubbling to ancestors', () => {
    const parent = document.createElement('div');
    const container = document.createElement('div');
    parent.appendChild(container);
    const seen = listen(parent);

    const renderer = new TradingViewChartRenderer(container);
    renderer.configureSeries([LINE]);
    renderer.dispose();

    expect(seen.map(d => d.kind)).toEqual(['ready', 'series', 'destroy']);
    expect(seen.every(d => d.renderer === renderer)).toBe(true);
    expect(seen[0].chart).toBe(renderer.getChart());
  });

  it("fires 'ready' synchronously, before any 'series'", () => {
    const container = document.createElement('div');
    const seen = listen(container);
    const renderer = new TradingViewChartRenderer(container);
    expect(seen.map(d => d.kind)).toEqual(['ready']);
    renderer.configureSeries([LINE]);
    expect(seen.map(d => d.kind)).toEqual(['ready', 'series']);
  });

  it("announces 'series' on every reconfiguration", () => {
    const container = document.createElement('div');
    const seen = listen(container);
    const renderer = new TradingViewChartRenderer(container);
    renderer.configureSeries([LINE]);
    renderer.configureSeries([LINE, { ...LINE, id: 'line-2' }]);
    expect(seen.filter(d => d.kind === 'series')).toHaveLength(2);
  });

  it('keeps the live renderer on the container until dispose', () => {
    const container = document.createElement('div') as HTMLDivElement & {
      [TVL_RENDERER_KEY]?: TradingViewChartRenderer;
    };
    const renderer = new TradingViewChartRenderer(container);
    expect(container[TVL_RENDERER_KEY]).toBe(renderer);
    renderer.dispose();
    expect(container[TVL_RENDERER_KEY]).toBeUndefined();
  });
});
