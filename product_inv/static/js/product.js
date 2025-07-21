// Modified product.js file
$(document).ready(function() {
    console.log("Model No:", modelNo);

    // Fetch product data using modelNo
    fetchProductData(modelNo);
});
// On badge click (stone or stone type)
// $(document).on('click', '.stone-count-badge, .type-count-badge', function (e) {
//     e.preventDefault();

//     const isStone = $(this).hasClass('stone-count-badge');
//     const data = $(this).data(isStone ? 'stone' : 'type');

//     // Hide any open offcanvas
//     $('.offcanvas').each(function () {
//         const offcanvasInstance = bootstrap.Offcanvas.getInstance(this);
//         if (offcanvasInstance) {
//             offcanvasInstance.hide();
//         }
//     });
//     $('#clientSideModalTemp, #clientSideModal').remove();
//     $('.modal-backdrop, .offcanvas-backdrop').remove();
//     $('body').removeClass('modal-open offcanvas-open');

//     // Show temporary loading offcanvas
//     $('body').append(`
//         <div class="offcanvas offcanvas-end" tabindex="-1" id="clientSideModalTemp">
//             <div class="offcanvas-header">
//                 <h5 class="offcanvas-title">Loading...</h5>
//                 <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
//             </div>
//             <div class="offcanvas-body text-center">
//                 <div class="spinner-border text-primary" role="status"></div>
//             </div>
//         </div>
//     `);
//     const tempModal = new bootstrap.Offcanvas(document.getElementById('clientSideModalTemp'));
//     tempModal.show();

//     // Create content for side modal
//     let htmlContent = `
//         <div class="offcanvas offcanvas-end" tabindex="-1" id="clientSideModal">
//             <div class="offcanvas-header">
//                 <h5 class="offcanvas-title">${isStone ? data.stone_name : data.type_name} </h5>
//                 <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
//             </div>
//             <div class="offcanvas-body">
//     `;

//     if (isStone) {
//         htmlContent += `<p>Total Count: <strong>${data.total_count}</strong></p>`;
//         data.stone_distribution.forEach(type => {
//             if (type.count > 0) {
//                 htmlContent += `<div class="mb-2"><strong>${type.type_name} (${type.count} )</strong><ul>`;
//                 type.distribution.forEach(detail => {
//                     if (detail.count > 0) {
//                         htmlContent += `<li>${detail.length}x${detail.breadth}mm - ${detail.count} </li>`;
//                     }
//                 });
//                 htmlContent += `</ul></div>`;
//             }
//         });
//     } else {
//         htmlContent += `<p>Total Count: <strong>${data.count}</strong></p><ul>`;
//         data.distribution.forEach(detail => {
//             if (detail.count > 0) {
//                 htmlContent += `<li>${detail.length}x${detail.breadth}mm - ${detail.count} </li>`;
//             }
//         });
//         htmlContent += `</ul>`;
//     }

//     htmlContent += `
//             </div>
//         </div>
//     `;

//     setTimeout(() => {
//         $('#clientSideModalTemp').remove();
//         $('#clientSideModal').remove();
//         $('.offcanvas-backdrop').remove();
//         $('#clientSideModalPlaceholder').html(htmlContent);
//         const finalModal = new bootstrap.Offcanvas(document.getElementById('clientSideModal'));
//         finalModal.show();
//     }, 400); // Simulate async delay
// });
$(document).on('click', '.stone-count-badge, .type-count-badge', function (e) {
    e.preventDefault();
    const isStone = $(this).hasClass('stone-count-badge');
    const data = $(this).data(isStone ? 'stone' : 'type');
    
    // Hide any open offcanvas
    $('.offcanvas').each(function () {
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(this);
        if (offcanvasInstance) {
            offcanvasInstance.hide();
        }
    });
    
    $('#clientSideModalTemp, #clientSideModal').remove();
    $('.modal-backdrop, .offcanvas-backdrop').remove();
    $('body').removeClass('modal-open offcanvas-open');
    
    // Show temporary loading offcanvas
    $('body').append(`
        <div class="offcanvas offcanvas-end" tabindex="-1" id="clientSideModalTemp">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">Loading...</h5>
                <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body text-center">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
        </div>
    `);
    
    const tempModal = new bootstrap.Offcanvas(document.getElementById('clientSideModalTemp'));
    tempModal.show();
    
    // Create content for side modal
    let htmlContent = `
        <div class="offcanvas offcanvas-end" tabindex="-1" id="clientSideModal">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">${isStone ? data.stone_name : data.type_name}</h5>
                <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body">
    `;
    
    if (isStone) {
        htmlContent += `<p>Total Stone Count: <strong>${data.total_count}</strong></p>`;
        
        data.stone_distribution.forEach(type => {
            if (type.count > 0) {
                // Count unique dimensions for THIS specific type
                const dimensionCount = type.distribution.filter(detail => detail.count > 0).length;
                
                htmlContent += `<div class="mb-2"><strong>${type.type_name} (${dimensionCount} dimensions)</strong><ul>`;
                type.distribution.forEach(detail => {
                    if (detail.count > 0) {
                        htmlContent += `<li>${detail.length}x${detail.breadth}mm - ${detail.count}</li>`;
                    }
                });
                htmlContent += `</ul></div>`;
            }
        });
    } else {
        // Count unique dimensions for type
        const dimensionCount = data.distribution.filter(detail => detail.count > 0).length;
        
        htmlContent += `<p>Total Stone Count: <strong>${data.count}</strong></p>`;
        htmlContent += `<p>Dimensions: <strong>${dimensionCount}</strong></p>`;
        htmlContent += `<ul>`;
        
        data.distribution.forEach(detail => {
            if (detail.count > 0) {
                htmlContent += `<li>${detail.length}x${detail.breadth}mm - ${detail.count}</li>`;
            }
        });
        htmlContent += `</ul>`;
    }
    
    htmlContent += `
            </div>
        </div>
    `;
    
    setTimeout(() => {
        $('#clientSideModalTemp').remove();
        $('#clientSideModal').remove();
        $('.offcanvas-backdrop').remove();
        $('#clientSideModalPlaceholder').html(htmlContent);
        const finalModal = new bootstrap.Offcanvas(document.getElementById('clientSideModal'));
        finalModal.show();
    }, 400); // Simulate async delay
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
                <div class="card-header bg-white justify-content-between align-items-center">
                    <h5 class="mb-2">${stone.stone_name} 
                        <span class="badge bg-label-primary ms-2 stone-count-badge" data-stone='${JSON.stringify(stone)}'>${stone.total_count}</span>
                    </h5>

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
                    <div class="justify-content-between mb-2">
                        <div class="mb-2">${type.type_name} 
                            <span class="badge bg-label-info ms-2 type-count-badge" data-type='${JSON.stringify(type)}'>${type.count} </span>
                        </div>

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
                <div class="card-header bg-white justify-content-between align-items-center">
                    <h5 class="mb-2">${material.metal_name}</h5>
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