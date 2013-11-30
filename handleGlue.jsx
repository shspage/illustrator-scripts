// handleGlue.jsx

// moves the selected end point of the foreground path to
// the inner handle's nearest tangent point on the other selected paths.
// If the nearest point is on the straight segment, the handle is
// rotated to the segment's angle.

// test env: Adobe Illustrator CC (Windows)

// Copyright(c) 2013 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// Sun, 01 Dec 2013 00:20:59 +0900

// ----------------------------------------------
var TOLERANCE = 0.00001;

function main(){
    var paths = [];
    
    getPathItemsInSelection(1, paths);
    if(paths.length < 2){
        alert("Abort:\nPlease select 2 or more paths.\n"
              + "Each path must have at least 2 anchor poitns.");
        return;
    }

    var tgt = paths.shift(); // the object to move
    if(tgt.closed){
        alert("Abort:\nThe foreground path must be an open path.");
        return;
    }

    var p = tgt.pathPoints;

    var errmsg = "";
    var errmsgs = [];
    
    if(isSelected(p[0])){
        errmsg = handleGlue(p[0], paths, true);
        if(errmsg != "") errmsgs.push(errmsg);
    }
    
    if(isSelected(p[p.length - 1])){
        errmsg = handleGlue(p[p.length - 1], paths, false);
        if(errmsg != "") errmsgs.push(errmsg);
    }

    if(errmsgs.length) alert( "Report:\n" + errmsgs.join("\n") );
}

