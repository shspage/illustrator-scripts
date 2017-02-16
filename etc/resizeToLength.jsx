#target "illustrator"

// resizeToLength
// Resizes the objects in the selection at a magnification that makes 
// the foremost path the specified length.
// (The same magnification is applied to paths other than the front.)

// For setting about resizing, please change the value of scaleOpt below.
// Note that the width of the lines is not changed by default. (changeLineWIdths)

// test env: Adobe Illustrator CC2017 (Win)

// Copyright(c) 2017 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// released: 2017.02.18

function main(){
    // SETTINGS
    var scaleOpt = {
        changePositions: true,
        changeFillPatterns: true,
        changeFillGradients: true,
        chnageStrokePattern: true,
        changeLineWIdths: false,
        scaleAbout: Transformation.DOCUMENTORIGIN };

    var transformOpt = {
        transformObjects: true,
        transformFillPatterns: true,
        transformFillGradients: true,
        transformStrokePattern: true };

    var alert_title = "Abort\r";

    // extract paths to determine magnification
    var paths = [];
    var sel = activeDocument.selection;
    extractPaths(sel, paths, 2);

    if(paths.length < 1){
        alert(alert_title + "Please include a path in the selection");
        return;
    }

    var current_length = paths[0].length;

    var target_length = prompt("target length (mm):", pt2mm(current_length));
    if(target_length == null){
        return;
    } else if(isNaN(target_length) || target_length <= 0){
        alert(alert_title + "Invalid input value");
        return;
    }

    var ratio = mm2pt(target_length) * 100 / current_length;
    var center = getCenterOfSelection(sel);

    for(var i = 0; i < sel.length; i++){
        sel[i].translate(-center[0], -center[1],
                         transformOpt.transformFillPatterns,
                         transformOpt.transformFillPatterns,
                         transformOpt.transformFillGradients,
                         transformOpt.transformStrokePattern);
        sel[i].resize(ratio, ratio,
                      scaleOpt.changePositions,
                      scaleOpt.changeFillPatterns,
                      scaleOpt.changeFillGradients,
                      scaleOpt.chnageStrokePattern,
                      scaleOpt.changeLineWIdths,
                      scaleOpt.scaleAbout);
        sel[i].translate(center[0], center[1],
                         transformOpt.transformFillPatterns,
                         transformOpt.transformFillPatterns,
                         transformOpt.transformFillGradients,
                         transformOpt.transformStrokePattern);
    }
}
// ----------------------------------------------
// gets the center of the selection
function getCenterOfSelection(sel){
    var gb = sel[0].geometricBounds; // left, top, right, bottom
    var rect = { left:gb[0], top:gb[1], right:gb[2], bottom:gb[3] };
    
    for(var i = 1; i < sel.length; i++){
        gb = sel[i].geometricBounds;
        if(gb[0] < rect.left) rect.left = gb[0];
        if(gb[1] > rect.top) rect.top = gb[1];
        if(gb[2] > rect.right) rect.right = gb[2];
        if(gb[3] < rect.bottom) rect.bottom = gb[3];
    }
    return [(rect.left + rect.right) / 2,
            (rect.top + rect.bottom) / 2];
}
// ----------------------------------------------
// PostScript point 2 millimeter
function pt2mm(n){  return n * 0.352778; }

// millimeter 2 PostScript point
// 1 mm = 2.83464567 pt
function mm2pt(n){  return n * 2.83465;  }
// ----------------------------------------------
// Add the pathItem included in the array sel (selection, 
// etc.) of pageItem to the array paths.
// When min_pp_length is specified, those with the number of pathPoints 
// less than min_pp_length are excluded.
function extractPaths(sel, paths, min_pp_length){
    if(!min_pp_length) min_pp_length = 1;
    
    for(var i = 0; i < sel.length; i++){
        if(sel[i].typename == "PathItem"){
            if(sel[i].pathPoints.length >= min_pp_length){
                paths.push(sel[i]);
            }
        } else if(sel[i].typename == "GroupItem"){
            // search for PathItems in GroupItem, recursively
            extractPaths(sel[i].pageItems, paths, min_pp_length);
            
        } else if(sel[i].typename == "CompoundPathItem"){
            // searches for pathitems in CompoundPathItem, recursively
            // ( ### Grouped PathItems in CompoundPathItem are ignored ### )
            extractPaths(sel[i].pathItems, paths, min_pp_length);
        }
    }
}
// ----------------------------------------------
main();
