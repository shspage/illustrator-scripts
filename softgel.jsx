// softgel

// When you want to create a softgel capsule like shape, this script may
// help you.  

// USAGE : Draw circles and select them, then run this script.  Adjust
// options in the dialog.  then click OK.
// (This script doesn't check whether each path is really a circle.)

// Note : Combining the shapes using Pathfinder may results several
// overlapping anchor points on the path.  if it occurs, it may help to
// solve it to use my another script "Merge Overlapped Anchors.js
// (http://shspage.com/aijs/en/#merge)
// This script merges overlapping anchors on the path.

// test env: Adobe Illustrator CC (Win/Mac)

// Copyright(c) 2013 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// Tue, 07 Jul 2015 20:17:27 +0900
// Sat, 26 Nov 2016 19:15:51 +0900
// -- add try...finally statement around parts changing win.enabled property.
// 2018.07.20, modified to ignore locked/hidden objects in a selected group

main();
function main(){
    var conf = {
        center_angle : 90,
        slider_defaultvalue : 90,
        slider_minvalue : 1,
        slider_maxvalue : 180,
        extra_anchor : "auto",
        errmsg : ""
      }
    
    if (documents.length<1) return;
    var s = activeDocument.selection;
    if (!(s instanceof Array) || s.length<1) return;
    
    var sp = [];
    extractPaths(s, 1, sp);
    if(sp.length < 2) return;
    activateEditableLayer(sp[0]);

    var preview_paths = [];
    var previewed = false;

    var clearPreview = function(){
        if( previewed ){
            try{
                undo();
                redraw();  // A.J.Hammerschmidt : fixed the problem with undo() crashing.
            } catch(e){
                alert(e);
            } finally {
                preview_paths = [];
                previewed = false;
            }
        }
    }
    
    var drawPreview = function(){
        try{
            var shape, j;
            for(var i = sp.length - 1; i >= 1; i--){
                for(j = i - 1; j >= 0; j--){
                    shape = softgel(sp[i], sp[j], conf);
                    if(shape != null) preview_paths.push( shape );
                }
            }
        } finally {
            previewed = true;
        }
    }
    
    // show a dialog
    var win = new Window("dialog", "Softgel");
    win.orientation = "column";
    win.alignChildren = "fill";

    win.anglePanel = win.add("panel", [15, 15, 240, 61], "center angle");
    win.anglePanel.orientation = "row";
    win.anglePanel.angleSlider = win.anglePanel.add("slider", [15, 10, 165, 27],
        conf.slider_defaultvalue, conf.slider_minvalue, conf.slider_maxvalue);
    win.anglePanel.txtBox = win.anglePanel.add("edittext", [175, 14, 220, 34], 90);
    win.anglePanel.txtBox.justify = "right";
    win.anglePanel.txtBox.helpTip = "hit TAB to set the input value temporarily";
    
    win.radioPanel = win.add("panel", [15, 76, 215, 122], "extra anchor");
    win.radioPanel.orientation = "row";
    win.radioPanel.autoRb = win.radioPanel.add("radiobutton", undefined, "auto");
    win.radioPanel.alwaysRb = win.radioPanel.add("radiobutton", undefined, "always");
    win.radioPanel.neverRb = win.radioPanel.add("radiobutton", undefined, "never");
    win.radioPanel.autoRb.value = true;

    win.chkGroup = win.add("group");
    win.chkGroup.previewChk = win.chkGroup.add("checkbox", undefined, "preview");
    
    win.btnGroup = win.add("group");
    win.btnGroup.okBtn = win.btnGroup.add("button", undefined, "OK");
    win.btnGroup.cancelBtn = win.btnGroup.add("button", undefined, "Cancel");

    var getValues = function(){
        conf.center_angle = win.anglePanel.txtBox.text;
        
        if(win.radioPanel.alwaysRb.value){
            conf.extra_anchor = "always";
        } else if(win.radioPanel.neverRb.value){
            conf.extra_anchor = "never";
        } else {
            conf.extra_anchor = "auto";
        }
    }

    var processPreview = function( is_preview ){
        if( ! is_preview || win.chkGroup.previewChk.value){
            try{
                win.enabled = false;
                getValues();
                clearPreview();
                drawPreview();
                if( is_preview ) redraw();
            } catch(e){
                alert(e);
            } finally{
                win.enabled = true;
            }
        }
    }

    win.anglePanel.txtBox.onChange = function(){
      var v = parseFloat(this.text);
      
      if(isNaN(v)){
        v = conf.slider_defaultvalue;
      } else if(v < conf.slider_minvalue){
        v = conf.slider_minvalue;
      } else if(v > conf.slider_maxvalue){
        v = conf.slider_maxvalue;
      }
       this.text = v;
       
      win.anglePanel.angleSlider.value = v;
      processPreview( true );
    }
  
    win.anglePanel.angleSlider.onChanging = function(){
        win.anglePanel.txtBox.text = Math.round(this.value);
    }
    
    win.anglePanel.angleSlider.onChange = function(){
        win.anglePanel.txtBox.text = Math.round(this.value);
        processPreview( true );
    }
    
    win.chkGroup.previewChk.onClick = function(){
        if( this.value ){
            processPreview( true );
        } else {
            if( previewed ){
                clearPreview();
                redraw();
            }
        }
    }

    win.btnGroup.okBtn.onClick = function(){
        processPreview( false );
        win.close();
    }
    
    win.btnGroup.cancelBtn.onClick = function(){
        try{
            win.enabled = false;
            clearPreview();
        } catch(e){
            alert(e);
        } finally{
            win.enabled = true;
        }
        win.close();
    }
    win.show();

    if( previewed ) activeDocument.selection = sp.concat( preview_paths );
 //   if( previewed ) activeDocument.selection =  preview_paths;   // works, omits original selection items
    if( conf.errmsg != "") alert( conf.errmsg );
}

