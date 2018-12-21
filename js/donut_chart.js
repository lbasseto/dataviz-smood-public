export default class DonutChart {
  constructor(svg_id, data, width, height, color, textType, tot, max) {

    this.margin = 50
    this.width = width;
    this.height = height;
    this.svg = d3
      .select("#" + svg_id)
      .attr("width", width)
      .attr("height", height);
    this.wholeData = data;
    console.log(this.wholeData);
    this.createDonut(this.wholeData, color,textType,tot, max)
    console.log('finish');
}

createDonut(data, color,textType, tot, max) {
    var text="-";
    var dataset = [0, 0];
    var radius = 160;
    var color = [color, '#EEE'];
    var svg = this.svg
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

      svg.append("text")
         .attr("text-anchor", "middle")
         .text(text);

    function render(data, txt) {
        var pie = d3.pie()
            .sort(null);

        var arc = d3.arc()
            .innerRadius(radius - 100)
            .outerRadius(radius - 50);

        var path = svg.selectAll("path")
            .data(pie(data));

        var pathEnter = path.enter().append("path")
            .attr("fill", function(d, i) {
                return color[i];
            })
            .attr("d", arc);

        var pathUpdate = path.attr("d", arc);

        var textpath = svg.select("text")
                           .text(txt);
        var textEnter = textpath.enter().append("text")
                                .text(txt);

        var textUpdate = textpath.text(txt)
                                .append('svg:tspan')
                                .attr('x', 0)
                                .attr('dy', 20)
                                .text(textType);
    }

    render(dataset, text);

    setInterval(function() {
        update(data,tot, max);
    }, 2000);

    var counter = 0;
    function update(dataset, tot, max) {
        //const tot=true;
        counter++;
        var datares_std = dataset[counter].count,
            datares = dataset[counter].count;
        var i, sum=0;
        if(tot == 1){
          for (i = 0; i < counter; i++) {
            sum += Number(dataset[i].count);
          }
          datares = sum;
          // percentage out of 2000 deliveries
          datares_std = (datares*100)/max;
        }else if(tot == 0){
          // percentage based on max delivery done in a 15 interval
          datares_std = (datares*100)/max;
          //text= datares.toString();
        }else{  // show time  tot is -1
          datares = dataset[counter].time;
          datares_std =  (counter*100)/max;
        }
        //datares_std =  (counter*100)/max;
        //console.log('counter',counter,'max',max);
        text= datares.toString();
        render([datares_std.toString(),100-datares_std.toString(),], text);
    }

  }

}
