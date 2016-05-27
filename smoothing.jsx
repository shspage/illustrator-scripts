#target "illustrator"

// smoothing.jsx (Catmull-Rom spline)

// applys smoothing to selected pathPoints
// on selected polygon paths using the Catmull-Rom spline.
// you can adjust the tension with a slider.

// (reference: Catmull-Rom to Bezier conversion.
//  https://pomax.github.io/bezierinfo/#catmullconv
// )

// Copyright(c) 2016 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

(function(){
    // ----------------------------------------
    function main(){
        // available slider value: float number greater than 0
        // (value 0 do nothing.)
        var conf = {
            tension : 1.0,
            minSliderValue : 0.5,
            maxSliderValue : 2.0
        }
      
        if(app.documents.length < 1) return;
        
        var paths = [];
        extractPaths(app.activeDocument.selection, paths);
        if(paths.length < 1){
            alert("Nothing selected");
            return;
        }
    
        // gets selected status of each pathPoint
        var result = getSelectedSpec(paths);
        if(result.noAnchorSelected){
            alert("No Anchor Selected");
            return;
        }
        var selectedSpec = result.specs;
            
        var previewed = false;
        
        var clearPreview = function(){
            if( previewed ){
                try{
                    undo();
                    redraw();
                } catch(e){
                    alert(e);
                } finally {
                    previewed = false;
                }
            }
        }
        
        var drawPreview = function(){
            try{
                smoothing(paths, selectedSpec, conf.tension);
            } finally {
                previewed = true;
            }
        }
    
        // show a dialog
        var win = new Window("dialog", "smoothing" );
        win.alignChildren = "fill";
        
        win.rateSliderPanel = win.add("panel", undefined, "tension");
        win.rateSliderPanel.orientation = "row";
        win.rateSliderPanel.alignChildren = "fill";
        win.rateSliderPanel.rateSlider
          = win.rateSliderPanel.add("slider", undefined, conf.tension, conf.minSliderValue, conf.maxSliderValue);
        win.rateSliderPanel.txtBox = win.rateSliderPanel.add("edittext", undefined, conf.tension);
        win.rateSliderPanel.txtBox.justify = "right";
        win.rateSliderPanel.txtBox.characters = 5;
        win.rateSliderPanel.txtBox.helpTip = "hit TAB to set the input value temporarily";
        
        win.chkGroup = win.add("group");
        win.chkGroup.alignment = "center";
        win.chkGroup.previewChk = win.chkGroup.add("checkbox", undefined, "preview");
        
        win.btnGroup = win.add("group", undefined );
        win.btnGroup.alignment = "center";
        win.btnGroup.okBtn = win.btnGroup.add("button", undefined, "OK");
        win.btnGroup.cancelBtn = win.btnGroup.add("button", undefined, "Cancel");
    
        var getValues = function(){
            conf.tension = win.rateSliderPanel.txtBox.text;  //.text;
        }
        
        var processPreview = function( is_preview ){
            if( ! is_preview || win.chkGroup.previewChk.value){
                win.enabled = false;
                getValues();
                clearPreview();
                drawPreview();
                if( is_preview ) redraw();
                win.enabled = true;
            }
        }
    
        win.rateSliderPanel.txtBox.onChange = function(){
            var v = parseFloat(this.text);
            
            if(isNaN(v)){
                v = conf.slider_defaultvalue;
            } else if(v < 0){
                v = 0;
            } else if(v > conf.maxSliderValue){
                v = conf.maxSliderValue;
            }
            this.text = v;
            
            win.rateSliderPanel.rateSlider.value = v;
            processPreview( true );
        }
    
        win.rateSliderPanel.rateSlider.onChanging = function(){
            win.rateSliderPanel.txtBox.text = this.value.toFixed( 1 );
        }
        win.rateSliderPanel.rateSlider.onChange = function(){
            win.rateSliderPanel.txtBox.text = this.value.toFixed( 1 );
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
            win.enabled = false;
            clearPreview();
            win.enabled = true;
            win.close();
        }
        win.show();
    }
    // ----------------------------------------
    /**
     * converts Catmull-Rom to Bezier
     * reference: https://pomax.github.io/bezierinfo/#catmullconv
     * @param  {[x, y]} pt0     pathPoint.anchor
     * @param  {[x, y]} pt1     pathPoint.anchor
     * @param  {[x, y]} pt2     pathPoint.anchor
     * @param  {[x, y]} pt3     pathPoint.anchor
     * @param  {float} tension     parameter
     * @return {[[x, y], [x, y]]}  coordinates for pt1.rightDirection and pt2.leftDirection
     */
    function catmullrom2bezier(pt0, pt1, pt2, pt3, tension){
        var rlx = catmullrom2bezier_sub(
            pt0.anchor[0],
            pt1.anchor[0],
            pt2.anchor[0],
            pt3.anchor[0], tension);
        var rly = catmullrom2bezier_sub(
            pt0.anchor[1],
            pt1.anchor[1],
            pt2.anchor[1],
            pt3.anchor[1], tension);
        
        // rightDirection, leftDirection
        return [[rlx[0], rly[0]], [rlx[1], rly[1]]];
    }
    // ----------------------------------------
    /**
     * calcs a pair of x or y coordinate for bezier control points
     * @param  {float} p0      anchor[0] or [1]
     * @param  {float} p1      anchor[0] or [1]
     * @param  {float} p2      anchor[0] or [1]
     * @param  {float} p3      anchor[0] or [1]
     * @param  {float} tension   parameter
     * @return {[float, float]}  a pair of x or y ([x,x] or [y, y]) for bezier control points
     */
    function catmullrom2bezier_sub(p0, p1, p2, p3, tension){
        if(tension == 0) return [p1, p2];
        return [p1 + (p2 - p0) / (6 * tension),
                p2 - (p3 - p1) / (6 * tension)];
    }
    
    // ----------------------------------------
    /**
     * applies smoothing to selected pathPoints of selected paths
     * @param  {[PathItems]} paths        selected paths
     * @param  {[[boolean]]} selectedSpec selected status of each pathPoints
     * @param  {float} tension      catmull-rom spline parameter
     */
    function smoothing(paths, selectedSpec, tension){
        var p;   // target path
        var pt;  // pathPoints of the target path
        var rl;  // [(x,y) for rightDirection, (x,y) for leftDirection]
        
        // index of pathPoints
        var idx0, idx1, idx2, idx3;
        var lastIdx, beforeLastIdx;
        
        for(var pi = 0, piEnd = paths.length; pi < piEnd; pi++){
            p = paths[pi];
            pt = p.pathPoints;
            //if(pt.length < 2) continue;  // already excluded with "extractPaths"
            
            lastIdx = pt.length - 1;
            beforeLastIdx = lastIdx - 1;
            
            for(var i = 0; i <= lastIdx; i++){
                if(p.closed){
                    idx0 = (i == 0) ? lastIdx : i - 1;
                    idx1 = i;
                    idx2 = (i == lastIdx) ? 0 : i + 1;
                    if(i == lastIdx){
                        idx3 = 1;
                    } else {
                        idx3 = (i == beforeLastIdx) ? 0 : i + 2;
                    }
                } else {
                    if(i == lastIdx) break;
                    idx0 = (i == 0) ? 0 : i - 1;
                    idx1 = i;
                    idx2 = i + 1;
                    idx3 = (i == beforeLastIdx) ? i + 1 : i + 2;
                }
                
                if(!selectedSpec[pi][idx1]
                   && !selectedSpec[pi][idx2]) continue;
                
                rl = catmullrom2bezier(
                    pt[idx0], pt[idx1], pt[idx2], pt[idx3], tension);
    
                if(selectedSpec[pi][idx1]) pt[idx1].rightDirection = rl[0];
                if(selectedSpec[pi][idx2]) pt[idx2].leftDirection  = rl[1];
            }
        }
    }
    // ----------------------------------------
    /**
     * extracts pathItems from "sel" and appends them to the array "paths"
     * @param  {[PageItem]} sel   an array of PageItems (ex.selection)
     * @param  {[PathItem]} paths an array of PathItems (an empty array at first)
     */
    function extractPaths(sel, paths){
        for(var i = 0, iEnd = sel.length; i < iEnd; i++){
            if(sel[i].typename == "PathItem"
               && sel[i].pathPoints.length >= 2){
                paths.push(sel[i]);
                
            } else if(sel[i].typename == "GroupItem"){
                extractPaths(sel[i].pageItems, paths);
            } else if(sel[i].typename == "CompoundPathItem"){
                extractPaths(sel[i].pathItems, paths);
            }
        }
    }
    // -----------------------------------------------
    /**
     * gets the selected status of each pathPoint of each path.
     * (true if selected)
     * @param  {[PathItem]} paths an array of PathItems
     * @return specs, noAnchorSelected {[[boolean]], boolean} selected status
     */
    function getSelectedSpec( paths ){
        var specs = [];
        var noAnchorSelected = true;
        
        for( var i = 0, iEnd = paths.length; i < iEnd; i++ ){
            var pp = paths[i].pathPoints;
            var spec = [];
            for(var j = 0; j < pp.length; j++ ){
                var stat = isSelected(pp[j]);
                if(stat) noAnchorSelected = false;
                spec.push(stat);
            }
            specs.push( spec );
        }
        return { specs : specs, noAnchorSelected : noAnchorSelected };
    }
    // -----------------------------------------------
    /**
     * returns selected state of a pathPoint p
     * @param  {PathPoint}  p
     * @return {boolean}   true if its anchor point is selected
     */
    function isSelected(p){
      return p.selected == PathPointSelection.ANCHORPOINT;
    }
    // -----------------------------------------------
    main();
})();
