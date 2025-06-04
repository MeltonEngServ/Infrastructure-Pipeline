function filterData() {
    if (!window.originalData || !window.originalData.features) {
        console.error("GeoJSON data not loaded or invalid.");
        return;
    }

    const geojsonData = window.originalData;
    const mapSource = map.getSource('InfraPipelineData');

    if (!mapSource) {
        console.error('Map source "InfraPipelineData" not found.');
        return;
    }    // Get active filters from all dropdowns
    const activeOrigin = Array.from(document.querySelectorAll(".origin-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeParentProgram = Array.from(document.querySelectorAll(".parent-program-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeChildProgram = Array.from(document.querySelectorAll(".child-program-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeStartYear = Array.from(document.querySelectorAll(".start-year-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeAssetCategory = Array.from(document.querySelectorAll(".asset-category-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeProjectName = Array.from(document.querySelectorAll(".project-name-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeProjectSponsor = Array.from(document.querySelectorAll(".project-sponsor-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeProjectOwner = Array.from(document.querySelectorAll(".project-owner-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeProjectType = Array.from(document.querySelectorAll(".project-type-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeInFlight = Array.from(document.querySelectorAll(".in-flight-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeDeliveryAgent = Array.from(document.querySelectorAll(".delivery-agent-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeAssetExpenditure = Array.from(document.querySelectorAll(".asset-expenditure-filter.active"))
        .map(label => label.getAttribute("data-code"));
    const activeProjectManager = Array.from(document.querySelectorAll(".project-manager-filter.active"))
        .map(label => label.getAttribute("data-code"));

    let totalProjects = 0;

    const filteredFeatures = geojsonData.features.filter((feature) => {
        const properties = feature.properties || {};

        // Get values, using "Blank" as fallback
        const origin = (properties.project_or_program_origin || properties.origin || "Blank").trim();
        const parentProgram = (properties.parent_program || "Blank").trim();
        const childProgram = (properties.child_program || "Blank").trim();
        const startYear = (properties.project_or_program_start_year || properties.start_year || "Blank").toString().trim();
        const assetCategory = (properties.asset_category || "Blank").trim();
        const projectName = (properties.project_name || "Blank").trim();
        const projectSponsor = (properties.project_sponsor || "Blank").trim();
        const projectOwner = (properties.project_owner_by_role || "Blank").trim();
        const projectType = (properties.project_type || "Blank").trim();
        const inFlight = (properties.committed || "Blank").trim();
        const deliveryAgent = (properties.project_delivery_agent || "Blank").trim();
        const assetExpenditure = (properties.asset_expenditure_type || "Blank").trim();
        const projectManager = (properties.project_manager || "Blank").trim();

        // Check if any active filters match (hide matching features)
        const shouldBeHidden = 
            (activeOrigin.length > 0 && activeOrigin.includes(origin)) ||
            (activeParentProgram.length > 0 && activeParentProgram.includes(parentProgram)) ||
            (activeChildProgram.length > 0 && activeChildProgram.includes(childProgram)) ||
            (activeStartYear.length > 0 && activeStartYear.includes(startYear)) ||
            (activeAssetCategory.length > 0 && activeAssetCategory.includes(assetCategory)) ||
            (activeProjectName.length > 0 && activeProjectName.includes(projectName)) ||
            (activeProjectSponsor.length > 0 && activeProjectSponsor.includes(projectSponsor)) ||
            (activeProjectOwner.length > 0 && activeProjectOwner.includes(projectOwner)) ||
            (activeProjectType.length > 0 && activeProjectType.includes(projectType)) ||
            (activeInFlight.length > 0 && activeInFlight.includes(inFlight)) ||
            (activeDeliveryAgent.length > 0 && activeDeliveryAgent.includes(deliveryAgent)) ||
            (activeAssetExpenditure.length > 0 && activeAssetExpenditure.includes(assetExpenditure)) ||
            (activeProjectManager.length > 0 && activeProjectManager.includes(projectManager));

        // Skip features that match the active filters
        if (shouldBeHidden) {
            return false;
        }

        totalProjects++;
        return true;
    });

    // Update map source
    mapSource.setData({
        type: 'FeatureCollection',
        features: filteredFeatures
    });

    // Update UI
    document.getElementById("projectCount").textContent = `Total Projects: ${totalProjects.toLocaleString()}`;
}


// Function to parse the date string (YYYY-MM-DD) into a JavaScript Date object
function parseDateString(dateString) {
    if (!dateString) return null;

    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day);
}
  
// Function to update the map with filtered data
function updateMapWithFilteredData(filteredFeatures) {
const filteredGeoJson = {
    type: 'FeatureCollection',
    features: filteredFeatures
};

// Update the map source with the filtered GeoJSON
map.getSource('InfraPipelineData').setData(filteredGeoJson);

}


// Helper function to toggle button states
function toggleButton(id, state) {
    const button = document.getElementById(id);
    button.classList.toggle("active", state);
}




// Function to apply filters once sources initialised
function applyFiltersWhenSourcesReady() {
    const sourcesToCheck = [
        { sourceId: 'InfraPipelineData', filterFunction: filterData }
    ];


    let allSourcesReady = true;

    sourcesToCheck.forEach(source => {
        if (map.getSource(source.sourceId)) {
            // If source is ready, apply its filter
            source.filterFunction();
        } else {
            // If any source isn't ready, set the flag to retry
            allSourcesReady = false;
        }
    });

    // Retry if not all sources are ready
    if (!allSourcesReady) {
        setTimeout(applyFiltersWhenSourcesReady, 100); // Retry every 100ms
    }
}

applyFiltersWhenSourcesReady();