

function SVGPath(options) {
	var obj = this;
	obj.loadOptions(options);
	this.type = "viz";
	d3VizObj.viz.push(obj); obj.id = d3VizObj.viz.length-1;
	if(typeof obj.target=="undefined") obj.target="path";
	if(typeof obj.debug=="undefined") obj.debug = false;

	if(typeof obj.svg=="undefined") obj.svg = "stage";
	if(typeof obj.pathgroup=="undefined") obj.pathgroup = "lines";
	if(typeof obj.interpolate =="undefined") obj.interpolate = "linear";
	if(typeof obj.autosort =="undefined") obj.autosort = "true";
	obj.lineData = [];
	obj.lineGroup = [];

	if(typeof obj.group_id=="undefined") obj.group_id = "paths_"+obj.id;

	if(typeof obj.path_class=="undefined") {
		obj.target_class == "pathdata";
	} else {
		obj.target_class = obj.path_class;
	}

	if(typeof obj.caption_id == "undefined") obj.caption_id = "tooltip";

	this.processData = function (r) {
		if(typeof obj.data !=="undefined") {
			if(r.obj.id==obj.data.id) {
				if(obj.group_by) {
					if(typeof obj.lineGroup[r.d[obj.group_by]] == "undefined") obj.lineGroup[r.d[obj.group_by]] = [];
					obj.lineGroup[r.d[obj.group_by]].push(r.d.i);
				}
				if(obj.map.projection) {
					obj.lineData[r.d.i] = [];
					var latLonArray = obj.lineLatLons(r.d);
					for(var x in latLonArray) {
						var xy = obj.map.projection([latLonArray[x][1],latLonArray[x][0]]);
						obj.lineData[r.d.i].push({x:xy[0],y:xy[1]});
					}
				}						
			}	
		}
	}
		
	this.load = function(r) {
		switch(obj.map.maptype) {
			case "SVG":
				obj.projection = map.projection;
			break;
			case "GMap":
				obj.projection = map.gprojection;
			break;
		}

		if(d3.select("#"+obj.group_id)[0][0] == null) {
			obj.group = obj.map.addGroup(obj.group_id,obj.map.stage);
		} else {
			obj.group = d3.select("#"+obj.group_id);
		}
		
		obj.path = d3.geo.path().projection(obj.projection);

		if(typeof obj.data !== "undefined") {

			if(debug) console.log("Showing line data");
		
			obj.pathlayer = obj.map.addGroup(obj.pathgroup+"_"+obj.id,map[obj.svg]);
			obj.pathlayer.classed(obj.pathgroup,true);

			obj.linePaths = [];
			obj.line = d3.svg.line()
				.x(function(d) { return d.x})
				.y(function(d) { return d.y})
				.interpolate(obj.interpolate);

			for(var x in obj.data.data) {
				var d = obj.data.data[x];
				console.log(obj.lineData[x]);
				obj.linePaths[d.i] = 
					obj.pathlayer.append("path")
					.datum(d,function(d) { return "d_"+obj.data.id+"_"+d.i; }) //bind data to line object?
					.attr("id", "line_"+obj.id+"_"+d.i)
					.attr("i", d.i)
					.attr("class","line_"+obj.id)
					.classed("linegroup_"+obj.id+"_"+(typeof obj.group_by=="undefined"?"":obj.data.data[x][obj.group_by]),typeof obj.group_by=="undefined"?false:true)
					.attr("d", obj.line(obj.lineData[x]))
					.attr("stroke", function(d) { return obj.pathStrokeColor(obj.data.data[x],x,this); })
					.attr("stroke-width", function(d) { return obj.pathStrokeWidth(obj.data.data[x],x,this); })
					.on("mouseover", function(d){ obj.pathMouseover(this.id,this); ; })  //what to do when the mouse goes over
					.on("mouseout",  function(d){ obj.pathMouseout(this.id,this);  }) //what to do when the mouse is no longer over it		
			}
			if(obj.autosort) obj.sortByStrokeWidth(obj.pathStrokeWidth);		
		
		
		
		}

		if(obj.geoJSON) {

			if(obj.map.maptype=="GMap") {
				console.log("GMap not yet supported for geoJSON objects"); 
				//return false;
			}

			d3.json(obj.geoJSON, function(error, world) {
				if(debug||obj.debug) console.log("Loading geoJSON ("+(obj.geoJSON)+")");
				obj.topology = world;
				if(debug||obj.debug) console.log("geoJSON type:" +world.type);
				switch(world.type) {
					case "FeatureCollection":
					 d3.select("#"+obj.group_id).selectAll(obj.target)
						.data(world.features)
						  .enter()
						  .append(obj.target)
							.attr("class",obj.target_class) 
							  .attr("id",function(d,i) {
								if(typeof obj.setid == "function") {
									return obj.setid(d);
								} else {
									return "id_"+obj.id+"_"+i;
								}
							})
							.attr("i", function(d, i) { return d.i; }) //same as the above but just a number -- sometime useful to have access to which number it is in the set			
							.each(function(d,i) {
								if(typeof obj.each =="function") obj.each(d,i,this);
								if(obj.map.maptype=="GMap") {
									if(typeof d.geometry.coordinates !=="undefined") {
										for(var i in d.geometry.coordinates) {
											for(var ii in d.geometry.coordinates[i]) {
												var lat = d.geometry.coordinates[i][1];
												var lon = d.geometry.coordinates[i][0];
												//obj.map.bounds.extend(r.d._LatLng = new google.maps.LatLng(lat, lon));
												obj.map.bounds.extend(new google.maps.LatLng(lat, lon));
											}
										}
									}
								}
							})
							.attr("d", obj.path)
							.on("mouseover", function(d){ obj.mouseover_func(d,this) })  //what to do when the mouse goes over
							.on("mousemove", function(d){ obj.mousemove_func(d,this) })  //what to do when the mouse goes over
							.on("mouseout",  function(d){ obj.mouseout_func(d,this); }) //what to do when the mouse is no longer over it
							.on("click", function(d) { obj.mouseclick_func(d,this); }); //what to do if clicked
					break;
				}
				d3VizObj.is_loaded(obj);
			})
		}	
	}

	this.mouseover_func = function(d,shape) {
		if(typeof obj.mouseover_caption == "function") {
			d3.select("#"+obj.caption_id).html(obj.mouseover_caption(d,shape));
		} else if(obj.mouseover_caption) {
			d3.select("#"+obj.caption_id).html(obj.mouseover_caption);
		}
		if(typeof obj.mouseover == "function") {
			obj.mouseover(d,shape);
		}	
	},

	this.mousemove_func = function(d,shape) {
		if(typeof obj.mousemove == "function") {
			obj.mousemove(d,shape);
		}
	},

	this.mouseout_func = function(d,shape) {
		if(typeof obj.mouseover_caption == "function") {
			d3.select("#"+obj.caption_id).html("");
		}
		if(typeof obj.mouseout == "function") {
			obj.mouseout(d,shape);
		}
	},

	this.mouseclick_func = function(d,shape) {
		if(typeof obj.mouseclick == "function") {
			obj.mouseout(d,shape);
		}
	},

	this.pathStrokeWidth = function(d,i) {
		if(typeof obj.strokeWidth == "undefined") {
			return 1;
		} else if(typeof obj.strokeWidth == "function") {
			return obj.strokeWidth(d,i);
		} else {
			return obj.strokeWidth;
		}
	}
	this.pathStrokeColor = function(d,i) {
		if(typeof obj.strokeColor == "undefined") {
			return "#000";
		} else if(typeof obj.strokeColor == "function") {
			return obj.strokeColor(d,i);
		} else {
			return obj.strokeColor;
		}
	}
	this.pathMouseover = function(path_id,shape) {
		var i = d3.select(shape).attr("i");
		d3.select(shape).classed("mouseover",true);
		var d = obj.data.data[i];
		if(typeof obj.mouseover == "function") {
			return obj.mouseover(d,i,obj,path_id,shape);
		} else if(typeof obj.mouseover_caption == "function") {
			obj.map.tooltip.html(obj.mouseover_caption(d,i,obj,path_id,shape));
		} else if(obj.mouseover_caption) {
			obj.map.tooltip.html(obj.mouseover_caption,shape);
		}
	}
	this.pathMouseout = function(path_id,shape) {
		var i = d3.select(shape).attr("i");
		d3.select(shape).classed("mouseover",false);
		var d = obj.data.data[i];
		if(typeof obj.mouseout == "function") {
			return obj.mouseout(d,i,obj,path_id,shape);
		}
	}
	this.sortByStrokeWidth = function(strokefunc) {	
		//sorts so that smallest radius always on top
		obj.map.svg.selectAll(".line_"+obj.id) //for each of the paths...
		.sort(function (a,b) { //resort so bigger circles on bottom
			return strokefunc(b) - strokefunc(a);
		});
	}


	d3VizObj.addHook("run_on_each_data_row",this.processData);
	d3VizObj.addHook("run_after_data_and_map_loaded",this.load);
}
SVGPath.prototype = new d3Viz(SVGPath);

if(debug) console.log("SVGPath script loaded");