import * as Stream from 'stream';
import * as request from 'request';
import { splitEvery } from '../util/splitEvery';

// const d = {
//   "data": [ {
//     "fill": "none",
//     "line": {
//       "width": 1,
//       "color": "#EF553B",
//       "dash": "solid",
//       "shape": "linear",
//       "simplify": true
//     },
//     "meta": {
//       "columnNames": {
//         "x": "Center Frequency",
//         "y": "10 mm Smooth acoustic plaster system, modified D-Mount"
//       }
//     },
//     "mode": "markers+lines",
//     "name": "10mm StarSilent D-Mount",
//     "type": "scatter",
//     "marker": {
//       "size": 3,
//       "symbol": "circle",
//       "opacity": 1,
//       "color": "#EF553B",
//       "line": {
//         "color": "#444",
//         "width": 0
//       },
//       "gradient": {
//         "type": "none"
//       },
//       "maxdisplayed": 0
//     },
//     "visible": true,
//     "fillcolor": "rgba(239, 85, 59, 0.05)",
//     "stackgroup": "",
//     "x": ["100", "125", "160", "200", "250", "315", "400", "500", "630", "800", "1000", "1250", "1600", "2000", "2500", "3150", "4000", "5000"],
//     "y": ["0.38", "0.53", "0.52", "0.63", "0.75", "0.9", "0.94", "0.93", "0.92", "0.89", "0.78", "0.74", "0.66", "0.57", "0.5", "0.43", "0.41", "0.32"],
//     "xaxis": "x",
//     "yaxis": "y",
//     "showlegend": true,
//     "legendgroup": "",
//     "xcalendar": "gregorian",
//     "ycalendar": "gregorian",
//     "text": "",
//     "hovertext": "",
//     "connectgaps": false,
//     "cliponaxis": true,
//     "hoveron": "points",
//     "hovertemplate": "",
//     "error_y": {
//       "visible": false
//     },
//     "error_x": {
//       "visible": false
//     },
//     "selected": {
//       "marker": {
//         "opacity": 1
//       }
//     },
//     "unselected": {
//       "marker": {
//         "opacity": 0.2
//       }
//     },
//     "opacity": 1,
//     "hoverinfo": "all",
//     "hoverlabel": {
//       "namelength": 15,
//       "font": {
//         "family": "Arial, sans-serif",
//         "size": 13
//       },
//       "align": "auto"
//     }
//   }, {
//     "fill": "none",
//     "line": {
//       "width": 1,
//       "color": "#00cc96",
//       "dash": "solid",
//       "shape": "linear",
//       "simplify": true
//     },
//     "meta": {
//       "columnNames": {
//         "x": "Center Frequency",
//         "y": "25 mm StarSilent acoustic plaster system, A mount"
//       }
//     },
//     "mode": "markers+lines",
//     "name": "25mm StarSilent A-Mount",
//     "type": "scatter",
//     "marker": {
//       "size": 3,
//       "symbol": "circle",
//       "opacity": 1,
//       "color": "#00cc96",
//       "line": {
//         "color": "#444",
//         "width": 0
//       },
//       "gradient": {
//         "type": "none"
//       },
//       "maxdisplayed": 0
//     },
//     "visible": true,
//     "fillcolor": "rgba(0, 204, 150, 0.05)",
//     "stackgroup": "",
//     "x": ["100", "125", "160", "200", "250", "315", "400", "500", "630", "800", "1000", "1250", "1600", "2000", "2500", "3150", "4000", "5000"],
//     "y": ["0.04", "0.21", "0.24", "0.25", "0.48", "0.58", "0.67", "0.82", "0.88", "0.94", "0.9", "0.88", "0.73", "0.69", "0.64", "0.66", "0.69", "0.59"],
//     "xaxis": "x",
//     "yaxis": "y",
//     "showlegend": true,
//     "legendgroup": "",
//     "xcalendar": "gregorian",
//     "ycalendar": "gregorian",
//     "text": "",
//     "hovertext": "",
//     "connectgaps": false,
//     "cliponaxis": true,
//     "hoveron": "points",
//     "hovertemplate": "",
//     "error_y": {
//       "visible": false
//     },
//     "error_x": {
//       "visible": false
//     },
//     "selected": {
//       "marker": {
//         "opacity": 1
//       }
//     },
//     "unselected": {
//       "marker": {
//         "opacity": 0.2
//       }
//     },
//     "opacity": 1,
//     "hoverinfo": "all",
//     "hoverlabel": {
//       "namelength": 15,
//       "font": {
//         "family": "Arial, sans-serif",
//         "size": 13
//       },
//       "align": "auto"
//     }
//   }, {
//     "fill": "none",
//     "line": {
//       "width": 1,
//       "color": "#ab63fa",
//       "dash": "solid",
//       "shape": "linear",
//       "simplify": true
//     },
//     "meta": {
//       "columnNames": {
//         "x": "Center Frequency",
//         "y": "Baswaphon 40mm Classic A mount"
//       }
//     },
//     "mode": "markers+lines",
//     "name": "Baswaphon 40mm Classic A-Mount",
//     "type": "scatter",
//     "marker": {
//       "size": 3,
//       "opacity": 0.46,
//       "symbol": "circle",
//       "color": "#ab63fa",
//       "line": {
//         "color": "#444",
//         "width": 0
//       },
//       "gradient": {
//         "type": "none"
//       },
//       "maxdisplayed": 0
//     },
//     "visible": true,
//     "fillcolor": "rgba(171, 99, 250, 0.05)",
//     "stackgroup": "",
//     "x": ["100", "125", "160", "200", "250", "315", "400", "500", "630", "800", "1000", "1250", "1600", "2000", "2500", "3150", "4000", "5000"],
//     "y": ["0.13", "0.14", "0.22", "0.34", "0.45", "0.74", "0.96", "1.01", "1.06", "1.05", "1.02", "1", "0.95", "0.91", "0.93", "0.87", "0.85", "0.83"],
//     "xaxis": "x",
//     "yaxis": "y",
//     "showlegend": true,
//     "legendgroup": "",
//     "xcalendar": "gregorian",
//     "ycalendar": "gregorian",
//     "text": "",
//     "hovertext": "",
//     "connectgaps": false,
//     "cliponaxis": true,
//     "hoveron": "points",
//     "hovertemplate": "",
//     "error_y": {
//       "visible": false
//     },
//     "error_x": {
//       "visible": false
//     },
//     "selected": {
//       "marker": {
//         "opacity": 0.46
//       }
//     },
//     "unselected": {
//       "marker": {
//         "opacity": 0.09200000000000001
//       }
//     },
//     "opacity": 1,
//     "hoverinfo": "all",
//     "hoverlabel": {
//       "namelength": 15,
//       "font": {
//         "family": "Arial, sans-serif",
//         "size": 13
//       },
//       "align": "auto"
//     }
//   }],
//   "layout": {
//     "title": {
//       "text": "Material Comparison",
//       "font": {
//         "family": "\"Open Sans\", verdana, arial, sans-serif",
//         "size": 17,
//         "color": "#2a3f5f"
//       },
//       "xref": "container",
//       "yref": "container",
//       "x": 0.05,
//       "y": "auto",
//       "xanchor": "auto",
//       "yanchor": "auto",
//       "pad": {
//         "t": 0,
//         "r": 0,
//         "b": 0,
//         "l": 0
//       }
//     },
//     "xaxis": {
//       "type": "category",
//       "dtick": 1,
//       "range": [-0.9347003697016596, 18.05162926661508],
//       "tick0": 0,
//       "ticks": "",
//       "title": {
//         "text": "Frequency (Hz)",
//         "font": {
//           "family": "\"Open Sans\", verdana, arial, sans-serif",
//           "size": 14,
//           "color": "#2a3f5f"
//         }
//       },
//       "mirror": "ticks",
//       "nticks": 34,
//       "showline": true,
//       "tickmode": "auto",
//       "autorange": false,
//       "linecolor": "rgb(130, 130, 130)",
//       "visible": true,
//       "categoryorder": "trace",
//       "color": "#444",
//       "tickprefix": "",
//       "ticksuffix": "",
//       "showticklabels": true,
//       "tickfont": {
//         "family": "\"Open Sans\", verdana, arial, sans-serif",
//         "size": 12,
//         "color": "#2a3f5f"
//       },
//       "tickangle": "auto",
//       "linewidth": 1,
//       "gridcolor": "#EBF0F8",
//       "gridwidth": 1,
//       "showgrid": true,
//       "zerolinecolor": "#EBF0F8",
//       "zerolinewidth": 2,
//       "zeroline": true,
//       "automargin": true,
//       "tickson": "labels",
//       "showspikes": false,
//       "anchor": "y",
//       "side": "bottom",
//       "domain": [0, 1],
//       "layer": "above traces",
//       "fixedrange": false,
//       "constrain": "range",
//       "constraintoward": "center"
//     },
//     "yaxis": {
//       "type": "linear",
//       "range": [-0.06210582256120837, 1.1378941774387916],
//       "title": {
//         "text": "Absorption Coefficient",
//         "font": {
//           "family": "\"Open Sans\", verdana, arial, sans-serif",
//           "size": 14,
//           "color": "#2a3f5f"
//         }
//       },
//       "mirror": "ticks",
//       "showline": true,
//       "autorange": false,
//       "linecolor": "rgb(130, 130, 130)",
//       "visible": true,
//       "hoverformat": "",
//       "color": "#444",
//       "tickprefix": "",
//       "ticksuffix": "",
//       "tickmode": "auto",
//       "nticks": 0,
//       "showticklabels": true,
//       "tickfont": {
//         "family": "\"Open Sans\", verdana, arial, sans-serif",
//         "size": 12,
//         "color": "#2a3f5f"
//       },
//       "tickangle": "auto",
//       "tickformat": "",
//       "showexponent": "all",
//       "exponentformat": "B",
//       "separatethousands": false,
//       "ticks": "",
//       "linewidth": 1,
//       "gridcolor": "#EBF0F8",
//       "gridwidth": 1,
//       "showgrid": true,
//       "zerolinecolor": "#EBF0F8",
//       "zerolinewidth": 2,
//       "zeroline": true,
//       "automargin": true,
//       "showspikes": false,
//       "anchor": "x",
//       "side": "left",
//       "domain": [0, 1],
//       "layer": "above traces",
//       "fixedrange": false,
//       "constrain": "range",
//       "constraintoward": "middle",
//       "tick0": 0,
//       "dtick": 0.2
//     },
//     "legend": {
//       "x": 0.18786759045419552,
//       "y": -0.11189825549503143,
//       "xanchor": "auto",
//       "traceorder": "normal",
//       "borderwidth": 1,
//       "orientation": "h",
//       "bgcolor": "white",
//       "bordercolor": "#444",
//       "font": {
//         "family": "\"Open Sans\", verdana, arial, sans-serif",
//         "size": 12,
//         "color": "#2a3f5f"
//       },
//       "itemsizing": "trace",
//       "itemclick": "toggle",
//       "itemdoubleclick": "toggleothers",
//       "yanchor": "top",
//       "valign": "middle"
//     },
//     "autosize": true,
//     "template": {
//       "data": {
//         "bar": [{
//           "type": "bar",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "table": [{
//           "type": "table",
//           "cells": {
//             "fill": {
//               "color": "#EBF0F8"
//             },
//             "line": {
//               "color": "white"
//             }
//           },
//           "header": {
//             "fill": {
//               "color": "#C8D4E3"
//             },
//             "line": {
//               "color": "white"
//             }
//           }
//         }],
//         "carpet": [{
//           "type": "carpet",
//           "aaxis": {
//             "gridcolor": "#C8D4E3",
//             "linecolor": "#C8D4E3",
//             "endlinecolor": "#2a3f5f",
//             "minorgridcolor": "#C8D4E3",
//             "startlinecolor": "#2a3f5f"
//           },
//           "baxis": {
//             "gridcolor": "#C8D4E3",
//             "linecolor": "#C8D4E3",
//             "endlinecolor": "#2a3f5f",
//             "minorgridcolor": "#C8D4E3",
//             "startlinecolor": "#2a3f5f"
//           }
//         }],
//         "mesh3d": [{
//           "type": "mesh3d",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           }
//         }],
//         "contour": [{
//           "type": "contour",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           },
//           "autocolorscale": true
//         }],
//         "heatmap": [{
//           "type": "heatmap",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           },
//           "autocolorscale": true
//         }],
//         "scatter": [{
//           "type": "scatter",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "surface": [{
//           "type": "surface",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           }
//         }],
//         "heatmapgl": [{
//           "type": "heatmapgl",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           }
//         }],
//         "histogram": [{
//           "type": "histogram",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "parcoords": [{
//           "line": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           },
//           "type": "parcoords"
//         }],
//         "scatter3d": [{
//           "type": "scatter3d",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "scattergl": [{
//           "type": "scattergl",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "choropleth": [{
//           "type": "choropleth",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           }
//         }],
//         "scattergeo": [{
//           "type": "scattergeo",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "histogram2d": [{
//           "type": "histogram2d",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           },
//           "autocolorscale": true
//         }],
//         "scatterpolar": [{
//           "type": "scatterpolar",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "contourcarpet": [{
//           "type": "contourcarpet",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           }
//         }],
//         "scattercarpet": [{
//           "type": "scattercarpet",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "scattermapbox": [{
//           "type": "scattermapbox",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "scatterpolargl": [{
//           "type": "scatterpolargl",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "scatterternary": [{
//           "type": "scatterternary",
//           "marker": {
//             "colorbar": {
//               "ticks": "",
//               "outlinewidth": 0
//             }
//           }
//         }],
//         "histogram2dcontour": [{
//           "type": "histogram2dcontour",
//           "colorbar": {
//             "ticks": "",
//             "outlinewidth": 0
//           },
//           "autocolorscale": true
//         }]
//       },
//       "layout": {
//         "geo": {
//           "bgcolor": "white",
//           "showland": true,
//           "lakecolor": "white",
//           "landcolor": "white",
//           "showlakes": true,
//           "subunitcolor": "#C8D4E3"
//         },
//         "font": {
//           "color": "#2a3f5f"
//         },
//         "polar": {
//           "bgcolor": "white",
//           "radialaxis": {
//             "ticks": "",
//             "gridcolor": "#EBF0F8",
//             "linecolor": "#EBF0F8"
//           },
//           "angularaxis": {
//             "ticks": "",
//             "gridcolor": "#EBF0F8",
//             "linecolor": "#EBF0F8"
//           }
//         },
//         "scene": {
//           "xaxis": {
//             "ticks": "",
//             "gridcolor": "#DFE8F3",
//             "gridwidth": 2,
//             "linecolor": "#EBF0F8",
//             "zerolinecolor": "#EBF0F8",
//             "showbackground": true,
//             "backgroundcolor": "white"
//           },
//           "yaxis": {
//             "ticks": "",
//             "gridcolor": "#DFE8F3",
//             "gridwidth": 2,
//             "linecolor": "#EBF0F8",
//             "zerolinecolor": "#EBF0F8",
//             "showbackground": true,
//             "backgroundcolor": "white"
//           },
//           "zaxis": {
//             "ticks": "",
//             "gridcolor": "#DFE8F3",
//             "gridwidth": 2,
//             "linecolor": "#EBF0F8",
//             "zerolinecolor": "#EBF0F8",
//             "showbackground": true,
//             "backgroundcolor": "white"
//           }
//         },
//         "title": {
//           "x": 0.05
//         },
//         "xaxis": {
//           "ticks": "",
//           "gridcolor": "#EBF0F8",
//           "linecolor": "#EBF0F8",
//           "automargin": true,
//           "zerolinecolor": "#EBF0F8",
//           "zerolinewidth": 2
//         },
//         "yaxis": {
//           "ticks": "",
//           "gridcolor": "#EBF0F8",
//           "linecolor": "#EBF0F8",
//           "automargin": true,
//           "zerolinecolor": "#EBF0F8",
//           "zerolinewidth": 2
//         },
//         "ternary": {
//           "aaxis": {
//             "ticks": "",
//             "gridcolor": "#DFE8F3",
//             "linecolor": "#A2B1C6"
//           },
//           "baxis": {
//             "ticks": "",
//             "gridcolor": "#DFE8F3",
//             "linecolor": "#A2B1C6"
//           },
//           "caxis": {
//             "ticks": "",
//             "gridcolor": "#DFE8F3",
//             "linecolor": "#A2B1C6"
//           },
//           "bgcolor": "white"
//         },
//         "colorway": ["#636efa", "#EF553B", "#00cc96", "#ab63fa", "#19d3f3", "#e763fa", "#fecb52", "#ffa15a", "#ff6692", "#b6e880"],
//         "hovermode": "closest",
//         "colorscale": {
//           "diverging": [
//             [0, "#8e0152"],
//             [0.1, "#c51b7d"],
//             [0.2, "#de77ae"],
//             [0.3, "#f1b6da"],
//             [0.4, "#fde0ef"],
//             [0.5, "#f7f7f7"],
//             [0.6, "#e6f5d0"],
//             [0.7, "#b8e186"],
//             [0.8, "#7fbc41"],
//             [0.9, "#4d9221"],
//             [1, "#276419"]
//           ],
//           "sequential": [
//             [0, "#0508b8"],
//             [0.0893854748603352, "#1910d8"],
//             [0.1787709497206704, "#3c19f0"],
//             [0.2681564245810056, "#6b1cfb"],
//             [0.3575418994413408, "#981cfd"],
//             [0.44692737430167595, "#bf1cfd"],
//             [0.5363128491620112, "#dd2bfd"],
//             [0.6256983240223464, "#f246fe"],
//             [0.7150837988826816, "#fc67fd"],
//             [0.8044692737430168, "#fe88fc"],
//             [0.8938547486033519, "#fea5fd"],
//             [0.9832402234636871, "#febefe"],
//             [1, "#fec3fe"]
//           ],
//           "sequentialminus": [
//             [0, "#0508b8"],
//             [0.0893854748603352, "#1910d8"],
//             [0.1787709497206704, "#3c19f0"],
//             [0.2681564245810056, "#6b1cfb"],
//             [0.3575418994413408, "#981cfd"],
//             [0.44692737430167595, "#bf1cfd"],
//             [0.5363128491620112, "#dd2bfd"],
//             [0.6256983240223464, "#f246fe"],
//             [0.7150837988826816, "#fc67fd"],
//             [0.8044692737430168, "#fe88fc"],
//             [0.8938547486033519, "#fea5fd"],
//             [0.9832402234636871, "#febefe"],
//             [1, "#fec3fe"]
//           ]
//         },
//         "plot_bgcolor": "white",
//         "paper_bgcolor": "white",
//         "shapedefaults": {
//           "line": {
//             "width": 0
//           },
//           "opacity": 0.4,
//           "fillcolor": "#506784"
//         },
//         "annotationdefaults": {
//           "arrowhead": 0,
//           "arrowcolor": "#506784",
//           "arrowwidth": 1
//         }
//       },
//       "themeRef": "PLOTLY_WHITE"
//     },
//     "dragmode": "pan",
//     "font": {
//       "family": "\"Open Sans\", verdana, arial, sans-serif",
//       "size": 12,
//       "color": "#2a3f5f"
//     },
//     "width": 1459,
//     "height": 765,
//     "margin": {
//       "l": 80,
//       "r": 80,
//       "t": 100,
//       "b": 80,
//       "pad": 0,
//       "autoexpand": true
//     },
//     "paper_bgcolor": "white",
//     "separators": ".,",
//     "hidesources": false,
//     "colorway": ["#636efa", "#EF553B", "#00cc96", "#ab63fa", "#19d3f3", "#e763fa", "#fecb52", "#ffa15a", "#ff6692", "#b6e880"],
//     "modebar": {
//       "orientation": "h",
//       "bgcolor": "rgba(255, 255, 255, 0.5)",
//       "color": "rgba(68, 68, 68, 0.3)",
//       "activecolor": "rgba(68, 68, 68, 0.7)"
//     },
//     "calendar": "gregorian",
//     "hoverlabel": {
//       "namelength": 15,
//       "font": {
//         "family": "Arial, sans-serif",
//         "size": 13
//       },
//       "align": "auto"
//     },
//     "plot_bgcolor": "white",
//     "clickmode": "event",
//     "hovermode": "closest",
//     "hoverdistance": 20,
//     "spikedistance": 20,
//     "showlegend": true,
//     "annotations": [],
//     "shapes": [],
//     "images": [],
//     "updatemenus": [],
//     "sliders": [],
//     "colorscale": {
//       "sequential": [
//         [0, "#0508b8"],
//         [0.0893854748603352, "#1910d8"],
//         [0.1787709497206704, "#3c19f0"],
//         [0.2681564245810056, "#6b1cfb"],
//         [0.3575418994413408, "#981cfd"],
//         [0.44692737430167595, "#bf1cfd"],
//         [0.5363128491620112, "#dd2bfd"],
//         [0.6256983240223464, "#f246fe"],
//         [0.7150837988826816, "#fc67fd"],
//         [0.8044692737430168, "#fe88fc"],
//         [0.8938547486033519, "#fea5fd"],
//         [0.9832402234636871, "#febefe"],
//         [1, "#fec3fe"]
//       ],
//       "sequentialminus": [
//         [0, "#0508b8"],
//         [0.0893854748603352, "#1910d8"],
//         [0.1787709497206704, "#3c19f0"],
//         [0.2681564245810056, "#6b1cfb"],
//         [0.3575418994413408, "#981cfd"],
//         [0.44692737430167595, "#bf1cfd"],
//         [0.5363128491620112, "#dd2bfd"],
//         [0.6256983240223464, "#f246fe"],
//         [0.7150837988826816, "#fc67fd"],
//         [0.8044692737430168, "#fe88fc"],
//         [0.8938547486033519, "#fea5fd"],
//         [0.9832402234636871, "#febefe"],
//         [1, "#fec3fe"]
//       ],
//       "diverging": [
//         [0, "#8e0152"],
//         [0.1, "#c51b7d"],
//         [0.2, "#de77ae"],
//         [0.3, "#f1b6da"],
//         [0.4, "#fde0ef"],
//         [0.5, "#f7f7f7"],
//         [0.6, "#e6f5d0"],
//         [0.7, "#b8e186"],
//         [0.8, "#7fbc41"],
//         [0.9, "#4d9221"],
//         [1, "#276419"]
//       ]
//     },
//     "breakpoints": []
//   },
//   "frames": []
// }

