/* Alex Wellerstein's basic D3 Vizualization Template -- designed to make the creation of D3 vizualizations more modular 

v.3.0 (2017) -- now supports Google Maps


*/


var d3VizObj = {
	//holds data objects
	data: new Array(), //datasets
	maps: new Array(), //maps
	viz: new Array(), //visualizations
	controls: new Array(), //other things (filters, etc.)
	//hooks
	runHook: function(hook_name, hook_var) { //runs a hook function
		if(typeof d3VizObj.hooks[hook_name]!=="undefined") {
			if(debug) console.log("Hook: "+hook_name+" ["+d3VizObj.hooks[hook_name].length+"]");
			if(d3VizObj.hooks[hook_name].length>0) {
				for(var i in d3VizObj.hooks[hook_name]) {
					if(typeof d3VizObj.hooks[hook_name][i] == "function") d3VizObj.hooks[hook_name][i](hook_var);
				}			
			}
			//console.log(d3VizObj.hooks[hook_name]);
		} else {
			if(debug) console.log("Hook: "+hook_name+" [0]");
		}
	},
	addHook: function(hook_name, func) { //add a hook function
		if(typeof d3VizObj.hooks[hook_name]=="undefined") d3VizObj.hooks[hook_name] = [];
		d3VizObj.hooks[hook_name].push(func);
	},
	hooks: new Array(), //holder of hooks
	map_loaded: 0, //counts maps as they load
	data_loaded: 0, //counts datasets as they load
	viz_loaded: 0, //counts viz objects as they load
	datas_hook_run: 0, //records whether run_after_datas_loaded has run already 
	maps_hook_run: 0, //records whether run_after_maps_loaded has run already
	datas_maps_hook_run: 0, //records whether both have run
	is_loaded: function(obj) {
		if(obj.type=="map") this.map_loaded++;
		if(obj.type=="data") this.data_loaded++;
		if(obj.type=="viz") this.viz_loaded++;
		if((this.map_loaded>=d3VizObj.maps.length)&&(!this.maps_hook_run)) {
			d3VizObj.runHook("run_after_maps_loaded");
			this.maps_hook_run = true;
		}
		if((this.data_loaded>=d3VizObj.data.length)&&(!this.datas_hook_run)) {
			d3VizObj.runHook("run_after_datas_loaded");
			this.datas_hook_run = true;
		}
		if((this.map_loaded>=d3VizObj.maps.length)&&(this.data_loaded>=d3VizObj.data.length)&&(!this.datas_maps_hook_run)) {
			d3VizObj.runHook("run_after_data_and_map_loaded");
			this.datas_maps_hook_run = true;
		}
		if((this.map_loaded>=d3VizObj.maps.length)&&(this.data_loaded>=d3VizObj.data.length)&&(this.viz_loaded>=d3VizObj.viz.length)) {
			d3VizObj.runHook("run_after_everything");
		}
	},
	load: function() { //two for one -- loads maps and data in one go
		d3VizObj.addHook("run_after_map_loaded",function() { d3VizObj.loadData(); });
		d3VizObj.loadMaps();
	},
	loadMaps: function() { //load all the maps
		d3VizObj.runHook("run_before_maps_loaded");
		if(debug) console.log("Loading map(s): "+this.maps.length);
		if(this.maps.length) {
			for(var i in this.maps) {
				d3VizObj.runHook("run_before_map_loaded",this.maps[i]);
				if(debug) console.log("Loading map "+i);
				this.maps[i].load();
			}
		}
	},
	loadData: function() { //load all the data
		d3VizObj.runHook("run_before_datas_loaded");
		if(debug) console.log("Loading dataset(s): "+this.data.length);
		if(this.data.length) {
			for(var i in this.data) {
				d3VizObj.runHook("run_before_data_loaded",this.data[i]);
				if(debug) console.log("Loading dataset "+i);
				this.data[i].load();
			}
		}		
	},
};

