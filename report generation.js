function formatDate(dateString) {
    if (!dateString || dateString === "Unknown") return "Unknown";
    
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;

    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
}


// Function to generate the PDF report
function generatePDFReport() {
    const mapSource = map.getSource('CapitalWorksData');

    if (!mapSource || !mapSource._data || !Array.isArray(mapSource._data.features)) {
        console.error("GeoJSON data not loaded or invalid.");
        return;
    }

    // Filter features with valid geometry only
    const filteredFeatures = mapSource._data.features.filter(feature => 
        feature.geometry && feature.geometry.coordinates && feature.geometry.type
    );
    const summary = window.filteredData;

    if (!filteredFeatures.length) {
        console.error("No filtered features available.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Report Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Capital Works Summary", 10, 10);

    let yPosition = 20;

    // Summary Totals
    doc.setFontSize(12);
    const totals = [
        `Total Projects: ${summary.totalProjects.toLocaleString()}`,
    ];

    totals.forEach(line => {
        doc.text(line, 14, yPosition);
        yPosition += 6;
    });

    // Audit Table Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);


    // Build table rows from child audits under each parent feature
    const tableData = [];

    filteredFeatures.forEach((feature, index) => {
        const p = feature.properties;
        const projectName = p.project_name;
        const program = projectName.toUpperCase().includes('MCW') ? 'MCW' : (p.program || '');
        const civilOpsStaff = p.name_of_civil_operations_staff_assigned_to_deliver_the_proje || "Unassigned";

        tableData.push([
            projectName || "Unnamed Project",
            p.status,
            program,
            p.type_of_work,
            civilOpsStaff,
            p.name_of_contractor_undertaking_works,
            formatCurrency(p.total_cost)
        ]);
    });


    doc.autoTable({
        startY: yPosition + 3,
        head: [['Project Name', 'Status', 'Program', 'Type of Work', 'Civil Operations Staff', 'Contractor', 'Project Cost']],
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: [200, 200, 200],
        },
        margin: { top: yPosition },
        columnStyles: {
            0: { cellWidth: 50 }, // Project Name
            1: { cellWidth: 20 }, // Status
            2: { cellWidth: 22 }, // Program
            3: { cellWidth: 30 }, // Type of Work
            4: { cellWidth: 20 }, // Civil Ops Staff
            5: { cellWidth: 20 },  // Contractor
            6: { cellWidth: 20 }  // Project Cost
        }
    });

    doc.save("Capital Works Summary Report.pdf");
}




// Function to generate Excel report
function generateExcelReport() {
    const data = window.filteredData;
    const mapSource = map.getSource('CapitalWorksData');

    if (!mapSource || !mapSource._data || !mapSource._data.features) {
        console.error("GeoJSON data not loaded or invalid.");
        return;
    }

    const filteredFeatures = mapSource._data.features;

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: "Capital Works Summary Report",
        Author: "Johnston Wang",
        CreatedDate: new Date()
    };

    // Headers for table
    const tableHeaders = [
        'Project Name', 'Status', 'Program', 'Type of Work', 'Civil Operations Staff', 'Contractor', 'Project Cost', 'Financial Year'
    ];

    // Capital Works Data Sheet - start with title row, empty row, then headers
    const tableData = [
        ['Capital Works Summary'], // Title row
        [], // Empty row
        tableHeaders // Header row
    ];

    filteredFeatures.forEach(feature => {
        addFeatureRowToExcel(tableData, feature, tableHeaders);
    });

    const sheet = XLSX.utils.aoa_to_sheet(tableData);
    formatExcelSheet(sheet, tableData, tableHeaders.length, 'Capital Works');
    XLSX.utils.book_append_sheet(wb, sheet, "Capital Works");

    // Write to file
    XLSX.writeFile(wb, "Capital_Works_Summary_Report.xlsx");
}


