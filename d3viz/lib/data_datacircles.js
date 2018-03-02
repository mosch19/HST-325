/* LAT/LNG SVG CIRCLE POINT DATA - by Alex Wellerstein, v3.0 

This data mode is for displaying data that can be plotted with latitude and longitude pairs as SVG. These will be represented by
circles on the map. Their radius and color can be separately set based on either fixed values, or dynamically
according to rows in the dataset. Putting the mouse over a datapoint can trigger a tooltip event.

v3.0 -- now works with GMap type

*/

function dataCircles(options) {
	var obj = this;
	obj.loadOptions(options);
	this.type = "viz";
	d3VizObj.viz.push(obj); obj.id = d3VizObj.viz.length-1;
	if(typeof obj.target=="undefined") obj.target="circle";
	if(typeof obj.debug=="undefined") obj.debug = false;

	if(typeof obj.autosort=="undefined") obj.autosort = true;
	if(typeof obj.colortarget=="undefined") obj.colortarget = "fill";
	if(typeof obj.group_id=="undefined") obj.group_id = "circles_"+obj.id;
	if(typeof this.data_prefix == "undefined") this.data_prefix = "d";

	if(typeof obj.circle_class=="undefined") {
		obj.target_class == "circledata";
	} else {
		obj.target_class = obj.circle_class;
	}

	//sets up the radius size selector
	if(typeof obj.radius_selector_options!=="undefined") {

		if(typeof obj.radius_selector_attach_id=="undefined") {
			obj.radius_selector_attach_id = "options";
		}
	
		//this has to run after the main body element has loaded because it relies on a div to attach
		d3VizObj.addHook("run_before_map_loaded",
			function() {
				make_selector({
					div_id: "circles_radius_"+obj.id,
					div_class: "circles_radius_div",
					caption: obj.radius_selector_caption?obj.radius_selector_caption:"Radius: ",
					select_id: "circles_radius_select_"+obj.id,
					onchange: function() { obj.updateRadius(this.value); },
					attach_to_id: obj.radius_selector_attach_id,
					selector_options: obj.radius_selector_options,
					default_option: obj.radius_selector_default,
					caption: obj.radius_selector_caption
				}
				);	
				;
			});
	}

	this.processData = function (r) {
		if(r.obj.id==obj.data.id) {
			if(!r.d.positions) {
				//pick out the lat/lon fields
				if(typeof obj.latLon == "function") {
					var lat = (obj.latLon(r.d)[0]);
					var lon = (obj.latLon(r.d)[1]);
				} else if(typeof r.obj.latLon == "function") {
					var lat = (r.obj.latLon(r.d)[0]);
					var lon = (r.obj.latLon(r.d)[1]);
				} else {
					var lat = null; var lon= null;
				}
				//check if the lat/lon are valid
				if(isNaN(lat)||isNaN(lon)) {
					if(debug||obj.debug) console.log("Ignored row "+r.i+" because lat or lon were not a number");
					r.d = ""; //ignore the data row
				} else {
					if(obj.map.maptype=="SVG") {
						r.d.positions = obj.map.projection([lon,lat]); //create the pixel positions and add them to the data object 
					} else if(obj.map.maptype=="GMap") {
						obj.map.bounds.extend(r.d._LatLng = new google.maps.LatLng(lat, lon));
					}
					if((debug&&debug_verbose)||obj.debug) console.log("Adding data for row "+r.i+" at "+lat+", "+lon);
				}
			}
		}
	}
	
	this.showData = function(r) {
		if(d3.select("#"+obj.group_id)[0][0] == null) {
			obj.group = obj.map.addGroup(obj.group_id,obj.map.stage);
		} else {
			obj.group = d3.select("#"+obj.group_id);
		}
		if(debug||obj.debug) console.log("Creating datapoints for dataset "+obj.data.id);

		 obj.group.selectAll(obj.target)
			.data(obj.data.data, function(d) { return obj.data_prefix+"_"+obj.data.id+"_"+d.i;} ) //use the data to draw the circles...
			  .enter().append(obj.target)
			  	.each(function(d) {
			  		if(obj.map.maptype=="GMap") {
						return d3.select(this)
							.attr("cx", function(d, i) { return obj.xpos(d); }) //x position
							.attr("cy", function(d, i) { return obj.ypos(d); }) //y position			
			  		}
			  		if(typeof obj.each =="function") obj.each(d,i,this);
			  	})
				.classed(obj.target_class,true) 
				.attr("id", function(d, i) { return obj.data_prefix+"_"+obj.id+"_"+d.i; }) //set an individual id for each circle
				.attr("i", function(d, i) { return d.i; }) //same as the above but just a number -- sometime useful to have access to which number it is in the set			
				.attr("cx", function(d, i) { return obj.xpos(d); }) //x position
				.attr("cy", function(d, i) { return obj.ypos(d); }) //y position			
				.style(obj.colortarget, function(d,i) { return obj.circleColor(d); }) //fill color, based on a function above
				.attr("r", function(d, i) { return obj.circleRadius(d); }) //set the radius, based on the radius option function above			
				.on("mouseover", function(d,i){ obj.circleMouseOver(d,d.i,this); })  //what to do when the mouse goes over
				.on("mouseout",  function(d,i){ obj.circleMouseOut(d,d.i,this); }) //what to do when the mouse is no longer over it
			;
		if(obj.autosort) obj.sortByRadius(obj.circleRadius); //sort	

		if(obj.map.maptype=="GMap") {
			d3VizObj.addHook("overlay_draw",function() {
				obj.group.selectAll(obj.target)
					.data(obj.data.data, function(d) { return obj.data_prefix+"_"+obj.data.id+"_"+d.i;} )
					.each(function(d) {
						return d3.select(this)
							.attr("cx", function(d, i) { return obj.xpos(d); }) //x position
							.attr("cy", function(d, i) { return obj.ypos(d); }) //y position			
					})
					.attr("cx", function(d, i) { return obj.xpos(d); }) //x position
					.attr("cy", function(d, i) { return obj.ypos(d); }) //y position			
			});
			obj.map.overlay.draw();
		}

	}

	this.xpos = function(d) {
		if(typeof obj.xpos_func == "function") {
			return obj.xpos_func(d,i);
		}
		if(this.map.maptype=="SVG") {
			if(typeof d.positions!="undefined") {
				return d.positions[0];
			} else {
				return -100;
			}
		} else if(this.map.maptype=="GMap") {
			z = obj.map.projection.fromLatLngToDivPixel(d._LatLng); //calculates from google maps projection
			return z.x-obj.map.sw.x;
			
		}
	}
	this.ypos = function(d) {
		if(typeof obj.ypos_func == "function") {
			return obj.ypos_func(d,i);
		}
		if(this.map.maptype=="SVG") {
			if(typeof d.positions!="undefined") {
				return d.positions[1];
			} else {
				return -100;
			}
		} else if(this.map.maptype=="GMap") {
			z = obj.map.projection.fromLatLngToDivPixel(d._LatLng); //calculates from google maps projection
			return z.y-obj.map.ne.y;
			
		}
	}

	
	this.circleRadius = function (d) {
		if(obj.radius) {
			if(typeof obj.radius == "function") {
				return obj.radius(d);
			} else {
				return obj.radius;
			}
		}
		if(obj.radius_selector_options) {
			var radiusOption = document.getElementById("circles_radius_select_"+obj.id).value;
			return Math.max(obj.radius_selector_options[radiusOption][1](d),0);
		}
	}

	this.circleColor = function (d) {
		if(obj.color) {
			if(typeof obj.color =="function") {
				return obj.color(d);
			} else {
				return obj.color;
			}
		} else if(obj.color_field) {
			if(obj.color_scale) {
				return obj.color_scale(d[obj.color_field]);
			} else {
				return d[obj.color_field];		
			}
		}
	}
	
	this.circleMouseOver = function (d,i,shape) {
		d3.select(shape).classed("mouseover",true);
		if(typeof obj.mouseover == "function") {
			return obj.mouseover(d,i);
		} else if(typeof obj.mouseover_caption == "function") {
			obj.map.tooltip.html(obj.mouseover_caption(d,i));
		} else if(obj.mouseover_caption) {
			obj.map.tooltip.html(obj.mouseover_caption);
		}
	}

	this.circleMouseOut = function (d,i,shape) {
		d3.select(shape).classed("mouseover",false);
		if(typeof obj.mouseout == "function") {
			obj.mouseout(d,i);
		} else {
			obj.map.tooltip.html("");
		}
	}

	this.updateRadius = function (value) {
		if(debug||obj.debug) console.log("Changing circle radii");
		if(value===false) {
			//if there is no selector, just refresh based on the circle_radius settings
			obj.map.svg.selectAll("."+obj.target_class) //for each of the circles...
				.transition()	//adding this means it will make the radius change in a smooth way
				.style("fill", function(d,i) { return obj.circleColor(d); }) // change the color (if needed)
				.attr("r", function(d, i) { return obj.circleRadius(d); });
			if(obj.autosort) this.sortByRadius(obj.circleRadius);
		} else {
			//otherwise use the provided value
			obj.map.svg.selectAll("."+obj.target_class) //for each of the circles...
				.transition()	//adding this means it will make the radius change in a smooth way
				.style("fill", function(d,i) { return obj.circleColor(d); }) // change the color (if needed)
				.attr("r", function(d, i) { 
					return Math.max(obj.radius_selector_options[value][1](d),0); });	
			if(obj.autosort) this.sortByRadius(obj.radius_selector_options[value][1]);
		}
	}
	this.sortByRadius = function(radfunc) {	
		//sorts so that smallest radius always on top
		obj.map.svg.selectAll("."+obj.target_class) //for each of the items...
		.sort(function (a,b) { //resort so bigger items on bottom
			return radfunc(b) - radfunc(a);
		})
		;
	}
		
	this.findData = function (id) {
		obj.map.svg.selectAll("."+obj.target_class) //unselect all
			.classed("selected",false);
		if(id) { //select the id
				svg.select("#"+obj.data_prefix+"_"+obj.id+"_"+id)
					.classed("selected",true);
			for(var i in obj.data.data) {
				if(obj.data.data[i].i==i) { //shows the caption of the datapoint selected (it has to search for it, because the data might be sorted)
					obj.map.tooltip.html(caption_text(obj.data.data[i]));
					break;
				}
			}
		}
	}

	d3VizObj.addHook("run_on_each_data_row",this.processData);
	d3VizObj.addHook("run_after_data_and_map_loaded",this.showData);
	d3VizObj.is_loaded(obj);
}
dataCircles.prototype = new d3Viz(dataCircles);


if(debug) console.log("dataCircles script loaded");