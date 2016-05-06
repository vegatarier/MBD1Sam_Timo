$(function(){
	loadCaughtPokemon();
});

function loadCaughtPokemon(){

	var caught = JSON.parse(localStorage.getItem("catched"));
	if(caught==null) caught = [];
	//localStorage.getItem(localStorage.key(i));
	
	for (var i = 0; i < caught.length; i++) {
		
		getJSON('http://pokeapi.co/api/v2/pokemon/?limit=1&offset='+caught[i], function(pokemons){
			var html = '';
			var odd = false;
			var nextUrl = pokemons.next;
			pokemons.results.forEach(function(elem){
				var segments = elem.url.split('/');
				var id = segments[segments.length-2];
				html += "<div class='item"+(odd?" odd":'')+"' data-id='"+id+"'>";
				html += "<img src='http://pokeapi.co/media/sprites/pokemon/"+id+".png'/>";
				html += "<span>"+elem.name+"</span>";
				html += "</div>";
				odd ^= true;
			});
			$('#catched').append(html);
		});
    //Do something
	}
}