function formatExcelSheet(ws, wsData, columnCount, pageType) {
    // Set column widths for Capital Works data
    const columnWidths = Array(columnCount).fill({ wpx: 135 });
    columnWidths[0] = { wpx: 400 }; // Project Name
    columnWidths[1] = { wpx: 120 }; // Status
    columnWidths[2] = { wpx: 200 }; // Program
    columnWidths[3] = { wpx: 180 }; // Type of Work
    columnWidths[4] = { wpx: 150 }; // Civil Ops Staff
    columnWidths[5] = { wpx: 200 }; // Contractor
    columnWidths[6] = { wpx: 100 }; // Project Cost
    columnWidths[7] = { wpx: 100 }; // Financial Year
    ws['!cols'] = columnWidths;

    // Title formatting
    const titleRowIdx = 0;
    const titleCell = XLSX.utils.encode_cell({ r: titleRowIdx, c: 0 });
    ws[titleCell] = ws[titleCell] || {};
    ws[titleCell].v = 'Capital Works Summary';
    ws[titleCell].s = {
        font: { bold: true, sz: 22 },
        alignment: { horizontal: "left", vertical: "center" }
    };

    // Merge title row
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({
        s: { r: titleRowIdx, c: 0 },
        e: { r: titleRowIdx, c: columnCount - 1 }
    });

    // Header row index
    const headerRowIdx = 2;

    for (let colIdx = 0; colIdx < columnCount; colIdx++) {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
        ws[cellAddress] = ws[cellAddress] || {};
        ws[cellAddress].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "344152" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: 'medium', color: { rgb: "000000" } },
                bottom: { style: 'medium', color: { rgb: "000000" } },
                left: { style: 'medium', color: { rgb: "000000" } },
                right: { style: 'medium', color: { rgb: "000000" } }
            }
        };
    }

    // Data rows start at row 3
    const dataStartRowIdx = 3;
    const dataEndRowIdx = dataStartRowIdx + wsData.length;

    for (let rowIdx = dataStartRowIdx; rowIdx < dataEndRowIdx; rowIdx++) {
        for (let colIdx = 0; colIdx < columnCount; colIdx++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
            ws[cellAddress] = ws[cellAddress] || {};
            ws[cellAddress].s = ws[cellAddress].s || {};

            // Border for all data cells
            ws[cellAddress].s.border = {
                top: { style: 'thin', color: { rgb: "000000" } },
                bottom: { style: 'thin', color: { rgb: "000000" } },
                left: { style: 'thin', color: { rgb: "000000" } },
                right: { style: 'thin', color: { rgb: "000000" } }
            };

            // Alternating row color
            if ((rowIdx - dataStartRowIdx) % 2 === 0) {
                ws[cellAddress].s.fill = { fgColor: { rgb: "F8F9FA" } };
            }

            // Center alignment for Status and Program
            if (colIdx === 1 || colIdx === 2) {
                ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
            } else {
                ws[cellAddress].s.alignment = { horizontal: "left", vertical: "center" };
            }
        }
    }

    // Apply thick border around the full table (header + data)
    for (let rowIdx = headerRowIdx; rowIdx < dataEndRowIdx; rowIdx++) {
        for (let colIdx = 0; colIdx < columnCount; colIdx++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
            ws[cellAddress] = ws[cellAddress] || {};
            ws[cellAddress].s = ws[cellAddress].s || {};
            ws[cellAddress].s.border = ws[cellAddress].s.border || {};

            if (rowIdx === headerRowIdx) {
                ws[cellAddress].s.border.top = { style: 'thick', color: { rgb: "000000" } };
            }
            if (rowIdx === dataEndRowIdx - 1) {
                ws[cellAddress].s.border.bottom = { style: 'thick', color: { rgb: "000000" } };
            }
            if (colIdx === 0) {
                ws[cellAddress].s.border.left = { style: 'thick', color: { rgb: "000000" } };
            }
            if (colIdx === columnCount - 1) {
                ws[cellAddress].s.border.right = { style: 'thick', color: { rgb: "000000" } };
            }
        }
    }
}



function addFeatureRowToExcel(wsData, feature, headers) {
    if (!feature.geometry || !feature.geometry.coordinates || !feature.geometry.type) {
        return;
    }

    const properties = feature.properties || {};

    const row = headers.map(header => {
        switch (header) {
            case 'Project Name': 
                return properties.project_name || "Unnamed Project";
            case 'Status': 
                return properties.status || '';
            case 'Program': {
                const projectName = properties.project_name || '';
                return projectName.toUpperCase().includes('MCW') ? 'MCW' : (properties.program || '');
            }
            case 'Type of Work': 
                return properties.type_of_work || '';
            case 'Civil Operations Staff': 
                return properties.name_of_civil_operations_staff_assigned_to_deliver_the_proje || '';
            case 'Contractor': 
                return properties.name_of_contractor_undertaking_works || '';
            case 'Project Cost': 
                return properties.project_cost || '';
            case 'Financial Year':
                return properties.what_financial_year_is_this_project_allocated_to || '';
            default:
                return '';
        }
    });

    wsData.push(row);
}






// Get the button and the dropdown
const generateReportButton = document.getElementById('generateReportsDropdownButton');
const reportDropdown = document.getElementById('reportFormatDropdown');

// Toggle dropdown visibility
generateReportButton.addEventListener('click', function() {
    generateReportButton.classList.toggle('active');
    reportDropdown.classList.toggle('show');
  });
  
  // Add event listeners to the buttons for generating reports
  document.getElementById('generatePDFButton').addEventListener('click', generatePDFReport);
  document.getElementById('generateExcelButton').addEventListener('click', generateExcelReport);
