// Function to get the system's current theme (light or dark)
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// On page load, check for stored theme in localStorage or fallback to default
let savedTheme = localStorage.getItem('theme') || 'light';  // Default to 'light' if no saved preference

// If the theme is 'auto', detect the system's theme
if (savedTheme === 'auto') {
    savedTheme = getSystemTheme();  // Detect system theme (dark or light)
}

// Initialize the map with the appropriate style
const mapboxStyle = savedTheme === 'light'
    ? 'mapbox://styles/meltongisdev/cltp6z6ie01dk01raewq8b9ch'  // Light style
    : 'mapbox://styles/meltongisdev/cm64liz5n007d01stag4m8pee';  // Dark style


// Set up the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoibWVsdG9uZ2lzZGV2IiwiYSI6ImNtYmhhZHczbjA3OHkyaXBrMzVlcjBlbHcifQ.xN0syJbN7ZM7Fp9ExXAJhg';
const map = new mapboxgl.Map({
  container: 'map',
  style: mapboxStyle,  // Dynamically set the map style based on theme
  center: [144.6261962, -37.712486],
  zoom: 11.5,
  pitch: 40,
  bearing: 5,
  transformRequest: (url, resourceType) => {
    if (resourceType === "Tile" && url.indexOf("https://api.nearmap.com") > -1) {
      return { url, referrerPolicy: "origin" };
    } else {
      return { url };
    }
  },
});

// Define the Nearmap aerial layer
const nearmapAPIKey = 'YTk1NmE2NDctNmIyNS00N2RiLTg1N2EtYWIzYzg3ZWE2M2Mz'; 

const nearMapAerialLayer = {
    id: 'Nearmap_Layer',
    source: 'Nearmap_Source',
    type: 'raster',
    paint: {
      'raster-opacity': ['interpolate', ['exponential', 1.5], ['zoom'], 15, 0, 17, 1],
    },
    layout: {
      visibility: 'visible',
    },
  };

map.on('load', () => {
  // Add Nearmap source
  map.addSource('Nearmap_Source', {
    type: 'raster',
    tiles: [`https://api.nearmap.com/tiles/v3/Vert/{z}/{x}/{y}.png?apikey=${nearmapAPIKey}`],
    minzoom: 16,
    maxzoom: 22,
    bounds: [144.4667201638995, -37.81836486637397, 144.78127999196013, -37.54203040304009],
  });

  map.addLayer(nearMapAerialLayer);
});
    
const tooltip = document.getElementById('tooltip');
const dateInput = document.getElementById('dateInput');
const slider = document.getElementById('slider');
const visibilityStates = {};

document.querySelectorAll('.legend-key').forEach(item => {
    const layerId = item.getAttribute('data-layer');
    visibilityStates[layerId] = true; 
});
    

// Add nav controls to the map
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// Bind search box to area   
const bbox = [144.439004, -37.857166, 144.829723, -37.464500]; // [westLng, southLat, eastLng, northLat]

// Event listener for Search
const addressInput = document.getElementById('address');
const suggestionsDiv = document.getElementById('suggestions');

