illustrator-scripts
======================
JavaScript scripts for Adobe Illustrator CSx.  
test environment: Adobe Illustrator CS3, CS6 (Windows)

batchTextEdit.jsx
======================
for editing the contents of the text frames all together.

**Usage:**

1. Select the text object(s) and run this script.  (Other kind of objects in the selection are ignored.)  
2. Edit the contents in the dialog. Then hit OK button.  
![desc_batchTextEdit](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_batchTextEdit.png)

**Notice:**

  - The attribute of the first character is applied to whole contents of textframe if you run this script for it.  It is assumed that each contents is plain text.

  - For the multiline contents, the return code characters are replaced to the alternative ones (default:"@/") in the dialog.  When applying the edited contents, they are replaced to the return code. This means you can't use "@/" itself in the contents.  You can change it in the setting part of the script.

  - The order of the texts in the dialog depends on the rectangle area surrounding each top-left corner of the selected textframes.  If the width of the area is greater than the height of it, the order is from left to right. Otherwise from top to bottom.

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

inscribedCircle.jsx
======================
This script tries drawing an inscribed circle for each selected path.  
Usage: select paths and run this script.  
![desc_inscribedCircle](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_inscribedCircle.png)

**Notice:**

This one simply uses an intersection point of two bisectors of angles to determine the center of the circle. 
It's not always an inscribed circle for the shape.

ovalize.jsx
======================
for turning every selected path into an oval which fits the width and the height of the path.  
If the width and the height are equal, it turns into a circle.

You can specify the number of the anchor points before the script modifies the paths.  
![desc_ovalize](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_Ovalize.png)

You can use this script in the case if you want to draw a circle or an oval which has the number of the anchor points other than four.  
Draw a circle with the ellipse tool, select it, run this script, input the number and you are done.

Please notice the case 3 of the above image. This is a feature for now.

----------------------
Copyright(c) 2013 Hiroyuki Sato  
[https://github.com/shspage](https://github.com/shspage)  
This script is distributed under the MIT License.  
See the LICENSE file for details.  
