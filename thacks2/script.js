/****	PARAMS	****/
dynamic_search_timeout_ms = 1500;
var tnv_percentages;

/****	PAGINATION	****/
	function page(_eq) {
		$(".page").fadeOut(250);
		$(".page").eq(_eq).fadeIn(250);
	}

/****	SETUP	****/
	function setup_cookie(_age = 0, _gender = 0, _activity_level = 0, _WLM = false, _HHD = false){
		var arr = [_age, _gender, _activity_level, _WLM, _HHD]; //Params to array
		var json_arr = JSON.stringify(arr); //Encode array for cookie
		var expDate = new Date(); //Create expiry date 20 days later
		expDate.setTime(expDate.getTime() + (20 * 24 * 60 * 60 * 1000));
		$.cookie('healthlens', json_arr, { path:'/', expires: expDate });
	}
	
	function set_calories() {
		var val = JSON.parse($.cookie("healthlens"));
		if(!setup_nutrition(val[0],val[1],val[3],val[2],val[4])) alert("Fatal error when setting calorie parameters.");
		else return true;
	}
	
	function complete_setup() {
		setup_cookie(
			$("#age").val(),
			$("#gender").val(),
			$("#activity_level").val(),
			$("#weight_loss_mode").is(":checked"),
			$("#has_heart_disease").is(":checked")
		);
		set_calories();
		page(1);
	}
	
/****	Get Nutrition with resource ID	****/

function nutrition(type,_val) {
	var val = [];

	//Get the data
	if(type == 0) { //Common
		$.ajax({
			type: 'POST',
			beforeSend: function(request) {
				request.setRequestHeader("x-app-id", '81285ea5');
				request.setRequestHeader("x-app-key", 'beba0fbdc6a41560507d3137e3e5e47d');
			 },
			url: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
			dataType: 'json',
			data: {'query': _val},
			async: false
		}).done(function(rsp){
			val = rsp;
		}).fail(function(err){
			//Log Error
			console.log(err);
		});
	}
	else {//Branded
		$.ajax({
			type: 'GET',
			beforeSend: function(request) {
				request.setRequestHeader("x-app-id", '81285ea5');
				request.setRequestHeader("x-app-key", 'beba0fbdc6a41560507d3137e3e5e47d');
			 },
			url: 'https://trackapi.nutritionix.com/v2/search/item?nix_item_id=' + _val,
			dataType: 'json',
			async: false
		}).done(function(rsp){
			val = rsp;
		}).fail(function(err){
			//Log Error
			console.log(err);
		});
	}
	
	//Parse the data
	var nutrition = val["foods"][0];
	var arr = 	{
					food_name: nutrition["food_name"],
					serving: nutrition["serving_qty"] + " " + nutrition["serving_unit"],
					weight: nutrition["serving_weight_grams"],
					calories: Math.round(nutrition["nf_calories"]),
					u_fat_g: nutrition["nf_total_fat"],
					s_fat_g: nutrition["nf_saturated_fat"],
					t_fat_g: 0,
					cholesterol: nutrition["nf_cholesterol"],
					sodium: nutrition["nf_sodium"],
					fiber: nutrition["nf_dietary_fiber"],
					sugar: nutrition["nf_sugars"],
					protein: nutrition["nf_protein"]
				};
	
	var allotment_used = calculate_tnv(arr["calories"], arr["u_fat_g"], arr["s_fat_g"], arr["t_fat_g"], parseInt(arr["cholesterol"]) / 1000, parseInt(arr["sodium"]) / 1000,  arr["fiber"], arr["sugar"], arr["protein"]);
	tnv_percentages = allotment_used;
	
	//Move on to next page
	populate_nutrition_table();
	create_graphics();
}

/****	Get Item	****/

function food_search(_query) {
	var val = [];

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
    		request.setRequestHeader("x-app-id", '2c1d78c4');
    		request.setRequestHeader("x-app-key", '77b9bd92309ace389055ea71a8395a3b');
 		 },
		url: 'https://trackapi.nutritionix.com/v2/search/instant?query=' + _query,
		dataType: 'json',
		async: false
	}).done(function(rsp){
		val = rsp;
	}).fail(function(err){
		//Log Error
		console.log(err);
	});

	//Proper array
	var parsed_result = [];
	
	//common
	for(var i = 0; i < 3; i++){
		var temp = val["common"][i];
		parsed_result[i] =	[
			temp["food_name"],
			temp["serving_unit"],
			temp["photo"]["thumb"],
			temp["serving_qty"],
			temp["tag_id"],
			temp["serving_unit"],
			temp["food_name"]
		];
	}
	//branded
	for(var i = 0; i < 3; i++){
		var temp = val["branded"][i];
		parsed_result[i + 3] =	[
			temp["brand_name_item_name"],
			temp["brand_name"],
			temp["photo"]["thumb"],
			temp["serving_qty"],
			temp["nix_item_id"],
			temp["serving_unit"],
			temp["food_name"]
		];
	}
	
	//Create table
	$("#options .query").html("\" " + _query + " \"");
	$table = $("#options .results");
	$table.empty();
	for(var i = 0; i < parsed_result.length; i++){
		$table.append("<tr onclick='nutrition("+ (i < 3 ? "0,\"" + parsed_result[i][0] : "1,\"" + parsed_result[i][4]) +"\")'>");
		$row = $table.find("tr").eq(i);
		$row.append("<td><img src='"+ parsed_result[i][2] +"' class='thumb'/></td>"); //image
		$row.append("<td>"+ parsed_result[i][0] + " <span class='quant'>"+ parsed_result[i][3] + " " + parsed_result[i][5] +"</span><br><span class='brand_name'>"+ parsed_result[i][1] +"</span></td>"); //Food title, quantity, and brand name
	}
	
	//Change layout to option
	page(2);
}

