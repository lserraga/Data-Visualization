var currentYear = 1990;

var fmtPer = d3.format("%", 2);

//Canvas and map dimensions
var width = 1250,
    height = 800;

var infoBarWidth = 300;
var infoBarX = width - 100 - infoBarWidth;
var infoBarY = 50;
var outerRadius = (infoBarWidth-100) / 2;

var perClicked = 0.4;
var aux = 0;

var svg = d3.select("#wrapper").append("svg")
    .attr("width", width)
    .attr("height", height);

//Pie and bar chart
var infoBar = svg.append("g")
    .attr("class", "infoBar")
    .attr("transform", "translate(" + infoBarX + "," + infoBarY + ")");


var infoBarTitle = infoBar
    .append("text")
    .attr("class", "title1")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(200, 0)");

var yearText = infoBar
    .append("text")
    .attr("transform", "translate(130,260)")
    .attr("class", "title1")
    .attr("font-size", "51px")
    .text(currentYear);


var legendImages = ["Coal.png", "Petroleum.png", "Gas.png", "Nuclear.png", "Hydro.png", "wind.png", "solar.png", "Biofuels.png", "Geothermal.png"];

var rectSize = 25;

var arc = d3.svg.arc()
    .innerRadius(outerRadius)
    .outerRadius(0);

var pie = d3.layout.pie()
    .value(function(d) {
        return d.value;
    }).sort(
        null);




var currentCountry = null;

var infoBarPieX = 100;
var infoBarPieY = 20;

var infoBarPie = infoBar.append("g")
    .attr("class", "infoBarPie pie")
    .attr("transform", "translate(" + infoBarPieX  + ", " + infoBarPieY + ")");

var legendPie = infoBar
    .append("g")
    .attr("class", "legendPie");

infoBar
        .append("rect")
        .attr("class", "nonrenewableRect")
        .attr("width", "400px")
        // .attr("rx", 20)
        // .attr("ry", 20)
        .attr("height", "140px")
        .attr("transform", "translate(0, 350)");

infoBar
        .append("rect")
        .attr("class", "renewableRect")
        .attr("width", "400px")
        // .attr("rx", 20)
        // .attr("ry", 20)
        .attr("height", "162px")
        .attr("transform", "translate(0, 490)");

var barChart = infoBar
    .append("g")
    .attr("class","barChart")
    .attr("transform", "translate(120,40)");

