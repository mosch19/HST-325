/* RANGE FILTERING - by Alex Wellerstein, v2.0 

Range filtering is when you have some kind of quantitative (number-based) field that you want to be able to toggle on and
off based on what contents are in the field, by criteria like "less than 100" or "between 100 and 200." For example, if you
had a dataset of school test scores that range from 0 to 1000, you might want to break it into categories like "<100", "100-200",
"201-300","301-400", and so on, up to "901-1000".

The filtering itself works by assigning classes to the data point. So if the data has the range searched for, it will
get the class "data_in_range". If it doesn't, it gets "data_out_range". You can use the stylesheet to toggle
what these classes then do (e.g. hide or show). 

Note that this field will force any value supplied to be read as a number, which may result in it being understood as "0" if
it is text based or the Javascript can't understand it.

*/

function filterRange(options) {
	var obj = this; 
	obj.loadOptions(options);
	d3VizObj.controls.push(obj); obj.id = d3VizObj.controls.length-1;
	
	this.rangeFilterBuildSelect = function() {
		if(debug) console.log("Building the range filter menu");
		var insert = document.getElementById(obj.rangeFilterInsertId);
		if(!insert) {
			if(debug) console.log("Could not find HTML entity with the id '"+obj.rangeFilterInsertId);
		} else {
			var div = document.createElement("div");
			div.id = "selectFilter_"+obj.id;
			div.class = "selectFilter";
			var cap = document.createElement("span");
			var cap_content = document.createTextNode(obj.rangeFilterCaption);
			cap.appendChild(cap_content);
			cap.id = "selectFilter_"+obj.id+"_label";
			div.appendChild(cap);
			var sel = document.createElement("select");
			sel.onchange = function() { obj.rangeFilter(this.value) };
			for(i in obj.range_filter_options) {
				var opt = document.createElement("option");
				opt.text = obj.range_filter_options[i][0];
				opt.value = i;
				if(i==obj.range_filter_default) opt.selected = true;
				sel.add(opt);
			}
			div.appendChild(sel);
			insert.appendChild(div);
		}	
	}
	this.rangeFilter = function(value) {
		if(debug) console.log("Filtering by range "+value);
		obj.map.svg //with the stage
			.selectAll(obj.range_filter_data_class) //select all data
			.data(obj.data.data, function(d) { return "d_"+obj.data.id+"_"+d.i; }) //parse the data again 
			.classed("data_in_range",function(d) { //change the class based on the field
				if(value==0) { //if "all" is selected
					return false; //just make it a regular dot
				} else { //but if something else is selected
					var min = obj.range_filter_options[value][1]()[0];
					var max = obj.range_filter_options[value][1]()[1];
					if(min===max) { //exact match
						if(+d[obj.range_filter_field]==min) {
							return true;
						} else {
							return false;
						}
					} else if (min===false) { //if it is a "less than" situation 
						if(+d[obj.range_filter_field]<max) {
							return true;
						} else {
							return false;
						}
					} else if(max===false) { //if it is a "more than" situation				
						if(+d[obj.range_filter_field]>min) {
							return true;
						} else {
							return false;
						}
					} else { //if it is a "between" situation
						if((+d[obj.range_filter_field]>min)&&(+d[obj.range_filter_field]<max)) {
							return true;
						} else {
							return false;
						}
					}
				}
			})
			.classed("data_out_range",function(d) { //change the class based on the field
				if(value==0) { //if "all" is selected
					return false; //just make it a regular dot
				} else { //but if something else is selected
					var min = obj.range_filter_options[value][1]()[0];
					var max = obj.range_filter_options[value][1]()[1];
					if(min===max) { //exact match
						if(+d[obj.range_filter_field]==min) {
							return false;
						} else {
							return true;
						}
					} else if (min===false) { //if it is a "less than" situation 
						if(+d[obj.range_filter_field]<max) {
							return false;
						} else {
							return true;
						}
					} else if(max===false) { //if it is a "more than" situation				
						if(+d[obj.range_filter_field]>min) {
							return false;
						} else {
							return true;
						}
					} else { //if it is a "between" situation
						if((+d[obj.range_filter_field]>min)&&(+d[obj.range_filter_field]<max)) {
							return false;
						} else {
							return true;
						}
					}
				}
			})

		;	
	}
	d3VizObj.addHook("run_before_map_loaded",this.rangeFilterBuildSelect);

}
filterRange.prototype = new d3Viz(filterRange);

if(debug) console.log("Filter by range script loaded");