// ── Quill Rich Text Editor ──────────────────────────────────────────────
// Automatically replaces any <textarea class="rich-editor"> with a Quill instance.
// The textarea is hidden; on form submit, its value is set to the editor's HTML.

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
          ['link'],
          ['clean'],
        ],
      },
      placeholder: textarea.getAttribute('placeholder') || 'Write something...',
    });

    // On form submit, copy editor content to hidden textarea
    var form = textarea.closest('form');
    if (form) {
      form.addEventListener('submit', function () {
        textarea.value = quill.root.innerHTML;
      });
    }
  });
});
