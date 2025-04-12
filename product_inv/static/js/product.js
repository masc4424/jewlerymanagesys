// Modified product.js file
$(document).ready(function() {
    console.log("Model No:", modelNo);

    // Fetch product data using modelNo
    fetchProductData(modelNo);
});

function fetchProductData(modelNo) {
    $.ajax({
        url: '/stone-distribution/' + modelNo + '/',
        method: 'GET',
        success: function(response) {
            // Process the data when API call succeeds
            processProductData(response.stone_and_material_distribution);
        },
        error: function(error) {
            console.error('Error fetching data:', error);
            $('#loading-spinner').html('<div class="alert alert-danger">Error loading product data.</div>');
        }
    });
}

// Color palette for the charts
const colorPalette = [
    { background: 'rgba(255, 99, 132, 0.8)', border: 'rgba(255, 99, 132, 1)' },
    { background: 'rgba(54, 162, 235, 0.8)', border: 'rgba(54, 162, 235, 1)' },
    { background: 'rgba(255, 206, 86, 0.8)', border: 'rgba(255, 206, 86, 1)' },
    { background: 'rgba(75, 192, 192, 0.8)', border: 'rgba(75, 192, 192, 1)' },
    { background: 'rgba(153, 102, 255, 0.8)', border: 'rgba(153, 102, 255, 1)' },
    { background: 'rgba(255, 159, 64, 0.8)', border: 'rgba(255, 159, 64, 1)' },
    { background: 'rgba(199, 199, 199, 0.8)', border: 'rgba(199, 199, 199, 1)' },
    { background: 'rgba(83, 102, 255, 0.8)', border: 'rgba(83, 102, 255, 1)' }
];

function processProductData(data) {
    // Hide the loading spinner
    $('#loading-spinner').hide();
    
    // Show the content
    $('#product-content').removeClass('d-none');
    
    // Process stone data
    if (data.stone_data && data.stone_data.length > 0) {
        // Update stones count
        $('#stones-count').text(data.stone_data.length);
        
        // Clear the container
        $('#stones-container').empty();
        
        // Add each stone
        data.stone_data.forEach(function(stone) {
            renderStoneCard(stone);
        });
    }
    
    // Process material data
    if (data.material_data && data.material_data.length > 0) {
        // Clear the container
        $('#materials-container').empty();
        
        // Add each material
        data.material_data.forEach(function(material) {
            renderMaterialCard(material);
        });
    }
    
    // Create main charts for overall distribution
    createOverallStoneChart(data.stone_data);
    createOverallMaterialChart(data.material_data);
}

