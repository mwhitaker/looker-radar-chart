import { resize } from './resize';
import { html } from 'htl'
import * as d3 from 'd3';
import { createRadarChart } from './radar';


import {
  subscribeToData,
  getHeight,
  getWidth,
  objectTransform
} from '@google/dscc'


const LOCAL = import.meta.env.DEV;

// Make LOCAL flag available globally
if (typeof window !== 'undefined') {
  window.LOCAL = LOCAL;
}

const parseDate = d3.utcParse("%Y%m%d");

let chartStyle;

function transformLookerInput(input) {
  const { tables, fields, style } = input;
  chartStyle = style
  const data = tables.DEFAULT;

  // Create a mapping of field indices to their names
  const fieldMapping = {};
  for (const [key, fieldArray] of Object.entries(fields)) {
    fieldMapping[key] = fieldArray.map(field => field.name);
  }
  console.log("Field mapping:", fieldMapping);

  return data.map(item => {
    const result = {};

    // For Looker Studio format, we first handle the dimensions (usually contains the item name)
    if (item.dim && Array.isArray(item.dim)) {
      // In Looker Studio, the first dimension is typically the item name
      result.name = item.dim[0];
    }

    // Now handle metrics (the actual values)
    if (item.metric && Array.isArray(item.metric)) {
      // Map each metric value to its corresponding field name from the mapping
      item.metric.forEach((value, index) => {
        const fieldName = fieldMapping.metric?.[index];
        if (fieldName) {
          // Convert to number and ensure it's a valid value
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          
          // Store the dimension directly with its name as the key
          result[fieldName] = numValue;
          
          // Also store with index for backward compatibility if needed
          result[`dimension${index}`] = numValue;
          result[`dimensionName${index}`] = fieldName;
        }
      });
      
      return result;
    }

    // For local development or other formats, use the original approach
    for (const [key, values] of Object.entries(item)) {
      if (Array.isArray(values)) {
        values.forEach((value, index) => {
          const fieldName = fieldMapping[key]?.[index];
          if (fieldName) {
            if (fieldName.toLowerCase() === 'date') {
              result["date"] = LOCAL ? value : parseDate(value);
            } else if (key === 'name') {
              // Handle the name field for the phone data
              result["name"] = value;
            } else {
              // Convert to number and ensure it's a valid value
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              
              // Store the dimension directly with its name as the key
              result[fieldName] = numValue;
              
              // Also store with index for backward compatibility if needed
              result[`dimension${index}`] = numValue;
              result[`dimensionName${index}`] = fieldName;
            }
          }
        });
      }
    }
    return result;
  });
}

// Helper function to format percent values (not used in radar chart but kept for future use)
function formatPercent(value, format) {
  return value == null
    ? "N/A"
    : (value / 100).toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "percent",
      ...format
    });
}

function pivotData(wideData) {
  if (!Array.isArray(wideData) || wideData.length === 0) {
    return [];
  }

  const longData = [];
  
  // Detect grouping key - assume it's 'name' if present, otherwise use a default
  const groupingKey = wideData[0].name !== undefined ? 'name' : null;
  
  // Find axis keys (assuming all other keys besides the groupingKey are axes)
  const axisKeys = Object.keys(wideData[0]).filter(key =>
      key !== groupingKey &&
      // Filter out keys added by transformLookerInput
      !key.startsWith('dimensionName') &&
      !key.startsWith('dimension') &&
      key !== 'date' // Exclude date if present
  );

  console.log("Detected Grouping Key:", groupingKey);
  console.log("Detected Axis Keys:", axisKeys);

  // If no axis keys were found but there are dimensionName keys,
  // we'll use the dimensionName values as axis keys
  let useDimensionNameValues = axisKeys.length === 0;
  
  if (useDimensionNameValues) {
    // Count how many dimension keys we have
    const dimensionCount = Object.keys(wideData[0])
      .filter(key => key.startsWith('dimension') && !key.startsWith('dimensionName'))
      .length;
      
    // For each item in the wide data
    wideData.forEach(row => {
      const groupValue = groupingKey ? row[groupingKey] : 'default_group';
      
      // Loop through all dimensions
      for (let i = 0; i < dimensionCount; i++) {
        const dimensionKey = `dimension${i}`;
        const dimensionNameKey = `dimensionName${i}`;
        
        if (row[dimensionKey] !== undefined && row[dimensionNameKey] !== undefined) {
          // Get the axis name from the dimensionName
          const axisKey = row[dimensionNameKey];
          
          // Ensure value is numeric
          const numericValue = typeof row[dimensionKey] === 'number' ? 
            row[dimensionKey] : parseFloat(row[dimensionKey]);
          const value = isNaN(numericValue) ? 0 : numericValue;
          
          longData.push({
            [groupingKey || 'name']: groupValue,
            key: axisKey,
            value: value
          });
        }
      }
    });
  } else {
    // Use regular axis keys
    wideData.forEach(row => {
      const groupValue = groupingKey ? row[groupingKey] : 'default_group';
      axisKeys.forEach(axisKey => {
        // Ensure value is numeric
        const numericValue = typeof row[axisKey] === 'number' ? 
          row[axisKey] : parseFloat(row[axisKey]);
        const value = isNaN(numericValue) ? 0 : numericValue;
        
        longData.push({
          [groupingKey || 'name']: groupValue,
          key: axisKey,
          value: value
        });
      });
    });
  }

  console.log("Pivoted (Long) Data:", longData);
  return longData;
}

