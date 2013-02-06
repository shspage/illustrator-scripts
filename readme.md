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

brokenCurve.jsx
======================
converts curved lines into broken lines.

![desc_brokencurve](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_brokencurve.png)  
(This script doesn't draw the tiny circles like above image. I added them for the description.)

Basically, whether it adds a point on a curve or not is determined by the distance from a candidate point to the line between the anchor points. ( **fig.a** )  
The option **"max_height"** specifies this distance.

![desc_brokencurve_a](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_brokencurve_a.png)  

This scripts includes two methods for this.  
First is "tangent". In this method, the candidate point is set as the tangent point of the line parallel to the line between the anchor points.  
Second is "mid_t". The candidate point is set by parameter of bezier curve t=0.5. It's simple, but the result is a bit rough.

The red point in **fig.b** is by "tangent", and blue one is by "mid_t".  
The default setting is "tangent".

grass.jsx
======================
for growing grasses on the selected paths.
See the description image for the optional values.  
![desc_grass](https://github.com/shspage/illustrator-scripts/raw/master/image/desc_grass.png)

**Notice:**

Smaller width value causes longer calculation time.

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
