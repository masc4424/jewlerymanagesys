$(document).ready(function() {
    // Initialize Select2
    $('.select22').select2();
    
    // Initialize arrays and counters
    let addedStones = [];
    let stoneFormCounter = 0;
    let addedRawMaterials = [];
    let rawMaterialFormCounter = 0;
    let usedStoneIds = new Set(); // Track used stone IDs
    let usedMaterialIds = new Set(); // Track used material IDs
    
    // Load stone names and materials when page loads
    loadStoneNames();
    loadMaterials();
    
    // Load existing model data
    loadModelData();
    
    // Add Stone Used button click
    $('#addStoneButton').on('click', function() {
        addStoneForm();
    });
    
    // Add Raw Material button click
    $('#addRawMaterialButton').on('click', function() {
        addRawMaterialForm();
    });
    
    // Helper function to format numbers
    function formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        const parsed = parseFloat(num);
        // Check if the number has no decimal part or ends with .00
        return parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(2).replace(/\.00$/, '');
    }
    
    // Function to load existing model data
    function loadModelData() {
        const modelId = $('#model_id').val();
        
        $.ajax({
            url: `/get_model_details/${modelId}/`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log("Model data loaded:", data);
                if (data.model) {
                    $('#model_no').val(data.model.name); // Assuming there's an input field with ID model_name
    
                    // Set colors if it's a dropdown or multi-select
                    if (Array.isArray(data.model.colors)) {
                        $('#colors').val(data.model.colors).trigger('change'); // Assuming Select2 or multiselect
                    }
                    $('#length').val(data.model.length);
                    $('#breadth').val(data.model.breadth);
                    $('#weight').val(data.model.weight);

                    // Show existing image preview from server
                    if (data.model.model_image) {
                        const imageUrl = '/static/' + data.model.model_image.replace(/^\/?static\//, '');
                        $('#imagePreview').attr('src', imageUrl);
                        $('#previewContainer').removeClass('d-none');
                    } else {
                        $('#imagePreview').attr('src', '#');
                        $('#previewContainer').addClass('d-none');
                    }
                }
                
                // Load stone data
                if (data.stones && data.stones.length > 0) {
                    data.stones.forEach(stone => {
                        // Add to internal array
                        addedStones.push({
                            stone_id: stone.stone_id,
                            stone_name: stone.stone_name,
                            stone_type_id: stone.stone_type_id,
                            stone_type_name: stone.stone_type_name,
                            weight: stone.weight,
                            length: stone.length,
                            breadth: stone.breadth,
                            rate: stone.rate,
                            count: stone.count,
                            stone_type_detail_id: stone.stone_type_detail_id,
                            id: stone.id  // Store the stone relationship ID for updates
                        });
                        
                        // Add stone ID to used stones set
                        usedStoneIds.add(stone.stone_id.toString());
                        
                        // Add to display table
                        addStoneToTable(addedStones.length - 1);
                    });
                    
                    // Calculate stone totals
                    calculateTotalStoneDetails();
                }
                
                // Load raw material data
                if (data.raw_materials && data.raw_materials.length > 0) {
                    data.raw_materials.forEach(material => {
                        // Add to internal array
                        addedRawMaterials.push({
                            material_id: material.material_id,
                            material_name: material.material_name,
                            weight: material.weight,
                            rate: material.rate,
                            total_value: material.total_value,
                            id: material.id  // Store the material relationship ID for updates
                        });
                        
                        // Add material ID to used materials set
                        usedMaterialIds.add(material.material_id.toString());
                        
                        // Add to display table
                        addRawMaterialToTable(addedRawMaterials.length - 1);
                    });
                    
                    // Calculate raw material totals
                    calculateTotalRawMaterialDetails();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading model details:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load model details. Please try again later.',
                    icon: 'error'
                });
            }
        });
    }

    // Show preview on file selection
    $('#model_img').on('change', function (event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#imagePreview').attr('src', e.target.result);
                $('#previewContainer').removeClass('d-none');
            };
            reader.readAsDataURL(file);
        } else {
            $('#imagePreview').attr('src', '#');
            $('#previewContainer').addClass('d-none');
        }
    });
    
    // Function to add a stone to the display table
    function addStoneToTable(index) {
        const stone = addedStones[index];
        
        const newRow = `
            <tr data-index="${index}">
                <td>${stone.stone_name}</td>
                <td>${stone.stone_type_name}</td>
                <td>${formatNumber(stone.weight)}</td>
                <td>${formatNumber(stone.length)} x ${formatNumber(stone.breadth)}</td>
                <td>${formatNumber(stone.rate)}</td>
                <td>${stone.count}</td>
                <td>
                    <button type="button" class="btn bg-label-danger btn-sm remove-stone">Remove</button>
                </td>
            </tr>
        `;
        
        $('#savedStonesTable tbody').append(newRow);
    }
    
    // Function to add a raw material to the display table
    function addRawMaterialToTable(index) {
        const material = addedRawMaterials[index];
        
        const newRow = `
            <tr data-index="${index}">
                <td>${material.material_name}</td>
                <td>${formatNumber(material.weight)}</td>
                <td>${material.rate ? formatNumber(material.rate) : 'N/A'}</td>
                <td>${material.total_value ? formatNumber(material.total_value) : 'N/A'}</td>
                <td>
                    <button type="button" class="btn bg-label-danger btn-sm remove-raw-material">Remove</button>
                </td>
            </tr>
        `;
        
        $('#savedRawMaterialsTable tbody').append(newRow);
    }
    
    // Function to calculate total stone details
    function calculateTotalStoneDetails() {
        let totalRate = 0;
        let totalWeight = 0;

        addedStones.forEach(stone => {
            const stoneRate = parseFloat(stone.rate || 0);
            const stoneWeight = parseFloat(stone.weight || 0) * parseInt(stone.count || 1);
            totalRate += stoneRate * parseInt(stone.count || 1);
            totalWeight += stoneWeight;
        });

        // Update total rate with rupee icon
        $('#totalStoneRate').html('<i class="bx bx-rupee fs-big"></i> ' + formatNumber(totalRate));
        
        // Update total weight with "gm" suffix
        $('#totalStoneWeight').text(formatNumber(totalWeight) + ' gm');
    }
    
    // Function to calculate total raw material details
    function calculateTotalRawMaterialDetails() {
        let totalWeight = 0;
        let totalValue = 0;

        addedRawMaterials.forEach(material => {
            totalWeight += parseFloat(material.weight || 0);
            totalValue += parseFloat(material.total_value || 0);
        });

        // Update total weight
        $('#totalRawMaterialWeight').text(formatNumber(totalWeight) + ' gm');
        
        // Update total value with rupee icon
        $('#totalRawMaterialValue').html('<i class="bx bx-rupee fs-big"></i> ' + formatNumber(totalValue));
    }
    
    // Function to load stone names from the database
    function loadStoneNames() {
        $.ajax({
            url: '/get_stones/',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log("Stones loaded successfully:", data);
                window.stoneData = data;
                
                $('.stone-name-select').each(function() {
                    populateStoneDropdown($(this));
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading stones:', error);
                alert('Failed to load stone data. Please refresh the page.');
            }
        });
    }
    
    // Function to populate a stone dropdown with data
    function populateStoneDropdown(select) {
        select.find('option:not(:first)').remove();
        
        if (window.stoneData && window.stoneData.length > 0) {
            $.each(window.stoneData, function(i, stone) {
                // Include stones that are already used in this model
                if (!usedStoneIds.has(stone.id.toString()) || stoneIsInModel(stone.id)) {
                    select.append($('<option>', {
                        value: stone.id,
                        text: stone.name
                    }));
                }
            });
        } else {
            $.ajax({
                url: '/get_stones/',
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log("Stones loaded for dropdown:", data);
                    $.each(data, function(i, stone) {
                        // Include stones that are already used in this model
                        if (!usedStoneIds.has(stone.id.toString()) || stoneIsInModel(stone.id)) {
                            select.append($('<option>', {
                                value: stone.id,
                                text: stone.name
                            }));
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Error loading stones for dropdown:', error);
                }
            });
        }
    }
    
    // Check if stone is already in this model (so we can edit it)
    function stoneIsInModel(stoneId) {
        return addedStones.some(stone => stone.stone_id.toString() === stoneId.toString());
    }
    
    // Check if material is already in this model (so we can edit it)
    function materialIsInModel(materialId) {
        return addedRawMaterials.some(material => material.material_id.toString() === materialId.toString());
    }
    
    // Function to load materials from the database
    function loadMaterials() {
        $.ajax({
            url: '/get_materials/',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log("Materials loaded successfully:", data);
                window.materialData = data;
                
                $('.raw-material-select').each(function() {
                    populateMaterialDropdown($(this));
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading materials:', error);
                alert('Failed to load material data. Please refresh the page.');
            }
        });
    }
    $('#updateModelForm').on('submit', function(e) {
        e.preventDefault();  // Prevent default form submission

        const modelId = $('#model_id').val();  // Hidden input field
        const jewelryTypeId = $('#jewelry_type').val();
        const formData = new FormData(this);
        formData.append('jewelry_type', jewelryTypeId);

        const colorSelections = $('#colors').val();
        formData.delete('colors');
        colorSelections.forEach(color => {
            formData.append('colors[]', color);
        });

        formData.append('stones', JSON.stringify(addedStones));
        formData.append('raw_materials', JSON.stringify(addedRawMaterials));

        $.ajax({
            url: `/model_edit/${modelId}/`,  // Your Django endpoint
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                Swal.fire({
                    title: 'Success!',
                    text: response.message || 'Model updated successfully',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    if (response.model && response.model.jewelry_type_name) {
                        window.location.href = `/product_list/${response.model.jewelry_type_name}/`;
                    } else {
                        window.history.back();
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Update error:', xhr.responseJSON || error);
                Swal.fire({
                    title: 'Error!',
                    text: xhr.responseJSON?.error || 'Failed to update model',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    });
    

});
    // // Function to populate material dropdown
    // function populateMaterialDropdown(select) {
    //     select.find('option:not(:first)').remove();
        
    //     if (window.materialData && window.materialData.length > 0) {
    //         $.each(window.materialData, function(i, material) {
    //             // Include materials that are already used in this model
    //             if (!usedMaterialIds.has(material.id.toString()) || materialIsInModel(material.id)) {
    //                 select.append($('<option>', {
    //                     value: material.id,
    //                     text: material.name