function d3Viz(constructor) { //basic constructor for data, controls, etc.
	this.constructor = constructor;
	this.loadOptions = function(options) { //moves options into main scope
		for(var i in options) {
			this[i] = options[i];
		}
	}
}

function d3Data(options) {
	var obj = this;
	obj.loadOptions(options);

	if(typeof obj.debug == "undefined") obj.debug=false;

	this.type = "data";

	d3VizObj.data.push(this);
	this.id = d3VizObj.data.length-1;
	
	this.load = function () {
		if(obj.csv) {
			this.delim = ",";
			this.file = obj.csv;
			this.filetype = "CSV";
		} else if(obj.tsv) {
			this.delim = "\t";
			this.file = obj.tsv;
			this.filetype = "TSV";
		} 
		if(typeof this.mimetype == "undefined") this.mimetype = "text/plain";
		if(this.delim&&this.file) { 
			if(typeof this.filetype == "undefined") this.filetype="USERDEFINED";
			if(debug||obj.debug) console.log("Trying to load data from "+obj.file+" ("+obj.filetype+")");
			var dsv = d3.dsv(this.delim,this.mimetype);
			dsv(obj.file, function(datarows) {
				obj.data = new Array();
				if(datarows == null) alert("Could not load "+obj.file+" - check that file path is valid and you are using a browser that allows for file requests");
				var i = 0; //just a counter
				datarows.forEach(function (d) {
					d.i = parseInt(i); //keep track of row number
					if((debug&&debug_verbose)||obj.debug) console.log("Parsing row "+i);
					if(typeof obj.each == "function") {
						d = obj.each(d);
					}
					d3VizObj.runHook("run_on_each_data_row",{d,i,obj});
					if(d) { //if object still exists 
						obj.data.push(d);
						i++;
					}
				})
				d3VizObj.runHook("run_after_data_loaded",obj);
				d3VizObj.is_loaded(obj);
			})
		} else {
			if(debug||obj.debug) console.log("No file specified!"); //maybe someday add other types of support
			d3VizObj.is_loaded(this);
		}	
	}		
}
d3Data.prototype = new d3Viz(d3Data);


