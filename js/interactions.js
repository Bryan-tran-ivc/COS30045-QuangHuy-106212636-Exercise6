const controls = {
  technology: d3.select("#technology-filter"),
  search: d3.select("#brand-search"),
  rating: d3.select("#rating-filter"),
  ratingOutput: d3.select("#rating-output"),
  reset: d3.select("#reset-button")
};

const tooltip = d3.select("#tooltip");
const emptyMessage = d3.select("#empty-message");
let sourceData = [];
let pinnedBrand = null;
let firstRender = true;

const chart = {
  width: 900,
  margin: { top: 35, right: 75, bottom: 55, left: 115 },
  rowHeight: 45
};
chart.innerWidth = chart.width - chart.margin.left - chart.margin.right;

const svg = d3.select("#interactive-chart")
  .append("svg")
  .attr("viewBox", `0 0 ${chart.width} 610`)
  .attr("role", "img")
  .attr("aria-labelledby", "chart-title");
const innerChart = svg.append("g")
  .attr("transform", `translate(${chart.margin.left},${chart.margin.top})`);
const gridLayer = innerChart.append("g").attr("class", "grid");
const barsLayer = innerChart.append("g");
const labelsLayer = innerChart.append("g");
const xAxisLayer = innerChart.append("g").attr("class", "axis");

function initBrandChart(data) {
  const brandNames = { lg: "LG", jvc: "JVC", tcl: "TCL", ffalcon: "FFalcon" };
  sourceData = data.map(d => ({
    brand: brandNames[d.brand.toLowerCase()] || d.brand.replace(/\b\w/g, c => c.toUpperCase()),
    technology: d.screenTech,
    count: 1,
    avgEnergy: d.energyConsumption,
    rating: d.star
  }));
  const technologies = [...new Set(sourceData.map(d => d.technology))].sort();
  controls.technology.selectAll("option.technology-option")
    .data(technologies)
    .join("option")
    .attr("class", "technology-option")
    .attr("value", d => d)
    .text(d => d);

  controls.technology.on("change", updateChart);
  controls.search.on("input", updateChart);
  controls.rating.on("input", () => {
    controls.ratingOutput.text(controls.rating.property("value"));
    updateChart();
  });
  d3.selectAll("input[name='sort']").on("change", updateChart);
  controls.reset.on("click", resetFilters);
  updateChart();
}

function filteredAndGroupedData() {
  const technology = controls.technology.property("value");
  const query = controls.search.property("value").trim().toLowerCase();
  const minimumRating = +controls.rating.property("value");
  const filtered = sourceData.filter(d =>
    (technology === "All" || d.technology === technology) &&
    d.brand.toLowerCase().includes(query) &&
    d.rating >= minimumRating
  );

  const grouped = d3.rollups(
    filtered,
    rows => ({
      count: d3.sum(rows, d => d.count),
      avgEnergy: d3.sum(rows, d => d.avgEnergy * d.count) / d3.sum(rows, d => d.count),
      technologies: [...new Set(rows.map(d => d.technology))].sort().join(", ")
    }),
    d => d.brand
  ).map(([brand, values]) => ({ brand, ...values }));

  const sortValue = d3.select("input[name='sort']:checked").property("value");
  grouped.sort(sortValue === "brand"
    ? (a, b) => d3.ascending(a.brand, b.brand)
    : (a, b) => d3.descending(a.count, b.count));
  return grouped.filter(d => d.count > 10);
}

