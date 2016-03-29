//Radar Chart Tembot v1
//pre-requisite: underscore.js


/*
 * Random Helper Functions
 */

//if m surpases this, default to dy only
var POS_INFINTE = 100000000; //hundred million
var NEG_INFINITE = (-1 * POS_INFINTE);

var globalRadar; //not my greatest idea


function getPolygonClassName(className){
  return className + "-radar";
}

//getters and setters for the radar object
function setGlobalRadarObject(radar){
  globalRadar = radar;
}

function getGlobalRadarObject(){
  return globalRadar;
}

/*
 * Prototypes and Public functions
 */

//Constructor
function RadarChart(id, data, options){

  //Declarations
  this.id = id;
  this.data = data;
  this.options = options;
  this.maxAxisValues = [];
  this.minAxisValues = [];
  this.config = {
    radius: 6, // Radius Point
    width: 600,
    height: 600,
    factor: 1, // Scaling Box
    factorLegend: 0.85,
    levels: 3, // Layers Box
    maxValue: 1,
    radians: 2 * Math.PI,
    opacityArea: 0.5,
    color: d3.scale.category10(),
    normalize: false
  };
  this.tooltip;
}

//based on the options passed in by the user,
//update the configuration
RadarChart.prototype.updateConfiguration = function(options) {
  if(options)
    for(var i in options){
      this.config[i] = options[i];
    }
};

//based on the data passed in
//update the scale the radar chart will use
RadarChart.prototype.updateScale = function() {
  var max_array = [];
  _.each(this.data, function(datum){
    var result =_.max(datum.axes, function(axis){ return axis.value; });
    max_array.push(result.value);
  });

  this.config.maxValue = Math.max(this.config.maxValue, d3.max(max_array));
};

// binds the arrays and the number of total axes
//to the Radar chart object
RadarChart.prototype.addAxisNames = function() {
  var names = [];
  _.each(this.data, function(radar){
    _.each(radar.axes, function(axis){ names.push(axis.axis); });
  });

  this.axisNames = _.uniq(names, function(item){
    return item;
  });
  this.totalAxisLength = this.axisNames.length;
};

//binds the radar radius to the RadarChart
RadarChart.prototype.computeRadius = function() {
  this.radarRadius = this.config.factor * Math.min(this.config.width / 2.0, this.config.height / 2.0);
};

RadarChart.prototype.drawFrame = function() {
  //to be added later for visual purposes of course
};

//this is designed to draw all unique axes that are passed in
//even if the two radar charts have two different sets of data
RadarChart.prototype.drawAxis = function() {
  // body...
  //generate the axis element
  var radar = this; //bind this to RadarChart so that we can acess config objects and such
  var axis = radar.graph.selectAll(".axis")
                       .data(radar.axisNames)
                       .enter()
                       .append("g")
                       .attr("class", "axis");

  //add the corresponding lines for each unique axis
  axis.append("line")
      .attr("x1", radar.config.width / 2.0)
      .attr("y1", radar.config.height / 2.0)
      .attr("x2", function(axis, index){
        radar.maxAxisValues[index] = {
          x: radar.config.width / 2.0 * (1 - radar.config.factor * Math.sin(index * radar.config.radians / radar.totalAxisLength)),
          y: 0
        };
        return radar.maxAxisValues[index].x;
      })
      .attr("y2", function(axis, index){
        radar.maxAxisValues[index].y = radar.config.height / 2.0 * (1 - radar.config.factor * Math.cos(index * radar.config.radians / radar.totalAxisLength));
        return radar.maxAxisValues[index].y;
      })
      .attr("line_slope", function(axis, index){
        var dy = radar.maxAxisValues[index].y - (radar.config.height / 2.0);
        var dx = radar.maxAxisValues[index].x - (radar.config.width / 2.0);
        return dy/dx;
      })
      .attr("class", function(axis, index){
        return "line-"+index;
      })
      .style("stroke", "#7f8c8d")
      .style("stroke-width", "2px");

  //this will be used for the tooltips so that lables
  //and legends can be added to the chart for better viewing
  axis.append("text")
      .text(function(axis){return axis;})
      .style("font-family", "Helvetica")
      .style("font-size", "10px")
      .attr("transform", function (axis, index) { return "translate(0, -10)"; })
      .attr("x", function(axis, index){
        return radar.config.width / 2.0 * (1 - radar.config.factorLegend * Math.sin(index * radar.config.radians / radar.totalAxisLength)) - 20 * Math.sin(index * radar.config.radians / radar.totalAxisLength);
      })
      .attr("y", function(axis, index){
        return radar.config.height / 2.0 * (1 - Math.cos(index * radar.config.radians / radar.totalAxisLength) + 20 * Math.cos(index * radar.config.radians / radar.totalAxisLength));
      });
};


