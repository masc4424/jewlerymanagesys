$(document).ready(function() {
    $('.select22').select2();
    $('.stone-name-select').select2({
        placeholder: "Select a stone",
        allowClear: true
    });
    $('#clients').select2({
        placeholder: "",
        allowClear: true
    });
    $('#colors.select22').select2({
        placeholder: "Select colors...",
        allowClear: true
    }).val(['GJ', 'White', 'Gold', 'Rose Gold']).trigger('change');
    $('.stone-type-select').select2({
        placeholder: "Select stone type",
        allowClear: true
    });
    
    $('.raw-material-select').select2({
        placeholder: "Select raw material",
        allowClear: true
    });
     // When the image preview is clicked, show it in the modal
     $('#imagePreview').on('click', function () {
        const src = $(this).attr('src');
        $('#modalImage').attr('src', src);
    });

    let addedStones = [];
    let stoneFormCounter = 0;
    let addedRawMaterials = [];
    let rawMaterialFormCounter = 0;
    let usedStoneIds = new Set(); // Track used stone IDs
    let usedStoneTypeIds = new Set();
    let usedMaterialIds = new Set(); // Track used material IDs
    
    // Load stone names and materials when page loads
    loadStoneNames();
    loadMaterials();
    loadModelStatuses();
    
    // Add Stone Used button click
    $('#addStoneButton').on('click', function() {
        addStoneForm();
    });
    
    // Add Raw Material button click
    $('#addRawMaterialButton').on('click', function() {
        addRawMaterialForm();
    });
    function formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        const parsed = parseFloat(num);
        // Check if the number has no decimal part or ends with .00
        return parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(2).replace(/\.00$/, '');
    }
    function calculateTotalStoneDetails() {
        let totalRate = 0;
        let totalWeight = 0;

        addedStones.forEach(stone => {
            $.ajax({
                url: `/get_stone_type_details/${stone.stone_type_id}/`,
                type: 'GET',
                dataType: 'json',
                async: false,
                success: function(data) {
                    if (data && data.length > 0) {
                        // Find the matching detail if there's a detail_id in the stone object
                        let stoneDetail;
                        if (stone.detail_id) {
                            stoneDetail = data.find(detail => detail.id === stone.detail_id);
                        }
                        
                        // If no specific detail is found, use the first one
                        if (!stoneDetail) {
                            stoneDetail = data[0];
                        }
                        
                        const stoneRate = parseFloat(stoneDetail.rate || 0);
                        const stoneWeight = parseFloat(stone.weight || 0) * parseInt(stone.count || 1);
                        totalRate += stoneRate * parseInt(stone.count || 1);
                        totalWeight += stoneWeight;
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error loading stone type details:', error);
                }
            });
        });

        // Update total rate with rupee icon
        $('#totalStoneRate').html('<i class="bx bx-rupee fs-big"></i> ' +  formatNumber(totalRate));
        
        // Update total weight with "gm" suffix
        $('#totalStoneWeight').text(formatNumber(totalWeight) + ' gm');
    }
    
    // Function to add stone form
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
                // No need to filter based on usedStoneIds anymore
                select.append($('<option>', {
                    value: stone.id,
                    text: stone.name
                }));
            });
        } else {
            $.ajax({
                url: '/get_stones/',
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log("Stones loaded for dropdown:", data);
                    $.each(data, function(i, stone) {
                        // No need to filter based on usedStoneIds anymore
                        select.append($('<option>', {
                            value: stone.id,
                            text: stone.name
                        }));
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Error loading stones for dropdown:', error);
                }
            });
        }
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
                    // Only add stone types that haven't been used yet
                    if (!usedStoneTypeIds.has(type.id.toString())) {
                        typeSelect.append($('<option>', {
                            value: type.id,
                            text: type.type_name
                        }));
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading stone types:', error);
            }
        });
    }
   
   // Function to load stone details based on selected stone type
    function loadStoneDetails(typeSelect) {
        const typeId = typeSelect.val();
        const stoneForm = typeSelect.closest('.stone-form-container');
        
        // Get the stone name and type name from the dropdowns for URL parameters
        const stoneName = stoneForm.find('.stone-name-select option:selected').text();
        const typeName = stoneForm.find('.stone-type-select option:selected').text();
        
        if (!typeId) return;
        
        // Clear any existing detail rows first
        stoneForm.find('.stone-details-container').remove();
        
        $.ajax({
            url: `/get_stone_type_details/${typeId}/`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                // Get the reference point for inserting detail rows
                const lastRow = stoneForm.find('.row').last();
                
                // Create container for all detail rows
                const detailsContainer = $('<div class="stone-details-container mt-3"></div>');
                
                if (!data || data.length === 0) {
                    // No stone details available - show message and add button with URL parameters
                    const redirectUrl = `/stone-type-details/?stone_name=${encodeURIComponent(stoneName)}&type_name=${encodeURIComponent(typeName)}`;
                    
                    detailsContainer.append(`
                        <div class="alert alert-warning" role="alert">
                            No Dimensions available please add
                            <a href="${redirectUrl}" class="btn btn-primary btn-sm ms-2">
                                <i class="bx bx-plus"></i> Add
                            </a>
                        </div>
                    `);
                } else {
                    // Add a header for the details section
                    detailsContainer.append('<h6 class="mb-2">Available Stone Details:</h6>');
                    
                    // Add each detail as a row with simplified display
                    $.each(data, function(i, detail) {
                        // Auto-select if only one detail is available
                        const isAutoSelected = data.length === 1;
                        
                        const detailRow = $(`
                            <div class="row stone-detail-row mb-2 ${isAutoSelected ? 'bg-light' : ''}">
                                <div class="col-md-1">
                                    <div class="form-check mt-2">
                                        <input class="form-check-input stone-detail-checkbox" type="checkbox" value="${detail.id}" 
                                            data-weight="${detail.weight}" 
                                            data-length="${detail.length}" 
                                            data-breadth="${detail.breadth}"
                                            data-rate="${detail.rate}"
                                            data-detail-id="${detail.id}"
                                            ${isAutoSelected ? 'checked' : ''}>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="d-flex align-items-center">
                                        <span class="card p-2 me-3">Weight: ${detail.weight} gm</span>
                                        <span class="card p-2 px-3">Dimensions: ${detail.length}x${detail.breadth} cm</span>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="input-group">
                                        <span class="input-group-text">Count</span>
                                        <input type="number" min="1" value="1" class="form-control stone-count-input ps-2 p-0">
                                    </div>
                                </div>
                            </div>
                        `);
                        
                        detailsContainer.append(detailRow);
                    });
                    
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
                
                // Add the details container after the last row
                lastRow.after(detailsContainer);
            },
            error: function(xhr, status, error) {
                console.error('Error loading stone details:', error);
                
                // Get the stone name and type name for URL parameters
                const stoneName = stoneForm.find('.stone-name-select option:selected').text();
                const typeName = stoneForm.find('.stone-type-select option:selected').text();
                const redirectUrl = `/stone-type-details/?stone_name=${encodeURIComponent(stoneName)}&type_name=${encodeURIComponent(typeName)}`;
                
                // Show error message with Add button including parameters
                const lastRow = stoneForm.find('.row').last();
                const errorContainer = $(`
                    <div class="stone-details-container mt-3">
                        <div class="alert alert-danger" role="alert">
                            Error loading dimensions. Please try again or add new dimensions.
                            <a href="${redirectUrl}" class="btn btn-primary btn-sm ms-2">
                                <i class="bx bx-plus"></i> Add
                            </a>
                        </div>
                    </div>
                `);
                lastRow.after(errorContainer);
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
            // Get count and current rate from the same row
            const count = detailRow.find('.stone-count-input').val();
            // const currentRate = detailRow.find('.stone-current-rate-input').val() || rate; // Default to original rate if not specified
            
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
                // current_rate: currentRate,
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
                        <button type="button" class="btn bg-label-danger btn-sm remove-stone"><i class="bx bx-trash"></i></button>
                    </td>
                </tr>
            `;
            
            $('#savedStonesTable tbody').append(newRow);
        });
        
        // Add the stone type ID to the set of used stone type IDs
        usedStoneTypeIds.add(stoneTypeSelect.val().toString());
        
        // Calculate and update total stone details
        calculateTotalStoneDetails();
        
        // Remove the form
        formContainer.remove();
        
        // Bind remove event to all rows
        $('#savedStonesTable tbody').on('click', '.remove-stone', function() {
            const row = $(this).closest('tr');
            const index = row.data('index');
            
            // Get the stone type ID to remove from used stones
            const removedStone = addedStones[index];
            if (removedStone && removedStone.stone_type_id) {
                // Only remove from usedStoneTypeIds if this was the last instance of this stone type
                const remainingOfThisType = addedStones.filter(s => s.stone_type_id === removedStone.stone_type_id);
                if (remainingOfThisType.length <= 1) {
                    usedStoneTypeIds.delete(removedStone.stone_type_id.toString());
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

    // Function to add raw material form
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
                            icon: 'error',
                            confirmButtonText: 'OK'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                // Redirect to metal_list URL when OK is clicked
                                window.location.href = '/metal_list/';
                            }
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

    // Function to save raw material data
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
                    <button type="button" class="btn bg-label-danger btn-sm remove-raw-material"><i class="bx bx-trash"></i></button>
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

    // Function to calculate total raw material details
    function calculateTotalRawMaterialDetails() {
        let totalWeight = 0;
        let totalValue = 0;

        addedRawMaterials.forEach(material => {
            totalWeight += parseFloat(material.weight || 0);
            totalValue += parseFloat(material.total_value || 0);
        });

        $('#totalRawMaterialValue').text(formatNumber(totalValue) + ' gm');
        $('#totalRawMaterialWeight').html('<i class="bx bx-rupee fs-big"></i> ' +  formatNumber(totalWeight));
    }
    function loadModelStatuses() {
        $.ajax({
            url: '/get_model_status/',  // Create this endpoint
            type: 'GET',
            success: function(response) {
                const statusSelect = $('#status');
                statusSelect.empty();
                statusSelect.append('<option value="" selected disabled> </option>');
                
                response.forEach(status => {
                    statusSelect.append(`<option value="${status.id}">${status.status}</option>`);
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading model statuses:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to load model statuses. Please refresh the page.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    }

    // Handle form submission
    $('#createModelForm').on('submit', function(e) {
        e.preventDefault();
        const jewelryTypeId = $('#jewelry_type').val();
        console.log('Jewelry Type ID:', jewelryTypeId);
        
        // Create FormData object to handle file uploads
        const formData = new FormData(this);
        formData.append('jewelry_type', jewelryTypeId);
        const colorSelections = $('#colors').val();
        formData.delete('colors');
        colorSelections.forEach(color => {
            formData.append('colors[]', color);
        });
        const clientSelections = $('#clients').val();
        clientSelections.forEach(clientId => {
            formData.append('clients[]', clientId);
        });
        
        // Add the stones data as JSON
        formData.append('stones', JSON.stringify(addedStones));
        formData.append('raw_materials', JSON.stringify(addedRawMaterials));
        
        $.ajax({
            url: '/create_model/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('Success response:', response);
                
                // Reset the form
                $('#createModelForm')[0].reset();
                $('#savedStonesTable tbody').empty();
                addedStones = [];
                
                // Show success message first
                Swal.fire({
                    title: 'Success!',
                    text: response.message || 'Model created successfully',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then((result) => {
                    // After user clicks OK on the success message, redirect
                    if (response.model && response.model.jewelry_type_name) {
                        window.location.href = `/product_list/${response.model.jewelry_type_name}/`;
                    } else {
                        // Fallback if jewelry_type_name is not in the response
                        window.history.back();
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error:', xhr, status, error);
                
                // Show error message
                Swal.fire({
                    title: 'Error!',
                    text: xhr.responseJSON?.error || 'Failed to create model',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    });
    
    // Handle image preview
    $('#model_img').on('change', function () {
        let file = this.files[0];
    
        if (file) {
            let reader = new FileReader();
            reader.onload = function (e) {
                $('#imagePreview').attr('src', e.target.result);
                $('#previewContainer').removeClass('d-none');
            };
            reader.readAsDataURL(file);
        } else {
            $('#previewContainer').addClass('d-none');
        }
    });
});
$(document).ready(function() {
    // Fetch client data
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
            
            // Trigger change to refresh Select2
            clientsDropdown.trigger('change');
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
});