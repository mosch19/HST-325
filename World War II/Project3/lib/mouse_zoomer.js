/* Mouse Zoomer -- makes it so that you can set certain objects so that if you click on them, it will zoom in/out on them. */
//v. 2.0

/* To use -- first select which objects (by class, element, or id) to attach the zoom events to */
//objects to apply the zoom event to -- by class or element or id

function mouseZoomer(options) {
	var obj = this; 
	obj.loadOptions(options);
	if(obj.map.maptype!="SVG") {
		if(debug||obj.debug) console.log("Map zoomer only works on SVG maps -- not loading");
		return false;
	}
	d3VizObj.controls.push(obj); obj.id = d3VizObj.controls.length-1;
	if(typeof obj.click_event=="undefined") obj.click_event = "click";
	if(typeof obj.zoom_factor=="undefined") obj.zoom_factor = 3;
	if(typeof obj.positions_zoom_factor=="undefined") obj.positions_zoom_factor = 5;
	if(typeof obj.zoom_transition_speed=="undefined") obj.zoom_transition_speed = 700;
	if(typeof obj.preserve_strokes == "undefined") obj.preserve_strokes = []; //no longer necessary


	obj.centered = null;
	obj.strokes = [];
	if(typeof obj.svg=="undefined") obj.svg = "stage";

	this.addZoomEvents = function() {
		if(debug||obj.debug) console.log("Attaching zoom events");
		for(var i in obj.zoom_if_clicked) {
			if(debug||obj.debug) console.log("Attaching to "+obj.zoom_if_clicked[i]);
			obj.map[obj.svg].selectAll(obj.zoom_if_clicked[i])
				.on(obj.click_event, obj.zoom) //let it take clicks
			;
		}
		if(debug||obj.debug) console.log("Done attaching");
	}

	if(obj.preserve_strokes.length) {
		this.preserveStrokes = function() {
			if(debug||obj.debug) console.log("Zoomer: Preserving strokes");
			for(var i in obj.preserve_strokes) {
				if((typeof window[obj.preserve_strokes[i]] !="undefined")||(typeof obj.preserve_strokes[i] !="undefined")||(obj.map[obj.svg].selectAll(obj.preserve_strokes[i]).length>0)) {
				   try {
					d3.selectAll(obj.preserve_strokes[i]).attr("_z_stroke-width",function(d) { return parseFloat(window.getComputedStyle(this).strokeWidth); });
					obj.strokes[i] = parseFloat(obj.map[obj.svg].select(obj.preserve_strokes[i]).style("stroke-width"));
				   } catch(err) {
					if(debug||obj.debug) console.log("Mouse zoomer tried to get the stroke of items '" + obj.preserve_strokes[i]+"' but failed (it might not exist)");
				   }
				}
			}
		}
	}
		
	this.zoom = function(d) {
		var x, y;
		var zoom_out = false;
		//x and y are the pixel positions to center on
		//k is the zoom level
		if(!d&& !obj.centered) {
			x = d3.mouse(this)[0];
			y = d3.mouse(this)[1];
			obj.map.zoom_factor = obj.zoom_factor;
			obj.centered = true;
		} else if(!d && obj.centered) {	//special case for clicking on things without positions
			x = obj.map.width / 2;
			y = obj.map.height / 2;
			obj.map.zoom_factor = 1;
			obj.centered = null;
		} else if(d.positions && obj.centered !==d) { //if you click on something that has a "positions" property, it will center on it â€” this makes circles clickable
			x = d.positions[0];
			y = d.positions[1];
			obj.map.zoom_factor = obj.positions_zoom_factor;
			obj.centered = d;
		} else if (d && obj.centered !== d) { //if you click on anything else that had position data (like a landform), it will figure out the center of it and them zoom on it
			if(obj.zoom_to_centroid) {
				var centroid = obj.map.path.centroid(d);
				x = centroid[0];
				y = centroid[1];
			} else {
				x = d3.mouse(this)[0];
				y = d3.mouse(this)[1];
			}
			obj.map.zoom_factor = obj.zoom_factor;
			obj.centered = d;
		} else { //if it detects it is already zoomed it, it zooms back out
			zoom_out = true;
			x = obj.map.width / 2;
			y = obj.map.height / 2;
			obj.map.zoom_factor = 1;
			obj.centered = null;
		}
		var zoom_functions = 0;

		obj.map[obj.svg].selectAll("path")
		  .classed("active", obj.centered && function(d) { return d === obj.centered; });
		
		if(obj.preserve_strokes.length) {
			obj.map[obj.svg]
			  .transition()
			  .duration(obj.zoom_transition_speed)
			  .attr("transform", "translate(" + obj.map.width / 2 + "," + obj.map.height / 2 + ")scale(" + obj.map.zoom_factor + ")translate(" + -x + "," + -y + ")")
			  .selectAll(obj.preserve_strokes[0])
				.style("stroke-width",function() {
						if(typeof d3.select("#"+this.id).attr("_z_stroke-width")!=="undefined") {
						return d3.select("#"+this.id).attr("_z_stroke-width")/obj.map.zoom_factor;
					} else {
						return obj.strokes[0]/obj.map.zoom_factor;
					}
				})
			;
			if(obj.preserve_strokes.length>1) {
				for(var i in obj.preserve_strokes) {
					if(i>0) {
						obj.map[obj.svg].selectAll(obj.preserve_strokes[i])
							.transition()
							.duration(obj.zoom_transition_speed)
							.style("stroke-width",function() {
								if(typeof d3.select("#"+this.id).attr("_z_stroke-width")!=="undefined") {
									return d3.select("#"+this.id).attr("_z_stroke-width")/obj.map.zoom_factor;
								} else {
									return obj.strokes[0]/obj.map.zoom_factor;
								}
							})								
						; 
					}
				}
			}
		} else {
			obj.map[obj.svg].transition()
			  .duration(obj.zoom_transition_speed)
			  .attr("transform", "translate(" + obj.map.width / 2 + "," + obj.map.height / 2 + ")scale(" + obj.map.zoom_factor + ")translate(" + -x + "," + -y + ")")
		}

		if(zoom_out) {
			if(typeof obj.zoomOut == "function") {
				obj.zoomOut(d,x,y);
			}
		} else {
			if(typeof obj.zoomIn == "function") {
				obj.zoomIn(d,x,y);
			}
		}					

	}
	d3VizObj.addHook("run_after_everything",this.addZoomEvents);
	if(obj.preserve_strokes.length) {
		d3VizObj.addHook("run_after_everything",this.preserveStrokes);	
	}
}
mouseZoomer.prototype = new d3Viz(mouseZoomer);


if(debug) console.log("Mouse zoomer script loaded");