// ----------------------------------------------
function handleGlue(p, paths, right_direction){
    var errmsg = "";
    var anc = p.anchor;
    var handle = right_direction ? p.rightDirection : p.leftDirection;
    var point_desc = right_direction ? "start point" : "end point";
    
    if(arrEq(anc, handle)){
        errmsg = point_desc + " : ignored because it doesn't has an inside handle";
        return errmsg;
    }
    
    var s = slope(anc, handle);
    
    var sol = { d_min:-1, d_min_pnt:null, vector:null };
    var tangent_pnt;
    
    for(var path_idx = 0; path_idx < paths.length; path_idx++){
        var pp = paths[ path_idx ].pathPoints;
        
        for(var pp_idx = 0; pp_idx < pp.length; pp_idx++){
            var next_idx = parseIdx(pp, pp_idx + 1);
            if(next_idx < 0) break;

            // defines a bezier curve segment
            var b = new Bezier(pp, pp_idx, next_idx);

            // ignores if the both ends is same point
            if( arrEq(b.a0, b.a1) ) continue;
                
            if( b.isStraight() ){
                // if the segment is straight, the target point is set to the nearest point.
                // in this case, the handle is rotated to the angle of the segment.
                var d_np_op = nerestPointOnSegment(anc, b.a0, b.a1);
                compDistance( d_np_op[0], d_np_op[1], d_np_op[2], sol);
                
            } else {
                // if the segment is not straignt,
                // finds the inner handle's nearest tangent point on the other selected paths.
                var ts;
                if(s == null){
                    ts = b.getTangentV();
                } else if(s == 0){
                    ts = b.getTangentH();
                } else {
                    ts = tBySlope(b, s, 0.0001);
                }
    
                for(var t_idx = 0; t_idx < ts.length; t_idx++){
                    if(ts[ t_idx ] < 0){ // value = -1 if there's no appropriate solution
                        continue;
                    }
                    tangent_pnt = b.pnt( ts[ t_idx ] );
                    
                    compDistance(dist(tangent_pnt, anc), tangent_pnt, null, sol);
                }
            }
        }
    }
    
    if(sol.d_min > 0){
        var offset = [ sol.d_min_pnt[0] - anc[0], sol.d_min_pnt[1] - anc[1] ];
        
        p.rightDirection = [ offset[0] + p.rightDirection[0], offset[1] + p.rightDirection[1] ];
        p.leftDirection = [ offset[0] + p.leftDirection[0], offset[1] + p.leftDirection[1] ];
        p.anchor = sol.d_min_pnt;
        
        if( sol.vector != null ){
            // rotate the handle
            handle = right_direction ? p.rightDirection : p.leftDirection;
            var angle = getRad( p.anchor, sol.vector );
            
            if( dot(handle, sol.vector, p.anchor) < TOLERANCE ){
                angle += Math.PI;
            }
            
            if( right_direction ){
                p.rightDirection = rotPntToAngle( p.rightDirection, p.anchor, angle );
                p.leftDirection  = p.anchor;
            } else {
                p.leftDirection = rotPntToAngle( p.leftDirection, p.anchor, angle );
                p.rightDirection = p.anchor;
            }
        }
    } else if (sol.d_min == 0){
        errmsg = point_desc + " : ignored because it is on line.";
    } else {
        errmsg = point_desc + " : failed to find a point to glue.";
    }

    return errmsg;
}
// -----------------------------------------------
function compDistance(d, tangent_pnt, vector, sol){
    if(sol.d_min < 0 || d < sol.d_min){
        sol.d_min = d;
        sol.d_min_pnt = tangent_pnt;
        sol.vector = vector;
    }
}
// -----------------------------------------------
// returns true if the anchor of the pathPoint is selected
function isSelected(p){ // PathPoint
    return p.selected == PathPointSelection.ANCHORPOINT;
}
// -----------------------------------------------
function parseIdx(p, n){ // PathPoints, number for index
    var len = p.length;
    if(p.parent.closed){
        return n >= 0 ? n % len : len - Math.abs(n % len);
    } else {
        return (n < 0 || n > len-1) ? -1 : n;
    }
}
// ----------------------------------------------
function rotPntToAngle(pnt, origin, rad){
    var d = dist(pnt, origin);
    return [ origin[0] + Math.cos(rad) * d,
             origin[1] + Math.sin(rad) * d];
}
// ----------------------------------------------
// returns angle of the line drawn from "p1" [x,y] to "p2" [x,y]
function getRad(p1, p2) {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}
// --------------------------------------
// returns true if all the values of Array arr1 = arr2
function arrEq(arr1, arr2) {
    for(var i = 0; i < arr1.length; i++){
        if (arr1[i] != arr2[i]) return false;
    }
    return true;
}
// ------------------------------------------------
// returns [ distance, nearest point on segment a-b, other point on a-b ]
// param: p = point,  a, b = both ends of the segment
// other point is used later to calc the angle of the segment.
function nerestPointOnSegment(p, a, b){
    var np; // nearest point
    var op; // other point
    
    var dp = dot(p, a, b);
    
    if(  dp < TOLERANCE ){
        np = b;
        op = a;
    } else if( dot(p, b, a) < TOLERANCE){
        np = a;
        op = b;
    } else {
        var cp = Math.abs( cross(p, a, b) );
        
        if( cp < TOLERANCE){
            np = p;
        } else {
            var ab = dist(a, b);
            
            var k = dp / (ab * ab);
            np = [k * (a[0] - b[0]) + b[0],
                  k * (a[1] - b[1]) + b[1]];
        }
        op = a;
    }

    return [ dist(p, np), np, op ];
}
// ------------------------------------------------
// subtacts point2 from point1 
function pSub(p1, p2){
    return [p1[0] - p2[0], p1[1] - p2[1]];
}
// ------------------------------------------------
// dot product of (o->p1) and (o->p2)
function dot(p1, p2, o){
    var po1 = pSub(p1, o);
    var po2 = pSub(p2, o);
    return po1[0] * po2[0] + po1[1] * po2[1];
}
// ------------------------------------------------
// cross product of (o->p1) and (o->p2)
function cross(p1, p2, o){
    var po1 = pSub(p1, o);
    var po2 = pSub(p2, o);
    return po1[0] * po2[1] + po1[1] * po2[0];
}
// ------------------------------------------------
// returns the squared distance between p1=[x,y] and p2=[x,y]
function dist2(p1, p2){
    return Math.pow(p1[0] - p2[0], 2)
        + Math.pow(p1[1] - p2[1], 2);
}
// ----------------------------------------------
// returns distance between p1 [x,y], p2 [x,y]
function dist(p1, p2) {
  return Math.sqrt( dist2(p1, p2) );
}
// ------------------------------------------------
// returns slope of the line drawn through "p1" [x,y] and "p2" [x,y]
function slope(p1, p2){
    var x = p1[0] - p2[0];
    return x == 0 ? null : (p1[1] - p2[1]) / x;
}
// ------------------------------------------------
// b: Bezier object
// k: slope of tangent
// torelance : torelance for parameter t
// return value : parameter t
function tBySlope(b, k, torelance){
    var t = equation2(3 * (b.y[0] - k * b.x[0]),
                      2 * (b.y[1] - k * b.x[1]),
                      b.y[2] - k * b.x[2]);
    if(t.length < 1) return [-1];
    var min_t = 0 - torelance;
    var max_t = 1 + torelance;
    var t0_invalid = (t[0] < min_t || t[0] > max_t);
    if(t.length > 1){
        var t1_invalid = (t[1] < min_t || t[1] > max_t);
        if (t0_invalid && t1_invalid) return [-1];
        else if (t0_invalid) return [t[1]];
        else if (t1_invalid) return [t[0]];
        else return t;
        //else return idx==0 ? Math.min(t[0],t[1]) : Math.max(t[0],t[1]);
    }
    return t0_invalid ? [-1] : [t[0]];
}
// ------------------------------------------------
// solves ax^2+bx+c=0
function equation2(a,b,c) {
    if(a == 0) return b == 0 ? [] : [-c / b];
    a *= 2;
    var d = b * b - 2 * a * c;
    if(d < 0) return [];
    var rd = Math.sqrt(d);
    if(d > 0) return [(-b + rd) / a, (-b - rd) / a];
    else return [-b / a];
}
// ------------------------------------------------
// extracts PathItems from the selection which length of PathPoints
// is greater than "n"
function getPathItemsInSelection(n, paths){
    if(documents.length < 1) return;
    
    var s = activeDocument.selection;
    
    if (!(s instanceof Array) || s.length < 1) return;
    
    extractPaths(s, n, paths);
}

