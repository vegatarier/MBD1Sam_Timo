/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

document.addEventListener("deviceready", onDeviceReady, false);

var pokemonAmount;
var pokemons;
var detailPokemonId; // used for detail page
var caught; // caught pokemon
var catchable; // possible pokemon to catch
var $toast;

$(function(){
	loadPokemons();
	initPokemonAmount();
	initCatchablePokemon();
	initCaughtPokemon();
	initToast();
	$("body").removeClass('splashscreen');
});

// Bind to the navigate event
$( window ).on( "navigate", function( event, data ) {
	//console.log( data.state.info );
	console.log( data.state.direction )
	console.log( data.state.url )
	//console.log( data.state.hash )
});


function onDeviceReady(){
	console.log('device ready');

	geolocation();
}

function initPokemonAmount(){
	$.getJSON('http://pokeapi.co/api/v2/pokemon/?limit=0', function(pokemons){
		pokemonAmount = pokemons.count;
	});
}

function loadPokemons(){
	pokemons = [];

	$.ajax({
		url: "http://pokeapi.co/api/v2/pokemon/?limit=1000",
		async: false,
        success: function (data) {
			data.results.forEach(function(elem){
				var segments = elem.url.split('/');
				var id = parseInt(segments[segments.length-2]);
			
				pokemons.push({ 
					id: id,
					name: elem.name
				});
			});
        }
	})
}

//TODO pokemon class
function initCatchablePokemon(){
	catchable = [];

	var pokemon = getPokemon(1);
	
	//TODO close to user location
	// close to Timo's home
	pokemon.latitude = 51.957511;
	pokemon.longitude = 5.244361;

	catchable.push(1);

	// random locations around current location
	var margin = 1000;
	for(var i=2;i<=10;i++){
		console.log('generate location '+i);

		var coords = getRandomCoords(pokemons[0].latitude, pokemons[0].longitude);
		//var lat = pokemons[0].latitude-margin/2+Math.floor(Math.random()*margin);
		//var lng = pokemons[0].longitude-margin/2+Math.floor(Math.random()*margin);

		pokemon = getPokemon(i);
		pokemon.latitude = coords.lat;
		pokemon.longitude = coords.lng;

		catchable.push(i);
	}
}

function initCaughtPokemon(){
	localStorage.setItem("caught", []); //TODO remove
	if(localStorage["caught"]) caught = JSON.parse(localStorage.getItem("caught"));
	if(caught==null) caught = [];
	else{ // filter out duplicates
		var originalLength = caught.length;
		caught = caught.filter(function(item, pos) {
			return caught.indexOf(item) == pos;
		});
		// save to clean the storage from duplicates
		if(caught.length!=originalLength) localStorage.setItem("caught", JSON.stringify(caught));
	}
}

function initToast(){
	$toast = $("body > .toast");
	$toast.click(function(){
		try{
		$.mobile.navigate("#detail", { transition : "slide", info: "info about the #detail hash"});
		}catch(e){
			console.log(e.message);	
		}
	});
}

function getPokemon(id){
	return pokemons.filter(function(obj) {
		return obj.id == id;
	})[0];
}

function getRandomCoords(originalLat, originalLng){
	var r = 100/111300; // = 500 meters
	var y0 = originalLat;
	var x0 = originalLng;
	var u = Math.random();
	var v = Math.random();
	var w = r * Math.sqrt(u);
	var t = 2 * Math.PI * v;
	var x = w * Math.cos(t);
	var y1 = w * Math.sin(t);
	var x1 = x / Math.cos(y0);

	return {lat: y0 + y1, lng: x0 + x1};
}

var positionObject = {};

function geolocation(){
	// onSuccess Callback
	//   This method accepts a `Position` object, which contains
	//   the current GPS coordinates
	//
	function onSuccess(position) {
		if ('coords' in position) {
			positionObject.coords = {};

			if ('latitude' in position.coords) positionObject.coords.latitude = position.coords.latitude;
			if ('longitude' in position.coords)	positionObject.coords.longitude = position.coords.longitude;
			if ('accuracy' in position.coords) positionObject.coords.accuracy = position.coords.accuracy;
			if ('altitude' in position.coords) positionObject.coords.altitude = position.coords.altitude;
			if ('altitudeAccuracy' in position.coords) positionObject.coords.altitudeAccuracy = position.coords.altitudeAccuracy;
			if ('heading' in position.coords) positionObject.coords.heading = position.coords.heading;
			if ('speed' in position.coords) positionObject.coords.speed = position.coords.speed;
		}

		if ('timestamp' in position) positionObject.timestamp = position.timestamp;

		// Use the positionObject instead of the position 'object'
		/*var element = document.getElementById('geolocation');
		element.innerHTML = 'Latitude: '  + position.coords.latitude      + '<br />' +
							'Longitude: ' + position.coords.longitude     + '<br />' +
							'<hr />'      + element.innerHTML;*/

		catchableReach(positionObject);
	}

	function catchableReach(position){
		for(var i=0;i<catchable.length;i++){
			var pokemon = getPokemon(catchable[i]);

			if(caught.indexOf(pokemon.id)==-1 // test if pokemon is not caught already
			&& pokemon.hasOwnProperty('latitude') && pokemon.hasOwnProperty('longitude') // test if pokemon can be caught
			&& measure(position.coords.latitude, position.coords.longitude, pokemon.latitude, pokemon.longitude)<=110){ // test if pokemon is in 110 meter distance radius
				//navigator.vibrate(3000); TODO uncomment

				caught.push(pokemon.id);
				localStorage.setItem("caught", JSON.stringify(caught));
				console.log(caught);

				detailPokemonId = pokemon.id;

				$toast.find("span").text("caught "+pokemon.name+"!");
				$toast.find('img').attr('src', "http://pokeapi.co/media/sprites/pokemon/"+pokemon.id+".png");
				$toast.fadeIn(1000, function(){
					window.setTimeout(function(){
						$toast.fadeOut(1000, function(){
							$toast.find('img').attr('src', null);
						});
					}, 8000);
				});
				break;
			}
		};
	}

	function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
		var R = 6378.137; // Radius of earth in KM
		var dLat = (lat2 - lat1) * Math.PI / 180;
		var dLon = (lon2 - lon1) * Math.PI / 180;
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon/2) * Math.sin(dLon/2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c;
		return d * 500; // meters
	}

	// onError Callback receives a PositionError object
	//
	function onError(error) {
		console.log('code: '+error.code+'\n'+'message: '+error.message+'\n');
	}

	if(!navigator.geolocation) 
		console.log("Error: Plugin not working!");
	else{
		// Options: throw an error if no update is received every 30 seconds.
		//
		//var watchID = navigator.geolocation.watchPosition(onSuccess, onError, { timeout: 30000 });

		window.setInterval(function(){
			navigator.geolocation.getCurrentPosition(onSuccess, onError, false);
		}, 15000);
	}
}
