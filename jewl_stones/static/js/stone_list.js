$(document).ready(function() {
    $('#stoneTable').DataTable({
        ajax: {
            url: '/get-stone-data/',
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            { data: 'stone_name' },
            { data: 'type_count'},
            {
                data: null,
                render: function() {
                    return '<span class="badge bg-label-success me-1">Active</span>';
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
                                    <i class="bx bx-edit-alt me-1"></i> Edit
                                </a>
                                <a class="dropdown-item" href="javascript:void(0);">
                                    <i class="bx bx-trash me-1"></i> Delete
                                </a>
                            </div>
                        </div>
                    `;
                }
            }
        ]
    });
});