#target "illustrator"

// flapClose
// For the selected open paths, this script rotates the 
// part from the first selected anchor to the start point and the part from 
// the last selected anchor to the end point so that the start point and 
// the end point to be matched.
//
// The shape of the part to be rotated does not change.
// For this reason, if end points can not be matched even if rotated, a 
// message will be displayed and processing will not be executed.
//
// SETTINGS
// If close_path is set to true in the following config section, the 
// path whose end point is matched is turned into a closed path.
//
// NOTE
// * When the anchor of the start point is selected, it is assumed that 
//   the second anchor from the start point is selected.  The same is true if 
//   the end point is selected.
// * Paths with less than four anchors in the selection range are ignored.

// test env: Adobe Illustrator CC2017 (Win)

// Copyright(c) 2017 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// released: 2017.02.17  00:30:06 +0900

function main(){
    // SETTINGS
    var config = {
        close_path: false,
    };
    
    var alert_title = "Abort\r";
    
    // select open paths (with 4 or more anchors)
    var paths = [];
    extractOpenPaths(activeDocument.selection, paths, 4);

    if(paths.length < 1){
        alert(alert_title + "Please select open paths.");
        return;
    }

    for(var si = 0; si < paths.length; si++){
        var path = paths[si];
    
        var pp = path.pathPoints;
    
        // get indices of selected anchor points
        var z = pp.length - 1;
        var idx1 = -1;
        var idx2 = -1;
        var r1 = 0;
        var r2 = 0;
        
        for(var i = 0; i < z; i++){
            if(isSelected(pp[i])){
                if(i == 0) i = 1;
                idx1 = i;
                r1 = dist(pp[i].anchor, pp[0].anchor);
                break;
            }
        }
        for(var i = z; i > 0; i--){
            if(isSelected(pp[i])){
                if(i == z) i = z - 1;
                idx2 = i;
                r2 = dist(pp[i].anchor, pp[z].anchor);
                break;
            }
        }
    
        // verify
        if(verify1(idx1, idx2, alert_title)) return;
        var d = dist(pp[idx1].anchor, pp[idx2].anchor);
        if(verify2(r1, r2, d, alert_title)) return;
    
        // calc angle for rotation
        var calcErr = false;
        var v1, v2;
        var t3, t4, t5;
        var t1, t2;
        
        t3 = lawOfCosines(r2, r1, d);
        if(isNaN(t3)) calcErr = true;
    
        if(!calcErr){
            v1 = subCoord(pp[0].anchor, pp[idx1].anchor);
            v2 = subCoord(pp[idx2].anchor, pp[idx1].anchor);
            t4 = innerProduct(v1, v2, r1, d);
            if(isNaN(t4)) calcErr = true;
        }
        if(calcErr){
            alert(alert_title + "Failed to calculate an angle (starting side)");
            return;
        }
        
        t5 = crossProduct(v1, v2);
        t1 = t5 > 0 ? t4 - t3 : t3 - t4;
    
        t3 = lawOfCosines(r1, r2, d);
        if(isNaN(t3)) calcErr = true;
        
        if(!calcErr){
            v1 = subCoord(pp[z].anchor, pp[idx2].anchor);
            v2 = subCoord(pp[idx1].anchor, pp[idx2].anchor);
            t4 = innerProduct(v1, v2, r2, d);
            if(isNaN(t4)) calcErr = true;
        }
        if(calcErr){
            alert(alert_title + "Failed to calculate an angle (ending side)");
            return;
        }
    
        t5 = crossProduct(v1, v2);
        t2 = t5 > 0 ? t4 - t3 : t3 - t4;
    
        // manipulation of paths
        rotPathPoints(pp, 0, idx1-1, pp[idx1].anchor, t1);
        if(!isEqualCoord(pp[idx1].leftDirection, pp[idx1].anchor)){
            pp[idx1].leftDirection = rotPoint(pp[idx1].leftDirection, pp[idx1].anchor, t1);
        }
        
        rotPathPoints(pp, idx2+1, z, pp[idx2].anchor, t2);
        if(!isEqualCoord(pp[idx2].rightDirection, pp[idx2].anchor)){
            pp[idx2].rightDirection = rotPoint(pp[idx2].rightDirection, pp[idx2].anchor, t2);
        }

        if(config.close_path){
            closeProcessedPath(path, pp);
        }
    }
}
// ----------------------------------------------
function closeProcessedPath(path, pp){  // PathItem, PathPoints
    pp[0].leftDirection = pp[pp.length - 1].leftDirection;
    pp[pp.length - 1].remove();
    path.closed = true;
}
// ----------------------------------------------
// verify 1
function verify1(idx1, idx2, alert_title){
    if(idx1 < 0 && idx2 < 0){
        alert(alert_title + "There's no selected anchor point.");
        return true;
    } else if(idx1 < 0 || idx2 < 0 || idx1 == idx2){
        alert(alert_title + "Couldn't process because only one anchor selected.");
        return true;
    }
    return false;
}
// ----------------------------------------------
// verify 2
function verify2(r1, r2, d, alert_title){
    if(d == 0){
        alert(alert_title + "Couldn't process if a distance between target anchors is zero.");
        return true;
    } else if(r1 + r2 < d){
        alert(alert_title + "End points can not be matched (too short)");
        return true;
    } else if(d + r1 < r2 || d + r2 < r1){
        alert(alert_title + "End points can not be matched (too long)");
        return true;
    }
    return false;
}
// ----------------------------------------------
// return true if coordinates p1 and p2 is the same
function isEqualCoord(p1, p2){
    return p1[0] == p2[0] && p1[1] == p1[1];
}
// ----------------------------------------------
// Rotate the pathPoint from index idxStart to idxEnd of pathPoints pp 
// by angle t around point o
function rotPathPoints(pp, idxStart, idxEnd, o, t){
    for(var i = idxStart; i <= idxEnd; i++){
        pp[i].anchor = rotPoint(pp[i].anchor, o, t);
        pp[i].rightDirection = rotPoint(pp[i].rightDirection, o, t);
        pp[i].leftDirection = rotPoint(pp[i].leftDirection, o, t);
    }
}
// ----------------------------------------------
// Rotate point p by angle t around point o
function rotPoint(p, o, t){
    var c = Math.cos(t);
    var s = Math.sin(t);
    var dx = p[0] - o[0];
    var dy = p[1] - o[1];
    return [c * dx - s * dy + o[0],
            s * dx + c * dy + o[1]];
}
// ----------------------------------------------
// The cosine theorem. A, b, c is the length of each side of the 
// triangle. Returns the angle of the corner between sides b and c
function lawOfCosines(a, b, c){
    // return angle A
    var d = 2 * b * c;
    if(d == 0){
        //alert("lawOfCosines:d == 0");
        return NaN;
    }
    return Math.acos((b*b + c*c - a*a) / d);
}
// ----------------------------------------------
// Returns the cross product of vectors v1, v2
function crossProduct(v1, v2){
    return v1[0] * v2[1] - v2[0] * v1[1];
}
// ----------------------------------------------
// Returns the inner product of vectors v1, v2.
// N1, n2 are norms of each. Calculated if undefined
function innerProduct(v1, v2, n1, n2){
    if(n1 == undefined) n1 = norm(v1);
    if(n2 == undefined) n2 = norm(v2);
    var n = n1 * n2;
    if(n == 0){
        //alert("innerProduct:n == 0");
        return NaN;
    }
    return Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / n);
}
// ----------------------------------------------
// Returns the coordinates of p1 when p2 is the origin
function subCoord(p1, p2){
    return [p1[0] - p2[0], p1[1] - p2[1]];
}
// ----------------------------------------------
// Returns true if pathPoint ppt is selected
function isSelected(ppt){
    return ppt.selected == PathPointSelection.ANCHORPOINT;
}
// ----------------------------------------------
// Returns the norm of vector v
function norm(v){
    return Math.sqrt(v[0]*v[0] + v[1]*v[1]);
}
// ----------------------------------------------
// Returns the distance between points p and q
function dist(p, q){
    var dx = p[0] - q[0];
    var dy = p[1] - q[1];
    return Math.sqrt(dx*dx + dy*dy);
}
// ----------------------------------------------
// Add the pathItem (open path) included in the array sel (selection, 
// etc.) of pageItem to the array paths.
// When min_pp_length is specified, those with the number of pathPoints 
// less than min_pp_length are excluded.
function extractOpenPaths(sel, paths, min_pp_length){
    if(!min_pp_length) min_pp_length = 1;
    
    for(var i = 0; i < sel.length; i++){
        if(sel[i].typename == "PathItem"){
            if(sel[i].pathPoints.length >= min_pp_length
               && sel[i].closed == false){
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