//for a given radar chart, this calculates the data points required
//returns a double array of the x & y coordinates
RadarChart.prototype.calculatePoints = function(data) {

  var dataValues = [];
  var radar = this;
  radar.graph.selectAll(".nodes")
      .data(data, function(axis, index){
        dataValues[index] = [
          radar.config.width / 2 * (1 - (parseFloat(Math.max(axis.value, 0)) / radar.config.maxValue) * radar.config.factor * Math.sin(index * radar.config.radians / radar.totalAxisLength)),
          radar.config.height / 2 * (1 - (parseFloat(Math.max(axis.value, 0)) / radar.config.maxValue) * radar.config.factor * Math.cos(index * radar.config.radians / radar.totalAxisLength))
        ]
      });
  return dataValues;
};

RadarChart.prototype.baseStepScale = function () {
  var baseScale = [];
  var radar = this;
  _.each(radar.data[0].axes, function(axis, index){
    var array = [];
    _.each(_.range(radar.config.maxValue + 1), function(value){
      var object = {
        index: index,
        value: value,
        x: radar.config.width / 2 * (1 - (parseFloat(Math.max(value, 0)) / radar.config.maxValue) * radar.config.factor * Math.sin(index * radar.config.radians / radar.totalAxisLength)),
        y: radar.config.height / 2 * (1 - (parseFloat(Math.max(value, 0)) / radar.config.maxValue) * radar.config.factor * Math.cos(index * radar.config.radians / radar.totalAxisLength))
      };
      array.push(object);
    });
    var item = {
      name: axis.axis,
      points: array
    };
    baseScale.push(item);
  });
  radar.baseScale = baseScale;
};

//for a data points object (bounded by the datapoints class name)
//create a new polygon object
//returns the generated polygon
RadarChart.prototype.generatePolygon = function(dataPoints, index) {
  var radar = this;
  var polygon = radar.graph.selectAll("area")
                     .data([dataPoints.data])
                     .enter()
                     .append("polygon")
                     .attr("class", getPolygonClassName(dataPoints.className))
                     .style("stroke-width", "2px")
                     .style("stroke", radar.config.color(index))
                     .on("mouseover", function(object){
                        element = "polygon." + d3.select(this).attr("class");
                        radar.graph.selectAll("polygon").transition(200).style("fill-opacity", 0.1);
                        radar.graph.selectAll(element).transition(200).style("fill-opacity", 0.7);
                     })
                     .on("mouseout", function(){
                      radar.graph.selectAll("polygon").transition(200).style("fill-opacity", radar.config.opacityArea);
                     })
                     .style("fill", function(data, i){ return radar.config.color(index); })
                     .style("fill-opacity", radar.config.opacityArea);
  return polygon;
};

//for a given polygon, return a string of points generated from recalulate points
//this is the actual function that renders the polygon on top
RadarChart.prototype.renderPolygon = function(polygon) {
  polygon.attr("points", function(data){
    var string =  "";
    for(var index = 0; index < data.length; index++){
      string = string + data[index][0] + "," + data[index][1] + " ";
    }
    return string;
  });
};

RadarChart.prototype.renderNodes = function(data, index) {
  // body...
  var radar = this;
  radar.graph.selectAll(".nodes")
       .data(data.axes)
       .enter()
       .append("svg:circle").attr("class", getPolygonClassName(data.className))
       .attr("r", radar.config.radius)
       .attr("alt", function(axis){ return Math.max(axis.value, 0); })
       .attr("cx", function(axis, index){
          return radar.config.width / 2.0 * (1 - (Math.max(axis.value, 0) / radar.config.maxValue) * radar.config.factor * Math.sin(index * radar.config.radians / radar.totalAxisLength));
       })
       .attr("cy", function(axis, index){
          return radar.config.height / 2.0 * (1 - (Math.max(axis.value, 0) / radar.config.maxValue) * radar.config.factor * Math.cos(index * radar.config.radians / radar.totalAxisLength));
       })
       .attr("data-id", function(axis){ return axis.axis; })
       .attr("circle-class", data.className)
       .style("fill", radar.config.color(index))
       .style("fill-opacity", 0.9)
       .call(d3.behavior.drag().on("drag", radar.moveStep))
       .append("svg:title")
       .text(function (data) {
         return Math.max(data.value, 0);
       });
};

