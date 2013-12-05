// handleGlue.jsx

// mode "nearest" : moves the selected end point of the foreground
// open path(s) to its anchor point's nearest point on the other
// selected paths.
// The handle is rotated to the tangent's angle at the point.

// mode "angle" : moves the selected end point of the foreground
// open path(s) to its inner handle's nearest tangent point on
// the other selected paths.  If the segment is straight, (and
// the handle of selected point is parallel to it), selected
// end point is moved to its nearest point on it.

// multi : If false, it moves only the foreground open path.
// If true, moves all the open path in the selection.
// If all the selected paths are open path, the last
// (most background) path is treated as "the other path".

// add_anchor : If true, it adds an anchor point at
// the point on the path that the selected anchor moved to.

// test env: Adobe Illustrator CC (Win / Mac)

// Copyright(c) 2013 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// Thu, 05 Dec 2013 23:05:00 +0900

// ----------------------------------------------
// for parameter details, see the description of the script.
// param mode : 1 = "nearest", not 1 = "angle"
// param multi : true / false
// param add_anchor : true / false
function handleGlue( mode, multi, add_anchor){
    if( mode == undefined ) mode = 1;
    if( multi == undefined ) multi = false;
    if( add_anchor == undefined ) add_anchor = false;
    
    // various values
    var conf = {
        TOLERANCE : 0.00001,
        INITIAL_T_STEP : 0.05,
        REPEAT_LIMIT : 100,
        MAX_ERROR_MESSAGES : 5,
        add_anchor : add_anchor
        };

    var handleGlueFunc = mode == 1 ? handleGlue1 : handleGlue2;
  
    var paths = [];
    
    getPathItemsInSelection(1, paths);
    if(paths.length < 2){
        alert("Abort:\nPlease select 2 or more paths.\n"
              + "Each path must have at least 2 anchor poitns.");
        return;
    }

    var lines = [];  // paths to move their ends
    var shapes = []; // paths to find the nearest point on them
    var i;
    
    for(i = 0; i < paths.length; i++){
        if( ! paths[i].closed
            && ! ( (! multi) && lines.length )){
            lines.push( paths[i] );
        } else {
            shapes.push( paths[i] );
        }
    }
    
    if( lines.length < 1 ){
        alert("Abort:\nThere\'s no open path in the selection.");
        return;
    } else if( shapes.length < 1 ){
        // if multi is true and all the paths is open path,
        // treats the last path as a shape
        shapes.push( lines.pop() );
    }
    
    var errmsg = "";
    var errmsgs = [];

    var addErrorMessage = function(){
        if(errmsgs.length > conf.MAX_ERROR_MESSAGES){
            // does nothing
        } else if(errmsgs.length > conf.MAX_ERROR_MESSAGES - 1){
            errmsgs.push("...(and other errors)");
        } else {
            errmsgs.push(errmsg);
        }
    };
    
    for(i = 0; i < lines.length; i++){
        var p = lines[i].pathPoints;

        if(isSelected(p[0])){
            errmsg = handleGlueFunc(p[0], shapes, true, conf);
            if(errmsg != "") addErrorMessage();
        }
    
        if(isSelected(p[p.length - 1])){
            errmsg = handleGlueFunc(p[p.length - 1], shapes, false, conf);
            if(errmsg != "") addErrorMessage();
        }
    }
    
    if( errmsgs.length ){
        alert( "Report:\n" + errmsgs.join("\n") );
    }
}

