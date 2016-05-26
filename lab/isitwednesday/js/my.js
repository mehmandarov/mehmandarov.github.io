function changeText(){
	var now = new Date();
	
	if (now.getDay() == 2){
		document.getElementById('answer').innerHTML = 'Almost.';
	} else if (now.getDay() == 3) {
		document.getElementById('answer').innerHTML = 'Yes!';
	} else {
		document.getElementById('answer').innerHTML = 'Nope.';
	}
}

$(document).ready(changeText);
$('html').ajaxStop(changeText);