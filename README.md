# PriorityNavigation.js

PriorityNav is a pure javascript plugin that will move your menu items if they don't fit its parent. Forked from [gijsroge/priority-navigation](https://github.com/gijsroge/priority-navigation) by [GijsRoge](http://twitter.com/GijsRoge).

### Features

- **Accessible**<br>Adds appropriate aria attributes and set focus to links when needed.
- **No dependencies**<br>The plugin is written in pure javascript making it fast and lean.
- **Icons**<br>Adds SVG icons if supplied.
- **Breakpoint**<br>When the breakpoint has been reached the plugin will automaticly move all items to the dropdown, change the toggle label to navDropdownBreakpointLabel and change the icon to navDropdownBreakpointIcon.
- **Smart calculation of available space**<br>It automatically looks for the main navigation's siblings and calculates remaining space.
- **Flexible**<br>Because of the point above you can have multiple inline-block/flexbox items on the same level.
- **Non obstructive menu dropdown**<br>The dropdown menu can be closed by clicking outside and pressing escape.
- **Callbacks**<br>Callbacks are fired when an item is moved or moved back from the main navigation.

### Usage

Load plugin files:

```html
<!DOCTYPE html>
<head>
	<link rel="stylesheet" href="priority-nav-core.css" />
</head>

<body>
	<script async src="priority-nav.js"></script>
</body>
```

Call plugin without any options.

```js
var nav = priorityNav.init();
```

Ideal html structure

```html
<nav>
	<ul>
		<- needs to be inline-block
		<li>menu item</li>
		<li>menu item</li>
		<li>menu item</li>
		<li>menu item</li>
	</ul>
</nav>
```

### Options

```js
initClass:                  "js-priorityNav", // Class that will be printed on html element to allow conditional css styling.
mainNavWrapper:             "nav", // mainnav wrapper selector (must be direct parent from mainNav)
mainNav:                    "ul", // mainnav selector. (must be inline-block)
navDropdownClassName:       "", // class used for the dropdown - this is a class name, not a selector.
navDropdownToggleClassName: "", // class used for the dropdown toggle - this is a class name, not a selector.
navDropdownLabel:           "More", // Text that is used for the dropdown toggle.
navDropdownIcon:            "", // SVG for the dropdown toggle before the breakPoint is reached. Ex: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>'
navDropdownBreakpointLabel: "Menu", //button label for navDropdownToggle when the breakPoint is reached.
navDropdownBreakpointIcon: "", //SVG for navDropdownToggle when the breakPoint is reached. Ex: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>'
breakPoint:                 500, //amount of pixels when all menu items should be moved to dropdown to simulate a mobile menu
throttleDelay:              50, // this will throttle the calculating logic on resize because i'm a responsible dev.
offsetPixels:               0, // increase to decrease the time it takes to move an item.
count:                      true, // prints the amount of items are moved to the attribute data-count to style with css counter.

//Callbacks
moved: function () {}, // executed when item is moved to dropdown
movedBack: function () {} // executed when item is moved back to main menu
```

<!--
### Package managers

- **npm:** `npm install --save priority-nav`
- **bower:** `bower install priority-nav.js`
 -->

### Building the source files

```
#cloning repository
git clone https://github.com/gijsroge/priority-navigation.git
cd priority-navigation

#dependencies
npm install

#build files to dist folder
grunt build
```

### IE9 Support

To support Internet Explorer 9 and lower [classList.js](https://github.com/remy/polyfills/blob/master/classList.js/) must be added your page.

```html
<!--[if lt IE 9
	]><script src="https://cdnjs.cloudflare.com/ajax/libs/classlist/2014.01.31/classList.min.js"></script
><![endif]-->
```

### IE8 Support

To support Internet Explorer 8, [es5-shim](https://github.com/kriskowal/es5-shim/) and classList.js from above must be added your page.

```html
<!--[if lt IE 9
	]><script src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/2.0.8/es5-shim.min.js"></script
><![endif]-->
```

### Alternatives

- https://github.com/lewie6/ng-priority-nav (angular)
- https://github.com/matthornsby/priority-navigation (jQuery)
- https://github.com/352Media/flexMenu (jQuery)
- https://github.com/VPenkov/okayNav (jQuery)
- https://github.com/VPenkov/okayNav-vanillaJS (no dependencies)
- https://github.com/skywalkapps/nav-priority (no dependencies)
