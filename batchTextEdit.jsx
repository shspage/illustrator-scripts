// batchTextEdit.jsx
// adobe Illustrator CSx script
// for editing the contents of the text frames all together.
//
// Usage:
// 1. Select the textframe(s) and run this script.
// 2. Edit the contents in the dialog. Then hit OK button.
//
// Notice:
// * The attribute of the first character is applied to whole
//   contents of textframe if you run this script for it.
//   It is assumed that each contents is plain text.
// 
// * For the multiline contents, the return code characters are
//   replaced to the alternative ones (default:"@/") in the dialog.
//   When applying the edited contents, they are replaced to
//   the return code. This means you can't use "@/" itself in the
//   contents. You can change it in the setting part of the script.
//
// * The order of the texts in the dialog depends on the rectangle
//   area surrounding each top-left corner of the selected textframes.
//   If the width of the area is greater than the height of it, the
//   order is from left to right. Otherwise from top to bottom.

// test env: Adobe Illustrator CS3, CS6 (Windows)

// 2018.07.20, modified to ignore locked/hidden objects in a selected group

// Copyright(c) 2013 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

main();
function main(){
	// - settings -------------
	// return code alternative character(s) used while editting
	const return_code_alt = "@/";

	// return code that used in regexp (escape the characters if it needs)
	const return_code_alt_for_rex = return_code_alt;

	// edittext size
	const edittext_width = 200;
	const edittext_height = 200;

	// - settings end -------------
	// ----------------------------
	if( app.documents.length < 1 ) return;

	// get textframes in the selection
	var tfs = []; // textframes
	extractTextFramesAsVTextFrameItem( app.activeDocument.selection, tfs );
	if( tfs.length < 1 ){
		alert( "Please select textframes" );
		return;
	}

	// sort tfs
	sortVTextFramesReasonableByPosition( tfs );

	// get the contents of tfs
	var conts = [];
	var rex_return_code = new RegExp("\r", "g");
	for( var i=0; i < tfs.length; i++ ){
		conts.push( tfs[i].tf.contents.replace(
			rex_return_code, return_code_alt));
	}

	// show a dialog
	var win = new Window("dialog", "batchTextEdit");

	// add edittext
	var et_opt = { multiline:true, scrolling:true };
	var ver16 = ( app.version.substr(0, 2) > "15");
	if( ver16 ) et_opt.wantReturn = true;

	var et = win.add("edittext",[0, 0, edittext_width, edittext_height], "", et_opt);
	et.text = conts.join("\n");
	//et.active = true;

	// add statictext
	var st_text = "* \"" + return_code_alt + "\" means a return code";
	win.add("statictext", undefined, st_text, { multiline:false });
    
	if( !ver16 ){
		var st_text1 = "* Use ctrl+enter for new line";
		win.add("statictext", undefined, st_text1, { multiline:false });
	}

	// add buttons
	var gr = win.add("group");
	var btn_ok = gr.add("button", undefined, "OK");
	var btn_cancel = gr.add("button", undefined, "Cancel");
	btn_ok.onClick = function(){ 
		replaceContents( tfs, et.text.split("\n"),
		  new RegExp(return_code_alt_for_rex, "g") );
		win.close()
		};
	
	win.show();
}
// --------------------------------------------------
function vTextFrameItem( tf ){
	// virtual textframe for comparing the each position
	this.tf = tf;
	if( tf.kind == TextType.POINTTEXT ){
		this.left = tf.left;
		this.top = tf.top;
	} else {
		var tp = tf.textPath;
		this.left = tp.left;
		this.top = tp.top;
	}
}
// --------------------------------------------------
function replaceContents( tfs, et_texts, rex_return_code_alt ){
	while( et_texts[ et_texts.length - 1 ] == "" ) et_texts.pop();

	for( var i=0; i < tfs.length; i++ ){
		if( i >= et_texts.length ) break;

		tfs[i].tf.contents
		 = et_texts[i].replace(rex_return_code_alt, "\r");
	}
}
// --------------------------------------------------
function sortVTextFramesReasonableByPosition( tfs ){
	var rect = [];
	// reft, top, right, bottom
	getVTextFramesRect(tfs, rect);

	if(rect[1] - rect[3] < rect[2] - rect[0]){ // height < width
		// left -> right || top -> bottom
		tfs.sort(function(a, b){
			return a.left == b.left
			  ? b.top - a.top
			  : a.left - b.left
		});
	} else {
		// top -> down || left -> right
		tfs.sort(function(a, b){
			return a.top == b.top
			  ? a.left - b.left
			  : b.top - a.top
		});
	}
}
// --------------------------------------------------
function getVTextFramesRect( tfs, rect ){
	// get the rect that includes each top-left corner of tfs
	var top, left;

	for( var i=0; i < tfs.length; i++){
		top = tfs[i].top;
		left = tfs[i].left;

		if(i == 0){
			// reft, top, right, bottom
			rect.push(left);
			rect.push(top);
			rect.push(left);
			rect.push(top);
		} else {
			rect[0] = Math.min(rect[0], left);
			rect[1] = Math.max(rect[1], top);
			rect[2] = Math.max(rect[2], left);
			rect[3] = Math.min(rect[3], top);
		}
	}
}
// --------------------------------------------------
function extractTextFramesAsVTextFrameItem(s, r){
	// s is an array of pageitems ( ex. selection )
	for( var i=0; i < s.length; i++ ){
		if( s[i].locked || s[i].hidden){
			continue;
		} else if( s[i].typename == "TextFrame" ){
			r.push( new vTextFrameItem(s[i]) );
		} else if( s[i].typename == "GroupItem" ){
			extractTextFramesAsVTextFrameItem(s[i].pageItems, r);
		}
	}
}