//Defining the different color scales
var color = d3.scale.threshold()
    .domain([0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1]).range(['#FFFFFF', '#EFFFED', '#CCFCC7', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#005a32'])
var color2 = d3.scale.ordinal()
    .range(['#990000', '#d7301f', '#ef6548', '#fc8d59', '#fdbb84', '#045a8d', '#0570b0', '#3690c0', '#74a9cf', '#a6bddb', '#d0d1e6', '#ae017e']);
var colorpie = d3.scale.ordinal()
    .range(['#fc8d59', '#91cf60']);

//scale and axis definition for map color key
var keyScale = d3.scale.linear()
    .domain([0, 1])
    .range([0, 400]);

var barScale = d3.scale.linear()
    .domain([0, 1])
    .range([0, 300]);

var keyAxis = d3.svg.axis()
    .scale(keyScale)
    .orient("bottom")
    .tickSize(13)
    .tickValues(color.domain())
    .tickFormat(function(d) {
        return d >= 0 ? fmtPer(d) : null;
    });

//projection to place map in the correct place on the SVG
var projection = d3.geo.mercator().center([10, 62]).scale(650);

var path = d3.geo.path()
    .projection(projection);

var tooltip = d3.select("#tooltip");

var geo;

//Loading the data
d3.json("../data/energyConsumption.json", function(error, data) {
    if (error) throw error;

    geo = data;
    initialDraw();
});


//Setting the initial form of the page which will be dinamically modified later
function initialDraw() {

    var countries = geo.features;

    //Creating the map
    var countryGroup = svg.append("g")
        .attr("class", "map")
        .attr("transform", "translate(0, 20)")
        .selectAll("path")
        .data(countries.filter(function(d) {
            return d.name != "European Union"
        }))
        .enter().append("path")
        .on("mousemove", mouseover)
        .on("mousedown", countryClick)
        .on("mouseout", function(d) {
            d3.select("#tooltip").classed("hidden", true);
            hoverArrow(perClicked);
        })
        .style("fill", function(d) {
            if (d.energy["1990"] == null || d.energy[currentYear]["All products"] == 0) return "#ddd";
            var all = d.energy[currentYear]["All products"];
            var renewable = d.energy[currentYear]["Renewable energies"];
            var per = renewable / all;
            hoverArrow(per);
            return color(per);
        })
        .style("cursor", function(d) {
            if (d.energy["1990"] == null || d.energy[currentYear]["All products"] == 0) return "not-allowed";
            return "default";
        })
        .style("stroke", "black")
        .attr("d", function(d) {
            return path(d);
        });



    infoBar
        .append("g")
        .attr("transform", "translate(50,340)")
        .append("text")
        .attr("class", "bold")
        .html("Proportion of energy consumption by source");

    //Loading data for the barchart
    var myBarData = Object.keys(countries[50].energy[currentYear])
        .filter(excludeTotals)
        .map(function(d) {
            if (countries[50].energy[currentYear][d] > 0) {
                return {
                    type: d,
                    value: countries[50].energy[currentYear][d],
                    total: countries[50].energy[currentYear]["All products"]
                };
            } else {
                return {
                    type: d,
                    value: 0,
                    total: countries[50].energy[currentYear]["All products"]
                };
            };
        }).filter(function(d) {
            return d != null;
        });

    var totalEU = countries[50].energy[currentYear]["All products"];
    var renEU = countries[50].energy[currentYear]["Renewable energies"];

    //Loading the data for the pie chart
    var myPieData = [{
        type: "Non-renewable energies",
        total: totalEU,
        value: totalEU - renEU
    }, {
        type: "Renewable energies",
        total: totalEU,
        value: renEU
    }];

    //Defining the pie chart
    var pieData = pie(myPieData);

    //Creating the button to show all EU data
    var euButton = infoBar.append("g")
        .attr('transform', "translate(-100,15)")
        .attr('id', 'showEuBtn');

    euButton.append("rect")
        .on("mousedown", flagclick)
        .attr("fill", "lightblue")
        .attr('width', 140)
        .attr('height', 25);

    euButton
        .append("text")
        .attr("transform", "translate(10, 17)")
        .style("stroke", "black")
        .style("fill", "black")
        .text("Show All EU Data")
        .on("mousedown", flagclick);

    //Defining pie arcs
    var arcs = infoBarPie.selectAll("g.arc")
        .data(pieData)
        .enter()
        .append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + outerRadius + ", " + outerRadius + ")")
        .on("mousemove", mouseoverTooltip)
        .on("mouseout", function(d) {
            d3.select("#tooltip").classed("hidden", true);
        })
        //.on("mousedown",legendSelection);

    //Draw arc paths
    arcs.append("path")
        .attr("fill", function(d, i) {
            return colorpie(i);
        })
        .attr("d", arc)
        .each(function(d) {
            this._current = d;
        });


    //Pie chart labels
    arcs.append("text")
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d) + ")";
        })
        .attr("text-anchor", "middle");



    //Creating the bar chart
    var legend = barChart.selectAll("g.legend")
        .data(myBarData)
        .enter()
        .append('g')
        .attr("transform", function(d, i) {
            return "translate(" + (30) + "," + (infoBarWidth + 15 + (rectSize + 2) * i) + ")";
        })
        .attr('class', 'legend')
        .on("mousemove", mouseoverTooltip2)
        .on("mouseout", function() {
            d3.select("#tooltip").classed("hidden", true);

        });

    legend.append("rect")
        .attr('width', rectSize)
        .attr('height', rectSize)
        .style('fill', function(d, i) {
            return color2(i)
        })
        //.on("mousedown",legendSelection);

    //Adding images to the bar chart
    legend.append("svg:image")
        .attr("xlink:href", function(d, i) {
            if (i == 4 || i == 8) {
                aux++;
                return "";
            }
            return `../assets/${legendImages[i - aux]}`
        })
        .attr('width', rectSize)
        .attr('height', rectSize);
    //Adding labels
    var legendLabels = legend.append("text")
        .attr("class", "legendLabels2")
        .attr("transform", "translate(-2," + 20 + ")")
        .attr("text-anchor", "end")
        .text(function(d) {
            return d.type
        });

    //Creating arrow for map key
    var arrowL = svg.append("svg:image")
        .attr("xlink:href", "arrow.png")
        .attr("width", 20)
        .attr("height", 15)
        .attr("transform", "rotate(180)")
        .attr("x", -67)
        .attr("y", -49)
        .attr("id", "scaleArrow");


    //set EU as default country
    currentCountry = countries.filter(function(d) {
        return d.name == 'European Union'
    })[0];
    fillInfoBar(currentCountry);
    drawKey();


}

