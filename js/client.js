// setup the canvas render width and height to take all available space
// apart from the header.
// atm, i don't handle page resizes at all (sorry)
var setupRenderCanvas = function setupRenderCanvas() {
  var renderCanvas = document.getElementById('render');

  var setCanvasFullScreen = function setCanvasFullScreen() {
    renderCanvas.width = window.innerWidth;
    renderCanvas.height = window.innerHeight - 40;
  };

  setCanvasFullScreen();
};

var rerender;
document.addEventListener('DOMContentLoaded', function() {
  setupRenderCanvas();

  var canvas = document.getElementById('render'),
      file = document.getElementById('fileInput'),
      fileButton = document.getElementById('fileButton'),
      saveButton = document.getElementById('saveButton');

  // called when file input changes, or when a file is dropped
  var onFileChange = function() {
    document.body.classList.add('min');
    var mosaic = new Mosaic();
    var filename = this.files[0].name;

    // set the filename of the download
    filename = filename.split('.');
    filename.pop();
    filename = filename.join('.') + '-mosaic.png';
    document.getElementById('saveButton').download = filename;

    // create a mosaic!
    var file = this.files[0];
    rerender = function() {
      mosaic.create(file, document.getElementById('render'), document.getElementById('colors').value);
    };
    rerender();
  };

  var stopEvents = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  document.getElementById('colors').addEventListener('change', function() {
    if (rerender) {
      rerender();
    }
  });

  // support drag and drop! (sorry no ui feedback)
  var dropEvent = function(e) {
    stopEvents(e);
    var inp = {
      files: e.dataTransfer.files
    };
    onFileChange.call(inp);
  };

  // proxy our sexy button clicks to the file input
  fileButton.addEventListener(
    'click',
    function(e) {
      file.click();
      stopEvents(e);
    },
    false
  );

  document.body.addEventListener('dragenter', stopEvents, false);
  document.body.addEventListener('dragover', stopEvents, false);
  document.body.addEventListener('drop', dropEvent, false);

  file.addEventListener('change', onFileChange);

  // handle saving of the canvas
  // @todo would be nice to disable this button until render is complete
  saveButton.addEventListener('click', function(e) {
    var dtUrl = canvas.toDataURL('image/png');
    this.href = dtUrl;
  });
});

