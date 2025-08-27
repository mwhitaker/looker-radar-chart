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
    minify: 'terser', // Enable Terser minification
    sourcemap: false, // Disable sourcemap generation
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.* statements
        drop_debugger: true, // Remove debugger statements
      },
    }
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
                  "id": "fillColor",
                  "label": "Background Color for chart",
                  "type": "FILL_COLOR",
                  "defaultValue": "#ffffff"
                },
                {
                  "id": "fontColor", 
                  "label": "Text Color",
                  "type": "FONT_COLOR",
                  "defaultValue": "#000000"
                },
                {
                  "id": "colorScheme",
                  "label": "Color Scheme",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "category10",
                  "options": [
                    {
                      "label": "Accent",
                      "value": "accent"
                    },
                    {
                      "label": "Category 10",
                      "value": "category10"
                    },
                    {
                      "label": "Dark 2",
                      "value": "dark2"
                    },
                    {
                      "label": "Paired",
                      "value": "paired"
                    },
                    {
                      "label": "Pastel 1",
                      "value": "pastel1"
                    },
                    {
                      "label": "Pastel 2",
                      "value": "pastel2"
                    },
                    {
                      "label": "Set 1",
                      "value": "set1"
                    },
                    {
                      "label": "Set 2",
                      "value": "set2"
                    },
                    {
                      "label": "Set 3",
                      "value": "set3"
                    },
                    {
                      "label": "Tableau 10",
                      "value": "tableau10"
                    }
                  ]
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
                  "id": "tickStep",
                  "label": "tick step",
                  "type": "TEXTINPUT",
                  "defaultValue": "0.1"
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
                  "label": "max value for ticks, e.g. 0.6",
                  "type": "TEXTINPUT",
                  "defaultValue": "1.0"
                 
                },
                
                {
                  "id": "ringStrokeWidth",
                  "label": "Ring Stroke Width",
                  "type": "TEXTINPUT",
                  "defaultValue": "0.5"
                },
                {
                  "id": "axisStrokeWidth", 
                  "label": "Axis Line Width",
                  "type": "TEXTINPUT",
                  "defaultValue": "1.5"
                },
                {
                  "id": "textStrokeWidth",
                  "label": "Text Stroke Width",
                  "type": "TEXTINPUT", 
                  "defaultValue": "2"
                },
                {
                  "id": "axisLabelStrokeWidth",
                  "label": "Axis Label Stroke Width",
                  "type": "TEXTINPUT",
                  "defaultValue": "3"
                },
                {
                  "id": "pointRadius",
                  "label": "Point Radius",
                  "type": "TEXTINPUT",
                  "defaultValue": "3"
                },
                {
                  "id": "hoverMaxRadius",
                  "label": "Hover Label Max Radius",
                  "type": "TEXTINPUT", 
                  "defaultValue": "15"
                },
                {
                  "id": "ringFillOpacity",
                  "label": "Ring Fill Opacity",
                  "type": "TEXTINPUT",
                  "defaultValue": "0.3"
                },
                {
                  "id": "areaFillOpacity",
                  "label": "Area Fill Opacity",
                  "type": "TEXTINPUT",
                  "defaultValue": "0.2"
                },
                {
                  "id": "axisStrokeOpacity",
                  "label": "Axis Stroke Opacity", 
                  "type": "TEXTINPUT",
                  "defaultValue": "0.5"
                },
                {
                  "id": "marginTop",
                  "label": "Chart Top Margin",
                  "type": "TEXTINPUT",
                  "defaultValue": "15"
                },
                {
                  "id": "marginRight",
                  "label": "Chart Right Margin", 
                  "type": "TEXTINPUT",
                  "defaultValue": "50"
                },
                {
                  "id": "marginBottom",
                  "label": "Chart Bottom Margin",
                  "type": "TEXTINPUT",
                  "defaultValue": "60"
                },
                {
                  "id": "marginLeft",
                  "label": "Chart Left Margin",
                  "type": "TEXTINPUT",
                  "defaultValue": "60"
                }
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