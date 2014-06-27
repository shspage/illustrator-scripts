// breakDashes.jsx
// adobe Illustrator CSx script
// breaks each dashed path into a series of lines
//
// USAGE:
// Select paths and run this script.
//
// NOTE1: Illustrator's native dashes adjustment
//        feature is ignored because it is totally
//        out of control from JavaScript.
//
// Copyright(c) 2014 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

function main(){

    // use_group: set true to gather broken paths into a group
    var use_group = true;

    
    var paths = [];
    getPathItemsInSelection(1, paths);
    if( paths.length < 1 ){
        alert("nothing to do with this script\r"
              + "because there's no path in the selection");
        return;
    }

    var grp = use_group
        ? activeDocument.activeLayer.groupItems.add()
            : undefined;
    
    for (var i = 0; i < paths.length; i++){
        if (paths[i].strokeDashes.length > 0){
            breakDashes(paths[i], grp);
        }
    }
}

// --------------------------------------------
function breakDashes(line, grp){
    var sd = line.strokeDashes;

    if(sd.length == 1){
        sd.push(sd[0]);
    }

    for (var i = 0; i < line.pathPoints.length; i++){
        var next_i = parseIdx(line.pathPoints, i + 1);
        if(next_i < 0) break;

        // gets the anchor points on both ends
        var a1 = line.pathPoints[i].anchor;
        var a2 = line.pathPoints[next_i].anchor;

        // if the line is curve, it needs another method
        if(!arrEq(a1, line.pathPoints[i].rightDirection)
           || !arrEq(a2, line.pathPoints[next_i].leftDirection)){
            breakDashesForCurve(line, i, next_i, sd, grp);
            continue;
        }

        // gets the angle in radian
        var t = getRad(a1, a2);

        var line_length = dist(a1, a2);

        var sd1 = adjustDashes(sd, line_length);

        // draws a segment as a line with no dashes
        // if the length of the segment is shorter
        // than 1st dash.
        if(sd1.length < 1){
            var p = line.duplicate();
            p.closed = false;
            p.strokeDashes = [];
            p.setEntirePath([a1, a2]);
            if(grp) p.move(grp, ElementPlacement.PLACEATEND);
            continue;
        }
        
        var offset = sd1[0] / 2;
        
        var total_length = 0;
        var is_gap = true;
        var finish = false;
        
        while(true){
            for(var j = 0; j < sd1.length; j++){
                var d = sd1[j];
                
                if(offset > 0){
                    d -= offset;
                    offset = 0;
                }
                
                total_length += d;

                if( total_length >= line_length ){
                    var a3 = a2;
                    finish = true;
                } else {
                    var a3 = [ Math.cos(t) * d + a1[0],
                               Math.sin(t) * d + a1[1] ];
                }

                is_gap = (! is_gap);
                if(! is_gap){
                    var p = line.duplicate();
                    p.closed = false;
                    p.strokeDashes = [];
                    p.setEntirePath([a1, a3]);
                    if(grp) p.move(grp, ElementPlacement.PLACEATEND);
                }
                a1 = a3;
                if(finish) break;
            }
            if(finish) break;
        }
    }
    
    line.remove();
}
// ----------------------------------------------
function adjustDashes(sd, line_length, grp){
    var sd1;

    var dashes_length = 0;
    for (var i = 0; i < sd.length; i++){
        dashes_length += sd[i];
    }
    
    if(dashes_length == 0){
        sd1 = [];
        
    } else if(sd[0] > 0 && line_length <= sd[0]){
        sd1 = [];
        
    } else {
        var dashes_count = Math.floor(line_length / dashes_length + 0.6) || 1;
        
        sd1 = sd.slice(0);
        
        var ratio = line_length / (dashes_count * dashes_length);
        
        for(var j = 0; j < sd1.length; j++){
            sd1[j] *= ratio;
        }
    }
    
    return sd1;
}
// ----------------------------------------------
// return distance between p1 [x,y], p2 [x,y]
function dist(p1, p2) {
  return Math.sqrt( Math.pow(p1[0] - p2[0], 2)
        + Math.pow(p1[1] - p2[1], 2) );
}
// ----------------------------------------------
// return angle of the line drawn from "p1" [x,y] to "p2" [x,y]
function getRad(p1, p2) {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}
// --------------------------------------
// if the contents of both arrays are equal, return true (lengthes must be same)
function arrEq(arr1, arr2) {
  for(var i = 0; i < arr1.length; i++){
    if (arr1[i] != arr2[i]) return false;
  }
  return true;
}
// ----------------------------------------------
// return the index of pathpoint. when the argument is out of bounds,
// fixes it if the path is closed (ex. next of last index is 0),
// or return -1 if the path is not closed.
function parseIdx(p, n){ // PathPoints, number for index
  var len = p.length;
  if( p.parent.closed ){
    return n >= 0 ? n % len : len - Math.abs(n % len);
  } else {
    return (n < 0 || n > len - 1) ? -1 : n;
  }
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
// -----------------------------------------------
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
    setr : function(xy){ // set with an array
        this.x = xy[0];
        this.y = xy[1];
        return this;
    },
    setp : function(p){ // set with a Point
        this.x = p.x;
        this.y = p.y;
        return this;
    },
    addp : function(p){
        return new Point().set( this.x + p.x, this.y + p.y );
    },
    subp : function(p){
        return new Point().set( this.x - p.x, this.y - p.y );
    },
    mul : function(m){
        return new Point().set( this.x * m, this.y * m );
    },
    rotate : function(rad){
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        return new Point().set( this.x * c - this.y * s, this.x * s + this.y * c );
    },
    getAngle : function(){
        return Math.atan2( this.y, this.x ); // radian
    },
    normalize : function(){
        var d = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        var p = new Point();
        if( d == 0 ){
            p.set(0,0);
        } else {
            p.set(this.x / d, this.y / d);
        }
        return p;
    },
    toArray : function(){
        return [this.x, this.y];
    }
}