// ---------------------------------------------
function softgel(s0, s1, conf){
    var mpi = Math.PI;
    var hpi = mpi/2;
    
    var arr = getGBCenterWidth(s0);
    var o1 = arr[0];
    var r1 = arr[1] / 2;
    
    arr = getGBCenterWidth(s1);
    var o2 = arr[0];
    var r2 = arr[1] / 2;
    
    if(r1 == 0 || r2 == 0) return;
    
    var d = dist(o1, o2);
    if(d <= Math.abs(r1 - r2)) return;

    // if center_angle is 180, simply draw a circle.
    if(conf.center_angle == 180){
        return (function(){
            var d1 = (d + r2 - r1) / d;
            var d2 = (d + r1 - r2) / d;
            var center = [(o1[0] * d2 + o2[0] * d1) / 2,
                          (o1[1] * d2 + o2[1] * d1) / 2];
            var radius = (d + r1 + r2) / 2;
            var circle = activeDocument.activeLayer.pathItems.ellipse(
                center[1] + radius,
                center[0] - radius,
                radius * 2, radius * 2
                );
            var cp = circle.pathPoints;
            
            var pitem = s0.duplicate();
            var p = pitem.pathPoints;
            
            while(p.length < 4) p.add();
            while(p.length > 4) p[p.length - 1].remove();
            
            var copyPathPoint = function(p1, p2){
                p2.anchor = p1.anchor;
                p2.rightDirection = p1.rightDirection;
                p2.leftDirection = p1.leftDirection;
                p2.pointType = p1.pointType;
            };
            
            for(var i = 0; i < 4; i++){
                copyPathPoint(cp[i], p[i]);
            }
            circle.remove();
            return pitem;
        })();
    }

    var ot1 = getRad(o1, o2);
    var ot2 = ot1 + mpi;

    var t = conf.center_angle * mpi / 180; // center_angle as radian
    var cost = Math.cos( t );
    // r : radius of the arc
    var r = equation2_custom( 2 * cost - 2,
                              (2 - 2 * cost) * (r1 + r2),
                              2 * cost * r1 * r2 - r1 * r1 - r2 * r2 + d * d );
    if(r == null){
        conf.errmsg = "there're errors in calcuration of the radius";
        return;
    }
    
    var a = r - r2;
    var b = r - r1;

    // calcurates angles using the law of cosines
    var t_a = Math.acos((b * b + d * d - a * a) / (2 * b * d));
    if(isNaN(t_a)) return;
    var t_b = Math.acos((d * d + a * a - b * b) / (2 * d * a));
    if(isNaN(t_b)) return;

    // adds an extra anchor for each arc, if the central angle of
    // the arc is greater than 90 degree.
    var add_extra_anc = (t > hpi || conf.extra_anchor == "always");
    if( conf.extra_anchor == "never" ) add_extra_anc = false;
    if( add_extra_anc ){
        t /= 2;
    }

    // length of the handles for arc
    var h = 4 * Math.tan( t / 4 ) / 3 * r;
    
    var shape = s0.duplicate();
    with(shape){
        var p = pathPoints;

        // adjusts the number of the pathPoints
        while(p.length < 4) p.add();
        while(p.length > 4) p[p.length - 1].remove();
        if( add_extra_anc ){
            p.add();
            p.add();
        }
        
        var idx = 0;
        
        with(p[idx]){
            anchor = setPnt(o2, ot1 + t_b, r2);
            leftDirection = anchor;
            rightDirection = setPnt(anchor, ot1 + t_b + hpi, h);
        }
        idx += 1;
        
        if( add_extra_anc ){
            with(p[idx]){
                anchor = setPnt(setPnt(o1, ot1 - t_a, r - r1), ot1 + t_b + t, r);
                rightDirection = setPnt(anchor, ot1 + t_b + t + hpi, h);
                leftDirection = setPnt(anchor, ot1 + t_b + t - hpi, h);
            }
            idx += 1;
        }
        
        with(p[idx]){
            anchor = setPnt(o1, ot2 - t_a, r1);
            leftDirection = setPnt(anchor, ot2 - t_a - hpi, h);
            rightDirection = anchor;
        }
        idx += 1;
        
        with(p[idx]){
            anchor = setPnt(o1, ot2 + t_a, r1);
            leftDirection = anchor;
            rightDirection =setPnt(anchor, ot2 + t_a + hpi, h);
        }
        idx += 1;
        
        if( add_extra_anc ){
            with(p[idx]){
                anchor = setPnt(setPnt(o1, ot1 + t_a, r - r1), ot1 - t_b - t, r);
                rightDirection = setPnt(anchor, ot1 - t_b - t + hpi, h);
                leftDirection =setPnt(anchor, ot1 - t_b - t - hpi, h);
            }
            idx += 1;
        }
        
        with(p[idx]){
            anchor = setPnt(o2, ot1 - t_b, r2);
            leftDirection = setPnt(anchor, ot1 - t_b - hpi, h);
            rightDirection = anchor;
        }
    }
    return shape;
}