//Function to handle the click on the all EU data button
function flagclick(myBardata) {
    svg.selectAll(".selectedCountry").attr("class", "");
    var countries = geo.features;
    var eu = countries[50];
    fillInfoBar(eu);
}

/*function legendSelection(d, i) {
    svg.selectAll(".selectedPie").attr("class", "");
    d3.select(this)
        .attr("class", "selectedPie");
}*/


//Function to update map, pie chart and bar chart
function update() {
    var countries = geo.features;

    //update colors on map
    svg.selectAll(".map path")
        .transition()
        .duration(200)
        .style("fill", function(d) {
            if (d.energy["1990"] == null || d.energy[currentYear]["All products"] == 0) return "#ddd";
            var all = d.energy[currentYear]["All products"];
            var renewable = d.energy[currentYear]["Renewable energies"];
            var per = renewable / all;
            return color(per)
        })
        .style("cursor", function(d) {
            if (d.energy["1990"] == null || d.energy[currentYear]["All products"] == 0) return "not-allowed";
            return "default";
        });

    fillInfoBar(currentCountry);
    yearText.text(currentYear);
}


//Function that handles mouseover for the map
function mouseover(d) {
    var shiftX = 10;
    var shiftY = 20;

    var mouseCoords = d3.mouse(this);
    d3.select("#tooltip")
        .style("left", function(d) {
            return mouseCoords[0] + shiftX + "px"
        })
        .style("top", function(d) {
            return mouseCoords[1] + shiftY + "px"
        })
        .html(function() {
            if (d.energy[1990] == null || d.energy[currentYear]["All products"] == 0) return d.name + ": No data";

            var all = d.energy[currentYear]["All products"];
            var renewable = d.energy[currentYear]["Renewable energies"];
            var per = renewable / all;

            hoverArrow(per);

            return "<b>" + d.name + "</b><br/>" + fmtPer(per) + " renewables"
        })
        .classed("hidden", false);
}

//Setting the position of the arrow in the map key
function hoverArrow(percent) {
    var left = -50 - keyScale(percent);

    d3.select("#scaleArrow")
        .transition()
        .ease("cubic")
        .attr("x", function(d) {
            return left;
        });
}

//Tooltip for pie chart
function mouseoverTooltip(d) {
    var mouseCoords = d3.mouse(this);
    var shiftX = infoBarX + infoBarPieY + 192;
    var shiftY = infoBarY + infoBarPieX + 28;

    d3.select("#tooltip")
        .style("left", (mouseCoords[0] + shiftX + "px"))
        .style("top", (mouseCoords[1] + shiftY + "px"))
        .html(function() {
            return ("<b>" + d.data.type + "</b><br>" + Math.round(d.value / 1000) + " PetaJoules")
        })
        .classed("hidden", false);
}

//Tooltip for bar chart
function mouseoverTooltip2(d, i) {
    var mouseCoords = d3.mouse(this);
    var shiftX = infoBarX + infoBarPieY + 137;
    var shiftY = infoBarY + infoBarPieX + 260;

    d3.select("#tooltip")
        .style("left", (mouseCoords[0] + shiftX + "px"))
        .style("top", (mouseCoords[1] + shiftY + 27 * i + "px"))
        .html(function() {
            return ("<b>" + d.type + " " + fmtPer(d.value/d.total) + "</b><br>" + Math.round(d.value / 1000) + " PetaJoules")
        })
        .classed("hidden", false);
}

//Function that handles the click on a country
function countryClick(d) {
    if (d.energy[currentYear] == null || d.energy[currentYear][0] <= 0)
        return;
    //unselect previously selected country
    svg.selectAll(".selectedCountry").attr("class", "");
    d3.select(this).attr("class", "selectedCountry");

    fillInfoBar(d);
}


