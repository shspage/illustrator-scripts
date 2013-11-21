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

main();
function main(){
    if(documents.length < 1) return;

    var alay = activeDocument.activeLayer;

    // add new layer
    var color = getNewLayerColor(alay);
    var lay = alay.parent.layers.add();
    lay.color = color;
    lay.move(alay, ElementPlacement.PLACEBEFORE);

    // dummy operation to select new layer
    var rect = lay.pathItems.rectangle(0,0,1,1);
    rect.selected = true;
    rect.remove();
}

/** getNewLayerColor : Returns a color for new layer
 * @param alay activeLayer
 * @returns RGBColor
 */
function getNewLayerColor(alay){
    // various constants
    var conf = {
        MIN_HUE_DIFF : 60,
        HUE_OFFSET : 60,
        FIXED_SAT : 0.85,
        FIXED_VAL : 0.85
        };
    
    var colorA = alay.color;
    var colorB = colorA;
    var z = alay.zOrderPosition;
    var layLen = alay.parent.layers.length;
    if(z != layLen){
        colorB = alay.parent.layers[layLen - z - 1].color;
    }
    
    var hsvA = rgb2hsv(colorA);
    var hsvB = rgb2hsv(colorB);

    var h = (hsvA.h + conf.HUE_OFFSET) % 360;
    if(Math.abs(hsvB.h - h) < conf.MIN_HUE_DIFF){
        h = (h + conf.HUE_OFFSET) % 360;
    }
    
    var hsv = {h:h, s:conf.FIXED_SAT, v:conf.FIXED_VAL};
    return hsv2rgb( hsv );
}

/** hsv2rgb : Converts HSV to RGBColor
 * @param hsv { h : 0-360, s,v : 0-1 }
 * @returns RGBColor
 */
function hsv2rgb(hsv) { // hsv { h : 0-360, s,v : 0-1 }
    var rgb = {r:0, g:0, b:0};
    var m = 255;
    // r,g,b : 0-m
    
    var Hi = Math.floor(hsv.h / 60) % 6;
    var f = hsv.h / 60 - Hi;
    var p = Math.round(hsv.v * (1 - hsv.s) * m);
    var q = Math.round(hsv.v * (1 - f * hsv.s) * m);
    var t = Math.round(hsv.v * (1 - (1 - f) * hsv.s) * m);

    hsv.v = Math.round(hsv.v * m);
    hsv.s = Math.round(hsv.s * m);
    
    switch(Hi){
    case 0: rgb.r = hsv.v; rgb.g = t; rgb.b = p; break;
    case 1: rgb.r = q; rgb.g = hsv.v; rgb.b = p; break;
    case 2: rgb.r = p; rgb.g = hsv.v; rgb.b = t; break;
    case 3: rgb.r = p; rgb.g = q; rgb.b = hsv.v; break;
    case 4: rgb.r = t; rgb.g = p; rgb.b = hsv.v; break;
    case 5: rgb.r = hsv.v; rgb.g = p; rgb.b = q; break;
    }
    //return rgb; // for general purpose

    var c = new RGBColor();
    c.red = rgb.r;
    c.green = rgb.g;
    c.blue = rgb.b;
    return c;
}

/** rgb2hsv : Converts RGBColor to HSV
 * @param rgb RGBColor { red,green,blue : 0-255 }
 * @returns hsv { h: 0-360, s,v: 0-1 }
 */
function rgb2hsv(rgb) {  // rgb { red, green, blue : 0-255 }
    var hsv = {h:0, s:0, v:0};
    // h: 0-360, s,v: 0-1
    
    var mx = Math.max(Math.max(rgb.red, rgb.green), rgb.blue);
    var mn = Math.min(Math.min(rgb.red, rgb.green), rgb.blue);
    
    if(mx > 0){
        hsv.v = mx / 255;
        
        hsv.s = (mx - mn) / mx;
        
        if(mx != mn){
            if(mx == rgb.red){
                hsv.h = 60 * (rgb.green - rgb.blue) / (mx - mn);
            } else if(mx == rgb.green){
                hsv.h = 60 * (rgb.blue - rgb.red) / (mx - mn) + 120;
            } else {
                hsv.h = 60 * (rgb.red - rgb.green) / (mx - mn) + 240;
            }
            if(hsv.h < 0) hsv.h += 360;
        }
    }
    
    return hsv;
}
