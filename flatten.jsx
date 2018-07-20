// flatten.jsx
// adobe Illustrator CS-CC script

// ---------------------------------------------------------------------
// [English]
// This script converts curved lines into broken lines.
//
// How to use:
// * Select paths and run this script. Specify max error and hit OK button.
//
// * If "max distance between 2 points" is greater than 0, anchor points
// are generated on each segment including straight line according to
// this setting.  Set 0 to ignore this setting.
//
// * If "output to file" is checked, saves the coordinates data of
// flattened paths to a file **without** doing actual flattening.
//
// flattening methods
// * mid_t:
// If the distance between the midpoint P of a Bezier curve (according
// to Bezier curve's parameter (t = 0.5)) and a straight line connecting
// its two anchors is greater than specified value, the point P is added
// on the curve to divide it. Then these two curves are verified again.
//
// * divide_t: (default)
// It divides the curve between the anchors equally by parameters and
// verifies the error for each of the divided curves using the midpoint
// that based on the parameter of the Bezier curve. If there is a curve
// whose error is larger than the specified value, it increases the
// number of divisions by one and verifies again.
//
// * tangent:
// If the distance between the straight line connecting the anchors and
// the point P which is the farthest point among the points where the
// straight line with the same slope is in contact with the curve between
// the anchors is more than the specified value, the point P  is added on
// the curve to divide it. Then these two curves are verified again.

// ---------------------------------------------------------------------
// [Japanese]
// 折れ線化.jsx
// ・曲線を折れ線に変換します。
// ・オプション設定により直線も含めてアンカー間の距離が設定値以下になる
//   ようアンカーを追加します。
// ・スクリプトのファイル名（".jsx" より前の部分）は自由に変更できます。
//
// 使い方：
// * パス（複数可）を選択してスクリプトを実行する。
//   最大誤差を指定して OK ボタンを押す。
//
// * 「アンカー間の最大長」が 0 より大きい場合、設定値に従い、直線上も含
//   めてパス上にアンカーポイントが追加されます。この設定を無効にするには
//    0 を指定してください。
//
// * 「ファイルに出力」がチェックされている場合、実際に変換せず、変換結果
//   の各点の座標をファイルに出力します。
//
// 折れ線化の方法
// * PM中点:
// ベジェ曲線のパラメータの中間値（t = 0.5）によるアンカー間の曲線上の点P
// とアンカー間を結んだ直線との距離が指定値以上であれば、点Pの位置で曲線を
// 分割します。次に、これらの2つの曲線が再び検証されます。
//
// * PM等分割: (既定値)
// アンカー間の曲線をパラメーターで均等に分割し、分割された各曲線の誤差を
// ベジェ曲線のパラメーターに基づく中間点を使用して検証します。指定した値
// より大きい誤差がある場合は、分割数を1つ増やして再度検証します。
//
// * 接線:
// アンカー間を結んだ直線と、同じ傾きの直線がアンカー間の曲線に接する点の
// うち最も遠い点Pとの距離が指定値以上であれば、点P の位置で曲線を分割し
// ます。 次に、これらの2つの曲線が再び検証されます。

// ---------------------------------------------------------------------
// ver.1.2.0
// test env: Adobe Illustrator CC2018 (Windows)
// 2018-03-02: added method "divide_t". added UI. rename script itself
// 2018-03-05: fixed min divide count of divide_t
// 2018-07-18: added parameter "max_dist_between_points". changed radio-button order
//             fixed each division method to add anchors only when necessary
// 2018-07-20: modified to ignore locked/hidden objects in a selected group

// Copyright(c) 2018 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

