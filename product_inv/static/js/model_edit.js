$(document).ready(function() {
    // Initialize Select2
    $('.select22').select2();
    if ($('#previewContainer').length) {
        // If the image inside doesn't have a src or has an empty src, hide the container
        const imgSrc = $('#imagePreview').attr('src');
        if (!imgSrc || imgSrc === '#' || imgSrc === '') {
            // Hide the preview container with direct CSS
            $('#previewContainer').addClass('d-none');
            // Remove the src attribute completely
            $('#imagePreview').removeAttr('src');
        }
    }
    // When the image preview is clicked, show it in the modal
    $('#imagePreview').on('click', function () {
        const src = $(this).attr('src');
        $('#modalImage').attr('src', src);
    });

    
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
    
    // // Function to load existing model data
    // function loadModelData() {
    //     const modelId = $('#model_id').val();
        
    //     $.ajax({
    //         url: `/get_model_details/${modelId}/`,
    //         type: 'GET',
    //         dataType: 'json',
    //         success: function(data) {
    //             console.log("Model data loaded:", data);
    //             if (data.model) {
    //                 $('#model_no').val(data.model.name); // Assuming there's an input field with ID model_name
    
    //                 // Set colors if it's a dropdown or multi-select
    //                 if (Array.isArray(data.model.colors)) {
    //                     $('#colors').val(data.model.colors).trigger('change'); // Assuming Select2 or multiselect
    //                 }
    //                 $('#length').val(data.model.length);
    //                 $('#breadth').val(data.model.breadth);
    //                 $('#weight').val(data.model.weight);

    //                 // Show existing image preview from server
    //                 if (data.model.model_image) {
    //                     const imageUrl = '/static/' + data.model.model_image.replace(/^\/?static\//, '');
    //                     $('#imagePreview').attr('src', imageUrl);
    //                     $('#previewContainer').removeClass('d-none');
    //                 } else {
    //                     $('#imagePreview').attr('src', '#');
    //                     $('#previewContainer').addClass('d-none');
    //                 }
    //             }
                
    //             // Load stone data
    //             if (data.stones && data.stones.length > 0) {
    //                 data.stones.forEach(stone => {
    //                     // Add to internal array
    //                     addedStones.push({
    //                         stone_id: stone.stone_id,
    //                         stone_name: stone.stone_name,
    //                         stone_type_id: stone.stone_type_id,
    //                         stone_type_name: stone.stone_type_name,
    //                         weight: stone.weight,
    //                         length: stone.length,
    //                         breadth: stone.breadth,
    //                         rate: stone.rate,
    //                         count: stone.count,
    //                         stone_type_detail_id: stone.stone_type_detail_id,
    //                         id: stone.id  // Store the stone relationship ID for updates
    //                     });
                        
    //                     // Add stone ID to used stones set
    //                     usedStoneIds.add(stone.stone_id.toString());
                        
    //                     // Add to display table
    //                     addStoneToTable(addedStones.length - 1);
    //                 });
                    
    //                 // Calculate stone totals
    //                 calculateTotalStoneDetails();
    //             }
                
    //             // Load raw material data
    //             if (data.raw_materials && data.raw_materials.length > 0) {
    //                 data.raw_materials.forEach(material => {
    //                     // Add to internal array
    //                     addedRawMaterials.push({
    //                         material_id: material.material_id,
    //                         material_name: material.material_name,
    //                         weight: material.weight,
    //                         rate: material.rate,
    //                         total_value: material.total_value,
    //                         id: material.id  // Store the material relationship ID for updates
    //                     });
                        
    //                     // Add material ID to used materials set
    //                     usedMaterialIds.add(material.material_id.toString());
                        
    //                     // Add to display table
    //                     addRawMaterialToTable(addedRawMaterials.length - 1);
    //                 });
                    
    //                 // Calculate raw material totals
    //                 calculateTotalRawMaterialDetails();
    //             }
    //         },
    //         error: function(xhr, status, error) {
    //             console.error('Error loading model details:', error);
    //             Swal.fire({
    //                 title: 'Error',
    //                 text: 'Failed to load model details. Please try again later.',
    //                 icon: 'error'
    //             });
    //         }
    //     });
    // }

    // --
    // function loadModelData() {
    //     const modelId = $('#model_id').val();
        
    //     $.ajax({
    //         url: `/get_model_details/${modelId}/`,
    //         type: 'GET',
    //         dataType: 'json',
    //         success: function(data) {
    //             console.log("Model data loaded:", data);
                
    //             // Load basic model information
    //             if (data.model) {
    //                 // Update model number (fixed naming from 'name' to 'model_no')
    //                 $('#model_no').val(data.model.model_no);
                    
    //                 // Set dimensions and weight
    //                 $('#length').val(data.model.length);
    //                 $('#breadth').val(data.model.breadth);
    //                 $('#weight').val(data.model.weight);
                    
    //                 // Set jewelry type if dropdown exists
    //                 if (data.model.jewelry_type_id && $('#jewelry_type').length) {
    //                     $('#jewelry_type').val(data.model.jewelry_type_id).trigger('change');
    //                 }
                    
    //                 // Set status if dropdown exists
    //                 if (data.model.status_id && $('#status').length) {
    //                     $('#status').val(data.model.status_id).trigger('change');
    //                 }
                    
    //                 // Set colors if it's a dropdown or multi-select
    //                 if (Array.isArray(data.model.colors)) {
    //                     $('#colors').val(data.model.colors).trigger('change'); // Assuming Select2 or multiselect
    //                 }
                    
    //                 // Show existing image preview
                    // if (data.model.model_img) {
                    //     const imageUrl = data.model.model_img;
                    //     $('#imagePreview').attr('src', imageUrl);
                    //     $('#previewContainer').removeClass('d-none');
                    // } else {
                    //     $('#imagePreview').attr('src', '#');
                    //     $('#previewContainer').addClass('d-none');
                    // }
    //             }
                
    //             // Load clients data
    //             if (data.clients && data.clients.length > 0 && $('#clients').length) {
    //                 const clientIds = data.clients.map(client => client.client_id);
    //                 $('#clients').val(clientIds).trigger('change'); // Assuming Select2 or multiselect
    //             }
                
    //             // Clear existing stone data
    //             addedStones = [];
    //             usedStoneIds = new Set();
    //             $('#stonesTable tbody').empty();
                
    //             // Load raw stones data first if needed
    //             if (data.raw_stones && data.raw_stones.length > 0) {
    //                 // If you have UI for raw stones, add handling here
    //                 // This might populate a separate table or selection
    //                 console.log("Raw stones data:", data.raw_stones);
    //             }
                
    //             // Load stone count data
    //             if (data.stones && data.stones.length > 0) {
    //                 data.stones.forEach(stone => {
    //                     // Add to internal array
    //                     addedStones.push({
    //                         stone_id: stone.stone_id,
    //                         stone_name: stone.stone_name,
    //                         stone_type_id: stone.stone_type_id,
    //                         stone_type_name: stone.stone_type_name,
    //                         weight: stone.weight,
    //                         length: stone.length,
    //                         breadth: stone.breadth,
    //                         rate: stone.rate,
    //                         count: stone.count,
    //                         stone_type_detail_id: stone.stone_type_detail_id,
    //                         id: stone.id  // Store the stone relationship ID for updates
    //                     });
                        
    //                     // Add stone ID to used stones set
    //                     usedStoneIds.add(stone.stone_id.toString());
                        
    //                     // Add to display table
    //                     addStoneToTable(addedStones.length - 1);
    //                 });
                    
    //                 // Calculate stone totals
    //                 calculateTotalStoneDetails();
    //             }
                
    //             // Clear existing raw material data
    //             addedRawMaterials = [];
    //             usedMaterialIds = new Set();
    //             $('#materialsTable tbody').empty();
                
    //             // Load raw material data
    //             if (data.raw_materials && data.raw_materials.length > 0) {
    //                 data.raw_materials.forEach(material => {
    //                     // Add to internal array
    //                     addedRawMaterials.push({
    //                         material_id: material.material_id,
    //                         material_name: material.material_name,
    //                         weight: material.weight,
    //                         unit: material.unit || 'g', // Include unit field that was added
    //                         rate: material.rate,
    //                         total_value: material.total_value,
    //                         id: material.id  // Store the material relationship ID for updates
    //                     });
                        
    //                     // Add material ID to used materials set
    //                     usedMaterialIds.add(material.material_id.toString());
                        
    //                     // Add to display table
    //                     addRawMaterialToTable(addedRawMaterials.length - 1);
    //                 });
                    
    //                 // Calculate raw material totals
    //                 calculateTotalRawMaterialDetails();
    //             }
                
              
    //         },
    //         error: function(xhr, status, error) {
    //             console.error('Error loading model details:', error);
    //             Swal.fire({
    //                 title: 'Error',
    //                 text: 'Failed to load model details. Please try again later.',
    //                 icon: 'error'
    //             });
    //         }
    //     });
    // }


   // Fix for the "Unknown Stone" issue in loadModelData function
function loadModelData() {
    const modelId = $('#model_id').val();
    
    $.ajax({
        url: `/get_model_details/${modelId}/`,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            console.log("Model data loaded:", data);
            
            // Load basic model information
            if (data.model) {
                // Update model number
                $('#model_no').val(data.model.model_no);
                
                // Set dimensions and weight
                $('#length').val(data.model.length);
                $('#breadth').val(data.model.breadth);
                $('#weight').val(data.model.weight);
                
                // Set jewelry type if dropdown exists
                if (data.model.jewelry_type_id && $('#jewelry_type').length) {
                    $('#jewelry_type').val(data.model.jewelry_type_id).trigger('change');
                }
                
                // Set status if dropdown exists
                if (data.model.status_id && $('#status').length) {
                    $('#status').val(data.model.status_id).trigger('change');
                }
                
                // Set colors if it's a dropdown or multi-select
                if (Array.isArray(data.model.colors)) {
                    $('#colors').val(data.model.colors).trigger('change'); // Assuming Select2 or multiselect
                }
                
                if (data.model.model_img && data.model.model_img.trim() !== '') {
                    const imageUrl = data.model.model_img;
                    $('#imagePreview').attr('src', imageUrl);
                    $('#modalImage').attr('src', imageUrl); // Also update modal image
                    $('#previewContainer').removeClass('d-none'); 
                } else {
                    // Hide the preview container entirely with CSS
                    $('#previewContainer').addClass('d-none'); // Force display none
                    // Also remove the src attribute
                    $('#imagePreview').removeAttr('src');
                    $('#modalImage').removeAttr('src');
                }
            }
            
            // Load clients data
            if (data.clients && data.clients.length > 0 && $('#clients').length) {
                const clientIds = data.clients.map(client => client.client_id);
                $('#clients').val(clientIds).trigger('change'); // Assuming Select2 or multiselect
            }
            
            // Clear existing stone data
            addedStones = [];
            usedStoneIds = new Set();
            $('#stonesTable tbody').empty();
            
            // Process stones data
            // First check for complete stones data (StoneCount objects with full details)
            if (data.stones && data.stones.length > 0) {
                console.log("Processing stones data:", data.stones);
                
                data.stones.forEach(stone => {
                    // Add to internal array with all properties
                    addedStones.push({
                        stone_id: stone.stone_id,
                        stone_name: stone.stone_name || "No Stone Selected",
                        stone_type_id: stone.stone_type_id,
                        stone_type_name: stone.stone_type_name || "Unknown Type",
                        weight: stone.weight || 0,
                        length: stone.length || 0,
                        breadth: stone.breadth || 0,
                        rate: stone.rate || 0,
                        count: stone.count || 1,
                        stone_type_detail_id: stone.stone_type_detail_id,
                        id: stone.id  // Store the stone relationship ID for updates
                    });
                    
                    // Add stone ID to used stones set if it exists
                    if (stone.stone_id) {
                        usedStoneIds.add(stone.stone_id.toString());
                    }
                    
                    // Add to display table
                    addStoneToTable(addedStones.length - 1);
                });
            } 
            // If no stones data, check for raw_stones with enhanced data
            else if (data.raw_stones && data.raw_stones.length > 0) {
                console.log("Processing raw_stones data:", data.raw_stones);
                
                data.raw_stones.forEach(stone => {
                    console.log("Raw stone structure:", stone);
                    
                    // Create a stone object with available data
                    // Now raw_stones should include stone_id and stone_name from the backend
                    const stoneObj = {
                        stone_id: stone.stone_id || null,
                        stone_name: stone.stone_name || "No Stone Selected",
                        stone_type_id: stone.stone_type_id,
                        stone_type_name: stone.stone_type_name || "Unknown Type",
                        weight: 0,
                        length: 0,
                        breadth: 0,
                        rate: 0,
                        count: 1,
                        stone_type_detail_id: null,
                        id: null
                    };
                    
                    // Add to internal array
                    addedStones.push(stoneObj);
                    
                    // Add stone ID to used stones set if it exists
                    if (stoneObj.stone_id) {
                        usedStoneIds.add(stoneObj.stone_id.toString());
                    }
                    
                    // Add to display table
                    addStoneToTable(addedStones.length - 1);
                });
            }
            
            // Calculate stone totals if we have any stones
            if (addedStones.length > 0) {
                calculateTotalStoneDetails();
            }
            
            // Clear existing raw material data
            addedRawMaterials = [];
            usedMaterialIds = new Set();
            $('#materialsTable tbody').empty();
            
            // Load raw material data
            if (data.raw_materials && data.raw_materials.length > 0) {
                data.raw_materials.forEach(material => {
                    // Add to internal array
                    addedRawMaterials.push({
                        material_id: material.material_id,
                        material_name: material.material_name,
                        weight: material.weight,
                        unit: material.unit || 'g', // Include unit field that was added
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
        // If no valid file is selected, completely hide the preview using CSS
        $('#previewContainer').addClass('d-none'); // Force display none
        // Also remove the src attribute
        $('#imagePreview').removeAttr('src');
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
                    <button type="button" class="btn bg-label-danger btn-sm remove-stone"><i class="bx bx-trash"></i></button>
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
                    <button type="button" class="btn bg-label-danger btn-sm remove-raw-material"><i class="bx bx-trash"></i></button>
                </td>
            </tr>
        `;
        
        $('#savedRawMaterialsTable tbody').append(newRow);
    }
    function addStoneForm() {
        const template = document.getElementById('stoneFormTemplate');
        const clone = document.importNode(template.content, true);
        const formContainer = $(clone.querySelector('.stone-form-container'));
        
        stoneFormCounter++;
        formContainer.attr('id', 'stoneForm' + stoneFormCounter);
        
        $('#stonesContainer').append(formContainer);
        
        const stoneSelect = formContainer.find('.stone-name-select');
        
        populateStoneDropdown(stoneSelect);
        
        stoneSelect.select2({
            placeholder: "Select a stone",
            allowClear: true
        });
        
        formContainer.find('.stone-type-select').select2({
            placeholder: "Select stone type",
            allowClear: true
        });
        stoneSelect.on('change', function() {
            loadStoneTypes($(this));
        });
        
        formContainer.find('.stone-type-select').on('change', function() {
            loadStoneDetails($(this));
        });
        
        formContainer.find('.cancel-stone-btn').on('click', function() {
            formContainer.remove();
        });
        
        formContainer.find('.save-stone-btn').on('click', function() {
            saveStoneData(formContainer);
        });
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
    
     // Function to load stone types based on selected stone
     function loadStoneTypes(stoneSelect) {
        const stoneId = stoneSelect.val();
        const stoneForm = stoneSelect.closest('.stone-form-container');
        const typeSelect = stoneForm.find('.stone-type-select');
        
        typeSelect.find('option:not(:first)').remove();
        stoneForm.find('.stone-weight').val('');
        stoneForm.find('.stone-length').val('');
        stoneForm.find('.stone-breadth').val('');
        
        if (!stoneId) return;
        
        $.ajax({
            url: `/get_stone_types/${stoneId}/`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                $.each(data, function(i, type) {
                    typeSelect.append($('<option>', {
                        value: type.id,
                        text: type.type_name
                    }));
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading stone types:', error);
            }
        });
    }
    function loadStoneDetails(typeSelect) {
        const typeId = typeSelect.val();
        const stoneForm = typeSelect.closest('.stone-form-container');
        
        if (!typeId) return;
        
        // Clear any existing detail rows first
        stoneForm.find('.stone-details-container').remove();
        
        $.ajax({
            url: `/get_stone_type_details/${typeId}/`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data && data.length > 0) {
                    // Get the reference point for inserting detail rows
                    const lastRow = stoneForm.find('.row').last();
                    
                    // Create container for all detail rows
                    const detailsContainer = $('<div class="stone-details-container mt-3"></div>');
                    
                    // Add a header for the details section
                    detailsContainer.append('<h6 class="mb-2">Available Stone Details:</h6>');
                    
                    // Add each detail as a row of input fields with checkbox and count
                    $.each(data, function(i, detail) {
                        const detailRow = $(`
                            <div class="row stone-detail-row mb-2">
                                <div class="col-md-1">
                                    <div class="form-check mt-2">
                                        <input class="form-check-input stone-detail-checkbox" type="checkbox" value="${detail.id}" 
                                            data-weight="${detail.weight}" 
                                            data-length="${detail.length}" 
                                            data-breadth="${detail.breadth}"
                                            data-rate="${detail.rate}"
                                            data-detail-id="${detail.id}">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="input-group">
                                        <span class="input-group-text">Count</span>
                                        <input type="number" min="1" value="1" class="form-control stone-count-input ps-2 p-0">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="input-group">
                                        <span class="input-group-text">Weight</span>
                                        <input type="text" class="form-control" value="${detail.weight}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="input-group">
                                        <span class="input-group-text">Length</span>
                                        <input type="text" class="form-control" value="${detail.length}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="input-group">
                                        <span class="input-group-text">Breadth</span>
                                        <input type="text" class="form-control" value="${detail.breadth}" disabled>
                                    </div>
                                </div>
                            </div>
                        `);
                        
                        detailsContainer.append(detailRow);
                    });
                    
                    // Add the details container after the last row
                    lastRow.after(detailsContainer);
                    
                    // Enable input for count fields
                    stoneForm.find('.stone-count-input').prop('disabled', false);
                    
                    // Highlight row when checkbox is checked/unchecked
                    stoneForm.find('.stone-detail-checkbox').on('change', function() {
                        if (this.checked) {
                            $(this).closest('.stone-detail-row').addClass('bg-light');
                        } else {
                            $(this).closest('.stone-detail-row').removeClass('bg-light');
                        }
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading stone details:', error);
            }
        });
    }
     // Function to save stone data
     function saveStoneData(formContainer) {
        const stoneNameSelect = formContainer.find('.stone-name-select');
        const stoneTypeSelect = formContainer.find('.stone-type-select');
        const checkedDetails = formContainer.find('.stone-detail-checkbox:checked');
        
        // Validate form
        if (!stoneNameSelect.val() || !stoneTypeSelect.val()) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Please select a stone and type',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Check if at least one detail is selected
        if (checkedDetails.length === 0) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Please select at least one stone detail',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Get text values for display
        const stoneName = stoneNameSelect.find('option:selected').text();
        const stoneType = stoneTypeSelect.find('option:selected').text();
        
        // Process each selected detail
        checkedDetails.each(function() {
            const detailCheckbox = $(this);
            const detailRow = detailCheckbox.closest('.stone-detail-row');
            
            // Get detail data
            const weight = detailCheckbox.data('weight');
            const length = detailCheckbox.data('length');
            const breadth = detailCheckbox.data('breadth');
            const rate = detailCheckbox.data('rate');
            const detailId = detailCheckbox.data('detail-id');
            
            // Get count from the same row
            const count = detailRow.find('.stone-count-input').val();
            
            // Initialize stone data object
            const stoneData = {
                stone_id: stoneNameSelect.val(),
                stone_name: stoneName,
                stone_type_id: stoneTypeSelect.val(),
                stone_type_name: stoneType,
                weight: weight,
                length: length,
                breadth: breadth,
                rate: rate,
                count: count,
                stone_type_detail_id: detailId
            };
            
            // Add to the array of stones
            addedStones.push(stoneData);
            const formatNumber = (num) => {
                return parseFloat(num) % 1 === 0 ? parseInt(num) : num;
            };
            
            // Add to the displayed table
            const newRow = `
                <tr data-index="${addedStones.length - 1}">
                    <td>${stoneName}</td>
                    <td>${stoneType}</td>
                    <td>${formatNumber(weight)}</td>
                    <td>${formatNumber(length)} x ${formatNumber(breadth)}</td>
                    <td>${formatNumber(rate)}</td>
                    <td>${count}</td>
                    <td>
                        <button type="button" class="btn bg-label-danger btn-sm remove-stone">Remove</button>
                    </td>
                </tr>
            `;
            
            $('#savedStonesTable tbody').append(newRow);
        });
        
        // Add the stone ID to the set of used stone IDs
        usedStoneIds.add(stoneNameSelect.val().toString());
        
        // Calculate and update total stone details
        calculateTotalStoneDetails();
        
        // Remove the form
        formContainer.remove();
        
        // Bind remove event to all rows
        $('#savedStonesTable tbody').on('click', '.remove-stone', function() {
            const row = $(this).closest('tr');
            const index = row.data('index');
            
            // Get the stone ID to remove from used stones
            const removedStone = addedStones[index];
            if (removedStone && removedStone.stone_id) {
                // Only remove from usedStoneIds if this was the last instance of this stone
                const remainingOfThisStone = addedStones.filter(s => s.stone_id === removedStone.stone_id);
                if (remainingOfThisStone.length <= 1) {
                    usedStoneIds.delete(removedStone.stone_id.toString());
                }
            }
            
            // Remove from array and table
            addedStones.splice(index, 1);
            row.remove();
            
            // Recalculate totals
            calculateTotalStoneDetails();
            
            // Re-index remaining rows
            $('#savedStonesTable tbody tr').each(function(i) {
                $(this).attr('data-index', i);
            });
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
    function addRawMaterialForm() {
        const template = document.getElementById('rawMaterialFormTemplate');
        const clone = document.importNode(template.content, true);
        const formContainer = $(clone.querySelector('.raw-material-form-container'));
        
        rawMaterialFormCounter++;
        formContainer.attr('id', 'rawMaterialForm' + rawMaterialFormCounter);
        
        $('#rawMaterialsContainer').append(formContainer);
        
        // Populate material dropdown
        const materialSelect = formContainer.find('.raw-material-select');
        populateMaterialDropdown(materialSelect);

        materialSelect.select2({
            placeholder: "Select a raw material",
            allowClear: true
        });
        // Replace checkbox with a button for getting rate
        const weightInput = formContainer.find('.raw-material-weight');
        const getRateButton = formContainer.find('.get-rate-button');
        const rateContainer = formContainer.find('#rateContainer');
        const rateInput = formContainer.find('.raw-material-rate');
        const totalValueInput = formContainer.find('.raw-material-total-value');

        // Initially hide the rate container
        rateContainer.hide();

        // Get rate button click handler
        getRateButton.on('click', function() {
            // Get material and weight
            const materialId = materialSelect.val();
            const weight = weightInput.val();

            if (materialId && weight) {
                // Show loading state on button
                const originalButtonText = getRateButton.html();
                getRateButton.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
                getRateButton.prop('disabled', true);
                
                // Get current rate for the material
                $.ajax({
                    url: `/get_material_rate/${materialId}/`,
                    type: 'GET',
                    data: { weight: weight },
                    dataType: 'json',
                    success: function(data) {
                        if (data.rate) {
                            rateInput.val(data.rate);
                            const totalValue = (weight * data.rate).toFixed(2);
                            totalValueInput.val(totalValue);
                            rateContainer.show();
                        }
                        
                        // Restore button state
                        getRateButton.html(originalButtonText);
                        getRateButton.prop('disabled', false);
                    },
                    error: function(xhr, status, error) {
                        console.error('Error getting material rate:', error);
                        
                        // Show error message
                        Swal.fire({
                            title: 'Error',
                            text: 'No data present for current date',
                            icon: 'error'
                        });
                        
                        // Restore button state
                        getRateButton.html(originalButtonText);
                        getRateButton.prop('disabled', false);
                    }
                });
            } else {
                // Show validation error
                Swal.fire({
                    title: 'Validation Error',
                    text: 'Please select a material and enter weight first',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });

        // Cancel button
        formContainer.find('.cancel-raw-material-btn').on('click', function() {
            formContainer.remove();
        });

        // Save button
        formContainer.find('.save-raw-material-btn').on('click', function() {
            saveRawMaterialData(formContainer);
        });
    }
     // Function to populate material dropdown
     function populateMaterialDropdown(select) {
        select.find('option:not(:first)').remove();
        
        if (window.materialData && window.materialData.length > 0) {
            $.each(window.materialData, function(i, material) {
                // Only add materials that haven't been used yet
                if (!usedMaterialIds.has(material.id.toString())) {
                    select.append($('<option>', {
                        value: material.id,
                        text: material.name
                    }));
                }
            });
        } else {
            $.ajax({
                url: '/get_materials/',
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log("Materials loaded for dropdown:", data);
                    $.each(data, function(i, material) {
                        // Only add materials that haven't been used yet
                        if (!usedMaterialIds.has(material.id.toString())) {
                            select.append($('<option>', {
                                value: material.id,
                                text: material.name
                            }));
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Error loading materials for dropdown:', error);
                }
            });
        }
    }
    function saveRawMaterialData(formContainer) {
        const materialSelect = formContainer.find('.raw-material-select');
        const weightInput = formContainer.find('.raw-material-weight');
        const rateInput = formContainer.find('.raw-material-rate');
        const totalValueInput = formContainer.find('.raw-material-total-value');
        const rateContainer = formContainer.find('#rateContainer');
        
        // Check if rate container is visible (rate was fetched)
        const hasRate = rateContainer.is(':visible');

        // Validate form
        if (!materialSelect.val() || !weightInput.val()) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Please fill all required fields for the raw material',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Get text values for display
        const materialName = materialSelect.find('option:selected').text();
        const weight = weightInput.val();
        const rate = hasRate ? rateInput.val() : null;
        const totalValue = hasRate ? totalValueInput.val() : null;

        // Create raw material data object
        const rawMaterialData = {
            material_id: materialSelect.val(),
            material_name: materialName,
            weight: weight,
            rate: rate,
            total_value: totalValue
        };

        // Add to the array of raw materials
        addedRawMaterials.push(rawMaterialData);
        
        // Add the material ID to the set of used material IDs
        usedMaterialIds.add(materialSelect.val().toString());

        // Add to the displayed table
        const newRow = `
            <tr data-index="${addedRawMaterials.length - 1}">
                <td>${materialName}</td>
                <td>${formatNumber(weight)}</td>
                <td>${rate ? formatNumber(rate) : 'N/A'}</td>
                <td>${totalValue ? formatNumber(totalValue) : 'N/A'}</td>
                <td>
                    <button type="button" class="btn bg-label-danger btn-sm remove-raw-material">Remove</button>
                </td>
            </tr>
        `;
        
        $('#savedRawMaterialsTable tbody').append(newRow);
        
        // Calculate and update total raw material details
        calculateTotalRawMaterialDetails();
        
        // Remove the form
        formContainer.remove();
        
        // Bind remove event
        $('#savedRawMaterialsTable tbody').on('click', '.remove-raw-material', function() {
            const row = $(this).closest('tr');
            const index = row.data('index');
            
            // Get the material ID to remove from used materials
            const removedMaterial = addedRawMaterials[index];
            if (removedMaterial && removedMaterial.material_id) {
                // Only remove from usedMaterialIds if this was the last instance of this material
                const remainingOfThisMaterial = addedRawMaterials.filter(m => m.material_id === removedMaterial.material_id);
                if (remainingOfThisMaterial.length <= 1) {
                    usedMaterialIds.delete(removedMaterial.material_id.toString());
                }
            }
            
            // Remove from array and table
            addedRawMaterials.splice(index, 1);
            row.remove();
            
            // Recalculate totals
            calculateTotalRawMaterialDetails();
            
            // Re-index remaining rows
            $('#savedRawMaterialsTable tbody tr').each(function(i) {
                $(this).attr('data-index', i);
            });
        });
    }
    
     // Handle form submission with updated clients and status
     $('#updateModelForm').on('submit', function(e) {
        e.preventDefault();

        const modelId = $('#model_id').val();
        const jewelryTypeId = $('#jewelry_type').val();
        const statusId = $('#status').val(); 
        const formData = new FormData(this);
        formData.append('jewelry_type', jewelryTypeId);
        formData.append('statusId', statusId);
        const colorSelections = $('#colors').val();
        formData.delete('colors');
        colorSelections.forEach(color => {
            formData.append('colors[]', color);
        });
        
        const clientSelections = $('#clients').val();
        clientSelections.forEach(clientId => {
            formData.append('clients[]', clientId);
        });

        formData.append('stones', JSON.stringify(addedStones));
        formData.append('raw_materials', JSON.stringify(addedRawMaterials));

        $.ajax({
            url: `/model_edit/${modelId}/`,
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
$(document).ready(function() {
    // Load clients dropdown
    $.ajax({
        url: '/get_clients/',
        type: 'GET',
        dataType: 'json',
        success: function(clients) {
            // Populate clients dropdown
            const clientsDropdown = $('#clients');
            clientsDropdown.empty();
            
            clients.forEach(client => {
                clientsDropdown.append(new Option(client.name, client.id));
            });
            
            // Select the current clients for this model
            // We'll need to retrieve current clients from the server and pre-select them
            const modelId = $('#model_id').val();
            
            if (modelId) {
                $.ajax({
                    url: `/get_model_clients/${modelId}/`, // You'll need to create this endpoint
                    type: 'GET',
                    dataType: 'json',
                    success: function(modelClients) {
                        const clientIds = modelClients.map(client => client.id);
                        $('#clients').val(clientIds).trigger('change');
                    },
                    error: function(xhr, status, error) {
                        console.error('Error fetching model clients:', error);
                    }
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching clients:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to load clients. Please refresh the page.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });
    
    // Load status dropdown
    $.ajax({
        url: '/get_model_status/',
        type: 'GET',
        dataType: 'json',
        success: function(statuses) {
            // Populate status dropdown
            const statusDropdown = $('#status');
            statusDropdown.empty();
            let defaultOption = new Option('Select Status', '', true, true);
            defaultOption.disabled = true;
            statusDropdown.append(defaultOption);
            
            statuses.forEach(status => {
                statusDropdown.append(new Option(status.status, status.id));
            });
            
            // Select the current status for this model
            const modelId = $('#model_id').val();
            const currentStatusId = $('#current_status_id').val(); // You need to add this hidden field
            
            if (currentStatusId) {
                $('#status').val(currentStatusId);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching model statuses:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to load statuses. Please refresh the page.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
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