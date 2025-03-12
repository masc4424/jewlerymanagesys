$(document).ready(function() {
    $('#modelTable').DataTable({
        ajax: {
            url: `/get_model_data/${jewelry_type_name}/`, 
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            { data: 'model_no' },
            { data: 'length' },
            { data: 'breadth' },
            { data: 'weight' },
            {
                data: 'model_no', // Using model_no for the image path
                render: function(model_no, type, row) {
                    const imageSrc = `/static/model_img/${model_no}.png`;
                    return `<a href="javascript:void(0);" 
                               onclick="showImage('${imageSrc}', '${model_no}')"
                                data-id="${row.id}"
                                data-model_no="${model_no}">
                                View &gt; 
                            </a>`;
                }
            },
            {
                data: 'model_no',
                render: function(model_no) {
                    return `<a href="/product/${model_no}/" title="View Material">
                                <i class="bx bx-show"></i> &gt; 
                            </a>`;
                }
            },
            { data: 'no_of_pieces' },
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

function showImage(imageSrc, modelNo) {
    $('#modalImage').attr('src', imageSrc);
    $('#imageModalLabel').text(`Model No: ${modelNo}`); // Set the model number in the modal heading
    $('#imageModal').modal('show');
}
