/**
 * Created by rafaelkallis on 24.09.16.
 */
var input;
var inputIcon;
var inputWrap;
var plotData;
var limitExceeded = false;

$(function () {
    var pattern = Trianglify({
        width: window.innerWidth,
        height: window.innerHeight
    });
    document.body.appendChild(pattern.canvas());

    input = $('#input');
    inputIcon = $('#input-return-icon');
    inputWrap = $('#input-wrap');

    input.typed({
        strings: ["rafaelkallis/github-repository-analytics", "torvalds/linux", "twbs/bootstrap"],
        typeSpeed: 20
    });

    input.on('change paste keyup', function () {
        inputIcon.fadeIn();
    });

    inputIcon.on('click', function () {
        pullData(input.val());
    });

    $('#analytics-exit-icon').on('click', function () {
        showInput();
    });

    input.keyup(function (event) {
        if (event.keyCode == 13) {
            pullData(input.val());
        }
    });
});

function pullData(repositoryName) {
    $.when(
        $.ajax({
            url: "https://api.github.com/rate_limit",
            success: function (data) {
                if (parseInt(data.resources.core.remaining) == 0) {
                    limitExceeded = true;
                }
            }
        }),
        $.ajax({
            url: "https://api.github.com/repos/" + repositoryName,
            success: function (data) {
                $("#owner-url").attr("href", data.owner.html_url);
                $("#owner-image").attr("src", data.owner.avatar_url);
                $("#repository-url").attr("href", data.html_url);
                $("#repository-name").html(data.full_name);
                $("#repository-subscribers").html(data.subscribers_count);
                $("#repository-stargazers").html(data.stargazers_count);
                $("#repository-forks").html(data.forks_count);
                $("#repository-language").html(data.language);
            },
            error: function () {
                console.log("error pulling repo info")
            }
        }),
        $.ajax({
            url: "https://api.github.com/repos/" + repositoryName + "/stats/commit_activity",
            success: function (data) {
                async.map(data, function (d, callback) {
                    callback(null, [parseInt(d.week + "000"), parseInt(d.total)]);
                }, function (err, data) {
                    plotData = data;
                });
            },
            error: function () {
                console.log("error pulling repo activity");
            }
        })).then(function () {
            if (!limitExceeded) {
                showAnalytics();
            } else {
                alert("Limits Exceeded!")
            }
        }
    );
}

function showAnalytics(callback) {
    inputWrap.fadeOut(50, function () {
        $('#content-wrapper').animate({
            'width': '1080px',
            'height': '600px'
        }, 'slow', function () {
            $("#analytics-wrap").fadeIn(function () {
                plot();
                typeof callback == 'function' && callback();
            });
        });
    });
}

function showInput(callback) {
    $('#analytics-wrap').fadeOut(50, function () {
        $('#content-wrapper').animate({
            'width': '800px',
            'height': '70px'
        }, 'slow', function () {
            inputWrap.fadeIn(function () {
                typeof callback == 'function' && callback();
            });
        });
    });
}