(function(){
    var _conf = {
        max_error: 0.2,
        max_dist_between_points: 0,
        divide_method : undefined,
        output_to_file : false,
        output_decimal_places : 7,
        output_file_extension : "csv",
        max_dist_squared: 0,

        locale : app.locale,

        script_name : "flatten",
        divide_method_mid_t : "mid_t",
        divide_method_divide_t : "divide_t",
        divide_method_tangent : "tangent",
        default_divide_method : "divide_t"
    };

    var _messages = {
        conf_script_name : { "en" : "flatten", "ja_JP" : "折れ線化" },
        conf_divide_method_mid_t : { "en" : "mid_t", "ja_JP" : "PM中点" },
        conf_divide_method_divide_t : { "en" : "divide_t", "ja_JP" : "PM等分割" },
        conf_divide_method_tangent : { "en" : "tangent", "ja_JP" : "接線" },

        alert_select_paths : {
            "en" : "select path(s) before run this script",
            "ja_JP" : "パスを選択してから実行してください。"
        },
        alert_verify_max_error : {
            "en" : "please input a positive number for max error.",
            "ja_JP" : "許容誤差には正の値を入力してください。"
        },
        alert_verify_max_dist : {
            "en" : "please input a positive number or zero for max dist.",
            "ja_JP" : "アンカー間の最大長には０以上の数字を入力してください。"
        },

        dialog_max_error : { "en" : "max error (in point)", "ja_JP" : "許容誤差 (pt)" },
        dialog_max_dist : { 
            "en" : "max distance between 2 points (in point)",
            "ja_JP" : "アンカー間の最大長 (pt)" },
        dialog_max_dist_notice : {
            "en" : "Set 0 to ignore this setting.",
            "ja_JP" : "※ 最大長を制限しない場合は 0 を指定" },
        dialog_output_to_file : { "en" : "output to file", "ja_JP" : "ファイルに出力" },
        dialog_dividing_method : { "en" : "", "ja_JP" : "分割方法" },
        dialog_ok : { "en" : "OK", "ja_JP" : "OK" },
        dialog_cancel : { "en" : "Cancel", "ja_JP" : "キャンセル" },

        output_title : { "en" : "save to a file", "ja_JP" : "ファイルに保存" },
        output_error : {
            "en" : "failed to open a file",
            "ja_JP" : "ファイルを開けませんでした。"
        },
        output_saved : { "en" : "saved", "ja_JP" : "保存しました。" }
    }

    // -----------------------------------------------
    function main(){
        configureByLocale();

        // get the selected paths
        var paths = [];
        getPathItemsInSelection( 1, paths );
        if( paths.length < 1 ){
            alertByLocale("alert_select_paths");
            return;
        }

        // show a dialog
        var win = new Window("dialog", _conf.script_name);
        win.alignChildren = "fill";

        win.edPanel1 = win.add("panel", undefined, getMessage("dialog_max_error"));
        win.edPanel1.orientation = "column";
        win.edPanel1.alignChildren = "fill";
        win.edPanel1.gp1 = win.edPanel1.add("group");
        win.edPanel1.gp1.txtBox = win.edPanel1.gp1.add("edittext", undefined, _conf.max_error);
        win.edPanel1.gp1.txtBox.justify = "right";
        win.edPanel1.gp1.txtBox.characters = 8;

        win.edPanel2 = win.add("panel", undefined, getMessage("dialog_max_dist"));
        win.edPanel2.orientation = "column";
        win.edPanel2.alignChildren = "fill";
        win.edPanel2.gp1 = win.edPanel2.add("group");
        win.edPanel2.gp1.txtBox = win.edPanel2.gp1.add("edittext", undefined, _conf.max_dist_between_points);
        win.edPanel2.gp1.txtBox.justify = "right";
        win.edPanel2.gp1.txtBox.characters = 8;
        win.edPanel2.stxt = win.edPanel2.add("statictext", undefined, getMessage("dialog_max_dist_notice"));

        win.chkGroup = win.add("group");
        win.chkGroup.alignment = "center";
        win.chkGroup.outputChk = win.chkGroup.add("checkbox", undefined, getMessage("dialog_output_to_file"));

        win.rbPanel = win.add("panel", undefined, getMessage("dialog_dividing_method"));
        win.rbPanel.orientation = "row";
        win.rbPanel.alignChildren = "fill";
        win.rbPanel.midT = win.rbPanel.add("radiobutton", undefined, _conf.divide_method_mid_t);
        win.rbPanel.divideT = win.rbPanel.add("radiobutton", undefined, _conf.divide_method_divide_t);
        win.rbPanel.tangent = win.rbPanel.add("radiobutton", undefined, _conf.divide_method_tangent);
        
        win.btnGroup = win.add("group", undefined );
        win.btnGroup.alignment = "center";
        win.btnGroup.okBtn = win.btnGroup.add("button", undefined, getMessage("dialog_ok"));
        win.btnGroup.cancelBtn = win.btnGroup.add("button", undefined, getMessage("dialog_cancel"));
        
        if( _conf.default_divide_method == _conf.divide_method_mid_t){
            win.rbPanel.midT.value = true;
        } else if( _conf.default_divide_method == _conf.divide_method_tangent){
            win.rbPanel.tangent.value = true;
        } else {
            win.rbPanel.divideT.value = true;
        }
        
        var getValues = function(){
            var err = false;
            err = setMaxError(win.edPanel1.gp1.txtBox.text);
            if(err) return err;
            
            err = setMaxDist(win.edPanel2.gp1.txtBox.text);
            if(err) return err;

            _conf.max_dist_squared = _conf.max_dist_between_points
              * _conf.max_dist_between_points;

            if(win.rbPanel.midT.value){
                _conf.divide_method = _conf.divide_method_mid_t;
            } else if(win.rbPanel.tangent.value){
                _conf.divide_method = _conf.divide_method_tangent;
            } else {
                _conf.divide_method = _conf.divide_method_divide_t;
            }

            _conf.output_to_file = win.chkGroup.outputChk.value;

            return err;
        }
        
        var onBtnOk = function(){
            try{
                win.enabled = false;
                var err = getValues();
                if(!err){
                    flatten(paths);
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

    // ----
    function setMaxError(max_error){
        var err = false;
        var v = parseFloat(max_error);  //win.edPanel1.gp1.txtBox.text);
        if(isNaN(v) || v <= 0){
            alertByLocale("alert_verify_max_error");
            err = true;
        } else {
            _conf.max_error = v;
        }
        return err;
    }
    // ----
    function setMaxDist(max_dist){
        var err = false;
        var v  = parseFloat(max_dist);  //win.edPanel2.gp1.txtBox.text);
        if(isNaN(v) || v < 0){
            alertByLocale("alert_verify_max_dist");
            err = true;
        } else {
            _conf.max_dist_between_points = v;
        }
        return err;
    }
    // -----------------------------------------------
    function flatten(paths){
        // main process
        var all_points = [];
        for(var i=0; i < paths.length; i++){
            all_points.push(flattenMain( paths[i] ));
        }

        if(_conf.output_to_file){
            var data = [];
            for(var i = 0; i < all_points.length; i++){
                var pnts = all_points[i];
                for(var ip = 0; ip < pnts.length; ip++){
                    data.push(
                        pnts[ip].x.toFixed(_conf.output_decimal_places)
                        + ","
                        + pnts[ip].y.toFixed(_conf.output_decimal_places)
                        + "\n"
                    );
                }
                // Each path is separated by a line feed
                data.push("\n");
            }
            writeToFile(data.join(""), _conf.output_file_extension);
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
        setr : function(xy){  // set with an array
            this.x = xy[0];
            this.y = xy[1];
            return this;
        },
        setp : function(p){  // set with a Point
            this.x = p.x;
            this.y = p.y;
            return this;
        },
        eq : function(p){  // p: Point
            return this.x == p.x && this.y == p.y;
        },
        add : function(p){  // p: Point
            return new Point(this.x + p.x, this.y + p.y);
        },
        mul : function(m){  // m: float
            return new Point(this.x * m, this.y + m);
        },
        dist2 : function(p){  // p: Point
            var dx = p.x - this.x;
            var dy = p.y - this.y;
            return dx*dx + dy*dy;
        },
        dist : function(p){  // p: Point
            return Math.sqrt(this.dist2(p));
        },
        toArray : function(){
            return [this.x, this.y];
        }
    }
    // ---------------------------
    // a class for a straight line stores A,B,C of Ax + By + C = 0
    // A and B are defined to be A^2+B^2 = 1
    var Line = function(){
        this.a = 0;
        this.b = 0;
        this.c = 0;
    }
    Line.prototype = {
        set : function(p1, p2){ // p1, p2: Point
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
        getDist : function(p){ // p: Point
            // returns line length of prependicular line drawn from p
            // to this line. ( a general formula is
            // d = sqrt((ax+by+c)^2/(a^2+b^2) ))
            return Math.abs( this.a * p.x + this.b * p.y + this.c );
        }
    }
    // -----------------------------------------------
    // a class that stores a pair of bezier curve parameters (t1, t2)
    // and coordinates(p1, p2) correspond to each parameter. used in
    // "mid_t" method
    var Tpair = function( t1, t2, p1, p2 ){
        this.t1 = t1; this.t2 = t2;
        this.p1 = p1; this.p2 = p2;
    }
    // a class that stores a set of bezier curve parameters (t1, t2,
    // t3) and coordinates(p1, p2, p3) correspond to each parameter.
    // used in "tangent" method
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
        getBrokenPoints_MaxH_MidT_main : function( ts, tps ){
            var shift_count = 0;
            while( tps.length > 0 ){
                var tp = tps.shift();
                shift_count++;
                var t = (tp.t1 + tp.t2) / 2;
                var p = this.bezier( t );

                var line = new Line().set( tp.p1, tp.p2 );
                
                if( line.getDist( p ) > _conf.max_error
                    || (_conf.max_dist_between_points > 0
                        && tp.p1.dist2(tp.p2) > _conf.max_dist_squared)
                    ){
                    ts.push( t );
                    tps.push( new Tpair(tp.t1, t, tp.p1, p));
                    tps.push( new Tpair(t, tp.t2, p, tp.p2));
                }
            }
            return shift_count;
        },
        getBrokenPoints_MaxH_MidT : function(){
            var ts = [0, 0.5, 1];

            if( this.hasNoHandle() ){
                return this.breakStraightLine();
            } else {
                var p =  this.bezier( 0.5 );
                var tps = [ new Tpair(0, 0.5, this.p1, p),
                            new Tpair(0.5, 1, p, this.p2)];
                var shift_count = this.getBrokenPoints_MaxH_MidT_main(ts, tps );

                if(shift_count == 2){
                    ts = [0, 1];
                    tps = [ new Tpair(0, 1, this.p1, this.p2)];
                    this.getBrokenPoints_MaxH_MidT_main(ts, tps );
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
        getBrokenPoints_MaxH_DivideT_main : function(n){
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
                    if(line.getDist(midP) > _conf.max_error
                    || (_conf.max_dist_between_points > 0
                        && p.dist2(p_next) > _conf.max_dist_squared)
                    ){
                        err = true;
                        break;
                    }
                    t = t_next;
                    p = p_next;
                }
            }
            return n;
        },
        getBrokenPoints_MaxH_DivideT : function(){
            var ts = [0, 1];

            if( this.hasNoHandle() ){
                return this.breakStraightLine();
            } else {
                var n = this.getBrokenPoints_MaxH_DivideT_main(1);
                if(n == 2){
                    n = this.getBrokenPoints_MaxH_DivideT_main(0);
                }

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
            var line = new Line().set( this.bezier(t0), this.bezier(t1) );
            
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
            var verifyAndPush = function(curve, t){
                var ct = convT(t);
                if(line.getDist(curve.bezier(ct)) > _conf.max_error){
                    ts.push(ct);
                }
            };
            
            if (v1 == 0) {
                if (v2 == 0) return;
                t = -v3 / v2;
                if(t < 1 && t > 0) verifyAndPush(this, t);
            } else {
                var sq = Math.sqrt(v2*v2 - 4*v1*v3);
                v1 *= 2;
                t = (- v2 - sq) / v1;
                if(t < 1 && t > 0) verifyAndPush(this, t);
                t = (- v2 + sq) / v1;
                if(t < 1 && t > 0) verifyAndPush(this, t);
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
        getBrokenPoints_MaxH_Tangent : function(){
            var ts = [0, 1];
            
            if( this.hasNoHandle() ){
                return this.breakStraightLine();
            } else {
                this.getBrokenPointByTangent( ts );
                
                if(ts.length > 2){
                    var tsets = [];
                    this.ts2tsets( ts, tsets, this.p1, this.p2 );

                    while( tsets.length > 0 ){
                        var tset = tsets.shift();

                        var d = new Line().set( tset.p1, tset.p3 ).getDist( tset.p2 );
                        
                        if( d > _conf.max_error
                            || (_conf.max_dist_between_points > 0
                                && tset.p1.dist2(tset.p3) > _conf.max_dist_squared) ){
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
                    
                    var ts_tmp = [ts[0]];
                    for(var i = 1; i < ts.length; i++){
                        if(ts_tmp[ts_tmp.length - 1] != ts[i]){
                            ts_tmp.push(ts[i]);
                        }
                    }
                    ts = ts_tmp;
                }
            }
            
            var pnts = [];
            for(var i=0; i < ts.length; i++){
                pnts.push( new Point().setp( this.bezier( ts[i] )));
            }
            return pnts;
        },
        // ------------------------
        // break straight line (when _conf.max_dist_between_points specified)
        breakStraightLine : function(){
            var pnts = [this.p1];
            if(_conf.max_dist_between_points <= 0){
                pnts.push(this.p2);
            } else {
                var d = this.p1.dist(this.p2);
                var n = Math.ceil(d / _conf.max_dist_between_points);
                if(n > 1){
                    for(var i = n - 1; i >= 0; i--){
                        pnts.push( new Point().set((i * this.p1.x + (n-i) * this.p2.x)/n,
                                                (i * this.p1.y + (n-i) * this.p2.y)/n));
                    }
                } else {
                    pnts.push(this.p2);
                }
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
    function flattenMain( path ){
        // path: PathItem
        var p = path.pathPoints;
        var ancs = []; // anchor point
        var pnts = []; // Point
        
        for(var i=0; i < p.length; i++){
            var next_idx = parseIdx(p, i + 1);
            if( next_idx < 0 ) break;

            var cv = new Curve(path, i, next_idx);

            var tmp_pnts;
            if( _conf.divide_method == _conf.divide_method_tangent ){
                tmp_pnts = cv.getBrokenPoints_MaxH_Tangent();
            } else if( _conf.divide_method == _conf.divide_method_mid_t){
                tmp_pnts = cv.getBrokenPoints_MaxH_MidT();
            } else {  // "divide_t" or undefined
                tmp_pnts = cv.getBrokenPoints_MaxH_DivideT();
            }
        
            if( ! (! path.closed && next_idx == p.length-1)) tmp_pnts.pop();

            for(var j=0; j < tmp_pnts.length; j++){
                pnts.push( tmp_pnts[j] );
                ancs.push( tmp_pnts[j].toArray());
            }
        }
        if(_conf.output_to_file){
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
            if( items[i].locked || items[i].hidden ){
                continue;
            } else if( items[i].typename == "PathItem"){
                // ignore guides and clipping paths
                if ((pp_length_limit && items[i].pathPoints.length <= pp_length_limit)
                    ||  items[i].guides || items[i].clipping ){
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
        var afile = File.saveDialog(getMessage("output_title"), ext + " File:*." + ext);
        if(!afile){ // cancel
            return false;
        }
        if(!afile.open("w")){
            alertByLocale("output_error");
            return false;
        }
        afile.write(dat);
        afile.close();
        alertByLocale("output_saved");
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

    // --------------------------------------
    function getMessage(entry){
        var obj = _messages[entry];

        if(obj){
            return obj[_conf.locale] || obj["en"].toString();
        } else {
            return "undefined:[" + entry + "]";
        }
    }
    // ----
    function alertByLocale(entry){
        alert(_conf.script_name + ":\r" + getMessage(entry));
    }
    // ----
    function configureByLocale(){
        _conf.script_name            = getMessage("conf_script_name");
        _conf.divide_method_mid_t    = getMessage("conf_divide_method_mid_t");
        _conf.divide_method_divide_t = getMessage("conf_divide_method_divide_t");
        _conf.divide_method_tangent  = getMessage("conf_divide_method_tangent");
        _conf.default_divide_method  = getMessage("conf_default_divide_method");
    }

    // --------------------------------------
    // TEST functions
    // --------------------------------------
    function test_locale(){
        alert(_conf.locale);

        main();  // alert_select_paths
        setMaxError("xxx");
        setMaxDist(-1);

        alertByLocale("output_title");
        alertByLocale("output_error");
        alertByLocale("output_saved");

        var doc = app.documents.add();
        doc.activate();

        var circle = doc.pathItems.ellipse(200,10,100,100);
        circle.selected = true;
        redraw();
        main();  // dialog shown

        redraw();
        alert("end");
        doc.close(SaveOptions.DONOTSAVECHANGES);
    }
    // --------------------------------------
    function test_divide(){
        // path: PathItem
        // anchor, rdir, ldir : float[ x, y ]
        var addPathPoint = function(path, anchor, rdir, ldir){
            var ppoint = path.pathPoints.add();
            ppoint.anchor = anchor;
            ppoint.rightDirection = rdir;
            ppoint.leftDirection = ldir;
        }
        var addLine = function(){
            var line = doc.pathItems.add();
            line.closed = false;
            addPathPoint(line, [0,0], [50,10], [0,0]);
            addPathPoint(line, [200,0], [0,0], [150,-10]);
            redraw();
            return line;
        }
        // expected_result : number of anchor points
        var test_main = function(method, max_error, expected_result){
            _conf.divide_method = method;
            _conf.max_error = max_error;
            var line = addLine();
            line.selected = true;
            flatten(doc.selection);
            redraw();
            alert(method + "@" + max_error + ":"
                  + (line.pathPoints.length == expected_result ? "PASS" : "ERROR"));
            line.remove();
        }
        
        var doc = app.documents.add();
        doc.activate();

        _conf.max_dist_between_points = 0;
        _conf.max_dist_squared = _conf.max_dist_between_points
          * _conf.max_dist_between_points;
        
        test_main("divide_t", 2, 4);
        test_main("mid_t", 2, 5);
        test_main("tangent", 2, 4);
        
        test_main("divide_t", 4, 2);
        test_main("mid_t", 4, 2);
        test_main("tangent", 4, 2);

        alert("end");
        activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }
    
    //test_locale();
    //test_divide();
    main();
    
})();