// Event listener for input changes
addressInput.addEventListener('input', function() {
    const query = this.value.trim();

    suggestionsDiv.innerHTML = '';

    // Hide suggestions for short queries
    if (query.length <= 2) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    const lowerQuery = query.toLowerCase();    // Search through local data (project_name, public_description, and asset_id match)
    const matchedLocalFeatures = window.originalData.features.filter(feature => {
        const properties = feature.properties || {};
        const projectName = (properties.project_name || '').toString().toLowerCase();
        const publicDescription = (properties.project_description || '').toString().toLowerCase();
        const assetId = (properties.asset_id || '').toString().toLowerCase();
        
        return projectName.includes(lowerQuery) || 
               publicDescription.includes(lowerQuery) || 
               assetId.includes(lowerQuery);
    });

    if (matchedLocalFeatures.length > 0) {
        suggestionsDiv.style.display = 'block';
    
        // Limit to first 6 results
        const limitedResults = matchedLocalFeatures.slice(0, 6);
    
        limitedResults.forEach((feature, index) => {            const suggestionItem = document.createElement('div');
            const properties = feature.properties || {};
            const projectName = properties.project_name || 'Unknown Project Name';
            const assetId = properties.asset_id ? ` (Asset ID: ${properties.asset_id})` : '';
            const description = properties.project_description ? 
                (properties.project_description.length > 50 ? 
                    `${properties.project_description.substring(0, 50)}...` : 
                    properties.project_description) : '';
    
            suggestionItem.innerHTML = `<strong>${projectName}</strong>${assetId}<br>
                                      <small>${description}</small>`;
            suggestionItem.style.cursor = 'pointer';
            suggestionItem.style.padding = '5px';
            suggestionItem.style.borderBottom = '1px solid #ddd';
    
            // Rounded corners for first and last item
            if (index === 0) {
                suggestionItem.style.borderTopLeftRadius = '8px';
                suggestionItem.style.borderTopRightRadius = '8px';
            }
            if (index === limitedResults.length - 1) {
                suggestionItem.style.borderBottomLeftRadius = '8px';
                suggestionItem.style.borderBottomRightRadius = '8px';
            }
            // Theme
            const isDarkMode = map.getStyle().name.includes("dark");
            suggestionItem.style.backgroundColor = isDarkMode ? '#707070' : 'white';
            suggestionItem.style.color = isDarkMode ? '#fff' : '#000';

            suggestionItem.addEventListener('mouseenter', () => {
                suggestionItem.style.backgroundColor = isDarkMode ? '#444' : '#f0f0f0';
            });
            suggestionItem.addEventListener('mouseleave', () => {
                suggestionItem.style.backgroundColor = isDarkMode ? '#707070' : 'white';
            });

            suggestionItem.addEventListener('click', () => {
                selectLocalFeature(feature);
            });

            suggestionsDiv.appendChild(suggestionItem);
        });

    } else {
        // Fallback to Mapbox Geocoding
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?bbox=${bbox.join(',')}&access_token=${mapboxgl.accessToken}`;

        fetch(geocodeUrl)
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    suggestionsDiv.style.display = 'block';
                    data.features.forEach((feature, index) => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.textContent = feature.place_name;
                        suggestionItem.style.cursor = 'pointer';
                        suggestionItem.style.padding = '5px';
                        suggestionItem.style.borderBottom = '1px solid #ddd';

                        if (index === 0) {
                            suggestionItem.style.borderTopLeftRadius = '8px';
                            suggestionItem.style.borderTopRightRadius = '8px';
                        }
                        if (index === data.features.length - 1) {
                            suggestionItem.style.borderBottomLeftRadius = '8px';
                            suggestionItem.style.borderBottomRightRadius = '8px';
                        }

                        const isDarkMode = map.getStyle().name.includes("dark");
                        suggestionItem.style.backgroundColor = isDarkMode ? '#707070' : 'white';
                        suggestionItem.style.color = isDarkMode ? '#fff' : '#000';

                        suggestionItem.addEventListener('mouseenter', () => {
                            suggestionItem.style.backgroundColor = isDarkMode ? '#444' : '#f0f0f0';
                        });
                        suggestionItem.addEventListener('mouseleave', () => {
                            suggestionItem.style.backgroundColor = isDarkMode ? '#707070' : 'white';
                        });

                        suggestionItem.addEventListener('click', () => {
                            selectSuggestion(feature);
                        });

                        suggestionsDiv.appendChild(suggestionItem);
                    });
                } else {
                    suggestionsDiv.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching geocode suggestions:', error);
            });
    }
});


// Calculate polygon centroid
function getPolygonCentroid(coordinates) {
    let area = 0;
    let x = 0;
    let y = 0;

    const ring = coordinates[0]; // Use the outer ring
    const len = ring.length;

    for (let i = 0; i < len - 1; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[i + 1];
        const f = x0 * y1 - x1 * y0;
        area += f;
        x += (x0 + x1) * f;
        y += (y0 + y1) * f;
    }

    area *= 0.5;
    const factor = 1 / (6 * area);
    return [x * factor, y * factor];
}



// Array to store markers
let markers = [];

// Function to handle selecting a suggestion
function selectLocalFeature(feature) {
    // If geometry is null, try to get it from properties
    let geometry = feature.geometry;

    if (!geometry && feature.properties.geometry) {
        geometry = feature.properties.geometry;
    }

    if (!geometry || !geometry.type || !geometry.coordinates) {
        // Set modal message
        const modalBody = document.getElementById('modal-body');
        modalBody.textContent = "No location data available for this project.";

        // Show the Bootstrap modal
        const analysisModal = new bootstrap.Modal(document.getElementById('analysisModal'));
        analysisModal.show();

        suggestionsDiv.style.display = 'none';
        addressInput.value = '';
        return;
    }

    let center;
    if (geometry.type === 'Point') {
        center = geometry.coordinates;
    } else if (geometry.type === 'Polygon') {
        center = getPolygonCentroid(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
        center = getPolygonCentroid(geometry.coordinates[0]);
    } else {
        console.warn('Unknown geometry type:', geometry.type);
        return;
    }

    map.flyTo({
        center: center,
        zoom: 17
    });

    suggestionsDiv.style.display = 'none';
    addressInput.value = '';

    // Remove old markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Add the new marker
    const newMarker = new mapboxgl.Marker()
        .setLngLat(center)
        .addTo(map);
    markers.push(newMarker);
}


function selectSuggestion(feature) {
    addressInput.value = feature.place_name; 
    suggestionsDiv.style.display = 'none'; 
    const coordinates = feature.geometry.coordinates;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Fly to the new coordinates
    map.flyTo({
        center: coordinates,
        zoom: 16
    });

    addressInput.value = '';

    // Remove old markers
    markers.forEach(marker => marker.remove());
    markers = [];

    const newMarker = new mapboxgl.Marker()
        .setLngLat(coordinates)
        .addTo(map);
    markers.push(newMarker);
}

// Fetch Data
map.on('load', async function () {
    try {
        // Fetch and add Business Precincts data first (bottom layer)
        const precinctResponse = await fetch('https://web.fulcrumapp.com/shares/0929fdf2b2d07a9d.geojson');
        if (!precinctResponse.ok) {
            throw new Error(`Failed to load Business Precincts GeoJSON. Status: ${precinctResponse.status}`);
        }
        const precinctData = await precinctResponse.json();
        window.precinctData = precinctData;
        console.log('Business Precincts Data:', window.precinctData);
        addGeoJsonData(window.precinctData, 'BusinessPrecinctData');

        // Then fetch and add Infrastructure Pipeline data (top layer)
        const infraResponse = await fetch('https://web.fulcrumapp.com/shares/0107845e48091efd.geojson');
        if (!infraResponse.ok) {
            throw new Error(`Failed to load Infrastructure Pipeline GeoJSON. Status: ${infraResponse.status}`);
        }
        const infraData = await infraResponse.json();
        window.originalData = infraData;
        console.log('Infrastructure Pipeline Data:', window.originalData);
        addGeoJsonData(window.originalData, 'InfraPipelineData');

    } catch (error) {
        console.error('Error loading data:', error);
    }
});





function formatDate(dateStr) {
    if (!dateStr) return 'No date available';

    const date = new Date(dateStr);
    if (isNaN(date)) return 'Invalid date';

    const day = date.getDate();
    const month = date.toLocaleString('en-AU', { month: 'short' });
    const year = date.getFullYear();

    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (n) => {
        if (n > 3 && n < 21) return 'th';
        switch (n % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
}


const geoJsonSourcesAndLayers = [];

// Create the legend dynamically based on the saved theme
function createLegend() {
    // Retrieve the saved theme from localStorage
    let savedTheme = localStorage.getItem('theme') || 'dark';  // Default to 'dark'

    // If the theme is 'auto', detect the system's theme
    if (savedTheme === 'auto') {
        savedTheme = getSystemTheme();  // Detect system theme (dark or light)
    }    
    
    const legendItems = {
        'Transport': '#294184',        // Dark Blue
        'Community': '#1891c9',        // Light Blue
        'Information Technology': '#cb0d0c',  // Red
        'Open Space': '#87d30f',       // Light Green
        'Recreation': '#ffd300',       // Yellow
        'Stormwater': '#00bcd4',       // Cyan
        'Land': '#9c27b0',            // Purple
        'Major Project': '#ff5722',    // Deep Orange
        'Other': '#757575',           // Grey
        'Business Precincts': '#FF69B4'   // Pink

    };

    const legendContainer = document.getElementById("legend-items");
    legendContainer.innerHTML = '';

    // Apply theme-specific styles to the legend container
    if (savedTheme === 'dark') {
        document.getElementById('map-legend').style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        document.getElementById('map-legend').style.color = 'white';
    } else {
        document.getElementById('map-legend').style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        document.getElementById('map-legend').style.color = 'black';
    }

    // Generate the legend items
    Object.entries(legendItems).forEach(([status, color]) => {
        const legendItem = document.createElement("div");
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.marginBottom = '2px';

        const colorBox = document.createElement("div");
        colorBox.style.width = '15px';
        colorBox.style.height = '15px';
        colorBox.style.backgroundColor = color;
        colorBox.style.marginRight = '10px';

        const label = document.createElement("span");
        label.textContent = status;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}


function addGeoJsonSourceAndLayers(geojsonData, sourceId) {

    map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
    });    
    
    // Save source and layers configuration - order matters for visual layering
    geoJsonSourcesAndLayers.push({
        sourceId,
        layers: [
            // Polygons Layer (bottom)
            {
                'id': `${sourceId}-polygons-layer`,
                'type': 'fill',
                'source': sourceId,
                'filter': ['==', '$type', 'Polygon'],
                'paint': {                    
                    'fill-color': sourceId === 'BusinessPrecinctData' ? 
                        '#FF69B4' : [ // Pink color for Business Precincts
                        'case',
                        ['==', ['get', 'status'], 'Transport'], '#294184',
                        ['==', ['get', 'status'], 'Community'], '#1891c9',
                        ['==', ['get', 'status'], 'Information Technology'], '#cb0d0c',
                        ['==', ['get', 'status'], 'Open Space'], '#87d30f',
                        ['==', ['get', 'status'], 'Recreation'], '#ffd300',
                        ['==', ['get', 'status'], 'Stormwater'], '#00bcd4',
                        ['==', ['get', 'status'], 'Land'], '#9c27b0',
                        ['==', ['get', 'status'], 'Major Project'], '#ff5722',
                        ['==', ['get', 'status'], 'Other'], '#757575',
                        '#757575' // Default/fallback color
                    ],
                    'fill-opacity': 0.6,
                    'fill-outline-color': sourceId === 'BusinessPrecinctData' ? 
                        '#FF1493' : [ // Darker pink for Business Precincts outline
                        'case',
                        ['==', ['get', 'status'], 'Transport'], '#294184',
                        ['==', ['get', 'status'], 'Community'], '#1891c9',
                        ['==', ['get', 'status'], 'Information Technology'], '#cb0d0c',
                        ['==', ['get', 'status'], 'Open Space'], '#87d30f',
                        ['==', ['get', 'status'], 'Recreation'], '#ffd300',
                        ['==', ['get', 'status'], 'Stormwater'], '#00bcd4',
                        ['==', ['get', 'status'], 'Land'], '#9c27b0',
                        ['==', ['get', 'status'], 'Major Project'], '#ff5722',
                        ['==', ['get', 'status'], 'Other'], '#757575',
                        '#757575' // Default/fallback color
                    ]
                }
            },
            // Lines Layer (middle)
            {
                'id': `${sourceId}-lines-layer`,
                'type': 'line',
                'source': sourceId,
                'filter': ['==', '$type', 'LineString'],
                'paint': {
                    'line-width': 3,
                    'line-color': sourceId === 'BusinessPrecinctData' ? 
                        '#FF69B4' : [ // Pink color for Business Precincts
                        'case',
                        ['==', ['get', 'status'], 'Transport'], '#294184',
                        ['==', ['get', 'status'], 'Community'], '#1891c9',
                        ['==', ['get', 'status'], 'Information Technology'], '#cb0d0c',
                        ['==', ['get', 'status'], 'Open Space'], '#87d30f',
                        ['==', ['get', 'status'], 'Recreation'], '#ffd300',
                        ['==', ['get', 'status'], 'Stormwater'], '#00bcd4',
                        ['==', ['get', 'status'], 'Land'], '#9c27b0',
                        ['==', ['get', 'status'], 'Major Project'], '#ff5722',
                        ['==', ['get', 'status'], 'Other'], '#757575',
                        '#757575' // Default/fallback color
                    ]
                }
            },
            // Points Layer (top)
            {
                'id': `${sourceId}-points-layer`,
                'type': 'circle',
                'source': sourceId,
                'filter': ['==', '$type', 'Point'],
                'paint': {
                    'circle-radius': 5,
                    'circle-color': sourceId === 'BusinessPrecinctData' ? 
                        '#FF69B4' : [ // Pink color for Business Precincts
                        'case',
                        ['==', ['get', 'status'], 'Transport'], '#294184',
                        ['==', ['get', 'status'], 'Community'], '#1891c9',
                        ['==', ['get', 'status'], 'Information Technology'], '#cb0d0c',
                        ['==', ['get', 'status'], 'Open Space'], '#87d30f',
                        ['==', ['get', 'status'], 'Recreation'], '#ffd300',
                        ['==', ['get', 'status'], 'Stormwater'], '#00bcd4',
                        ['==', ['get', 'status'], 'Land'], '#9c27b0',
                        ['==', ['get', 'status'], 'Major Project'], '#ff5722',
                        ['==', ['get', 'status'], 'Other'], '#757575',
                        '#757575' // Default/fallback color
                    ]
                }
            }
        ]
    });

    // Add layers to the map in the correct order
    geoJsonSourcesAndLayers[geoJsonSourcesAndLayers.length - 1].layers.forEach(layer => {
        map.addLayer({ ...layer, source: sourceId });
    });

    createLegend();
}

// Function to remove all GeoJSON sources and layers
function removeAllSourcesAndLayers() {
    const layers = map.getStyle().layers || [];
    const sources = Object.keys(map.getStyle().sources);

    // Remove all layers
    layers.forEach(layer => {
        if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
        }
    });

    // Remove all sources
    sources.forEach(source => {
        if (map.getSource(source)) {
            map.removeSource(source);
        }
    });
}

// Function to re-add all GeoJSON sources and layers
function reAddAllSourcesAndLayers() {
    // Re-add Nearmap layer first (bottom-most layer)
    map.addSource('Nearmap_Source', {
        type: 'raster',
        tiles: [`https://api.nearmap.com/tiles/v3/Vert/{z}/{x}/{y}.png?apikey=${nearmapAPIKey}`],
        minzoom: 16,
        maxzoom: 22,
        bounds: [144.4667201638995, -37.81836486637397, 144.78127999196013, -37.54203040304009],
    });

    map.addLayer({
        id: 'Nearmap_Layer',
        source: 'Nearmap_Source',
        type: 'raster',
        paint: {
            'raster-opacity': ['interpolate', ['exponential', 1.5], ['zoom'], 15, 0, 17, 1],
        },
        layout: {
            visibility: 'visible',
        },
    });

    // Re-add Business Precincts data (if it exists)
    if (window.precinctData) {
        addGeoJsonData(window.precinctData, 'BusinessPrecinctData');
    }

    // Re-add Infrastructure Pipeline data (if it exists)
    if (window.originalData) {
        addGeoJsonData(window.originalData, 'InfraPipelineData');
    }

    // Re-create tooltips for both datasets
    addTooltip('BusinessPrecinctData');
    addTooltip('InfraPipelineData');
}

