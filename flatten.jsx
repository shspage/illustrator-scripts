// flatten.jsx
// adobe Illustrator CSx script
// converts curved lines into broken lines.
// (formerly named "brokenCurve.jsx");

// How to use:
// * select paths and run this script.
//   specify max error and hit OK button.
// * if "output to file" is checked,
//   saves the coordinates data of flattened
//   paths to a file **without** doing actual flattening.

// flattening methods
// * mid_t:
// If the distance between the midpoint P on the curve between 
// the anchors according to the Bezier curve's parameter (t = 0.5)
// and the straight line connecting the anchors is more than
// the specified value, the point P is added and the curve is divided.
// Then these two curved lines are verified again.
//
// * divide_t: (default)
// It divides the curve between the anchors equally by parameters
// (starting from 2 divisions) and verifies the error for each
// of the divided curves using the midpoint that based on the parameter
// of the Bezier curve. If there is a curve whose error is larger
// than the specified value, it increases the number of divisions
// by one and verifies again.
//
// * tangent:
// If the distance between the straight line connecting the anchors
// and the point P which is the farthest point among the points
// where the straight line with the same slope is in contact
// with the curve between the anchors is more than the specified
// value, add the point P and divide the curve . Then these two
// curved lines are verified again.

// ver.1.1.0
// test env: Adobe Illustrator CC2018 (Windows)
// 2018-03-02: added method "divide_t". added UI. rename script itself

// Copyright(c) 2018 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// -----------------------------------------------
function main(){
     const SCRIPTNAME = "flatten";
     const DEFAULT_MAX_ERROR = 0.2;
     const DEFAULT_DIVIDE_METHOD = "divide_t";  // "divide_t", "tangent" or "mid_t"

     var conf = {
        max_error: DEFAULT_MAX_ERROR,
        divide_method : DEFAULT_DIVIDE_METHOD,
        output_to_file : false,
        output_decimal_places : 7,
        output_file_extension : "csv"
        };
    
    // get the selected paths
    var paths = [];
    getPathItemsInSelection( 1, paths );
    if( paths.length < 1 ){
        alert(SCRIPTNAME + ": select path(s) before run this script");
        return;
    }

    // show a dialog
    var win = new Window("dialog", SCRIPTNAME);
    win.alignChildren = "fill";

    win.edPanel = win.add("panel", undefined, "max error (in point)");
    win.edPanel.orientation = "column";
    win.edPanel.alignChildren = "fill";
    win.edPanel.gp1 = win.edPanel.add("group");
    win.edPanel.gp1.txtBox = win.edPanel.gp1.add("edittext", undefined, DEFAULT_MAX_ERROR);
    win.edPanel.gp1.txtBox.justify = "right";
    win.edPanel.gp1.txtBox.characters = 8;

    win.chkGroup = win.add("group");
    win.chkGroup.alignment = "center";
    win.chkGroup.outputChk = win.chkGroup.add("checkbox", undefined, "output to file");

    win.rbPanel = win.add("panel", undefined, "method" );
    win.rbPanel.orientation = "row";
    win.edPanel.alignChildren = "fill";
    win.rbPanel.divideT = win.rbPanel.add("radiobutton", undefined, "divide_t");
    win.rbPanel.midT = win.rbPanel.add("radiobutton", undefined, "mid_t");
    win.rbPanel.tangent = win.rbPanel.add("radiobutton", undefined, "tangent");
    
    win.btnGroup = win.add("group", undefined );
    win.btnGroup.alignment = "center";
    win.btnGroup.okBtn = win.btnGroup.add("button", undefined, "OK");
    win.btnGroup.cancelBtn = win.btnGroup.add("button", undefined, "Cancel");
    
    if( DEFAULT_DIVIDE_METHOD == "mid_t" ){
        win.rbPanel.midT.value = true;
    } else if( DEFAULT_DIVIDE_METHOD == "tangent"){
        win.rbPanel.tangent.value = true;
    } else {
        win.rbPanel.divideT.value = true;
    }
    
    var getValues = function(){
        var err = false;
        var v = parseFloat(win.edPanel.gp1.txtBox.text);
        if(isNaN(v) || v <= 0){
            alert(SCRIPTNAME + "please input a positive number." );
            err = true;
            return err;
        }
        conf.max_error = v;

        if(win.rbPanel.midT.value){
            conf.divide_method = "mid_t";
        } else if(win.rbPanel.tangent.value){
            conf.divide_method = "tangent";
        } else {
            conf.divide_method = "divide_t";
        }

        conf.output_to_file = win.chkGroup.outputChk.value;

        return err;
    }
    
    var onBtnOk = function(){
        try{
            win.enabled = false;
            var err = getValues();
            if(!err){
                flatten(conf, paths);
            }
        } catch(e){
            alert(e);
        } finally{
            win.enabled = true;
        }
    }

    win.btnGroup.okBtn.onClick = function(){
        onBtnOk( false );
        win.close();
    }
    
    win.btnGroup.cancelBtn.onClick = function(){
        win.close();
    }
    win.show();
}