//SVG map -- JSON file
function d3SVGMap(options) {
	var obj = this;
	obj.loadOptions(options);

	obj.type = "map";
	obj.maptype = "SVG"; 
	obj.zoom_factor = 1; //keeps track of zooming for SVG elements

	if(typeof obj.debug == "undefined") obj.debug=false;

	obj.projection = d3.geo[obj.projection_name](); //set projection
	if(obj.projection_rotate) obj.projection.rotate(obj.projection_rotate) //rotates the world
	if(obj.projection_scale) obj.projection.scale(obj.projection_scale) 			 //sets the zoom factor 
	if(obj.projection_translate) obj.projection.translate(obj.projection_translate); //moves the map 
	
	d3VizObj.maps.push(obj); obj.id = d3VizObj.maps.length-1;

	//resizes map when window resizes
	this.updateWindow = function (obj) { 
		var w = window;
		var window_width = w.innerWidth || e.clientWidth || g.clientWidth;
		var window_height = w.innerHeight|| e.clientHeight|| g.clientHeight;
		obj.svg.attr("height", window_height);	
	}

	//loads map
	this.load = function() {
		//create a path to manipulate
		obj.path = d3.geo.path().projection(this.projection);

		//create a svg object, add to div
		obj.svg = d3.selectAll(obj.div).append('svg')
				.attr('width',obj.width)
				.attr('height',obj.height)
				.attr("viewBox","0 0 "+obj.width+" "+obj.height) //this last line makes it resize along with the browser window
		
		//make it resize with window -- can be override by setting noUpdate to true
		if(!obj.noUpdate) {
			window.onresize = function() { obj.updateWindow(obj) }
		}

		//creates various object groups we can later manipulate
		//you should not change these base three -- stage, landforms, and captions -- but you can add others
		this.addGroup("stage",obj.svg); //a basic group that other things are attached to -- useful for zooming
		this.addGroup("landforms",obj.stage); //where the base map lives

		if(typeof obj.graticule_function == "function") {
			this.addGroup("graticule",obj.stage); //where the graticule will live
			obj.graticule.append("path")
				.datum(obj.graticule_function)
				.attr("id", "map_"+obj.id+"_graticule")
				.attr("d", obj.path);
		}
		
		//run an onload if it exists
		if(typeof obj.onload == "function") obj.onload();
		
		//if we have map file
		if(obj.mapfile) {
			//load the json...
			d3.json(obj.mapfile, function(error, world) {
				if(debug) console.log("Loading mapfile ("+(obj.mapfile)+")");
				obj.topology = world;
				//this "switch" just makes this compatible with the two main types of map files
				switch(world.type) {
					case "FeatureCollection": 
					if(debug||obj.debug) console.log("Loading FeatureCollection");
					obj.landforms.append("g").attr("id","paths_"+obj.id)
						.selectAll(".land_boundaries")
						.data(world.features)
						.enter()
						.append("path")
						  .attr("id",function(d,i) {
							if(typeof obj.setid == "function") {
								return obj.setid(d);
							} else {
								return "id_"+obj.id+"_"+i;
							}
						  })
						  .each(function(d,i) {
							if(typeof obj.each == "function") {
								obj.each(d,i,this);
							}
						})
						.classed("boundaries",true)
						  .classed("map_"+obj.id,true)
						  .classed("map",true)
						  .classed("boundary",true)
						.attr("d", obj.path)
						;
					break;
					case "Topology":
						if(debug||obj.debug) console.log("Loading Topology");
						for(objectname in world.objects) {
							if(typeof obj.loadobjects == "undefined") {
								var loadobject = true;
							} else {
								if(obj.loadobjects.indexOf(objectname)>-1) {
									var loadobject = true;
								} else {
									var loadobject = false;
								}
							}
							if(debug||obj.debug) console.log("Found map object: "+objectname);
							if(loadobject) {
							if(debug||obj.debug) console.log("Loading map object: "+objectname);
								obj.addGroup(objectname,obj.landforms,"#"+objectname);
								for(item in world.objects[objectname]) {
									switch(world.objects[objectname].type) {
										case "MultiPolygon":
											d3.select("#"+objectname)
												.datum(topojson.feature(world,world.objects[objectname]))
												.append("path")
												.each(function(d,i) {
													if(typeof obj.each == "function") {
														obj.each(d,i,this);
													}
												  })
												.attr("d",obj.path)
										break;
										case "GeometryCollection":
											d3.select("#"+objectname).selectAll("path")
												.data(topojson.feature(world,world.objects[objectname]).features)
												.enter()
												.append("path")
												.attr("id",function(d,i) {
													if(typeof obj.setid=="function") {
														return obj.setid(d,objectname);
													} else {
														return "id_"+obj.id+"_"+objectname+"_"+i;
													}
												})
												.attr("class",function(d) {
													if(typeof obj.class == "function") {
														return obj.class(d);
													}else if(typeof obj.class=="undefined") {
														return "geojson_path";
													} else {
														return obj.class;
													}
												})
												.each(function(d,i) {
													if(typeof obj.each == "function") {
														obj.each(d,i,this);
													}
												  })
												.attr("d",obj.path)
										break;
										default:
											if(debug||obj.debug) {
												console.log("Unexpected geoJSON type:" + world.objects[objectname].type);
											}
										break;
									}
								}
							}	
						}
						/*
						obj.addGroup("land",obj.landforms,".land");
						obj.addGroup("boundaries",obj.landforms,".boundaries");
						//try to load all the map objects
						var xx = []; 
						for(x in world.objects) xx.push(x);
						for(y in xx) {
							x = xx[y];
							if(world.objects[x].type=="MultiPolygon") {
							  if(debug) console.log("Loading map object: "+x);
							  obj.land.append("path")
								  .datum(topojson.feature(world, world.objects[x]))
								  .classed("map_"+x,true)
								  .classed("map",true)
								  .classed("map_polygon",true)
								  .attr("id",function(d) {
								  	if(typeof obj.setid == "function") {
								  		console.log(d,obj.setid(d), d.id);
								  		return String(obj.setid(d));
								  	} else {
								  		return "id_"+obj.id+"_"+x;
								  	}
								  })
								  .attr("d", obj.path)
								  ;	
							} else if(world.objects[x].type=="GeometryCollection") {
							  if(debug) console.log("Loading map object: "+x);
							  obj.boundaries.selectAll(".boundaries")
								  .data(topojson.feature(world, world.objects[x]).features)
								  .enter()
								  .append("path")
								  .attr("id",function(d,i) {
								  	if(typeof obj.setid == "function") {
								  		return String(obj.setid(d));
								  	} else {
								  		if(typeof d.id!=="undefined") {
								  			return "id_"+String(d.id).replaceAll(" ","_");
								  		} else {
								  			if(typeof d.properties!=="undefined") {
								  				if(d.properties.id!=="undefined") {
								  					return "id_"+String(d.properties.id).replaceAll(" ","_");
								  				} else {
										  			return "id_"+i;						  				
								  				}
								  			} else {
									  			return "id_"+i;
									  		}
								  		}
								  	}
								  })
								  .each(function(d,i) {
								  	if(typeof obj.each == "function") {
								  		obj.each(d,i,this);
								  	}
								  })
								  .classed("map_"+x,true)
								  .classed("map",true)
								  .classed("boundary",true)
								  .attr("d", obj.path)
								  ;	
							} else {
								if(debug) console.log("Unknown map object: "+world.objects[x]);
							}
					}*/
					 break;
					 default:
					 	if(debug||obj.debug) console.log("Unknown world type ("+world.type+")");
					 break;
				}
				if(debug) console.log("Mapfile loaded ("+obj.mapfile+")");
				//run hook
				d3VizObj.runHook("run_after_map_loaded",obj);
				d3VizObj.is_loaded(obj);
			});
		} else {
			//no map file.. move on
			if(debug) console.log("Mapfile not loaded -- no mapfile defined!");
			d3VizObj.runHook("run_after_map_loaded");
			d3VizObj.is_loaded(this);
		} 
	}
	//adds a svg group
	this.addGroup = function(id, parent, label) {
		if(typeof label=="undefined") {
			this[id] = parent.append("g").attr("id",id);
		} else {
			if(label[0]=="#") {
				this[id] = parent.append("g").attr("id",label.substr(1,label.length));			
			} else if (label[0]==".") { 
				this[id] = parent.append("g").attr("class",label.substr(1,label.length));			
			}
		}
		return this[id];
	}
}
d3SVGMap.prototype = new d3Viz(d3SVGMap);