function addTooltip(sourceId) {
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
    });

    const layers = [
        `${sourceId}-points-layer`,
        `${sourceId}-lines-layer`,
        `${sourceId}-polygons-layer`
    ];

    let currentFulcrumID = null;
    let currentOutlineLayerId = null;

    layers.forEach(layer => {
        map.on('mouseenter', layer, (e) => {
            map.getCanvas().style.cursor = 'pointer';

            const properties = e.features[0].properties;
            const coordinates = e.lngLat;
            const newFulcrumID = properties.fulcrum_id;

            // Only update if the feature changes
            if (currentFulcrumID !== newFulcrumID) {
                currentFulcrumID = newFulcrumID;

                // Determine fields based on source type
                let fields = [];
                if (sourceId === 'BusinessPrecinctData') {
                    fields = [
                        { label: 'Precinct Name', value: properties.precinct_name },
                        { label: 'Business Types', value: properties.business_types },
                        { label: 'Main Roads', value: properties.main_roads },
                        { label: 'Notes', value: properties.notes_councilbody_corpshopping_centre },
                        { label: 'Suburb', value: properties.suburb }
                    ];
                } else {
                    fields = [
                        { label: 'Project Name', value: properties.project_name },
                        { label: 'Status', value: properties.status },
                        { label: 'Parent Program', value: properties.parent_program },
                        { label: 'Child Program', value: properties.child_program },
                        { label: 'Project Manager', value: properties.project_manager }
                    ];
                }

                let tooltipContent = '';
                fields.forEach(field => {
                    if (field.value && field.value !== '0' && field.value !== 'N/A' && field.value !== 'null') {
                        tooltipContent += `<strong>${field.label}:</strong> ${field.value}<br>`;
                    }
                });

                if (!tooltipContent) {
                    tooltipContent = '<strong>No data available</strong>';
                }

                const tooltipBackgroundColor = 'rgba(255, 255, 255, 0.8)';
                const tooltipTextColor = '#333';

                // Set the tooltip position using e.lngLat
                popup.setLngLat(coordinates)
                    .setHTML(`<div style="background-color: ${tooltipBackgroundColor}; color: ${tooltipTextColor};">${tooltipContent}</div>`)
                    .addTo(map);

                // Remove the previous outline if necessary
                if (currentOutlineLayerId) {
                    map.removeLayer(currentOutlineLayerId);
                    currentOutlineLayerId = null;
                }

                // Add the outline for the new feature
                const outlineLayerId = `${sourceId}-highlight-layer`;

                // Add the new outline layer for the hovered feature
                map.addLayer({
                    id: outlineLayerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': 'black',
                        'line-width': 3
                    },
                    filter: ['==', 'fulcrum_id', currentFulcrumID]
                });     
                currentOutlineLayerId = outlineLayerId;
            }
        });

        map.on('mousemove', layer, (e) => {
            const coordinates = e.lngLat;

            // Only update tooltip position and highlight if the unique_id has changed
            const properties = e.features[0].properties;
            const newFulcrumID = properties.fulcrum_id;

            // Update tooltip position and content dynamically
            if (currentFulcrumID !== newFulcrumID) {
                // Remove the previous outline if necessary
                if (currentOutlineLayerId) {
                    map.removeLayer(currentOutlineLayerId);  // Remove the previous outline layer
                }

                currentFulcrumID = newFulcrumID;

                // Prepare tooltip content dynamically
                let fields = [];
                if (sourceId === 'BusinessPrecinctData') {
                    fields = [
                        { label: 'Precinct Name', value: properties.precinct_name },
                        { label: 'Business Types', value: properties.business_types },
                        { label: 'Main Roads', value: properties.main_roads },
                        { label: 'Notes', value: properties.notes_councilbody_corpshopping_centre },
                        { label: 'Suburb', value: properties.suburb }
                    ];
                } else {
                    fields = [
                        { label: 'Project Name', value: properties.project_name },
                        { label: 'Status', value: properties.status },
                        { label: 'Parent Program', value: properties.parent_program },
                        { label: 'Child Program', value: properties.child_program },
                        { label: 'Project Manager', value: properties.project_manager }
                    ];
                }

                let tooltipContent = '';
                fields.forEach(field => {
                    if (field.value && field.value !== 'N/A' && field.value !== '0' && field.value !== '$0' && field.value !== '0 m²') {
                        tooltipContent += `<strong>${field.label}:</strong> ${field.value}<br>`;
                    }
                });

                if (!tooltipContent) {
                    tooltipContent = '<strong>No data available</strong>';
                }

                const tooltipBackgroundColor = 'rgba(255, 255, 255, 0.8)';
                const tooltipTextColor = '#333';

                // Update the tooltip content and position
                popup.setLngLat(coordinates)
                    .setHTML(`<div style="background-color: ${tooltipBackgroundColor}; color: ${tooltipTextColor};">${tooltipContent}</div>`);

                // Add the outline for the new feature
                const outlineLayerId = `${sourceId}-highlight-layer`;

                // Add the new outline layer for the hovered feature
                map.addLayer({
                    id: outlineLayerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': 'black',
                        'line-width': 2
                    },
                    filter: ['==', 'fulcrum_id', currentFulcrumID]
                });                

                // Track the current outline layer for future removal
                currentOutlineLayerId = outlineLayerId;
            } else {
                popup.setLngLat(coordinates);
            }
        });

        map.on('mouseleave', layer, () => {
            map.getCanvas().style.cursor = '';
            popup.remove();

            if (currentOutlineLayerId) {
                map.removeLayer(currentOutlineLayerId);
                currentOutlineLayerId = null;
                currentFulcrumID = null;
            }
        });
    });
}