/****	Info board	****/
//Populate nutrition table
function populate_nutrition_table() {
	$table = $("#info_board .nutrition_table");
	for(var i = 0; i < tnv_percentages.length; i++)
		$table.append("<tr><td>"+ tnv_percentages[i][0] +"</td><td>"+ tnv_percentages[i][1] +"%</td></tr>");
	$table.append("<tr><td style='color: #6aa'><br>Scroll Down</td><td></td></tr>");
	page(3);
}

//graphics
function create_graphics() {
	$(".image.battery").css("background-size", "200px 100%, 100px " + (tnv_percentages[0][1]/100 > 1.0? 1.0 : tnv_percentages[0][1]/100) * 165 + "px");
	$(".status.battery").html(tnv_percentages[0][1] >= 30 ? "Caution" : "O.K.");
	$(".image.ufat").css("background-size", "200px 100%, 100px " + (tnv_percentages[1][1]/100 > 1.0 ? 1.0 : tnv_percentages[1][1]/100) * 165 + "px");
	$(".status.ufat").html(tnv_percentages[1][1] >= 30 ? "Caution" : "O.K.");
	$(".image.sfat").css("background-size", "200px 100%, 100px " + (tnv_percentages[2][1]/100 > 1.0? 1.0 : tnv_percentages[2][1]/100) * 165 + "px");
	$(".status.sfat").html(tnv_percentages[2][1] >= 30 ? "Caution" : "O.K.");
	$(".image.tfat").css("background-size", "200px 100%, 100px " + (tnv_percentages[3][1]/100 > 1.0? 1.0 : tnv_percentages[3][1]/100) * 165 + "px");
	$(".status.tfat").html(tnv_percentages[3][1] >= 30 ? "Caution" : "O.K.");
	$(".image.cholestorol").css("background-size", "200px 100%, 100px " + (tnv_percentages[4][1]/100 > 1.0? 1.0 : tnv_percentages[4][1]/100) * 165 + "px");
	$(".status.cholestorol").html(tnv_percentages[4][1] >= 30 ? "Caution" : "O.K.");
	$(".image.sodium").css("background-size", "200px 100%, 100px " + (tnv_percentages[5][1]/100 > 1.0? 1.0 : tnv_percentages[5][1]/100) * 165 + "px");
	$(".status.sodium").html(tnv_percentages[5][1] >= 60 ? "Too much. Reduce intake" : "O.K.");
	$(".image.fiber").css("background-size", "200px 100%, 100px " + (tnv_percentages[6][1]/100 > 1.0? 1.0 : tnv_percentages[6][1]/100) * 165 + "px");
	$(".status.fiber").html(tnv_percentages[6][1] >= 100 ? "Warning" : "O.K.");
	$(".image.sugar").css("background-size", "200px 100%, 100px " + (tnv_percentages[7][1]/100 > 1.0? 1.0 : tnv_percentages[7][1]/100) * 165 + "px");
	$(".status.sugar").html(tnv_percentages[7][1] >= 60 ? "Caution" : "O.K.");
	$(".image.protein").css("background-size", "200px 100%, 100px " + (tnv_percentages[8][1]/100 > 1.0? 1.0 : tnv_percentages[8][1]/100) * 165 + "px");
	$(".status.protein").html(tnv_percentages[8][1] >= 100 ? "Too much protein" : "Good");
	
}

/****	STORYBOARD	****/	
$(document).ready(function(){
	$(".page").hide();
	if(typeof $.cookie('healthlens') === 'undefined')
		page(0);
	else{
		if(set_calories())
			page(1);
	}
		
	//Search bar dynamic
	var timeout;
	$("#searchbar").keydown(function(){
		clearTimeout(timeout);
		timeout = window.setTimeout(function(){
			food_search($("#searchbar").val());
		}, dynamic_search_timeout_ms);
	});
});

