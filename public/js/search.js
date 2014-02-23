$(function() {
	var requestId = null;
	// create slider with multihanders for year range search.
	var current_year = new Date().getFullYear();
	$('#year-range-slider').slider({
		range: true,
		// gettyimage has image created since 1753, but it makes our slider range too long, we change to later year.
		min: 1900,
		max: current_year,
		values: [ 1981, 2012],
		slide: function(event, ui){
			// showing total year range
			var text = ui.values[0] + ' - ' + ui.values[1];
			$('#startdate').val(ui.values[0]);
			$('#enddate').val(ui.values[1]);
			$('#year-range-text').text(text);
		}
	});
	$('#year-range-text').text( $('#year-range-slider').slider('values', 0 ) + ' - ' + $('#year-range-slider').slider('values', 1 ));

	$('#form-search').on('submit', function(e) {
		e.preventDefault();
		$('.spinner').removeClass('hidden');
		resetTimeline();

		var masterdata = $('#form-search').serializeObject();
		var startdate = masterdata.startdate || $('#year-range-slider').slider('values',0)+'-01-01';
		var enddate = masterdata.enddate || $('#year-range-slider').slider('values',1)+'-01-01';
		startdate = +startdate.split('-')[0];
		enddate = +enddate.split('-')[0];
		var yearlist = [];
		// generate each year
		var range = enddate-startdate;
		var step = parseInt(range/5);
		for (var i=0; i<enddate-startdate; i+=step) {
			yearlist.push(startdate+i);
		}
		//yearlist.push(enddate);
		var itemCount = step*10;

		var reqId = requestId = Math.random();
		var year_mark = null;
		async.mapSeries(yearlist,
			function(year, cb) {
				if (reqId != requestId) {
					// console.log('Cancel expired request')
					return cb();
				}

				var data = clone(masterdata);
				data.startdate = year+'-01-01';
				var nextstep = year+step-1;
				if(nextstep<enddate)
					data.enddate = nextstep+'-12-31';
				else data.enddate = enddate + '-12-31';
				console.log(data.startdate, data.enddate);
				data.itemperpage = itemCount;
				$.ajax({
					url: '/search',
					type: 'GET',
					dataType: 'json',
					data: data,
					resetForm : true
				})
				.done(function(data){
					if (reqId != requestId) return;

						var itemList = [];
						var imageArray = data.SearchForImagesResult&&data.SearchForImagesResult.Images||[];

						$.each(imageArray,function(index, image){
							var date = /\/Date\(([0-9]+).*\)\//g.exec(image.DateCreated);
							if (date && date[1]) image.date = new Date(+date[1]);
							itemList.push(image);
						});

						itemList.sort(function(a, b) {
							return +a.date < +b.date ? -1 : 1;
						});

						// photos
						itemList.forEach(function(image) {
							var year = image.date&&image.date.getFullYear();
							// year mark
							if (year != year_mark) {
								year_mark = year;
								addOnTimeline(createTextMarker(year), 90, 30);
							}

							var w = +image.MaxImageResolutionWidth || 50;
							var h = +image.MaxImageResolutionHeight || 50;
							var ratio = Math.min(w, h)/Math.max(w, h);
							var size = 60;
							w2 = w > h ? size : size * ratio;
							h2 = w > h ? size * ratio : size;
							addOnTimeline(createSprite(image, {width: w2, height: h2}));
						});

				})
				.fail(function(xhr){
					console.error(xhr);
				})
				.always(function() {
					$('.spinner').addClass('hidden');
					cb();
				});
			},

			function(err, result) {
				// no op
			}
		)
	});

	// submit once on pageload
	$('#form-search').trigger('submit');

	// focus on search box
	$('input[name="query"]').trigger('focus');

	// adding date list staring from 1753
	/*function populateStartDate(){
		var all_selectable_date = '';
		for(var i=1753;i<=current_year;i++){
			if(i===2000) all_selectable_date += '<option value="'+i+'-01-01" selected>'+i+'</option>';
			else all_selectable_date += '<option value="'+i+'-01-01">'+i+'</option>';
		}
		$('#startdate-search').html(all_selectable_date);
	}
	function populateEndDate(selectedVal){
		var selected_startdate = $('#startdate-search option:selected').val();
		var all_selectable_date='';
		for(var i=parseInt(selected_startdate); i<=current_year;i++){
			if(i===parseInt(selectedVal)) all_selectable_date += '<option value="'+i+'-01-01" selected>'+i+'</option>';
			else all_selectable_date += '<option value="'+i+'-01-01">'+i+'</option>';
		}
		$('#enddate-search').html(all_selectable_date);
	}
	populateStartDate();
	populateEndDate(current_year);
	$('#startdate-search').change(function(){
		console.log('startdate change');
		var selected_startdate = $('#startdate-search option:selected').val();
		var selected_enddate = $('#enddate-search option:selected').val();
		if(selected_startdate>selected_enddate){
			$('#enddate-search option[value="'+selected_startdate+'-01-01"]').prop('selected', true);
		}
		populateEndDate(selected_enddate);
	});*/

});

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
};
