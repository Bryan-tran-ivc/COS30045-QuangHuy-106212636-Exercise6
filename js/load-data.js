d3.csv('data/W6_TVdata.csv', d => ({
  brand: d.brand, model: d.model, screenSize: +d.screenSize,
  screenTech: d.screenTech, star: +d.star, energyConsumption: +d.energyConsumption
})).then(data => {
  console.log('TV data:', data);
  initBrandChart(data);
  populateFilters(data);
  drawScatterplot(data);
  handleMouseEvents();
}).catch(error => {
  console.error('Could not load TV data:', error);
  d3.select('#histogram-count').text('Could not load TV data.');
});
