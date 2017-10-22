/*****************************************************************************************
	How to use me:
	
	FIRST OFF: Please don't edit any code in this file. It works flawlessly and any
	modifications might hinder proper functionality.
	
	1.	The "setup" function is where you enter all of the setup data. This
		function is required and must be run before any other functions in this library
		are used. The parameters for this function, in order, are:
			- Age group (0 = 9-13, 1 = 14-18, 2 = 19-30, 3 = 31-50, 4 = 50+)
			- Gender (0 = male, 1 = female)
			- Weight loss mode (boolean)
			- Activity level (0 = Low, 1 = Medium, 2 = High)
			- Has heart disease (bool)
		Thats it! You set up the calculator. Now you are able to evaluate food nutrition
		values retrieved from the OCR data. NOTE: This function returns either true (bool)
		when the setup succeeded, or a string with the error message if the parameters 
		entered are invalid.
		SYNTAX: setup(age, gender, weight_loss_mode, activity, has_heart_disease)
		
	3.	The "evaluate" function inputs nutritional data in the following order that was
		retrieved from the OCR reading:
			- Calories (int)
			- Unsaturated fat (g)
			- Saturated fat (g)
			- Trans fat (g)
			- Cholesterol (g)
			- Sodium (g)
			- Fiber (g)
			- Sugar (g)
			- Protein (g)
			- Vitamins [a,b,c,d] (array of %'s) (If present on label. Optional parameter)
			
	4.	The "evaluate" function will return the percent each of the values above
		(excluding "Portion") out of the daily allotment determined by the setup function.
		e.g. if the maximum calories determined is 2,000, and a bag of chips has 300 cals,
		the percent value returned for calories is 15%. NOTE: If the setup is not complete
		, this function will return false.
	
	- Sasha Seufert, Oct 21st, 2017
*****************************************************************************************/

var max_calories;
var max_u_fats;
var max_s_fats;
var max_t_fats = 2;
var max_cholestorol;
var recommended_sodium = 1.5;
var max_sodium = 2.5;
var max_fiber;
var max_sugar;
var max_protein;

var _setup = false;
 
function setup_nutrition(_age, _gender, _weight_loss_mode, _activity, _has_heart_disease) {
	//Validation
	if(!(0 <= _age <= 4))
		return "Invalid age group";
	if(_gender != 0 && _gender != 1)
		return "Invalid gender";
	if(typeof(_weight_loss_mode) != "boolean")
		return "Invalid weight loss mode input";
	if(_gender != 0 && _gender != 1)
		return "Invalid gender";
	if(!(0 <= _activity <= 2))
		return "Invalid activity";
	if(typeof(_has_heart_disease) != "boolean")
		return "Invalid heart disease input";

	//Calorie tables
	var female_calories =	[ //Sedentary, moderately active, very active
								[1600, 1800, 2000], // 9-13 years
								[1800, 2000, 2400], // 14-18 years
								[2000, 2200, 2400], // 19-30 years
								[1800, 2000, 2200], // 31-50 years
								[1600, 1800, 2100] // 51+ years
							];
						
	var male_calories =		[ //Sedentary, moderately active, very active
								[1800, 2000, 2300], // 9-13 years
								[2200, 2600, 3000], // 14-18 years
								[2400, 2700, 3000], // 19-30 years
								[2200, 2500, 2900], // 31-50 years
								[2000, 2300, 2600] // 51+ years
							];
							
	//Fiber table 
	var fiber =		[ //ages 9-13, 14-18, 19-30, 31-50, 50+
						[31,38,38,38,30], //Male
						[26,26,25,25,51]  //Female
					];
					
	//protein table 
	var protein =	[ //ages 9-13, 14-18, 19-30, 31-50, 50+
						[34,52,56,56,56], //Male
						[34,46,46,46,46]  //Female
					];
	
	max_calories = _gender == 0? male_calories[_age][_activity] : female_calories[_age][_activity];
	
	//Weight loss mode
	if(_weight_loss_mode) max_calories -= 500;
	
	//Nutrition in grams
	max_u_fats = 0.35 * max_calories / 9;
	max_s_fats = 0.07 * max_u_fats;
	max_cholestorol = _has_heart_disease? 0.2 : 0.3;
	max_fiber = fiber[_gender][_age];
	max_sugar = max_calories * (_gender == 0? 0.076 : 0.05) / 4;
	max_protein = protein[_gender][_age];
	
	_setup = true;
	return true;
}

//True nutritional value
function calculate_tnv(_calories, _u_fats, _s_fats, _t_fats, _cholestorol, _sodium, _fiber, _sugar, _protein) {
	if(!_setup) return false;
	var results = [];
	results[0] = ["calories", Math.round(_calories / max_calories * 100)];
	results[1] = ["unsaturated & monounsaturated fats", Math.round(_u_fats / max_u_fats * 100)];
	results[2] = ["saturated fats", Math.round(_s_fats / max_s_fats * 100)];
	results[3] = ["trans fats", Math.round(_t_fats / max_t_fats * 100)];
	results[4] = ["cholesterol", Math.round(_cholestorol / max_cholestorol * 100)];
	results[5] = ["sodium", Math.round(_sodium / max_sodium * 100)];
	results[6] = ["fiber", Math.round(_fiber / max_fiber * 100)];
	results[7] = ["sugar", Math.round(_sugar / max_sugar * 100)];
	results[8] = ["protein", Math.round(_protein / max_protein * 100)];
	
	return results;
}