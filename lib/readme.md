illustrator-scripts : lib
======================

This folder contains JavaScript files which are included from other script files.

file extension
======================
There's a convention to use the file extension **.jsxinc** for JavaScript include files.
("
[JavaScript Tools Guide.pdf](https://www.adobe.com/content/dam/Adobe/en/devnet/scripting/pdfs/javascript_tools_guide.pdf)
" p.234)
So that the files don't appear in the menu of Illustrator.

Since the files in this folder aren't written by me, I didn't modify these at all including these filenames.  
You can change the file extension of these.  But make sure to change #include directive of the script that includes these.

include path
======================
In the older version of Illustrator, a folder under "Scripts" folder is not recognized as an include-path.
One of the solutions is to use HOME folder. ("C:\Users\(user name)" in Windows)
If you put "mylibrary.js" under "C:\Users\(user name)\lib", it is recognized with following directive.

```javascript
#include "~/lib/mylibrary.js"
```


Hiroyuki Sato  
[https://github.com/shspage](https://github.com/shspage)

----------------------
**Copyright Notice**

**perlin-noise-simplex.js**  
by Sean McCullough  
[https://gist.github.com/banksean/304522](https://gist.github.com/banksean/304522)