// const data = [{
//   "fill": "none",
//   "line": {
//     "dash": "solid",
//     "width": 1
//   },
//   "meta": {
//     "columnNames": {
//       "x": "Center Frequency",
//       "y": "25 mm StarSilent acoustic plaster system, smooth finish, modified D mount"
//     }
//   },
//   "mode": "markers+lines",
//   "name": "25mm StarSilent D-Mount",
//   "type": "scatter",
//   "x": [],
//   "y": [],
//   "marker": {
//     "size": 3
//   },
//   "visible": true,
//   "fillcolor": "rgba(99, 110, 250, 0.05)"
// },
// {
//   "fill": "none",
//   "line": {
//     "width": 1
//   },
//   "meta": {
//     "columnNames": {
//       "x": "Center Frequency",
//       "y": "10 mm Smooth acoustic plaster system, modified D-Mount"
//     }
//   },
//   "mode": "markers+lines",
//   "name": "10mm StarSilent D-Mount",
//   "type": "scatter",
//   "x": [],
//   "y": [],
//   "marker": {
//     "size": 3
//   },
//   "visible": true,
//   "fillcolor": "rgba(239, 85, 59, 0.05)",
//   "stackgroup": null
// },
// {
//   "fill": "none",
//   "line": {
//     "width": 1
//   },
//   "meta": {
//     "columnNames": {
//       "x": "Center Frequency",
//       "y": "25 mm StarSilent acoustic plaster system, A mount"
//     }
//   },
//   "mode": "markers+lines",
//   "name": "25mm StarSilent A-Mount",
//   "type": "scatter",
//   "x": [],
//   "y": [],
//   "marker": {
//     "size": 3
//   },
//   "visible": true,
//   "fillcolor": "rgba(0, 204, 150, 0.05)",
//   "stackgroup": null
// },
// {
//   "fill": "none",
//   "line": {
//     "width": 1
//   },
//   "meta": {
//     "columnNames": {
//       "x": "Center Frequency",
//       "y": "Baswaphon 40mm Classic A mount"
//     }
//   },
//   "mode": "markers+lines",
//   "name": "Baswaphon 40mm Classic A-Mount",
//   "type": "scatter",
//   "x": [],
//   "y": [],
//   "marker": {
//     "size": 3,
//     "opacity": 0.46
//   },
//   "visible": true,
//   "fillcolor": "rgba(171, 99, 250, 0.05)",
//   "stackgroup": null
// }
// ];