// -----------------------------------------------
function flatten(conf, paths){
    // main process
    var all_points = [];
    for(var i=0; i < paths.length; i++){
        all_points.push(flattenMain( paths[i], conf ));
    }

    if(conf.output_to_file){
        var data = [];
        for(var i = 0; i < all_points.length; i++){
            var pnts = all_points[i];
            for(var ip = 0; ip < pnts.length; ip++){
                data.push(
                    pnts[ip].x.toFixed(conf.output_decimal_places)
                    + ","
                    + pnts[ip].y.toFixed(conf.output_decimal_places)
                    + "\n"
                );
            }
            // Each path is separated by a line feed
            data.push("\n");
        }
        writeToFile(data.join(""), conf.output_file_extension);
    } else {
        activeDocument.selection = paths;
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
    eq : function(p){
        return this.x == p.x && this.y == p.y;
    },
    toArray : function(){
        return [this.x, this.y];
    }
}
// ---------------------------
// a class for a straight line
// stores A,B,C of Ax + By + C = 0
// A and B are defined to be A^2+B^2 = 1
var Line = function(){
    this.a = 0;
    this.b = 0;
    this.c = 0;
}
Line.prototype = {
    set : function(p1, p2){ // Point p1, Point p2
        if(p1.x==p2.x){
            this.a = 1;
            this.b = 0;
            this.c = -p1.x;
        } else if(p1.y==p2.y){
            this.a = 0;
            this.b = 1;
            this.c = -p1.y;
        } else {
            this.a = (p2.y - p1.y)/(p2.x - p1.x);
            var d = 1 / Math.sqrt(this.a * this.a + 1);
            this.b = -d;
            this.c = (p1.y - this.a * p1.x) * d;
            this.a *= d;
        }
        return this;
    },
    getDist : function(p){ // Point p
        // returns line length of prependicular
        // line drawn from p to this line.
        // ( a general formula is d = sqrt( (ax+by+c)^2/(a^2+b^2) ))
        return Math.abs( this.a * p.x + this.b * p.y + this.c );
    }
}
// -----------------------------------------------
// a class that stores a pair of bezier curve
// parameters (t1, t2) and coordinates(p1, p2)
// correspond to each parameter. used in "mid_t" method
var Tpair = function( t1, t2, p1, p2 ){
    this.t1 = t1; this.t2 = t2;
    this.p1 = p1; this.p2 = p2;
}
// a class that stores a set of bezier curve
// parameters (t1, t2, t3) and coordinates(p1, p2, p3)
// correspond to each parameter. used in "tangent" method
var Tset = function( t1, t2, t3, p1, p2, p3 ){
    this.t1 = t1; this.t2 = t2; this.t3 = t3;
    this.p1 = p1; this.p2 = p2; this.p3 = p3;
}
// -----------------------------------------------
// a class for a bezier curve segment
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
}
Curve.prototype = {
    bezier : function(t){
        var u = 1 - t;
        return new Point().set(
            u*u*u * this.p1.x + 3*u*t*(u* this.rdir.x + t* this.ldir.x) + t*t*t * this.p2.x,
            u*u*u * this.p1.y + 3*u*t*(u* this.rdir.y + t* this.ldir.y) + t*t*t * this.p2.y);
    },
    // ------------------------
    hasNoHandle : function(){
        return this.p1.eq( this.rdir ) && this.p2.eq( this.ldir );
    },
    // ------------------------
    // function for DIVIDE_METHOD "mid_t"
    getBrokenPoints_MaxH_MidT : function( conf ){
        var ts = [0, 1];

        if( ! this.hasNoHandle() ){
            var p =  this.bezier( 0.5 );
            var tps = [ new Tpair(0, 0.5, this.p1, p),
                        new Tpair(0.5, 1, p, this.p2)];
            
            while( tps.length > 0 ){
                var tp = tps.shift();
                var t = (tp.t1 + tp.t2) / 2;
                p = this.bezier( t );
                
                var line = new Line().set( tp.p1, tp.p2 );
                
                if( line.getDist( p ) > conf.max_error ){
                    ts.push( t );
                    tps.push( new Tpair(tp.t1, t, tp.p1, p));
                    tps.push( new Tpair(t, tp.t2, p, tp.p2));
                }
            }
                
            ts.sort();
        }
            
        var pnts = [];
        for(var i=0; i < ts.length; i++){
            pnts.push( new Point().setp( this.bezier( ts[i] )));
        }
        return pnts;
    },
    // ------------------------
    // function for DIVIDE_METHOD "divide_t"
    getBrokenPoints_MaxH_DivideT : function( conf ){
        var ts = [0, 1];

        if( ! this.hasNoHandle() ){
            var n = 2;
            var err = true;

            while(err){
                err = false;
                var t_unit = 1 / ++n;
                var t = 0;
                var p = this.p1;

                for(var i = 0; i < n; i++){
                    var t_next = t_unit * (i + 1);
                    var p_next = this.bezier(t_next);

                    var midP = this.bezier((t + t_next) / 2);
                    var line = new Line().set(p, p_next);
                    if(line.getDist(midP) > conf.max_error){
                        err = true;
                        break;
                    }
                    t = t_next;
                    p = p_next;
                }
            }

            n--;
            if(n > 1){
                ts = [0];
                var t_unit = 1 / n;
                for(var i = 1; i < n; i++){
                    ts.push(t_unit * i);
                }
                ts.push(1);
            }
        }
            
        var pnts = [];
        for(var i=0; i < ts.length; i++){
            pnts.push( new Point().setp( this.bezier( ts[i] )));
        }
        return pnts;
    },
    // ------------------------
    // functions for DIVIDE_METHOD "tangent"
    ajustHandle : function(anc, han, m){
        return new Point().set( anc.x + m*(han.x - anc.x),
                                anc.y + m*(han.y - anc.y) );
    },
    setDir : function(idx, t, anc, m){
        var han;
        if(idx == 0){
            han = new Point().set(
                t*(t*(this.p1.x-2*this.rdir.x+this.ldir.x)+2*(this.rdir.x-this.p1.x))+this.p1.x,
                t*(t*(this.p1.y-2*this.rdir.y+this.ldir.y)+2*(this.rdir.y-this.p1.y))+this.p1.y);
        } else {
            han = new Point().set(
                t*(t*(this.rdir.x-2*this.ldir.x+this.p2.x)+2*(this.ldir.x-this.rdir.x))+this.rdir.x,
                t*(t*(this.rdir.y-2*this.ldir.y+this.p2.y)+2*(this.ldir.y-this.rdir.y))+this.rdir.y);
        }
        return this.ajustHandle(anc, han, m);
    },
    getPart : function(t1, t2){
        // returns new Curve object as a part of this curve, parameters between t1 and t2
        var c = new Curve( this.path, this.idx1, this.idx2 );
        c.p1 = this.bezier( t1 );
        c.p2 = this.bezier( t2 );
        c.rdir = this.setDir( 1, t1, c.p1, (t2 - t1) / (1 - t1));
        c.ldir = this.setDir( 0, t2, c.p2, (t2 - t1) / t2 );
        return c;
    },
    getBrokenPointByTangent : function(ts){
        var c;
        var t0 = ts[0];
        var t1 = ts[1];
        
        if(t1 - t0 < 1){
            c = this.getPart( t0, t1 );
        } else {
            c = this;
        }
        
        var m = c.p2.x - c.p1.x;
        var n = c.p2.y - c.p1.y;
        
        var v1 = m*(-c.p1.y+3*c.rdir.y-3*c.ldir.y+c.p2.y)
            - n*(-c.p1.x+3*c.rdir.x-3*c.ldir.x+c.p2.x);
        var v2 = 2*(m*(c.p1.y-2*c.rdir.y+c.ldir.y)
                    - n*(c.p1.x-2*c.rdir.x+c.ldir.x));
        var v3 = m*(c.rdir.y-c.p1.y) - n*(c.rdir.x-c.p1.x);
        
        var t;
        var convT = function(t){
            return t0 + (t1 - t0) * t;
        };
        
        if (v1 == 0) {
            if (v2 == 0) return;
            t = -v3 / v2;
            if(t < 1 && t > 0) ts.push( convT(t) );
        } else {
            var sq = Math.sqrt(v2*v2 - 4*v1*v3);
            v1 *= 2;
            t = (- v2 - sq) / v1;
            if(t < 1 && t > 0) ts.push( convT(t) );
            t = (- v2 + sq) / v1;
            if(t < 1 && t > 0) ts.push( convT(t) );
        }

        if(ts.length > 2) ts.sort();
    },
    ts2tsets : function(ts, tsets, p1, p2){
        // ts.length > 2
        var ps = [ p1 ];
        for( var i=1; i < ts.length -1; i++){
            ps.push( this.bezier( ts[i] ));
        }
        ps.push( p2 );
        
        for( i=0; i < ts.length -2; i++ ){
            tsets.push( new Tset( ts[i], ts[i+1], ts[i+2],
                                  ps[i], ps[i+1], ps[i+2]));
        }
    },
    getBrokenPoints_MaxH_Tangent : function( conf ){
        var ts = [0, 1];
        
        if( ! this.hasNoHandle() ){
            this.getBrokenPointByTangent( ts );
            
            if(ts.length > 2){
                var tsets = [];
                this.ts2tsets( ts, tsets, this.p1, this.p2 );

                while( tsets.length > 0 ){
                    var tset = tsets.shift();

                    var d = new Line().set( tset.p1, tset.p3 ).getDist( tset.p2 );
                    
                    if( d > conf.max_error ){
                        ts.push( tset.t2 );
                        
                        var ts_tmp = [ tset.t1, tset.t2 ];
                        this.getBrokenPointByTangent( ts_tmp );
                        if( ts_tmp.length > 2 ){
                            this.ts2tsets( ts_tmp, tsets, tset.p1, tset.p2 );
                        }
                        
                        ts_tmp = [ tset.t2, tset.t3 ];
                        this.getBrokenPointByTangent( ts_tmp );
                        if( ts_tmp.length > 2 ){
                            this.ts2tsets( ts_tmp, tsets, tset.p2, tset.p3 );
                        }
                    }
                }
                ts.sort();
            }
        }
        
        var pnts = [];
        for(var i=0; i < ts.length; i++){
            pnts.push( new Point().setp( this.bezier( ts[i] )));
        }
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
function flattenMain( path, conf ){
    // path: PathItem
    // conf: conf { max_error, divide_method }
    var p = path.pathPoints;
    var ancs = []; // anchor point
    var pnts = []; // Point
    
    for(var i=0; i < p.length; i++){
        var next_idx = parseIdx(p, i + 1);
        if( next_idx < 0 ) break;

        var cv = new Curve(path, i, next_idx);

        var tmp_pnts;
        if( conf.divide_method == "tangent" ){
            tmp_pnts = cv.getBrokenPoints_MaxH_Tangent(conf);
        } else if( conf.divide_method == "mid_t"){
            tmp_pnts = cv.getBrokenPoints_MaxH_MidT(conf);
        } else {  // "divide_t" or undefined
            tmp_pnts = cv.getBrokenPoints_MaxH_DivideT(conf);
        }
      
        if( ! (! path.closed && next_idx == p.length-1)) tmp_pnts.pop();

        for(var j=0; j < tmp_pnts.length; j++){
            pnts.push( tmp_pnts[j] );
            ancs.push( tmp_pnts[j].toArray());
        }
    }
    if(conf.output_to_file){
        return pnts;
    } else {
        path.setEntirePath( ancs );
        return;
    }
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
// ----------------------------------------------
// dat: data to output. directly write to a file
// ext: extension of a file. ex."txt"
function writeToFile(dat, ext){
    var afile = File.saveDialog("save to a file",ext + " File:*." + ext);
    if(!afile){ // cancel
      return false;
    }
    if(!afile.open("w")){
      alert("failed to open a file");
      return false;
    }
    afile.write(dat);
    afile.close();
    alert("saved");
    return true;
  }
  
// --------------------------------------
// an utility function. draw a tiny circle on the Point p
function markpt(p){
    var r = 2;
    app.activeDocument.pathItems.ellipse(
        p.y + r, p.x - r, r*2, r*2
        );
}
main();
