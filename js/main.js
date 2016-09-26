/**
 * Created by rafaelkallis on 24.09.16.
 */
$(function () {
    document.body.appendChild(Trianglify({
        width: window.innerWidth,
        height: window.innerHeight
    }).canvas());

    $('#input').typed({
        strings: ["rafaelkallis/github-repository-analytics", "torvalds/linux", "twbs/bootstrap"],
        typeSpeed: 20
    });

    $('#input').on('change paste keyup', function () {
        $('#input-return-icon').fadeIn();
    });

    $('#input-return-icon').on('click', function () {
        pullData($('#input').val());
    });

    $('#analytics-exit-icon').on('click', function () {
        showInputContent();
    });

    $('#input').keyup(function (event) {
        if (event.keyCode == 13) { // enter / return
            pullData($('#input').val());
        }
    });
});

function pullData(repositoryName) {
    $.when(
        $.ajax("https://api.github.com/rate_limit"),
        $.ajax("https://api.github.com/repos/" + repositoryName),
        $.ajax("https://api.github.com/repos/" + repositoryName + "/stats/commit_activity")
    ).then(
        function (rateLimitResponse, repositoryResponse, activityResponse) {
            if (parseInt(rateLimitResponse[0].resources.core.remaining) > 0) {
                async.map(activityResponse[0], function (d, callback) {
                    callback(null, [parseInt(d.week + "000"), parseInt(d.total)]);
                }, function (err, activityProcessed) {
                    showAnalyticsContent({
                        'ownerHtmlUrl': repositoryResponse[0].owner.html_url,
                        'ownerAvatarUrl': repositoryResponse[0].owner.avatar_url,
                        'repositoryHtmlUrl': repositoryResponse[0].html_url,
                        'repositoryName': repositoryResponse[0].full_name,
                        'repositorySubscribersCount': repositoryResponse[0].subscribers_count,
                        'repositoryStargazersCount': repositoryResponse[0].stargazers_count,
                        'repositoryForksCount': repositoryResponse[0].forks_count,
                        'repositoryLanguage': repositoryResponse[0].language,
                        'activity': activityProcessed
                    });
                });
            } else {
                alert("Rate limit exceeded!");
            }
        }, function () {
            $('#content-wrapper').effect('shake');
        });
}

function showAnalyticsContent(data) {
    $.when(
        $('#owner-url').attr('href', data.ownerHtmlUrl),
        $('#owner-image').attr('src', data.ownerAvatarUrl),
        $('#repository-url').attr('href', data.repositoryHtmlUrl),
        $('#repository-name').html(data.repositoryName),
        $('#repository-subscribers').html(data.repositorySubscribersCount),
        $('#repository-stargazers').html(data.repositoryStargazersCount),
        $('#repository-forks').html(data.repositoryForksCount),
        $('#repository-language').html(data.repositoryLanguage),
        $('#input-wrap').fadeOut(50, function () {
            $('#content-wrapper').animate({
                'width': '1080px',
                'height': '600px'
            }, 'slow', function () {
                $("#analytics-wrap").fadeIn(function () {
                    plot(data.activity);
                });
            });
        })
    );
}

function showInputContent() {
    $('#analytics-wrap').fadeOut(50, function () {
        $('#right-panel').highcharts().destroy();
        $('#content-wrapper').animate({
            'width': '800px',
            'height': '70px'
        }, 'slow', function () {
            $('#input-wrap').fadeIn()
        });
    });
}

function plot(activityData) {
    var slope_intercept_minX_maxX = leastSquares(activityData);
    var slope = slope_intercept_minX_maxX[0];
    var intercept = slope_intercept_minX_maxX[1];
    var minX = slope_intercept_minX_maxX[2];
    var maxX = slope_intercept_minX_maxX[3];

    var r_x1 = minX * 1.0;
    var r_y1 = slope * r_x1 + intercept;
    var r_x2 = maxX * 1.0;
    var r_y2 = slope * r_x2 + intercept;

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
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%B'
            },
            tickInterval: 4.25 * 7 * 24 * 60 * 60 * 1000,
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
                text: 'Commits per Week',
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
        series: [
            {
                name: 'Commits per Week',
                color: 'rgba(223, 83, 83, 0.6)',
                enableMouseTracking: false,
                data: activityData

            }, {
                type: 'line',
                name: 'Regression Line',
                data: [[r_x1, r_y1], [r_x2, r_y2]],
                marker: {
                    enabled: false
                },
                states: {
                    hover: {
                        lineWidth: 0
                    }
                },
                enableMouseTracking: false
            }
        ]
    });
}

function leastSquares(data) {
    var xBar = 0;
    var yBar = 0;
    var minX = 0;
    var maxX = 0;
    var ssXX = 0;
    var ssYY = 0;
    var ssXY = 0;
    async.reduce(data, [0, 0], function (prev, cur, callback) {
            callback(null, [prev[0] + cur[0], prev[1] + cur[1]]);

        }, function (err, result) {
            xBar = result[0] * 1.0 / data.length;
            yBar = result[1] * 1.0 / data.length;
        }
    );
    async.reduce(data, [data[0][0], 0], function (prev, cur, callback) {
            var smaller_bigger = prev[0] < cur[0] ? [prev[0], cur[0]] : [cur[0], prev[0]];
            callback(null, [smaller_bigger[0], smaller_bigger[1]]);

        }, function (err, result) {
            minX = result[0];
            maxX = result[1];
        }
    );

    async.map(data, function (d, callback) {
        callback(null, [Math.pow(d[0] - xBar, 2), Math.pow(d[1] - yBar, 2), (d[0] - xBar) * (d[1] - yBar)]);

    }, function (err, data) {
        async.reduce(data, [0, 0, 0], function (prev, cur, callback) {
                callback(null, [prev[0] + cur[0], prev[1] + cur[1], prev[2] + cur[2]]);

            }, function (err, result) {
                ssXX = result[0];
                ssYY = result[1];
                ssXY = result[2];
            }
        );

    });

    var slope = ssXY / ssXX;
    var intercept = yBar - (xBar * slope);
    return [slope, intercept, minX, maxX];
}