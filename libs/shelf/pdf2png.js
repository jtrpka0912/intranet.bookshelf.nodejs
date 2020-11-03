/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Canvas = require("canvas");
var assert = require("assert").strict;
var fs = require("fs");

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    var canvas = Canvas.createCanvas(width, height);
    var context = canvas.getContext("2d");
    return {
      canvas: canvas,
      context: context,
    };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, "Canvas is not specified");

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

var pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");

// Some PDFs need external cmaps.
var CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
var CMAP_PACKED = true;

/**
 * @async
 * @function pdf2png
 * @description Based on the pdfjs pdf2png file but modified to use async/await.
 * @author Mozilla
 * @uses pdfjs
 * @param { string } fromPath 
 * @param { string } toPath 
 */
const pdf2png = async (fromPath, toPath) => {
    try {
        // Loading file from file system into typed array.
        var pdfPath = fromPath;
        var data = new Uint8Array(fs.readFileSync(pdfPath));

        // Load the PDF file.
        var loadingTask = pdfjsLib.getDocument({
          data: data,
          cMapUrl: CMAP_URL,
          cMapPacked: CMAP_PACKED,
          verbosity: pdfjsLib.VerbosityLevel.ERRORS // Adjust if you want to show warnings
        });

        const pdfDocument = await loadingTask.promise;

        // Get the first page.
        const page = await pdfDocument.getPage(1);

        // Render the page on a Node canvas with 100% scale.
        var viewport = page.getViewport({ scale: 1.0 });

        var canvasFactory = new NodeCanvasFactory();
        var canvasAndContext = canvasFactory.create(
            viewport.width,
            viewport.height
        );

        var renderContext = {
            canvasContext: canvasAndContext.context,
            viewport: viewport,
            canvasFactory: canvasFactory,
        };

        var renderTask = page.render(renderContext);
        
        await renderTask.promise;

        // Convert the canvas to an image buffer.
        var image = canvasAndContext.canvas.toBuffer();

        fs.writeFile(toPath, image, function (error) {
            if (error) throw new Error(error);
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    pdf2png
};