// Generic function to generate filters
function generateFilters(options) {
    const {
        containerId,
        filterClass,
        getValueFromFeature,
        sortFunction = null
    } = options;

    const filterContainer = document.getElementById(containerId);
    const uniqueValues = new Set();

    window.originalData.features.forEach(feature => {
        const value = getValueFromFeature(feature);
        uniqueValues.add(value && value.toString().trim() ? value : "Blank");
    });

    let sortedValues = Array.from(uniqueValues);
    
    // Apply custom sort if provided, otherwise use default sorting
    if (sortFunction) {
        sortedValues.sort(sortFunction);
    } else {
        sortedValues.sort();
        if (sortedValues.includes("Blank")) {
            sortedValues = ["Blank", ...sortedValues.filter(v => v !== "Blank")];
        }
    }

    filterContainer.innerHTML = "";

    // "Select All" option
    const selectAllLabel = document.createElement("label");
    selectAllLabel.textContent = "Select All";
    selectAllLabel.classList.add(filterClass);
    selectAllLabel.setAttribute("data-code", "selectAll");
    selectAllLabel.addEventListener("click", () => {
        const allFiltersActive = document.querySelectorAll(`.${filterClass}.active`).length === sortedValues.length + 1;
        document.querySelectorAll(`.${filterClass}`).forEach(label => label.classList.toggle("active", !allFiltersActive));
        filterData();
    });
    filterContainer.appendChild(selectAllLabel);

    sortedValues.forEach(value => {
        const label = document.createElement("label");
        label.textContent = value;
        label.setAttribute("data-code", value);
        label.classList.add(filterClass);
        
        if (value === "Blank") {
            label.style.fontStyle = "italic";
        }

        label.addEventListener("click", () => {
            label.classList.toggle("active");
            filterData();
        });
        filterContainer.appendChild(label);
    });
}

// Origin Filter
function generateOriginFilters() {
    generateFilters({
        containerId: "originFilterOptions",
        filterClass: "origin-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_or_program_origin || feature.properties.origin || "Blank"
    });
}