// ----------------------------------------------
function handleGlue2(p, paths, right_direction, conf){
    var errmsg = "";
    var handle = right_direction ? p.rightDirection : p.leftDirection;
    var point_desc = right_direction ? "start point" : "end point";
    
    if(arrEq(p.anchor, handle)){
        errmsg = point_desc + " : ignored because it doesn't has an inside handle";
        return errmsg;
    }
    
    var s = slope(p.anchor, handle);
    
    var sol = { d_min:-1, d_min_pnt:null, b:null, t:null };
    var tangent_pnt;
    
    var compDistance = function(d, tangent_pnt, sol, b, t){
        if(sol.d_min < 0 || d < sol.d_min){
            sol.d_min = d;
            sol.d_min_pnt = tangent_pnt;
            sol.b = b;
            sol.t = t;
        }
    };
    
    for(var path_idx = 0; path_idx < paths.length; path_idx++){
        var pp = paths[ path_idx ].pathPoints;
        
        for(var pp_idx = 0; pp_idx < pp.length; pp_idx++){
            var next_idx = parseIdx(pp, pp_idx + 1);
            if(next_idx < 0) break;

            // ignores if the segment is not selected.
            if(! sideSelection(pp, pp_idx, next_idx)) continue;
               
            // defines a bezier curve segment
            var b = new Bezier(pp, pp_idx, next_idx);

            // ignores if the both ends are same point
            if( arrEq(b.a0, b.a1) ) continue;
                
            if( b.isStraight() ){
                // if the segment is straight, and handle to move is parallel to it,
                // the target point is set to the nearest point.
                if(!arrEq(p.rightDirection, p.leftDirection)
                   && isParallel(b.a0, b.a1, p.rightDirection, p.leftDirection, conf)){
                    
                    var result = nerestPointOnSegment(p.anchor, b.a0, b.a1, conf);
                    compDistance( result.d, result.np, sol, b, null);
                }
                
            } else {
                // if the segment is not straignt,
                // finds the inner handle's nearest tangent point on the other selected paths.
                var ts;
                if(s == null){
                    ts = b.getTangentV();
                } else if(s == 0){
                    ts = b.getTangentH();
                } else {
                    ts = tBySlope(b, s, conf.TOLERANCE);
                }
    
                for(var t_idx = 0; t_idx < ts.length; t_idx++){
                    if(ts[ t_idx ] < 0){ // value = -1 if there's no appropriate solution
                        continue;
                    }
                    tangent_pnt = b.pnt( ts[ t_idx ] );
                    
                    compDistance(dist(tangent_pnt, p.anchor), tangent_pnt, sol, b, ts[ t_idx ]);
                }
            }
        }
    }
    
    if(sol.d_min > 0){
        movePathPointTo(p, sol.d_min_pnt);
        
        if(conf.add_anchor){
            if(sol.t == null){
                addAnchorNextToIdx(sol.b.pp, sol.b.idx1, sol.d_min_pnt);
            } else if(sol.t > 0 && sol.t < 1){
                addAnchorAtT(sol.b.pp, sol.b.idx1, sol.b.idx2, sol.t, sol.b, sol.d_min_pnt);
            }
        }
    } else if (sol.d_min == 0){
        errmsg = point_desc + " : ignored because it is on line.";
    } else {
        errmsg = point_desc + " : failed to find a point to glue.";
    }

    return errmsg;
}
// ------------------------------------------------
// returns an information about the nearest point on the (straight) segment a-b
// param p    : point
// param a, b : both ends of the segment
// return { d : distance, np : nearest point on segment a-b }
function nerestPointOnSegment(p, a, b, conf){
    var result = {
        d : null,  // distance
        np : null,  // nearest point
        };
    
    var dp = dot(p, a, b);
    
    if(  dp < conf.TOLERANCE ){
        result.np = b;
    } else if( dot(p, b, a) < conf.TOLERANCE){
        result.np = a;
    } else {
        var cp = Math.abs( cross(p, a, b) );
        
        if( cp < conf.TOLERANCE){
            result.np = p;
        } else {
            var k = dp / dist2(a, b);
            result.np = [k * (a[0] - b[0]) + b[0],
                  k * (a[1] - b[1]) + b[1]];
        }
    }

    result.d = dist(p, result.np);
    return result;
}
// ------------------------------------------------
// moves pathPoint p to the nearest point on paths
// param p     : pathPoint
// param paths : array of pathItem,
// param right_direction : true if it manipulates rightDirection
// return error message
function handleGlue1(p, paths, right_direction, conf){
    var errmsg = "";
    var point_desc = right_direction ? "start point" : "end point";

    var mp = roughMeasureing(p, paths, conf);
    
    var msg_fail_to_find = " : failed to find a point to glue.";
    
    if(mp.d < 0){
        errmsg = point_desc + msg_fail_to_find;
        
    } else {
        var np_spec = findTForNearestPoint(mp.b, mp.t, p.anchor, conf.INITIAL_T_STEP, conf);
        
        if( mp.alt.t != null){
            var np_spec_alt = findTForNearestPoint(mp.alt.b, mp.alt.t, p.anchor, conf.INITIAL_T_STEP, conf);
            if( np_spec_alt.d < np_spec.d ) np_spec = np_spec_alt;
        }
        
        if(np_spec.errmsg != ""){
            errmsg = point_desc + "?F" + np_spec.errmsg;
            
        } else if( np_spec.d < 0){
            errmsg = point_desc + msg_fail_to_find;
            
        } else {
            // move anchor
            var d_min_pnt = np_spec.b.pnt( np_spec.t );

            movePathPointTo(p, d_min_pnt);
            
            if(conf.add_anchor){
                if(np_spec.t > 0 && np_spec.t < 1){
                    addAnchorAtT(np_spec.b.pp, np_spec.b.idx1, np_spec.b.idx2, np_spec.t, np_spec.b, d_min_pnt);
                }
            }
            
            // rotate handle
            var handle = right_direction ? p.rightDirection : p.leftDirection;
            var angle = np_spec.b.getTangentAngle(np_spec.t);

            var anglePnt = [ d_min_pnt[0] + Math.cos(angle),
                             d_min_pnt[1] + Math.sin(angle)];

            if( dot(handle, anglePnt, p.anchor) < conf.TOLERANCE ){
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
    }
    
    return errmsg;
}
// ------------------------------------------------
// roughly finds bezier parameter t of the nearest point on the line
// param p     : pathPoint
// param paths : array of pathItem
// return specification of the minimum distance point on the line
function roughMeasureing(p, paths, conf){
    var mp = {      // Minimum distance Point on the line
      d : -1,       // distance
      t : null,     // bezier parameter t
      idx : null,   // pathPoint's index
      nidx : null,  // next index
      b : null,     // Bezier object
      alt : { d : -1, t : null }  // alternative
    };
    
    var result = { d : -1, t : null };
    
    var measureing = function (b, p){
        result.d = -1;
        
        for(var t = 0; t <= 1; t += conf.INITIAL_T_STEP){
            var d = b.dist2(t, p);
            if(result.d < 0 || d < result.d){
                result.d = d;
                result.t = t;
            }
        }
    };

    for(var i = 0; i < paths.length; i++){
        var pp = paths[i].pathPoints;
        var found = false;
        
        for(var pp_idx = 0; pp_idx < pp.length; pp_idx++){
            var nidx = parseIdx(pp, pp_idx + 1);
            if(nidx < 0) break;

            // aborts if the segment is not selected
            if(! sideSelection(pp, pp_idx, nidx)) continue;
               
            // defines an bezier curve segment
            var b = new Bezier(pp, pp_idx, nidx);

            // aborts processing if both ends are same point
            if( arrEq(b.a0, b.a1) ) continue;
                
            measureing(b, p.anchor);

            if(result.d > -1){
                if (mp.d < 0 || result.d < mp.d){
                    found = true;
                    mp.d = result.d;
                    mp.t = result.t;
                    mp.idx = pp_idx;
                    mp.nidx = nidx;
                    mp.b = b;
                }
            }
        }

        if( found ){
            if( mp.t < conf.TOLERANCE && mp.pidx > -1 ){
                var pidx = parseIdx(pp, mp.idx - 1);
                if(pidx > -1){
                    mp.alt.b = new Bezier(pp, pidx, mp.idx );
                    mp.alt.t = 1 - conf.INITIAL_T_STEP;
                }
            } else if( mp.t > 1 - conf.TOLERANCE ){
                var next_nidx = parseIdx(pp, mp.nidx + 1);
                if(next_nidx > -1){
                    mp.alt.b = new Bezier(pp, mp.nidx, next_nidx);
                    mp.alt.t = conf.INITIAL_T_STEP;
                }
            } else {
                mp.alt.t = null;
            }
        }
    }
    return mp;
}
// ------------------------------------------------
// returns information for the nearest point
// param b      : Bezier object
// param t      : initial parameter t
// param p      : [x, y]
// param t_step : step of parameter t
// return specifications of the nearest point on the line
function findTForNearestPoint(b, t, p, t_step, conf){
    var getMinT = function(t, t_step){
        return Math.max(0, t - t_step);
    };
    
    var getMaxT = function(t, t_step){
        return Math.min(1, t + t_step);
    };

    // the object to return
    // Nearest Point SPECification
    var np_spec = {
        d : -1,           // distance
        t : t,            // parameter t
        b : b,            // Bezier object
        t_step : t_step,  // step of t
        t_min : getMinT(t, t_step),  // t for start finding NP 
        t_max : getMaxT(t, t_step),  // t for end finding NP
        errmsg : "",      // error message or empty string
        repeat : 0        // counter for repeating
      };

    var findT = function(b, p){
        np_spec.t_step /= 2;
        
        for(var t = np_spec.t_min; t <= np_spec.t_max; t += np_spec.t_step){
            var d = b.dist2(t, p);
            if( np_spec.d < 0 || d < np_spec.d ){
                np_spec.d = d;
                np_spec.t = t;
            }
        }
    };

    while(1){
        np_spec.repeat++;
        if(np_spec.repeat > conf.REPEAT_LIMIT){
            np_spec.errmsg = "failed to compute the nearestpoint.";
            break;
        }
        
        findT(b, p);
        np_spec.t_min = getMinT(np_spec.t, np_spec.t_step);
        np_spec.t_max = getMaxT(np_spec.t, np_spec.t_step);

        // break if point for t_min and t_max is close enough
        if( dist2(b.pnt(np_spec.t_min), b.pnt(np_spec.t_max)) < conf.TOLERANCE ) break;
    }

    return np_spec;
}

// Math and Utility ================================
// ----------------------------------------------
function rotPntToAngle(pnt, origin, rad){
    var d = dist(pnt, origin);
    return [ origin[0] + Math.cos(rad) * d,
             origin[1] + Math.sin(rad) * d];
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
// subtacts point2 from point1 
function pSub(p1, p2){
    return [p1[0] - p2[0], p1[1] - p2[1]];
}
// ------------------------------------------------
function isParallel(p1, p2, q1, q2, conf){
    var p = pSub(p1, p2);
    var q = pSub(q1, q2);
    return p[0] * q[1] - p[1] * q[0] < conf.TOLERANCE;
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
    return po1[0] * po2[1] - po1[1] * po2[0];
}
// ------------------------------------------------
// return the squared distance between p1=[x,y] and p2=[x,y]
function dist2(p1, p2){
    return Math.pow(p1[0] - p2[0], 2)
        + Math.pow(p1[1] - p2[1], 2);
}
// ----------------------------------------------
// return distance between p1 [x,y], p2 [x,y]
function dist(p1, p2) {
  return Math.sqrt( dist2(p1, p2) );
}
// ------------------------------------------------
// return slope of the line drawn through "p1" [x,y] and "p2" [x,y]
function slope(p1, p2){
    var x = p1[0] - p2[0];
    return x == 0 ? null : (p1[1] - p2[1]) / x;
}
// ----------------------------------------------
// return angle of the line drawn from "p1" [x,y] to "p2" [x,y]
function getRad(p1, p2) {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
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

// PathItem, PathPoint ================================
// -----------------------------------------------
function parseIdx(p, n){ // PathPoints, number for index
    var len = p.length;
    if(p.parent.closed){
        return n >= 0 ? n % len : len - Math.abs(n % len);
    } else {
        return (n < 0 || n > len-1) ? -1 : n;
    }
}
// ------------------------------------------------
// moves pathPoint p to coordinate q
function movePathPointTo(p, q){  // pathPoint, [x, y]
  var offset = [ q[0] - p.anchor[0], q[1] - p.anchor[1] ];
  
  p.rightDirection = [ offset[0] + p.rightDirection[0], offset[1] + p.rightDirection[1] ];
  p.leftDirection = [ offset[0] + p.leftDirection[0], offset[1] + p.leftDirection[1] ];
  p.anchor = q;
}
// -----------------------------------------------
// returns if the anchor point of pathPoint p is selected
function isSelected(p){ // PathPoint
    return p.selected == PathPointSelection.ANCHORPOINT;
}
// -----------------------------------------------
// returns if the line between anchor p[i] and p[j] is selected
function sideSelection(p,i,j) { // p:pathPoint, i,j:index
  return (p[i].selected != PathPointSelection.NOSELECTION
      && p[i].selected != PathPointSelection.LEFTDIRECTION
      && p[j].selected != PathPointSelection.NOSELECTION
      && p[j].selected != PathPointSelection.RIGHTDIRECTION);
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
  this.pp  = pp;
  this.idx1 = idx1;
  this.idx2 = idx2;
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
  getTangentAngle : function( t ){
      var rad;
      var dx = t* (t*3*this.x[0] + 2*this.x[1]) + this.x[2];
      if(dx == 0){
          rad = Math.PI / 2;
      } else {
          var dy = t* (t*3*this.y[0] + 2*this.y[1]) + this.y[2];
          rad = Math.atan2( dy, dx );
      }
      return rad;
  },
  isStraight : function(){
    return arrEq(this.a0, this.r) && arrEq(this.l, this.a1);
  },
  dist2 : function(t, p){
    return Math.pow( t* (t* (t* this.x[0] + this.x[1]) + this.x[2]) + this.x[3] - p[0], 2)
      + Math.pow( t* (t* (t* this.y[0] + this.y[1]) + this.y[2]) + this.y[3] - p[1], 2);
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
// returns parameter t of bezier curve at the point
// according to the tangents' slope.
// param b         : Bezier object
// param k         : slope of tangent
// param torelance : torelance for parameter t
// return parameter t. in the form of an array.
//         array length can be 1 or 2.
//         [ -1 ] if it fails to find t.
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


// Point  ================================
var Point = function(){
    this.x = 0;
    this.y = 0;
}
Point.prototype = {
  set : function(x, y){
      this.x = x;
      this.y = y;
      return this;
  },
  setr : function(r){
      this.x = r[0];
      this.y = r[1];
      return this;
  },
  clone : function(){
      return new Point().set(this.x, this.y);
  },
  addp : function(p){
      var c = this.clone();
      c.x += p.x;
      c.y += p.y;
      return c;
  },
  addr : function(r){
      var c = this.clone();
      c.x += r[0];
      c.y += r[1];
      return c;
  },
  subp : function(p){
      var c = this.clone();
      c.x -= p.x;
      c.y -= p.y;
      return c;
  },
  subr : function(r){
      var c = this.clone();
      c.x -= r[0];
      c.y -= r[1];
      return c;
  },
  mul : function(m){
      var c = this.clone();
      c.x *= m;
      c.y *= m;
      return c;
  },
  toArray : function(){
      return [this.x, this.y];
  }
}
// vPathPoint ============================
// virtual PathPoint
var vPathPoint = function(pp){
    this.a = pp.anchor;
    this.rd = pp.rightDirection;
    this.ld = pp.leftDirection;
    this.ptype = pp.pointType;
    this.selected = pp.selected;
}
vPathPoint.prototype = {
  apply : function(pp){
      pp.anchor = this.a;
      pp.rightDirection = this.rd;
      pp.leftDirection = this.ld;
      pp.pointType = this.ptype;
      pp.selected = this.selected;
  }
}
// --------------------------------------
function addAnchorNextToIdx(pp, idx, pnt){
    var vps = [];
    var i, vp;
    for(i = 0; i < pp.length; i++){
        vp = new vPathPoint(pp[i]);
        vps.push( vp );
        
        if( i == idx ){
            vp = new vPathPoint(pp[i]);
            vp.a = pnt;
            vp.rd = vp.a;
            vp.ld = vp.a;
            vp.ptype = PointType.CORNER;
            vp.selected = PathPointSelection.ANCHORPOINT
            vps.push( vp );
        }
    }

    pp.add();
    for(i = 0; i < pp.length; i++){
        vps[i].apply( pp[i] );
    }
}
// --------------------------------------
function addAnchorAtT(pp, idx1, idx2, t, b, pnt){
    if(pnt == undefined){
        if(b == undefined){
            b = new Bezier(pp, idx1, idx2);
        }
        pnt = b.pnt(t);
    }

    var anc1 = new Point().setr( pp[idx1].anchor );
    var rdir = new Point().setr( pp[idx1].rightDirection );
    var ldir = new Point().setr( pp[idx2].leftDirection );
    var anc2 = new Point().setr( pp[idx2].anchor );

    var mp = rdir.mul(1 - t).addp( ldir.mul(t) );
    rdir = rdir.subp(anc1).mul(t).addp(anc1);
    ldir = ldir.subp(anc2).mul(1 - t).addp(anc2);
    var p_ldir = rdir.mul(1 - t).addp( mp.mul(t));
    var p_rdir = ldir.mul(t).addp( mp.mul(1 - t) );

    var vps = [];
    var i, vp;
    for(i = 0; i < pp.length; i++){
        vp = new vPathPoint(pp[i]);
        if( i == idx1 ){
            vp.rd = rdir.toArray();
        } else if( i == idx2 ){
            vp.ld = ldir.toArray();
        }
        vps.push( vp );
        
        if( i == idx1 ){
            vp = new vPathPoint(pp[i]);
            vp.a = pnt;
            vp.rd = p_rdir.toArray();
            vp.ld = p_ldir.toArray();
            vp.ptype = PointType.SMOOTH;
            vp.selected = PathPointSelection.ANCHORPOINT
            vps.push( vp );
        }
    }

    pp.add();
    for(i = 0; i < pp.length; i++){
        vps[i].apply( pp[i] );
    }
}
handleGlue();

function performUndo(){
    // for extension use
    app.undo();
}
