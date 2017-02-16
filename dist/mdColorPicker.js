/**
 * piquinikis-color-picker - Angular-Material inspired color picker.
 * @version v0.2.7
 * @link https://github.com/brianpkelley/md-color-picker
 * @license MIT
 */
;(function(window, angular, TinyColor, undefined) {
"use strict";

(function( window, angular, undefined ) {
'use strict';

var dateClick;


var canvasTypes = {
	hue: {
		getColorByPoint: function( x, y ) {
			var imageData = this.getImageData( x, y );
			this.setMarkerCenter( y );

			var hsl = new tinycolor( {r: imageData[0], g: imageData[1], b: imageData[2] } );
			return hsl.toHsl().h;
		},
		draw: function()  {
			this.$element.css({'height': this.height + 'px'});

			this.canvas.height = this.height;
			this.canvas.width = this.height;

			// Create gradient
			var hueGrd = this.context.createLinearGradient(90, 0.000, 90, this.height);

			// Add colors
			hueGrd.addColorStop(0.01,	'rgba(255, 0, 0, 1.000)');
			hueGrd.addColorStop(0.167, 	'rgba(255, 0, 255, 1.000)');
			hueGrd.addColorStop(0.333, 	'rgba(0, 0, 255, 1.000)');
			hueGrd.addColorStop(0.500, 	'rgba(0, 255, 255, 1.000)');
			hueGrd.addColorStop(0.666, 	'rgba(0, 255, 0, 1.000)');
			hueGrd.addColorStop(0.828, 	'rgba(255, 255, 0, 1.000)');
			hueGrd.addColorStop(0.999, 	'rgba(255, 0, 0, 1.000)');

			// Fill with gradient
			this.context.fillStyle = hueGrd;
			this.context.fillRect( 0, 0, this.canvas.width, this.height );
		}
	},
	alpha: {
		getColorByPoint: function( x, y ) {
			var imageData = this.getImageData( x, y );
			this.setMarkerCenter( y );

			return imageData[3] / 255;
		},
		draw: function ()  {
			this.$element.css({'height': this.height + 'px'});

			this.canvas.height = this.height;
			this.canvas.width = this.height;

			// Create gradient
			var hueGrd = this.context.createLinearGradient(90, 0.000, 90, this.height);

			// Add colors
			hueGrd.addColorStop(0.01,	'rgba(' + this.currentColor.r + ',' + this.currentColor.g + ',' + this.currentColor.b + ', 1.000)');
			hueGrd.addColorStop(0.99,	'rgba(' + this.currentColor.r + ',' + this.currentColor.g + ',' + this.currentColor.b + ', 0.000)');

			// Fill with gradient
			this.context.fillStyle = hueGrd;
			this.context.fillRect( -1, -1, this.canvas.width+2, this.height+2 );
		},
		extra: function() {
			this.$scope.$on('mdColorPicker:spectrumColorChange', angular.bind( this, function( e, args ) {
				this.currentColor = args.color;
				this.draw();
			}));
		}
	},
	spectrum: {
		getColorByPoint: function( x, y ) {

			var imageData = this.getImageData( x, y );
		 	this.setMarkerCenter(x,y);

			return {
				r: imageData[0],
				g: imageData[1],
				b: imageData[2]
			};
		},
		draw: function() {
			this.canvas.height = this.height;
			this.canvas.width = this.height;
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

			// Odd bug prevented selecting min, max ranges from all gradients.
			// Start at 0.01, end at 0.99 and stretch it to 1px larger in each direction

			// White gradient
			var whiteGrd = this.context.createLinearGradient(0, 0, this.canvas.width, 0);


			whiteGrd.addColorStop(0.01, 'rgba(255, 255, 255, 1.000)');
			whiteGrd.addColorStop(0.99, 'rgba(255, 255, 255, 0.000)');

			// Black Gradient
			var blackGrd = this.context.createLinearGradient(0, 0, 0, this.canvas.height);


			blackGrd.addColorStop(0.01, 'rgba(0, 0, 0, 0.000)');
			blackGrd.addColorStop(0.99, 'rgba(0, 0, 0, 1.000)');

			// Fill with solid
			this.context.fillStyle = 'hsl( ' + this.currentHue + ', 100%, 50%)';
			this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );

			// Fill with white
			// Odd bug prevented selecting min, max ranges from all gradients
			this.context.fillStyle = whiteGrd;
			this.context.fillRect( -1, -1, this.canvas.width+2, this.canvas.height+2 );

			// Fill with black
			// Odd bug prevented selecting min, max ranges from all gradients
			this.context.fillStyle = blackGrd;
			this.context.fillRect( -1, -1, this.canvas.width+2, this.canvas.height+2 );
		},
		extra: function() {
			this.$scope.$on('mdColorPicker:spectrumHueChange', angular.bind( this, function( e, args ) {
				this.currentHue = args.hue;
				this.draw();
				var markerPos = this.getMarkerCenter();
				var color = this.getColorByPoint( markerPos.x, markerPos.y );
				this.setColor( color );

			}));
		}
	}

};

function GradientCanvasFactory( ) {

	return function gradientCanvas( type ) {
		var canvas = new GradientCanvas( type, type != 'spectrum' );
		canvas = angular.merge( canvas, canvasTypes[type] );

		return {
			template: '<canvas width="100%" height="100%"></canvas><div class="md-color-picker-marker"></div>',
			link: canvas.get,
			controller: function() {
			//	console.log( "mdColorPickerAlpha Controller", Date.now() - dateClick );
			}
		};
	}

}

function GradientCanvas( type, restrictX ) {

	this.type = type;
	this.restrictX = restrictX;
	this.offset = {
		x: null,
		y: null
	};
	this.height = 255;

	this.$scope = null;
	this.$element = null;

	this.get = angular.bind(this, function( $temp_scope, $temp_element, $temp_attrs ) {
		////////////////////////////
		// Variables
		////////////////////////////

		this.$scope = $temp_scope;
		this.$element = $temp_element;


		this.canvas = this.$element.children()[0];
		this.marker = this.$element.children()[1];
		this.context = this.canvas.getContext('2d');
		this.currentColor = this.$scope.color.toRgb();
		this.currentHue = this.$scope.color.toHsv().h;
		////////////////////////////
		// Watchers, Observes, Events
		////////////////////////////

		//$scope.$watch( function() { return color.getRgb(); }, hslObserver, true );


		this.$element.on('touchstart mousedown', angular.bind(this, this.onMouseDown));
		this.$scope.$on('mdColorPicker:colorSet', angular.bind( this, this.onColorSet ) );
		if ( this.extra ) {
			this.extra();
		}
		////////////////////////////
		// init
		////////////////////////////

		this.draw();
	});

	//return angular.bind( this, this.get );

}



GradientCanvas.prototype.$window = angular.element( window );

GradientCanvas.prototype.getColorByMouse = function( e ) {

    var te =  e.touches && e.touches[0];

    var pageX = te && te.pageX || e.pageX;
    var pageY = te && te.pageY || e.pageY;

    var x = Math.round( pageX - this.offset.x );
    var y = Math.round( pageY - this.offset.y );

    return this.getColorByPoint(x, y);
};

GradientCanvas.prototype.setMarkerCenter = function( x, y ) {
	var xOffset = -1 * this.marker.offsetWidth / 2;
	var yOffset = -1 * this.marker.offsetHeight / 2;
	var xAdjusted, xFinal, yAdjusted, yFinal;

	if ( y === undefined ) {
		yAdjusted = x + yOffset;
		yFinal = Math.round( Math.max( Math.min( this.height-1 + yOffset, yAdjusted), yOffset ) );

		xFinal = 0;
	} else {
		xAdjusted = x + xOffset;
		yAdjusted = y + yOffset;

		xFinal = Math.floor( Math.max( Math.min( this.height + xOffset, xAdjusted ), xOffset ) );
		yFinal = Math.floor( Math.max( Math.min( this.height + yOffset, yAdjusted ), yOffset ) );
		// Debug output
		// console.log( "Raw: ", x+','+y, "Adjusted: ", xAdjusted + ',' + yAdjusted, "Final: ", xFinal + ',' + yFinal );
	}



	angular.element(this.marker).css({'left': xFinal + 'px' });
	angular.element(this.marker).css({'top': yFinal + 'px'});
};

GradientCanvas.prototype.getMarkerCenter = function() {
	var returnObj = {
		x: this.marker.offsetLeft + ( Math.floor( this.marker.offsetWidth / 2 ) ),
		y: this.marker.offsetTop + ( Math.floor( this.marker.offsetHeight / 2 ) )
	};
	return returnObj;
};

GradientCanvas.prototype.getImageData = function( x, y ) {
	x = Math.max( 0, Math.min( x, this.canvas.width-1 ) );
	y = Math.max( 0, Math.min( y, this.canvas.height-1 ) );

	var imageData = this.context.getImageData( x, y, 1, 1 ).data;
	return imageData;
};

GradientCanvas.prototype.onMouseDown = function( e ) {
	// Prevent highlighting
	e.preventDefault();
	e.stopImmediatePropagation();

	this.$scope.previewUnfocus();

	this.$element.css({ 'cursor': 'none' });

	this.offset.x = this.canvas.getBoundingClientRect().left;
	this.offset.y = this.canvas.getBoundingClientRect().top;

	var fn = angular.bind( this, function( e ) {
		switch( this.type ) {
			case 'hue':
				var hue = this.getColorByMouse( e );
				this.$scope.$broadcast( 'mdColorPicker:spectrumHueChange', {hue: hue});
				break;
			case 'alpha':
				var alpha = this.getColorByMouse( e );
				this.$scope.color.setAlpha( alpha );
				this.$scope.alpha = alpha;
				this.$scope.$apply();
				break;
			case 'spectrum':
				var color = this.getColorByMouse( e );
				this.setColor( color );
				break;
		}
	});

        this.$window.on('touchmove mousemove', fn);
        this.$window.one('touchend mouseup', angular.bind(this, function (e) {
        this.$window.off('touchmove mousemove', fn);
		this.$element.css({ 'cursor': 'crosshair' });
	}));

	// Set the color
	fn( e );
};

GradientCanvas.prototype.setColor = function( color ) {

		this.$scope.color._r = color.r;
		this.$scope.color._g = color.g;
		this.$scope.color._b = color.b;
		this.$scope.$apply();
		this.$scope.$broadcast('mdColorPicker:spectrumColorChange', { color: color });
};

GradientCanvas.prototype.onColorSet = function( e, args ) {
	switch( this.type ) {
		case 'hue':
			var hsv = this.$scope.color.toHsv();
			this.setMarkerCenter( this.canvas.height - ( this.canvas.height * ( hsv.h / 360 ) ) );
			break;
		case 'alpha':
			this.currentColor = args.color.toRgb();
			this.draw();

			var alpha = args.color.getAlpha();
			var pos = this.canvas.height - ( this.canvas.height * alpha );

			this.setMarkerCenter( pos );
			break;
		case 'spectrum':
			var hsv = args.color.toHsv();
			this.currentHue = hsv.h;
			this.draw();

			var posX = this.canvas.width * hsv.s;
			var posY = this.canvas.height - ( this.canvas.height * hsv.v );

			this.setMarkerCenter( posX, posY );
			break;
	}

};








angular.module('mdColorPicker', [])
	.run(['$templateCache', function ($templateCache) {
		//icon resource should not be dependent
		//credit to materialdesignicons.com
		var shapes = {
			'clear': '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
			'gradient': '<path d="M11 9h2v2h-2zm-2 2h2v2H9zm4 0h2v2h-2zm2-2h2v2h-2zM7 9h2v2H7zm12-6H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 18H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm2-7h-2v2h2v2h-2v-2h-2v2h-2v-2h-2v2H9v-2H7v2H5v-2h2v-2H5V5h14v6z"/>',
			'tune': '<path d="M13 21v-2h8v-2h-8v-2h-2v6h2zM3 17v2h6v-2H3z"/><path d="M21 13v-2H11v2h10zM7 9v2H3v2h4v2h2V9H7z"/><path d="M15 9h2V7h4V5h-4V3h-2v6zM3 5v2h10V5H3z"/>',
			'view_module': '<path d="M4 11h5V5H4v6z"/><path d="M4 18h5v-6H4v6z"/><path d="M10 18h5v-6h-5v6z"/><path d="M16 18h5v-6h-5v6z"/><path d="M10 11h5V5h-5v6z"/><path d="M16 5v6h5V5h-5z"/>',
			'view_headline': '<path d="M4 15h17v-2H4v2z"/><path d="M4 19h17v-2H4v2z"/><path d="M4 11h17V9H4v2z"/><path d="M4 5v2h17V5H4z"/>',
			'history': '<path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/><path d="M12 8v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>',
			'clear_all': '<path d="M5 13h14v-2H5v2zm-2 4h14v-2H3v2zM7 7v2h14V7H7z"/>'
		};
		for (var i in shapes) {
			if (shapes.hasOwnProperty(i)) {
				$templateCache.put([i, 'svg'].join('.'),
					['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">', shapes[i], '</svg>'].join(''));
			}
		}
	}])
	.factory('mdColorGradientCanvas', GradientCanvasFactory )
	.factory('mdColorPickerHistory', ['$injector', function( $injector ) {

		var history = [];
		var strHistory = [];

		var $cookies = false;
		try {
			$cookies = $injector.get('$cookies');
		} catch(e) {

		}

		if ( $cookies ) {
			var tmpHistory = $cookies.getObject( 'mdColorPickerHistory' ) || [];
			for ( var i = 0; i < tmpHistory.length; i++ ) {
				history.push( tinycolor( tmpHistory[i] ) );
				strHistory.push( tmpHistory[i] );
			}
		}

		var length = 40;

		return {
			length: function() {
				if ( arguments[0] ) {
					length = arguments[0];
				} else {
					return history.length;
				}
			},
			add: function( color ) {
				for( var x = 0; x < history.length; x++ ) {
					if ( history[x].toRgbString() === color.toRgbString() ) {
						history.splice(x, 1);
						strHistory.splice(x, 1);
					}
				}

				history.unshift( color );
				strHistory.unshift( color.toRgbString() );

				if ( history.length > length ) {
					history.pop();
					strHistory.pop();
				}
				if ( $cookies ) {
					$cookies.putObject('mdColorPickerHistory', strHistory );
				}
			},
			get: function() {
				return history;
			},
			reset: function() {
				history = [];
				strHistory = [];
				if ( $cookies ) {
					$cookies.putObject('mdColorPickerHistory', strHistory );
				}
			}
		};
	}])
	.directive('mdColorPicker', [ '$timeout', 'mdColorPickerHistory', function( $timeout, colorHistory ) {

		return {
			templateUrl: "mdColorPicker.tpl.html",

			// Added required controller ngModel
			require: '^ngModel',
			scope: {
				options: '=mdColorPicker',

				// Input options
				type: '@',
				label: '@?',
				icon: '@?',
				random: '@?',
				default: '@?',

				// Dialog Options
				openOnInput: '=?',
				hasBackdrop: '=?',
				clickOutsideToClose: '=?',
				skipHide: '=?',
				preserveScope: '=?',

				// Advanced options
				mdColorClearButton: '=?',
				mdColorPreview: '=?',

				mdColorAlphaChannel: '=?',
				mdColorSpectrum: '=?',
				mdColorSliders: '=?',
				mdColorGenericPalette: '=?',
				mdColorMaterialPalette: '=?',
				mdColorHistory: '=?',
				mdColorHex: '=?',
				mdColorRgb: '=?',
				mdColorHsl: '=?',
				mdColorDefaultTab: '=?',
				mdColorRequired: '=?'
			},
			controller: ['$scope', '$element', '$attrs', '$mdDialog', '$mdColorPicker', function( $scope, $element, $attrs, $mdDialog, $mdColorPicker ) {
				var didJustClose = false;

				// Merge Options Object with scope.  Scope will take precedence much like css vs style attribute.
				if ( $scope.options !== undefined ) {
					for ( var opt in $scope.options ) {
						if ( $scope.options.hasOwnProperty( opt ) ) {
							var scopeKey;
							//if ( $scope.hasOwnProperty( opt ) ) { // Removing this because optional scope properties are not added to the scope.
								scopeKey = opt;
							//} else
							if ( $scope.hasOwnProperty( 'mdColor' + opt.slice(0,1).toUpperCase() + opt.slice(1) ) ) {
								scopeKey = 'mdColor' + opt.slice(0,1).toUpperCase() + opt.slice(1);
							}
							if ( scopeKey && ( $scope[scopeKey] === undefined || $scope[scopeKey] === '' ) ) {
								$scope[scopeKey] = $scope.options[opt];
							}
						}
					}
				}

				// Get ngModelController from the current element
				var ngModel = $element.controller('ngModel');

				// Quick function for updating the local 'value' on scope
				var updateValue = function(val) {
					$scope.value = val || ngModel.$viewValue || '';
				};

				// Defaults
				// Everything is enabled by default.
				$scope.mdColorClearButton = $scope.mdColorClearButton === undefined ? true : $scope.mdColorClearButton;
				$scope.mdColorPreview = $scope.mdColorPreview === undefined ? true : $scope.mdColorPreview;

				$scope.mdColorAlphaChannel = $scope.mdColorAlphaChannel === undefined ? true : $scope.mdColorAlphaChannel;
				$scope.mdColorSpectrum = $scope.mdColorSpectrum === undefined ? true : $scope.mdColorSpectrum;
				$scope.mdColorSliders = $scope.mdColorSliders === undefined ? true : $scope.mdColorSliders;
				$scope.mdColorGenericPalette = $scope.mdColorGenericPalette === undefined ? true : $scope.mdColorGenericPalette;
				$scope.mdColorMaterialPalette = $scope.mdColorMaterialPalette === undefined ? true : $scope.mdColorMaterialPalette;
				$scope.mdColorHistory = $scope.mdColorHistory === undefined ? true : $scope.mdColorHistory;
				$scope.mdColorHex = $scope.mdColorHex === undefined ? true : $scope.mdColorHex;
				$scope.mdColorRgb = $scope.mdColorRgb === undefined ? true : $scope.mdColorRgb;
				$scope.mdColorHsl = $scope.mdColorHsl === undefined ? true : $scope.mdColorHsl;
				// Set the starting value
				updateValue();

				// Keep an eye on changes
				$scope.$watch(function() {
					return ngModel.$modelValue;
				},function(newVal) {
					updateValue(newVal);
				});

				// Watch for updates to value and set them on the model
				$scope.$watch('value',function(newVal,oldVal) {
					if (newVal !== '' && typeof newVal !== 'undefined' && newVal && newVal !== oldVal) {
						ngModel.$setViewValue(newVal);
					}
				});

				// The only other ngModel changes

				$scope.clearValue = function clearValue() {
					ngModel.$setViewValue('');
				};
				$scope.showColorPicker = function showColorPicker($event) {
					if ( didJustClose ) {
						return;
					}
				//	dateClick = Date.now();
				//	console.log( "CLICK OPEN", dateClick, $scope );

					$mdColorPicker.show({
						value: $scope.value,
						defaultValue: $scope.default,
						random: $scope.random,
						clickOutsideToClose: $scope.clickOutsideToClose,
						hasBackdrop: $scope.hasBackdrop,
						skipHide: $scope.skipHide,
						preserveScope: $scope.preserveScope,

						mdColorAlphaChannel: $scope.mdColorAlphaChannel,
						mdColorSpectrum: $scope.mdColorSpectrum,
						mdColorSliders: $scope.mdColorSliders,
						mdColorGenericPalette: $scope.mdColorGenericPalette,
						mdColorMaterialPalette: $scope.mdColorMaterialPalette,
						mdColorHistory: $scope.mdColorHistory,
						mdColorHex: $scope.mdColorHex,
						mdColorRgb: $scope.mdColorRgb,
						mdColorHsl: $scope.mdColorHsl,
						mdColorDefaultTab: $scope.mdColorDefaultTab,

						$event: $event,

					}).then(function( color ) {
						$scope.value = color;
					});
				};
			}],
			compile: function( element, attrs ) {

				//attrs.value = attrs.value || "#ff0000";
				attrs.type = attrs.type !== undefined ? attrs.type : 0;

			}
		};
	}])
	.directive( 'mdColorPickerContainer', ['$compile','$timeout','$mdColorPalette','mdColorPickerHistory', function( $compile, $timeout, $mdColorPalette, colorHistory ) {
		return {
			templateUrl: 'mdColorPickerContainer.tpl.html',
			scope: {
				value: '=?',
				default: '@',
				random: '@',
				ok: '=?',
				mdColorAlphaChannel: '=',
				mdColorSpectrum: '=',
				mdColorSliders: '=',
				mdColorGenericPalette: '=',
				mdColorMaterialPalette: '=',
				mdColorHistory: '=',
				mdColorHex: '=',
				mdColorRgb: '=',
				mdColorHsl: '=',
				mdColorDefaultTab: '='
			},
			controller: function( $scope, $element, $attrs ) {
			//	console.log( "mdColorPickerContainer Controller", Date.now() - dateClick, $scope );

				function getTabIndex( tab ) {
					var index = 0;
					if ( tab && typeof( tab ) === 'string' ) {
						/* DOM isn't fast enough for this

						var tabs = $element[0].querySelector('.md-color-picker-colors').getElementsByTagName( 'md-tab' );
						console.log( tabs.length );
						*/
						var tabName = 'mdColor' + tab.slice(0,1).toUpperCase() + tab.slice(1);
						var tabs = ['mdColorSpectrum', 'mdColorSliders', 'mdColorGenericPalette', 'mdColorMaterialPalette', 'mdColorHistory'];
						for ( var x = 0; x < tabs.length; x++ ) {
							//console.log(  tabs[x]('ng-if') );
							//if ( tabs[x].getAttribute('ng-if') == tabName ) {
							if ( tabs[x] == tabName ) {
								if ( $scope[tabName] ) {
									index = x;
									break;
								}
							}
						}
					} else if ( tab && typeof ( tab ) === 'number') {
						index = tab;
					}

					return index;
				}

				///////////////////////////////////
				// Variables
				///////////////////////////////////
				var container = angular.element( $element[0].querySelector('.md-color-picker-container') );
				var resultSpan = angular.element( container[0].querySelector('.md-color-picker-result') );
				var previewInput = angular.element( $element[0].querySelector('.md-color-picker-preview-input') );

				var outputFn = [
					'toHexString',
					'toRgbString',
					'toHslString'
				];



				$scope.default = $scope.default ? $scope.default : $scope.random ? tinycolor.random() : 'rgb(255,255,255)';
                $scope.value = $scope.value === undefined ? '' : $scope.value;
				if ( $scope.value.search('#') >= 0 ) {
					$scope.type = 0;
				} else if ( $scope.value.search('rgb') >= 0 ) {
					$scope.type = 1;
				} else if ( $scope.value.search('hsl') >= 0 ) {
					$scope.type = 2;
				}
				$scope.color = new tinycolor($scope.value || $scope.default); // Set initial color
				$scope.alpha = $scope.color.getAlpha();
				$scope.history =  colorHistory;
				$scope.materialFamily = [];

				$scope.whichPane = getTabIndex( $scope.mdColorDefaultTab );
				$scope.inputFocus = false;

				// Colors for the palette screen
				///////////////////////////////////
				var steps = 9;
				var freq = 2*Math.PI/steps;

				$scope.palette = [
					["rgb(255, 204, 204)","rgb(255, 230, 204)","rgb(255, 255, 204)","rgb(204, 255, 204)","rgb(204, 255, 230)","rgb(204, 255, 255)","rgb(204, 230, 255)","rgb(204, 204, 255)","rgb(230, 204, 255)","rgb(255, 204, 255)"],
					["rgb(255, 153, 153)","rgb(255, 204, 153)","rgb(255, 255, 153)","rgb(153, 255, 153)","rgb(153, 255, 204)","rgb(153, 255, 255)","rgb(153, 204, 255)","rgb(153, 153, 255)","rgb(204, 153, 255)","rgb(255, 153, 255)"],
					["rgb(255, 102, 102)","rgb(255, 179, 102)","rgb(255, 255, 102)","rgb(102, 255, 102)","rgb(102, 255, 179)","rgb(102, 255, 255)","rgb(102, 179, 255)","rgb(102, 102, 255)","rgb(179, 102, 255)","rgb(255, 102, 255)"],
					["rgb(255, 51, 51)","rgb(255, 153, 51)","rgb(255, 255, 51)","rgb(51, 255, 51)","rgb(51, 255, 153)","rgb(51, 255, 255)","rgb(51, 153, 255)","rgb(51, 51, 255)","rgb(153, 51, 255)","rgb(255, 51, 255)"],
					["rgb(255, 0, 0)","rgb(255, 128, 0)","rgb(255, 255, 0)","rgb(0, 255, 0)","rgb(0, 255, 128)","rgb(0, 255, 255)","rgb(0, 128, 255)","rgb(0, 0, 255)","rgb(128, 0, 255)","rgb(255, 0, 255)"],
					["rgb(245, 0, 0)","rgb(245, 123, 0)","rgb(245, 245, 0)","rgb(0, 245, 0)","rgb(0, 245, 123)","rgb(0, 245, 245)","rgb(0, 123, 245)","rgb(0, 0, 245)","rgb(123, 0, 245)","rgb(245, 0, 245)"],
					["rgb(214, 0, 0)","rgb(214, 108, 0)","rgb(214, 214, 0)","rgb(0, 214, 0)","rgb(0, 214, 108)","rgb(0, 214, 214)","rgb(0, 108, 214)","rgb(0, 0, 214)","rgb(108, 0, 214)","rgb(214, 0, 214)"],
					["rgb(163, 0, 0)","rgb(163, 82, 0)","rgb(163, 163, 0)","rgb(0, 163, 0)","rgb(0, 163, 82)","rgb(0, 163, 163)","rgb(0, 82, 163)","rgb(0, 0, 163)","rgb(82, 0, 163)","rgb(163, 0, 163)"],
					["rgb(92, 0, 0)","rgb(92, 46, 0)","rgb(92, 92, 0)","rgb(0, 92, 0)","rgb(0, 92, 46)","rgb(0, 92, 92)","rgb(0, 46, 92)","rgb(0, 0, 92)","rgb(46, 0, 92)","rgb(92, 0, 92)"],
					["rgb(255, 255, 255)","rgb(205, 205, 205)","rgb(178, 178, 178)","rgb(153, 153, 153)","rgb(127, 127, 127)","rgb(102, 102, 102)","rgb(76, 76, 76)","rgb(51, 51, 51)","rgb(25, 25, 25)","rgb(0, 0, 0)"]
				];

				$scope.materialPalette = $mdColorPalette;

				///////////////////////////////////
				// Functions
				///////////////////////////////////
				$scope.isDark = function isDark( color ) {
					if ( angular.isArray( color ) ) {
						return tinycolor( {r: color[0], g: color[1], b: color[2] }).isDark();
					} else {
						return tinycolor( color ).isDark();
					}

				};
				$scope.previewFocus = function() {
					$scope.inputFocus = true;
					$timeout( function() {
						previewInput[0].setSelectionRange(0, previewInput[0].value.length);
					});
				};
				$scope.previewUnfocus = function() {
					$scope.inputFocus = false;
					previewInput[0].blur();
				};
				$scope.previewBlur = function() {
					$scope.inputFocus = false;
					$scope.setValue();
				};
				$scope.previewKeyDown = function( $event ) {

					if ( $event.keyCode == 13 ) {
						$scope.ok && $scope.ok();
					}
				};
				$scope.setPaletteColor = function( event ) {
					$timeout( function() {
						$scope.color = tinycolor( event.target.style.backgroundColor );
					});
				};

				$scope.setValue = function setValue() {
					// Set the value if available
					if ( $scope.color && $scope.color && outputFn[$scope.type] && $scope.color.toRgbString() !== 'rgba(0, 0, 0, 0)' ) {
						$scope.value = $scope.color[outputFn[$scope.type]]();
					}
				};

				$scope.changeValue = function changeValue() {
					$scope.color = tinycolor( $scope.value );
					$scope.$broadcast('mdColorPicker:colorSet', { color: $scope.color });
				};


				///////////////////////////////////
				// Watches and Events
				///////////////////////////////////
				$scope.$watch( 'color._a', function( newValue ) {
					$scope.color.setAlpha( newValue );
				}, true);

				$scope.$watch( 'whichPane', function( newValue ) {
					// 0 - spectrum selector
					// 1 - sliders
					// 2 - palette
					$scope.$broadcast('mdColorPicker:colorSet', {color: $scope.color });

				});

				$scope.$watch( 'type', function() {
					previewInput.removeClass('switch');
					$timeout(function() {
						previewInput.addClass('switch');
					});
				});

				$scope.$watchGroup(['color.toRgbString()', 'type'], function( newValue ) {
					if ( !$scope.inputFocus ) {
						$scope.setValue();
					}
				});


				///////////////////////////////////
				// INIT
				// Let all the other directives initialize
				///////////////////////////////////
			//	console.log( "mdColorPickerContainer Controller PRE Timeout", Date.now() - dateClick );
				$timeout( function() {
			//		console.log( "mdColorPickerContainer Controller Timeout", Date.now() - dateClick );
					$scope.$broadcast('mdColorPicker:colorSet', { color: $scope.color });
					previewInput.focus();
					$scope.previewFocus();
				});
			},
			link: function( scope, element, attrs ) {

				var tabs = element[0].getElementsByTagName( 'md-tab' );
				/*
				Replicating these structure without ng-repeats

				<div ng-repeat="row in palette track by $index" flex="15"  layout-align="space-between" layout="row"  layout-fill>
					<div ng-repeat="col in row track by $index" flex="10" style="height: 25.5px;" ng-style="{'background': col};" ng-click="setPaletteColor($event)"></div>
				</div>

				<div ng-repeat="(key, value) in materialColors">
					<div ng-style="{'background': 'rgb('+value['500'].value[0]+','+value['500'].value[1]+','+value['500'].value[2]+')', height: '75px'}" class="md-color-picker-material-title" ng-class="{'dark': isDark( value['500'].value )}" ng-click="setPaletteColor($event)">
						<span>{{key}}</span>
					</div>
					<div ng-repeat="(label, color) in value track by $index" ng-style="{'background': 'rgb('+color.value[0]+','+color.value[1]+','+color.value[2]+')', height: '33px'}" class="md-color-picker-with-label" ng-class="{'dark': isDark( color.value )}" ng-click="setPaletteColor($event)">
						<span>{{label}}</span>
					</div>
				</div>
				*/


				$timeout(function() {
					createDOM();
				});

				function createDOM() {
					var paletteContainer = angular.element( element[0].querySelector('.md-color-picker-palette') );
					var materialContainer = angular.element( element[0].querySelector('.md-color-picker-material-palette') );
					var paletteRow = angular.element('<div class="flex-15 layout-fill layout-row layout-align-space-between" layout-align="space-between" layout="row" layout-fill"></div>');
					var paletteCell = angular.element('<div class="flex-10"></div>');

					var materialTitle = angular.element('<div class="md-color-picker-material-title"></div>');
					var materialRow = angular.element('<div class="md-color-picker-with-label"></div>');



					angular.forEach(scope.palette, function( value, key ) {
						var row = paletteRow.clone();
						angular.forEach( value, function( color ) {
							var cell = paletteCell.clone();
							cell.css({
								height: '25.5px',
								backgroundColor: color
							});
							cell.bind('click', scope.setPaletteColor );
							row.append( cell );
						});

						paletteContainer.append( row );
					});

					angular.forEach(scope.materialPalette, function( value, key ) {
						var title = materialTitle.clone();
						title.html('<span>'+key.replace('-',' ')+'</span>');
						title.css({
							height: '75px',
							backgroundColor: 'rgb('+value['500'].value[0]+','+value['500'].value[1]+','+value['500'].value[2]+')'
						});
						if ( scope.isDark(value['500'].value) ) {
							title.addClass('dark');
						}

						materialContainer.append( title );

						angular.forEach( value, function( color, label ) {

							var row = materialRow.clone();
							row.css({
								height: '33px',
								backgroundColor: 'rgb('+color.value[0]+','+color.value[1]+','+color.value[2]+')'
							});
							if ( scope.isDark(color.value) ) {
								row.addClass('dark');
							}

							row.html('<span>'+label+'</span>');
							row.bind('click', scope.setPaletteColor );
							materialContainer.append( row );
						});


					});
				}
			}
		};
	}])

	.directive( 'mdColorPickerHue', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas('hue'); }])
	.directive( 'mdColorPickerAlpha', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas('alpha'); }])
	.directive( 'mdColorPickerSpectrum', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas('spectrum'); }])

    .factory('$mdColorPicker', ['$q', '$mdDialog', 'mdColorPickerHistory', function ($q, $mdDialog, colorHistory) {
		var dialog;

        return {
            show: function (options)
            {
                if ( options === undefined ) {
                    options = {};
                }
				//console.log( 'DIALOG OPTIONS', options );
				// Defaults
				// Dialog Properties
                options.hasBackdrop = options.hasBackdrop === undefined ? true : options.hasBackdrop;
				options.clickOutsideToClose = options.clickOutsideToClose === undefined ? true : options.clickOutsideToClose;
				options.defaultValue = options.defaultValue === undefined ? '#FFFFFF' : options.defaultValue;
				options.focusOnOpen = options.focusOnOpen === undefined ? false : options.focusOnOpen;
				options.preserveScope = options.preserveScope === undefined ? true : options.preserveScope;
				options.skipHide = options.skipHide === undefined ? true : options.skipHide;

				// mdColorPicker Properties
				options.mdColorAlphaChannel = options.mdColorAlphaChannel === undefined ? false : options.mdColorAlphaChannel;
				options.mdColorSpectrum = options.mdColorSpectrum === undefined ? true : options.mdColorSpectrum;
				options.mdColorSliders = options.mdColorSliders === undefined ? true : options.mdColorSliders;
				options.mdColorGenericPalette = options.mdColorGenericPalette === undefined ? true : options.mdColorGenericPalette;
				options.mdColorMaterialPalette = options.mdColorMaterialPalette === undefined ? true : options.mdColorMaterialPalette;
				options.mdColorHistory = options.mdColorHistory === undefined ? true : options.mdColorHistory;
				options.mdColorRgb = options.mdColorRgb === undefined ? true : options.mdColorRgb;
				options.mdColorHsl = options.mdColorHsl === undefined ? true : options.mdColorHsl;
				options.mdColorHex = ((options.mdColorHex === undefined) || (!options.mdColorRgb && !options.mdColorHsl))  ? true : options.mdColorHex;
				options.mdColorAlphaChannel = (!options.mdColorRgb && !options.mdColorHsl) ? false : options.mdColorAlphaChannel;

                dialog = $mdDialog.show({
					templateUrl: 'mdColorPickerDialog.tpl.html',
					hasBackdrop: options.hasBackdrop,
					clickOutsideToClose: options.clickOutsideToClose,

					controller: ['$scope', 'options', function( $scope, options ) {
							//console.log( "DIALOG CONTROLLER OPEN", Date.now() - dateClick );
							$scope.close = function close()
                            {
								$mdDialog.cancel();
							};
							$scope.ok = function ok()
							{
								$mdDialog.hide( $scope.value );
							};
							$scope.hide = $scope.ok;



							$scope.value = options.value;
							$scope.default = options.defaultValue;
							$scope.random = options.random;

							$scope.mdColorAlphaChannel = options.mdColorAlphaChannel;
							$scope.mdColorSpectrum = options.mdColorSpectrum;
							$scope.mdColorSliders = options.mdColorSliders;
							$scope.mdColorGenericPalette = options.mdColorGenericPalette;
							$scope.mdColorMaterialPalette = options.mdColorMaterialPalette;
							$scope.mdColorHistory = options.mdColorHistory;
							$scope.mdColorHex = options.mdColorHex;
							$scope.mdColorRgb = options.mdColorRgb;
							$scope.mdColorHsl = options.mdColorHsl;
							$scope.mdColorDefaultTab = options.mdColorDefaultTab;

					}],

					locals: {
						options: options,
					},
					preserveScope: options.preserveScope,
  					skipHide: options.skipHide,

					targetEvent: options.$event,
					focusOnOpen: options.focusOnOpen,
					autoWrap: false,
					onShowing: function() {
				//		console.log( "DIALOG OPEN START", Date.now() - dateClick );
					},
					onComplete: function() {
				//		console.log( "DIALOG OPEN COMPLETE", Date.now() - dateClick );
					}
                });

				dialog.then(function (value) {
                    colorHistory.add(new tinycolor(value));
                }, function () { });

                return dialog;
            },
			hide: function() {
				return dialog.hide();
			},
			cancel: function() {
				return dialog.cancel();
			}
		};
	}]);
})( window, window.angular );
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