// --------------------------------------
// extracts PathItems from "s" (Array of PageItems -- ex. selection),
// and put them into an Array "paths".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoints length is greater
// than this number.
function extractPaths(s, pp_length_limit, paths){
  for(var i = 0; i < s.length; i++){
    if(s[i].typename == "PathItem"){
      if(pp_length_limit
         && s[i].pathPoints.length <= pp_length_limit){
        continue;
      }
      paths.push(s[i]);
      
    } else if(s[i].typename == "GroupItem"){
      // search for PathItems in GroupItem, recursively
      extractPaths(s[i].pageItems, pp_length_limit, paths);
      
    } else if(s[i].typename == "CompoundPathItem"){
      // searches for pathitems in CompoundPathItem, recursively
      // ( ### Grouped PathItems in CompoundPathItem are ignored ### )
      extractPaths(s[i].pathItems, pp_length_limit , paths);
    }
  }
}

// Bezier ================================
var Bezier = function(pp, idx1, idx2){
  this.p  = pp;
  this.p0 = pp[idx1];
  this.p1 = pp[idx2];
  
  this.q = [pp[idx1].anchor, pp[idx1].rightDirection,
            pp[idx2].leftDirection, pp[idx2].anchor];
  this.a0 = this.q[0];
  this.r = this.q[1];
  this.l = this.q[2];
  this.a1 = this.q[3];
  
  this.x = defBezierCoefficients(this.q, 0);
  this.y = defBezierCoefficients(this.q, 1);
}
// --------------------------------------
Bezier.prototype = {
  pnt : function(t){
    return [ t* (t* (this.x[0]*t + this.x[1]) + this.x[2]) + this.x[3],
             t* (t* (this.y[0]*t + this.y[1]) + this.y[2]) + this.y[3] ];
  },
  getTangentV : function(){
    var ar = []
      var ts = [];
    ts = ts.concat( equation2( 3*this.x[0], 2*this.x[1], this.x[2] ) );
    for(var i=0; i<ts.length; i++){
      if(ts[i]<=1 && ts[i]>=0) ar.push(ts[i]);
    }
    if(ar.length>2) ar.sort();
    return ar;
  },
  getTangentH : function(){
    var ar = []
      var ts = [];
    ts = ts.concat( equation2( 3*this.y[0], 2*this.y[1], this.y[2] ) );
    for(var i=0; i<ts.length; i++){
      if(ts[i]<=1 && ts[i]>=0) ar.push(ts[i]);
    }
    if(ar.length>2) ar.sort();
    return ar;
  },
  isStraight : function(){
      return arrEq(this.a0, this.r) && arrEq(this.l, this.a1);
  }
}
// ------------------------------------------------
function defBezierCoefficients(q, n){
  return [-q[0][n] + 3 * (q[1][n] - q[2][n]) + q[3][n],
          3 * (q[0][n] - 2 * q[1][n] + q[2][n]),
          3 * (q[1][n] - q[0][n]),
          q[0][n]];
}
// ----------------------------------------------
main();