//Google Map -- 
function d3GMap(options) {
	var obj = this;
	obj.loadOptions(options);
	obj.type = "map";
	obj.maptype = "GMap";
	d3VizObj.maps.push(obj); obj.id = d3VizObj.maps.length-1;
	if(typeof obj.debug == "undefined") obj.debug=false;
	if(typeof obj.padding == "undefined") obj.padding = 50; //padding to extend boundary so markers aren't cut -- can be modified

	this.load = function () {
		if(debug) console.log("Loading Google Map");
		this.mapObj = new google.maps.Map(d3.select(obj.div).node(), obj.mapOptions);

		obj.overlay = new google.maps.OverlayView();
		obj.overlay.setMap(this.mapObj);

		obj.bounds = new google.maps.LatLngBounds();	

		//this runs when the overlay is first ready to use
		obj.overlay.onAdd = function() {
			obj.svg = d3.select(this.getPanes().overlayMouseTarget)
				.append("svg")
				.attr('id','svg')
				.attr('class','gmap')
			obj.addGroup("stage",obj.svg); //a basic group that other things are attached to -- useful for zooming
			d3VizObj.runHook("run_after_map_loaded",obj);
			d3VizObj.is_loaded(obj);
		}

		this.overlay.draw = function() {
			if(debug) console.log("Redrawing overlay");
				obj.projection = obj.overlay.getProjection();
				obj.sw = obj.projection.fromLatLngToDivPixel(obj.bounds.getSouthWest());
				obj.ne = obj.projection.fromLatLngToDivPixel(obj.bounds.getNorthEast());
				// extend the boundaries so that markers on the edge aren't cut in half
				obj.sw.x -= obj.padding;
				obj.sw.y += obj.padding;
				obj.ne.x += obj.padding;
				obj.ne.y -= obj.padding;

			//positions the SVG within the overlay
				d3.select("#svg")
					.attr('width',Math.max(obj.ne.x - obj.sw.x,0) + 'px')
					.attr('height',Math.max(obj.sw.y - obj.ne.y,0) + 'px')
					.style('position','absolute')
					.style('left',obj.sw.x+'px')
					.style('top',obj.ne.y+'px');

			d3VizObj.runHook("overlay_draw",obj);

		}

		//run an onload if it exists
		if(typeof obj.onload == "function") obj.onload();
	
	}

	//adds a svg group
	this.addGroup = function(id, parent, label) {
		if(typeof label=="undefined") {
			this[id] = parent.append("g").attr("id",id);
		} else {
			if(label[0]=="#") {
				this[id] = parent.append("g").attr("id",label.substr(1,label.length));			
			} else if (label[0]==".") { 
				this[id] = parent.append("g").attr("class",label.substr(1,label.length));			
			}
		}
		return this[id];
	}
	
	this.gprojection = function() {
	  return function(lnglat) {
	  	var prj = obj.overlay.getProjection();
		var ret = prj.fromLatLngToDivPixel(new google.maps.LatLng(lnglat[1],lnglat[0]));
		return [ret.x, ret.y]
	  };
}
	
}
d3GMap.prototype = new d3Viz(d3GMap);