/**
		 * @classdesc $mdColorPickerConfig Provider
		 * @class $mdColorPickerConfig
		 */
		var mdColorPickerConfigRef;
		var mdColorPickerConfig = function() {
			mdColorPickerConfigRef= this;
			this.Tab = Tab;
			this.Notation = Notation;

 			/**
 			 * Holds the available color notations methods.
 			 * @member {Object} $mdColorPickerConfig#notations
 			 *
 			 */
 			this.notations = {
 				notations_: {


 				},

 				/**
 				 * Rertieve a notation Object.
 				 * @function $mdColorPickerConfig#notations#get
				 *
 				 * @param  {String|Integer} notation Notation identifier.
 				 * @return {Object}          Corresponding notation Object.
 				 */
 				get: function( notation ) {
 					var returnNotation;
 					if ( notation === undefined ) {

 						var returnObj = {};
 						for ( var x = 0; x < this.order.length; x++ ) {
 							returnObj[ this.order[x] ] = this.get( this.order[x] );
 							returnObj[ this.order[x] ].index = x;
 						}
 						return returnObj;

 					} else if ( !isNaN( notation ) ) {
 						returnNotation =  this.notations_[ this.order[ notation ] ];
 						returnNotation.index = notation;
 					} else {
 						returnNotation = this.notations_[ notation ];
 						returnNotation.index = this.order.indexOf( notation );
 					}

 					return returnNotation;
 				},

 				/**
 				 * Selects the notation based on the color string.
				 * @function $mdColorPickerConfig#notations#select
 				 *
 				 * @param  {String} color description.
 				 * @return {String}     String indentifier of the current notation.
 				 */
 				select: function( color ) {
 					console.log("SELECT", color);
 					var notation = this.get(this.order[0]);
 					var this_ = this;
 					angular.forEach( this.notations_, function( item, i ) {
 						console.log( item );
 						if ( item.test( color ) ) {
 							notation = item;
 						}
 					}, this);

 					return notation;
 				},

 				/**
 				 * Adds a color notation to the available notations.
				 * @function $mdColorPickerConfig#notations#add
 				 *
 				 * @param  {string} name     Identifier for the notation (hex, rgb, hsl, etc.).
 				 * @param  {Function} notation Function to parse the tinycolor.js color object and return a string.
 				 */
 				add: function( notation, pushToOrder ) {
 					this.notations_[ notation.name ] = new Notation( notation );
 					this.notations_[ notation.name ].index = this.order.indexOf( notation.name );

					if ( pushToOrder ) {
						this.order.push( notation.name );
					}
 				},

 				/**
 				 * Holds the order of the notaions to be displayed under the preview.
				 * @member $mdColorPickerConfig#notations#order
				 *
 				 * @default [ 'hex', 'rgb', 'hsl' ]
 				 */
 				 order: [ 'hex', 'rgb', 'hsl' ]


 			};



 			// Default HEX notation object.
 			this.notations.add({
 				name: 'hex',
 				toString: function( color ) {
 					return color.toHexString();
 				},
 				testExp: /#[a-fA-F0-9]{3,6}/,
 				disabled: function( color ) {
 					return color.toRgb().a !== 1;
 				}
 			});

 			// Default RGB notation Object.
 			this.notations.add({
 				name: 'rgb',
 				toString: function( color ) {
 					return color.toRgbString();
 				},
 				test: function( color ) {
 					return color.toLowerCase().search( 'rgb' ) > -1;
 				}
 			});

 			// hsl - Default HSL notation Object.
 			this.notations.add({
 				name: 'hsl',
 				toString: function( color ) {
 					return color.toHslString();
 				},
 				test: function( color ) {
 					return color.toLowerCase().search('hsl') > -1;
 				}
 			});








 			/**
 			 * Holds the available tabs to be used.
 			 * Does not hold the order or display properties of the.
 			 * tabs in the window.
 			 * @member {Object} $mdColorPickerConfig#tabs
 			 */
 			this.tabs = {
				cache_: {},
 				tabs_: {},
 				/**
 				 * Adds a tab object to the avaiable tabs for the window.
				 * @function $mdColorPickerConfig#tabs#add
 				 *
 				 * @param  {Object} tab {@link Tab} Options object or an instance of a {@link Tab}.
				 * @param  {Number|String|Boolean} [addToOrder=true] Should the new tab be added to the order.  Can be an index, array function name (`push`,`unshift`, etc), or `true` to push it on the end of the order.  If index is greater than the length of the array, actual starting index will be set to the length of the array, if negative, will begin that many elements from the end.
 				 *
 				 * @example <caption> Adding the Spectrum Tab.</caption>
 				 * $mdColorPickerConfigProvider.tabs.add({
				 * 	name: 'spectrum',
 	 			 * 	icon: 'gradient.svg',
 	 			 * 	template: [
 	 			 *				'<div md-color-picker-spectrum></div>',
 	 			 *				'<div md-color-picker-hue ng-class="{\'md-color-picker-wide\': !mdColorAlphaChannel}"></div>',
 	 			 *				'<div md-color-picker-alpha class="md-color-picker-checkered-bg" ng-show="mdColorAlphaChannel"></div>'
 	 			 *			].join( '\n' )
 	 			 * });
				 *
				 * // Same as above
				 * var spectrumTab = new $mdColorPickerConfig.Tab({
				 * 	name: 'spectrum',
 	 			 * 	icon: 'gradient.svg',
 	 			 * 	template: [
 	 			 *				'<div md-color-picker-spectrum></div>',
 	 			 *				'<div md-color-picker-hue ng-class="{\'md-color-picker-wide\': !mdColorAlphaChannel}"></div>',
 	 			 *				'<div md-color-picker-alpha class="md-color-picker-checkered-bg" ng-show="mdColorAlphaChannel"></div>'
 	 			 *			].join( '\n' )
 	 			 * });
				 *
				 * $mdColorPickerConfig.tabs.add( spectrumTab );
 				 */
 				add: function( tab, addToOrder ) {
					console.log( "ADD TAB", tab );
					this.tabs_[ tab.name ] = tab;

					addToOrder = addToOrder === undefined ? true : addToOrder;
					if ( addToOrder !== false && this.order.indexOf( tab.name ) === -1 ) {
						if ( typeof this.order[addToOrder] === 'function' ) {
							this.order[addToOrder]( tab.name );
						} else if ( typeof addToOrder == 'number' ) {
							this.order.splice( addToOrder, 0, tab.name );
						} else {
							this.order.push( tab.name );
						}
					}
 				},

 				/**
 				 * Returns the specified tab.
				 * @function $mdColorPickerConfig#tabs#get
 				 *
 				 * @param  {String} tab The identifier of the tab.
 				 * @return {Tab}     The tab object requested.
 				 */
 				get: function( tab, config ) {
					console.log('GET TAB', this);
 					if ( tab ) {
						if ( config === true ) {
							return this.tabs_[tab];
						} else {
							var newTab = new Tab( this.tabs_[ tab ] );
							this.cache_[ tab ] = this.cache_[ tab ] || [];
							this.cache_[ tab ].push( newTab );
	 						return newTab;
						}
 					} else {
 						var returnObj = {};
 						for ( var x = 0; x < this.order.length; x++ ) {
 							returnObj[ this.order[x] ] = this.get( this.order[x] );
 						}
 						return returnObj;
 					}
 				},

				getFromCache: function( tabName, index ) {
					return isNaN( index ) ? this.cache_[ tabName ] : this.cache_[ tabName ][index];
				},

 				/**
 				 * Holds the order of the tabs, if a tab is not in this list, it will not be shown.
				 * @member $mdColorPickerConfig#tabs#order
				 * @default [ 'spectrum',]
 				 */
 				order: [ 'spectrum', 'wheel', 'colorSliders' ] // [ 'spectrum', 'wheel', 'rgbSliders', 'palette', 'material', 'history' ];
 			};



 			this.tabs.add({
 				name: 'spectrum',
 				icon: 'gradient.svg',
 				template: [
 							'<div md-color-picker-spectrum></div>',
 							'<div md-color-picker-hue ng-class="{\'md-color-picker-wide\': false && !mdColorAlphaChannel}"></div>',
 							'<div md-color-picker-alpha class="md-color-picker-checkered-bg" ng-show="true || mdColorAlphaChannel"></div>'
 						].join( '\n' )
 			});

 			this.tabs.add({
 				name: 'colorSliders',
 				icon: 'tune.svg',
 				templateUrl: 'tabs/colorSliders.tpl.html',
 				link: function( $scope, $element ) {
 					$scope.$watch( 'data.color._a', function( newVal ) {
 						$scope.data.color.setAlpha( newVal );
 					});
 				}
 			});

			this.tabs.add({
				name: 'wheel',
				icon: 'wheel.svg',
				template: [
							'<div md-color-picker-wheel></div>',
							'<div md-color-picker-value ng-class="{\'md-color-picker-wide\': false && !mdColorAlphaChannel}"></div>',
							'<div md-color-picker-alpha class="md-color-picker-checkered-bg" ng-if="true || mdColorAlphaChannel"></div>'
						].join('\n')
			}, 'push');


			this.defaults = {
				history: {
					useLocalStorage: false,
					useCookies: true,
				},
				dialog: {
					hasBackdrop: true,
					clickOutsideToClose: true,
					escapeToClose: true,
					focusOnOpen: false,
					preserveScope: false,
					skipHide: true,
					targetEvent: undefined

				},
				panel: {
					hasBackdrop: false,
					escapeToClose: true,
					trapFocus: false,
					clickOutsideToClose: true,
					focusOnOpen: true,
					fullscree: false

				},
				mdColorPicker: {
					default: '#FFFFFF',
					tab: 'spectrum',
					alphaChannel: true,
					random: false
				}
			};


 			/*
 			 * return the config Object.
 			 */
 			this.$get = ['$q', '$templateRequest', function( $q, $templateRequest ) {

 				// Overwriting the stub here for $q and $templateRequest
 				Tab.prototype.getTemplate = function() {
 					var defer = $q.defer();
 					var self = this;
 					if ( this.template !== undefined ) {
 						defer.resolve( { tab: self, tpl: self.template } );
 					} else if ( this.templateUrl ) {
 						$templateRequest( this.templateUrl ).then( function( tpl ) {
 							defer.resolve( { tab: self, tpl: tpl } );
 						});
 					}

 					return defer.promise;

 				};

 				return this;
 			}];

 		};



		/**
		 * @classdesc Notation object.
		 * @class $mdColorPickerConfig#Notation
		 *
		 * @param {Object} notation
		 * @param {String} notation.name Name of the notation used as an identifier.
		 * @param {RegExp} [notation.testExp] Regular Expression used to test a string against the notation format.
		 *
		 */
		function Notation( notation ) {
			/** @member {String} $mdColorPickerConfig#Notation#name The name of the notation. */
			this.name = notation.name;

			/**
			 * @member {Integer} $mdColorPickerConfig#Notation#index The index of the notation in the {@link $mdColorPickerConfig#notations#order} array.
			 * @default -1
			 */
			this.index = -1;

			/**
			 * @member {RegExp} $mdColorPickerConfig#Notation#testExp Test RegExp used by {@link $mdColorPickerConfig#Notation#test}
			 */
			this.testExp = notation.testExp;

			angular.merge( this, notation );
		}

		/**
		 * Converts tinycolor.js Object to the notations string equivalent.
		 * @type function
		 * @memberof Notation
		 * @abstract
		 *
		 * @param  {tinycolor} color Tinycolor.js color Object.
		 * @return {String}       String notation of the color.
		 *
		 */
		Notation.prototype.toString = function( color ) {

		};

		 /**
 		 * Converts tinycolor.js Object to the notations object equivalent.
 		 * @memberof Notation
 		 *
 		 * @param  {tinycolor} color Tinycolor.js color Object.
 		 * @return {Object}       Object notation of the color.
		 *
		 * @example
		 * var rgbObject = $mdColorPickerConfig.notations.get('rgb').toObject();
		 *
		 * // rbgObject == { r: 200, g: 255, b: 0, a: 1 }
 		 */
 		Notation.prototype.toObject = function( color ) {

 		};

		/**
		 * Check if a color string is in the notations format.
		 * @memberof Notation
		 *
		 * @param  {String} color Color String.
		 * @return {Boolean}     True if string in in the notations format, False if it is not.
		 */
		Notation.prototype.test = function( colorStr ) {
			return this.testExp.test( colorStr );
		};

		/**
		 * Check if the notation should be disabled.
		 * @memberof Notation
		 *
		 * @param  {tinycolor} color description
		 * @return {Boolean}       True if disabled, False if enabled.
		 */
		Notation.prototype.disabled = function() {
			return false;
		};









		/**
		 * @class $mdColorPickerConfig#Tab
		 * @classdesc Base for all mdColorPicker Tabs.
		 *
		 * @param  {String} name    Name of the tab.
		 * @param  {Object} tab
		 * @param  {String} options.name The name of the tab.
		 * @param  {String} options.icon The svg icon name.
		 * @param  {String} [options.template] The template string for the tab.
		 * @param  {String} [options.templateUrl] The template URL for the tab.
		 * @param  {Function} [options.link] {@link $mdColorPickerConfig#Tab#link} function called after the tab is created and added to the md-tabs element.
		 *
		 * @throws {TabException} Tab Exception for template or name errors.
		 */
		function Tab( options ) {

			function TabException( message, type ) {
				this.type = type;

				this.name = 'mdColorPicker:TabException';
				this.message = '[' + this.name + '] ' + this.type + ' - ' + message;//message;

				this.toString = function() {
					return '[' + this.name + '] ' + this.type + ' - ' + this.message;
				};
			}
			TabException.prototype = new Error();
			TabException.prototype.constructor = TabException;

			options = options || {};



			if ( !options.templateUrl && ( options.template === undefined ) ) {
				throw new TabException( '[' + options.name + '] A template or template URL must be specified.', 'Template Error' );
			}
			if ( !options.name ) {
				throw new TabException( 'A non empty tab name must be specified.', 'Name Error' );
			}

			/** @member {String} $mdColorPickerConfig#Tab#name The name of the tab. */
			this.name = options.name;

			/** @member {String} $mdColorPickerConfig#Tab#icon The svg icon name. */
			this.icon = options.icon || '';

			/** @member {String} $mdColorPickerConfig#Tab#template The template string for the tab. */
			//this.template;
			if ( options.template !== undefined && options.templateUrl === undefined ) {
				this.template = options.template;
			}

			/** @member {String} $mdColorPickerConfig#Tab#templateUrl The template URL for the tab. */
			this.templateUrl = options.templateUrl;

			var linkFn;
			if ( typeof options.link == 'function' ) {
				linkFn = options.link; //angular.bind( this, options.link );
				//delete options.link;
			} else {
				linkFn = angular.noop;
			}



			this.link = function ( $scope, $element) {
				this.$scope = $scope;
				this.$element = $element;
				angular.bind( this, linkFn )( $scope, $element );
			}

			// setTimeout( angular.bind( this, function() {
			// 	this.getTemplate = Tab.prototype.getTemplate;
			// }),1);

			/** @member {$element} $mdColorPickerConfig#Tab#$elemnt The angular.element wrapped element of the tab once rendered. */

			angular.merge( this, options );
			console.log( "ADDING ", this.name, "TO CACHE", mdColorPickerConfigRef );
			// Add this tab to the tabs.cache_ objet;
			mdColorPickerConfigRef.tabs.cache_[ options.name ] = mdColorPickerConfigRef.tabs.cache_[ options.name ] || [];
			// keep track of index for removal later
			this.cacheIndex = mdColorPickerConfigRef.tabs.cache_[ options.name ].length;
			mdColorPickerConfigRef.tabs.cache_[ options.name ].push( this );
		}
		/**
		 * Tab.$destroy - Destroy function called when the tab is destroyed.
 		 * @memberof Tab
 		 */
		Tab.prototype.$destroy = function( ) {
			console.log( "DESTRYOING", this );
			if ( this.$element ) {
				this.$element.remove();
				this.$element = undefined;
			}
			mdColorPickerConfigRef.tabs.cache_[this.name].splice(this.cacheIndex, 1);
		};


		/**
		 * Tab.link - Link function called after the tab is created and added to the md-tabs element.
		 * @memberof Tab
		 *
		 * @param  {type} $scope   Current $scope of the mdColorPicker
		 * @param  {type} $element The content element of the `<md-tab>`
		 */
		Tab.prototype.link = function( $scope, $element ) { };

		/**
		 * Tab.setPaletteColor - Upadates $scope.data.color and calls $scope.$apply to refresh everything.
		 * @memberof Tab
		 *
		 * @param  {Event} event  Mouse event to find the target element.
		 * @param  {Scope} $scope Current mdColorPicker scope to update the color value.
		 */
		Tab.prototype.setPaletteColor = function( event, $scope ) {
			event.stopImmediatePropagation();
			event.preventDefault();
			//$scope.previewBlur();

			$scope.$apply(function() {
				$scope.data.color = new tinycolor( event.target.style.backgroundColor );
				$scope.data.hsva = $scope.data.color.toHsv();
				$scope.data.hsva.a = $scope.data.color.getAlpha();
			});
		};

		/**
		 * Returns the associated template for the tab.
		 * @memberof Tab
		 *
		 * @return {String}  The template string.
		 */
		Tab.prototype.getTemplate = function() {}; // Stub replaced in the $get function.


		angular.module( 'mdColorPickerConfig', [] )
			.provider( '$mdColorPickerConfig', [mdColorPickerConfig]);
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

