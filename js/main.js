import DonutChart from "./donut_chart.js";
import MapPlot from "./map.js";
import GraphPlot from "./graph.js";
import BarChart from "./barchart.js";
import BarChartTime from "./barchart_time.js";
import BarChart2 from "./barchart2.js";
import BarChartBoth from "./barchart_both.js";

//import Title from "./title.js";

function whenDocumentLoaded(action) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", action);
  } else {
    // `DOMContentLoaded` already fired
    action();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

whenDocumentLoaded(() => {
  //let dataPath = "../data/dataviz_filtered_coords_N100.csv";
  //let dataPath = "../data/dataviz_processed.csv";
  let dataPath = "../data/dataviz_processed.csv";

  let timeParse = d3.timeParse("%H:%M:%S");

  function row(d) {
    let dtime = timeParse(d.t);

    let ptime = new Date(dtime.getTime() - d.duration * 60 * 1000);

    return {
      id: d.id,
      plat: d.plat,
      plon: d.plng,
      dlat: d.dlat,
      dlon: d.dlng,
      ptime: ptime,
      dtime: dtime,
      duration: d.duration,
      distance: d.distance,
      road: d.road
    };
  }

  let data = [];
  //let plot = new GraphPlot("main_svg", 500, 500);
  d3.csv(dataPath, function(d) {
    data.push(row(d));
    //
  });

  let data2Path = "../data/times_group.csv";
  let dataPath_communes = "../data/communes_group.csv";
  let dataPath_dist = "../data/dist_group.csv";
  let dataPath_pickup = "../data/pickup_sum.csv";
  let dataPath_region = "../data/com_sum.csv";

  function row2(d) {
    return {
      id: d.id,
      time: d.time,
      count: d.count
    };
  }

  let data2 = [];
  let data_communes = [];
  let data_dist = [];
  d3.csv(data2Path, function(d) {
    data2.push(row2(d));        });
  d3.csv(dataPath_communes, function(d) {
    data_communes.push(row2(d));     });
  d3.csv(dataPath_dist, function(d) {
    data_dist.push(row2(d));     });

  // **** Bar Charts Data ****
  function row_bar(d, x,y ,str) {
    return {
      id: d.id,
      time:str+ d[x],
      count: d[y] //,
      //pickup: d.pickup//,
      //res: d
    };
  }
  let pickup_time_data = [];
  let region_time_data = [];
  d3.csv(dataPath_pickup, function(d) {
    pickup_time_data.push(row_bar(d, 'id','count','Pickup: ')); //'pickup'
  });
  d3.csv(dataPath_region, function(d) {
    region_time_data.push(row_bar(d, 'dregions','count',''));
  });

  let nodesPath = "../data/nodes_usage_delivery_ids.csv";
  //let nodesPath = "../data/nodes_usage_delivery_filtered_N100.csv";

  function node(n) {
    return {
      lat: n.lat,
      lon: n.lon,
      deliveries: n.delivery_ids,
      n: n.tot_usage
    };
  }
  let nodes = [];
  d3.csv(nodesPath, function(n) {
    nodes.push(node(n));
  });

  sleep(3000).then(() => {
    console.log(data);
    let lats = data.flatMap(d => [d.plat, d.dlat]);
    let lons = data.flatMap(d => [d.plon, d.dlon]);

    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLon = Math.min(...lons);
    let maxLon = Math.max(...lons);

    let deltaLat = maxLat - minLat;
    let deltaLon = maxLon - minLon;

    let bounds = {
      minY: minLat, //- 0.1 * deltaLat,
      maxY: maxLat, //+ 0.1 * deltaLat,
      minX: minLon, //- 0.1 * deltaLon,
      maxX: maxLon //+ 0.1 * deltaLon
    };

    let margin = { top: 20, right: 20, bottom: 20, left: 20 };

    console.log(bounds);
    var donut_height = 250,
        donut_width = 250;
 /*
    let donut_time = new DonutChart("donut_time", data2, donut_width, donut_height,'#B0E0E6','', -1, 48);
    let donut = new DonutChart("donut_svg", data2, donut_width, donut_height,'#FFC0CB','deliveries',0, 219);
    let donut2 = new DonutChart("donut_svg2", data_communes, donut_width, donut_height,'#98FB98','communes',0, 15);
    let donut3 = new DonutChart("donut_svg3", data2, donut_width, donut_height,'#ffc65c','deliveries',1, 2000);
    let donut4 = new DonutChart("donut_svg4", data_dist, donut_width, donut_height,'#d48dd4','m distance',1, 8941130 );
*/
    let plot = new MapPlot("main_svg", data, 600, 600, bounds, nodes, margin);

    //let graph = new GraphPlot("graph_svg", data, 1000, 1000, bounds, nodes);
    console.log('pickup data',pickup_time_data);
    let bar_pickup = new BarChart("barchart_svg", pickup_time_data, 400, 300);
    let barc_delivery = new BarChart("barchart_svg2", region_time_data, 400, 300);
    let barc_time = new BarChartTime("barchart_time_svg", data2, 400, 400);

    // For collapsible side panels
    var collapsible = document.getElementsByClassName("collapsible");
    var i;
    for (i = 0; i < collapsible.length; i++) {
      collapsible[i].addEventListener("click", function() {
          this.classList.toggle("active");
          var content = this.nextElementSibling;
          if (content.style.maxHeight){
            content.style.maxHeight = null;
          } else {
            content.style.maxHeight = content.scrollHeight + "px";
          }
      });
    }


  });
});
