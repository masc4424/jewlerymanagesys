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
}

function renderStoneCard(stone) {
    let stoneCard = `
        <div class="col-lg-6 col-12 mb-3">
            <div class="card shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${stone.stone_name}</h5>
                    <div>
                        <span class="badge bg-primary">${stone.percentage_in_model}%</span>
                        <span class="badge bg-secondary">&#8593;</span>
                        <span class="badge bg-secondary">gm</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="progress mb-3">
                        <div class="progress-bar" role="progressbar" style="width: ${stone.percentage_in_model}%;" 
                            aria-valuenow="${stone.percentage_in_model}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div class="stone-types">`;
    
    // Add stone types
    stone.stone_distribution.forEach(function(type) {
        stoneCard += `
            <div class="p-2 mb-2 bg-light rounded">
                <div class="d-flex justify-content-between mb-2">
                    <div>${type.type_name}</div>
                    <div>
                        <span class="badge bg-secondary">${type.percentage_in_stone}%</span>
                        <span class="badge bg-secondary">&#8593;</span>
                        <span class="badge bg-secondary">gm</span>
                    </div>
                </div>
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: ${type.percentage_in_stone}%;" 
                        aria-valuenow="${type.percentage_in_stone}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>`;
        
        // Add details for each type
        type.distribution.forEach(function(detail) {
            stoneCard += `
                <div class="p-2 mb-1 border rounded bg-white">
                    <div class="row">
                        <div class="col-6">
                            <small>Shape: ${detail.shape}</small>
                        </div>
                        <div class="col-6">
                            <small>Weight: ${detail.weight} gm</small>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-6">
                            <small>Size: ${detail.length} x ${detail.breadth}</small>
                        </div>
                        <div class="col-6">
                            <small>Rate: ${detail.rate}</small>
                        </div>
                    </div>
                    <div class="progress mt-1" style="height: 6px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${detail.percentage}%;" 
                            aria-valuenow="${detail.percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>`;
        });
        
        stoneCard += `
            </div>`;
    });
    
    stoneCard += `
                </div>
            </div>
        </div>
    `;
    
    $('#stones-container').append(stoneCard);
}

function renderMaterialCard(material) {
    let materialCard = `
        <div class="col-lg-3 col-md-6 col-12 mb-3">
            <div class="card shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${material.metal_name}</h5>
                    <div>
                        <span class="badge bg-primary">${material.percentage_in_model}%</span>
                        <span class="badge bg-secondary">&#8593;</span>
                        <span class="badge bg-secondary">gm</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="progress mb-3">
                        <div class="progress-bar" role="progressbar" style="width: ${material.percentage_in_model}%;" 
                            aria-valuenow="${material.percentage_in_model}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <p><strong>ID:</strong> ${material.metal_unique_id}</p>
                    <p><strong>Weight:</strong> ${material.total_weight} gm</p>`;
    
    // Add rate information if available
    if (material.latest_rate) {
        materialCard += `
                    <p><strong>Latest Rate:</strong> ${material.latest_rate} ${material.rate_currency}/${material.rate_unit}</p>
                    <p><strong>Rate Date:</strong> ${material.rate_date}</p>`;
    }
    
    materialCard += `
                </div>
            </div>
        </div>
    `;
    
    $('#materials-container').append(materialCard);
}