angular.module('mdColorPicker')
	.directive( 'mdColorPickerContainer', ['$compile','$timeout','$mdColorPickerConfig', '$mdColorPickerHistory', function( $compile, $timeout, $mdColorPickerConfig, $mdColorPickerHistory ) {
		return {
			templateUrl: 'mdColorPickerContainer.tpl.html',
			require: ['^ngModel'],
			scope: {
				value: '=ngModel',
				default: '@',
				random: '=',
				// ok: '=?',
				// mdColorAlphaChannel: '=',
				// mdColorSpectrum: '=',
				// mdColorSliders: '=',
				// mdColorGenericPalette: '=',
				// mdColorMaterialPalette: '=',
				// mdColorHistory: '=',
				// mdColorHex: '=',
				// mdColorRgb: '=',
				// mdColorHsl: '=',
				// mdColorDefaultTab: '='
			},
			controller: function( $scope, $element, $attrs ) {

				// Allow link functions to pass in ngModelController to be used here.
				var $ngModelController;
				$scope.setNgModelController = function( ngModel ) {
					$ngModelController = ngModel;
				};
				///////////////////////////////////
				// Variables
				///////////////////////////////////
				$scope.data = {
					color: undefined
				};
				$scope.config = {
					options: {
						displayAlpha: true//$mdColorPickerConfig.useAlpha
					}
				};

				var container = angular.element( $element[0].querySelector('.md-color-picker-container') );
				var resultSpan = angular.element( container[0].querySelector('.md-color-picker-result') );
				var previewInput = angular.element( $element[0].querySelector('.md-color-picker-preview-input') );

				// Set up the opening color
				console.log( "ASSIGNING OPENING COLOR ",  $scope.random, $mdColorPickerConfig.defaults.mdColorPicker.default, $mdColorPickerConfig.defaults.mdColorPicker.random,  $scope.random || ( !$mdColorPickerConfig.defaults.mdColorPicker.default && $mdColorPickerConfig.defaults.mdColorPicker.random ));
				if ( !$scope.default ) {
					if ( $scope.random || ( !$mdColorPickerConfig.defaults.mdColorPicker.default && $mdColorPickerConfig.defaults.mdColorPicker.random ) ) {
						console.log( "RANDOM COLOR");
						$scope.default = TinyColor.random().toHexString();
					} else if ( $mdColorPickerConfig.defaults.mdColorPicker.default ) {
						console.log( "CONFIG DEFAULT COLOR");
						$scope.default = $mdColorPickerConfig.defaults.mdColorPicker.default;
					} else {
						console.log( "WHITE");
						$scope.default = '#ffffff';
					}
				}
				// $scope.default = $scope.default ? $scope.default : $scope.random ? TinyColor.random().toHexString() : 'rgb(255,255,255)';
				//$scope.default = $scope.value || $scope.default;
				$scope.value = $scope.value || $scope.default;

				$scope.data.history = $mdColorPickerHistory;
				$scope.config.notations = $mdColorPickerConfig.notations;
				$scope.config.currentNotation = $mdColorPickerConfig.notations.select( $scope.value );
				$scope.config.selectedNotation = $scope.config.currentNotation.index;

				$scope.data.color = new TinyColor($scope.value); // Set initial color

			//	$scope.config.tabs = $mdColorPickerConfig.tabs;
				if ( $scope.mdColorDefaultTab ) {
					var defaultTab = $mdColorPickerConfig.tabs.order.indexOf( $scope.mdColorDefaultTab );
					if ( defaultTab != -1 ) {
						$scope.config.defaultTab = defaultTab;
					} else {
						$scope.config.defaultTab = $mdColorPickerConfig.defaultTab || 0;
					}
				} else {
					$scope.config.defaultTab = $mdColorPickerConfig.defaultTab || 0;
				}
				$scope.config.currentTab = $scope.config.defaultTab;

				// $scope.config.options.displayAlpha;

				$scope.inputFocus = false;

				///////////////////////////////////
				// Functions
				///////////////////////////////////

				$scope.isDark = function isDark( color ) {
					if ( angular.isArray( color ) ) {
						return TinyColor( {r: color[0], g: color[1], b: color[2] }).isDark();
					} else {
						return TinyColor( color ).isDark();
					}

				};
				$scope.previewFocus = function() {
					$scope.inputFocus = true;
					$timeout( function() {
						previewInput[0].setSelectionRange(0, previewInput[0].value.length);
					});
				};
				$scope.previewUnfocus = function() {
					$scope.inputFocus = false;
					previewInput[0].blur();
				};
				$scope.previewBlur = function() {
					$scope.inputFocus = false;
					$scope.setValue( $scope.value );
				};
				$scope.previewKeyDown = function( $event ) {

					if ( $event.keyCode == 13 && $scope.ok ) {
						$scope.ok();
					}
				};

				$scope.setValue = function setValue( value ) {
					$scope.value = $scope.config.currentNotation.toString( value );
					$ngModelController.$setViewValue( $scope.config.currentNotation.toString( value ) );
					$ngModelController.$commitViewValue();
				};

				$scope.updateValue = function updateValue( value ) {
					$scope.data.color = new TinyColor( value );
					$scope.data.hue = $scope.data.color.toHsl().h;
					setNotation( $scope.data.color );
				};


				///////////////////////////////////
				// Watches and Events
				///////////////////////////////////
				function setNotation( value ) {
					$scope.config.currentNotation = $mdColorPickerConfig.notations.get( $scope.config.selectedNotation );
					$scope.setValue( value );
				}
				$scope.$watch( 'config.selectedNotation', function() {
					// TODO: set this up using $ngAnimate service
					previewInput.removeClass('switch');
					$timeout(function() {
						previewInput.addClass('switch');
					});
					setNotation( $scope.data.color );
				});
				//
				// $scope.$watch('data.color', function( newValue ) {
				// 	console.log( 'Color Change', newValue );
				// 	if ( !$scope.inputFocus ) {
				// 		setNotation();
				// 	}
				//
				// }, true);

				// $ngModel.$formatters.push( viewFormatter );
				// $ngModel.$parsers.push( viewParser );
				// $scope.$watch( function() { return $ngModelController.$viewValue; }, function( value ) {
				// 	console.log( "NEW ngModel VALUE: ", $ngModelController.$viewValue );
				// 	//$element[0].value = viewParser( $ngModelController.$viewValue );
				// 	// console.log( "NEW ngModel VALUE: ", $element.val() );
				// 	//$scope.data.color = new TinyColor( value );
				// 	setNotation( value )
				// });

				// Watch for our changes
				$scope.$watch( 'data.color', function( value ) {
					if ( !$scope.inputFocus ) {
						setNotation( value );
					}
				});

				// Watch for their changes
				$scope.$watch( function() {
					return $ngModelController.$modelValue;
				}, function( value ) {
					$scope.updateValue( value );
					setNotation( $scope.data.color );
				});

				$scope.$watch( 'value', $scope.updateValue );


				///////////////////////////////////
				// INIT
				// Let all the other directives initialize
				///////////////////////////////////

				// http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript/4819886#4819886
				function is_touch_device() {
					return 'ontouchstart' in window        // works on most browsers
					|| navigator.maxTouchPoints;       // works on IE10/11 and Surface
				}

				$timeout( function() {
					if ( !is_touch_device() ) {
						previewInput.focus();
						$scope.previewFocus();
					}
				});
			},
			link: function( scope, element, attrs, controllers ) {
				var $ngModelController = controllers[0];
				scope.setNgModelController( $ngModelController );


				var tabContainer = element[0].querySelector( '.md-color-picker-colors' );
				var tabsElement = angular.element( tabContainer.querySelector('md-tabs') );
				tabContainer = angular.element( tabContainer );

				scope.config.tabs = $mdColorPickerConfig.tabs.get();
				scope.config.tabKeys = Object.keys( scope.config.tabs );
				scope.config.tabOrder = $mdColorPickerConfig.tabs.order;




				scope.$watch( function() { return $mdColorPickerConfig.tabs.order; }, function( newVal, oldVal ) {
					// Update tabs

					$timeout(function() {
						// Get the tab DOM elements so we can append them
						var compiledTabs = tabsElement.find('md-tabs-content-wrapper').find('md-tab-content');
						var x = 0;
						var diff = oldVal.filter(function(i) {return newVal.indexOf(i) < 0;})
						console.log( "ORDER DIFF", diff );

						// Loop through each tab
						angular.forEach( newVal, function( tabName ) {
							// If this is a new tab we need to add it.
							if ( scope.config.tabKeys.indexOf( tabName ) === -1 ) {
								scope.config.tabs[ tabName ] = $mdColorPickerConfig.tabs.get( tabName );
								scope.config.tabKeys.push( tabName );
							}
							// If the tab does not have an $element, we need to create it and append it to the DOM
							if ( !scope.config.tabs[tabName].$element && compiledTabs[x] ) {
								var $element = angular.element( compiledTabs[x].querySelector('div[md-tabs-template] > div[layout="row"]') );
								scope.config.tabs[ tabName ].$element = $element;

								// Get the tab template and $compile it
								scope.config.tabs[ tabName ].getTemplate().then( function( data ) {
									var theTab = data.tab;
									var tpl = data.tpl;
									if ( tpl != '' ) {
										var compiledTemplate = $compile( tpl )( scope );
										theTab.$element.append( compiledTemplate );
									}
									// Run the Link function if available
									if ( typeof( theTab.link ) === 'function' ) {
										theTab.link( scope, theTab.$element );
									}
								});

							}
							x++;
						}, this );

						angular.forEach( diff, function( tab, i ) {
							scope.config.tabs[tab].$destroy();
						});


					}, false);
				}, true);

				scope.$on('$destroy', function() {
					scope.default = undefined;
					scope.data.color = undefined;
					scope.value = undefined;
					angular.forEach( scope.config.tabs, function( tab, i ) {
						tab.$destroy();
					});
				});
			}
		};
	}]);
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

