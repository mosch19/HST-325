/* SVG CHOROPLETH - by Alex Wellerstein, v2.0 

This allows you to assign colors to map path objects. The TopoJSON map file must have a field in it
that corresponds with a county or country or whatever. So the worldmap-50m.json file has an "id" field
for each country which corresponds to the ISO 3166-1 numerica country code (http://en.wikipedia.org/wiki/ISO_3166-1). 
The us.counties.json file maps US counties and states based on FIPS codes (http://en.wikipedia.org/wiki/FIPS_county_code). Note that the first two numbers of a county FIPS code is its state FIPS code.

The shared.js file has functions for converting country names to ISO codes (and vice versa) and state/counties to FIPS (and vice versa)


*/

function SVGChoropleth(options) {
	var obj = this;
	obj.loadOptions(options);
	this.type = "viz";
	d3VizObj.viz.push(obj); obj.id = d3VizObj.viz.length-1;
	if(debug||obj.debug) console.log("Initiating choropleth on dataset "+obj.data.id);
	obj.index = []; //ids to data
	obj.index2 = []; 

	if(typeof obj.color_target == "undefined") obj.color_target = "fill";
	if(typeof obj.caption_id == "undefined") obj.caption_id = "tooltip";

	this.showData = function() {
		for(var d in obj.data.data) { //parse over data	
			if(typeof obj.id_field =="function") {
				var dd = obj.id_field(obj.data.data[d]);
			} else {
				var dd = obj.data.data[d][obj.id_field];
			}
			if(Array.isArray(dd)) {
				for(var i in dd) {
					var ddd = dd[i];
					obj.index[ddd] = d;
					d3.select("#"+d) 
						.style(obj.color_target,obj.color_scale(obj.color_field(obj.data.data[d],ddd))) //make it the right color
						.each(function(x,i) {
							if(typeof obj.each == "function") {
								obj.each(x,i,this);
							}
						})
						.on("mouseover", function(d){ obj.choroMouseover(d) })  //what to do when the mouse goes over
						.on("mousemove", function(d){ obj.choroMousemove(d) })  //what to do when the mouse goes over
						.on("mouseout",  function(d){ obj.choroMouseout(d); }) //what to do when the mouse is no longer over it
						.on("click", function(d) { obj.choroMouseclick(d); }); //what to do if clicked
						; 
				}
			} else {
				obj.index[dd] = d;
				d3.select("#"+dd) 
					.style(obj.color_target,obj.color_scale(obj.color_field(obj.data.data[d],dd))) //make it the right color
					.each(function(d,i) {
						if(typeof obj.each == "function") {
							obj.each(d,i,this);
						}
					})
					.on("mouseover", function(d){ obj.choroMouseover(d,this) })  //what to do when the mouse goes over
					.on("mousemove", function(d){ obj.choroMousemove(d,this) })  //what to do when the mouse goes over
					.on("mouseout",  function(d){ obj.choroMouseout(d,this); }) //what to do when the mouse is no longer over it
					.on("click", function(d) { obj.choroMouseclick(d,this); }); //what to do if clicked
					; 
			}
		}
	}
	this.choroMouseover = function(d,shape) {
		if(typeof obj.mouseover_caption == "function") {
			var shape_id = d3.select(shape).attr("id");
			d3.select("#"+obj.caption_id).html(obj.mouseover_caption(obj.data.data[obj.index[shape_id]],d,shape));
		} else if(obj.mouseover_caption) {
			d3.select("#"+obj.caption_id).html(obj.mouseover_caption);
		}
		if(typeof obj.mouseover == "function") {
			var shape_id = d3.select(shape).attr("id");
			obj.mouseover(obj.data.data[obj.index[shape_id]],d,shape);
		}	
	}
	this.choroMousemove = function(d,shape) {
		if(typeof obj.mousemove == "function") {
			var shape_id = d3.select(shape).attr("id");
			obj.mousemove(obj.data.data[obj.index[shape_id]],d,shape);
		}
	}
	this.choroMouseout = function(d,shape) {
		if(typeof obj.mouseover_caption == "function") {
			d3.select("#"+obj.caption_id).html("");
		}
		if(typeof obj.mouseout == "function") {
			obj.mouseout(shape);
		}
	}
	this.choroMouseclick = function(d,shape) {
		if(typeof obj.mouseclick == "function") {
			var shape_id = d3.select(shape).attr("id");
			obj.mouseclick(obj.data.data[obj.index[shape_id]],d,shape);
		}	
	}
	d3VizObj.addHook("run_after_data_and_map_loaded",this.showData);
	d3VizObj.is_loaded(obj);
}
SVGChoropleth.prototype = new d3Viz(SVGChoropleth);
if(debug) console.log("SVGChoropleth script loaded");