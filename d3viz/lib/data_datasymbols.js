/* SVG SYMBOL DATA - by Alex Wellerstein, v3.0 

This data mode is for displaying data that can be plotted with latitude and longitude pairs as SVG. These will be represented by
symbols on the map. 

Symbols are SVG objects. D3.js can generate a small number on its own (circle, square, cross, triangle-up, triangle-down), or
an arbitrary SVG code can be inserted. 

SVG symbols are different than SVG circles in that they don't have a simple cx,cy, but need to be translated to the correct location.

Because of this, it is relatively easy to replace the SVG symbols with even raster images (e.g., PNGs or JPEGs) with just a little
use of the .each() function. See the example_images.html for an example of this.

*/

function dataSymbols(options) {
	var obj = this;
	obj.loadOptions(options);
	this.type = "viz";
	d3VizObj.viz.push(obj); obj.id = d3VizObj.viz.length-1;
	if(typeof obj.target=="undefined") obj.target="path";
	if(typeof obj.debug=="undefined") obj.debug = false;
	if(typeof obj.group_id=="undefined") obj.group_id = "symbols_"+obj.id;

	if(typeof obj.colortarget=="undefined") obj.colortarget = "fill";
	if(typeof obj.autosort=="undefined") obj.autosort = false; //autosort probably less useful for this -- requires a size function

	if(typeof obj.symbol_class=="undefined") {
		obj.target_class == "symboldata";
	} else {
		obj.target_class = obj.symbol_class;
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
					//r.d = ""; //ignore the data row
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
			.data(obj.data.data, function(d) { return "d_"+obj.data.id+"_"+d.i;} ) //use the data to draw the circles...
			  .enter().append(obj.target)
			  	.each(function(d,i) {
			  		if(obj.map.maptype=="GMap") {
						return d3.select(this)
							.attr("_x",function(d,i) { return obj.xpos(d,i,this)})
							.attr("_y",function(d,i) { return obj.ypos(d,i,this)})
							.attr("transform", function(d,i) {
								if(typeof obj.scale == "function") {
									var s = obj.scale(d);
								}else if(typeof obj.scale == "undefined") {
									var s = 1;
								} else {
									var s = obj.scale;
								}
								return "translate("+d3.select(this).attr("_x")+","+d3.select(this).attr("_y")+")scale("+s+")";
							})
			  		}
			  		if(typeof obj.each =="function") obj.each(d,i,this);
			  	})
				.classed(obj.target_class,true) 
				.attr("id", function(d, i) { return "d_"+obj.id+"_"+d.i; }) //set an individual id for each symbol
				.attr("i", function(d, i) { return d.i; }) //same as the above but just a number -- sometime useful to have access to which number it is in the set			
				.attr("_x",function(d,i) { return obj.xpos(d,i,this)})
				.attr("_y",function(d,i) { return obj.ypos(d,i,this)})
				.attr("transform", function(d,i) {
					if(typeof obj.scale == "function") {
						s = obj.scale(d,i,obj);
					}else if(typeof obj.scale == "undefined") {
						s = 1;
					} else {
						s = obj.scale;
					}
					return "translate("+d3.select(this).attr("_x")+","+d3.select(this).attr("_y")+")scale("+s+")";		
				})
				.style(obj.colortarget, function(d,i) { return obj.symbolColor(d); }) //fill color, based on a function above
				.attr("d",function(d,i) {
					if(typeof obj.symbol == "undefined") {
						return "";
					} else {
						var s = obj.symbol(d,i,this);
						if(typeof s == "function") {
							return s();
						} else {
							return s;
						}
					}
				})
				.on("mouseover", function(d,i){ obj.symbolMouseOver(d,d.i); })  //what to do when the mouse goes over
				.on("mouseout",  function(d,i){ obj.symbolMouseOut(d,d.i); }) //what to do when the mouse is no longer over it
			;
		if(obj.autosort) obj.sortByRadius(obj.scale); //sort	

		if(obj.map.maptype=="GMap") {
			d3VizObj.addHook("overlaw_draw",function() {
				obj.group.selectAll(obj.target)
					.data(obj.data.data, function(d) { return "d_"+obj.data.id+"_"+d.i;} )
					.attr("_x",function(d,i) { return obj.xpos(d,i,this)})
					.attr("_y",function(d,i) { return obj.ypos(d,i,this)})
					.each(function(d,i) {
						return d3.select(this)
							.attr("_x",function(d,i) { return obj.xpos(d,i,this)})
							.attr("_y",function(d,i) { return obj.ypos(d,i,this)})
							.attr("transform", function(d,i) {
								if(typeof obj.size == "function") {
									scale = obj.size(d);
								} else if(typeof obj.size == "undefined") {
									scale = 1;
								} else {
									scale = obj.size;
								}
								return "translate("+d3.select(this).attr("_x")+","+d3.select(this).attr("_y")+")scale("+s+")";		
							})	
					})
					.attr("transform", function(d,i) {
						if(typeof obj.size == "function") {
							scale = obj.size(d);
						}else if(typeof obj.size == "undefined") {
							scale = 1;
						} else {
							scale = obj.size;
						}
						return "translate("+d3.select(this).attr("_x")+","+d3.select(this).attr("_y")+")scale("+s+")";		
					})
			});
			obj.map.overlay.draw();
		}
	}
	
	this.xpos = function(d,i,shape) {
		if(typeof obj.xpos_func == "function") {
			return obj.xpos_func(d,i,shape);
		}
		if(this.map.maptype=="SVG") {
			if(typeof d.positions!="undefined") {
				return d.positions[0];
			} else {
				return -10000;
			}
		} else if(this.map.maptype=="GMap") {
			z = obj.map.projection.fromLatLngToDivPixel(d._LatLng); //calculates from google maps projection
			return z.x-obj.map.sw.x;
		}
	}
	this.ypos = function(d,i,shape) {
		if(typeof obj.ypos_func == "function") {
			return obj.ypos_func(d,i,shape);
		}
		if(this.map.maptype=="SVG") {
			if(typeof d.positions!="undefined") {
				return d.positions[1];
			} else {
				return -10000;
			}
		} else if(this.map.maptype=="GMap") {		
			z = obj.map.projection.fromLatLngToDivPixel(d._LatLng); //calculates from google maps projection
			return z.y-obj.map.ne.y;
		}
	}
	
	this.symbolColor = function (d) {
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
	
	this.symbolMouseOver = function (d,i) {
		d3.select("#d_"+obj.id+"_"+d.i).classed("mouseover",true);
		if(typeof obj.mouseover == "function") {
			return obj.mouseover(d,i);
		} else if(typeof obj.mouseover_caption == "function") {
			obj.map.tooltip.html(obj.mouseover_caption(d,i));
		} else if(obj.mouseover_caption) {
			obj.map.tooltip.html(obj.mouseover_caption);
		}
	}

	this.symbolMouseOut = function (d,i) {
		d3.select("#d_"+obj.id+"_"+d.i).classed("mouseover",false);
		if(typeof obj.mouseout == "function") {
			obj.mouseout(d,i);
		} else {
			obj.map.tooltip.html("");
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
				svg.select("#d_"+obj.id+"_"+id)
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
dataSymbols.prototype = new d3Viz(dataSymbols);


if(debug) console.log("dataSymbols script loaded");