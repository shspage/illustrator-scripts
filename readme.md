illustrator-scripts
======================
JavaScript scripts for Adobe Illustrator CS, CC.  
test environment: Adobe Illustrator CC (Windows)

**To download these scripts, please use Download button to get a ZIP archive.
The button is on the upper right part of this page.
If you use right-click on each file to save, you'll get an HTML file.**

batchTextEdit.jsx
======================
This script is for editing contents of text frames all together.

**Usage:**

1. Select text object(s) and run this script.  (Other kind of objects in the selection are ignored.)  
2. Edit contents in a dialog. Then hit OK button.  
![desc_batchTextEdit](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_batchTextEdit.png)

**Notice:**

  - The attribute of the first character is applied to whole contents of textframe.  It is assumed that each contents is a plain text.

  - For multiline contents, newline characters are replaced to alternative ones (default:"@/") in a dialog.  When applying edited contents, they are replaced to newline characters. This means you can't use "@/" itself in the contents.  You can change it in the setting part of the script.

  - The order of the texts in the dialog depends on a rectangle area surrounding each top-left corner of the selected textframes.  If the width of the area is greater than the height of it, the order is from left to right. Otherwise from top to bottom.

**HTML5 Extension version:**

[@dumbm1](https://github.com/dumbm1)
created an HTML extension out of this script.
The function is basically the same, but since it is based on HTML, it has flexibility in font, color and other properties of the dialog.  
His BitBucket repository of this extension is
[HERE](https://bitbucket.org/dumbm1/batch_text_edit)
.

breakDashes.jsx
======================
This script breaks each dashed line in the selection into its components.  
You can also use "Object > Path > Outline" to break them.  
Though in this case, it results outlined (filled) paths.

**Notice:**

To make the corners and the ends neat, this script adjusts interval of dashes with its own algorithm. Because Illustrator's native dashes adjustment feature is out of control from JavaScript. So the result can differ from the original. (like the following image)

![desc_breakDashes](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_breakdashes1.png)


flapClose.jsx
======================
![desc_flapclose_1](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_flapclose_1.png)

For the selected open paths, this script rotates the part from the first selected anchor to the start point and the part from the last selected anchor to the end point so that the start point and the end point to be matched.

The shape of the part to be rotated does not change.
For this reason, if end points can not be matched even if rotated, a message will be displayed and processing will not be executed.

But, choosing a specific anchor is a tedious task, isn't it? So I have implemented a special behavior. When the anchor of the start point is selected, it is assumed that the second anchor from the start point is selected.  The same is true if the end point is selected.  
![desc_flapclose_2](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_flapclose_2.png)

**SETTINGS**  
If "close_path" is set to **true** in the config section at the beginning of the script, the path whose end point is matched is turned into a closed path.

**NOTE**  
Paths with less than four anchors in the selection are ignored.


handleGlue.jsx
======================
![desc_handleglue1](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_handleglue1a.png)  

Function : Moves the selected end points of the foreground open
path to the nearest point on the other selected paths. This process
includes adjustments of tangency of handles.  

How To Use : Select paths (anchor points to move and segments to move
them to) and run this script.  

![desc_handleglue2](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_handleglue2a.png)  

mode "nearest" : moves the selected end points of the foreground
open path(s) to its anchor point's nearest point on the other
selected segments.  The handle is rotated to the tangent's angle
at the point.  

mode "angle" : moves the selected end point of the foreground
open path(s) to its inner handle's nearest tangent point on
the other selected paths.  If the segment is straight, (and
if the handle of selected point is parallel to it), selected
end point is moved to its nearest point on it.  

"multi" : If true, it moves all the open path in the selection.
Otherwise, it moves only the foreground open path.  If true and
all the selected paths are open path, the last (most background)
path is treated as "the other path".  

"add anchor" : If true, it adds an anchor point at the point
on the path that the selected anchor moved to.  


noiseFill.jsx
======================
This script changes the colors of the selected paths using Perlin noise.  
![desc_noiseFill](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_noisefill2.png)

Usage: Select filled paths and run this script.  
(The objects other than filled paths in the selection are ignored.)  
The pattern of the noise is varied every time you turn the preview checkbox on.

**Notice:**

This script requires "perlin-noise-simplex.js" by Sean McCullough. (included in this repository)
[https://gist.github.com/banksean/304522](https://gist.github.com/banksean/304522)  


```javascript
//@include "lib/perlin-noise-simplex.js"
```

This directive on the first line in the script assumes "perlin-noise-simplex.js" is
placed under "lib" folder under "Scripts" folder of Adobe Illlustrator.  
If you use the older version of Illustrator, you may need to modify this line.  See inside "lib" folder for details.

notches.jsx
======================
This script draws sewing notches along the selected segments.  
Usage: Select the segments of paths and run this script.  
![desc_notch](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_notch.png)

**Note:**

Every set of notches are grouped.  
Every notch line has an anchor on the center of it.  So you can delete half of them easily.

softgel.jsx
======================
When you want to create a shape like a softgel capsule, this script may help you.  
![desc_ovalize](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_softgel.png)

USAGE : Draw circles and select them, then run this script.  Adjust options in the dialog.  then click OK.
(This script doesn't check whether each path is really a circle.)

Note : Combining the shapes using Pathfinder may results several overlapping anchor points on the path.  if it occurs, it may help to solve it to use my another script "[Merge Overlapped Anchors.js](http://park12.wakwak.com/~shp/lc/et/en_aics_script.html "Scripts for Adobe Illustrator (10 - CC) (JavaScript)")".  This script merges overlapping anchors on the path.

etc/
======================
I put the rest of scripts into "
[etc](https://github.com/shspage/illustrator-scripts/tree/master/etc)
" folder.


----------------------
Copyright(c) 2013-2014 Hiroyuki Sato  
[https://github.com/shspage](https://github.com/shspage)  
This script is distributed under the MIT License.  
See the LICENSE file for details.  
