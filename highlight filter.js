function showFilteredDataPopups() {
    // Get current theme (light or dark)
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    // Process Infrastructure Pipeline Data
    const infraSource = map.getSource('InfraPipelineData');
    if (infraSource && infraSource._data && infraSource._data.features) {
        processFeatures(infraSource._data.features, currentTheme, 'infra');
    }

    // Process Business Precinct Data only if the layer is visible
    const businessPrecinctsButton = document.getElementById('businessPrecinctsButton');
    const isBusinessPrecinctsVisible = businessPrecinctsButton && businessPrecinctsButton.classList.contains('active');
    
    if (isBusinessPrecinctsVisible) {
        const businessSource = map.getSource('BusinessPrecinctData');
        if (businessSource && businessSource._data && businessSource._data.features) {
            processFeatures(businessSource._data.features, currentTheme, 'business');
        }
    }
}

function processFeatures(features, currentTheme, dataType) {
    features.forEach((feature) => {
        const properties = feature.properties || {};
        let popupContent = '';

        if (dataType === 'infra') {
            // Infrastructure Pipeline data popup content
            popupContent = '<strong>Project Name:</strong> ' + (properties.project_name || 'Unnamed Project') + '<br>';

            if (properties.project_description) {
                const description = properties.project_description.length > 100 ? 
                    properties.project_description.substring(0, 100) + '...' : 
                    properties.project_description;
                popupContent += `<strong>Description:</strong> ${description}<br>`;
            }

            if (properties.parent_program) {
                popupContent += `<strong>Parent Program:</strong> ${properties.parent_program}<br>`;
            }

            if (properties.child_program) {
                popupContent += `<strong>Child Program:</strong> ${properties.child_program}<br>`;
            }

            if (properties.project_or_program_start_year || properties.start_year) {
                popupContent += `<strong>Start Year:</strong> ${properties.project_or_program_start_year || properties.start_year}<br>`;
            }
        } else if (dataType === 'business') {
            // Business Precinct data popup content
            popupContent = '<strong>Precinct:</strong> ' + (properties.precinct_name || 'Unnamed Precinct') + '<br>';

            if (properties.description) {
                const description = properties.description.length > 100 ? 
                    properties.description.substring(0, 100) + '...' : 
                    properties.description;
                popupContent += `<strong>Description:</strong> ${description}<br>`;
            }

            if (properties.type) {
                popupContent += `<strong>Type:</strong> ${properties.type}<br>`;
            }

            if (properties.status) {
                popupContent += `<strong>Status:</strong> ${properties.status}<br>`;
            }
        }

        // If no valid data, set a fallback message
        if (!popupContent.trim()) {
            popupContent = '<strong>No data available</strong>';
        }

        // Check if feature has geometry and handle different types
        if (feature.geometry && feature.geometry.coordinates) {
            let coordinates;

            // If the geometry is a Point, use the coordinates directly
            if (feature.geometry.type === 'Point') {
                coordinates = feature.geometry.coordinates;

            // If the geometry is a LineString, calculate the centroid
            } else if (feature.geometry.type === 'LineString') {
                coordinates = calculateCentroid(feature.geometry);

            // If the geometry is a Polygon, calculate the centroid of the polygon's bounding box
            } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                const bbox = turf.bbox(feature.geometry); // Use Turf.js for bounding box
                coordinates = [
                    (bbox[0] + bbox[2]) / 2,
                    (bbox[1] + bbox[3]) / 2
                ];
            }

            // Ensure coordinates are in [lng, lat] format
            if (Array.isArray(coordinates) && coordinates.length === 2) {
                let popupOffset = 10;

                const popup = new mapboxgl.Popup({ offset: popupOffset })
                    .setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(map);

                // Customize text color based on the theme
                const popupElement = popup.getElement();
                if (currentTheme === 'dark') {
                    // Dark mode styling
                    popupElement.style.color = '#fff'; // White text
                } else {
                    // Light mode styling
                    popupElement.style.color = '#000'; // Dark text
                }
            }
        }
    });
}


// Function to calculate the centroid of a LineString (weighted average)
function calculateCentroid(geometry) {
    if (geometry.type === 'LineString' && geometry.coordinates.length > 0) {
        const coordinates = geometry.coordinates;
        let totalLng = 0, totalLat = 0;
        let totalWeight = 0;

        // Loop through the coordinates to calculate a weighted centroid
        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = coordinates[i];
            const end = coordinates[i + 1];

            // Calculate the midpoint of the segment
            const midLng = (start[0] + end[0]) / 2;
            const midLat = (start[1] + end[1]) / 2;

            // Calculate the length of the segment (Euclidean distance)
            const segmentLength = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));

            // Add the weighted coordinates
            totalLng += midLng * segmentLength;
            totalLat += midLat * segmentLength;
            totalWeight += segmentLength;
        }

        // Calculate the weighted average (centroid)
        const centroidLng = totalLng / totalWeight;
        const centroidLat = totalLat / totalWeight;

        return [centroidLng, centroidLat];
    }

    return null;
}

document.getElementById("showPopupsButton").addEventListener("click", function() {
    showFilteredDataPopups();
});
