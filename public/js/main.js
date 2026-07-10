// ── Quill Rich Text Editor ──────────────────────────────────────────────
// Automatically replaces any <textarea class="rich-editor"> with a Quill instance.
// The textarea is hidden; on form submit, its value is set to the editor's HTML.
// Supports pasting / dragging images (stored as inline base64).

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Quill === 'undefined') return;

  document.querySelectorAll('textarea.rich-editor').forEach(function (textarea) {
    // Create editor container
    var container = document.createElement('div');
    container.className = 'quill-wrapper';
    var editorDiv = document.createElement('div');
    editorDiv.innerHTML = textarea.value || '';

    container.appendChild(editorDiv);
    textarea.parentNode.insertBefore(container, textarea);
    textarea.style.display = 'none';

    // Initialize Quill
    var quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          [{ indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          ['clean'],
        ],
      },
      placeholder: textarea.getAttribute('placeholder') || 'Write something...',
    });

    // Handle paste of images (clipboard)
    quill.root.addEventListener('paste', function (e) {
      var clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      for (var i = 0; i < clipboardData.items.length; i++) {
        var item = clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          var file = item.getAsFile();
          insertImageAsBase64(quill, file);
          return;
        }
      }
    });

    // Handle drag-and-drop of images
    quill.root.addEventListener('drop', function (e) {
      if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;

      var file = e.dataTransfer.files[0];
      if (file.type.indexOf('image') !== -1) {
        e.preventDefault();
        e.stopPropagation();
        insertImageAsBase64(quill, file);
      }
    });

    // On form submit, copy editor content to hidden textarea
    var form = textarea.closest('form');
    if (form) {
      form.addEventListener('submit', function () {
        textarea.value = quill.root.innerHTML;
      });
    }
  });

  // Convert an image file to base64 and insert at cursor position
  function insertImageAsBase64(quill, file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', e.target.result);
      quill.setSelection(range.index + 1);
    };
    reader.readAsDataURL(file);
  }
});
