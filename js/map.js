import {
  CAR_RADIUS,
  CAR_COLOR,
  PICKUP_COLOR,
  DELIVERY_COLOR,
  NODE_COLOR,
  PATH_COLOR,
  PATH_WIDTH,
  SELECTED_PATH_COLOR,
  SELECTED_PATH_WIDTH,
  SLIDER_WIDTH
} from "/dataviz-smood-public/js/constants.js";

function mercatorX(lon) {
  return lon * Math.PI / 180;
}
function mercatorY(lat) {
  return Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
}

export default class MapPlot {
  constructor(svg_id, data, width, height, bounds, nodes, margin) {
    this.width = width;
    this.height = height;
    this.svg = d3
      .select("#" + svg_id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.pickups = this.svg.append("g").attr("id", "pickups");
    this.deliveries = this.svg.append("g").attr("id", "deliveries");
    this.cars = this.svg.append("g").attr("id", "cars");
    this.paths = this.svg.append("g").attr("id", "paths");
      
    // add the background map
    var lausanne_background = L.map('background_map').setView([46.5197, 6.6323], 13); 
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(lausanne_background);
      
      

    //this.nodes = nodes;
    this.wholeData = data;
    this.currentData = data;

    // helper to map, for any intermediate node, the associated route ids
    this.nodesToRouteMap = new Map(
      nodes.map(n => [{ lat: n.lat, lon: n.lon }, n.delivery_ids])
    );

    this.updateBounds(bounds);

    this.lineFunction = d3 // helper to get a line given an array of pairs [lat, lon]
      .line()
      .x(d => this.getX(d[1]))
      .y(d => this.getY(d[0]))
      .curve(d3.curveLinear);

    this.addPaths(data, PATH_COLOR, PATH_WIDTH);

    // add elements to the graph
    this.addPickupPoints(data);
    this.addDeliveryPoints(data);

    // slider functionality

    //    <input type="range" name="slider" id="slider" min="0" max="100" width="500">
    //    <input type="text" name="slider_val" size="3" id="slider_val">

    this.totalTicks = 12 * 60;
    let self = this;

    let sliderVal = d3
      .select("body")
      .append("span")
      .attr("id", "slider-val");

    this.sliderVal = sliderVal;

    this.slider = d3
      .select("body")
      .append("input")
      .attr("type", "range")
      .attr("id", "slider")
      .attr("min", 0)
      .attr("max", this.totalTicks)
      .attr("width", SLIDER_WIDTH)
      .on("input", function() {
        let percent = +this.value / self.totalTicks;

        let timeParse = d3.timeParse("%H:%M:%S");
        let minDate = timeParse("10:00:00");
        let maxDate = timeParse("22:00:00");

        let minTime = minDate.getTime();
        let maxTime = maxDate.getTime();

        let date = new Date(minTime + percent * (maxTime - minTime));

        self.sliderVal.text(date.toString());
        self.updateCars(self.currentData, date);
      });

    // beta
    //this.addNodes(nodes);
  }

  // helper to create a unique key for a point
  keyFromCoords(d) {
    return d.lat + "/" + d.lon;
  }

  // data points are values with x, y, radius
  addPoints(container, data, color) {
    let circles = container.selectAll("circle").data(data, this.keyFromCoords);

    return circles
      .enter()
      .append("circle")
      .attr("cx", d => this.getX(d.lon))
      .attr("cy", d => this.getY(d.lat))
      .attr("r", d => d.radius)
      .style("fill", color)
      .style("stroke", "black")
      .style("stroke-width", 1);

    //circles.exit().remove();
  }

  movePoints(container, newData, color) {}

  // helper to perform .groupby(p => p.lat, p.lon).count()
  countPoints(points) {
    let counts = points.map(this.keyFromCoords).reduce((acc, k) => {
      acc[k] = acc[k] !== undefined ? acc[k] + 1 : 1;
      return acc;
    }, {});

    return Object.keys(counts).map(d => {
      let coord = d.split("/");
      return {
        lat: coord[0],
        lon: coord[1],
        count: counts[d]
      };
    });
  }

  addPickupPoints(data) {
    let pickupPoints = data.map(d => ({ lat: d.plat, lon: d.plon }));
    let pData = this.countPoints(pickupPoints).map(d => ({
      lat: d.lat,
      lon: d.lon,
      radius: Math.sqrt(d.count)
      //radius: Math.log(d.count)
    }));

    console.log(pData);

    this.addPoints(this.pickups, pData, PICKUP_COLOR).on("click", d => {
      this.highlightPaths(
        this.roadsStartingFrom(d.lat, d.lon),
        SELECTED_PATH_COLOR
      );
    });
  }

  addDeliveryPoints(data) {
    let deliveryPoints = data.map(d => ({ lat: d.dlat, lon: d.dlon }));
    let dData = this.countPoints(deliveryPoints).map(d => ({
      lat: d.lat,
      lon: d.lon,
      radius: Math.sqrt(d.count)
      //radius: Math.log(d.count) * 0.8
    }));
    console.log(dData);
    this.addPoints(this.deliveries, dData, DELIVERY_COLOR).on("click", d => {
      this.highlightPaths(this.roadsGoingTo(d.lat, d.lon), SELECTED_PATH_COLOR);
    });
  }

  addNodes(nodes) {
    let points = nodes.map(n => ({
      lat: n.lat,
      lon: n.lon,
      radius: Math.log(n.n) * 0.2
    }));

    console.log(points);
    this.addPoints(this.nodes, points, NODE_COLOR);
  }

  // get roads starting from entry.lat, entry.lon
  roadsStartingFrom(lat, lon) {
    return this.currentData.filter(d => d.plat == lat && d.plon == lon);
  }

  // get roads ending at lat, lon
  roadsGoingTo(lat, lon) {
    return this.currentData.filter(d => d.dlat == lat && d.dlon == lon);
  }

  // get roads passing through lat, lon
  roadsGoingThrough(lat, lon) {
    indexes = this.nodesToRouteMap
      .get({ lat: lat, lon: lon })
      .replace(/[ \[\]]/g, "")
      .split(",");
    return indexes.map(i => this.wholeData[i]);
  }

  // helper to get a line (d attribute of <path>) given a datapoint
  // d has plat, plon, dlat, dlon, road
  getLine(d) {
    let nodes = d.road
      .replace(/[' \[\]]/g, "")
      .split(",")
      .filter(d => d != "None")
      .map(coord => coord.split("/"));
    let points = [[d.plat, d.plon]].concat(nodes).concat([[d.dlat, d.dlon]]);

    return this.lineFunction(points);
  }

  // datapoints are elem with plat, plon, dlat, dlon, road
  addPaths(data, color, width) {
    this.paths
      .selectAll("path")
      .data(data, d => d.id)
      .enter()
      .append("path")
      .attr("d", d => this.getLine(d))
      .attr("fill", "none")
      .attr("data-road-id", d => d.id)
      .style("stroke", color)
      .style("stroke-width", width)
      .on("click", d => this.highlightPaths([d], SELECTED_PATH_COLOR));
  }

  // distance is between 0 and 1
  // return an object with attributes x, y
  getPointAt(path, distance) {
    let pathLength = path.node().getTotalLength();
    return path.node().getPointAtLength(pathLength * distance);
  }

  // display
  updateCars(data, date) {
    let filtredData = data
      .filter(d => {
        return (
          d.ptime.getTime() <= date.getTime() &&
          date.getTime() <= d.dtime.getTime()
        );
      })
      .map(d => {
        let percent =
          (date.getTime() - d.ptime.getTime()) /
          (d.dtime.getTime() - d.ptime.getTime());
        let path = d3.select("path[data-road-id='" + d.id.toString() + "']");
        let pos = this.getPointAt(path, percent);
        return Object.assign({}, d, { carX: pos.x, carY: pos.y });
      });

    //console.log(filtredData);

    let cars = this.cars.selectAll("circle").data(filtredData, d => d.id);

    //console.log(cars);

    let updateCarAttr = car_elems =>
      car_elems
        .attr("cx", d => d.carX)
        .attr("cy", d => d.carY)
        .attr("r", CAR_RADIUS)
        .attr("fill", CAR_COLOR)
        .attr("data-road-id", d => d.id);

    let newCars = cars.enter().append("circle");

    updateCarAttr(newCars);
    updateCarAttr(cars);

    cars.exit().remove();
  }

  highlightPaths(data, color) {
    let elems = this.paths.selectAll("path").data(data, d => d.id);
    elems.style("stroke", color).raise();
    elems.exit().style("stroke", PATH_COLOR);
  }

  // update the getX and getY function
  updateBounds(bounds) {
    this.bounds = bounds;
    this.getX = d3
      .scaleLinear()
      .domain([bounds.minX, bounds.maxX])
      .range([0, this.width]);

    this.getY = d3
      .scaleLinear()
      .domain([bounds.minY, bounds.maxY])
      .range([this.height, 0]);

    // TODO continue that
  }

  /*
OLD

  getX(lon) {
    return (
      (lon - this.bounds.minX) /
      (this.bounds.maxX - this.bounds.minX) *
      this.width
    );
  }

  getY(lat) {
    return (
      (this.bounds.maxY - lat) /
      (this.bounds.maxY - this.bounds.minY) *
      this.height
    );
  }
  */

  /*

  /////////// OLD VERSION ////////////
  addEdges(edges) {
    this.svg
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("x1", d => this.getX(edges.lon1))
      .attr("y1", d => this.getY(edges.lat1))
      .attr("x2", d => this.getX(edges.lon2))
      .attr("y2", d => this.getY(edges.lat2))
      .style("stroke", d => d.color)
      .style("stroke-width", d => d.width);
  }

  getEdges(route) {
    let r = route;

    if (r.length <= 1) {
      return [];
    }
    let res = [];

    let previous = null;
    for (let i = 0; i < r.length; ++i) {
      //  console.log(route[i]);

      let current = r[i].split("/");
      if (i > 0) {
        //  console.log(arr);
        res.push({
          lat1: previous[0],
          lon1: previous[1],
          lat2: current[0],
          lon2: current[1],
          color: PATH_COLOR,
          width: PATH_WIDTH
        });
      }

      previous = current;
    }
    return res;
  }

  addRoutes(data) {
    let edges = data.flatMap(d => this.getEdges(d.road));

    this.addEdges(edges);

    //data.map(d => this.getEdges(d.road)).forEach(edges => this.addEdges(edges));
  }
  /////////// OLD VERSION ////////////


*/
}
