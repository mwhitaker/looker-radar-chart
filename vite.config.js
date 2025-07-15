import { defineConfig } from 'vite';
import { resolve } from 'path';
import path from 'path';

import { writeFileSync } from 'fs';

export default defineConfig({
  resolve: {
    alias: {
      '@observablehq/runtime': path.resolve(__dirname, 'node_modules/@observablehq/runtime'),
      '@observablehq/inputs': path.resolve(__dirname, 'node_modules/@observablehq/inputs'),
      'd3': path.resolve(__dirname, 'node_modules/d3')
    }
  },
  optimizeDeps: {
    include: ['@observablehq/runtime', '@observablehq/inputs', 'd3']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VizLib',
      fileName: 'index',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'index.css';
          return assetInfo.name;
        },
      }
    },
    minify: false, // Enable minification
    sourcemap: false, // Disable sourcemap generation
  },
  plugins: [
    {
      name: 'generate-index-json',
      closeBundle() {
        const indexJson = {
          "data": [
            {
              "id": "dimensions",
              "label": "Radar Chart Options",
              "elements": [
               
                {
                  "id": "dim",
                  "label": "Dimension",
                  "type": "DIMENSION",
                  "options": {
                    "min": 1,
                    "max": 1
                  }
                },
                {
                  "id": "metric",
                  "label": "Values",
                  "type": "METRIC",
                  "options": {
                    "min": 1
                  }
                }
              ]
            }
          ],
          "style": [
            {
              "id": "styleOptions",
              "label": "Radar Chart Options",
              "elements": [
                {
                  "id": "title",
                  "label": "Chart Title",
                  "type": "TEXTINPUT",
                  "defaultValue": "Radar Chart Visualization"
                },
                {
                  "id": "lineType",
                  "label": "Line Type",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "cardinal-closed",
                  "options": [
                    {
                      "label": "cardinal-closed",
                      "value": "cardinal-closed"
                    },
                    {
                      "label": "linear-closed",
                      "value": "linear-closed"
                    },
                    {
                      "label": "basis-closed",
                      "value": "basis-closed"
                    }
                    
                  ]
                },
                {
                  "id": "fontSize",
                  "label": "Label Font Size",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "10",
                  "options": [
                    {
                      "label": "Small (8px)",
                      "value": "8"
                    },
                    {
                      "label": "Medium (10px)",
                      "value": "10"
                    },
                    {
                      "label": "Large (12px)",
                      "value": "12"
                    },
                    {
                      "label": "Extra Large (14px)",
                      "value": "14"
                    }
                  ]
                },
                {
                  "id": "fontWeight",
                  "label": "Label Font Weight",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "normal",
                  "options": [
                    {
                      "label": "Normal",
                      "value": "normal"
                    },
                    {
                      "label": "Bold",
                      "value": "bold"
                    },
                    {
                      "label": "Light (300)",
                      "value": "300"
                    },
                    {
                      "label": "Lighter",
                      "value": "lighter"
                    },
                    {
                      "label": "Bolder",
                      "value": "bolder"
                    }
                  ]
                },
                {
                  "id": "scaleType",
                  "label": "Scale Type",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "auto",
                  "options": [
                    {
                      "label": "Auto-detect",
                      "value": "auto"
                    },
                    {
                      "label": "0-1 (Percentage)",
                      "value": "percentage"
                    },
                    {
                      "label": "1-5 (Rating)",
                      "value": "rating"
                    },
                    {
                      "label": "Custom",
                      "value": "custom"
                    }
                  ]
                },
                {
                  "id": "tickStep",
                  "label": "Tick Step",
                  "type": "TEXTINPUT",
                  "defaultValue": "auto"
                },
                { // Add this new element
                  "id": "usePercentage",
                  "label": "Display Values as Percentages?",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "false", // Default to showing raw numbers
                  "options": [
                    {
                      "label": "Yes (Append %)", // Label for the user
                      "value": "true"          // String value passed in style object
                    },
                    {
                      "label": "No (Show Raw Values)", // Label for the user
                      "value": "false"         // String value passed in style object
                    }
                  ]
                },
                { // Add this new element
                  "id": "maxTickValue",
                  "label": "Max Scale Value",
                  "type": "TEXTINPUT",
                  "defaultValue": "auto"
                 
                },
              ]
            }
          ]
        };
        writeFileSync('dist/index.json', JSON.stringify(indexJson, null, 2));
      }
    }
  ],
  define: {
    'process.env.DEVMODE_BOOL': JSON.stringify(process.env.DEVMODE_BOOL),
  },
});