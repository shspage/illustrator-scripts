// notches.jsx

// draws sewing notches along the selected segments.
// USAGE: select the segments of paths and run this script.

// test env: Adobe Illustrator CC2014 (Win/Mac)

// Copyright(c) 2014 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// Mon, 22 Sep 2014 23:53:27 +0900

function main(){
    var script_name = "Notches";
    
    if(documents.length < 1) return;

    var paths = [];
    getPathItemsInSelection(1, paths);

    if(paths.length < 1){
        alert( script_name + ": select path(s) before run this script");
        return;
    }

    // dialog
    var win = new Window("dialog", script_name);
    win.alignChildren = "right";
    
    var edits = {
        div_count : new EditTextWithLabel(win, "div count:", 4),
        notch_length : new EditTextWithLabel(win, "notch length(mm):", 10)
        };
    edits.div_count.activate();
    
    addOkCancelButtons(win, (function(){
        var opts = {
            div_count : parseFloat( edits.div_count.getValue() ),
            notch_length : mm2pt(parseFloat( edits.notch_length.getValue() ))
            };
        
        var ok = true;
        if(opts.div_count <= 1 ){
            alert("The value for the div count is invalid");
            ok = false;
        } else if(opts.notch_length <= 0 ){
            alert("The value for the notch length is invalid");
            ok = false;
        } else {
            drawNotches(paths, opts);
        }
        return ok;
    }));
    win.show();
}
// -----------------------------------------------
// ScriptUI utility
var EditTextWithLabel = function(win, label, defaultvalue){
    var gr = win.add("group");
    gr.add("statictext", undefined, label);
    this.et = gr.add("edittext", undefined, defaultvalue);
    this.et.characters = 4;
    this.et.active = true;
}
EditTextWithLabel.prototype = {
    getValue : function(){
        var v = parseFloat(this.et.text);
        return isNaN(v) ? 0 : v;
    },
    activate : function(){
        this.et.active = true;
    }
}
// -----------------------------------------------
// ScriptUI utility
function addOkCancelButtons(win, func){
    var gr = win.add("group");
    var btn_ok = gr.add("button", undefined, "OK");
    var btn_cancel = gr.add("button", undefined, "Cancel");
    btn_ok.onClick = function(){
        if( func() ) win.close();
    };
}
// -----------------------------------------------
// core function
function drawNotches( paths, opts ){
    for( var sIdx = 0, sEnd = paths.length; sIdx < sEnd; sIdx++){
        var path = paths[sIdx];
        
        var pts = path.pathPoints;

        // curves is a set of arrays of a series of Curve instances.
        // curves = [ [ new Curve(pts, 0, 1), new Curve(pts, 1, 2) ],
        //            [ new Curve(pts, 3, 4), ...
        var curves = [];
        
        var cv;  // for Curve instance

        // searches selected segments
        // and creates sets of Curve instances for them
        for( var pIdx = 0, pEnd = pts.length; pIdx < pEnd; pIdx++){
            var pNext = parseIdx( pts, pIdx + 1 );
            if( pNext < 0 ) break;
            
            if( isSegmentSelected(pts, pIdx)){
                cv = new Curve( path, pIdx, pNext );
                
                if( curves.length < 1 ){
                    curves.push([ cv ]);
                    
                } else {
                    var r = curves[ curves.length - 1 ];

                    if( r[ r.length - 1 ].idx2 == pIdx ){
                        r.push( cv );
                    } else {
                        curves.push([ cv ]);
                    }
                }
            }
        }

        if( curves.length < 1 ) continue;

        // If the selected segments stride the first anchor,
        // It needs to concat the first and the last set of Curves.
        if( path.closed && curves.length > 1 ){
            var rFirst = curves[0];
            var rLast = curves[ curves.length - 1 ];
            
            if( rFirst[0].idx1 == 0
                && rLast[ rLast.length - 1 ].idx2 == 0){
                curves[0] = curves.pop().concat(curves[0]);
            }
        }
        
        // draws notches for each of the set of Curve.
        for( var cIdx = 0, cEnd = curves.length; cIdx < cEnd; cIdx++ ){
            var cvs = curves[ cIdx ];

            // defines the length between notches
            var d = getCurvesLength( cvs ) / opts.div_count;
            
            var spec = { ts:[], d:d, ini_d:d, count:opts.div_count - 1 };

            // every set of notches are put into a group.
            var grp = path.layer.groupItems.add();
            
            for( var cvIdx = 0, cvEnd = cvs.length; cvIdx < cvEnd; cvIdx++){
                cv = cvs[ cvIdx ];
                cv.getEquallySpacedParameters( spec );
                cv.drawNotches( spec, opts.notch_length, grp );
                if( spec.count < 1 ) break;
                spec.ts = [];
            }
        }
    }
}
// -----------------------------------------------
function getCurvesLength( cvs ){
    var len = 0;
    for(var i = 0, iEnd = cvs.length; i < iEnd; i++){
        len += cvs[i].getLength(1);
    }
    return len;
}
// -----------------------------------------------
function isSegmentSelected(pts, pIdx){
    var s = pts[pIdx].selected; 
    return ! (s == PathPointSelection.NOSELECTION
        || s == PathPointSelection.LEFTDIRECTION);
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
    var pts = path.pathPoints;

    this.path = path;
    this.idx1 = idx1;
    this.idx2 = idx2;
    
    this.p1 = new Point().setr(pts[idx1].anchor);
    this.rdir = new Point().setr(pts[idx1].rightDirection);
    this.ldir = new Point().setr(pts[idx2].leftDirection);
    this.p2 = new Point().setr(pts[idx2].anchor);

    this.q = [this.p1, this.rdir, this.ldir, this.p2];
    this.params = null;
    this.dm = null;
    this.dn = null;
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
        
        this.dm = [m[0], 2 * m[1], m[2]];
        this.dn = [n[0], 2 * n[1], n[2]]; 
    },
    getLength : function(t){
        if( !this.params ) this.setParams();
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
    getTforLength : function(len){
        //if( !this.params ) this.setParams();
        var k = this.params;

        //if( !this.length) this.length = this.getLength(1);
        if(len <= 0){
            return 0;
        } else if(len > this.length){
            return -1;
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
    },
    getEquallySpacedParameters : function( spec ){
        // spec = { ts:[], d:d, ini_d:0 }
        if( !this.params ) this.setParams();
        if( !this.length ) this.length = this.getLength(1);

        var total_d = spec.ini_d;
        var t;

        if( total_d < this.length ){
            while( 1 ){
                t = this.getTforLength( total_d );
                if( t < 0 ) break;
                spec.ts.push( t );
                total_d += spec.d;
            }
            spec.ini_d = total_d - this.length;
        } else {
            spec.ini_d -= this.length;
        }
    },
    drawNotches : function(spec, notch_length, grp){
        var ts = spec.ts;
        if(ts.length < 1) return;
        
        //if( !this.params ) this.setParams();
        
        var hpi = Math.PI / 2;

        for(var ti = 0, tiEnd = ts.length; ti < tiEnd; ti++){
            var t = ts[ti];
            var dx = t * (t * this.dm[0] + this.dm[1]) + this.dm[2];
            var dy = t * (t * this.dn[0] + this.dn[1]) + this.dn[2];
            var pnt = this.bezier(t);
            var rad = Math.atan2( dy, dx ) + hpi;
            var xoffset = notch_length * Math.cos(rad);
            var yoffset = notch_length * Math.sin(rad);
            var p1 = [pnt.x + xoffset, pnt.y + yoffset];
            var p2 = [pnt.x - xoffset, pnt.y - yoffset];
            
            var line = this.path.duplicate();
            line.closed = false;
            line.filled = false;
            line.stroked = true;
            line.setEntirePath([p1, pnt.toArray(), p2]);
            
            line.move(grp, ElementPlacement.PLACEATEND);

            spec.count--;
            if( spec.count < 1 ) break;
        }
    }
}

// ------------------------------------------------
// convert millimeter to PostScript point
function mm2pt(n){
    return n * 2.83464567;
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
// extract PathItems from the selection which length of PathPoints
// is greater than "n"
function getPathItemsInSelection(n, paths){
  if(documents.length < 1) return;
  
  var s = activeDocument.selection;
  
  if (!(s instanceof Array) || s.length < 1) return;

  extractPaths(s, n, paths);
}

// --------------------------------------
// extract PathItems from "s" (Array of PageItems -- ex. selection),
// and put them into an Array "paths".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoints length is greater
// than this number.
function extractPaths(s, pp_length_limit, paths){
  for(var i = 0; i < s.length; i++){
    if(s[i].typename == "PathItem"
       && !s[i].guides && !s[i].clipping){
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
main();
