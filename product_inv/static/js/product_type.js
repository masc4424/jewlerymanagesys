$(document).ready(function() {
    $('#jewelryTable').DataTable({
        ajax: {
            url: '/jewelery_type/',
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            { data: 'name' },
            { 
                data: null,
                render: function(data) {
                    return `<a href="#" class="model-link" data-id="${data.id}" data-name="${data.name}">
                                ${data.model_count}<i class="bx bx-chevron-right"></i>
                            </a>`;
                }
            },
            {
                data: null,
                render: function() {
                    return `
                        <div class="dropdown">
                            <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                <i class="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <div class="dropdown-menu">
                                <a class="dropdown-item" href="javascript:void(0);">
                                    <i class="bx bx-upload me-1"></i> Bulk Upload
                                </a>
                                <a class="dropdown-item" href="javascript:void(0);">
                                    <i class="bx bx-show me-1"></i> View Models
                                </a>
                            </div>
                        </div>
                    `;
                }
            }
        ]
    });

    // Redirect to product_list on model click
    $(document).on('click', '.model-link', function(e) {
        e.preventDefault();
        const jewelryTypeName = $(this).data('name');
        window.location.href = `/product_list/${jewelryTypeName}/`;
    });
});