//Used when drakwing bar chart
function excludeTotals(d) {
    var exclude = ["Renewable energies", "All products", "Electrical energy"];
    return !exclude.includes(d);
}

function filterRenewables(d) {
    var include = ["Biogas", "Geothermal Energy", "Tide, Wave and Ocean", "Solar photovoltaic", "Solar thermal", "Wind power", "Hydro power"]
    return include.includes(d);
}


//Drawing the map key
function drawKey() {
    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(40,50)");

    g.selectAll("rect")
        .data(color.range().map(function(d, i) {
            return {
                x0: i ? keyScale(color.domain()[i - 1]) : keyScale.range()[0],
                x1: i < color.domain().length ? keyScale(color.domain()[i]) : keyScale.range()[1],
                z: d
            };
        }))
        .enter().append("rect")
        .attr("height", 8)
        .attr("stroke", "black")
        .attr("stroke-width", 0.8)
        .attr("x", function(d) {
            return d.x0;
        })
        .attr("width", function(d) {
            return d.x1 - d.x0;
        })
        .style("fill", function(d) {
            return d.z;
        });


    g.call(keyAxis).append("text")
        .attr("class", "caption")
        .attr("y", 45)
        .attr("x", -8)
        .attr("font-size", 10)
        .text("Percentage of energy production from renewable sources");
}


//Function that updates the pie chart and the bar chart
function fillInfoBar(country) {
    currentCountry = country;

    if (country.name == "European Union") {
        d3.select("#showEuBtn")
            .transition()
            .style("opacity", "0");
    } else {
        d3.select("#showEuBtn")
            .transition()
            .style("opacity", "1");
    }

    var fontSize = country.name.length >= 10 ? 49 - country.name.length : 51;


    infoBarTitle
        .text(country.name)
        .attr("font-size", fontSize);

    var myBarData = Object.keys(country.energy[currentYear])
        .filter(excludeTotals)
        .map(function(d, i) {
            return {
                type: d,
                value: country.energy[currentYear][d],
                order: i,
                total: country.energy[currentYear]["All products"]
            }
        }).filter(function(d) {
            return d != null;
        });

    var totalEn = country.energy[currentYear]["All products"];
    var renEn = country.energy[currentYear]["Renewable energies"];
    perClicked = renEn / totalEn;

    var myPieData= [{
        type: "Non-Rrenewable energies",
        total: totalEn,
        value: totalEn - renEn
    }, {
        type: "Renewable energies",
        total: totalEn,
        value: renEn
    }];



    var pieData = pie(myPieData);

    infoBarPie.selectAll("g.arc")
        .data(pieData);


    var arcs = infoBarPie.selectAll("path")
        .data(pieData)
        .transition() // errors from here http://stackoverflow.com/questions/21285385/d3-pie-chart-arc-is-invisible-in-transition-to-180
        .duration(1000)
        .attrTween("d", arcTween);

    infoBarPie.selectAll("text")
        .data(pieData)
        .transition()
        .duration(1000)
        .text(function(d) {
            per = d.value / d.data.total;
            if (per > 0.05)
                return (fmtPer(d.value / d.data.total));
            return "";
        })
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d) + ")";
        });
    /*infoBarPie.selectAll("image")
        .data(pieData)
        .transition()
        .duration(1000)
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d)[0] + "," + arc.centroid(d)[1] + ")";
        });*/

    var legend = barChart.selectAll("g.legend").data(myBarData);





    legend.select("rect")
        .data(myBarData)
        .transition()
        .attr('width', function(d) {
            return barScale(d.value / d.total);
        });
    // legend.select("text")
    //     .data(myBarData)
    //     .transition()
    //     .attr("x", function(d, i) {
    //         var offset = barScale(d.value / d.total);
    //         if ((i == 4 || i == 8) || i == 11)
    //             return offset;
    //         return (offset + rectSize)
    //     });
    legend.select("image")
        .data(myBarData)
        .transition()
        .attr("x", function(d) {
            return barScale(d.value / d.total)
        });
}

//From http://bl.ocks.org/mbostock/1346410
function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
        return arc(i(t));
    };
}

function changeYear(year) {
    currentYear = year;
    update();
}