(function( window, angular, undefined ) {

	angular.module( 'mdColorPickerHistory', [] )
		.provider('$mdColorPickerHistory', function() {
			var history = [];
			var strHistory = [];

			var $cookies = false;


			var length = 40;

		 	this.length = function() {
				if ( arguments[0] ) {
					length = arguments[0];
				} else {
					return history.length;
				}
			};
			this.add = function( color ) {
				if ( typeof(color) === 'string' ) {
					color = new tinycolor( color );
				}
				for( var x = 0; x < history.length; x++ ) {
					if ( history[x].toRgbString() === color.toRgbString() ) {
						history.splice(x, 1);
						strHistory.splice(x, 1);
					}
				}

				history.unshift( color );
				strHistory.unshift( color.toRgbString() );

				if ( history.length > length ) {
					history.pop();
					strHistory.pop();
				}
				if ( $cookies ) {
					$cookies.putObject('mdColorPickerHistory', strHistory );
				}
			};
			this.get = function() {
				return history;
			};
			this.reset = function() {
				history = [];
				strHistory = [];
				if ( $cookies ) {
					$cookies.putObject('mdColorPickerHistory', strHistory );
				}
			};

			this.$get = ['$injector', function( $injector ) {
				try {
					$cookies = $injector.get('$cookies');
				} catch(e) {

				}

				if ( $cookies ) {
					var tmpHistory = $cookies.getObject( 'mdColorPickerHistory' ) || [];
					for ( var i = 0; i < tmpHistory.length; i++ ) {
						history.push( tinycolor( tmpHistory[i] ) );
						strHistory.push( tmpHistory[i] );
					}
				}

				return this;
			}];
		});

})( window, window.angular );
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