//using dx and dx, return a precomputed step x and y
RadarChart.prototype.moveStep = function (axis, index) {

  //algorithm
  //retrieve current axis, value, and index
  //retrieve dx and dy
  //if there is a positive change for dx and dy
    //incremenet the value and return the computed x & y
  //if there is a decrease change for dx and dy
    //decrement the value and return the computed x & y
  //update the value associated with the radar chart
  //run and variant of dataValues? returning the precomupted points
  //update the polygon x&y position

  //one problem is negative axis values, which need to be flipped
  //when encoutering positive and negative values

  var radar_chart =  getGlobalRadarObject();
  this.parentNode.appendChild(this);
  var target = d3.select(this);
  var slope = d3.select('.line-'+index).attr("line_slope");
  var base_axis =  _.find(radar_chart.baseScale, function(item){
    return item.name === axis.axis;
  });


  //grab current x*y
  var oldPoint = base_axis.points[axis.value];
  //log difference
  var difference = {
    "x": d3.event.x - oldPoint.x,
    "y": d3.event.y - oldPoint.y
  };

  //12.5 comes from the length of the axis / maxConfigValue
  if(slope === "Infinity" || slope > POS_INFINTE){
    if(difference.y >= 50 && d3.event.dy < 0){
      var newVal = axis.value + axis.step;
    }else if(difference.y> -12.5 && d3.event.dy > 0){
      var newVal = axis.value - axis.step;
    }else{
      var newVal = axis.value;
    }
  }else if(slope === "-Infinity" || slope < NEG_INFINITE){
    if(difference.y >= 12.5 && d3.event.dy < 0){
      var newVal = axis.value + axis.step;
    }else if(difference.y >= 12.5 && d3.event.dy > 0){
      var newVal = axis.value - axis.step;
    }else{
      var newVal = axis.value;
    }
  }else{
    if(difference.x >= 12.5){
      var newVal = axis.value + axis.step;
    }else if(difference.x <= -12.5){
      var newVal = axis.value - axis.step;
    }else{
      var newVal = axis.value;
    }
  }

  if(newVal > radar_chart.config.maxValue)
    newVal = radar_chart.config.maxValue;
  if(newVal <= 0)
    newVal =  0;

  var newPoint = base_axis.points[newVal];
  if(newPoint){
    target.attr("cx", function(){ return newPoint.x; })
          .attr("cy", function(){ return newPoint.y; });
  }


  var data_chart = _.find(radar_chart.data, function(chart){
    return chart.className === target.attr("circle-class");
  });

  _.each(data_chart.axes, function(a){
    if(a.axis === axis.axis)
      a.value = newVal;
  });
  radar_chart.update();

};

RadarChart.prototype.moveAlt = function (axis, index) {
  var radar_chart =  getGlobalRadarObject();
  this.parentNode.appendChild(this);
  var target = d3.select(this);

  //used to determine the step count when dx and dy change
  var slope = d3.select('.line-'+index).attr("line_slope");
  var oldData = target.data()[0];
  var oldVal =  axis.value;
  var step = axis.step;


  //Coordinates
  var oldX = parseFloat(target.attr("cx"));
  var oldY = parseFloat(target.attr("cy"));
  var newY = 0, newX = 0, newVal = 0;
  var maxX = radar_chart.maxAxisValues[axis.order].x, maxY = radar_chart.maxAxisValues[axis.order].y;

  //algo
  //if the slope is positive
    //if the slope is approaching infinte
      //only update the dy value
    //else
      //update target cx and cy by adding dx and dy
    //increase value by one step
  //if the slope is negative
    //if the slope is approaching infinte
      //only decrement the dy value
    //else
      //update target cx and cy by decrementing dx and dy

  if(slope === "Infinity"){
    //console.log("infinite");
    newX = oldX;
    newY = oldY + d3.event.dy;
    if (Math.abs(newY) >= Math.abs(maxY)){
      newY = maxY;
      newVal = oldVal;
    }else{
      if(d3.event.dy > 0)
        newVal = oldVal + step;
      else
        newVal = oldVal - step;
    }
  }else if(slope === "-Infinity"){
    //console.log("neg infinite");
    newX = oldX;
    newY = oldY - d3.event.dy;
    if (Math.abs(newY) >= Math.abs(maxY)){
      newY = maxY;
      newVal =  oldVal;
    }else{
      if(d3.event.dy > 0)
        newVal = oldVal + step;
      else
        newVal = oldVal - step;
    }
  }else{
    newX = oldX + d3.event.dx;
    if (Math.abs(newX) > Math.abs(maxX)){
      //console.log("what's good");
      newX = maxX;
      newY = maxY;
      newVal = oldVal;
    }else{
      var b =  -1 * ((slope * oldX) / oldY);
      newY = (slope * newX) + b;
      if(d3.event.dx > 0)
        newVal = oldVal + step;
      else
        newVal = oldVal - step;
    }
  }

  target.attr("cx", function(){ return newX; })
        .attr("cy", function(){ return newY; });

  var data_chart = _.find(radar_chart.data, function(chart){
    return chart.className === target.attr("circle-class");
  });

  _.each(data_chart.axes, function(a){
    if(a.axis === axis.axis)
      a.value = newVal;
  });
  radar_chart.update();

};

