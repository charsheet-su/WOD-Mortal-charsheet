# WOD-Mortal-charsheet

[![Build Status](https://travis-ci.org/jehy/WOD-Mortal-charsheet.svg?branch=master)](https://travis-ci.org/jehy/WOD-Mortal-charsheet)

It is the first character sheet, created for [Charsheet.su](http://charsheet.su).   
It is based on wonderful [Mr Gone's characters heets](http://mrgone.rocksolidshells.com/) 
 so credit for design goes to him.

##What I used for this character sheet:

- JQuery   
- Bootstrap 3   
- [X-editable](https://vitalets.github.io/x-editable/)   
- [Jquery bar rating](http://antenna.io/demo/jquery-bar-rating/examples/)

Latest version is built using Node.js, gulp, broserify and babel - if you don`t know
Node.js, you can make your own sheet in simple HTML, CSS and JS.

Version of this sheet without node.js can be found 
[here](https://github.com/jehy/WOD-Mortal-charsheet/tree/feature/no-node).
You are free to fork this repository, make pull requests and
make new character sheets - of cause, those will be added to web site.

##Contents of the project:
* `/src` contains source code and css of th project
* `/lib` contains built and minified version of code (after you build it)

Contents of `/src`:
* `css`
  * `x-editable` - X-editable css without any modifications.
  * `custom` - CSS files for this character sheet.
    * `charlist.css` - global css.
    * `dots.css` - css for displaying dots. Suddenly, yeah?
    * `list1.css`, `list2.css`, etc - css, grouped by the number of the list.
    * `print.css` - special styles for printing - hide elements, make font smaller, etc.
* `fonts`, `img` - self described folders.
* `data` - folder for json files which contain data for this sheet -
 for example, list of traits, attributes or skills.
* `js` - different javascript.
  * `images.js` - used for handling images - uploading, removing.
  * `jquery.barrating.js` - JQuery bar rating, modified for printing.
  * `mode.js` - used to switch from print mode to edit mode.
  * `x-editable` - X-editable js without any modifications.
  * `index.js` - combines all js above.
  
Of cause, for saving and loading your character sheet data you will need
 to publish your repository on [Charsheet.su](http://charsheet.su)
and use it's api - but you will be able to develop anything without it.

##Getting started:

1. Clone \ Fork a project
2. Run `npm run build-dev` to build JS and CSS
3. Edit!

##Code quality

Please use ESLint with configuaration in `.eslintrc.json`.

##FAQ:    

Q: Why do you use images instead of backgrounds?   
A: Because otherwise browsers don't allow to print background.   