// Taken from
// http://jsdo.it/akm2/yr9B


(function( window, undefined ) {
	function ConicalGradient() {
	    this._offsets = [];
	    this._colors = [];
	}

	ConicalGradient.prototype = {
	    /**
	     * addColorStop
	     *
	     * @param {Number} offset
	     * @param {Array} color RGBA 値を配列で指定, アルファ値は省略可 (ex) [255, 127, 0, 0.75]
	     */
	    addColorStop: function(offset, color) {
	        this._offsets.push(offset);
	        this._colors.push(color);
	        return this;
	    },

	    /**
	     * _offsetsReverse (array.forEach callback)
	     */
	    _offsetsReverse: function(offset, index, array) {
	        array[index] = 1 - offset;
	    },

	    /**
	     * fill
	     *
	     * グラデーションを描画する
	     * 第2引数以降は context.arc() とほぼ同じ
	     *
	     * @param {Number} context 対象となる context
	     * @param {Number} x
	     * @param {Number} y
	     * @param {Number} radius
	     * @param {Number} startAngle
	     * @param {Number} endAngle
	     * @param {Boolean} anticlockwise
	     */
	    fill: function(context, x, y, radius, startAngle, endAngle, anticlockwise) {
	        var offsets = this._offsets;
	        var colors = this._colors;

	        var PI = Math.PI;
	        var TWO_PI = PI * 2;

	        if (startAngle < 0) startAngle = startAngle % TWO_PI + TWO_PI;
	        startAngle %= TWO_PI;
	        if (endAngle < 0) endAngle = endAngle % TWO_PI + TWO_PI;
	        endAngle  %= TWO_PI;

	        if (anticlockwise) {
	            // 反時計回り
	            var swap   = startAngle;
	            startAngle = endAngle;
	            endAngle   = swap;

	            colors.reverse();
	            offsets.reverse();
	            offsets.forEach(this._offsetsReverse);
	        }

	        if (
	            startAngle > endAngle ||
	            Math.abs(endAngle - startAngle) < 0.0001 // 誤差の範囲内なら同値とする
	        ) endAngle += TWO_PI;

	        var colorsLength = colors.length; // 色数

	        var currentColorIndex = 0; // 現在の色のインデックス
	        var currentColor = colors[currentColorIndex]; // 現在の色
	        var nextColor    = colors[currentColorIndex]; // 次の色

	        var prevOffset = 0; // 前のオフセット値
	        var currentOffset = offsets[currentColorIndex]; // 現在のオフセット値
	        var offsetDist = currentOffset - prevOffset; // オフセットの差

	        var totalAngleDeg = (endAngle - startAngle) * 180 / PI; // 塗る範囲の角度量
	        var stepAngleRad = (endAngle - startAngle) / totalAngleDeg; // 一回の塗りの角度量

	        var arcStartAngle = startAngle; // ループ内での塗りの開始角度
	        var arcEndAngle; // ループ内での塗りの終了角度

	        var r1 = currentColor[0], g1 = currentColor[1], b1 = currentColor[2], a1 = currentColor[3];
	        var r2 = nextColor[0],    g2 = nextColor[1],    b2 = nextColor[2],    a2 = nextColor[3];
	        if (!a1 && a1 !== 0) a1 = 1;
	        if (!a2 && a2 !== 0) a2 = 1;
	        var rd = r2 - r1, gd = g2 - g1, bd = b2 - b1, ad = a2 - a1;
	        var t, r, g, b, a;

	        context.save();
	        for (var i = 0, n = 1 / totalAngleDeg; i < 1; i += n) {
	            if (i >= currentOffset) {
	                // 次の色へ
	                currentColorIndex++;

	                currentColor = nextColor;
	                r1 = currentColor[0]; g1 = currentColor[1]; b1 = currentColor[2]; a1 = currentColor[3];
	                if (!a1 && a1 !== 0) a1 = 1;

	                nextColor = colors[currentColorIndex];
	                r2 = nextColor[0]; g2 = nextColor[1]; b2 = nextColor[2]; a2 = nextColor[3];
	                if (!a2 && a2 !== 0) a2 = 1;

	                rd = r2 - r1; gd = g2 - g1; bd = b2 - b1; ad = a2 - a1;

	                prevOffset = currentOffset;
	                currentOffset = offsets[currentColorIndex];
	                offsetDist = currentOffset - prevOffset;
	            }

	            t = (i - prevOffset) / offsetDist;
	            r = (rd * t + r1) & 255;
	            g = (gd * t + g1) & 255;
	            b = (bd * t + b1) & 255;
	            a = ad * t + a1;

	            arcEndAngle = arcStartAngle + stepAngleRad;

	            // 扇状に塗っていく
	            context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	            context.beginPath();
	            context.moveTo(x, y);
	            context.arc(x, y, radius, arcStartAngle - 0.02, arcEndAngle, false); // モアレが出ないよう startAngle を少し手前から始める
	            context.closePath();
	            context.fill();

	            arcStartAngle += stepAngleRad;
	        }
	        context.restore();

	        return this;
	    }
	};

	window.ConicalGradient = ConicalGradient;
})( window );
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

