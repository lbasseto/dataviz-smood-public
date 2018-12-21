import {
  PICKUP_COLOR,
  DELIVERY_COLOR,
  NODE_COLOR,
  PATH_COLOR,
  PATH_WIDTH,
  SELECTED_PATH_COLOR,
  SELECTED_PATH_WIDTH
} from "./constants.js";

export default class GraphPlot {
  constructor(svg_id, data, width, height, bounds, nodes) {
    this.width = width;
    this.height = height;
    this.svg = d3
      .select("#" + svg_id)
      .attr("width", width)
      .attr("height", height);

    this.pickups = this.svg.append("g").attr("id", "pickups");
    this.deliveries = this.svg.append("g").attr("id", "deliveries");
    this.nodes = this.svg.append("g").attr("id", "nodes");

    this.bounds = bounds;

    //this.nodes = nodes;
    this.wholeData = data;
    this.clusteredData = this.clusterizeKMeans(data, 10, 30);

    console.log(this.clusteredData);

    // add elements to the graph
    this.addPickupPoints(this.clusteredData);
    this.addDeliveryPoints(this.clusteredData);

    // beta
    //this.addNodes(nodes);
    this.addEdges(this.clusteredData, PATH_COLOR, PATH_WIDTH);
  }

  // make clusters from datapoints with plat, plon, dlat, dlon
  clusterizeKMeans(data, kPickup, kDelivery) {
    let pLats = data.map(n => parseFloat(n.plat));
    let pLons = data.map(n => parseFloat(n.plon));

    let dLats = data.map(n => parseFloat(n.dlat));
    let dLons = data.map(n => parseFloat(n.dlon));

    console.log(pLats);
    console.log(dLats);

    let pCluster = kmeans([pLats, pLons], kPickup);
    let pResult = pCluster.predict();

    let dCluster = kmeans([dLats, dLons], kDelivery);
    let dResult = dCluster.predict();

    return data.map((elem, index) => {
      let pLabel = pResult.labels[index];
      let pCoord = pResult.centroids[pLabel];

      let dLabel = dResult.labels[index];
      let dCoord = dResult.centroids[dLabel];

      return Object.assign({}, elem, {
        plat: pCoord[0],
        plon: pCoord[1],
        dlat: dCoord[0],
        dlon: dCoord[1]
      });
    });
  }

  // helper to create a unique key for a point
  keyFromCoords(d) {
    return d.lat + "/" + d.lon;
  }

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

  // data points are values with x, y, radius, color
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

  // helper to perform points.groupby(p => p.lat, p.lon).count()
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
    //let clusterizedPoints = this.clusterizeKMeans(pickupPoints, 5);
    let pData = this.countPoints(pickupPoints).map(d => ({
      lat: d.lat,
      lon: d.lon,
      radius: Math.log(d.count)
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
    //let clusterizedPoints = this.clusterizeKMeans(deliveryPoints, 5);
    let dData = this.countPoints(deliveryPoints).map(d => ({
      lat: d.lat,
      lon: d.lon,
      radius: Math.log(d.count) * 0.8
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
    return this.clusteredData.filter(d => d.plat == lat && d.plon == lon);
  }

  // get roads ending at lat, lon
  roadsGoingTo(lat, lon) {
    return this.clusteredData.filter(d => d.dlat == lat && d.dlon == lon);
  }

  // get roads passing through lat, lon
  roadsGoingThrough(lat, lon) {
    indexes = this.nodesToRouteMap
      .get({ lat: lat, lon: lon })
      .replace(/[ \[\]]/g, "")
      .split(",");
    return indexes.map(i => this.wholeData[i]);
  }

  // datapoints are elem with plat, plon, dlat, dlon, road
  addEdges(data, color, width) {
    this.svg
      .selectAll("line")
      .data(data, d => d.id)
      .enter()
      .append("line")
      .attr("x1", d => this.getX(d.plon))
      .attr("y1", d => this.getY(d.plat))
      .attr("x2", d => this.getX(d.dlon))
      .attr("y2", d => this.getY(d.dlat))
      .style("stroke", color)
      .style("stroke-width", width)
      .on("click", d => this.highlightPaths([d], SELECTED_PATH_COLOR));
  }

  highlightPaths(data, color) {
    let elems = this.svg.selectAll("line").data(data, d => d.id);
    elems.style("stroke", color).raise();
    elems.exit().style("stroke", PATH_COLOR);
  }
}
