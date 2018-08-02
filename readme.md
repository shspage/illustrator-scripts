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


flatten.jsx
======================
converts curved lines into polygonal lines. <!-- (formerly named "brokenCurve.jsx") -->

![desc_flatten_3](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_flatten_3.png)  

![desc_flatten_1](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_flatten_2.png)  

Basically, whether it adds a point on a curve or not is determined by the distance from a point on the curve to the line between the anchor points. ( **fig.a** )  
"**max error**" in the dialog means this distance.  
![desc_flatten_2](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_brokencurve_a.png)  

You can specify the method to do it by selecting the radio button.
* **mid_t** :
If the distance between the midpoint P of a Bezier curve (according to Bezier curve's parameter (t = 0.5)) and a straight line connecting its two anchors is greater than specified value, the point P is added on the curve to divide it. Then these two curves are verified again.
* **divide_t** : (default)
It divides the curve between the anchors equally by parameters and verifies the error for each of the divided curves using the midpoint that based on the parameter of the Bezier curve. If there is a curve whose error is larger than the specified value, it increases the number of divisions by one and verifies again.
* **tangent** :
If the distance between the straight line connecting the anchors and the point P which is the farthest point among the points where the straight line with the same slope is in contact with the curve between the anchors is more than the specified value, the point P  is added on the curve to divide it. Then these two curves are verified again.

The red point in **fig.b** is by "tangent", and blue one is by "mid_t".  

If "**max distance between 2 points**" is greater than 0, anchor points are generated on each segment including straight line according to this setting.  Set 0 to ignore this setting.

If "**output to file**" is checked, saves the coordinates data of flattened paths to a file **without** doing actual flattening.

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
This script changes the colors of the selected paths using Perlin (Simplex) noise.  
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

noiseRotate.jsx
======================
This script changes the angle of the selected page items using Perlin (Simplex) noise.  
The same include script as above required.  

noiseScale.jsx
======================
This script changes the size of the selected page items using Perlin (Simplex) noise.  
The same include script as above required.  
![desc_noiseScale](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_noiseScale.png)



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
