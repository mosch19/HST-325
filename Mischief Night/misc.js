//this file contains a few generic functions that are useful for this kind of map -- should not need to be modified

//resizes the svg to the window whenever the window size changes
function updateWindow(){
	var w = window;
	var window_width = w.innerWidth || e.clientWidth || g.clientWidth;
	var window_height = w.innerHeight|| e.clientHeight|| g.clientHeight;

	svg.attr("height", window_height);
}
window.onresize = updateWindow;



/* data circles */

//updates the size of the data circle radii based on a passed variable
function changeradius(option) {
	if(typeof data_circle_options.radius != "undefined") { //if a hard radius is set, just change it to that
        svg.selectAll("."+data_circle_options.circle_class)
            .attr("r", data_circle_options.radius);
		return;
	}
    if(option) {
        data_circle_options.selector_selected = option;
    }

    var radfunc = function(d) {
        if(typeof data_circle_options.selector_options[data_circle_options.selector_selected][1]=="function") {
            return Math.max(data_circle_options.selector_options[data_circle_options.selector_selected][1](d)+data_circle_options.radius_add,data_circle_options.radius_min);
        } else {
            return Math.max(data_circle_options.selector_options[data_circle_options.selector_selected][1]+data_circle_options.radius_add,data_circle_options.radius_min);
        }
    }
    if(option) {
        svg.selectAll("."+data_circle_options.circle_class) //for each of the circles...
            .transition()	//adding this means it will make the radius change in a smooth way
            .attr("r", radfunc);
    } else { //does it without transition on first go, otherwise can cause problems
        svg.selectAll("."+data_circle_options.circle_class) //for each of the circles...
            .attr("r", radfunc);
    }

	if(data_circle_options.autosort) {
		//sorts so that smallest radius always on top
		svg.selectAll("."+data_circle_options.circle_class) //for each of the circles...
            .sort(function (a,b) { //resort so bigger circles on bottom
                return radfunc(b) - radfunc(a);
            })
		;
	}

}

//updates color of circle based on passed variable
function changecolor(field) {
    if(field) {
        data_circle_options.color_field = field;
        if(typeof data_circle_options.fill_color == "function") {
            svg.selectAll("."+data_circle_options.circle_class)
                .transition()
                .style("fill", function(d) { return data_circle_options.fill_color(d); });
        } else {
            svg.selectAll("."+data_circle_options.circle_class)
                .transition()
                .style("fill", data_circle_options.fill_color);
        }
    } else {
        if(typeof data_circle_options.fill_color == "function") {
            svg.selectAll("."+data_circle_options.circle_class)
                .style("fill", function(d) { return data_circle_options.fill_color(d); });
        } else {
            svg.selectAll("."+data_circle_options.circle_class)
                .style("fill", data_circle_options.fill_color);
        }
    }
    if(typeof data_circle_options.color_legend == "function") {
        data_circle_options.color_legend();
    }
}

