// src/radar.js
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import { svg } from 'htl'

function determineTickStep(maxValue) {
  if (maxValue <= 10) return 1;
  if (maxValue <= 25) return 5;
  if (maxValue <= 50) return 10;
  if (maxValue <= 100) return 20;
  if (maxValue <= 250) return 50;
  if (maxValue <= 500) return 100;
  // For larger values, aim for ~5-10 ticks
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  if (maxValue / magnitude >= 5) return magnitude;
  if (maxValue / magnitude >= 2) return magnitude / 2;
  return magnitude / 5;
}

export function createRadarChart(dataset, options = {}) { // dataset here is the LONG format
  const { width = 450, height = 450, lineType = "cardinal-closed", fontSize = "10", fontWeight = "normal", usePercentage = false } = options;

  // If dataset is empty, return an empty chart
  if (!dataset || dataset.length === 0) {
    console.warn("Empty dataset provided to createRadarChart");
    return document.createElement('div');
  }

  console.log("Dataset received by radar chart:", dataset);

  // Determine the grouping key dynamically (e.g., 'name', or whatever pivotData used)
  const groupingKey = Object.keys(dataset[0]).find(k => k !== 'key' && k !== 'value') || 'name';
  console.log("Using grouping key:", groupingKey);

  // Build the scale domain from the 'key' column of the long dataset
  const longitudeDomain = Array.from(new Set(Plot.valueof(dataset, "key")));
  console.log("Longitude domain (axis labels):", longitudeDomain);
  const longitude = d3.scalePoint(longitudeDomain, [180, -180]).padding(0.5).align(1);

  // Find the maximum value in the dataset to potentially adjust the radial scale
  const maxValue = d3.max(dataset, d => d.value);
  console.log("Maximum value in dataset:", maxValue);

  let scaleMax, finalTickStep, radiusAdjust;

  // Decide scale based on usePercentage OR if max value looks fractional
  if (usePercentage || maxValue <= 1.2) { // Treat as 0-1 scale for percentage display or if data looks fractional
    finalTickStep = parseFloat(options.tickStep) || 0.1;
    scaleMax = parseFloat(options.maxTickValue) || 1.0; // Target 1.0 (representing 100%)
    radiusAdjust = scaleMax; // Projection radius matches 0-1 scale
    console.log(`[RadarChart] Using PERCENTAGE/FRACTIONAL scale (0-1). TickStep=${finalTickStep}, ScaleMax=${scaleMax}, RadiusAdjust=${radiusAdjust}`);
  } else { // Treat as raw value scale (likely integers)
    const calculatedTickStep = determineTickStep(maxValue, usePercentage); // Pass usePercentage for context
    console.log(`calculatedTickStep ${calculatedTickStep}`)
    finalTickStep = parseFloat(options.tickStep) || calculatedTickStep;
    console.log(`finalTickStep ${finalTickStep}`)
    console.log(`options.tickStep ${options.tickStep}`)
    console.log(`options.maxTickValue Boolean ${Boolean(options.maxTickValue)}`)
    scaleMax = parseFloat(options.maxTickValue) || Math.max(finalTickStep, Math.ceil(maxValue / finalTickStep) * finalTickStep);
    radiusAdjust = scaleMax; // Projection radius matches raw scale max
    console.log(`[RadarChart] Using RAW VALUE scale (0-${scaleMax}). TickStep=${finalTickStep}, ScaleMax=${scaleMax}, RadiusAdjust=${radiusAdjust}`);
  }

  // const calculatedTickStep = determineTickStep(maxValue);
  // const finalTickStep = options.tickStep || calculatedTickStep; // Allow override via options
  // console.log(`[RadarChart] Using Tick Step: ${finalTickStep} (Calculated: ${calculatedTickStep}, Option: ${options.tickStep})`);

  // // Calculate scale max: round maxValue UP to the nearest multiple of finalTickStep
  // // Ensure scaleMax is at least one tick step if maxValue is very small or zero
  // const scaleMax = Math.max(finalTickStep, Math.ceil(maxValue / finalTickStep) * finalTickStep);
  // console.log("[RadarChart] Calculated Scale Maximum (scaleMax):", scaleMax);

  // // Generate dynamic tick values (e.g., [0.1, 0.2, ..., scaleMax])
  // // Add a small epsilon to the end value for d3.range to include scaleMax if it's a multiple of the step
  // // const tickStep = 0.1;
  // const tickValues = d3.range(0, scaleMax + finalTickStep * 0.1, finalTickStep)
  //                     .map(d => parseFloat(d.toFixed(1))); // Use toFixed for potential float issues, even with integers
  //   console.log("[RadarChart] Dynamic Tick Values:", tickValues);

  // // Generate ring values (drawn from largest to smallest radius)
  // const ringValues = tickValues.filter(d => d > 0).reverse(); // Exclude 0 ring, reverse for drawing order
  //   console.log("[RadarChart] Dynamic Ring Values (for Plot.geo):", ringValues);
  // // const radiusAdjust = 0.625; // Keep as is or adjust based on maxValue if needed
  // // const radiusAdjust = Math.min(Math.max(0.4, maxValue * 1.2), 0.8);
  // const radiusAdjust = scaleMax;
  // console.log("Dynamic radiusAdjust (for projection):", radiusAdjust);

  // // Small padding for placing axis lines/labels just outside the max ring
  // const axisLabelPadding = 0.05; // Adjust as needed for visual separation
  // const axisLabelRadiusPosition = radiusAdjust + axisLabelPadding;

  const tickValues = d3.range(0, scaleMax + finalTickStep * 0.01, finalTickStep)
    .map(d => parseFloat(d.toFixed(5))); // Ensure clean numbers
  console.log("[RadarChart] Dynamic Tick Values:", tickValues);

  const ringValues = tickValues.filter(d => d > 0).reverse(); // Exclude 0 ring

  const axisLabelPadding = finalTickStep * 0.5; // Padding relative to tick step
  const axisLabelRadiusPosition = radiusAdjust + axisLabelPadding;
  const labelLatitude = Math.max(-89.99, Math.min(89.99, 90 - axisLabelRadiusPosition));
  console.log("[RadarChart] Axis Label Latitude:", labelLatitude);

  return Plot.plot({
    // Use dynamic width/height
    width: width,
    height: height,
    // Add fixed margins (important for label visibility)
    marginTop: 15,    // Reduced top margin (adjust as needed for legend height)
    marginRight: 50,  // Keep or adjust side/bottom margins for labels
    marginBottom: 60,
    marginLeft: 60,
    // Adjust projection domain radius slightly if needed, or keep fixed
    projection: {
      type: "azimuthal-equidistant",
      rotate: [0, -90],
      domain: d3.geoCircle().center([0, 90]).radius(radiusAdjust)()
    },
    color: { legend: true, domain: Array.from(new Set(Plot.valueof(dataset, groupingKey))) }, // Use dynamic grouping key for color domain
    marks: [
      // grey discs (using fixed values 0.1 to 0.5)
      Plot.geo(ringValues, {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: "#ccc",
        fill: "#eee",
        fillOpacity: 0.3,
        strokeWidth: 0.5
      }),

      // white axes lines
      Plot.link(longitude.domain(), {
        x1: longitude,
        y1: (key) => 90 - (radiusAdjust - 0.05),
        x2: 0,
        y2: 90,
        stroke: "white",
        strokeOpacity: 0.5,
        strokeWidth: 1.5
      }),

      // tick labels (adjust position based on radiusAdjust)
      Plot.text(tickValues.filter(d => d <= (radiusAdjust - 0.1)), {
        x: 180,
        y: (d) => 90 - d,
        dx: 4,
        textAnchor: "start",
        text: (d) => usePercentage ? `${Math.round(d * 100)}%` : d.toFixed(0),
        fill: "#666",
        stroke: "white",
        strokeWidth: 2,
        fontSize: Number(fontSize) - 1, // Slightly smaller than main labels
        fontWeight: fontWeight
      }),

      // axes labels - CRITICAL PART FOR LABEL VISIBILITY
      Plot.text(longitude.domain(), {
        x: longitude,
        y: 90 - (radiusAdjust - 0.02), // Adjust based on radiusAdjust
        text: Plot.identity,
        fill: "var(--theme-foreground, black)", // Use CSS vars
        stroke: "var(--theme-background, white)",
        strokeWidth: 3, // Ensure readability
        lineWidth: 10, // Plot option for text wrapping, might not be needed here
        fontSize: Number(fontSize), // Use the configurable font size
        fontWeight: fontWeight // Use the configurable font weight
      }),

      // areas (use dynamic groupingKey)
      Plot.area(dataset, {
        x1: ({ key }) => longitude(key),
        y1: ({ value }) => 90 - value,
        x2: 0,
        y2: 90,
        fill: groupingKey,
        stroke: groupingKey,
        fillOpacity: 0.2,
        curve: lineType,
        sort: {
          x: "key",
          reduce: null
        },
        z: groupingKey
      }),

      // points (use dynamic groupingKey)
      Plot.dot(dataset, {
        x: ({ key }) => longitude(key),
        y: ({ value }) => 90 - value,
        fill: groupingKey,
        stroke: "white",
        r: 3
      }),

      // interactive labels
      Plot.text(
        dataset,
        Plot.pointer({
          x: ({ key }) => longitude(key),
          y: ({ value }) => 90 - value,
          text: (d) => usePercentage ? `${Math.round(d.value * 100)}%` : d.value.toFixed(0),
          textAnchor: "start",
          dx: 6,
          dy: -4,
          fill: "black",
          stroke: "white",
          strokeWidth: 2,
          maxRadius: 15,
          fontSize: Number(fontSize) + 1, // Slightly bigger than main labels for better visibility
          fontWeight: fontWeight === "normal" ? "bold" : fontWeight // Make hover labels bold if normal weight is selected
        })
      ),

      // interactive opacity on the areas
      () =>
        svg`<style>
            g[aria-label=area] path {fill-opacity: 0.2; transition: fill-opacity .2s;}
            g[aria-label=area]:hover path:not(:hover) {fill-opacity: 0.1; transition: fill-opacity .2s;}
            g[aria-label=area] path:hover {fill-opacity: 0.5; transition: fill-opacity .2s;}
        `
    ]
  })
}