// Origin Filter Dropdown Toggle and Search
document.getElementById("originFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("originFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function originFilterSearchFunction() {
    const input = document.getElementById("originSearchInput").value.toLowerCase();
    document.querySelectorAll("#originFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Parent Program Filter
function generateParentProgramFilters() {
    generateFilters({
        containerId: "parentProgramFilterOptions",
        filterClass: "parent-program-filter",
        getValueFromFeature: (feature) => 
            feature.properties.parent_program || "Blank"
    });
}

// Parent Program Filter Dropdown Toggle and Search
document.getElementById("parentProgramFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("parentProgramFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function parentProgramFilterSearchFunction() {
    const input = document.getElementById("parentProgramSearchInput").value.toLowerCase();
    document.querySelectorAll("#parentProgramFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Child Program Filter
function generateChildProgramFilters() {
    generateFilters({
        containerId: "childProgramFilterOptions",
        filterClass: "child-program-filter",
        getValueFromFeature: (feature) => 
            feature.properties.child_program || "Blank"
    });
}

// Child Program Filter Dropdown Toggle and Search
document.getElementById("childProgramFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("childProgramFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function childProgramFilterSearchFunction() {
    const input = document.getElementById("childProgramSearchInput").value.toLowerCase();
    document.querySelectorAll("#childProgramFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Start Year Filter
function generateStartYearFilters() {
    generateFilters({
        containerId: "startYearFilterOptions",
        filterClass: "start-year-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_or_program_start_year || feature.properties.start_year || "Blank",
        sortFunction: (a, b) => {
            if (a === "Blank") return -1;
            if (b === "Blank") return 1;
            return parseInt(b) - parseInt(a); // Sort years in descending order, ensuring numeric comparison
        }
    });
}

// Start Year Filter Dropdown Toggle and Search
document.getElementById("startYearFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("startYearFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function startYearFilterSearchFunction() {
    const input = document.getElementById("startYearSearchInput").value.toLowerCase();
    document.querySelectorAll("#startYearFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Asset Category Filter
function generateAssetCategoryFilters() {
    generateFilters({
        containerId: "assetCategoryFilterOptions",
        filterClass: "asset-category-filter",
        getValueFromFeature: (feature) => 
            feature.properties.asset_category || "Blank"
    });
}

// Asset Category Filter Dropdown Toggle and Search
document.getElementById("assetCategoryFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("assetCategoryFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function assetCategoryFilterSearchFunction() {
    const input = document.getElementById("assetCategorySearchInput").value.toLowerCase();
    document.querySelectorAll("#assetCategoryFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Project Name Filter
function generateProjectNameFilters() {
    generateFilters({
        containerId: "projectNameFilterOptions",
        filterClass: "project-name-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_name || "Blank"
    });
}

// Project Name Filter Dropdown Toggle and Search
document.getElementById("projectNameFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("projectNameFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function projectNameFilterSearchFunction() {
    const input = document.getElementById("projectNameSearchInput").value.toLowerCase();
    document.querySelectorAll("#projectNameFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Project Sponsor Filter
function generateProjectSponsorFilters() {
    generateFilters({
        containerId: "projectSponsorFilterOptions",
        filterClass: "project-sponsor-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_sponsor || "Blank"
    });
}

// Project Sponsor Filter Dropdown Toggle and Search
document.getElementById("projectSponsorFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("projectSponsorFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function projectSponsorFilterSearchFunction() {
    const input = document.getElementById("projectSponsorSearchInput").value.toLowerCase();
    document.querySelectorAll("#projectSponsorFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Project Owner Filter
function generateProjectOwnerFilters() {
    generateFilters({
        containerId: "projectOwnerFilterOptions",
        filterClass: "project-owner-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_owner_by_role || "Blank"
    });
}

// Project Owner Filter Dropdown Toggle and Search
document.getElementById("projectOwnerFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("projectOwnerFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function projectOwnerFilterSearchFunction() {
    const input = document.getElementById("projectOwnerSearchInput").value.toLowerCase();
    document.querySelectorAll("#projectOwnerFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Project Type Filter
function generateProjectTypeFilters() {
    generateFilters({
        containerId: "projectTypeFilterOptions",
        filterClass: "project-type-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_type || "Blank"
    });
}

// Project Type Filter Dropdown Toggle and Search
document.getElementById("projectTypeFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("projectTypeFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function projectTypeFilterSearchFunction() {
    const input = document.getElementById("projectTypeSearchInput").value.toLowerCase();
    document.querySelectorAll("#projectTypeFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// In Flight Filter
function generateInFlightFilters() {
    generateFilters({
        containerId: "inFlightFilterOptions",
        filterClass: "in-flight-filter",
        getValueFromFeature: (feature) => 
            feature.properties.committed || "Blank"
    });
}

// In Flight Filter Dropdown Toggle and Search
document.getElementById("inFlightFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("inFlightFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function inFlightFilterSearchFunction() {
    const input = document.getElementById("inFlightSearchInput").value.toLowerCase();
    document.querySelectorAll("#inFlightFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Delivery Agent Filter
function generateDeliveryAgentFilters() {
    generateFilters({
        containerId: "deliveryAgentFilterOptions",
        filterClass: "delivery-agent-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_delivery_agent || "Blank"
    });
}

// Delivery Agent Filter Dropdown Toggle and Search
document.getElementById("deliveryAgentFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("deliveryAgentFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function deliveryAgentFilterSearchFunction() {
    const input = document.getElementById("deliveryAgentSearchInput").value.toLowerCase();
    document.querySelectorAll("#deliveryAgentFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Asset Expenditure Filter
function generateAssetExpenditureFilters() {
    generateFilters({
        containerId: "assetExpenditureFilterOptions",
        filterClass: "asset-expenditure-filter",
        getValueFromFeature: (feature) => 
            feature.properties.asset_expenditure_type || "Blank"
    });
}

// Asset Expenditure Filter Dropdown Toggle and Search
document.getElementById("assetExpenditureFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("assetExpenditureFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function assetExpenditureFilterSearchFunction() {
    const input = document.getElementById("assetExpenditureSearchInput").value.toLowerCase();
    document.querySelectorAll("#assetExpenditureFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Project Manager Filter
function generateProjectManagerFilters() {
    generateFilters({
        containerId: "projectManagerFilterOptions",
        filterClass: "project-manager-filter",
        getValueFromFeature: (feature) => 
            feature.properties.project_manager || "Blank"
    });
}

// Project Manager Filter Dropdown Toggle and Search
document.getElementById("projectManagerFilterDropdownButton").addEventListener("click", function () {
    const dropdown = document.getElementById("projectManagerFilterDropdown");
    dropdown.classList.toggle("show");
    this.classList.toggle("active");
});

function projectManagerFilterSearchFunction() {
    const input = document.getElementById("projectManagerSearchInput").value.toLowerCase();
    document.querySelectorAll("#projectManagerFilterOptions label").forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(input) ? "" : "none";
    });
}

// Initialize Filters on Page Load
document.addEventListener("DOMContentLoaded", () => {
    function initializeFilters() {
        if (window.originalData && window.originalData.features && window.originalData.features.length > 0) {
            generateOriginFilters();
            generateParentProgramFilters();
            generateChildProgramFilters();
            generateStartYearFilters();
            generateAssetCategoryFilters();
            generateProjectNameFilters();
            generateProjectSponsorFilters();
            generateProjectOwnerFilters();
            generateProjectTypeFilters();
            generateInFlightFilters();
            generateDeliveryAgentFilters();
            generateAssetExpenditureFilters();
            generateProjectManagerFilters();
        }
    }

    if (window.originalData && window.originalData.features) {
        initializeFilters();
    } else {
        let attempts = 0;
        const maxAttempts = 50;

        const checkDataInterval = setInterval(() => {
            if (window.originalData && window.originalData.features && window.originalData.features.length > 0) {
                clearInterval(checkDataInterval);
                initializeFilters();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkDataInterval);
            }
            attempts++;
        }, 500);
    }
});

