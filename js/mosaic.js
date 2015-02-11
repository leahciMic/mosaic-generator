var Mosaic = function Mosaic() {
};

Mosaic.prototype.componentToHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

Mosaic.prototype.rgbToHex = function(r, g, b, colors) {
    r = Math.floor((Math.floor(r / 255 * colors) / colors) * 255);
    g = Math.floor((Math.floor(g / 255 * colors) / colors) * 255);
    b = Math.floor((Math.floor(b / 255 * colors) / colors) * 255);

    return this.componentToHex(r)
      + this.componentToHex(g)
      + this.componentToHex(b);
};

Mosaic.prototype.getImageFromFile = function(file) {
  var image = new Image;

  return new Promise(function(resolve, reject) {
    image.src = URL.createObjectURL(file);
    image.onload = function() {
      resolve(image);
    };
  });
};

// returns a array of objects containing pixel data
// returned object has 3 keys: color, x, y
// x and y are mosaic coordinates
Mosaic.prototype.getPixelMap = function(size, image, colors) {
  var tmpCanvas = document.createElement('canvas'),
      context = tmpCanvas.getContext('2d');

  tmpCanvas.width = size.x;
  tmpCanvas.height = size.y;

  context.drawImage(image, 0, 0, size.x, size.y);

  var tileColors = this.getTileColorMap(context.getImageData(0, 0, size.x, size.y), colors);

  return tileColors.map(function(color, i) {
    return {
      color: color,
      x: (i % size.x) + 1,
      y: Math.floor(i / size.x) + 1
    };
  });
};

// used to convert the data we get back from getImageData to something more manageable
Mosaic.prototype.getTileColorMap = function(img, colors) {
  var i,
      l = img.data.length,
      data = [];

  for (i = 0; i < l; i += 4) {
    data.push(
      this.rgbToHex(img.data[i], img.data[i + 1], img.data[i + 2], colors)
    );
  }

  return data;
};

// create a mosaic from file onto targetCanvas
Mosaic.prototype.create = function(file, targetCanvas, colors) {
  var self = this,
      context = targetCanvas.getContext('2d');

  colors = colors || 16;
  context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

  this.getImageFromFile(file).then(function(image) {
    var targetSize = self.getTargetSize(image, targetCanvas),
        mosaicDimensions = self.getMosaicDimensions(targetSize),
        pixelMap = self.getPixelMap(mosaicDimensions, image, colors),
        uniqueColors = _.unique(_.pluck(pixelMap, 'color'));

    var completeTiles = {};
    var currentRowIdx = 1, currentRow = _.where(pixelMap, {y: currentRowIdx});

    var offset = {
      x: (targetCanvas.width - targetSize.x) / 2,
      y: (targetCanvas.height - targetSize.y) / 2
    };

    var currentRowIsComplete = function() {
      for (var i = 0, l = currentRow.length; i < l; i++) {
        if (!completeTiles[currentRow[i].color]) {
          return false;
        }
      }
      return true;
    };

    var drawAvailableRows = function() {
      if (!currentRowIsComplete()) {
        return;
      }
      currentRow.forEach(function(pixel) {
        context.drawImage(completeTiles[pixel.color], offset.x + (pixel.x-1) * TILE_WIDTH, offset.y + (pixel.y-1) * TILE_HEIGHT);
      });
      currentRowIdx++;
      currentRow = _.where(pixelMap, {y: currentRowIdx});
      if (currentRow.length == 0) {
        return;
      }
      drawAvailableRows();
    };

    // use async to download upto max 16 images at a time
    async.mapLimit(uniqueColors, 16, function(color, callback) {
      var image = new Image;
      image.src = 'color/' + color;
      image.onload = function() {
        completeTiles[color] = image;
        callback(false, image);
        drawAvailableRows();
      }
    }, function() {
      drawAvailableRows();

    });
  });
};

// get the largest dimensions that image can be drawn into targetCanvas
// while maintaining aspect ratio
Mosaic.prototype.getTargetSize = function(image, targetCanvas) {
  var aspectRatio = image.width / image.height,
      width = targetCanvas.width,
      height = targetCanvas.height;

  if (width / aspectRatio < height) {
    return {
      x: width,
      y: Math.floor(width / aspectRatio)
    };
  }

  return {
    x: Math.floor(height * aspectRatio),
    y: Math.floor(height)
  };
};

// get the mosaic dimensions for a size
Mosaic.prototype.getMosaicDimensions = function(size) {
  return {
    x: Math.ceil(size.x / TILE_WIDTH),
    y: Math.ceil(size.y / TILE_HEIGHT)
  };
};