function createOverallStoneChart(stoneData) {
    if (!stoneData || stoneData.length === 0) {
        // No stone data available
        document.getElementById('stoneChart').parentElement.style.display = 'none';
        return;
    }
    
    const chartLabels = [];
    const chartData = [];
    const backgroundColors = [];
    const borderColors = [];
    
    // Process stone data
    stoneData.forEach(function(stone, index) {
        chartLabels.push(stone.stone_name);
        chartData.push(stone.percentage_in_model);
        
        // Generate color based on index
        const colorIndex = index % colorPalette.length;
        backgroundColors.push(colorPalette[colorIndex].background);
        borderColors.push(colorPalette[colorIndex].border);
    });
    
    // Create stone chart
    const stoneCtx = document.getElementById('stoneChart');
    new Chart(stoneCtx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Stone Distribution (%)',
                data: chartData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

function createOverallMaterialChart(materialData) {
    if (!materialData || materialData.length === 0) {
        // No material data available
        document.getElementById('materialChart').parentElement.style.display = 'none';
        return;
    }
    
    const chartLabels = [];
    const chartData = [];
    const backgroundColors = [];
    const borderColors = [];
    
    // Process material data
    materialData.forEach(function(material, index) {
        chartLabels.push(material.metal_name);
        chartData.push(material.percentage_in_model);
        
        // Generate color based on index
        const colorIndex = index % colorPalette.length;
        backgroundColors.push(colorPalette[colorIndex].background);
        borderColors.push(colorPalette[colorIndex].border);
    });
    
    // Create material chart
    const materialCtx = document.getElementById('materialChart');
    new Chart(materialCtx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Material Distribution (%)',
                data: chartData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

function createStoneTypeChart(stoneId, stoneTypes) {
    if (!stoneTypes || stoneTypes.length === 0) {
        return;
    }
    
    const chartLabels = [];
    const chartData = [];
    const backgroundColors = [];
    const borderColors = [];
    
    // Process stone type data
    stoneTypes.forEach(function(type, index) {
        chartLabels.push(type.type_name);
        chartData.push(type.percentage_in_stone);
        
        // Generate color based on index
        const colorIndex = index % colorPalette.length;
        backgroundColors.push(colorPalette[colorIndex].background);
        borderColors.push(colorPalette[colorIndex].border);
    });
    
    // Create stone type distribution chart
    const stoneTypeCtx = document.getElementById(`stoneTypeChart-${stoneId}`);
    new Chart(stoneTypeCtx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Type Distribution (%)',
                data: chartData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        font: {
                            size: 9
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

function renderStoneCard(stone) {
    // Generate a unique ID for this stone
    const stoneId = `stone-${stone.stone_name.replace(/\s+/g, '-').toLowerCase()}`;
    
    let stoneCard = `
        <div class="stone-card">
            <div class="card shadow-sm h-100">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${stone.stone_name}</h5>
                    <div>
                        <span class="badge bg-label-primary">${stone.percentage_in_model}%</span>
                        <span class="badge bg-label-secondary">${stone.total_rate}&#8377;</span>
                        <span class="badge bg-label-secondary">${stone.total_weight}gm</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <!-- Chart section -->
                        <div class="col-12 mb-3">
                            <div style="height: 150px; width: 100%;">
                                <canvas id="stoneTypeChart-${stoneId}"></canvas>
                            </div>
                        </div>
                        
                        <!-- Details section -->
                        <div class="col-12">
                            <div class="stone-types custom-scrollbar" style="max-height: 150px; overflow-y: auto;">`;
    
    // Add stone types
    stone.stone_distribution.forEach(function(type) {
        stoneCard += `
                <div class="p-2 mb-2 bg-light rounded">
                    <div class="d-flex justify-content-between mb-2">
                        <div>${type.type_name}</div>
                        <div>
                            <span class="badge bg-secondary">${type.percentage_in_stone}%</span>
                            <span class="badge bg-secondary">${type.type_stone_total_rate}&#8377;</span>
                            <span class="badge bg-secondary">${type.type_stone_total_weight}gm</span>
                        </div>
                    </div>
                </div>`;
    });
    
    stoneCard += `
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#stones-container').append(stoneCard);
    
    // Create chart for this stone's type distribution
    setTimeout(() => {
        createStoneTypeChart(stoneId, stone.stone_distribution);
    }, 100);
}

function renderMaterialCard(material) {
    // Generate a unique ID for this material
    const materialId = `material-${material.metal_name.replace(/\s+/g, '-').toLowerCase()}`;
    
    let materialCard = `
        <div class="col-12 col-md-6 mb-3">
            <div class="card shadow-sm material-card">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${material.metal_name}</h5>
                    <div>
                        <span class="badge bg-label-primary">${material.percentage_in_model}%</span>
                        <span class="badge bg-label-secondary">${material.total_weight}gm</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row align-items-center">`;
    
    // Add rate information if available
    if (material.latest_rate) {
        materialCard += `
                        <div class="col-12 mb-3">
                            <p class="mb-1"><strong>Latest Rate:</strong> ${material.latest_rate} ${material.rate_currency}/${material.rate_unit}</p>
                            <p class="mb-0"><strong>Rate Date:</strong> ${material.rate_date}</p>
                        </div>`;
    }
    
    materialCard += `
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#materials-container').append(materialCard);
}