// -----------------------------------------------
var Curve = function(path, idx1, idx2){
    this.path = path;
    this.idx1 = idx1;
    this.idx2 = idx2;
    
    var pts = path.pathPoints;
    
    this.p1 = new Point().setr(pts[idx1].anchor);
    this.rdir = new Point().setr(pts[idx1].rightDirection);
    this.ldir = new Point().setr(pts[idx2].leftDirection);
    this.p2 = new Point().setr(pts[idx2].anchor);
    
    this.q = [this.p1, this.rdir, this.ldir, this.p2];
    this.params = null;
    this.length = null;
}
Curve.prototype = {
    bezier : function(t){
        var u = 1 - t;
        return new Point().set(
            u*u*u * this.p1.x + 3*u*t*(u* this.rdir.x + t* this.ldir.x) + t*t*t * this.p2.x,
            u*u*u * this.p1.y + 3*u*t*(u* this.rdir.y + t* this.ldir.y) + t*t*t * this.p2.y);
    },
    setParams : function(){
        var m = [this.p2.x - this.p1.x + 3 * (this.rdir.x - this.ldir.x),
                 this.p1.x - 2 * this.rdir.x + this.ldir.x,
                 this.rdir.x - this.p1.x];
        var n = [this.p2.y - this.p1.y + 3 * (this.rdir.y - this.ldir.y),
                 this.p1.y - 2 * this.rdir.y + this.ldir.y,
                 this.rdir.y - this.p1.y];
        
        this.params = [ m[0] * m[0] + n[0] * n[0],
                        4 * (m[0] * m[1] + n[0] * n[1]),
                        2 * ((m[0] * m[2] + n[0] * n[2]) + 2 * (m[1] * m[1] + n[1] * n[1])),
                        4 * (m[1] * m[2] + n[1] * n[2]),
                        m[2] * m[2] + n[2] * n[2]];
    },
    clone : function(){
        var c = new Curve(this.path, this.idx1, this.idx2);
        c.params = this.params;
        c.length = this.length;
        return c;
    },
    getLength : function(t){
        //if( !this.params ) this.setParams();
        var k = this.params;
    
        var h = t / 128;
        var hh = h * 2;
        
        var fc = function(t, k){
            return Math.sqrt(t * (t * (t * (t * k[0] + k[1]) + k[2]) + k[3]) + k[4]) || 0 };
        
        var total = (fc(0, k) - fc(t, k)) / 2;
        
        for(var i = h; i < t; i += hh){
            total += 2 * fc(i, k) + fc(i + h, k);
        }
        
        return total * hh;
    },
    getLeftDirForT : function(t){
        return new Point().set(
            t * (t * (this.p1.x - 2 * this.rdir.x + this.ldir.x) + 2 * (this.rdir.x - this.p1.x)) + this.p1.x,
            t * (t * (this.p1.y - 2 * this.rdir.y + this.ldir.y) + 2 * (this.rdir.y - this.p1.y)) + this.p1.y);
    },
    getRightDirForT : function(t){
        return new Point().set(
            t * (t * (this.rdir.x - 2 * this.ldir.x + this.p2.x) + 2 * (this.ldir.x - this.rdir.x)) + this.rdir.x,
            t * (t * (this.rdir.y - 2 * this.ldir.y + this.p2.y) + 2 * (this.ldir.y - this.rdir.y)) + this.rdir.y);
    },
    resetPoints : function(p1, rdir, ldir, p2){
        this.p1 = p1; this.rdir = rdir; this.ldir = ldir; this.p2 = p2;
        this.q = [p1, rdir, ldir, p2];
    },
    getContractedRdir : function(m){
        return this.p1.addp(this.rdir.subp(this.p1).mul(m));
    },
    getContractedLdir : function(m){
        return this.p2.addp(this.ldir.subp(this.p2).mul(m));
    },
    getPartForTAndLength : function(t, len){
        var c = this.clone();
        c.resetPoints(this.bezier(t), this.getRightDirForT(t),
                      this.getContractedLdir(1 - t), this.p2);
        c.setParams();
        c.length = c.getLength(1);
        var t1 = c.getTforLength(len);
        c.resetPoints(c.p1, c.getContractedRdir(t1),
                      c.getLeftDirForT(t1), c.bezier(t1));
        return c;
    },
    getTforLength : function(len){
        //if( !this.params ) this.setParams();
        var k = this.params;

        //if( !this.length) this.length = this.getLength(1);
        if(len <= 0){
            return 0;
        } else if(len > this.length){
            return 1;
        }
        
        var t, d;
        var t0 = 0;
        var t1 = 1;
        var torelance = 0.001;
        
        for(var h = 1; h < 30; h++){
            t = t0 + (t1 - t0) / 2;
            d = len - this.getLength(t);
            
            if(Math.abs(d) < torelance) break;
            else if(d < 0) t1 = t;
            else t0 = t;
        }
        
        return Math.min(1, t);
    }
}