/* text filter

//    this function will filter the data with a given class. "selector_index" refers to the index of the selector_options array,
//    which is also the index of the SELECT tag created by the init function.
function textFilter(selector_index, selector_index2) {
    var fopt = text_filter_options; //gets the options variable
		var xopt = text_filter_options2; //**********************************************************
    d3.selectAll("."+fopt.filter_class) //select all the data by the class given
        .attr("class", function(d) { //now we set its class...
            var val = fopt.selector_options[selector_index][1]; //value to search for
						var val2 = xopt.selector_options[selector_index][1]; //******************************
            if(val===0) { //if the value is equal to zero
                return fopt.filter_class; //just set the class to default ("all")
            }
            var t = d[fopt.filter_field];
            if(typeof fopt.before_comparing == "function") t = fopt.before_comparing(t); //run the "before_comparing" function on the text if we need to
            if(typeof val == "function") { //if the value is a function
                if(val(t)) {
                    return fopt.filter_class+" "+fopt.text_found_class; //text is found
                } else {
                    return fopt.filter_class+" "+fopt.text_lacks_class; //text is found
                }
            } else { //otherwise, search it ourselves
                if(t.indexOf(val)>-1) { //indexOf gives the first instance of a piece of text in another piece of text, with -1 being returned if it isn't there
                    return fopt.filter_class+" "+fopt.text_found_class; //text is found
                } else {
                    return fopt.filter_class+" "+fopt.text_lacks_class; //text is not found
                }
            }
        })
}

function textFilter2(selector_index) {
    var fopt = text_filter_options2; //gets the options variable
    d3.selectAll("."+fopt.filter_class) //select all the data by the class given
        .attr("class", function(d) { //now we set its class...
            var val = fopt.selector_options[selector_index][1]; //value to search for
            if(val===0) { //if the value is equal to zero
                return fopt.filter_class; //just set the class to default ("all")
            }
            var t = d[fopt.filter_field];
            if(typeof fopt.before_comparing == "function") t = fopt.before_comparing(t); //run the "before_comparing" function on the text if we need to
            if(typeof val == "function") { //if the value is a function
                if(val(t)) {
                    return fopt.filter_class+" "+fopt.text_found_class; //text is found
                } else {
                    return fopt.filter_class+" "+fopt.text_lacks_class; //text is found
                }
            } else { //otherwise, search it ourselves
                if(t.indexOf(val)>-1) { //indexOf gives the first instance of a piece of text in another piece of text, with -1 being returned if it isn't there
                    return fopt.filter_class+" "+fopt.text_found_class; //text is found
                } else {
                    return fopt.filter_class+" "+fopt.text_lacks_class; //text is not found
                }
            }
        })
}
*/
//    this function will filter the data with a given class. "selector_index" refers to the index of the selector_options array,
//    which is also the index of the SELECT tag created by the init function.
function textFilter(selector_index, fopt) {
    // var fopt = text_filter_options; //gets the options variable
    d3.selectAll("."+fopt.filter_class) //select all the data by the class given
        .attr("class", function(d) { //now we set its class...
        	//console.log(d3.select(this).attr("class"));
        	var baseclass = toggleClass(d3.select(this).attr("class"),fopt.text_found_class,false);
			baseclass = toggleClass(baseclass,fopt.text_lacks_class,false);
            var val = fopt.selector_options[selector_index][1]; //value to search for
            if(val===0) { //if the value is equal to zero
                return baseclass; //just set the class to default ("all")
            }
            var t = d[fopt.filter_field];
            if(typeof fopt.before_comparing == "function") t = fopt.before_comparing(t); //run the "before_comparing" function on the text if we need to
            if(typeof val == "function") { //if the value is a function
                if(val(t)) {
                    return toggleClass(baseclass,fopt.text_found_class,true); //text is found
                } else {
                    return toggleClass(baseclass,fopt.text_lacks_class,true); //text is not found
                }
            } else { //otherwise, search it ourselves
                if(t.indexOf(val)>-1) { //indexOf gives the first instance of a piece of text in another piece of text, with -1 being returned if it isn't there
                    return toggleClass(baseclass,fopt.text_found_class,true); //text is found
                } else {
                    return toggleClass(baseclass,fopt.text_lacks_class,true); //text is not found
                }
            }
        })
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



/* stage zoomer — lets you zoom in/out by clicking on things -- should not need to touch! */

var zoom_factor = 1; //this variable just keeps track of how far it is zoomed (1 is default state of zoom)

//this zooms the mouse in if you click on something
//you shouldn't need to modify anything here...
function zoom_it(d) {
    var zs = zoom_settings;
    if(typeof zs == "undefined") {
        if(debug) console.log("Could not zoom because zoom_settings does not exist.");
        return false;
    }
    if(!zs.zoom_on_click) return false;
	var x, y;
	if(typeof zoom_settings.stage == "undefined") {
	    zoom_settings.stage = d3.selectAll("#stage");
	}
	//x and y are the pixel positions to center on
	//k is the zoom level
	if(!d&& !centered) {
		x = d3.mouse(this)[0];
		y = d3.mouse(this)[1];
		zoom_factor = zoom_settings.zoomed_factor_med;
		centered = true;
	} else if(!d && centered) {	//special case for clicking on things without positions
		x = width / 2;
		y = height / 2;
		zoom_factor = 1;
		centered = null;
	} else if(d.positions && centered !==d) { //if you click on something that has a "positions" property, it will center on it — this makes circles clickable
		x = d.positions[0];
		y = d.positions[1];
		zoom_factor = zoom_settings.zoomed_factor_high;
		centered = d;
	} else if (d && centered !== d) { //if you click on anything else that had position data (like a landform), it will figure out the center of it and them zoom on it
		var centroid = path.centroid(d);
		x = centroid[0];
		y = centroid[1];
		zoom_factor = zoom_settings.zoomed_factor_med;
		centered = d;
	} else { //if it detects it is already zoomed it, it zooms back out
		x = width / 2;
		y = height / 2;
		zoom_factor = 1;
		centered = null;
	}

	zoom_settings.stage.transition()
	  .duration(750)
	  .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")scale(" + zoom_factor + ")translate(" + -x + "," + -y + ")")
	;
}


//manually adds a caption point
function add_caption_point(lat,lon,text,angle,xoffset,yoffset,fontsize,circle,radius) {
	if(!map_source.projection) return false;
	if(typeof lat=="undefined") return false;
	if(typeof lon=="undefined") return false;
	if(typeof text=="undefined") text = "";
	if(typeof angle=="undefined") angle = -20;
	if(typeof xoffset=="undefined") xoffset = 8;
	if(typeof yoffset=="undefined") yoffset = 5;
	if(typeof fontsize=="undefined") fontsize = "";
	if(typeof circle=="undefined") circle = false;
	if(typeof radius=="undefined") radius = 3;

	var gpoint = captions.append("g").attr("class", "gpoint");
	var x = map_source.projection([lon,lat])[0];
	var y = map_source.projection([lon,lat])[1];

	if(circle) {
		gpoint.append("svg:circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("class","label_point")
			.attr("r", radius+"px")
	}

	//conditional in case a point has no associated text
	if(text.length>0){
		gpoint.append("text")
			.attr("transform", function() { return "translate("+(x+xoffset)+","+(y+yoffset)+")"+ (angle!==false?" rotate("+angle+")":"")})
			.style("font-size", function() { return (fontsize?(fontsize+"px"):""); })
			.attr("class","label")
			.text(text)
	}
}

//useful functions

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
