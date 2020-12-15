var Dom = {
	currency: function(str) {
		return '$'+Dom.numberFormat(parseFloat((parseFloat(str)).toFixed(10)),2);
	},

	e : function(value, parent) {
		if(parent != null) {
			if (Dom.exists(value)) {
				return parent.querySelector(value);
			}
		}
		else {
			if (Dom.exists(value)) {
				return document.querySelector(value);
			}
		}			
	},

	eAll : function(value, parent) {
		if(parent != null)
			return parent.querySelectorAll(value);
		else
			return document.querySelectorAll(value);
	},

	/*
	tag: 'div', 
	args: {class:'class-name', text:'Text', html:'<b></b>', id:'theId', onclick:function(){}, etc}
	child elements can be added with the third and on arguments. 
	ce('div', {id:'id1'}, 
		ce('span'), 
		ce('b'), 
		ce('p', {}, 
			ce('b')
		)
	),
	arrayList.map(function(item, key) {
		return ce('div', {class:'item'}, 'Hello '+key);
	}
	
	Use the map prototype to loop over array and output an element for each
	
	For checkboxes and radio buttons, args: {value:'Yes', checked:'Yes'} that will output <input type="checkbox" value="Yes" checked="checked">
	
	For select menus options, args: {value:'Pizza', selected:'Pizza'} that will output <option value="Pizza" selected="selected">
	For text nodes: ce('text', 'Hello World!')
	
	For just text inside tag: ce('div', 'Hello World!')
	
	Use the key array with the value of your array. Use the string 'array:' and your object key to put the value of it in the property.

	For binding the state to an element set the property equal to a string with curly braces with the state key inside.  
	value:'{stateKey}'
	You also need to pass in the state object using the state key like: state:state
	ce('input', {state:ClassName.state, type:'tel', required:'', placeholder:'Phone Number', id:'editPhone', value:'{phone}'})
	*/
	ce: function(tag, args) {
		var startElements = 2;
		var state = {};
		var stateValue = null;
		if (tag == 'text') { 
			var ele = document.createTextNode(args); 
		} else {
			var ele = document.createElement(tag);
			if (typeof args !== 'undefined' && [1,3].includes(args.nodeType)) {
				startElements = 1;
			} else if (typeof args === 'object') {									
				for (var key in args) {
					if (typeof args[key] === 'string' && args[key].match("^{") && args[key].match("}$")) {
						if (/^on/.test(key) == true) {
							var keyAndProp = args[key].substring(1,args[key].length-1);
							var keyAndPropParts = keyAndProp.split(":");
							var stateKey = keyAndPropParts[0];
							var property = keyAndPropParts[1];							
							switch (property) {
								case 'text': property = 'textContent'; break;
								case 'html': property = 'innerHTML'; break;
							}
							ele.addEventListener(key.replace('on',''), function() {
								var stateObj = {};
								stateObj[stateKey] = ele[property];								
								state.setState(stateObj);
							});
							continue;
						} else {
							var stateKey = args[key].substring(1,args[key].length-1);
							stateValue = state.props[stateKey];
							if (stateValue == null) {
								stateValue = '';
							}
							var randomKey = App.random();
							ele.setAttribute('data-bindstate', randomKey);
							if (stateKey in state.bindings) {
								state.bindings[stateKey].push({key:randomKey, attribute:key});
							} else {
								state.bindings[stateKey] = [];
								state.bindings[stateKey].push({key:randomKey, attribute:key});
							}
						}
											
					} else {
						stateValue = null;
					}
					
					switch (key) {
						case 'class': ele.className = (args[key] != null? args[key]:''); break;
						case 'text': ele.textContent = (stateValue != null? stateValue:(args[key] != null? args[key]:'')); break;
						case 'value': ele.value = (stateValue != null? stateValue:(args[key] != null? args[key]:'')); break;
						case 'html': ele.innerHTML = (stateValue != null? stateValue:(args[key] != null? args[key]:'')); break;
						case 'checked': ele.checked = true; break;
						case 'selected': ele.selected = (args[key] == args['value']? true:false); break;
						case 'state': state = args[key]; break;
						default: 
							if (/^on/.test(key) == true) { 
								ele.addEventListener(key.replace('on',''), args[key]);
							} else {
								ele.setAttribute(key, (args[key] != null) ? args[key]:'');								
							}
					}
				}				
			} else if (typeof args === 'string' || typeof args === 'number') {				
				ele.textContent = args;
			}				
		}
		 
		for (var i = startElements; i < arguments.length; i++) {
			if (typeof arguments[i] != 'undefined' && arguments[i] != null && [1,3].includes(arguments[i].nodeType)) {
				ele.appendChild(arguments[i]);				
			} else if (Array.isArray(arguments[i])) { 
				for ( var j = 0 ; j < arguments[i].length ; j++ ) { 				
					ele.appendChild(arguments[i][j]);
				}
			} else if ((typeof arguments[i] === 'string' || typeof arguments[i] === 'number') && arguments[i]) {
				ele.textContent = arguments[i];
			}
		}
		 
		return ele;
	},

	// var state = new App.state(); // create a new state instance.
	// state.setState({name:'John'}); // update the value of the state property 'name';
	// state.bind('name', '#myName', 'html'); // when the state of name changes, the innerHTML property of #myName is updated.
	state: function() {
		var self = {
			props: {},
			bindings: {},
			setState: function(obj) {
				if (typeof obj !== 'object') {
					console.log("setState was not given a valid object!");				
				}
				for (var key in obj) {
					if (obj.hasOwnProperty(key)) {
						if (typeof obj[key] == 'undefined') {
							self.props[key] = '';
							obj[key] = '';
						}
						else {
							self.props[key] = obj[key];
						}

						if (key in self.bindings) {
							var elements = self.bindings[key];
							elements.filter(function(binder) {
								var bindEle = document.querySelector("[data-bindstate='"+binder.key+"']");
								if (binder && {}.toString.call(binder) === '[object Function]') {
									binder(self.props);
								}
								else if (document.contains(bindEle)) {									
									switch (binder.attribute) {
										case 'text':
											bindEle.textContent = obj[key];
										break;
										case 'html':
											bindEle.innerHTML = obj[key];
										break;
										case 'value':
											bindEle.value = obj[key];
										break;
										case 'checked':
											if (typeof obj[key] === "boolean") {
												bindEle.checked = obj[key];
											} else if (typeof obj[key] === "string") {
												if (bindEle.value == obj[key]) {
													bindEle.checked = true;
												} else {
													bindEle.checked = false;
												}
											}
										break;
										default: 
											bindEle.setAttribute(binder.attribute, obj[key]);
									}
								}
							})
						}
												
					}
				}
			},

			// subscribe to the state key
			bind: function(stateKey, element, attribute) {
				var randomKey = Dom.random();
				var ele = (typeof element === 'string' ? document.querySelector(element):element);
				ele.setAttribute('data-bindstate', randomKey);
				if (stateKey in self.bindings) {
					self.bindings[stateKey].push({key:randomKey, attribute:attribute});
				} else {
					self.bindings[stateKey] = [];
					self.bindings[stateKey].push({key:randomKey, attribute:attribute});
				}		
			}

		};
		return self;
	},

	run: function(obj, callback) {
		obj.keys.filter(function(stateKey) {
			if (obj.state.bindings.hasOwnProperty(stateKey)) {
				obj.state.bindings[stateKey].push(callback);
			} else {
				obj.state.bindings[stateKey] = [];
				obj.state.bindings[stateKey].push(callback);
			}

			if (!obj.state.props.hasOwnProperty(stateKey)) {
				obj.state.props[stateKey] = '';
			}
		});		
	},	

	// use: add('#targetDiv', ce('div', {}), ce('span', {}));
	// the first argument is the target element. The rest of the arguments will be appended inside it.
	// to add to different parts of the element: beforebegin, afterbegin, beforeend, afterend
	// use: add('#targetDiv', 'beforeend', ce('div', {}), ce('span', {}));
	add: function() {
		var start = 1;
		if (typeof arguments[0] === 'string') {
			var ele = document.querySelector(arguments[0]);
		} else {
			var ele = arguments[0];
		}

		if (typeof arguments[1] === 'string') {
			start = 2;
		}
		
		for (var i = start; i < arguments.length; i++) {
			if (Array.isArray(arguments[i])) {
				for (var j in arguments[i]) { 				
					if (start == 2) {
						if (typeof arguments[i][j] != 'undefined' && arguments[i][j] != null && [1,3].includes(arguments[i][j].nodeType)) {
							ele.insertAdjacentElement(arguments[1], arguments[i][j]);
						}
					} else {
						if (typeof arguments[i][j] != 'undefined' && arguments[i][j] != null && [1,3].includes(arguments[i][j].nodeType)) {
							ele.appendChild(arguments[i][j]);
						}
					}
				}
			} else if ([1,3].includes(arguments[i].nodeType)) {
				if (start == 2) {
					if (typeof arguments[i] != 'undefined' && arguments[i] != null && [1,3].includes(arguments[i].nodeType)) {
						ele.insertAdjacentElement(arguments[1], arguments[i]);
					}
				} else {
					if (typeof arguments[i] != 'undefined' && arguments[i] != null && [1,3].includes(arguments[i].nodeType)) {
						ele.appendChild(arguments[i]);
					}
				}				
			}
		}
	},

	// use: addTo('#targetDiv', ce('div', {}), ce('span', {}));
	// the first argument is the target element. The rest of the arguments will be appended inside it.
	// Clears out nodes from element first
	set: function() {
		if (typeof arguments[0] === 'string') {
			var ele = document.querySelector(arguments[0]);
		} else {
			var ele = arguments[0];
		}		
		
		while (ele.firstChild) {
			ele.removeChild(ele.firstChild);
		}		
		
		for (var i = 1; i < arguments.length; i++) {
			if (Array.isArray(arguments[i])) {
				for (var j in arguments[i]) { 				
					if (typeof arguments[i][j] != 'undefined' && arguments[i][j] != null && [1,3].includes(arguments[i][j].nodeType)) {
						ele.appendChild(arguments[i][j]);
					}
				}
			} else {
				if (typeof arguments[i] != 'undefined' && arguments[i] != null && [1,3].includes(arguments[i].nodeType)) {
					ele.appendChild(arguments[i]);
				}
			}
		}
	},

	deleteNode : function(e) {
		if (typeof e === 'string') {
			var el = document.querySelector(e);
			var p = el.parentNode;
			if(p) {
				p.removeChild(el);
			}
		} else {
			var p = e.parentNode;
			if(p) {
				p.removeChild(e);
			}				
		}		 
	},

	empty: function() {
		if (typeof arguments[0] === 'string') {
			var el = document.querySelector(arguments[0]);
		} else {
			var el = arguments[0];
		}
		while (el.firstChild) {
			el.removeChild(el.firstChild);
		}
	},

	// find out if the id is on an element on the page
	// might replace isElement
	exists : function(string) {
		return document.contains(document.querySelector(string));
	},

	in_array: function(needle, haystack) {
		for (var key in haystack) {
			if (haystack[key] == needle) {
				return true;
			}
		}
		return false;
	},

	isObject: function(obj) {
		return obj === Object(obj);
	},

	random: function() {
		return 'a'+Math.random().toString(36).substr(2, 11)+Math.random().toString(36).substr(2, 11);
	},

	numberFormat: function(number, decimals, decPoint, thousandsSep) {
		number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
		var n = !isFinite(+number) ? 0 : +number
		var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
		var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
		var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
		var s = ''

		var toFixedFix = function (n, prec) {
			if (('' + n).indexOf('e') === -1) {
				return +(Math.round(n + 'e+' + prec) + 'e-' + prec)
			} else {
				var arr = ('' + n).split('e')
				var sig = ''
				if (+arr[1] + prec > 0) {
				sig = '+'
				}
				return (+(Math.round(+arr[0] + 'e' + sig + (+arr[1] + prec)) + 'e-' + prec)).toFixed(prec)
			}
		}

		s = (prec ? toFixedFix(n, prec).toString() : '' + Math.round(n)).split('.')
		if (s[0].length > 3) {
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
		}
		if ((s[1] || '').length < prec) {
			s[1] = s[1] || ''
			s[1] += new Array(prec - s[1].length + 1).join('0')
		}

		return s.join(dec)
	}
}