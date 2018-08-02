//@include "lib/perlin-noise-simplex.js"
// This script requires "perlin-noise-simplex.js" by Sean McCullough.
// https://gist.github.com/banksean/304522

// The declaration on the first line assumes "perlin-noise-simplex.js" is
// placed under "lib" folder under "Scripts" folder of Adobe Illlustrator.

// ----
// noiseFill
// changes the colors of the selected paths using Simplex noise.

// USAGE: Select filled paths and run this script.
// NOTE: The objects other than filled paths in the selection are ignored.

// JavaScript Script for Adobe Illustrator
// Tested with Adobe Illustrator CC2014, Windows 7 (Japanese version).

// Copyright(c) 2014 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// Sun, 28 Dec 2014 10:10:18 +0900
// Sat, 26 Nov 2016 19:10:05 +0900
// -- add try...finally statement around parts changing win.enabled property.
// 2018.07.20, modified to ignore locked/hidden objects in a selected group
// 2018.08.02, added comment. modified variable name

(function(){
    var _perlin;
    var _n;
    var _grayRangeHalf;
    var _opts = {};
    var _paths = [];
    var _rect;
    var _fullLength;
    
    var main = function(){
        var script_name = "noiseFill";
    
        if(documents.length < 1) return;

        getPathItemsInSelection(1, _paths);
        if(_paths.length < 1) return;
        
        _rect = getSelectedRect(_paths);
        _fullLength = Math.max(_rect.width, _rect.height);
        
        // dialog
        var previewed = false;
        
        var clearPreview = function(){
            if( previewed ){
                try{
                    undo();
                } catch(e){
                    alert(e);
                } finally {
                    previewed = false;
                }
            }
        }
        
        var drawPreview = function(){
            var ok = getValues();
            if(ok){
                try{
                    noiseFillMain();
                } finally {
                    previewed = true;
                }
            }
        }
        
        var win = new Window("dialog", script_name);
        win.alignChildren = "right";

        // default values ---- edit as you prefer
        var et_gray_max = addEditText(win, "gray max:", "95");
        var et_gray_min = addEditText(win, "gray min:", "5");
        var et_noise_factor = addEditText(win,  "noise factor", "3");
        
        var chkGrp = win.add("group");
        chkGrp.alignment = "center";
        var previewChk = chkGrp.add("checkbox", undefined, "preview");
    
        // buttons
        var btnGrp = win.add("group");
        var btn_ok = btnGrp.add("button", undefined, "OK");
        var btn_cancel = btnGrp.add("button", undefined, "Cancel");
    
        var getValues = function(){
            _opts.gray_max = parseFloat(et_gray_max.text);
            _opts.gray_min = parseFloat(et_gray_min.text);
            _opts.noise_factor =  parseFloat(et_noise_factor.text);
        
            var ok = verifyOptsValues( _opts );
            return ok;
        }
        
        var processPreview = function( is_preview ){
            if( ! is_preview || previewChk.value){
                try{
                    win.enabled = false;
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
        
        previewChk.onClick = function(){
            if( this.value ){
                processPreview( true );
            } else {
                if( previewed ){
                    clearPreview();
                    redraw();
                }
            }
        }

        btn_ok.onClick = function(){
            if(!previewed) processPreview( false );
            win.close();
        }
        
        btn_cancel.onClick = function(){
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
    };
    // -----------------------------------------------
    var verifyOptsValues = function(_opts){
        var ok = true;
        var errmsg = "";
        if(isNaN(_opts.gray_max)){
            errmsg = "gray max value is invalid";
        } else if( isNaN(_opts.gray_min)){
            errmsg = "gray min value is invalid";
        } else if( isNaN(_opts.noise_factor) || _opts.noise_factor < 0){
            errmsg = "noise factor value is invalid";
        }
        
        if(errmsg != ""){
            alert(errmsg);
            ok = false;
        } else {
            if(_opts.gray_max > 100) _opts.gray_max = 100;
            if(_opts.gray_max < 0) _opts.gray_max = 0;
            if(_opts.gray_min > 100) _opts.gray_min = 100;
            if(_opts.gray_min < 0) _opts.gray_min = 0;
        }
        return ok;
    };
    // -----------------------------------------------
    // ScriptUI utility
    var addEditText = function(win, label, defaultvalue){
        var gr = win.add("group");
        gr.add("statictext", undefined, label);
        var et = gr.add("edittext", undefined, defaultvalue);
        et.characters = 6;
        return et;
    };
    // -----------------------------------------------
    var noiseFillMain = function(){
        _perlin = new SimplexNoise();
        _n = Math.random() * 10;
        _grayRangeHalf = (_opts.gray_max - _opts.gray_min) / 2;
        
        for(var i = 0; i < _paths.length; i++){
            col = new GrayColor();
            col.gray = getGrayValue(_paths[i]);
            _paths[i].fillColor = col;
        }
    };
    // -----------------------------------------------
    var Point = function(x_, y_){
        this.x = x_;
        this.y = y_;
    };
    // -----------------------------------------------
    var Rect = function(l, r, t, b){
        this.left = l;
        this.right = r;
        this.top = t;
        this.bottom = b;
        this.width = r - l;
        this.height = t - b;
    };
    // -----------------------------------------------
    // generates gray value according to the coordinate of "item".
    // returns "noiseValue": (_opts.range_min <= noiseValue <= _opts.range.max)
    var getGrayValue = function(item){  // item : PageItem
        var center = getCenter(item);
        var kx = (center.x - _rect.left) / _fullLength * _opts.noise_factor;
        var ky = (center.y - _rect.bottom) / _fullLength * _opts.noise_factor;
        var noiseValue = _perlin.noise(_n + kx, _n + ky) + 1;  // 0 < . < 2
        return noiseValue * _grayRangeHalf + _opts.gray_min;
    };
    // -----------------------------------------------
    var getCenter = function(item){
        return new Point(item.left + item.width / 2,
                         item.top - item.height / 2);
    };
    // -----------------------------------------------
    var getSelectedRect = function(sel){
        var left = sel[0].left;
        var right = left + sel[0].width;
        var top = sel[0].top;
        var bottom = sel[0].top - sel[0].height;
        
        for(var i = 1; i < sel.length; i++){
            var s = sel[i];
            left = Math.min(left, s.left);
            right = Math.max(right, s.left + s.width);
            top = Math.max(top, s.top);
            bottom = Math.min(bottom, s.top - s.height);
        }
        return new Rect(left, right, top, bottom);
    };
    // -----------------------------------------------
    // extract PathItems from the selection which length of PathPoints
    // is greater than "n"
    var getPathItemsInSelection = function(n, paths){
        if(documents.length < 1) return;
        
        var s = activeDocument.selection;
        
        if (!(s instanceof Array) || s.length < 1) return;
        
        extractPaths(s, n, paths);
    };
    // -----------------------------------------------
    // extract PathItems from "s" (Array of PageItems -- ex. selection),
    // and put them into an Array "paths".  If "pp_length_limit" is specified,
    // this function extracts PathItems which PathPoints length is greater
    // than this number.
    var extractPaths = function(s, pp_length_limit, paths){
        for(var i = 0; i < s.length; i++){
            if(s[i].locked || s[i].hidden){
                continue;
            } else if(s[i].typename == "PathItem"){
               if ((pp_length_limit && s[i].pathPoints.length <= pp_length_limit)
                   || s[i].guides || s[i].clipping ){
                    continue;
                }
                if (s[i].filled){
                    paths.push(s[i]);
                }
            } else if(s[i].typename == "GroupItem"){
                // search for PathItems in GroupItem, recursively
                extractPaths(s[i].pageItems, pp_length_limit, paths);
                
            } else if(s[i].typename == "CompoundPathItem"){
                // searches for pathitems in CompoundPathItem, recursively
                // ( ### Grouped PathItems in CompoundPathItem are ignored ### )
                extractPaths(s[i].pathItems, pp_length_limit , paths);
            }
        }
    };
    // -----------------------------------------------
    main();
})();
