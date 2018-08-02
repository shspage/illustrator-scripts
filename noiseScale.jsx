//@include "lib/perlin-noise-simplex.js"
// This script requires "perlin-noise-simplex.js" by Sean McCullough.
// https://gist.github.com/banksean/304522

// The declaration on the first line assumes "perlin-noise-simplex.js" is
// placed under "lib" folder under "Scripts" folder of Adobe Illlustrator.

// ----
// noiseScale
// changes the size of the selected items using Simplex noise.

// USAGE: Select items and run this script.
// NOTE: compound paths are not released

// JavaScript Script for Adobe Illustrator
// Tested with Adobe Illustrator CC2018, Windows 10 (Japanese version).

// Copyright(c) 2018 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

(function(){
    var _perlin;
    var _n;
    var _rangeHalf;
    var _opts = {};
    var _items = [];
    var _rect;
    var _fullLength;

    // resize options (by my preference)
    // Note that "changeLineWidth" is "false"
    var _scaleOpt = {
        changePositions:true,
        changeFillPatterns:true,
        changeFillGradients:true,
        changeStrokePattern:true,
        changeLineWidth:false,
        scaleAbout:Transformation.CENTER
    };
    
    var main = function(){
        var script_name = "noiseScale";
    
        if(documents.length < 1) return;

        if(activeDocument.selection.length < 1){
            return;
        }
        
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
                    noiseMain();
                } finally {
                    previewed = true;
                }
            }
        }
        
        var win = new Window("dialog", script_name);
        win.alignChildren = "right";

        // default values ---- edit as you prefer
        var et_range_max = addEditText(win, "scale max(%):", "100");
        var et_range_min = addEditText(win, "scale min(%):", "25");
        var et_noise_factor = addEditText(win,  "noise factor", "3");
        
        var chkGrp = win.add("group");
        chkGrp.alignment = "center";
        var previewChk = chkGrp.add("checkbox", undefined, "preview");

        var extractGroupChk = chkGrp.add("checkbox", undefined, "extract group");
        extractGroupChk.value = true;
    
        // buttons
        var btnGrp = win.add("group");
        var btn_ok = btnGrp.add("button", undefined, "OK");
        var btn_cancel = btnGrp.add("button", undefined, "Cancel");
    
        var getValues = function(){
            _opts.range_max = parseFloat(et_range_max.text);
            _opts.range_min = parseFloat(et_range_min.text);
            _opts.noise_factor =  parseFloat(et_noise_factor.text);
        
            var ok = verifyOptsValues( _opts );
            return ok;
        }
        
        var processPreview = function( is_preview ){
            _items = [];
            if(extractGroupChk.value){
                extractPageItems(activeDocument.selection, _items);
            } else {
                _items = activeDocument.selection;
            }
            
            if(_items.length < 1){
                alert("ABORT:\rnothing selected");
                return;
            }
            
            _rect = getSelectedRect(_items);
            _fullLength = Math.max(_rect.width, _rect.height);
            
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
        if(isNaN(_opts.range_max) || _opts.range_max <= 0){
            errmsg = "max value is invalid";
        } else if( isNaN(_opts.range_min) || _opts.range_min <= 0){
            errmsg = "min value is invalid";
        } else if( isNaN(_opts.noise_factor) || _opts.noise_factor < 0){
            errmsg = "noise factor value is invalid";
        }
        
        if(errmsg != ""){
            alert(errmsg);
            ok = false;
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
    var noiseMain = function(){
        _perlin = new SimplexNoise();
        _n = Math.random() * 10;
        _rangeHalf = (_opts.range_max - _opts.range_min) / 2;
        
        for(var i = 0; i < _items.length; i++){
            var v = getNoiseValue(_items[i]);
            _items[i].resize(v, v,
                             _scaleOpt.changePositions,
                             _scaleOpt.changeFillPatterns,
                             _scaleOpt.changeFillGradients,
                             _scaleOpt.changeStrokePattern,
                             _scaleOpt.changeLineWidth,
                             _scaleOpt.scaleAbout
                             );
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
    // generates noise value according to the coordinate of "item".
    // returns "noiseValue": (_opts.range_min <= noiseValue <= _opts.range.max)
    var getNoiseValue = function(item){  // item : PageItem
        var center = getCenter(item);
        var kx = (center.x - _rect.left) / _fullLength * _opts.noise_factor;
        var ky = (center.y - _rect.bottom) / _fullLength * _opts.noise_factor;
        var noiseValue = _perlin.noise(_n + kx, _n + ky) + 1;  // 0 < . < 2
        return noiseValue * _rangeHalf + _opts.range_min;
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
    var extractPageItems = function(s, items){
        for(var i = 0; i < s.length; i++){
            if(s[i].typename == "GroupItem"){
                extractPageItems(s[i].pageItems, items);
            } else {
                items.push(s[i]);
            }
        }
    };
    // -----------------------------------------------
    main();
})();
