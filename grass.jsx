// grass.jsx
// adobe Illustrator CSx script
// for growing grasses on the selected paths.
// See the description image for the optional values.

// Note:
// Smaller width value causes longer calculation time.

// test env: Adobe Illustrator CS3, CS6 (Windows)
// 2013-01-26

// Copyright(c) 2013 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// -----------------------------------------------
function main(){
    const SCRIPTNAME = "grass";

    var paths = [];
    getPathItemsInSelection( 1, paths );
    if( paths.length < 1 ){
        alert(SCRIPTNAME + ": select path(s) before run this script");
        return;
    }

    var win = new Window("dialog", SCRIPTNAME);
    win.alignChildren = "right";
    
    var ets = {
        et_width : new EditTextWithLabel(win, "width:", 3.0),
        et_height : new EditTextWithLabel(win, "height:", 20.0),
        et_hfluc : new EditTextWithLabel(win, "h fluctuation (%):", 20.0),
        et_hrot : new EditTextWithLabel(win, "rotation (%):", 20.0),
        et_bfluc : new EditTextWithLabel(win, "base fluctuation:", 2.0),
        et_hrate : new EditTextWithLabel(win, "handle rate (%):", 50)
        };
    
    addOkCancelButtons(win, (function(){
        var ok = true;
        if(ets.et_width.getValue() <= 0 ){
            alert("The value for the width is invalid");
            ok = false;
        } else {
            createGrass(paths, ets);
        }
        return ok;
    }));
    win.show();
}
// -----------------------------------------------
var EditTextWithLabel = function(win, label, defaultvalue){
    var gr = win.add("group");
    gr.add("statictext", undefined, label);
    this.et = gr.add("edittext", undefined, defaultvalue);
    this.et.characters = 10;
    this.et.active = true;
}
EditTextWithLabel.prototype = {
    getValue : function(){
        var v = parseFloat(this.et.text);
        return isNaN(v) ? 0 : v;
    }
}
// -----------------------------------------------
function addOkCancelButtons(win, func){
    var gr = win.add("group");
    var btn_ok = gr.add("button", undefined, "OK");
    var btn_cancel = gr.add("button", undefined, "Cancel");
    btn_ok.onClick = function(){
        if( func() ) win.close();
    };
}
// -----------------------------------------------
function createGrass(paths, ets){
    const HPI = Math.PI / 2;
    const XPI = Math.PI * 1.5; // rotate range of the heads

    // get the values from dialog
    var width       =  ets.et_width.getValue() / 2.0;
    var height_orig = ets.et_height.getValue();
    var hfluc        = ets.et_hfluc.getValue() / 100.0;
    var hrot        = ets.et_hrot.getValue() / 100.0 * height_orig;
    var bfluc        = ets.et_bfluc.getValue();
    var hrate_orig  = ets.et_hrate.getValue() / 100.0;
    
    if(height_orig < 0) hrate_orig *= -1;
    
    try{
        // process each path
        for(var i=0; i < paths.length; i++){
            var path = paths[i];
            if( path.pathPoints.length < 2 ) continue;
            
            // add anchor points on the path
            var pnts = brokenCurve( path, width );
            
            var height = height_orig;
            var hrate   = hrate_orig;
            
            // determine grow toward inside or outside
            var rad;
            if( pnts.length > 2 ){
                rad = pnts[0].subp(pnts[2]).getAngle();
                if(pnts[1].subp(pnts[2]).rotate(-rad).getAngle() < 0){
                    height *= -1;
                    hrate *= -1;
                }
            }
            var len, v, pnt;
            for(var j=0; j < pnts.length - 1; j+=2){
                var k = j + 1;
                
                // define base vector
                v = pnts[k].subp(pnts[j]).normalize();
                v = v.rotate(-HPI);
                
                // head
                len = height * (1 + Math.random() * hfluc ); // define length
                pnt = pnts[k].addp(v.mul(len)); // move to the head
                pnt = pnt.addp(v.mul( hrot ).rotate( xrand(XPI) )); // rotate head
                fixPathPoint(path.pathPoints[k], pnt);
                
                // base and handle
                pnt = pnts[j].addp(v.mul( xrand(bfluc) )); // apply base fluctuation
                path.pathPoints[j].anchor = pnt.toArray();
                
                v = v.mul(len * hrate); // define handle vector
                rad = Math.atan2(width, len); // define handle angle
                
                path.pathPoints[j].leftDirection = pnt.addp(v.rotate(-rad)).toArray();
                path.pathPoints[j].rightDirection = pnt.addp(v.rotate(rad)).toArray();
            }
        }
    } catch(e){
        alert(e);
    }
}
// -----------------------------------------------
function fixPathPoint(p, pnt){
    p.anchor = pnt.toArray();
    p.rightDirection = p.anchor;
    p.leftDirection = p.anchor;
}
// -----------------------------------------------
function xrand(n){
  return (Math.random() - 0.5) * n;
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
    
        return t;
    },
    getPointWithLength : function(len){
        return this.bezier( this.getTforLength(len) );
    },
    getNearlyEquallySpacedPoints : function( d ){
        if( !this.params ) this.setParams();
        if( !this.length ) this.length = this.getLength(1);
        
        var divnum = parseInt(this.length / d);

        // adjust divmun to be even for the purpose of this script
        if( divnum % 2 == 1 ){
            if(this.length % d > d / 2){
                divnum += 1;
            } else {
                divnum -= 1;
            }
        }
        
        d = this.length / divnum;

        var pnts = [ this.p1 ];
        if( divnum > 1 ){
            for(var i=1; i < divnum; i++){
                pnts.push( this.getPointWithLength( d * i ) );
            }
        }
        pnts.push( this.p2 );
        return pnts;
    }
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
// -----------------------------------------------
function brokenCurve( path, d ){ // path:PathItem, d:desired length between anchors
    var p = path.pathPoints;
    var ancs = []; // anchor point
    var pnts = []; // Point
    
    for(var i=0; i < p.length; i++){
        var next_idx = parseIdx(p, i + 1);
        if( next_idx < 0 ) break;

        var cv = new Curve(path, i, next_idx);

        var tmp_pnts = cv.getNearlyEquallySpacedPoints(d);
        if( path.closed ){
            tmp_pnts.pop();
        } else if( next_idx != p.length-1 ){
            tmp_pnts.pop();
        }

        for(var j=0; j < tmp_pnts.length; j++){
            pnts.push( tmp_pnts[j] );
            ancs.push( tmp_pnts[j].toArray());
        }
    }
    path.setEntirePath( ancs );
    return pnts;
}
// ------------------------------------------------
// extract PathItems from the selection which the length of
// PathPoints is greater than "min_pathpoint_count"
function getPathItemsInSelection( min_pathpoint_count, paths ){
  if(documents.length < 1) return;
  
  var selected_items = activeDocument.selection;
  
  if (!(selected_items instanceof Array)
      || selected_items.length < 1) return;

  extractPaths(selected_items, min_pathpoint_count, paths);
}

// --------------------------------------
// extract PathItems from "items" (Array of PageItems -- ex. selection),
// and put them into an Array "paths".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoint count is greater
// than this number.
function extractPaths(items, pp_length_limit, paths){  
  for( var i = 0; i < items.length; i++ ){
    // ignore guides and clipping paths
    if( items[i].typename == "PathItem"
        && !items[i].guides
        && !items[i].clipping ){
      if( pp_length_limit
         && items[i].pathPoints.length <= pp_length_limit ){
        continue;
      }
      paths.push( items[i] );
      
    } else if( items[i].typename == "GroupItem" ){
      // search PathItems in the GroupItem, recursively
      extractPaths( items[i].pageItems, pp_length_limit, paths );
      
    } else if( items[i].typename == "CompoundPathItem" ){
      // search Pathitems in the CompoundPathItem, recursively
      // ( ### Grouped PathItems in CompoundPathItem are ignored ### )
      extractPaths( items[i].pathItems, pp_length_limit , paths );
    }
  }
}
main();