RadarChart.prototype.move = function(axis, index) {
  // body...

  //call global accessor - that way we can access the data and update it accordingly
  var radar_chart = getGlobalRadarObject();

  this.parentNode.appendChild(this);
  var target = d3.select(this);
  var slope = d3.select('.line-'+index).attr("line_slope");
  console.log("slope: " + slope);
  var target_axis = d3.selectAll('.axis')[0][index];
  var oldData = target.data()[0];

  var oldX = parseFloat(target.attr("cx"));
  var oldY = parseFloat(target.attr("cy"));
  var newY = 0, newX = 0, newVal = 0;
  var maxX = radar_chart.maxAxisValues[axis.order].x, maxY = radar_chart.maxAxisValues[axis.order].y;

  console.log("d3: " + d3.event.dx + ":" + d3.event.dy);
  console.log(axis);

  // Infinite slope special case
  if (slope === "Infinity" || slope === "-Infinity") {
    console.log("bam");
    newY = oldY + d3.event.dy;
    console.log(oldY + ":" + newY);
    if (Math.abs(newY) > Math.abs(maxY)){
      newY = maxY;
    }
    newValue = (newY / oldY) * oldData.value;
    console.log("bam value: " + newValue);
  } else {
    console.log("whammy");
    var temp = oldY / oldX;
    newX = d3.event.dx + oldX;
    console.log(oldX + "-" + newX);
    if (Math.abs(newX) > Math.abs(maxX)){
      newX = maxX;
    }
    newY = newX * Math.abs(slope);

    //Using the concept of similar triangles to calculate the new value of the geometric
    var ratio = newX / oldX;
    newValue = Math.abs(ratio) * oldData.value;
    console.log("whammy-value: " + newValue);
    if(newValue > radar_chart.config.maxValue)
      newValue = radar_chart.config.maxValue;
  }

  //console.log(this);

  target.attr("cx", function(){ return newX; })
        .attr("cy", function(){ return newY; });

  //here we go
  //"this" is bound to the circle dom element so that
  //we can compute the dx and dy
  //using the global accessor, we can change the associated value
  //for a particular
  var data_chart = _.find(radar_chart.data, function(chart){
    return chart.className === target.attr("circle-class");
  });

  _.each(data_chart.axes, function(a){
    if(a.axis === axis.axis){
      //console.log(radar_chart.data[0].axes[4].value);
      a.value = newValue;
      //console.log(radar_chart.data[0].axes[4].value);
      //console.log("done");
    }

  });

  /*_.each(radar_chart.data, function(chart){
    if(chart.className === data_chart.className)
      data_chart = chart;
  });*/

  //setGlobalRadarObject(radar_chart);
  radar_chart.update();

};

RadarChart.prototype.update = function() {
  var radar_chart = this;
  //get rid of any remaining svgs
  d3.select(radar_chart.id).select("svg").remove();

  //create the graph
  radar_chart.graph = d3.select(radar_chart.id)
                        .append("svg")
                        .attr("width", radar_chart.config.width)
                        .attr("height", radar_chart.config.height)
                        .append("g");

  radar_chart.drawAxis();
  _.each(radar_chart.data, function(radar, index){
      //generate data points
      var dataPoints = {
        className: radar.className,
        data : radar_chart.calculatePoints(radar.axes)
      };

      //render polygon
      var poly = radar_chart.generatePolygon(dataPoints, index);
      radar_chart.renderPolygon(poly);
      radar_chart.renderNodes(radar, index);
   });
};

//this function is the main driver of the application
//given a radar chart and it's options, create & render
//a multi-draggable radar chart
RadarChart.prototype.draw = function() {

  //set global accessor (mainly used in move function)
  setGlobalRadarObject(this);

  var radar_chart = this;
  radar_chart.updateConfiguration(radar_chart.options);
  radar_chart.updateScale();
  radar_chart.addAxisNames();
  radar_chart.computeRadius();
  radar_chart.baseStepScale();

  //get rid of any remaining svgs
  d3.select(radar_chart.id).select("svg").remove();

  //create the graph
  radar_chart.graph = d3.select(radar_chart.id)
                        .append("svg")
                        .attr("width", radar_chart.config.width)
                        .attr("height", radar_chart.config.height)
                        .append("g");

  //draw the frame and the axis
  //radar_chart.drawFrame();
  radar_chart.drawAxis();

   _.each(radar_chart.data, function(radar, index){
      var dataPoints = {
        className: radar.className,
        data : radar_chart.calculatePoints(radar.axes)
      };

      //render polygon
      var poly = radar_chart.generatePolygon(dataPoints, index);
      radar_chart.renderPolygon(poly);
      radar_chart.renderNodes(radar, index);
   });

};
