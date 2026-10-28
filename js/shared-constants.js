const chartSize = { width: 900, height: 480, margin: { top: 35, right: 30, bottom: 65, left: 80 } };
chartSize.innerWidth = chartSize.width - chartSize.margin.left - chartSize.margin.right;
chartSize.innerHeight = chartSize.height - chartSize.margin.top - chartSize.margin.bottom;
const screenColours = d3.scaleOrdinal()
  .domain(['LCD', 'LED', 'OLED'])
  .range(['#d47c45', '#438f8a', '#8064a2']);
const energyBins = d3.bin()
  .value(d => d.energyConsumption)
  .domain([0, 2800])
  .thresholds(d3.range(200, 2800, 200));