// ------------------------------------------------
function getGBCenterWidth(pi){
  var gb = pi.geometricBounds; // left, top, right, bottom
  return [[(gb[0] + gb[2]) / 2, (gb[1] + gb[3]) / 2], gb[2] - gb[0]];
}

// ------------------------------------------------
function setPnt(pnt, rad, dis){
  return [pnt[0] + Math.cos(rad) * dis,
          pnt[1] + Math.sin(rad) * dis];
}

// ------------------------------------------------
function dist(p1, p2) {
  return Math.sqrt(Math.pow(p1[0] - p2[0],2) + Math.pow(p1[1] - p2[1],2));
}

// ------------------------------------------------
function getRad(p1,p2) {
  return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}

// --------- -------------------------------------
function equation2_custom(a,b,c) {
    var s;
    if(a == 0){
        if(b == 0){
            return null;
        } else {
            s = -c / b;
            return s > 0 ? s : null;
        }
    }
    a *= 2;
    var d = b * b - 2 * a * c;
    if(d < 0){
        return null;
    }
    
    var rd = Math.sqrt(d);
    if(d > 0){
        var s1 = (-b + rd) / a;
        var s2 = (-b - rd) / a;
        if( s1 > 0 && s2 > 0){
            // I'm not sure if it's ok
            return Math.max( s1, s2 );
        } else if( s1 > 0 ){
            return s1;
        } else if( s2 > 0 ){
            return s2;
        } else {
            return null;
        }
    } else {
        s = -b / a;
        return s > 0 ? s : null;
    }
}

// --------------------------------------
// extract PathItems from "s" (Array of PageItems -- ex. selection),
// and put them into an Array "paths".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoints length is greater
// than this number.
function extractPaths(s, pp_length_limit, paths){
  for(var i = 0; i < s.length; i++){
    if(s[i].locked || s[i].hidden){
        continue;
    } else if(s[i].typename == "PathItem"){
      if((pp_length_limit && s[i].pathPoints.length <= pp_length_limit)
        || s[i].guides || s[i].clipping){
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
// ----------------------------------------------
function activateEditableLayer(pi){
  var lay = activeDocument.activeLayer;
  if(lay.locked || !lay.visible) activeDocument.activeLayer = pi.layer;
}
