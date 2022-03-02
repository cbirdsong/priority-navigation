/*
 * priority-nav - v1.0.15 | (c) 2022 | MIT license
 * Repository: https://github.com/gijsroge/priority-navigation.git
 * Description: Priority+ pattern navigation that hides menu items if they don't fit on screen.
 * Demo: http://gijsroge.github.io/priority-nav.js/
 */
(function (root, factory) {
	if (typeof define === "function" && define.amd) {
		define("priorityNav", factory(root));
	} else if (typeof exports === "object") {
		module.exports = factory(root);
	} else {
		root.priorityNav = factory(root);
	}
})(window || this, function (root) {
	"use strict";

	/**
	 * Variables
	 */
	var priorityNav = {}; // Object for public APIs
	var breaks = []; // Object to store instances with breakpoints where the instances menu item"s didin"t fit.
	var supports = !!document.querySelector && !!root.addEventListener; // Feature test
	var settings = {};
	var instance = 0;
	var count = 0;
	var mainNavWrapper, totalWidth, restWidth, mainNav, navDropdown, navDropdownToggle, dropDownWidth, toggleWrapper;
	var viewportWidth = 0;

	/**
	 * Default settings
	 * @type {{initClass: string, navDropdown: string, navDropdownToggle: string, mainNavWrapper: string, moved: Function, movedBack: Function}}
	 */
	var defaults = {
		initClass: "js-priorityNav", // Class that will be printed on html element to allow conditional css styling.
		mainNavWrapper: "nav", // mainnav wrapper selector (must be direct parent from mainNav)
		mainNav: "ul", // mainnav selector. (must be inline-block)
		navDropdownClassName: "", // additional class used for the dropdown.
		navDropdownToggleClassName: "", // additional class used for the dropdown toggle.
		navDropdownLabel: "More", // Text that is used for the dropdown toggle.
		navDropdownIcon: "", // SVG for before the breakPoint is reached.
		navDropdownBreakpointLabel: "Menu", //button label for navDropdownToggle when the breakPoint is reached.
		navDropdownBreakpointIcon: "", //SVG for when the breakPoint is reached.
		breakPoint: 500, //amount of pixels when all menu items should be moved to dropdown to simulate a mobile menu
		throttleDelay: 50, // this will throttle the calculating logic on resize because i'm a responsible dev.
		offsetPixels: 0, // increase to decrease the time it takes to move an item.
		count: true, // prints the amount of items are moved to the attribute data-count to style with css counter.

		//Callbacks
		moved: function () {},
		movedBack: function () {},
	};

	/**
	 * A simple forEach() implementation for Arrays, Objects and NodeLists
	 * @private
	 * @param {Array|Object|NodeList} collection Collection of items to iterate
	 * @param {Function} callback Callback function for each iteration
	 * @param {Array|Object|NodeList} scope Object/NodeList/Array that forEach is iterating over (aka `this`)
	 */
	var forEach = function (collection, callback, scope) {
		if (Object.prototype.toString.call(collection) === "[object Object]") {
			for (var prop in collection) {
				if (Object.prototype.hasOwnProperty.call(collection, prop)) {
					callback.call(scope, collection[prop], prop, collection);
				}
			}
		} else {
			for (var i = 0, len = collection.length; i < len; i++) {
				callback.call(scope, collection[i], i, collection);
			}
		}
	};

	/**
	 * Merge defaults with user options
	 * @private
	 * @param {Object} defaults Default settings
	 * @param {Object} options User options
	 * @returns {Object} Merged values of defaults and options
	 */
	var extend = function (defaults, options) {
		var extended = {};
		forEach(defaults, function (value, prop) {
			extended[prop] = defaults[prop];
		});
		forEach(options, function (value, prop) {
			extended[prop] = options[prop];
		});
		return extended;
	};

	/**
	 * Debounced resize to throttle execution
	 * @param func
	 * @param wait
	 * @param immediate
	 * @returns {Function}
	 */
	function debounce(func, wait, immediate) {
		var timeout;
		return function () {
			var context = this,
				args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	}

	/**
	 * Check if dropdown menu is already on page before creating it
	 * @param mainNavWrapper
	 */
	var prepareHtml = function (_this, settings) {
		/**
		 * Create dropdow menu
		 * @type {HTMLElement}
		 */
		toggleWrapper = document.createElement("span");
		navDropdown = document.createElement("ul");
		navDropdownToggle = document.createElement("button");

		/**
		 * Set label for dropdown toggle
		 * @type {string}
		 */

		var navDropdownToggleContent =
			'<span class="label">' + settings.navDropdownLabel + "</span>" + settings.navDropdownIcon;
		navDropdownToggle.innerHTML = navDropdownToggleContent;

		/**
		 * Set aria attributes for accessibility
		 */
		navDropdownToggle.setAttribute("aria-controls", "menu");
		navDropdownToggle.setAttribute("type", "button");
		navDropdown.setAttribute("aria-hidden", "true");

		/**
		 * Move elements to the right spot
		 */
		if (_this.querySelector(mainNav).parentNode !== _this) {
			console.warn("mainNav is not a direct child of mainNavWrapper, double check please");
			return;
		}

		// _this.insertAfter(toggleWrapper, _this.querySelector(mainNav));
		_this.insertAfter(toggleWrapper, _this.querySelector(mainNav));
		// toggleWrapper.appendChild(_this.querySelector(mainNav));

		// _this.insertAfter(toggleWrapper, _this.querySelector(secondaryNav));

		toggleWrapper.appendChild(navDropdownToggle);
		toggleWrapper.appendChild(navDropdown);

		/**
		 * Add classes so we can target elements
		 */
		navDropdown.classList.add(settings.navDropdownClassName);
		navDropdown.classList.add("priority-nav__dropdown");

		navDropdownToggle.classList.add(settings.navDropdownToggleClassName);
		navDropdownToggle.classList.add("priority-nav__dropdown-toggle");

		//fix so button is type="button" and do not submit forms
		navDropdownToggle.setAttribute("type", "button");

		toggleWrapper.classList.add(settings.navDropdownClassName + "-wrapper");
		toggleWrapper.classList.add("priority-nav__wrapper");

		_this.classList.add("priority-nav");
	};

	/**
	 * Get innerwidth without padding
	 * @param element
	 * @returns {number}
	 */
	var getElementContentWidth = function (element) {
		var styles = window.getComputedStyle(element);
		var padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);

		return element.clientWidth - padding;
	};

	/**
	 * Get viewport size
	 * @returns {{width: number, height: number}}
	 */
	var viewportSize = function () {
		var doc = document,
			w = window;
		var docEl = doc.compatMode && doc.compatMode === "CSS1Compat" ? doc.documentElement : doc.body;

		var width = docEl.clientWidth;
		var height = docEl.clientHeight;

		// mobile zoomed in?
		if (w.innerWidth && width > w.innerWidth) {
			width = w.innerWidth;
			height = w.innerHeight;
		}

		return { width: width, height: height };
	};

	/**
	 * Get width
	 * @param elem
	 * @returns {number}
	 */
	var calculateWidths = function (_this) {
		totalWidth = getElementContentWidth(_this);
		//Check if parent is the navwrapper before calculating its width
		if (_this.querySelector(navDropdown).parentNode === _this) {
			dropDownWidth = _this.querySelector(navDropdown).offsetWidth;
		} else {
			dropDownWidth = 0;
		}
		restWidth = getChildrenWidth(_this) + settings.offsetPixels;
		viewportWidth = viewportSize().width;
	};

	/**
	 * Move item to array
	 * @param item
	 */
	priorityNav.doesItFit = function (_this) {
		/**
		 * Check if it is the first run
		 */
		var delay = _this.getAttribute("instance") === 0 ? delay : settings.throttleDelay;

		/**
		 * Increase instance
		 */
		instance++;

		/**
		 * Debounced execution of the main logic
		 */
		debounce(function () {
			/**
			 * Get the current element"s instance
			 * @type {string}
			 */
			var identifier = _this.getAttribute("instance");

			/**
			 * Update width
			 */
			calculateWidths(_this);

			/**
			 * Keep executing until all menu items that are overflowing are moved
			 */
			while (
				(totalWidth <= restWidth && _this.querySelector(mainNav).children.length > 0) ||
				(viewportWidth < settings.breakPoint && _this.querySelector(mainNav).children.length > 0)
			) {
				//move item to dropdown
				priorityNav.toDropdown(_this, identifier);
				//recalculate widths
				calculateWidths(_this, identifier);
				//update dropdownToggle label
				if (viewportWidth < settings.breakPoint)
					updateLabel(_this, identifier, settings.navDropdownBreakpointLabel, settings.navDropdownBreakpointIcon);
			}

			/**
			 * Keep executing until all menu items that are able to move back are moved
			 */
			while (totalWidth >= breaks[identifier][breaks[identifier].length - 1] && viewportWidth > settings.breakPoint) {
				//move item to menu
				priorityNav.toMenu(_this, identifier);
				//update dropdownToggle label
				if (viewportWidth > settings.breakPoint)
					updateLabel(_this, identifier, settings.navDropdownLabel, settings.navDropdownIcon);
			}

			/**
			 * If there are no items in dropdown hide dropdown
			 */
			if (breaks[identifier].length < 1) {
				_this.querySelector(navDropdown).classList.remove("show");
				//show navDropdownLabel
				updateLabel(_this, identifier, settings.navDropdownLabel, settings.navDropdownIcon);
			}

			/**
			 * If there are no items in menu
			 */
			if (_this.querySelector(mainNav).children.length < 1) {
				//show navDropdownBreakpointLabel
				_this.classList.add("is-empty");
				_this.querySelector(navDropdown).classList.add("is-full");
				_this.querySelector(navDropdownToggle).classList.add("is-full");
				updateLabel(_this, identifier, settings.navDropdownBreakpointLabel, settings.navDropdownBreakpointIcon);
			} else {
				_this.classList.remove("is-empty");
				_this.querySelector(navDropdown).classList.remove("is-full");
				_this.querySelector(navDropdownToggle).classList.remove("is-full");
			}

			/**
			 * Check if we need to show toggle menu button
			 */
			showToggle(_this, identifier);
		}, delay)();
	};

	/**
	 * Show/hide toggle button
	 */
	var showToggle = function (_this, identifier) {
		if (breaks[identifier].length < 1) {
			_this.querySelector(navDropdownToggle).classList.add("priority-nav-is-hidden");
			_this.querySelector(navDropdownToggle).classList.remove("priority-nav-is-visible");
			_this.classList.remove("priority-nav-has-dropdown");

			/**
			 * Set aria attributes for accessibility
			 */
			_this.querySelector(".priority-nav__wrapper").setAttribute("aria-haspopup", "false");
		} else {
			_this.querySelector(navDropdownToggle).classList.add("priority-nav-is-visible");
			_this.querySelector(navDropdownToggle).classList.remove("priority-nav-is-hidden");
			_this.classList.add("priority-nav-has-dropdown");

			/**
			 * Set aria attributes for accessibility
			 */
			_this.querySelector(".priority-nav__wrapper").setAttribute("aria-haspopup", "true");
		}
	};

	/**
	 * Update count on dropdown toggle button
	 */
	var updateCount = function (_this, identifier) {
		_this.querySelector(navDropdownToggle).setAttribute("priorityNav-count", breaks[identifier].length);
	};

	var updateLabel = function (_this, identifier, label, icon) {
		_this.querySelector(navDropdownToggle).setAttribute("aria-label", label);
		// _this.querySelector(navDropdownToggle).innerHTML = label;
		_this.querySelector(navDropdownToggle).innerHTML = "<span class='label'>" + label + "</span>" + icon;
	};

	/**
	 * Move item to dropdown
	 */
	priorityNav.toDropdown = function (_this, identifier) {
		/**
		 * move last child of navigation menu to dropdown
		 */
		if (_this.querySelector(navDropdown).firstChild && _this.querySelector(mainNav).children.length > 0) {
			_this
				.querySelector(navDropdown)
				.insertBefore(_this.querySelector(mainNav).lastElementChild, _this.querySelector(navDropdown).firstChild);
		} else if (_this.querySelector(mainNav).children.length > 0) {
			_this.querySelector(navDropdown).appendChild(_this.querySelector(mainNav).lastElementChild);
		}

		/**
		 * store breakpoints
		 */
		breaks[identifier].push(restWidth);

		/**
		 * check if we need to show toggle menu button
		 */
		showToggle(_this, identifier);

		/**
		 * update count on dropdown toggle button
		 */
		if (_this.querySelector(mainNav).children.length > 0 && settings.count) {
			updateCount(_this, identifier);
		}

		/**
		 * If item has been moved to dropdown trigger the callback
		 */
		settings.moved();
	};

	/**
	 * Move item to menu
	 */
	priorityNav.toMenu = function (_this, identifier) {
		/**
		 * move last child of navigation menu to dropdown
		 */
		if (_this.querySelector(navDropdown).children.length > 0)
			_this.querySelector(mainNav).appendChild(_this.querySelector(navDropdown).firstElementChild);

		/**
		 * remove last breakpoint
		 */
		breaks[identifier].pop();

		/**
		 * Check if we need to show toggle menu button
		 */
		showToggle(_this, identifier);

		/**
		 * update count on dropdown toggle button
		 */
		if (_this.querySelector(mainNav).children.length > 0 && settings.count) {
			updateCount(_this, identifier);
		}

		/**
		 * If item has been moved back to the main menu trigger the callback
		 */
		settings.movedBack();
	};

	/**
	 * Count width of children and return the value
	 * @param e
	 */
	var getChildrenWidth = function (e) {
		var children = e.childNodes;
		var sum = 0;
		for (var i = 0; i < children.length; i++) {
			if (children[i].nodeType !== 3) {
				if (!isNaN(children[i].offsetWidth)) {
					sum += children[i].offsetWidth;
				}
			}
		}
		return sum;
	};

	/**
	 * Bind eventlisteners
	 */
	var listeners = function (_this, settings) {
		// Check if an item needs to move
		if (window.attachEvent) {
			window.attachEvent("onresize", function () {
				if (priorityNav.doesItFit) priorityNav.doesItFit(_this);
			});
		} else if (window.addEventListener) {
			window.addEventListener(
				"resize",
				function () {
					if (priorityNav.doesItFit) priorityNav.doesItFit(_this);
				},
				true
			);
		}

		// Toggle dropdown
		_this.querySelector(navDropdownToggle).addEventListener("click", function () {
			this.classList.toggle("is-open");
			_this.querySelector(navDropdown).classList.toggle("show");

			/**
			 * Toggle aria hidden for accessibility
			 */
			if (_this.querySelector(navDropdown).getAttribute("aria-hidden") == true) {
				_this.querySelector(navDropdown).setAttribute("aria-hidden", "false");
			} else {
				_this.querySelector(navDropdown).setAttribute("aria-hidden", "true");
				_this.querySelector(navDropdown).blur();
			}
		});

		/*
		 * Remove when clicked outside dropdown
		 */
		document.addEventListener("click", function (event) {
			if (!event.target.closest(".priority-nav__wrapper")) {
				_this.querySelector(navDropdown).classList.remove("show");
				_this.querySelector(navDropdownToggle).classList.remove("is-open");
				_this.classList.remove("is-open");
			}
		});

		/**
		 * Remove when escape key is pressed
		 */
		document.onkeydown = function (evt) {
			evt = evt || window.event;
			if (evt.keyCode === 27) {
				document.querySelector(navDropdown).classList.remove("show");
				document.querySelector(navDropdownToggle).classList.remove("is-open");
				_this.classList.remove("is-open");
			}
		};
	};

	/**
	 * Remove function
	 */
	Element.prototype.remove = function () {
		this.parentElement.removeChild(this);
	};

	/*global HTMLCollection */
	NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
		for (var i = 0, len = this.length; i < len; i++) {
			if (this[i] && this[i].parentElement) {
				this[i].parentElement.removeChild(this[i]);
			}
		}
	};

	/**
	 * Destroy the current initialization.
	 * @public
	 */
	priorityNav.destroy = function () {
		// If plugin isn"t already initialized, stop
		if (!settings) return;
		// Remove feedback class
		document.documentElement.classList.remove(settings.initClass);
		// Remove toggle
		toggleWrapper.remove();
		// Remove settings
		settings = null;
		delete priorityNav.init;
		delete priorityNav.doesItFit;
	};

	/**
	 * insertAfter function
	 * @param n
	 * @param r
	 */
	if (supports && typeof Node !== "undefined") {
		Node.prototype.insertAfter = function (n, r) {
			this.insertBefore(n, r.nextSibling);
		};
	}

	var checkForSymbols = function (string) {
		var firstChar = string.charAt(0);
		if (firstChar === "." || firstChar === "#") {
			return false;
		} else {
			return true;
		}
	};

	/**
	 * Initialize Plugin
	 * @public
	 * @param {Object} options User settings
	 */
	priorityNav.init = function (options) {
		/**
		 * Merge user options with defaults
		 * @type {Object}
		 */
		settings = extend(defaults, options || {});

		// Feature test.
		if (!supports && typeof Node === "undefined") {
			console.warn("This browser doesn't support priorityNav");
			return;
		}

		// Options check
		if (!checkForSymbols(settings.navDropdownClassName) || !checkForSymbols(settings.navDropdownToggleClassName)) {
			console.warn("No symbols allowed in navDropdownClassName & navDropdownToggleClassName. These are not selectors.");
			return;
		}

		/**
		 * Store nodes
		 * @type {NodeList}
		 */
		var elements = document.querySelectorAll(settings.mainNavWrapper);

		/**
		 * Loop over every instance and reference _this
		 */
		forEach(elements, function (_this) {
			/**
			 * Create breaks array
			 * @type {number}
			 */
			breaks[count] = [];

			/**
			 * Set the instance number as data attribute
			 */
			_this.setAttribute("instance", count++);

			/**
			 * Store the wrapper element
			 */
			mainNavWrapper = _this;
			if (!mainNavWrapper) {
				console.warn("couldn't find the specified mainNavWrapper element");
				return;
			}

			/**
			 * Store the menu elementStore the menu element
			 */
			mainNav = settings.mainNav;
			if (!_this.querySelector(mainNav)) {
				console.warn("couldn't find the specified mainNav element");
				return;
			}

			/**
			 * Check if we need to create the dropdown elements
			 */
			prepareHtml(_this, settings);

			/**
			 * Store the dropdown element
			 */
			navDropdown = "." + settings.navDropdownClassName;
			if (!_this.querySelector(navDropdown)) {
				console.warn("couldn't find the specified navDropdown element");
				return;
			}

			/**
			 * Store the dropdown toggle element
			 */
			navDropdownToggle = "." + settings.navDropdownToggleClassName;
			if (!_this.querySelector(navDropdownToggle)) {
				console.warn("couldn't find the specified navDropdownToggle element");
				return;
			}

			/**
			 * Event listeners
			 */
			listeners(_this, settings);

			/**
			 * Start first check
			 */
			priorityNav.doesItFit(_this);
		});

		/**
		 * Count amount of instances
		 */
		instance++;

		/**
		 * Add class to HTML element to activate conditional CSS
		 */
		document.documentElement.classList.add(settings.initClass);
	};

	/**
	 * Public APIs
	 */
	return priorityNav;
});