function plot() {
    $('#right-panel').highcharts({
        chart: {
            type: 'scatter',
            backgroundColor: null,
            style: {
                fontFamily: "'Slabo 27px', serif"
            }
        },
        title: {
            text: 'Commits per Week',
            style: {
                color: '#f0f0f0',
                fontSize: '20px'
            }
        },
        subtitle: {
            text: 'Source: GitHub API',
            style: {
                color: '#f0f0f0'
            }
        },
        legend: {
            enabled: false
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Date',
                style: {
                    color: '#A0A0A3'

                }
            },
            gridLineColor: '#707073',
            labels: {
                style: {
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073'
        },
        yAxis: {
            title: {
                text: 'Commits',
                style: {
                    color: '#A0A0A3'
                }
            },
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            gridLineColor: '#707073',
            labels: {
                style: {
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073',
            tickWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5
                }
            }
        },
        series: [{
            name: 'Commits per Week',
            color: 'rgba(223, 83, 83, 0.6)',
            enableMouseTracking: false,
            data: plotData

        }
            // ,{
            //     type: 'line',
            //     name: 'Regression Line',
            //     data: [[1443916800000,1500],[1473552000000,1700]],
            //     marker: {
            //         enabled: false
            //     },
            //     states: {
            //         hover: {
            //             lineWidth: 0
            //         }
            //     },
            //     enableMouseTracking: false
            // }
        ]
    });
}

// function plot(url){
//     var height = 300;
//     var width = 600;
//     var margin = {top: 20, right:20, bottom: 50, left: 20};
//
//     // formatters for axis and labels
//     // var currencyFormat = d3.format("0.2f");
//     // var decimalFormat = d3.format("0.2f");
//
//     var svg = d3.select("#right-panel")
//         .append("svg")
//         .attr("color", "#ffffff")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//     svg.append("g")
//         .attr("class", "y axis");
//
//     svg.append("g")
//         .attr("class", "x axis");
//
//     var xScale = d3.scale.ordinal()
//         .rangeRoundBands([margin.left, width], .1);
//
//     var yScale = d3.scale.linear()
//         .range([height, 0]);
//
//     var xAxis = d3.svg.axis()
//         .scale(xScale)
//         .orient("bottom");
//
//     var yAxis = d3.svg.axis()
//         .scale(yScale)
//         .orient("left");
//
//     d3.json(url, function(data) {
//
//         // extract the x labels for the axis and scale domain
//         var xLabels = data.map(function (d) {
//             var date = new Date(0);
//             date.setUTCSeconds(d.week);
//             return date.toDateString();
//         });
//
//         xScale.domain(xLabels);
//         yScale.domain([0, Math.round(d3.max(data, function(d) { return parseInt(d.total); }))]);
//
//         var line = d3.svg.line()
//             .x(function(d) { return xScale(d.week); })
//             .y(function(d) { return yScale(d.total); });
//
//         svg.append("path")
//             .datum(data)
//             .attr("class","line")
//             .attr("d", line);
//
//         svg.select(".x.axis")
//             .attr("transform", "translate(0," + (height) + ")")
//             .call(xAxis.tickValues(xLabels.filter(function(d, i) {
//                 if (i % 12 == 0)
//                     return d;
//             })))
//             .selectAll("text")
//             .style("text-anchor","end")
//             .attr("transform", function(d) {
//                 return "rotate(-45)";
//             });
//
//         svg.select(".y.axis")
//             .attr("transform", "translate(" + (margin.left) + ",0)")
//             .call(yAxis.tickFormat(currencyFormat));
//
//         // chart title
//         svg.append("text")
//             .attr("x", (width + (margin.left + margin.right) )/ 2)
//             .attr("y", 0 + margin.top)
//             .attr("text-anchor", "middle")
//             .style("font-size", "16px")
//             .style("font-family", "sans-serif")
//             .text("USD/EURO Exhange Rate");
//
//         // x axis label
//         svg.append("text")
//             .attr("x", (width + (margin.left + margin.right) )/ 2)
//             .attr("y", height + margin.bottom)
//             .attr("class", "text-label")
//             .attr("text-anchor", "middle")
//             .text("Year-Month");
//
//         // get the x and y values for least squares
//         var xSeries = d3.range(1, xLabels.length + 1);
//         var ySeries = data.map(function(d) { return parseFloat(d['rate']); });
//
//         var leastSquaresCoeff = leastSquares(xSeries, ySeries);
//
//         // apply the reults of the least squares regression
//         var x1 = xLabels[0];
//         var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
//         var x2 = xLabels[xLabels.length - 1];
//         var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
//         var trendData = [[x1,y1,x2,y2]];
//
//         var trendline = svg.selectAll(".trendline")
//             .data(trendData);
//
//         trendline.enter()
//             .append("line")
//             .attr("class", "trendline")
//             .attr("x1", function(d) { return xScale(d[0]); })
//             .attr("y1", function(d) { return yScale(d[1]); })
//             .attr("x2", function(d) { return xScale(d[2]); })
//             .attr("y2", function(d) { return yScale(d[3]); })
//             .attr("stroke", "black")
//             .attr("stroke-width", 1);
//
//         // display equation on the chart
//         svg.append("text")
//             .text("eq: " + decimalFormat(leastSquaresCoeff[0]) + "x + " +
//                 decimalFormat(leastSquaresCoeff[1]))
//             .attr("class", "text-label")
//             .attr("x", function(d) {return xScale(x2) - 60;})
//             .attr("y", function(d) {return yScale(y2) - 30;});
//
//         // display r-square on the chart
//         svg.append("text")
//             .text("r-sq: " + decimalFormat(leastSquaresCoeff[2]))
//             .attr("class", "text-label")
//             .attr("x", function(d) {return xScale(x2) - 60;})
//             .attr("y", function(d) {return yScale(y2) - 10;});
//
//     });

// returns slope, intercept and r-square of the line
function leastSquares(xSeries, ySeries) {
    var reduceSumFunc = function (prev, cur) {
        return prev + cur;
    };

    var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
    var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

    var ssXX = xSeries.map(function (d) {
        return Math.pow(d - xBar, 2);
    })
        .reduce(reduceSumFunc);

    var ssYY = ySeries.map(function (d) {
        return Math.pow(d - yBar, 2);
    })
        .reduce(reduceSumFunc);

    var ssXY = xSeries.map(function (d, i) {
        return (d - xBar) * (ySeries[i] - yBar);
    })
        .reduce(reduceSumFunc);

    var slope = ssXY / ssXX;
    var intercept = yBar - (xBar * slope);
    var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

    return [slope, intercept, rSquare];
}

function leastSquares(data) {
    var xyBar;
    async.reduce(data, 0, function (prev, cur, callback) {
            callback([prev[0] + cur[0], prev[1] + cur[1]]);
        },
        function (err, result) {
            xyBar = result;
        }
    );


    // var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
    // var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

    var ssXX = xSeries.map(function (d) {
        return Math.pow(d - xBar, 2);
    })
        .reduce(reduceSumFunc);

    var ssYY = ySeries.map(function (d) {
        return Math.pow(d - yBar, 2);
    })
        .reduce(reduceSumFunc);

    var ssXY = xSeries.map(function (d, i) {
        return (d - xBar) * (ySeries[i] - yBar);
    })
        .reduce(reduceSumFunc);

    var slope = ssXY / ssXX;
    var intercept = yBar - (xBar * slope);
    var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

    return [slope, intercept, rSquare];
}
