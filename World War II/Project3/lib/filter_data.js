/* DATA FILTERING - by Alex Wellerstein, v.3.0

Allows for filtering of data by a variety of means. By default, it does this by changing the class of elements.

*/

const FILTERTYPE_USERDEFINED = 0; //user defined
/*

A user-defined filter will turn things on or off based on your own custom function that evaluates the data.

*/

const FILTERTYPE_TEXTSEARCH = 1; //text search
/*

A text search filter will allow you to apply classes to D3.js data objects based on whether a field of data contains
a given fragment of text or not.  

*/

const FILTERTYPE_KEYWORDS = 2; //keywords
/*

A keyword filter will allow you to apply classes to D3.js data objects based on whether a delineated field contains or does
not contain a given value. For example, you might have data that consisted of stores, and "store_keywords" might be a list of 
terms separated by a delimiter like a semicolor, e.g. "restaurant; cheap;" or "baker; expensive;". Keyword filter understands
that items separated by a delimiter are part of a structured vocabulary.

*/

const FILTERTYPE_RANGE = 3;
/*

A range-based filter will allow you to apply classes to D3.js data objects based on whether a numerical value of the data
is within a given numerical range. For example, you might filter data based on whether the price is less than $5, between
$5 and $10, or greater than $10.

*/

function dataFilter(options) {
	var obj = this; 
	obj.loadOptions(options);

	if(typeof obj.debug == "undefined") obj.debug = false;

	if(typeof obj.filter_type == "undefined") {
		if(debug) console.log("Data filter cannot load -- no filter type specified");
		return false;
	}
	this.type = "control";
	d3VizObj.controls.push(obj); obj.id = d3VizObj.controls.length-1;
	if(typeof obj.found_class == "undefined") obj.found_class = "data_has_text";
	if(typeof obj.lacks_class == "undefined") obj.lacks_class = "data_lacks_text";
	if(typeof obj.case_insensitive == "undefined") obj.case_insensitive = true;

	this.filterFunction = [
		//user-defined
		function(data_field,filter_value,d) {
			if(typeof obj.filter_function == "function") {
				return obj.filter_function(data_field,filter_value,d);
			}
		},
		//text search
		function(data_field,filter_value,d) {
			if(typeof filter_value == "function") { //if the value is a function
				if(filter_value(data_field,d)) {
					return true;
				} else {
					return false;
				}
			} else {
				if(data_field.indexOf(filter_value)>-1) { //indexOf gives the first instance of a piece of text in another piece of text, with -1 being returned if it isn't there
					return true; //text is found
				} else {                
					return false; //text is not found
				}
			}
		},
		//keyword search
		function(data_field,filter_value,d) {
			var keywords = data_field.split(obj.delimiter);
			for(var i in keywords) { //format keywords
				keywords[i] = keywords[i].trim(); 
				if(obj.case_insensitive) keywords[i] = keywords[i].toLowerCase();
			} 
			if(typeof filter_value == "function") { //if the value is a function
				if(filter_value(keywords,d)) {
					return true;
				} else {
					return false;
				}
			} else { //otherwise, search it ourselves
				if(keywords.indexOf(filter_value)>-1) { //indexOf gives the first instance of a piece of text in another piece of text, with -1 being returned if it isn't there
					return true;
				} else {                
					return false;
				}
			}
		},
		//range search
		function(data_field,filter_value,d) {
			if(typeof filter_value == "function") {
				return filter_value(data_field,d);
			} else if(filter_value==0) { //if "all" is selected
				return false; //just make it a regular dot
			} else { //but if something else is selected
				var min = filter_value[0];
				var max = filter_value[1];
				if(min===max) { //exact match
					if(+data_field==min) {
						return true;
					} else {
						return false;
					}
				} else if (min===false) { //if it is a "less than" situation 
					if(+data_field<max) {
						return true;
					} else {
						return false;
					}
				} else if(max===false) { //if it is a "more than" situation				
					if(+data_field>min) {
						return true;
					} else {
						return false;
					}
				} else { //if it is a "between" situation
					if((+data_field>min)&&(+data_field<max)) {
						return true;
					} else {
						return false;
					}
				}
			}		
		},
	];

	this.dataFilterBuildSelect = function() {
		if(obj.selector_id) {
			if(debug||obj.debug) console.log("Building the text filter menu");
			var insert = document.getElementById(obj.selector_id);
			if(!insert) {
				if(debug||obj.debug) console.log("Could not find HTML entity with the id '"+obj.selector_id);
			} else {
				var div = document.createElement("div");
				div.id = "dataFilter_"+obj.id;
				div.class = "dataFilter";
				var cap = document.createElement("span");
				if(obj.selector_caption) {
					cap_content = document.createTextNode(obj.selector_caption);
					cap.appendChild(cap_content);
				}
				cap.id = "dataFilter_"+obj.id+"_label";
				div.appendChild(cap);
				var sel = document.createElement("select");
				sel.onchange = function() { obj.filter(obj.selectorValue(this.value)) };			
				for(i in obj.selector_options) {
					var opt = document.createElement("option");
					opt.text = obj.selector_options[i][0];
					opt.value = i;
					if(i==obj.selector_selected) opt.selected = true;
					sel.add(opt);
				}
				div.appendChild(sel);
				insert.appendChild(div);
			}
		}
	}

	this.selectorValue = function(selector_index) {
		obj.selector_selected = selector_index;
		var val = obj.selector_options[selector_index][1];
		return val;
	}

	this.filter = function(val) {
		d3.selectAll(obj.filter_target) //select all the data by the class given
			.each(function(d) {
				var baseclass = toggleClass(d3.select(this).attr("class"),obj.found_class,false); 
				baseclass = toggleClass(baseclass,obj.lacks_class,false);
				if(val===0) { //if the value is equal to zero
					console.log(baseclass);
					d3.select(this).attr("class", baseclass); //just set the class to default ("all")
					return;
				}
				var t = d[obj.filter_field];
				if(typeof obj.before_comparing == "function") t = obj.before_comparing(t); //run the "before_comparing" function on the text if we need to
				if(typeof t == "string") {
					if(obj.case_insensitive) t = t.toLowerCase();
				}
				if(typeof val =="string") {
					if(obj.case_insensitive) val = val.toLowerCase();
				}
				if(obj.filterFunction[obj.filter_type](t,val,d)) {
					if(typeof obj.filter_function == "function") {
						obj.filter_function(this,true);
					} else {
						d3.select(this).attr("class", obj.toggleClass(baseclass,obj.found_class,true)); //default behavior is to change the class
					}
				} else {
					if(typeof obj.filter_function == "function") {
						obj.filter_function(this,false);
					} else {
						d3.select(this).attr("class", obj.toggleClass(baseclass,obj.lacks_class,true));
					}
				}
			})
	}

	// toggles a given class on or out of a typical class list
	// this is similar to d3's .classed() function but can be used within attr("class") which is easier for a lot of cases
	// it works by understanding that classes are just lists separated by spaces, so it converts that to an array, parses the array, recombines it into a string
	this.toggleClass = function(classlist,classname,toggle) {
		var classes = classlist.split(" ");
		if(toggle) {
			if(classes.indexOf(classname)==-1) {
				classes.push(classname);
			}
		} else {
			if(classes.indexOf(classname)>-1) {
				classes.splice(classes.indexOf(classname),1);
			}
		}
		return classes.join(" ");
	}


	d3VizObj.addHook("run_before_map_loaded",this.dataFilterBuildSelect);
}
dataFilter.prototype = new d3Viz(dataFilter);

if(debug) console.log("Data filter script loaded");