function formatStatus(status) {
  if (!status) return '';
  return status
    .split('_')                      // Split by underscore
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' ');                      // Join with space
}

function formatCurrency(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return '';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


function addModal(sourceId) {
    const layers = [
        `${sourceId}-points-layer`,
        `${sourceId}-lines-layer`,
        `${sourceId}-polygons-layer`
    ];

    layers.forEach(layer => {
        map.on('click', layer, (e) => {
            const properties = e.features[0].properties;
            const geometry = e.features[0].geometry;

            // Calculate centroid coordinates
            let coordinates = geometry.coordinates;
            let lon, lat;
        
            if (geometry.type === "Point") {
                lat = coordinates[1];  // Inverted
                lon = coordinates[0];  // Inverted
            } else if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
                let bounds = turf.bbox(geometry); // Calculate bounding box
                lon = (bounds[0] + bounds[2]) / 2; // Center longitude
                lat = (bounds[1] + bounds[3]) / 2; // Center latitude
            } else if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
                let lineCenter = turf.center(geometry);
                lon = lineCenter.geometry.coordinates[0];
                lat = lineCenter.geometry.coordinates[1];
            } else {
                console.error("Unsupported geometry type:", geometry.type);
                return;
            }
        
            const pitch = 40;  // Fixed pitch
        
            const accessToken = mapboxgl.accessToken;
        
            // Encode polygon coordinates as a polyline for MultiPolygon
            let staticImageUrls = [];
            
            if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
                // For MultiPolygon, iterate through each polygon and create a URL for each
                const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
                
                polygons.forEach((polygonCoords) => {
                    // Flatten the coordinates
                    const flattenedCoordinates = polygonCoords[0]; // First polygon if MultiPolygon
                    
                    // Invert coordinates from [long, lat] to [lat, long]
                    const invertedCoordinates = flattenedCoordinates.map(coord => [coord[1], coord[0]]);
                    
                    // Encode the coordinates into a polyline
                    let polylineEncoded = polyline.encode(invertedCoordinates);

                    // Encode the polyline to be URL friendly
                    const polylineEncodedURL = encodeURIComponent(polylineEncoded);

                    // Construct the static map URL with the path overlay before the access token
                    // Note: Path format: path-{strokeWidth}+{strokeColor}-{strokeOpacity}+{fillColor}-{fillOpacity}({polyline})
                    const pathOverlay = `path-5+395dbf-0.5+395dbf-0.5(${polylineEncodedURL})`;
                    // No pitch but automatically set zoom:
                    const staticImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${pathOverlay}/auto/600x500?logo=false&attribution=false&padding=75&access_token=${accessToken}`;
                    staticImageUrls.push(staticImageUrl);
                });
            } else if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
                // For MultiLineString, iterate through each line and create a URL for each
                const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
                
                lines.forEach((lineCoords) => {
                    // Invert coordinates from [long, lat] to [lat, long]
                    const invertedCoordinates = lineCoords.map(coord => [coord[1], coord[0]]);
                    
                    // Encode the coordinates into a polyline
                    let polylineEncoded = polyline.encode(invertedCoordinates);
                    
                    // Encode the polyline to be URL friendly
                    const polylineEncodedURL = encodeURIComponent(polylineEncoded);

                    // Create a path overlay for the line - using a thicker stroke and no fill
                    // Note: Path format for lines: path-{strokeWidth}+{strokeColor}-{strokeOpacity}({polyline})
                    const pathOverlay = `path-6+395dbf-1(${polylineEncodedURL})`;
                    
                    // Use auto zoom to fit the entire line
                    const staticImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${pathOverlay}/auto/600x500?logo=false&attribution=false&padding=75&access_token=${accessToken}`;
                    staticImageUrls.push(staticImageUrl);
                });
            } else if (geometry.type === "Point") {
                // If it's a Point, create a marker at the point
                const pointMarker = `pin-l-star+000(${lon},${lat})`;
                const staticImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${pointMarker}/${lon},${lat},18,0,${pitch}/600x500?logo=false&attribution=false&access_token=${accessToken}`;
                staticImageUrls.push(staticImageUrl);
            }
        
            // Build modal content
            let modalContent = '';
            
            // Add title based on source type
            if (sourceId === 'BusinessPrecinctData') {
                modalContent = `<h3>${properties.precinct_name || 'Unnamed Precinct'}</h3>`;
            } else {
                modalContent = `<h3>${properties.project_name || 'Unnamed Project'}</h3>`;
            }

            // Define fields based on source type
            const generalFields = sourceId === 'BusinessPrecinctData' ? [
                { label: 'ID', value: properties.id },
                { label: 'Suburb', value: properties.suburb },
                { label: 'Main Roads', value: properties.main_roads },
                { label: 'Business Count', value: properties.number_of_businesses_via_eco_dev_crms },
                { label: 'Notes', value: properties.notes_councilbody_corpshopping_centre },
                { label: 'Business Types', value: properties.business_types },
                { label: 'Correct as per last site audit', value: properties.correct_as_per_last_site_audit},
                {
                    label: 'Fulcrum Link',
                    value: `<a href="https://web.fulcrumapp.com/records/${properties.fulcrum_id}" target="_blank">View Record</a>`
                }
            ] : [
                { label: 'Public Name', value: properties.public_name },
                { label: 'Status', value: properties.status },
                { label: 'Project Description', value: properties.project_description },
                { label: 'Public Description', value: properties.public_description },
                { label: 'Project Code', value: properties.project_code },
                { label: 'CAMMS ID', value: properties.camms_id },
                { label: 'Parent Program', value: properties.parent_program },
                { label: 'Child Program', value: properties.child_program },
                { label: 'Ward', value: properties.ward },
                { label: 'Suburb', value: properties.suburb },
                { label: 'Project Manager', value: properties.project_manager },
                { label: 'Project Type', value: properties.project_type },
                { label: 'Project Category', value: properties.project_category },
                { label: 'Asset Category', value: properties.asset_category },
                { label: 'Project Start Year', value: properties.project_or_program_start_year },
                { label: 'Project Progress', value: properties.project_progress },
                { label: 'Project Completed', value: properties.project_completed === 'yes' ? 'Yes' : 'No' },
                { label: 'Project Delivery Agent', value: properties.project_delivery_agent },
                {
                    label: 'Fulcrum Link',
                    value: `<a href="https://web.fulcrumapp.com/records/${properties.fulcrum_id}" target="_blank">View Record</a>`
                }
            ];

            // Add general fields to modal
            generalFields.forEach(field => {
                if (field.value && field.value !== 'N/A' && field.value !== '0' && field.value !== 'null' && field.value !== 'FALSE') {
                    modalContent += `<p><strong>${field.label}:</strong> ${field.value}</p>`;
                }
            });

            // Add static images to the modal content
            staticImageUrls.forEach(imageUrl => {
                modalContent += `<img src="${imageUrl}" alt="Map Image" class="img-fluid mt-3">`;
            });

            // Inject the content into the modal
            document.getElementById('modal-body').innerHTML = modalContent;

            // Show the modal
            const myModal = new bootstrap.Modal(document.getElementById('analysisModal'));
            myModal.show();
        });
    });
}

function addGeoJsonData(geojsonData, sourceId) {
    addGeoJsonSourceAndLayers(geojsonData, sourceId);
    addTooltip(sourceId);
    addModal(sourceId);
}

document.addEventListener("DOMContentLoaded", function () {
    const suburbWardToggle = document.getElementById("suburbWardToggle");
    const themeToggleButtons = document.querySelectorAll('[data-bs-theme-value]');
    let storedTheme = localStorage.getItem('theme') || 'auto';

    if (storedTheme === 'auto') {
        storedTheme = getSystemTheme();
    }

    function updateThemes() {
        const isDarkMode = storedTheme === 'dark';
        const isSuburbView = !suburbWardToggle.classList.contains("active");

        let style;

        if (isDarkMode && !isSuburbView) {
            style = 'mapbox://styles/meltongisdev/cm71evb1b00gt01sl24jh79e9';
        } else if (isDarkMode && isSuburbView) {
            style = 'mapbox://styles/meltongisdev/cm64liz5n007d01stag4m8pee';
        } else if (!isDarkMode && !isSuburbView) {
            style = 'mapbox://styles/meltongisdev/cm7iki368003w01r8fumle4vu';
        } else if (!isDarkMode && isSuburbView) {
            style = 'mapbox://styles/meltongisdev/cltp6z6ie01dk01raewq8b9ch';
        }

        if (!map.isStyleLoaded()) {
            map.once('style.load', updateThemes);
            return;
        }

        removeAllSourcesAndLayers();
        map.setStyle(style);
        map.once('style.load', () => {
            reAddAllSourcesAndLayers();
            updateThemeStyles(storedTheme);
            applyFiltersWhenSourcesReady();
        });
    }

    function updateThemeStyles(theme) {
        if (theme === 'dark') {
            document.documentElement.style.setProperty('--search-bar-bg-light', '#333');
            document.documentElement.style.setProperty('--search-bar-text-light', 'white');
            document.documentElement.style.setProperty('--search-bar-border-light', '#444');

            document.getElementById('map-legend').style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            document.getElementById('map-legend').style.color = 'white';
        } else {
            document.documentElement.style.setProperty('--search-bar-bg-light', 'white');
            document.documentElement.style.setProperty('--search-bar-text-light', 'black');
            document.documentElement.style.setProperty('--search-bar-border-light', '#ccc');

            document.getElementById('map-legend').style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            document.getElementById('map-legend').style.color = 'black';
        }
    }

    themeToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            let themeValue = button.getAttribute('data-bs-theme-value');

            if (themeValue === 'auto') {
                themeValue = getSystemTheme();
            }

            storedTheme = themeValue;
            localStorage.setItem('theme', themeValue);
            updateThemes();

            themeToggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    suburbWardToggle.addEventListener("click", function () {
        this.classList.toggle("active");
        updateThemes();
    });

    updateThemes();
});