export interface LineConfig {
  dash?: string;
  width?: number;
  color?: string;
  shape?: string;
  simplify?: boolean;
}
export interface PlotMeta {
  columnNames?: ColumnNames;
}
export interface ColumnNames {
  x?: string;
  y?: string;
}
export interface GradientConfig {
  type?: string;
}
export interface PlotMarker {
  size?: number;
  symbol?: string;
  opacity?: number;
  color?: string;
  line?: LineConfig;
  gradient?: GradientConfig;
  maxdisplayed?: number;
}
export interface VisibleObject {
  visible?: boolean;
}
export interface SelectionObject {
  marker?: PlotMarker;
}
export interface FontObject {
  family?: string;
  size?: number;
}
export interface LabelObject {
  namelength?: number;
  font?: FontObject;
  align?: string;
}
export interface PlotData {
  fill?: string;
  line?: LineConfig;
  meta?: PlotMeta;
  x?: number[];
  y?: number[];
  mode?: string;
  name?: string;
  type?: string;
  marker?: PlotMarker;
  visiable?: boolean;
  fillcolor?: string;
  xaxis?: string;
  yaxis?: string;
  showlegend?: boolean;
  legendgroup?: string;
  xcalendar?: string;
  ycalendar?: string;
  stackgroup?: string;
  text?: string;
  hovertext?: string;
  connectgaps?: boolean;
  cliponaxis?: boolean;
  hoveron?: string;
  hovertemplate?: string;
  error_y?: VisibleObject;
  error_x?: VisibleObject;
  selected?: SelectionObject;
  unselected?: SelectionObject;
  opacity?: number;
  hoverinfo?: string;
  hoverlabel?: LabelObject;
}
export interface PlotOpts {
  responsive?: boolean;
  editable?: boolean;
  scrollZoom?: boolean;
}

