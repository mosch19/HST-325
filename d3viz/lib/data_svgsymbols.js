/* LAT/LNG SVG SYMBOL - by Alex Wellerstein, v1.0 


This is the same as the SVGCircles, except it can use arbitrary SVG paths. This means there are a few
slight differences to how it gets positioned on the map, but it also means you can make it have arbitrary shapes.

*/

function SVGSymbols(options) {
	var obj = this;
	obj.loadOptions(options);
	d3VizObj.viz.push(obj); obj.id = d3VizObj.viz.length-1;
	if(typeof obj.target=="undefined") target="circle";

	if(typeof obj.mouseOverStrokeMultiplier=="undefined") obj.mouseOverStrokeMultiplier=2;
	if(typeof obj.mouseOverOpacity=="undefined") obj.mouseOverOpacity=1;
	if(typeof obj.autosort=="undefined") obj.autosort = true;

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
					if(debug) console.log("Ignored row "+r.i+" because lat or lon were not a number");
					r.d = ""; //ignore the data row
				} else {
					r.d.positions = obj.map.projection([lon,lat]); //create the pixel positions and add them to the data object 
					if(debug&&debug_verbose) console.log("Adding data for row "+r.i+" at "+lat+", "+lon);
				}
			}
		}
	}
	
	this.sortData = function() {
		/* //this is deprecated -- bad practice to manipulate the data itself in this way
		if(obj.sort_field) {
			obj.data.data.sort(function(a, b) {
				return a[obj.sort_field] - b[obj.sort_field];
			});
			if(obj.sort_descending) obj.data.data.reverse();
		}*/
	}
	
	this.showData = function(r) {
	//add a group into the SVG file, give it the id "circles"
	obj.circles = obj.map.addGroup("circles_"+obj.id,obj.map.stage);
	//circles = stage.insert("svg:g").attr("id", "circles_"+obj.data.id);
	
	if(debug) console.log("Creating datapoints for dataset "+obj.data.id);
	//create a circles class
	 obj.circles.selectAll(obj.target)
		.data(obj.data.data, function(d) { return "d_"+obj.data.id+"_"+d.i;} ) //use the data to draw the circles...
		  .enter().append("svg:circle")
			.attr("class", "circles") //set their class to "circles"
			.attr("class", "circles_"+obj.id) //set their class to "circles"
			.classed(obj.circle_class,true) //add other classes
			.attr("id", function(d, i) { return "d_"+obj.id+"_"+d.i; }) //set an individual id for each circle
			.attr("i", function(d, i) { return d.i; }) //same as the above but just a number -- sometime useful to have access to which number it is in the set			
			.attr("cx", function(d, i) { return (typeof d.positions!="undefined"?d.positions[0]:-100); }) //x position
			.attr("cy", function(d, i) { return (typeof d.positions!="undefined"?d.positions[1]:-100); }) //y position			
			.style("fill", function(d,i) { return obj.circleColor(d); }) //fill color, based on a function above
			.attr("r", function(d, i) { return obj.circleRadius(d); }) //set the radius, based on the radius option function above			
			.attr("base_stroke", function (d) { return d3.select("#d_"+obj.id+"_"+d.i).style("stroke-width") }) //this just preserves the original size so we can change it on mouseover
			.attr("base_opacity", function (d) { return d3.select("#d_"+obj.id+"_"+d.i).style("opacity") }) //this just preserves the original opacity so we can change it on mouseover
			.on("mouseover", function(d,i){ obj.circleMouseOver(d,d.i); })  //what to do when the mouse goes over
			.on("mouseout",  function(d,i){ obj.circleMouseOut(d,d.i); }) //what to do when the mouse is no longer over it
		;
		if(obj.autosort) obj.sortByRadius(obj.circleRadius); //sort	
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
	
	this.circleMouseOver = function (d,i) {
		d3.select("#d_"+obj.id+"_"+d.i).style("stroke-width",(d3.select("#d_"+obj.id+"_"+d.i).attr("base_stroke")*obj.mouseOverStrokeMultiplier)/d3VizObj.zoom_factor);
		d3.select("#d_"+obj.id+"_"+d.i).style("opacity",obj.mouseOverOpacity);
		if(typeof obj.mouseover == "function") {
			return obj.mouseover(d,i);
		} else if(typeof obj.mouseover_caption == "function") {
			obj.map.tooltip.html(obj.mouseover_caption(d,i));
		} else if(obj.mouseover_caption) {
			obj.map.tooltip.html(obj.mouseover_caption);
		}
	}

	this.circleMouseOut = function (d,i) {
		if(typeof obj.mouseout == "function") obj.mouseout(d,i);
		d3.select("#d_"+obj.id+"_"+d.i).style("opacity",d3.select("#d_"+obj.id+"_"+d.i).attr("base_opacity"));
		d3.select("#d_"+obj.id+"_"+d.i).style("stroke-width",(d3.select("#d_"+obj.id+"_"+d.i).attr("base_stroke")/d3VizObj.zoom_factor));
		obj.map.tooltip.html("");
	}

	this.updateRadius = function (value) {
		if(debug) console.log("Changing circle radii");
		if(value===false) {
			//if there is no selector, just refresh based on the circle_radius settings
			obj.map.svg.selectAll(".circles_"+obj.id) //for each of the circles...
				.transition()	//adding this means it will make the radius change in a smooth way
				.style("fill", function(d,i) { return obj.circleColor(d); }) // change the color (if needed)
				.attr("r", function(d, i) { return obj.circleRadius(d); });
			if(obj.autosort) this.sortByRadius(obj.circleRadius);
		} else {
			//otherwise use the provided value
			obj.map.svg.selectAll(".circles_"+obj.id) //for each of the circles...
				.transition()	//adding this means it will make the radius change in a smooth way
				.style("fill", function(d,i) { return obj.circleColor(d); }) // change the color (if needed)
				.attr("r", function(d, i) { 
					return Math.max(obj.radius_selector_options[value][1](d),0); });	
			if(obj.autosort) this.sortByRadius(obj.radius_selector_options[value][1]);
		}
	}
	this.sortByRadius = function(radfunc) {	
		//sorts so that smallest radius always on top
		obj.map.svg.selectAll(".circles_"+obj.id) //for each of the circles...
		.sort(function (a,b) { //resort so bigger circles on bottom
			return radfunc(b) - radfunc(a);
		})
		;
	}
	
	this.findData = function (id) {
		if(id) { 
			obj.map.svg.selectAll(".circles_"+obj.id) //this resets all of the existing data outlines
				.style("stroke-width",1) //these numbers seem arbitrary
				.style("stroke","white")
			;
			obj.map.svg.select("#d_"+obj.id+"_"+(id)) //this takes the one selected by the user and makes the radius large, then transitions to a smaller one
				.style("stroke","red")
				.style("stroke-width",500)
				.transition()
				.style("stroke-width",5)
			;
			for(var i in obj.data.data) {
				if(obj.data.data[i].i==i) { //shows the caption of the datapoint selected (it has to search for it, because the data might be sorted)
					obj.map.tooltip.html(caption_text(obj.data.data[i]));
					break;
				}
			}
		}
	}
	d3VizObj.addHook("run_on_each_data_row",this.processData);
	//d3VizObj.addHook("run_after_data_and_map_loaded",this.sortData); //deprecated
	d3VizObj.addHook("run_after_data_and_map_loaded",this.showData);
}
SVGCircles.prototype = new d3Viz(SVGCircles);

if(debug) console.log("SVGCircles script loaded");