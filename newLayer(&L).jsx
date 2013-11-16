// newLayer
// adobe Illustrator CSx,CC script

// This script adds a new layer that has custom
// selection mark color above the active layer.

// (&L) in the filename is for the Alt key shortcut in Windows.
// You can run the script by Alt-F->R->L.

// Copyright(c) 2013 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// RGB values for new layer
var colors = [
    [0, 104, 221], // blue
    [220, 0, 165], // magenta
    [0, 166, 69], // green
    [244, 127, 0], // orange
    [159, 82, 197], // purple
    [211, 39, 0] // red
    ];

main();
function main(){
    if(documents.length < 1) return;

    var alay = activeDocument.activeLayer;
    var acolor = alay.color;

    // create new color according to the number of layers
    var color = new RGBColor();
    var index = activeDocument.layers.length % colors.length;
    
    color.red = colors[index][0];
    color.green = colors[index][1];
    color.blue = colors[index][2];

    // add new layer
    var lay = activeDocument.layers.add();
    lay.color = color;
    lay.move(alay, ElementPlacement.PLACEBEFORE);

    // dummy operation to select new layer
    var rect = lay.pathItems.rectangle(0,0,1,1);
    rect.selected = true;
    rect.remove();
}