//automates making a select element
function make_selector(settings) {
	var dv = document.createElement("div");
	if(settings.div_id) dv.id = settings.div_id;
	if(settings.div_class) dv.className = settings.div_class;
	if(settings.caption) {
		var cap = document.createTextNode(settings.caption);
		dv.appendChild(cap);
	}
	var sel = document.createElement("select");
	if(settings.select_id) sel.id = settings.select_id;
	if(settings.dataindex) sel.dataindex = settings.dataindex;
	if(settings.onchange) {
		sel.onchange = settings.onchange;
	}
	for(var i in settings.selector_options) {
		var opt = document.createElement("option");
		opt.text = settings.selector_options[i][0];
		opt.value = i;
		if(settings.default_option) {
			if(i==default_option) opt.selected = true;
		}
		sel.add(opt);
	}
	dv.appendChild(sel);
	if(settings.post_caption) {
		var cap2 = document.createTextNode(settings.post_caption);
		dv.appendChild(cap2);
	}
	if(settings.attach_to_id) {
		document.getElementById(settings.attach_to_id).appendChild(dv);
	} else if(settings.attach_to_element) {
		document[settings.attach_to_element].appendChild(dv);
	}
}

//allows to move an SVG object around
d3.selection.prototype.moveUp = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

//loads a script on the fly
function loadScript(url, callback) {
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}


//this is just a generic custom sorting function whose only thing going for it is that it can distinguish alphabetic vs. numeric sorting
function sort_it(a,b) {
    if(isNaN(a)) {
        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    } else {
        return a - b;
    }
}

// toggles a given class on or out of a typical class list
// this is similar to d3's .classed() function but can be used within attr("class") which is easier for a lot of cases
// it works by understanding that classes are just lists separated by spaces, so it converts that to an array, parses the array, recombines it into a string
function toggleClass(classlist,classname,toggle) {
	classes = classlist.split(" ");
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

//extends replace so it will replace all
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};