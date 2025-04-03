$(document).ready(function() {
    let addedStones = [];
    let stoneFormCounter = 0;
    let addedRawMaterials = [];
    let rawMaterialFormCounter = 0;
    
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
                    if (data) {
                        const stoneRate = parseFloat(data.rate || 0);
                        const stoneWeight = parseFloat(stone.weight || 0);
                        totalRate += stoneRate;
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
        
        $.ajax({
            url: `/get_stone_type_details/${typeId}/`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data) {
                    // Set values and disable fields
                    stoneForm.find('.stone-weight').val(data.weight).prop('disabled', true);
                    stoneForm.find('.stone-length').val(data.length).prop('disabled', true);
                    stoneForm.find('.stone-breadth').val(data.breadth).prop('disabled', true);
                    // Store the shape value in a hidden input instead of showing it in UI
                    if (!stoneForm.find('.stone-shape-hidden').length) {
                        stoneForm.append('<input type="hidden" class="stone-shape-hidden" value="' + data.shape + '">');
                    } else {
                        stoneForm.find('.stone-shape-hidden').val(data.shape);
                    }
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
        const weight = formContainer.find('.stone-weight').val();
        const length = formContainer.find('.stone-length').val();
        const breadth = formContainer.find('.stone-breadth').val();
        const shape = formContainer.find('.stone-shape-hidden').val();
        
        // Validate form
        if (!stoneNameSelect.val() || !stoneTypeSelect.val() || !weight) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Please fill all required fields for the stone',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Get text values for display
        const stoneName = stoneNameSelect.find('option:selected').text();
        const stoneType = stoneTypeSelect.find('option:selected').text();
        
        // Create stone data object
        const stoneData = {
            stone_id: stoneNameSelect.val(),
            stone_name: stoneName,
            stone_type_id: stoneTypeSelect.val(),
            stone_type_name: stoneType,
            weight: weight,
            length: length,
            breadth: breadth,
            shape: shape 
        };
        
        // Add to the array of stones
        addedStones.push(stoneData);
        
        // Add to the displayed table
        const newRow = `
            <tr data-index="${addedStones.length - 1}">
                <td>${stoneName}</td>
                <td>${stoneType}</td>
                <td>${shape}</td>
                <td>${weight}</td>
                <td>${length}</td>
                <td>${breadth}</td>
                <td>
                    <button type="button" class="btn bg-label-danger btn-sm remove-stone">Remove</button>
                </td>
            </tr>
        `;
        
        $('#savedStonesTable tbody').append(newRow);
        
        // Calculate and update total stone details
        calculateTotalStoneDetails();
        
        // Remove the form
        formContainer.remove();
        
        // Bind remove event
        $('.remove-stone').last().on('click', function() {
            const row = $(this).closest('tr');
            const index = row.data('index');
            
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
                select.append($('<option>', {
                    value: material.id,
                    text: material.name
                }));
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

        // Rate checkbox functionality
        const weightInput = formContainer.find('.raw-material-weight');
        const rateCheckbox = formContainer.find('.get-rate-checkbox');
        const rateContainer = formContainer.find('#rateContainer');
        const rateInput = formContainer.find('.raw-material-rate');
        const totalValueInput = formContainer.find('.raw-material-total-value');

        rateCheckbox.on('change', function() {
            if (this.checked) {
                // Get material and weight
                const materialId = materialSelect.val();
                const weight = weightInput.val();

                if (materialId && weight) {
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
                        },
                        error: function(xhr, status, error) {
                            console.error('Error getting material rate:', error);
                            Swal.fire({
                                title: 'Error',
                                text: 'Could not fetch material rate',
                                icon: 'error'
                            });
                        }
                    });
                }
            } else {
                rateContainer.hide();
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
        const rateCheckbox = formContainer.find('.get-rate-checkbox');
        const rateInput = formContainer.find('.raw-material-rate');
        const totalValueInput = formContainer.find('.raw-material-total-value');

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
        const rate = rateCheckbox.is(':checked') ? rateInput.val() : null;
        const totalValue = rateCheckbox.is(':checked') ? totalValueInput.val() : null;

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
        $('.remove-raw-material').last().on('click', function() {
            const row = $(this).closest('tr');
            const index = row.data('index');
            
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