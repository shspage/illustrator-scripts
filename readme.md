illustrator-scripts
======================
JavaScript scripts for Adobe Illustrator CSx.  
test environment: Adobe Illustrator CC (Windows)

**Use Download button (on the right side of this page) to download ZIP file.**  
**If you use right click on each file to save, you'll get an HTML file.**

batchTextEdit.jsx
======================
This script is for editing the contents of the text frames all together.

**Usage:**

1. Select the text object(s) and run this script.  (Other kind of objects in the selection are ignored.)  
2. Edit the contents in the dialog. Then hit OK button.  
![desc_batchTextEdit](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_batchTextEdit.png)

**Notice:**

  - The attribute of the first character is applied to whole contents of textframe if you run this script for it.  It is assumed that each contents is plain text.

  - For the multiline contents, the return code characters are replaced to the alternative ones (default:"@/") in the dialog.  When applying the edited contents, they are replaced to the return code. This means you can't use "@/" itself in the contents.  You can change it in the setting part of the script.

  - The order of the texts in the dialog depends on the rectangle area surrounding each top-left corner of the selected textframes.  If the width of the area is greater than the height of it, the order is from left to right. Otherwise from top to bottom.

breakDashes.jsx
======================
breaks each dashed line in the selection into its components.  
You can also use "Object > Path > Outline" to break them.  
Though in this case, it results outlined (filled) paths.

**Notice:**

To make the corners and the ends neat, this script adjusts interval of dashes with its own algorithm. Because Illustrator's native dashes adjustment feature is out of control from JavaScript. So the result can differ from the original. (like the following image)

![desc_breakDashes](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_breakdashes1.png)

dupAlongThePath.jsx
======================
duplicates the foreground selected object on the rest of selected paths with specified interval.
Optionally you can apply random scaling to each of the duplicated object.  
![desc_dupalongthepath](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_dupalongthepath.png)

**Notice:**

Smaller interval value causes longer calculation time.

grass.jsx
======================
for growing grasses on the selected paths.
See the description image for the optional values.  
![desc_grass](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_grass.png)

**Notice:**

Smaller width value causes longer calculation time.

handleGlue.jsx
======================
![desc_handleglue1](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_handleglue1a.png)  

Function : Moves the selected end points of the foreground open
path to the nearest point on the other selected paths. This process
includes adjustments of tangency of the handles.  

How To Use : Select paths (anchor points to move and the segments
to move them to) and run this script.  

You can set optional values by editing the script.  (No UI for now.  This is a script written for creative cloud extension.)  

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


inscribedCircle.jsx
======================
This script tries drawing an inscribed circle for each selected path.  
Usage: select paths and run this script.  
![desc_inscribedCircle](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_inscribedCircle.png)

**Notice:**

This one simply uses an intersection point of two bisectors of angles to determine the center of the circle. 
It's not always an inscribed circle for the shape.

newLayer(&L).jsx
======================
This script adds a new layer that has custom selection mark color above the active layer.  
![desc_newLayer](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_newlayer.png)

(&L) in the filename is for the Alt key shortcut in Windows.  
You can run the script by Alt-F->R->L.

noiseFill.jsx
======================
changes the colors of the selected paths using Perlin noise.  
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
draws sewing notches along the selected segments.  
Usage: Select the segments of paths and run this script.  
![desc_notch](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_notch.png)

**Note:**

Every set of notches are grouped.  
Every notch line has an anchor on the center of it.  So you can delete half of them easily.

ovalize.jsx
======================
for turning every selected path into an oval which fits the width and the height of the path.  
If the width and the height are equal, it turns into a circle.

You can specify the number of the anchor points before the script modifies the paths.  
![desc_ovalize](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_Ovalize.png)

You can use this script in the case if you want to draw a circle or an oval which has the number of the anchor points other than four.  
Draw a circle with the ellipse tool, select it, run this script, input the number and you are done.

Please notice the case 3 of the above image. This is a feature for now.

smoothing.jsx (Catmull-Rom spline)
======================
applys smoothing to selected pathPoints on selected polygon paths using the Catmull-Rom spline.  
you can adjust the tension with a slider.  
![desc_smoothing](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_smoothing.png)

USAGE : Select anchors to smooth or whole paths and run this script.  Adjust "tension" in the dialog.  then click OK.

reference : Catmull-Rom to Bezier conversion. [https://pomax.github.io/bezierinfo/#catmullconv](https://pomax.github.io/bezierinfo/#catmullconv)

softgel.jsx
======================
When you want to create softgel capsule like shapes, this script may help you.  
![desc_ovalize](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_softgel.png)

USAGE : Draw circles and select them, then run this script.  Adjust options in the dialog.  then click OK.
(This script doesn't check whether each path is really a circle.)

Note : Combining the shapes using Pathfinder may results several overlapping anchor points on the path.  if it occurs, it may help to solve it to use my another script "[Merge Overlapped Anchors.js](http://park12.wakwak.com/~shp/lc/et/en_aics_script.html "Scripts for Adobe Illustrator (10 - CC) (JavaScript)")".  This script merges overlapping anchors on the path.


----------------------
Copyright(c) 2013-2014 Hiroyuki Sato  
[https://github.com/shspage](https://github.com/shspage)  
This script is distributed under the MIT License.  
See the LICENSE file for details.  
