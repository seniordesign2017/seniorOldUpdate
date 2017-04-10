$(function() {

		//REPLACE DEVICE UNIQUE IDENTIFIER / SERIAL NUMBER HERE
		var myDevice = '000001'; //default unique device identifier

		//REPLACE WITH FULL APP DOMAIN IF RUNNING LOCALLY, OTHEWISE LEAVE AS "/"
    var app_domain = '/';

		var data = [];
		var updateInterval = 1000; //milliseconds
		var timeWindow = 10; //minutes

		var red_color = '#6B0023';

    var graph_options = {
        series: {
            lines: { show: true, lineWidth: 1.5, fill: 0.1},
            points: { show: true, radius: 0.7, fillColor: "#41C4DC" }
        },
				legend: {
					position: "nw",
					backgroundColor: "#111111",
					backgroundOpacity: 0.8
				},
        /*yaxis: {
          min: 0,
          max: 100
        },*/
        xaxis: {
          mode: "time",
					timeformat: "%I:%M %p",
					timezone:  "browser"
        },
        colors: ["#2C9DB6","#FF921E","#FF5847","#FFC647", "#5D409C", "#BF427B","#D5E04D" ]
		};

		$("#specificdevice").text(myDevice);
		$("#currentdevice").text(myDevice);
    $("#appstatus").text('Running');
    $("#appstatus").css('color', '555555');
    $("#appconsole").text('starting...');
    $("#appconsole").css('color', '#555555');
		$("#placeholder").text('Graph: Retrieving Data Now....');

    function fetchData() {
				console.log('fetching data from Murano');
        $("#appconsole").text('Fetching Data For '+myDevice+' From Server...');
				$("#appconsole").css('color', '#555555');

        function onDataReceived(newdata) {
          $("#appstatus").text('Running');
          $("#appstatus").css('color', '555555');
          $("#appconsole").text('Processing Data');
					$("#appconsole").css('color', '#555555');
          var data_to_plot = [];
					// Load all the data in one pass; if we only got partial
					// data we could merge it with what we already have.
          //console.log(series)
					console.log(newdata);

          if (jQuery.isEmptyObject(newdata.timeseries.values))
          {
            //Database error
            console.log('no data in selected window, check device')
            $("#appconsole").text('No data found in window for this device');
            $("#placeholder").text('Graph: Data Not Found for: '+myDevice);
          }
          else
          {

  					console.log('valid data return for: '+myDevice);
            for (j = 1; j < newdata.timeseries.columns.length; j++)
            {
  					  var data = [];
  					  var raw_data = newdata.timeseries.values
              var friendly = newdata.timeseries.columns[j];
              var units = "";
  						var last_val;

              if (friendly == "temperature")
              {
                units = "F";
  							friendly = "Temperature";
              }
              else if (friendly == "humidity")
              {
                units = "%";
  							friendly = "Humidity";
              }

              console.log(raw_data, j);

              // reformat data for flot
              for (var i = raw_data.length - 1; i >= 0; i--) {
                if (raw_data[i][j] != null)
                  data.unshift([raw_data[i][0],raw_data[i][j]])
              }

              // only push if data returned
              if (data.length > 0) {
                last_val = data[data.length-1]

                data_to_plot.push({
                      label: friendly + ' - '+ last_val + ' ' +units,
                      data: data,
                      units: units
                  });
              }
            }
            $("#placeholder").text('');
            $.plot("#placeholder", data_to_plot, graph_options);
            $("#appconsole").text('Data Plotted');
            $("#appconsole").css('color', '#555555');
          }

					if (updateInterval != 0)
						{setTimeout(fetchData, updateInterval);}
				}

        function onError( jqXHR, textStatus, errorThrown) {
          console.log('error: ' + textStatus + ',' + errorThrown);
          $("#appconsole").text('No Server Response');
          $("#appstatus").text('Server Offline');
          $("#appstatus").css('color', red_color);
					if (updateInterval != 0)
						{setTimeout(fetchData, updateInterval+3000);}
        }

				$.ajax({
					url: app_domain+"development/device/data?identifier="+myDevice+"&window="+timeWindow,
					type: "GET",
					dataType: "json",
					success: onDataReceived,
          crossDomain: true,
          error: onError,
          statusCode: {
            504: function() {
              console.log( "server not responding" );
              $("#appstatus").text('Server Not Responding 504');
              $("#appstatus").css('color', red_color);
            }
          }
          ,timeout: 10000
        });

			}


		// Set up the control widget

		$("#updateInterval").val(updateInterval).change(function () {
			var v = $(this).val();
			if (v && !isNaN(+v)) {
				if(updateInterval == 0)
					{setTimeout(fetchData, 1000);} //updates were turned off, start again
				updateInterval = +v;
				if (updateInterval > 20000) {
					updateInterval = 20000;
				}
				$(this).val("" + updateInterval);

			}
		});

		$("#timeWindow").val(timeWindow).change(function () {
			var v = $(this).val();
			if (v && !isNaN(+v)) {
				timeWindow = +v;
				if (timeWindow < 1) {
					timeWindow = 1;
				} else if (timeWindow > 360) {
					timeWindow = 360;
				}
				$(this).val("" + timeWindow);
			}
		});

		$("#specificdevice").val(myDevice).change(function () {
			var v = $(this).val();
			if (v) {
				myDevice = v;
				console.log('new device identity:' + myDevice);
				$(this).val("" + myDevice);
				$("#currentdevice").text(myDevice);
				$("#placeholder").text('Graph: Retrieving New Device Data Now....');
			}
		});

		fetchData();

		$("#footer").prepend("Exosite Murano Example");
	});