// Video.js CoreObject for a quick and dirty inheritance method.
	/////////////////////////////////

	var obj = {};
	obj.create = Object.create || function(obj){
		//Create a new function called 'F' which is just an empty object.
		function F() {}

		//the prototype of the 'F' function should point to the
		//parameter of the anonymous function.
		F.prototype = obj;

		//create a new constructor function based off of the 'F' function.
		return new F();
	};

	var CoreObject = function(){};
	/**
	* Create a new object that inherits from this Object
	*
	*     var Animal = CoreObject.extend();
	*     var Horse = Animal.extend();
	*
	* @param {Object} props Functions and properties to be applied to the new object's prototype
	* @return {CoreObject} An object that inherits from CoreObject
	* @this {*}
	*/
	CoreObject.extend = function(props){
		var init, subObj;

		props = props || {};
		init = props['init'] || props.init || this.prototype['init'] || this.prototype.init || function(){};
		subObj = function(){
			init.apply(this, arguments);
		};

		subObj.prototype = obj.create(this.prototype);
		subObj.prototype.constructor = subObj;

		// Make the class extendable
		subObj.extend = CoreObject.extend;
		// Make a function for creating instances
		subObj.create = CoreObject.create;

		// Extend subObj's prototype with functions and other properties from props
		for (var name in props) {
			if (props.hasOwnProperty(name)) {
				subObj.prototype[name] = props[name];
			}
		}

		return subObj;
	};

	/**
	* Create a new instace of this Object class
	*
	*     var myAnimal = Animal.create();
	*
	* @return {CoreObject} An instance of a CoreObject subclass
	* @this {*}
	*/
	CoreObject.create = function(){
		// Create a new object that inherits from this object's prototype
		var inst = obj.create(this.prototype);

		// Apply this constructor function to the new object
		this.apply(inst, arguments);

		// Return the new object
		return inst;
	};



	var x = 0;
	var GradientCanvas = CoreObject.extend( {
		init: function( $element, $scope, restrictX ) {

			// this.type = type;
			// this.restrictX = restrictX;
			this.offset = {
				x: null,
				y: null
			};
			// Colors values are 0-255, thus we need the height to be 255.
			this.height = 256;

			this.type = this.type || "gCanvas";

			this.id = 'gCanvas('+ this.type + ')_' + ( ++x ) + '_' + Date.now();

			// The element
			this.$element = $element;
			this.$element.prop('id', this.id );

			// The current scope.  Mainly used for firing events
			this.$scope = $scope;

			// The canvas, the context, and the marker.
			this.canvas = this.$element.children()[0];
			this.context = this.canvas.getContext('2d');

			this.marker = this.$element.children()[1];

			// The current color.
			//this.color = $scope.data.color || tinycolor('#f00');

			// Set the dimensions
			this.$element.css({'height': this.height + 'px'});
			this.canvas.height = this.height;
			this.canvas.width = this.height;

			//console.log("G CANVAS INIT", this, this.$scope );

			this.boundEvents = {
				onMouseDown: angular.bind( this, this.onMouseDown ),
				mouseMove: angular.bind( this, this.onMouseMove ),
				onColorSet: angular.bind( this, this.onColorSet ),
				draw: angular.bind( this, this.draw )
			};

			// Events
			this.$element.on( 'touchstart mousedown', this.boundEvents.onMouseDown );
		//	this.$scope.$on( 'mdColorPicker:colorSet', this.boundEvents.onColorSet );

			this.$scope.data.hsva = this.$scope.data.hsva || this.$scope.data.color.toHsv();
			if ( this.$scope.data.hsva.a === undefined ) {
				this.$scope.data.hsva.a = this.$scope.data.color.getAlpha();
			}
			var initialValueWatch = this.$scope.$watch('data.color', angular.bind( this, function(color) {
				if ( color === undefined ) {
					return;
				}
				this.$scope.data.hsva.h = color.toHsv().h;
				initialValueWatch();
			 } ), true );
			 this.$scope.$watch('data.color', this.boundEvents.onColorSet, true );
		}
	});
	GradientCanvas.prototype.$window = angular.element( window );

	GradientCanvas.prototype.applyHueLock = false;

	/**
	 * GradientCanvas.prototype.draw - Overwrite this in sub class.  Will fill with a "troublesome pink"
	 *
	 * @return {type}  description
	 */
	GradientCanvas.prototype.draw = function() {
		this.context.fillStyle = '#ff00ff';
		this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );
	};


	/**
	 * GradientCanvas.prototype.getColorByMouse - Returns the color under the mouse.
	 *
	 * @param  {Event} e Mouse or Touch Event
	 * @return {Color}
	 */
	GradientCanvas.prototype.getMouseCoordinates = function( e ) {

		var te =  e.touches && e.touches[0];

		var pageX = te && te.clientX || e.clientX;
		var pageY = te && te.clientY || e.clientY;

		console.log( e, pageX, this.offset.x );
		var x = Math.round( pageX - this.offset.x );
		var y = Math.round( pageY - this.offset.y );

		return this.adjustXY( x, y );
	};

	GradientCanvas.prototype.getColorByPoint = function( x, y ) {
		// Stub
	};

	GradientCanvas.prototype.onMouseDown = function( e ) {

		// Prevent highlighting
		e.preventDefault();
		e.stopImmediatePropagation();

		this.$scope.previewUnfocus();

		this.$element.css({ 'cursor': 'none' });

		this.offset.x = this.canvas.getBoundingClientRect().left;
		this.offset.y = this.canvas.getBoundingClientRect().top;

		this.$window.on('touchmove mousemove', this.boundEvents.mouseMove );
		this.$window.one('touchend mouseup', angular.bind(this, function (e) {
			this.$window.off('touchmove mousemove', this.boundEvents.mouseMove);
			this.$element.css({ 'cursor': 'crosshair' });
		}));

		// Set the color on click ( mouse down )
		this.onMouseMove( e );
	};

	GradientCanvas.prototype.onMouseMove = function( e ) {
		var coords = this.getMouseCoordinates( e );
		var color = this.getColorByPoint( coords.x, coords.y );

		this.$scope.$apply( angular.bind( this, function() {
			this.$scope.data.color = tinycolor( color );
			this.$scope.data.color.setAlpha( color.a );
			this.$scope.data.hsva = color;
			console.log( this.$scope.data.hsva.h );
		}));

		this.setMarkerCenter( coords.x, coords.y );
	};

	GradientCanvas.prototype.setMarkerCenter = function( x, y ) {

		var xOffset = -1 * this.marker.offsetWidth / 2;
		var yOffset = -1 * this.marker.offsetHeight / 2;
		var xAdjusted, xFinal, yAdjusted, yFinal;

		if ( y === undefined ) {
			y = x;
			x = 0;
		}

		var coords = this.adjustXY( x, y );
		x = coords.x;
		y = coords.y;

		xAdjusted = x + xOffset;
		yAdjusted = y + yOffset;

		if ( y === undefined || this.ignoreX ) {
			xFinal = 0;
			yFinal = Math.round( Math.max( Math.min( this.height-1 + yOffset, yAdjusted), yOffset ) );
			// Debug output
			// console.log( "Raw: ", x+','+y, "Adjusted: ", xAdjusted + ',' + yAdjusted, "Final: ", xFinal + ',' + yFinal );
		} else {
			xFinal = Math.floor( Math.max( Math.min( this.height + xOffset, xAdjusted ), xOffset ) );
			yFinal = Math.floor( Math.max( Math.min( this.height + yOffset, yAdjusted ), yOffset ) );
		}

		angular.element(this.marker).css({'left': xFinal + 'px' });
		angular.element(this.marker).css({'top': yFinal + 'px'});
	};

	GradientCanvas.prototype.getMarkerCenter = function() {
		var returnObj = {
			x: this.marker.offsetLeft + ( Math.floor( this.marker.offsetWidth / 2 ) ),
			y: this.marker.offsetTop + ( Math.floor( this.marker.offsetHeight / 2 ) )
		};
		return returnObj;
	};

	GradientCanvas.prototype.getImageData = function( x, y ) {
		// Stub
	};

	GradientCanvas.prototype.adjustXY = function( x, y ) {
		x = Math.max( 0, Math.min( x, this.canvas.width ) );
		y = Math.max( 0, Math.min( y, this.canvas.height ) );

		return { x: x, y: y };
	};






	var HueGradientCanvas =  GradientCanvas.extend({
		init: function ($element, color) {
			this.type = 'hue';
			this.ignoreX = true;

			GradientCanvas.apply( this, arguments );

			this.draw();
		},
		draw: function() {
			// Create gradient
			var hueGrd = this.context.createLinearGradient(90, 0.000, 90, this.height);

			// Add colors
			hueGrd.addColorStop(0,      'rgba(255, 0, 0, 1.000)');
			hueGrd.addColorStop(1/6,    'rgba(255, 255, 0, 1.000)');
			hueGrd.addColorStop(2/6,    'rgba(0, 255, 0, 1.000)');
			hueGrd.addColorStop(3/6,    'rgba(0, 255, 255, 1.000)');
			hueGrd.addColorStop(4/6,    'rgba(0, 0, 255, 1.000)');
			hueGrd.addColorStop(5/6,    'rgba(255, 0, 255, 1.000)');
			hueGrd.addColorStop(1,      'rgba(255, 0, 0, 1.000)');

			// Fill with gradient
			this.context.fillStyle = hueGrd;
			this.context.fillRect( 0, 0, this.canvas.width, this.height );
		},
		getColorByPoint: function( x, y ) {
			var currentHSV = this.$scope.data.color.toHsv();
			var h = 360 * ( y / this.height );
			var s = currentHSV.s;
			var v = currentHSV.v;
			var a = this.$scope.data.color.getAlpha();

			return {
				h: h,
				s: s,
				v: v,
				a: a
			};
		},
		onColorSet: function( e, args ) {
			var hue = this.$scope.data.hsva.h || this.$scope.data.color.toHsv().h;
			this.setMarkerCenter( this.canvas.height * ( hue / 360 ) );
		}

	});



	var AlphaGradientCanvas = GradientCanvas.extend({
		init: function( $element, $scope ) {
			this.type = 'alpha';
			this.ignoreX = true;

			GradientCanvas.apply( this, arguments );

			this.$scope.$watch( 'data.color', this.boundEvents.draw, true );
		},

		draw: function ()  {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

			// Create gradient
			var hueGrd = this.context.createLinearGradient(90, 0.000, 90, this.height);
			var colorRGB = this.$scope.data.color.toRgb();

			// Add colors
			hueGrd.addColorStop(0,	'rgba(' + colorRGB.r + ',' + colorRGB.g + ',' + colorRGB.b + ', 1.000)');
			hueGrd.addColorStop(1,	'rgba(' + colorRGB.r + ',' + colorRGB.g + ',' + colorRGB.b + ', 0.000)');

			// Fill with gradient
			this.context.fillStyle = hueGrd;
			this.context.fillRect( 0, 0, this.canvas.width, this.height );
		},
		getColorByPoint: function( x, y ) {
			var currentHSV = this.$scope.data.color.toHsv();
			var h = currentHSV.h;
			var s = currentHSV.s;
			var v = currentHSV.v;
			var a = ( this.height - y ) / this.height;

			return {
				h: h,
				s: s,
				v: v,
				a: a
			};
		},
		onColorSet: function( e, args ) {
			//console.log('alpha onColorSet', this.$scope.data.color);
			//this.draw();

			var alpha = this.$scope.data.color.getAlpha();
			this.$scope.data.hsva.a = alpha;
			var pos = this.canvas.height - ( this.canvas.height * alpha );

			this.setMarkerCenter( pos );
		}
	});


	var SpectrumGradientCanvas = GradientCanvas.extend({
		init: function( $element, $scope ) {
			this.type = 'spectrum';

			GradientCanvas.apply( this, arguments );

		},
		draw: function() {
			console.log("DRAWING SPECTRUM!");
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);


			// White gradient
			var whiteGrd = this.context.createLinearGradient(0, 0, this.canvas.width, 0);


			whiteGrd.addColorStop(0.01, 'rgba(255, 255, 255, 1.000)');
			whiteGrd.addColorStop(0.99, 'rgba(255, 255, 255, 0.000)');

			// Black Gradient
			var blackGrd = this.context.createLinearGradient(0, 0, 0, this.canvas.height);


			blackGrd.addColorStop(0.01, 'rgba(0, 0, 0, 0.000)');
			blackGrd.addColorStop(0.99, 'rgba(0, 0, 0, 1.000)');

			// Fill with solid
			console.log( "DRAW HUE", this.$scope.data );
			this.context.fillStyle = 'hsl( ' + this.$scope.data.hsva.h + ', 100%, 50%)';
			this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );

			// Fill with white
			this.context.fillStyle = whiteGrd;
			this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );

			// Fill with black
			// Odd bug prevented selecting min, max ranges from all gradients
			this.context.fillStyle = blackGrd;
			this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );
		},
		getColorByPoint: function( x, y ) {
			var currentHSV = this.$scope.data.color.toHsv();
			var h = this.$scope.data.hsva.h;
			var s =  x / this.height;
			var v = ( this.height - y ) / this.height;
			var a = this.$scope.data.hsva.a;

			return {
				h: h,
				s: s,
				v: v,
				a: a
			};
		},
		onColorSet: function( e, args ) {
			console.log( 'SET SPECTRUM COLOR', this.$scope.data );
			var hsv = this.$scope.data.color.toHsv();
			this.currentHue = this.$scope.data.hsva.h || hsv.h;
			this.draw();

			var posX = this.canvas.width * hsv.s;
			var posY = this.canvas.height - ( this.canvas.height * hsv.v );

			this.setMarkerCenter( posX, posY );
		},
		setColor: function( color ) {
			this.draw();
		}
	});





	var WheelGradientCanvas = SpectrumGradientCanvas.extend({
		init: function( $element, $scope ) {
			this.gray = 255;
			this.type = 'wheel';

			GradientCanvas.apply( this, arguments );

			// Initial (and only) drawing
			this.draw();
		},
		draw: function() {
			this.context.clearRect(0, 0, this.width, this.height);

			var r = this.height / 2;

			var PI = Math.PI;
			var TWO_PI = PI * 2;

			new ConicalGradient()
				.addColorStop(0    , [255, 0, 0])		// Red
				.addColorStop(1 / 6, [255, 255, 0])		// Yellow
				.addColorStop(2 / 6, [0, 255, 0])		// Green
				.addColorStop(3 / 6, [0, 255, 255])		// Cyan
				.addColorStop(4 / 6, [0, 0, 255])		// Blue
				.addColorStop(5 / 6, [255, 0, 255])		// Violet
				.addColorStop(1    , [255, 0, 0])		// Red
				.fill( this.context, r, r, r, ( PI / 180 ), ( PI / 180 ), false);

			console.log( "DRAW WHEEL", this.$scope.data );
			var grayValueString = '255,255,255'; //'' + grayValue + ',' + grayValue + ',' + grayValue;
			var centerGradient = this.context.createRadialGradient( r, r, r, r, r, 0 );
			centerGradient.addColorStop( 0, 'rgba( 255,255,255, 0 )' );
			centerGradient.addColorStop( 1, 'rgba( 255,255,255, 1 )' );

			this.context.fillStyle = centerGradient;
			this.context.fillRect( 0, 0, this.height, this.height );

		},

		getColorByPoint: function( x, y ) {
			var adjusted = this.adjustXY(x, y);

			var PI = Math.PI;

			var xCart = adjusted.x - ( this.height / 2 );
			var yCart = adjusted.y - ( this.height / 2 );

			var s = Math.min( 1, Math.sqrt( xCart * xCart + yCart * yCart ) / ( this.height / 2 ) ) ;

			var h = Math.atan2( yCart, xCart ) * ( 180 / PI );

			// atan2 works in -180..180 so we need to recitify the negatives
			h = (h > 0 ? h : 360 + h);

			var v = this.$scope.data.hsva.v;
			var a = this.$scope.data.hsva.a;

			return {
				h: h,
				s: s,
				v: v,
				a: a
			};

		},

		/**
		 * adjustXY - Limit the mouse coordinates to with in the wheel.
		 *
		 * @param  {Int} x description
		 * @param  {Int} y description
		 * @return {Object}
		 */
		adjustXY: function( x, y ) {
			var radius = this.height / 2;
			var scale = radius;

			// Plot the values on a cartesian plane
			var xCart = x - radius;// * radius;
			var yCart = y - radius;// * radius;

			// Get the absolute values for comparison
			var xCartAbs = Math.abs( xCart );
			var yCartAbs = Math.abs( yCart );

			// Get the radius of the cartesian plot
			var radiusCart = Math.min( this.height / 2, Math.sqrt( xCart * xCart + yCart * yCart ));

			var xAdjusted = x;
			var yAdjusted = y;

			// Calculate the angle of the cartesian plot
			if ( radiusCart >= radius ) {
				var theta = Math.atan2( yCart, xCart );

				// Get the new x,y plot inside the circle using the adjust radius from above
				var xCoord = radius * Math.cos( theta );
				var yCoord = radius * Math.sin( theta );

				// Center in SVG
				xAdjusted = xCoord + radius;
				yAdjusted = yCoord + radius;
			}

			return { x: xAdjusted, y: yAdjusted };
		},
		onColorSet: function( e, args ) {
			var hsv = this.$scope.data.hsva;
			var hsl = this.$scope.data.color.toHsl();

			var hue = hsv.h;
			var sat = hsv.s;
			var val = hsv.v;

			var PI = Math.PI;
			var TWO_PI = PI * 2;

			var radius = ( this.height / 2 ) * hsv.s;

			// Calculate the angle of the cartesian plot
			var theta = hue * ( PI / 180 );

			// Get the new x,y plot inside the circle using the adjust radius from above
			var xCoord = radius * Math.cos( theta );
			var yCoord = radius * Math.sin( theta );

			xCoord = xCoord + this.height / 2;
			yCoord = yCoord + this.height / 2;

			//this.draw();
			this.setMarkerCenter( xCoord, yCoord );

		//	this.$scope.$emit('mdColorPicker:wheelChange', { color: this.color });
		},
		setColor: function( color ) {
			console.log( 'wheel', color );

			//this.$scope.$broadcast('mdColorPicker:colorChange', { color: color });
		}
	});



	var ValueGradientCanvas = GradientCanvas.extend({
		init: function ($element, $scope) {

			this.type = 'value';
			this.ignoreX = true;

			GradientCanvas.apply( this, arguments );

			this.$scope.$watch( 'data.color', this.boundEvents.draw, true );
		},
		draw: function() {
			this.context.clearRect(0, 0, this.width, this.height);

			// Create gradient
			var grayGrd = this.context.createLinearGradient(90, 0.000, 90, this.height);
			var hsv = this.$scope.data.hsva;
			var color = tinycolor({ h: hsv.h, s: hsv.s, v: 100});

			// Add colors
			grayGrd.addColorStop(0,	color.toRgbString());
			grayGrd.addColorStop(1, 	'rgba(0,0,0,1)');

			// Fill with gradient
			this.context.fillStyle = grayGrd;
			this.context.fillRect( 0, 0, this.canvas.width, this.height );

		},
		getColorByPoint: function( x, y ) {
			var h = this.$scope.data.hsva.h;
			var s = this.$scope.data.hsva.s;
			var v = ( this.height - y ) / this.height;
			var a = this.$scope.data.hsva.a;

			return {
				h: h,
				s: s,
				v: v,
				a: a
			};
		},
		onColorSet: function( e, args ) {
			console.log( "DATA.COLOR CHANGE... setting", this.$scope.data.color.toHsv(), this.$element, e, args, arguments);
			this.draw();

			var hsv = this.$scope.data.color.toHsv();
			this.$scope.data.hsva.v = hsv.v;
			
			var y = this.canvas.height - ( this.canvas.height * hsv.v );
			this.setMarkerCenter( y );
		}
	});






	function GradientCanvasFactory(  ) {


		return function(canvasConstructor) {
			return {
				template: '<canvas width="100%" height="100%"></canvas><div class="md-color-picker-marker"></div>',
				link: function( $scope, $element, $attrs ) {
					// Create new instance of the gradient so the same gradient canvases can be used on separate tabs.
					var gCanvas = new canvasConstructor( $element, $scope );
					console.log( $scope );
				}
			};
		};

	}

	angular.module('mdColorPickerGradientCanvas',[])
 		.factory('mdColorGradientCanvas', GradientCanvasFactory )
 		.directive( 'mdColorPickerHue', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas( HueGradientCanvas ); }])
 		.directive( 'mdColorPickerAlpha', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas( AlphaGradientCanvas ); }])
 		.directive( 'mdColorPickerSpectrum', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas( SpectrumGradientCanvas); }])
 		.directive( 'mdColorPickerWheel', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas( WheelGradientCanvas); }])
		.directive( 'mdColorPickerValue', ['mdColorGradientCanvas', function( mdColorGradientCanvas ) { return new mdColorGradientCanvas( ValueGradientCanvas); }])




	;
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

