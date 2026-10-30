function drawHistogram(data) {
  const { width, height, margin, innerWidth, innerHeight } = chartSize;
  const bins = energyBins(data);
  const x = d3.scaleLinear().domain([0, 2800]).range([0, innerWidth]);
  const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 1]).nice().range([innerHeight, 0]);
  let svg = d3.select('#histogram').selectAll('svg').data([null]).join('svg')
    .attr('viewBox', `0 0 ${width} ${height}`).attr('role', 'img')
    .attr('aria-label', 'Histogram of TV energy consumption');
  let plot = svg.selectAll('g.plot').data([null]).join('g').attr('class', 'plot')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  plot.selectAll('rect.histogram-bar').data(bins, d => d.x0).join('rect')
    .attr('class', 'histogram-bar').attr('x', d => x(d.x0) + 1)
    .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr('y', d => y(d.length)).attr('height', d => innerHeight - y(d.length));
  plot.selectAll('g.x-axis').data([null]).join('g').attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(7));
  plot.selectAll('g.y-axis').data([null]).join('g').attr('class', 'axis y-axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')));
  svg.selectAll('text.hist-x-label').data([null]).join('text').attr('class', 'chart-axis-label hist-x-label')
    .attr('x', margin.left + innerWidth / 2).attr('y', height - 12).attr('text-anchor', 'middle')
    .text('Annual energy consumption (kWh/year)');
  svg.selectAll('text.hist-y-label').data([null]).join('text').attr('class', 'chart-axis-label hist-y-label')
    .attr('transform', 'rotate(-90)').attr('x', -(margin.top + innerHeight / 2)).attr('y', 20)
    .attr('text-anchor', 'middle').text('Number of models');
  d3.select('#histogram-count').text(`${d3.format(',')(data.length)} models shown`);
  console.log('Histogram bins:', bins);
}