function processDataset(transformedWideData) {
  console.log("Original (Wide) dataset received by processDataset:", transformedWideData);

  // --- Pass fields to pivotData ---
  const longDataset = pivotData(transformedWideData);
  // --- End Pivot Step ---

  if (longDataset.length === 0) {
      console.warn("No data to plot after pivoting.");
      // Optionally display a message to the user
      const messageContainer = document.createElement('div');
      messageContainer.textContent = "No data available to display the chart.";
      messageContainer.style.textAlign = 'center';
      messageContainer.style.padding = '20px';
      const existingControlsContainer = document.getElementById('mainsite-center');
      if (existingControlsContainer) {
          existingControlsContainer.innerHTML = ''; // Clear previous content
          existingControlsContainer.appendChild(messageContainer);
      } else {
          document.body.innerHTML = '';
          document.body.appendChild(messageContainer);
      }
      return; // Stop further processing
  }

  
  // Clean up any existing containers
  const existingControlsContainer = document.getElementById('mainsite-center');
  if (existingControlsContainer) {
    existingControlsContainer.remove();
  }

  // Create new container
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'mainsite-center';
  document.body.appendChild(controlsContainer);

  // Get chart title based on data
  const getChartTitle = () => {
    // Use the grouping key for title generation if available
    const groupKey = Object.keys(longDataset[0]).find(k => k !== 'key' && k !== 'value');
    if (LOCAL && groupKey === 'name') {
       return "Phone Comparison Radar Chart";
    }
    return chartStyle?.title?.value || "";
 };

  // Create main container with styling
  const main = html`
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    
    .radar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      height: 100%;
      min-height: 500px;
      padding: 0.2rem 1rem 1rem 1rem;
    }
    
    .radar-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    
    .radar-chart {
      width: 100%;
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    /* Critical for label visibility */
    .radar-chart svg {
      overflow: visible !important;
    }
    
    @media (min-width: 768px) {
      .radar-container {
        min-height: 600px;
      }
    }
  </style>
  <main id="mainsite-main" class="mainsite">
    <div class="radar-container">
      <div id="radar-chart" class="radar-chart"></div>
    </div>
  </main>
  `;
  
  controlsContainer.appendChild(main);
  
  // Get the chart container
  const radarChartContainer = document.getElementById('radar-chart');
  
  // Create the radar chart with responsive size options
  const width = LOCAL ? 800 : getWidth();
  const height = LOCAL ? 800 : getHeight();

  const usePercentageBoolean = chartStyle?.usePercentage?.value === "true";
  console.log(`[Index] Parsing usePercentage: Style value="${chartStyle?.usePercentage?.value}", Parsed Boolean=${usePercentageBoolean}`);
  
  // Pass simplified chart options
  const chartOptions = {
    width: Math.min(width, height),
    height: Math.min(width, height),
    lineType: chartStyle?.lineType?.value,
    fontSize: chartStyle?.fontSize?.value || "10",
    fontWeight: chartStyle?.fontWeight?.value || "normal",
    scaleType: chartStyle?.scaleType?.value || "auto",
    tickStep: chartStyle?.tickStep?.value,
    usePercentage: usePercentageBoolean,
    maxTickValue: chartStyle?.maxTickValue?.value,
  };
  
  // Create the chart and initialize it with our container
  const chart = createRadarChart(longDataset, chartOptions);
  radarChartContainer.appendChild(chart)
  // chart.initialize(radarChartContainer);
  
  // Log for debugging
  console.log("Radar chart initialized");
}

