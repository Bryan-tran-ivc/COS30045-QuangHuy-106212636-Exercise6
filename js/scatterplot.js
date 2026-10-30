function drawScatterplot(data) {
  const { width, height, margin, innerWidth, innerHeight } = chartSize;
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.star)]).nice().range([0, innerWidth]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.energyConsumption)]).nice().range([innerHeight, 0]);
  const svg = d3.select('#scatterplot').append('svg').attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img').attr('aria-label', 'TV energy consumption by star rating and screen technology');
  const plot = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  plot.selectAll('circle.tv-point').data(data).join('circle').attr('class', 'tv-point')
    .attr('cx', d => x(d.star)).attr('cy', d => y(d.energyConsumption)).attr('r', 3.5)
    .attr('fill', d => screenColours(d.screenTech)).attr('opacity', 0.48)
    .attr('tabindex', 0).attr('aria-label', d => `${d.brand} ${d.model}, ${d.screenSize} inches, ${d.star} stars, ${d.energyConsumption} kWh per year`);
  plot.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(8));
  plot.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(6));
  svg.append('text').attr('class', 'chart-axis-label').attr('x', margin.left + innerWidth / 2)
    .attr('y', height - 12).attr('text-anchor', 'middle').text('Energy rating (stars)');
  svg.append('text').attr('class', 'chart-axis-label').attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + innerHeight / 2)).attr('y', 20).attr('text-anchor', 'middle')
    .text('Annual energy consumption (kWh/year)');
  const legend = svg.append('g').attr('transform', `translate(${width - 170},${margin.top + 5})`);
  const item = legend.selectAll('g').data(screenColours.domain()).join('g')
    .attr('transform', (_, i) => `translate(0,${i * 22})`);
  item.append('circle').attr('r', 5).attr('fill', d => screenColours(d));
  item.append('text').attr('x', 12).attr('dy', '.35em').attr('class', 'legend-label').text(d => d);
}