export interface TextTitle {
  text: string;
}
export interface PlotAxisLayout {
  type?: string;
  dtick?: number;
  range?: number[];
  tick0?: number;
  ticks?: string;
  title?: string | TextTitle;
  mirror?: string;
  nticks?: number;
  showline?: boolean;
  tickmode?: string;
  autorange?: boolean;
  linecolor?: string;
}
export interface PlotLegendLayout {
  x: number;
  y: number;
  xanchor: string;
  traceorder: string;
  borderwidth: number;
  orientation: string;
}
export interface PlotLayout {
  title?: string | TextTitle;
  xaxis?: PlotAxisLayout;
  yaxis?: PlotAxisLayout;
  legend?: PlotLegendLayout;
  autosize?: boolean;
  dragmode?: string;
}

export class Plot {
  private readable: Stream.Readable;
  public steam_buffersize: number;
  public port: number;
  constructor(port: number = 45921) {
    this.port = port || 45921;
    this.readable = new Stream.Readable();
    this.steam_buffersize = 1024;
  }

  plot(data: PlotData[], layout: PlotLayout, opts?: PlotOpts) {
    let default_opts: PlotOpts = {
      responsive: false,
      editable: false,
      scrollZoom: false,
    };
    opts = opts || default_opts;
    this.readable.pipe(request.post(`http://0.0.0.0:${this.port}/nplot/`));
    splitEvery(
      JSON.stringify({
        data,
        layout,
        opts: Object.assign(default_opts, opts),
      }),
      this.steam_buffersize
    ).forEach(x => this.readable.push(x));
    this.readable.push(null);
  }
}