angular.module('mdColorPicker')
		.config(['$mdColorPickerConfigProvider', function( $mdColorPickerConfig ) {



			var genericPalette = {
				name: 'genericPalette',
				icon: 'view_module.svg',
				template: '<div layout="column" layout-align="space-between start center" flex class="md-color-picker-palette"></div>',//'tabs/colorSliders.tpl.html',
				link: function( $scope, $element ) {
					console.log( "LINK GENERICA PALETTE", this  );
					var paletteContainer = angular.element( $element[0].querySelector('.md-color-picker-palette') );
					var paletteRow = angular.element('<div class="flex-15 layout-row layout-align-space-between" layout-align="space-between" layout="row" style="width: 100%;"></div>');
					var paletteCell = angular.element('<div class="flex-10"></div>');
					var materialTitle = angular.element('<div class="md-color-picker-material-title"></div>');
					var materialRow = angular.element('<div class="md-color-picker-with-label"></div>');

					var vm = this;
					var drawTimeout;



					$scope.$watch( angular.bind( vm, function() { return vm.palette; }), angular.bind( vm, function( newVal, oldVal ) {
						console.log( "NEW GENERIC PALETTE", newVal );
						if ( newVal && ( !oldVal || !angular.equals( newVal, oldVal ) )  ) {
							// Debounce the value so we don't do thise 100 times a second.
							clearTimeout( drawTimeout );
							drawTimeout = setTimeout( angular.bind( this, function() {
								this.palette = newVal;
								this.drawPalette();
							}), 500 );
						}
					}), true );


					this.drawn = [];

					this.removePalette = function() {
						// Remove all rows and unbind cells
						if ( this.drawn.length ) {
							var cells;
							var row;
							while( row = this.drawn.pop() ) {
								cells = row.children();

								for( var y = 0; y < cells.length; y ++ ) {
									var cell = angular.element( cells[y] );
									cell.unbind( 'click' );
									cell.remove();
								}
								row.remove();
							}
						}
					};

					this.drawPalette = function() {
						this.removePalette();
						console.log( "GENERICA PALETTE DRAW", paletteContainer );

						// Add new rows and bind cells
						angular.forEach(this.palette, function( value, key ) {
							var row = paletteRow.clone();
							this.drawn.push( row );
							angular.forEach( value, function( color ) {
								var cell = paletteCell.clone();
								cell.css({
									height: '25.5px',
									backgroundColor: color
								});
								cell.bind('click', angular.bind( this, function( e ) {
									this.setPaletteColor( e, $scope );
								}));

								row.append( cell );
							}, this);

							paletteContainer.append( row );
						}, this);
					};
					console.log( "GENERICA PALETTE INIT");
					this.drawPalette();

					$scope.$on('$destroy', angular.bind( this, function() {
						console.log("Removing Palette on destroy");
						this.removePalette();
					}));
				},
				palette: [
					["rgb(255, 204, 204)","rgb(255, 230, 204)","rgb(255, 255, 204)","rgb(204, 255, 204)","rgb(204, 255, 230)","rgb(204, 255, 255)","rgb(204, 230, 255)","rgb(204, 204, 255)","rgb(230, 204, 255)","rgb(255, 204, 255)"],
					["rgb(255, 153, 153)","rgb(255, 204, 153)","rgb(255, 255, 153)","rgb(153, 255, 153)","rgb(153, 255, 204)","rgb(153, 255, 255)","rgb(153, 204, 255)","rgb(153, 153, 255)","rgb(204, 153, 255)","rgb(255, 153, 255)"],
					["rgb(255, 102, 102)","rgb(255, 179, 102)","rgb(255, 255, 102)","rgb(102, 255, 102)","rgb(102, 255, 179)","rgb(102, 255, 255)","rgb(102, 179, 255)","rgb(102, 102, 255)","rgb(179, 102, 255)","rgb(255, 102, 255)"],
					["rgb(255, 51, 51)","rgb(255, 153, 51)","rgb(255, 255, 51)","rgb(51, 255, 51)","rgb(51, 255, 153)","rgb(51, 255, 255)","rgb(51, 153, 255)","rgb(51, 51, 255)","rgb(153, 51, 255)","rgb(255, 51, 255)"],
					["rgb(255, 0, 0)","rgb(255, 128, 0)","rgb(255, 255, 0)","rgb(0, 255, 0)","rgb(0, 255, 128)","rgb(0, 255, 255)","rgb(0, 128, 255)","rgb(0, 0, 255)","rgb(128, 0, 255)","rgb(255, 0, 255)"],
					["rgb(235, 0, 0)","rgb(235, 118, 0)","rgb(235, 235, 0)","rgb(0, 235, 0)","rgb(0, 235, 118)","rgb(0, 235, 235)","rgb(0, 118, 235)","rgb(0, 0, 235)","rgb(118, 0, 235)","rgb(235, 0, 235)"],
					["rgb(214, 0, 0)","rgb(214, 108, 0)","rgb(214, 214, 0)","rgb(0, 214, 0)","rgb(0, 214, 108)","rgb(0, 214, 214)","rgb(0, 108, 214)","rgb(0, 0, 214)","rgb(108, 0, 214)","rgb(214, 0, 214)"],
					["rgb(163, 0, 0)","rgb(163, 82, 0)","rgb(163, 163, 0)","rgb(0, 163, 0)","rgb(0, 163, 82)","rgb(0, 163, 163)","rgb(0, 82, 163)","rgb(0, 0, 163)","rgb(82, 0, 163)","rgb(163, 0, 163)"],
					["rgb(92, 0, 0)","rgb(92, 46, 0)","rgb(92, 92, 0)","rgb(0, 92, 0)","rgb(0, 92, 46)","rgb(0, 92, 92)","rgb(0, 46, 92)","rgb(0, 0, 92)","rgb(46, 0, 92)","rgb(92, 0, 92)"],
					["rgb(255, 255, 255)","rgb(205, 205, 205)","rgb(178, 178, 178)","rgb(153, 153, 153)","rgb(127, 127, 127)","rgb(102, 102, 102)","rgb(76, 76, 76)","rgb(51, 51, 51)","rgb(25, 25, 25)","rgb(0, 0, 0)"]
				]
			};

			$mdColorPickerConfig.tabs.add( genericPalette, 14 );
			//$mdColorPickerConfig.tabs.order.push( 'genericPalette' );

		}]);
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

