// Dup Along The Path.jsx
// adobe Illustrator CSx script
// duplicates the foreground selected object
// on the rest of selected paths
// with specified interval.
// Optionally you can apply random scaling
// to each of the duplicated object.

// Note:
// Smaller interval value causes longer calculation time.

// test env: Adobe Illustrator CS3, CS6 (Windows)
// 2013-02-09
// 2016-11-26 modify not to activate textedit (fix a problem which forces an extra click after closing the dialog)
// 2018-07-20 modified to ignore locked/hidden objects in a selected group

// Copyright(c) 2013 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// -----------------------------------------------
function main(){
    const SCRIPTNAME = "dupAlongThePath";
    const DEFAULT_FLUCTUATION_RANGE_X = 0.0; // in percent
    const DEFAULT_FLUCTUATION_RANGE_Y = 20.0;
    const DEFAULT_WIDTH = 8; // in point

    
    var foreground_obj = new ForegroundObject().init();
    if( foreground_obj.item == null ){
        alert(SCRIPTNAME + ": select a target_object and paths before run this script");
        return;
    }
    
    var paths = [];
    extractPaths(foreground_obj.rest, 1, paths);
    if( paths.length < 1 ){
        alert(SCRIPTNAME + ": select a target_object and paths before run this script");
        return;
    }

    var win = new Window("dialog", SCRIPTNAME);
    win.alignChildren = "right";
    
    var ets = {
        et_interval : new EditTextWithLabel(win, "interval (point):", DEFAULT_WIDTH),
        et_fluc_x : new EditTextWithLabel(win, "x fluctuation range (%):", DEFAULT_FLUCTUATION_RANGE_X),
        et_fluc_y : new EditTextWithLabel(win, "y fluctuation range (%):", DEFAULT_FLUCTUATION_RANGE_Y)
        };
    
    addOkCancelButtons(win, (function(){
        var ok = true;
        if(ets.et_interval.getValue() <= 0 ){
            alert("The value for the interval is invalid");
            ok = false;
        } else if(ets.et_fluc_x.getValue() < 0 ){
            alert("The value for the x fluctuation range is invalid");
            ok = false;
        } else if(ets.et_fluc_y.getValue() < 0 ){
            alert("The value for the y fluctuation range is invalid");
            ok = false;
        } else {
            dupAlongThePath(foreground_obj, paths, ets);
        }
        return ok;
    }));
    win.show();
}
// -----------------------------------------------
function parseFloat_s( s ){
    var v = parseFloat( s );
    return isNaN(v) ? -1 : v;
}
// -----------------------------------------------
var ForegroundObject = function(){
    this.item = null;
    this.tgt_point = null;
    this.rest = null;
}
ForegroundObject.prototype = {
    init : function(){
        if(app.documents.length > 0){
            var s = activeDocument.selection;
            if(s instanceof Array && s.length > 1){
                this.item = s[0]; // target object to duplicate
                this.rest = s.slice(1);
                
                // define the location where to locate at the rest of anchors.
                // if the target is a PathItem and only 1 anchor selected,
                // duplicate to locate this anchor at the rest of anchors.
                
                // check whether only 1 anchor point is selected
                var i;
                if(this.item.typename == "PathItem"){
                    var p = this.item.pathPoints;
                    
                    for(i = 0; i < p.length; i++){
                        if(p[i].selected == PathPointSelection.ANCHORPOINT){
                            if(this.tgt_point == null){
                                this.tgt_point = new Point().setr( p[i].anchor );
                            } else { // means 2 or more anchors are selected
                                this.tgt_point = null;
                                break;
                            }
                        }
                    }
                }
                
                if(this.tgt_point == null){ // means 2 or more anchors are selected
                    // find out the center of the target
                    var vb = this.item.visibleBounds; // left, top, right, bottom
                    this.tgt_point = new Point().set((vb[0] + vb[2]) / 2, (vb[1] + vb[3]) / 2);
                }
            }
        }
        return this;
    }           
}
// -----------------------------------------------
var EditTextWithLabel = function(win, label, defaultvalue){
    var gr = win.add("group");
    gr.add("statictext", undefined, label);
    this.et = gr.add("edittext", undefined, defaultvalue);
    this.et.characters = 10;
    //this.et.active = true;
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
function dupAlongThePath(foreground_obj, paths, ets){
    try{
        for(var i = 0; i < paths.length; i++){
            var pnts = brokenPath( paths[i], ets.et_interval.getValue() );
            if( pnts.length < 3 ) continue;

            
            for(var j=1; j < pnts.length -1; j++){
                
                var t = getRad(pnts[ j-1 ], pnts[ j+1 ]);
                //t += Math.PI / 2;
    
                var dup = foreground_obj.item.duplicate();
                
                dup.translate( - foreground_obj.tgt_point.x,
                               - foreground_obj.tgt_point.y); // move to origin

                // resize and rotate
                var mx = 100.0 + xrand( ets.et_fluc_x.getValue() );
                var my = 100.0 + xrand( ets.et_fluc_y.getValue() );
                dup.resize( mx, my, true, true, true, true, 100.0, Transformation.DOCUMENTORIGIN );
                
                dup.rotate( t * 180 / Math.PI, true, true, true, true, Transformation.DOCUMENTORIGIN );

                // move to the point
                dup.translate(pnts[j].x, pnts[j].y);
            }
        }
    } catch(e){ alert(e); }
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
// ----------------------------------------------
// return the angle in radian
// of the line drawn from p1 to p2
function getRad(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
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
    getEquallySpacedPointsOnWholePath : function( d, initial_length ){
        if( !this.params ) this.setParams();
        if( !this.length ) this.length = this.getLength(1);
        
        var pnts = [];
        
        if( initial_length > this.length ){
            initial_length = this.length - initial_length;
        } else {
            var total_length = initial_length;
        
            while( total_length < this.length ){
                pnts.push( this.getPointWithLength( total_length ));
                total_length += d;
            }
            initial_length = total_length - this.length;
        }
        return {pnts:pnts, initial_length:initial_length};
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
function brokenPath( path, d ){ // path:PathItem, d:desired length between anchors
    var p = path.pathPoints;
    var pnts = []; // Point
    var initial_length = 0;

    var n = Math.round( path.length / d );
    d = path.length / n;
    
    for(var i=0; i < p.length; i++){
        var next_idx = parseIdx(p, i + 1);
        if( next_idx < 0 ) break;
        
        var cv = new Curve(path, i, next_idx);

        var tmp = cv.getEquallySpacedPointsOnWholePath(d, initial_length);
        initial_length = tmp.initial_length;
        
        for(var j=0; j < tmp.pnts.length; j++){
            pnts.push( tmp.pnts[j] );
        }
    }
    if( path.closed && pnts.length > 1 ){
        pnts.unshift( pnts[ pnts.length -1 ] );
        pnts.push( pnts[0] );
    }
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
    if(items[i].locked || items[i].hidden){
        continue;
    } else if( items[i].typename == "PathItem"){
      if((pp_length_limit && items[i].pathPoints.length <= pp_length_limit )
        || items[i].guides || items[i].clipping){
        // ignore guides and clipping paths
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