function transformPhonesToLookerFormat(csvData) {
  console.log("Original CSV data:", csvData);
  
  // Extract all column names except 'name'
  const dimensionColumns = Object.keys(csvData[0]).filter(key => key !== 'name');
  console.log("Dimension columns:", dimensionColumns);
  
  // Create the fields mapping structure from Looker Studio
  const fields = {
    dim: dimensionColumns.map((colName, idx) => ({
      id: `dim${idx}`,
      name: colName,
      type: "NUMBER",
      concept: "DIMENSION"
    })),
    name: [{
      id: "name",
      name: "Phone Name",
      type: "TEXT",
      concept: "DIMENSION"
    }],
    value: []
  };

  // Transform CSV rows to Looker Studio format
  const tables = {
    DEFAULT: csvData.map(row => ({
      name: [row.name || "Unknown"],
      dim: dimensionColumns.map(col => {
        const value = parseFloat(row[col]);
        // Make sure we have valid numbers
        return isNaN(value) ? 0 : value;
      })
    }))
  };

  const style = {
    lineType: {
      value: "cardinal-closed",
      defaultValue: "cardinal-closed"
    },
    title: {
      value: "Phone Comparison Radar Chart",
      defaultValue: "Radar Chart Visualization"
    },
    fontSize: {
      value: "10",
      defaultValue: "10"
    },
    fontWeight: {
      value: "normal",
      defaultValue: "normal"
    },
    scaleType: {
      value: "auto",
      defaultValue: "auto"
    },
    tickStep: {
      value: "auto",
      defaultValue: "auto"
    },
    usePercentage: {
      value: "false",
      defaultValue: "false"
    },
    maxTickValue: {
      value: "auto",
      defaultValue: "auto"
    }
  }
  
  console.log("Transformed Looker format:", { tables, fields, style });
  return { tables, fields, style };
}

function renderVisualization(inputData) {
  if (LOCAL) {
    // Use the sample data paths from config or defaults
    const csvPaths = [
      './data/ratings.csv',          // 1-5 scale test data
      './data/phones.csv',           // Relative to current directory
      '../data/phones.csv',          // One level up
      '/data/phones.csv',            // From root
    ];
    
    // Function to try loading from different paths
    const tryLoadFromPath = (pathIndex) => {
      if (pathIndex >= csvPaths.length) {
        console.error("Could not load CSV data from any of the specified paths");
        
        // Create user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.style.padding = '20px';
        errorContainer.style.color = 'red';
        errorContainer.style.textAlign = 'center';
        errorContainer.innerHTML = `
          <h3>Data Not Found</h3>
          <p>The sample data file could not be found. Please make sure the CSV file exists in the data directory.</p>
          <p>Expected paths: ${csvPaths.join(', ')}</p>
        `;
        document.body.innerHTML = '';
        document.body.appendChild(errorContainer);
        return;
      }
      
      const path = csvPaths[pathIndex];
      console.log(`Trying to load CSV from: ${path}`);
      
      d3.csv(path, d3.autoType)
        .then(csvData => {
          console.log("Data loaded from:", path, csvData);
          
          // Validate if this is actually CSV data, not HTML or other content
          // Check if the first row has a 'name' property or if there's a '<!doctype html>' property
          const isValidCsv = csvData && 
                            csvData.length > 0 && 
                            (csvData[0].name !== undefined || 
                             Object.keys(csvData[0]).some(key => !key.includes('<!doctype')));
          
          if (!isValidCsv) {
            console.error("Invalid CSV data format received from:", path);
            throw new Error("Invalid CSV format");
          }
          
          console.log("Valid CSV data loaded from:", path);
          const lookerFormatData = transformPhonesToLookerFormat(csvData);
          console.log("Transformed to Looker format:", lookerFormatData);
          const dataset = transformLookerInput(lookerFormatData);
          console.log("Final dataset:", dataset);
          processDataset(dataset);
        })
        .catch(error => {
          console.error(`Error loading CSV from ${path}:`, error);
          tryLoadFromPath(pathIndex + 1);
        });
    };
    
    // Start trying paths
    tryLoadFromPath(0);
  } else {
    // Production mode (Looker Studio)
    console.log("Looker Studio data received:", JSON.stringify(inputData, null, 2));
    
    try {
      // Log input structure for debugging
      console.log("Input fields structure:", inputData.fields);
      console.log("Input tables structure:", inputData.tables);
      
      // Transform input data
      const dataset = transformLookerInput(inputData);
      console.log("Transformed dataset:", dataset);
      
      // Process the dataset
      processDataset(dataset);
    } catch (error) {
      console.error("Error processing Looker Studio data:", error);
      
      // Display error message
      const errorContainer = document.createElement('div');
      errorContainer.style.padding = '20px';
      errorContainer.style.color = 'red';
      errorContainer.style.textAlign = 'center';
      errorContainer.innerHTML = `
        <h3>Error Processing Data</h3>
        <p>${error.message}</p>
        <p>Check browser console for details</p>
      `;
      document.body.innerHTML = '';
      document.body.appendChild(errorContainer);
    }
  }
}

// Call renderVisualization
if (LOCAL) {
  renderVisualization({});
} else {
  subscribeToData(renderVisualization, { transform: objectTransform });
}
