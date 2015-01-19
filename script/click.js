$(document).ready(function() {
	$("#clickMe").click(function() {
		var userName = $("#userName").val();
		var authKey = $("#authKey").val();
		$.getJSON('http://localhost:3000/address/' + userName + '/' + authKey, function(data) {
			try {
				var address = JSON.parse(data);
				if(address.hasOwnProperty('error')) {
					$("#address").html(address.error);
				}
				$("#address").html(address.address);
			} catch(e) {
				$("#address").html(e.message);
			}
		})
	});
})
