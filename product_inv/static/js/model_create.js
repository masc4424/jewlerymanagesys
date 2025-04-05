$(document).ready(function() {
    $('.select22').select2();
    $('.stone-name-select').select2({
        placeholder: "Select a stone",
        allowClear: true
    });
    
    $('.stone-type-select').select2({
        placeholder: "Select stone type",
        allowClear: true
    });
    
    $('.raw-material-select').select2({
        placeholder: "Select raw material",
        allowClear: true
    });
    let addedStones = [];
    let stoneFormCounter = 0;
    let addedRawMaterials = [];
    let rawMaterialFormCounter = 0;
    let usedStoneIds = new Set(); // Track used stone IDs
    let usedMaterialIds = new Set(); // Track used material IDs
    
    // Load stone names and materials when page loads
    loadStoneNames();
    loadMaterials();
    
    // Add Stone Used button click
    $('#addStoneButton').on('click', function() {
        addStoneForm();
    });
    
    // Add Raw Material button click
    $('#addRawMaterialButton').on('click', function() {
        addRawMaterialForm();
    });
    
    // Function to calculate total stone details
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
    
        $('#totalStoneRate').text(totalRate.toFixed(2));
        $('#totalStoneWeight').text(totalWeight.toFixed(2));
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
                // Only add stones that haven't been used yet
                if (!usedStoneIds.has(stone.id.toString())) {
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
                        // Only add stones that haven't been used yet
                        if (!usedStoneIds.has(stone.id.toString())) {
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
    
    // Function to load stone details based on selected stone type
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
                            text: 'Could not fetch material rate',
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
                <td>${weight}</td>
                <td>${rate || 'N/A'}</td>
                <td>${totalValue || 'N/A'}</td>
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

    // Function to calculate total raw material details
    function calculateTotalRawMaterialDetails() {
        let totalWeight = 0;
        let totalValue = 0;

        addedRawMaterials.forEach(material => {
            totalWeight += parseFloat(material.weight || 0);
            totalValue += parseFloat(material.total_value || 0);
        });

        $('#totalRawMaterialWeight').text(totalWeight.toFixed(2));
        $('#totalRawMaterialValue').text(totalValue.toFixed(2));
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