function updateChart() {
  pinnedBrand = null;
  hideTooltip();
  const data = filteredAndGroupedData();
  const innerHeight = Math.max(390, data.length * chart.rowHeight);
  const height = innerHeight + chart.margin.top + chart.margin.bottom;
  svg.attr("viewBox", `0 0 ${chart.width} ${height}`);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) || 1])
    .nice()
    .range([0, chart.innerWidth]);
  const yScale = d3.scaleBand()
    .domain(data.map(d => d.brand))
    .range([0, innerHeight])
    .padding(0.22);
  const colourScale = d3.scaleOrdinal()
    .domain(["Samsung", "LG", "Hisense", "TCL", "Sony", "Panasonic", "Philips", "JVC", "Toshiba", "Kogan", "Sharp", "FFalcon", "Loewe", "Metz"])
    .range(["#286fbd", "#ed7d31", "#2c9d66", "#d6535b", "#8b60bd", "#c59822", "#148f9c", "#b94b99", "#4673bd", "#d76c38", "#7355ae", "#79972d", "#ca4d78", "#258178"]);

  const gridAxis = d3.axisBottom(xScale).ticks(6).tickSize(innerHeight).tickFormat("");
  const countAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("~s"));
  xAxisLayer.attr("transform", `translate(0,${innerHeight})`);
  if (firstRender) {
    gridLayer.call(gridAxis);
    xAxisLayer.call(countAxis);
  } else {
    gridLayer.transition().duration(450).call(gridAxis);
    xAxisLayer.transition().duration(450).call(countAxis);
  }

  const bars = barsLayer.selectAll("rect.interactive-bar")
    .data(data, d => d.brand)
    .join(
      enter => enter.append("rect")
        .attr("class", "interactive-bar")
        .attr("tabindex", 0)
        .attr("role", "img")
        .attr("x", 0)
        .attr("width", 0)
        .attr("y", d => yScale(d.brand))
        .attr("height", yScale.bandwidth())
        .attr("rx", 2),
      update => update,
      exit => exit.transition().duration(300).attr("width", 0).remove()
    )
    .attr("aria-label", d => `${d.brand}: ${d.count} models, average ${d.avgEnergy.toFixed(1)} kilowatt hours`)
    .on("pointerenter pointermove", (event, d) => {
      if (!pinnedBrand) showTooltip(event, d);
    })
    .on("pointerleave", () => {
      if (!pinnedBrand) hideTooltip();
    })
    .on("focus", (event, d) => showTooltip(event, d))
    .on("blur", () => {
      if (!pinnedBrand) hideTooltip();
    })
    .on("click", (event, d) => {
      pinnedBrand = pinnedBrand === d.brand ? null : d.brand;
      pinnedBrand ? showTooltip(event, d) : hideTooltip();
    })
    .on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        pinnedBrand = pinnedBrand === d.brand ? null : d.brand;
        pinnedBrand ? showTooltip(event, d) : hideTooltip();
      }
    });

  (firstRender ? bars : bars.transition().duration(650))
    .attr("y", d => yScale(d.brand))
    .attr("height", yScale.bandwidth())
    .attr("width", d => xScale(d.count))
    .attr("fill", d => colourScale(d.brand));

  const barLabels = labelsLayer.selectAll("text.bar-label")
    .data(data, d => d.brand)
    .join("text")
    .attr("class", "bar-label")
    .attr("text-anchor", "end")
    .attr("x", -12)
    .text(d => d.brand);
  (firstRender ? barLabels : barLabels.transition().duration(650))
    .attr("y", d => yScale(d.brand) + yScale.bandwidth() / 2)
    .attr("dy", ".35em");

  const valueLabels = labelsLayer.selectAll("text.value-label")
    .data(data, d => d.brand)
    .join("text")
    .attr("class", "value-label")
    .text(d => d3.format(",")(d.count));
  (firstRender ? valueLabels : valueLabels.transition().duration(650))
    .attr("x", d => xScale(d.count) + 9)
    .attr("y", d => yScale(d.brand) + yScale.bandwidth() / 2)
    .attr("dy", ".35em");

  d3.select("#result-count").text(`${data.length} ${data.length === 1 ? "brand" : "brands"}`);
  d3.select("#model-total").text(`${d3.format(",")(d3.sum(data, d => d.count))} models shown`);
  emptyMessage.property("hidden", data.length !== 0);
  firstRender = false;
}

function showTooltip(event, d) {
  const bounds = event.currentTarget?.getBoundingClientRect?.();
  const pointerX = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : bounds?.right || 20;
  const pointerY = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : bounds?.top || 20;
  const x = Math.min(window.innerWidth - 220, Math.max(12, pointerX + 14));
  const y = Math.min(window.innerHeight - 135, Math.max(12, pointerY + 14));
  tooltip
    .html(`<strong>${d.brand}</strong><span>${d3.format(",")(d.count)} models</span><span>${d.avgEnergy.toFixed(1)} kWh average annual energy</span><span>${d.technologies}</span>`)
    .style("left", `${x}px`)
    .style("top", `${y}px`)
    .classed("visible", true);
}

function hideTooltip() {
  tooltip.classed("visible", false);
}

function resetFilters() {
  controls.technology.property("value", "All");
  controls.search.property("value", "");
  controls.rating.property("value", 1);
  controls.ratingOutput.text("1");
  d3.select("input[name='sort'][value='count']").property("checked", true);
  updateChart();
}
function populateFilters(data) {
  const options = ['All', 'LCD', 'LED', 'OLED'];
  const buttons = d3.select('#filters_screen').selectAll('button').data(options).join('button')
    .attr('type', 'button').attr('class', 'screen-filter')
    .text(d => d === 'All' ? 'All screens' : d);
  function selectScreen(technology) {
    buttons.classed('active', d => d === technology).attr('aria-pressed', d => String(d === technology));
    drawHistogram(technology === 'All' ? data : data.filter(d => d.screenTech === technology));
  }
  buttons.on('click', (_, technology) => selectScreen(technology));
  selectScreen('All');
}

function handleMouseEvents() {
  const tooltip = d3.select('#scatter-tooltip');
  let pinned = null;
  function show(event, d) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX > 0 ? event.clientX : bounds.right;
    const y = event.clientY > 0 ? event.clientY : bounds.top;
    tooltip.selectAll('*').remove();
    tooltip.append('strong').text(`${d.brand} ${d.model}`);
    tooltip.append('span').text(`${d.screenSize} inches · ${d.screenTech}`);
    tooltip.append('span').text(`${d.star} stars · ${d.energyConsumption} kWh/year`);
    tooltip.style('left', `${Math.max(8, Math.min(window.innerWidth - 220, x + 14))}px`)
      .style('top', `${Math.max(8, Math.min(window.innerHeight - 110, y + 14))}px`).classed('visible', true);
  }
  d3.select('#scatterplot').selectAll('circle.tv-point')
    .on('pointerenter pointermove', function(event, d) { if (!pinned) show(event, d); })
    .on('pointerleave', () => { if (!pinned) tooltip.classed('visible', false); })
    .on('focus', show).on('blur', () => { if (!pinned) tooltip.classed('visible', false); })
    .on('click', function(event, d) { pinned = pinned === this ? null : this; pinned ? show(event, d) : tooltip.classed('visible', false); })
    .on('keydown', function(event, d) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pinned = pinned === this ? null : this; pinned ? show(event, d) : tooltip.classed('visible', false); }
    });
}