angular.module('mdColorPicker')
		.config(['$mdColorPalette', '$mdColorPickerConfigProvider', function( $mdColorPalette, $mdColorPickerConfig ) {

			$mdColorPickerConfig.tabs.add({
				name: 'materialPalette',
				icon: 'view_headline.svg',
				template: '<div layout="column" layout-fill flex class="md-color-picker-material-palette"></div>',
				link: function( $scope, $element ) {
					console.log("Draw material Palette", this.palette );
					var materialContainer = angular.element( $element[0].querySelector('.md-color-picker-material-palette') );
					var materialTitle = angular.element('<div class="md-color-picker-material-title"></div>');
					var materialRow = angular.element('<div class="md-color-picker-with-label"></div>');

					this.drawPalette = function() {
						console.log('Draw Material Palette', this, this.palette );
						angular.forEach(this.palette, function( value, key ) {

							var title = materialTitle.clone();
							title.html('<span>'+key.replace('-',' ')+'</span>');
							title.css({
								height: '75px',
								backgroundColor: value[500]
							});
							if ( $scope.isDark(value['500']) ) {
								title.addClass('dark');
							}

							materialContainer.append( title );

							angular.forEach( value, function( color, label ) {
								if ( /[A\d]/g.test( label ) ) {
									var row = materialRow.clone();
									row.css({
										height: '33px',
										backgroundColor: color
									});
									if ( $scope.isDark(color) ) {
										row.addClass('dark');
									}

									row.html('<span>'+label+'</span>');
									row.on('click', angular.bind( this, function( e ) {
										this.setPaletteColor( e, $scope );
									}));
									materialContainer.append( row );
								}
							}, this);


						}, this);
					};

					this.drawPalette();
				},
				palette: angular.copy( $mdColorPalette )

			}, false);


		}])
		// .run( ['$timeout','$mdColorPickerConfig', function( $timeout, $mdColorPickerConfig ) {
		// 	$timeout( function() {
		// 		$mdColorPickerConfig.tabs.order.push( 'materialPalette' );
		// 	}, 5000, true);
		//
		// 	$timeout( function() {
		// 		var idx = $mdColorPickerConfig.tabs.order.indexOf( 'materialPalette' );
		// 		$mdColorPickerConfig.tabs.order.splice( idx, 1 );
		// 	}, 10000, true);
		// }])
		;
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

angular.module('mdColorPicker')
		.config(['$mdColorPickerHistoryProvider', '$mdColorPickerConfigProvider', function( $mdColorPickerHistory, $mdColorPickerConfig ) {

			$mdColorPickerConfig.tabs.add({
				name: 'historyPalette',
				icon: 'history.svg',
				templateUrl: 'tabs/historyPalette.tpl.html',
				link: function( $scope, $element ) {
					console.log( 'HISTORY PALETTE: ', this.palette );
					var historyContainer = angular.element( $element[0].querySelector('.md-color-picker-history') );
					var paletteRow = angular.element('<div class="flex-15 layout-row" style="width: 100%;"></div>');
					var paletteCell = angular.element('<div class=""><div></div></div>');

					var drawTimeout;
					this.palette = $mdColorPickerHistory.get();

					$scope.$watch( angular.bind( this, function() { return $mdColorPickerHistory.get() } ), angular.bind( this, function( newVal, oldVal ) {
						console.log( 'NEW HISTORY', newVal );
						if ( newVal && ( !oldVal == [] || !angular.equals( newVal, oldVal ) )  ) {

							// Debounce the value so we don't do thise 100 times a second.
							clearTimeout( drawTimeout );
							drawTimeout = setTimeout( angular.bind( this, function() {
								this.palette = newVal;
								this.drawPalette();
							}), 500 );
						}
					}), true );



					this.drawn = [];
					this.drawPalette = function() {
						console.log( "DRAWING HISTORY");
						var row;
						// Remove all rows and unbind cells
						if ( this.drawn.length ) {
							var cells;

							while( row = this.drawn.pop() ) { // jshint ignore:line
								cells = row.children();
								console.log( "REMOVING" );
								for( var y = 0; y < cells.length; y ++ ) {
									var cell = angular.element( cells[y] );
									cell.off( 'click' );
									cell.remove();
								}
								row.remove();
							}
						}

						//var row;// = paletteRow.clone();
						angular.forEach( this.palette, function( color, i ) {

							if ( i % 10 === 0 ) {
								row = paletteRow.clone();
								historyContainer.append( row );
								this.drawn.push( row );
							}

							var cell = paletteCell.clone();
							cell.find('div').css({
								//height: '25.5px',
								backgroundColor: color.toRgbString()
							});
							cell.on('click', angular.bind( this, function( e ) {
								this.setPaletteColor( e, $scope );
							}));

							row.append( cell );
						}, this);

						/*
						<div flex="10" ng-repeat="historyColor in data.history.get() track by $index">
							<div  ng-style="{'background': historyColor.toRgbString()}" ng-click="setPaletteColor($event)"></div>
						</div>
						*/




					};

					this.drawPalette();
				},
				palette: $mdColorPickerHistory.get()

			}, 2 );
			//$mdColorPickerConfig.tabs.order.push( 'historyPalette' );

		}]);
}(window, window.angular, window.tinycolor));

;(function(window, angular, TinyColor, undefined) {
"use strict";

angular.module("mdColorPicker").run(["$templateCache", function($templateCache) {$templateCache.put("mdColorPicker.tpl.html","<div class=\"md-color-picker-input-container\" layout=\"row\">\n	<div class=\"md-color-picker-preview md-color-picker-checkered-bg\" ng-click=\"showColorPicker($event)\" ng-if=\"mdColorPreview\">\n		<div class=\"md-color-picker-result\" ng-style=\"{background: value}\"></div>\n	</div>\n    <md-input-container flex>\n        <label><md-icon ng-if=\"icon\">{{icon}}</md-icon>{{label}}</label>\n        <input type=\"input\" ng-model=\"value\" class=\'md-color-picker-input\'  ng-mousedown=\"(openOnInput || !mdColorPreview) && showColorPicker($event)\" ng-required=\"mdColorRequired\" />\n\n    </md-input-container>\n	<md-button class=\"md-icon-button md-color-picker-clear\" ng-if=\"mdColorClearButton && value\" ng-click=\"clearValue();\" aria-label=\"Clear Color\">\n		<md-icon md-svg-icon=\"clear.svg\"></md-icon>\n	</md-button>\n</div>\n");
$templateCache.put("mdColorPickerContainer.tpl.html","<div class=\"md-color-picker-container in\" layout=\"column\">\n	<div class=\"md-color-picker-arrow\" ng-style=\"{\'border-bottom-color\': data.color.toRgbString() }\"></div>\n\n	<div class=\"md-color-picker-preview md-color-picker-checkered-bg\" ng-class=\"{\'dark\': !data.color.isDark() || data.color.getAlpha() < .45}\" flex=\"1\" layout=\"column\">\n\n		<div class=\"md-color-picker-result\" ng-style=\"{\'background\': data.color.toRgbString()}\" flex=\"100\" layout=\"column\" layout-fill layout-align=\"center center\" ng-click=\"focusPreviewInput( $event )\">\n			<!--<span flex  layout=\"column\" layout-align=\"center center\">{{value}}</span>-->\n			<div flex  layout=\"row\" layout-align=\"center center\">\n				<input class=\"md-color-picker-preview-input\" type=\"text\" ng-model=\"value\" ng-model-options=\"{updateOn: \'blur\'}\"  />\n			</div>\n			<div class=\"md-color-picker-tabs\" style=\"width: 100%\">\n				<md-tabs md-selected=\"config.selectedNotation\" md-stretch-tabs=\"always\" md-no-bar md-no-ink md-no-pagination=\"true\" >\n					<md-tab ng-repeat=\"notation in config.notations.get()\"  ng-disabled=\"notation.disabled(data.color)\" label=\"{{notation.name}}\"></md-tab>\n				</md-tabs>\n			</div>\n		</div>\n	</div>\n\n	<div class=\"md-color-picker-tabs md-color-picker-colors\">\n		<md-tabs md-stretch-tabs=\"always\" md-align-tabs=\"bottom\" md-selected=\"config.currentTab\" md-no-pagination>\n			<md-tab ng-repeat=\"tabName in config.tabOrder\">\n				<md-tab-label>\n					<md-icon md-svg-icon=\"{{ config.tabs[ tabName ].icon }}\"></md-icon>\n				</md-tab-label>\n				<md-tab-body>\n					<div layout=\"row\" layout-align=\"space-between\" style=\"height: 255px\">\n						<!-- Tab Template will be added here -->\n					</div>\n				</md-tab-body>\n			</md-tab>\n\n		</md-tabs>\n	</div>\n\n</div>\n");
$templateCache.put("mdColorPickerDialog.tpl.html","<md-dialog class=\"md-color-picker-dialog\">\n	<div md-color-picker-container\n		ng-model=\"value\"\n		default=\"{{defaultValue}}\"\n		random=\"{{random}}\"\n		ok=\"ok\"\n		md-color-alpha-channel=\"mdColorAlphaChannel\"\n		md-color-spectrum=\"mdColorSpectrum\"\n		md-color-sliders=\"mdColorSliders\"\n		md-color-generic-palette=\"mdColorGenericPalette\"\n		md-color-material-palette=\"mdColorMaterialPalette\"\n		md-color-history=\"mdColorHistory\"\n		md-color-hex=\"mdColorHex\"\n		md-color-rgb=\"mdColorRgb\"\n		md-color-hsl=\"mdColorHsl\"\n		md-color-default-tab=\"mdColorDefaultTab\"\n	></div>\n	<md-actions layout=\"row\">\n		<md-button class=\"md-mini\" ng-click=\"close()\" style=\"width: 50%;\">Cancel</md-button>\n		<md-button class=\"md-mini\" ng-click=\"ok()\" style=\"width: 50%;\">Select</md-button>\n	</md-actions>\n</md-dialog>\n");
$templateCache.put("mdColorPickerPanel.tpl.html","\n	<div md-color-picker-container\n		ng-model=\"value\"\n		default=\"{{defaultValue}}\"\n		random=\"::random\"\n		ok=\"ok\"\n		md-color-alpha-channel=\"mdColorAlphaChannel\"\n		md-color-spectrum=\"mdColorSpectrum\"\n		md-color-sliders=\"mdColorSliders\"\n		md-color-generic-palette=\"mdColorGenericPalette\"\n		md-color-material-palette=\"mdColorMaterialPalette\"\n		md-color-history=\"mdColorHistory\"\n		md-color-hex=\"mdColorHex\"\n		md-color-rgb=\"mdColorRgb\"\n		md-color-hsl=\"mdColorHsl\"\n		md-color-default-tab=\"mdColorDefaultTab\"\n	></div>\n	<div layout=\"row\">\n		<md-button class=\"md-mini\" ng-click=\"close()\" style=\"width: 50%;\">Cancel</md-button>\n		<md-button class=\"md-mini\" ng-click=\"ok()\" style=\"width: 50%;\">Select</md-button>\n	</div>\n");
$templateCache.put("tabs/colorSliders.tpl.html","<div layout=\"column\" flex=\"100\" layout-fill layout-align=\"space-between start center\" class=\"md-color-picker-sliders\">\n	<div layout=\"row\" layout-align=\"start center\" layout-wrap flex layout-fill>\n		<div flex=\"10\" layout layout-align=\"center center\">\n			<span class=\"md-body-1\">R</span>\n		</div>\n		<md-slider flex=\"65\" min=\"0\" max=\"255\" ng-model=\"data.color._r\" aria-label=\"red\" class=\"red-slider\"></md-slider>\n		<span flex></span>\n		<div flex=\"20\" layout layout-align=\"center center\">\n			<input style=\"width: 100%;\" min=\"0\" max=\"255\" step=\"1\" type=\"number\" ng-model=\"data.color._r\" aria-label=\"red\" aria-controls=\"red-slider\">\n		</div>\n	</div>\n	<div layout=\"row\" layout-align=\"start center\" layout-wrap flex layout-fill>\n		<div flex=\"10\" layout layout-align=\"center center\">\n			<span class=\"md-body-1\">G</span>\n		</div>\n		<md-slider flex=\"65\" min=\"0\" max=\"255\" ng-model=\"data.color._g\" aria-label=\"green\" class=\"green-slider\"></md-slider>\n		<span flex></span>\n		<div flex=\"20\" layout layout-align=\"center center\">\n			<input style=\"width: 100%;\" min=\"0\" max=\"255\" step=\"1\" type=\"number\" ng-model=\"data.color._g\" aria-label=\"green\" aria-controls=\"green-slider\">\n		</div>\n	</div>\n	<div layout=\"row\" layout-align=\"start center\" layout-wrap flex layout-fill>\n		<div flex=\"10\" layout layout-align=\"center center\">\n			<span class=\"md-body-1\">B</span>\n		</div>\n		<md-slider flex=\"65\" min=\"0\" max=\"255\" ng-model=\"data.color._b\" aria-label=\"blue\" class=\"blue-slider\"></md-slider>\n		<span flex></span>\n		<div flex=\"20\" layout layout-align=\"center center\" >\n			<input style=\"width: 100%;\" min=\"0\" max=\"255\" step=\"1\" type=\"number\" ng-model=\"data.color._b\" aria-label=\"blue\" aria-controls=\"blue-slider\">\n		</div>\n	</div>\n	<div layout=\"row\" layout-align=\"start center\" layout-wrap flex layout-fill ng-if=\"!config.options.useAlpha\">\n		<div flex=\"10\" layout layout-align=\"center center\">\n			<span class=\"md-body-1\">A</span>\n		</div>\n		<md-slider flex=\"65\" min=\"0\" max=\"1\" step=\".01\" ng-model=\"data.color._a\" aria-label=\"alpha\" class=\"md-primary\"></md-slider>\n		<span flex></span>\n		<div flex=\"20\" layout layout-align=\"center center\" >\n			<input style=\"width: 100%;\" min=\"0\" max=\"1\" step=\".01\" type=\"number\" ng-model=\"data.color._a\" aria-label=\"alpha\" aria-controls=\"alpha-slider\">\n		</div>\n	</div>\n</div>\n");
$templateCache.put("tabs/historyPalette.tpl.html","<div layout=\"column\" flex layout-align=\" start\" layout-wrap layout-fill class=\"md-color-picker-history\">\n\n\n	<md-button flex-end ng-click=\"data.history.reset()\" class=\"md-mini md-icon-button md-raised md-accent\" aria-label=\"Clear History\">\n		<md-icon md-svg-icon=\"clear_all.svg\"></md-icon>\n	</md-button>\n</div>\n");}]);
}(window, window.angular, window.tinycolor));