// --------------------------------------------
function breakDashesForCurve(line, i, next_i, sd, grp){
    var cv = new Curve(line, i, next_i);

    cv.setParams();
    cv.length = cv.getLength(1);
    
    var line_length = cv.length;

    var sd1 = adjustDashes(sd, line_length);

    // draws a segment as a line with no dashes
    // if the length of the segment is shorter
    // than 1st dash.
    if(sd1.length < 1){
        var p = line.duplicate();
        p.closed = false;
        p.strokeDashes = [];
        var pp = p.pathPoints;
        var rdir = pp[i].rightDirection;
        var ldir = pp[next_i].leftDirection;
        p.setEntirePath([pp[i].anchor, pp[next_i].anchor]);
        pp = p.pathPoints;
        pp[0].rightDirection = rdir;
        pp[1].leftDirectin = ldir;
        if(grp) p.move(grp, ElementPlacement.PLACEATEND);
        return;
    }
        
    var offset = sd1[0] / 2;
        
    var total_length = 0;
    var is_gap = true;
    var finish = false;
    
    while(true){
        for(var j = 0; j < sd1.length; j++){
            var d = sd1[j];
            
            if(offset > 0){
                d -= offset;
                offset = 0;
            }
                
            if( total_length + d >= line_length ){
                finish = true;
            }
            
            is_gap = (! is_gap);
            if(! is_gap){
                var t = cv.getTforLength(total_length);
                var cv1 = cv.getPartForTAndLength(t, d);
                
                var p = line.duplicate();
                p.closed = false;
                p.strokeDashes = [];
                p.setEntirePath([cv1.p1.toArray(), cv1.p2.toArray()]);
                p.pathPoints[0].rightDirection = cv1.rdir.toArray();
                p.pathPoints[1].leftDirection = cv1.ldir.toArray();
                if(grp) p.move(grp, ElementPlacement.PLACEATEND);
            }

            if(finish) break;

            total_length += d;
        }
        if(finish) break;
    }
}
// ----------------------------------------------
main();
