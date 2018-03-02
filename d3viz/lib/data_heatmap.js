/* Heatmap - by Alex Wellerstein, v2.0 

This data mode is for displaying data that can be plotted with latitude and longitude pairs. These will be represented by
circles ("dots") on the map. Their radius and color can be separately set based on either fixed values, or dynamically
according to rows in the dataset. Putting the mouse over a datapoint can trigger a tooltip event.

*/


function SVGHeatmap(options) {
	var obj = this;
	obj.loadOptions(options);
	this.type = "viz";
	d3VizObj.viz.push(obj); obj.id = d3VizObj.viz.length-1;

	//heatmap display settings (defaults)
	this.heatmapMaxDefault = 9500; 
	this.heatmapMinDefault = 0; 
	this.heatmapRadiusDefault = 16; 

	this.heatmapJSLoaded = false;
	this.waitUntilLoaded = false;
	loadScript("http://vizsociety.net/shared/js/heatmap2.js",function() { obj.heatmapJSLoaded = true; });


	//objects to be used
	var heatmapInstance = Array();
	var heatmapPoints = Array();
	var heatmapCanvas;
	var heatmapOptions = Array();
	var heatmapLat = Array();
	var heatmapLon = Array();
	var heatmapVal = Array(); 
	var heatmapMax = Array();
	var heatmapMin = Array();
	var heatmapRadius = Array(); 

	if(typeof obj.max =="undefined") obj.max = this.heatmapMaxDefault;
	if(typeof obj.min =="undefined") obj.min = this.heatmapMinDefault;
	if(typeof obj.radius =="undefined") obj.radius = this.heatmapRadiusDefault;

	this.points = [];

	if(debug||obj.debug) console.log("Initializing a heatmap for dataset "+obj.data.id);

	//makes sure we have position data, creates the points database
	this.ProcessData = function(r) {
		if(r.obj.id==obj.data.id) {

			if(!r.d.positions) { //we may have already calculated these...
				//pick out the lat/lon fields
				var lat = (r.obj.latLon(r.d)[0]);
				var lon = (r.obj.latLon(r.d)[1]);

				//check if the lat/lon are valid
				if(isNaN(lat)||isNaN(lon)) {
					if(debug) console.log("Ignored row "+r.i+" because lat or lon were not a number ("+lat+","+lon+")");
					r.d = ""; //ignore the data row
				} else {
					r.d.positions = obj.map.projection([lon,lat]); //create the pixel positions and add them to the data object 
					if(debug&&debug_verbose) console.log("Adding data for row "+r.i+" at "+lat+", "+lon);
				}
			}
			if(typeof r.d.positions!="undefined") {
				var point = {
					x: r.d.positions[0],
					y: r.d.positions[1],
					value: obj.val(r.d),
				}
				obj.points.push(point);
			}
		}
	}

	//function that initializes the heatmap once data is loaded
	this.showData = function(r) {
		if(debug||obj.debug) console.log("Adding heatmap layer for dataset "+obj.data.id);
		//create a heatmap div
		var div = document.createElement("div");
		div.id = "heatmap_"+obj.id;
		div.className = "heatmap";
		div.width = map.width;
		div.height = map.height;
		div.style.visibility = "hidden"; //we hide this!
		div.style.position = "absolute !important"; 
		div.style.top = 0;
		div.style.left = 0;
		div.style.right = 0;
		div.style.bottom=  0;
		div.style.pointerEvents = "none"; //this div should not be clickable
		document.body.appendChild(div); //add it to the body
	
		if(d3.select('#heatmap-canvas_heatmap_'+obj.id)[0][0]!==null) {
			d3.select('#heatmap-canvas_heatmap_'+obj.id).remove();
		};

		obj.instance = h337.create({
		  radius: obj.radius,
		  container: document.getElementById('heatmap_'+obj.id)
		});

		//render the image from data
		obj.heatmapData = { 
		  max: obj.max,
		  min: obj.min, 
		  data: obj.points
		};
		obj.instance.setData(obj.heatmapData);
		obj.loadHeatmapImage(); //add image to map	
	}

	this.loadHeatmapImage = function() {
		if(debug||obj.debug) console.log("Loading heatmap image to map for dataset "+obj.data.id);
	
		//OK, our heatmap is created, but still hidden

		//get the canvas element of the hidden div
		obj.canvas = document.getElementById('heatmap-canvas_heatmap_'+obj.id);
		obj.context = obj.canvas.getContext('2d');

		//get the image data from it
		obj.imgURL = obj.canvas.toDataURL(); 

		//add the image data to the SVG stage as an image, so it will scale with everything else

		if(d3.select('#heatmapSVG_'+obj.id)[0][0] == null) {
			obj.map.stage.append("svg:image")
				.attr('id','heatmapSVG_'+obj.id)
				.attr('class','heatmapSVG')
				.attr('x',0)
				.attr('y',0)
				.attr('width', obj.canvas.width)
				.attr('height', obj.canvas.height)
				.attr("xlink:href",obj.imgURL)
				;
		} else {
			d3.select('#heatmapSVG_'+obj.id)
				.attr('width', obj.canvas.width)
				.attr('height', obj.canvas.height)
				.attr("xlink:href",obj.imgURL)
				;
		}
	
		//and we're done!
		if(debug) console.log("Heatmap created");		
	}
	
	this.reload = function () {
	
		d3.select('#heatmap-canvas_heatmap_'+heatmap.id).remove(); //delete the old heatmap canvas element 

		obj.instance = h337.create({
		  radius: obj.radius,
		  container: document.getElementById('heatmap_'+obj.id)
		});

		//render the image from data
		obj.heatmapData = { 
		  max: obj.max,
		  min: obj.min, 
		  data: obj.points
		};
		
		obj.instance.setData(obj.heatmapData);
		obj.loadHeatmapImage(); //add image to map	
	}
	
	d3VizObj.is_loaded(obj);
	d3VizObj.addHook("run_on_each_data_row",this.ProcessData);
	d3VizObj.addHook("run_after_data_and_map_loaded",this.showData);
}
SVGHeatmap.prototype = new d3Viz(SVGHeatmap);
if(debug) console.log("SVGHeatmap script loaded");