$(function() {
	//REPLACE DEVICE UNIQUE IDENTIFIER / SERIAL NUMBER HERE
	var myDevice = 'B4:21:8A:F0:2E:CE'; //default unique device identifier
	//REPLACE WITH FULL APP DOMAIN IF RUNNING LOCALLY, OTHEWISE LEAVE AS "/"
	var app_domain = '/';
	var data = [];
	var graphPick="all";
	var updateInterval = 1000; //milliseconds
	var timeWindow = 10; //minutes
	var red_color = '#6B0023';
	var graphType = "all";

    var graph_options = {
        series: {
            lines: { show: true, lineWidth: 1.5, fill: 0.1},
            points: { show: true, radius: 0.7, fillColor: "#41C4DC" }
        },
		legend: {
			position: "sw",
			backgroundColor: "#111111",
			backgroundOpacity: 0.8
		},
        yaxis: {
			min: 0,
			max: 400
        },
        xaxis: {
			mode: "time",
			timeformat: "%I:%M %p",
			timezone:  "browser",
			ticks: 10
        },
        colors: ["#2C9DB6","#FF921E","#FF5847","#FFC647", "#5D409C", "#BF427B","#D5E04D" ]
	};

	$("#specificdeviceTemp").text(myDevice);
	$("#currentdeviceTemp").text(myDevice);
	$("#appstatusTemp").text('Running');
	$("#appstatusTemp").css('color', '555555');
	$("#appconsoleTemp").text('starting...');
	$("#appconsoleTemp").css('color', '#555555');
	$("#placeholderTemp").text('Graph: Retrieving Data Now....');

    function fetchData() {
		
		console.log('fetching data from Murano');
        $("#appconsoleTemp").text('Fetching Data For '+myDevice+' From Server...');
		$("#appconsoleTemp").css('color', '#555555');

        // recent data is grabbed as newdata
        function onDataReceived(newdata) {
			$("#appstatusTemp").text('Running');
			$("#appstatusTemp").css('color', '555555');
			$("#appconsoleTemp").text('Processing Data');
			$("#appconsoleTemp").css('color', '#555555');
			var data_to_plot = [];
			//Load all the data in one pass; if we only got partial
			// data we could merge it with what we already have.
            //console.log(series)
			console.log(newdata);

			//check if newdata has data
			if (jQuery.isEmptyObject(newdata.timeseries.values)){
            //newdata has no data
            //Database error
            console.log('no data in selected window, check device')
            $("#appconsoleTemp").text('No data found in window for this device');
            $("#placeholderTemp").text('Graph: Data Not Found for: '+myDevice);
			}else{
				//newdata has data
				console.log('valid data return for: '+myDevice);
				//for each column in the newdata from timeseries 
				for (j = 1; j < newdata.timeseries.columns.length; j++){
					var data = [];
					//set data from newdata to raw_data
					var raw_data = newdata.timeseries.values
					var friendly = newdata.timeseries.columns[j];
					var units = "";
					var last_val;
					//check name of column and use correct unit
					if (friendly == "temperature"){
						units = "F";
						friendly = "Temperature";
				
					}

					console.log(raw_data, j);

					// reformat data for flot
					for (var i = raw_data.length - 1; i >= 0; i--) {
						if (raw_data[i][j] != null)
						data.unshift([raw_data[i][0],raw_data[i][j]])
					}

					// only push if data returned
					if(graphType == "all"||(graphType=="temper" && friendly == "Temperature")){
						
						if (data.length > 0) {
							last_val = data[data.length-1]
							// put data into data_to_plot
							data_to_plot.push({
								label: friendly + ' - '+ last_val[1] + ' ' +units,
								data: data,
								units: units
							});
						}
					}
				}
				$("#placeholderTemp").text('');
				$.plot("#placeholderTemp", data_to_plot, graph_options);
				$("#appconsoleTemp").text('Data Plotted');
				$("#appconsoleTemp").css('color', '#555555');
			}
			
			if (updateInterval != 0){
				setTimeout(fetchData, updateInterval);
			}
		}

        function onError( jqXHR, textStatus, errorThrown) {
			console.log('error: ' + textStatus + ',' + errorThrown);
			$("#appconsoleTemp").text('No Server Response');
			$("#appstatusTemp").text('Server Offline');
			$("#appstatusTemp").css('color', red_color);
			if (updateInterval != 0){
				setTimeout(fetchData, updateInterval+3000);
			}
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
					$("#appstatusTemp").text('Server Not Responding 504');
					$("#appstatusTemp").css('color', red_color);
				}
			}
			,timeout: 10000
        });

	}
	
	
	$("#graphPickTemp").val(graphPick).change(function () {
		selectedValue = $("#graphPickTemp").val();
		if (selectedValue == "temperature"){
			graphType = "temper";
			
		}else if(selectedValue == "all"){
			graphType = "all";
			
		}else if(selectedValue == "pressure"){
			graphType = "press";
			
		}else if(selectedValue == "flow"){
			graphType = "flow";
			
		}else if(selectedValue == "humidity"){
			graphType = "humid"
		}
	});

	// Set up the control widget
	// get update interval from html
	$("#updateIntervalTemp").val(updateInterval).change(function () {
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
	//get timewindow from html
	$("#timeWindowTemp").val(timeWindow).change(function () {
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
	//change specific device to current device
	$("#specificdeviceTemp").val(myDevice).change(function () {
		var v = $(this).val();
		if (v) {
			myDevice = v;
			console.log('new device identity:' + myDevice);
			$(this).val("" + myDevice);
			$("#currentdeviceTemp").text(myDevice);
			$("#placeholderTemp").text('Graph: Retrieving New Device Data Now....');
		}
	});

	fetchData();

});
