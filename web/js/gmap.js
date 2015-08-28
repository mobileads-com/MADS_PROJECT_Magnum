 var map;

    /*
    * Map object that takes configuration parameters as object
    *
    * Parameters:
    * id - unique identifier for the Map object
    * containerElement - HTML div element that we assign Map object to
    * componentData - parameter that consists of few properties below
    * componentData.addresses - array of locations to create Markers on the Map
    * componentData.zoom - map zoom level (0 - zoom out to show all addresses (default if user's current location not available), numeric value to determine km to zoom in according to user's current location)
    * componentData.mapType - type of the Map (can be ROADMAP, SATELLITE, HYBRID, TERRAIN)
    * customLocImg - custom location pointer image
    * customUserLocImg - custom user's location pointer image
    * */
    var GMap = function(options){
        this.id = options.id;
        this.containerElement = options.containerElement;
        this.componentData = options.componentData;
        this.markers = [];

        // create and initialize the Map with Markers
        this.createMap();
    };

    /*
    * This method creates Map
    * */
    GMap.prototype.createMap = function() {
        // Try HTML5 geolocation to get current user's location
        var that = this;
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                // here we have current user's location
                var userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var mapOptions = {
                    mapTypeId: google.maps.MapTypeId[that.componentData.mapType]
                };

                map = new google.maps.Map(that.containerElement, mapOptions);

                // show current user's location
                that.createMarker(true, null, userPosition, 'Current user\'s location', 'Current user\'s location', that.componentData.customUserLocImg, map);

                // show all the locations from the addresses array
                var addresses = that.componentData.addresses;
                for (var i = 0; i < addresses.length; i++) {
                    that.createMarker(true, userPosition, new google.maps.LatLng(addresses[i].lat, addresses[i].long), addresses[i].title, addresses[i].address, that.componentData.customLocImg, map);
                }

                // get correct zoom to show all the markers according to distance
                var new_boundary = new google.maps.LatLngBounds();
                if (that.componentData.zoom == 0) {
                    // get such zoom to be able to see all the markers on the map
                    for (var index in that.markers) {
                        new_boundary.extend(that.markers[index].position);
                    }
                } else {
                    for (var index in that.markers) {
                        // show markers that are in appropriate radius based on the zoom parameter
                        if (that.getDistanceInKm(userPosition, that.markers[index].position) <= that.componentData.zoom) {
                            new_boundary.extend(that.markers[index].position);
                        }
                    }
                }
                map.fitBounds(new_boundary);
            }, function(error) {
                // this means that we can not get current user's location because of browser settings restriction
                console.log("Error: The Geolocation service failed. " + error.message);

                var addresses = that.componentData.addresses;
                var mapOptions = {
                    mapTypeId: google.maps.MapTypeId[that.componentData.mapType]
                };

                map = new google.maps.Map(that.containerElement, mapOptions);

                // show all the locations from the addresses
                for (var i = 0; i < addresses.length; i++) {
                    that.createMarker(true, null, new google.maps.LatLng(addresses[i].lat, addresses[i].long), addresses[i].title, addresses[i].address, that.componentData.customLocImg, map);
                }

                // get zoom to show all the markers
                var new_boundary = new google.maps.LatLngBounds();
                for (var index in that.markers) {
                    new_boundary.extend(that.markers[index].position);
                }
                map.fitBounds(new_boundary);
            });
        } else {
            console.log('Error: Your browser doesn\'t support geolocation.');
        }
    };

    /*
    * This method creates one marker
    * */
    GMap.prototype.createMarker = function(show, currentUserLatLon, markerLatLon, title, address, icon, map) {
        var marker;

        // if icon is not set, then we will use default icon
        if (icon) {
            marker = new google.maps.Marker({
                position: markerLatLon,
                title: title,
                map: map,
                icon: icon
            });
        } else {
            marker = new google.maps.Marker({
                position: markerLatLon,
                title: title,
                map: map
            });
        }

        this.markers.push(marker);

        // create link for "href" attribute in "a" HTML element to be able to open Google Navigation with correct locations
        var link = this.createLinkToGoogleNavigation(currentUserLatLon, markerLatLon);
        // count distance between current user's location and marker's location
        var distance = this.getDistanceInKm(currentUserLatLon, markerLatLon);

        // handling click event on marker if it is not current user's location marker
        if (show) {
            google.maps.event.addListener(marker, 'click', function() {
                // create template for info popup
                // on this popup we can see location title, location address (this is set in configuration),
                // distance between current user's location and marker's location
                // and directions button that opens Google Navigation
                // if current user's location is available we will open Google Navigation with Directions from current user's location to marker's location
                // if current user's location is not available we will open Google Navigation with only marker's location parameters.
                // To see Directions in this case we should fill in To field on Google Navigation console
                var popupTemplate;
                if (currentUserLatLon == null) {
                    popupTemplate = '<div class="marker-popup">' +
                        '<div class="location-info">' +
                        '<p class="info-title">' + title + '</p>' +
                        '<p class="info-address">' + address + '</p>' +
                        '</div>' +
                        '<div class="directions">' +
                        '<a target="_blank" href="' + link + '">' +
                        '<div class="directions-icon"></div>' +
                        '<p class="directions-button">Directions</p>' +
                        '</a>' +
                        '</div>' +
                        '<div class="clear"></div>' +
                        '</div>';
                } else {
                    popupTemplate = '<div class="marker-popup">' +
                        '<div class="location-info">' +
                        '<p class="info-title">' + title + '</p>' +
                        '<p class="info-address">' + address + '</p>' +
                        '<p class="info-address">Distance from current location is: ' + distance + 'km' + '</p>' +
                        '</div>' +
                        '<div class="directions">' +
                        '<a target="_blank" href="' + link + '">' +
                        '<div class="directions-icon"></div>' +
                        '<p class="directions-button">Directions</p>' +
                        '</a>' +
                        '</div>' +
                        '<div class="clear"></div>' +
                        '</div>';
                }

                // initializing popup
                var infowindow = new google.maps.InfoWindow({
                    map: map,
                    position: markerLatLon,
                    content: popupTemplate
                });
            });
        }
    };

    /*
    * This method prepares url for "href" attribute in "a" HTML element in following way
    * http://maps.google.com/maps?saddr=49.8424334,24.025559899999962&daddr=49.831081,23.996779999999944
    * */
    GMap.prototype.createLinkToGoogleNavigation = function(from, to) {
        var link = "http://maps.google.com/maps";
        var toLat = to.lat();
        var toLng = to.lng();

        if (from != null) {
            var fromLat = from.lat();
            var fromLng = from.lng();
            link += "?saddr=" + fromLat + "," + fromLng + "&daddr=" + toLat + "," + toLng;
        } else {
            link += "?saddr=" + toLat + "," + toLng;
        }

        return link;
    };

    /*
    * This method calculates distance between two locations in kilometers as decimal number with 2 fixed characters after dot
    * */
    GMap.prototype.getDistanceInKm = function(latLngA, latLngB) {
        return latLngA != null ? (google.maps.geometry.spherical.computeDistanceBetween(latLngA, latLngB) / 1000).toFixed(2) : 0;
    };

    // demo with two Maps (one - with markers in Ukraine to be able to test whole functionality, and second - with markers in the USA)
    function qqqq() {
        /* component instantiation with json format options */
        var container1 = document.getElementById('container1'); // a div element as the container of the generated map
        var gmap1 = new GMap({
            id: 'tab1',
            containerElement: container1,
            componentData: { // data for this component
                 addresses: [ // array of addresses
                    {
                        title: "Eastpoint Mall", // name of the location
                        address: "3 Simei Street, Singapore", // address details
                        lat: "1.342638", // latitude of the location marker
                        long: "103.952731" // longitute of the location marker
                    },
                    {
                        title: "Sun Plaza", // name of the location
                        address: "30 Sembawang Drive, Singapore", // address details
                        lat: "1.448217", // latitude of the location marker
                        long: "103.819504" // longitute of the location marker
                    },
                    {
                        title: "One KM", // name of the location
                        address: "11 Tanjong Katong Road, Singapore", // address details
                        lat: "1.314957", // latitude of the location marker
                        long: "103.894744" // longitute of the location marker
                    },
                    {
                        title: "Fairprice Hub", // name of the location
                        address: "11 Tanjong Katong Road, Singapore", // address details
                        lat: "1.326194", // latitude of the location marker
                        long: "103.678376" // longitute of the location marker
                    },
                    {
                        title: "Bedok", // name of the location
                        address: "209 New Upper Changi Rd, Singapore", // address details
                        lat: "1.324672", // latitude of the location marker
                        long: "103.930879" // longitute of the location marker
                    },
                    {
                        title: "Terminal 1 Singapore Changi Airport", // name of the location
                        address: "80 Airport Boulevard, Singapore", // address details
                        lat: "1.342954", // latitude of the location marker
                        long: "103.9823" // longitute of the location marker
                    },
                    {
                        title: "Sengkang", // name of the location
                        address: "118 Rivervale Drive, Singapore", // address details
                        lat: "1.385427", // latitude of the location marker
                        long: "103.901579" // longitute of the location marker
                    },
                    {
                        title: "Punggol Plaza", // name of the location
                        address: "168 Punggol Field, Singapore", // address details
                        lat: "1.410762", // latitude of the location marker
                        long: "103.899907" // longitute of the location marker
                    },
                    {
                        title: "Parkway Parade", // name of the location
                        address: "80 Marine Parade Road, Singapore", // address details
                        lat: "1.301072", // latitude of the location marker
                        long: "103.905281" // longitute of the location marker
                    },
                    {
                        title: "Hougang 1", // name of the location
                        address: "1 Hougang Street 91, Singapore", // address details
                        lat: "1.376022", // latitude of the location marker
                        long: "103.879482" // longitute of the location marker
                    },
                    {
                        title: "Compass Point", // name of the location
                        address: "1 Sengkang Square, Singapore", // address details
                        lat: "1.392272", // latitude of the location marker
                        long: "103.894775" // longitute of the location marker
                    },
                    {
                        title: "Hougang Mall", // name of the location
                        address: "90 Hougang Avenue 10, Singapore", // address details
                        lat: "1.372629", // latitude of the location marker
                        long: "103.893938" // longitute of the location marker
                    },
                    {
                        title: "Bedok Mall", // name of the location
                        address: "311 New Upper Changi Road, Singapore", // address details
                        lat: "1.32506", // latitude of the location marker
                        long: "103.93933" // longitute of the location marker
                    },
                    {
                        title: "Shaw Plaza", // name of the location
                        address: "360 Balestier Road, Singapore", // address details
                        lat: "1.324989", // latitude of the location marker
                        long: "103.85119" // longitute of the location marker
                    },
                    {
                        title: "Tampines CPF Building", // name of the location
                        address: "1 Tampines Central 5, Singapore", // address details
                        lat: "1.353112", // latitude of the location marker
                        long: "103.943709" // longitute of the location marker
                    },
                    {
                        title: "Towner Road", // name of the location
                        address: "102 Towner Road, Singapore", // address details
                        lat: "1.320645", // latitude of the location marker
                        long: "103.861876" // longitute of the location marker
                    },
                    {
                        title: "Tampines", // name of the location
                        address: "823A Tampines Street 81, Singapore", // address details
                        lat: "1.348861", // latitude of the location marker
                        long: "103.933336" // longitute of the location marker
                    },
                    {
                        title: "Rivervale Mall", // name of the location
                        address: "11 Rivervale Crescent, Singapore", // address details
                        lat: "1.392002", // latitude of the location marker
                        long: "103.904984" // longitute of the location marker
                    },
                    {
                        title: "ARC", // name of the location
                        address: "460 Alexandra Road, Singapore", // address details
                        lat: "1.273673", // latitude of the location marker
                        long: "103.801381" // longitute of the location marker
                    },
                    {
                        title: "West Mall", // name of the location
                        address: "1 Bukit Batok Central Link, Singapore", // address details
                        lat: "1.349649", // latitude of the location marker
                        long: "103.749107" // longitute of the location marker
                    },
                    {
                        title: "Jurong Point", // name of the location
                        address: "1 Jurong West Central 2 , Singapore", // address details
                        lat: "1.339874", // latitude of the location marker
                        long: "103.706464" // longitute of the location marker
                    },
                    {
                        title: "Nanyang Community Club", // name of the location
                        address: "60 Jurong West Street 91, Singapore", // address details
                        lat: "1.342594", // latitude of the location marker
                        long: "103.692257" // longitute of the location marker
                    },
                    {
                        title: "Gek Poh Ville Community Club", // name of the location
                        address: "1 Jurong West Street 74, Singapore", // address details
                        lat: "1.348436", // latitude of the location marker
                        long: "103.698774" // longitute of the location marker
                    },
                    {
                        title: "Yew Tee Point", // name of the location
                        address: "21 Choa Chu Kang North 6, Singapore", // address details
                        lat: "1.39729", // latitude of the location marker
                        long: "103.746546" // longitute of the location marker
                    },
                    {
                        title: "Jcube", // name of the location
                        address: "2 Jurong East Central 1, Singapore", // address details
                        lat: "1.33352", // latitude of the location marker
                        long: "103.740277" // longitute of the location marker
                    },
                    {
                        title: "JEM", // name of the location
                        address: "50 Jurong Gateway Road, Singapore", // address details
                        lat: "1.333067", // latitude of the location marker
                        long: "103.74366" // longitute of the location marker
                    },
                    {
                        title: "Bukit Merah", // name of the location
                        address: "162 Bukit Merah Central, Singapore", // address details
                        lat: "1.284152", // latitude of the location marker
                        long: "103.816987" // longitute of the location marker
                    },
                    {
                        title: "Toa Payoh", // name of the location
                        address: "190 Toa Payoh Lorong 6, Singapore", // address details
                        lat: "1.338662", // latitude of the location marker
                        long: "103.844466" // longitute of the location marker
                    },
                    {
                        title: "Bugis Village", // name of the location
                        address: "165/166 Rochor Road , Singapore", // address details
                        lat: "1.300913", // latitude of the location marker
                        long: "103.855268" // longitute of the location marker
                    },
                    {
                        title: "Anchorpoint", // name of the location
                        address: "370 Alexandra Road, Singapore", // address details
                        lat: "1.288541", // latitude of the location marker
                        long: "103.805249" // longitute of the location marker
                    },
                    {
                        title: "Novena Square", // name of the location
                        address: "238 Thomson Road, Singapore", // address details
                        lat: "1.319826", // latitude of the location marker
                        long: "103.843998" // longitute of the location marker
                    },
                    {
                        title: "Toa Payoh Joint Social Service Centre", // name of the location
                        address: "381 Toa Payoh Lorong 1, Singapore", // address details
                        lat: "1.340602", // latitude of the location marker
                        long: "103.845371" // longitute of the location marker
                    },
                    {
                        title: "Bugis Junction", // name of the location
                        address: "200 Victoria Street, Singapore", // address details
                        lat: "1.298489", // latitude of the location marker
                        long: "103.854101" // longitute of the location marker
                    },
                    {
                        title: "City Square Mall", // name of the location
                        address: "180 Kitchener Road, Singapore", // address details
                        lat: "1.311403", // latitude of the location marker
                        long: "103.85662" // longitute of the location marker
                    },
                    {
                        title: "NEX", // name of the location
                        address: "23 Serangoon Central, Singapore", // address details
                        lat: "1.350644", // latitude of the location marker
                        long: "103.871806" // longitute of the location marker
                    },
                    {
                        title: "Kallang Stadium", // name of the location
                        address: "190 Stadium Boulevard , Singapore", // address details
                        lat: "1.305311", // latitude of the location marker
                        long: "103.881046" // longitute of the location marker
                    },
                    {
                        title: "Northpoint", // name of the location
                        address: "930 Yishun  Avenue 2, Singapore", // address details
                        lat: "1.429848", // latitude of the location marker
                        long: "103.835554" // longitute of the location marker
                    },
                    {
                        title: "Junction 8", // name of the location
                        address: "9 Bishan Place , Singapore", // address details
                        lat: "1.349971", // latitude of the location marker
                        long: "103.848794" // longitute of the location marker
                    },
                    {
                        title: "Lot 1", // name of the location
                        address: "21 Choa Chu Kang Avenue 4, Singapore", // address details
                        lat: "1.384848", // latitude of the location marker
                        long: "103.745046" // longitute of the location marker
                    },
                    {
                        title: "Yishun Street 22", // name of the location
                        address: "292 Yishun Street 22, Singapore", // address details
                        lat: "1.437003", // latitude of the location marker
                        long: "103.837201" // longitute of the location marker
                    },
                    {
                        title: "HarbourFront Centre", // name of the location
                        address: "1 Maritime Square , Singapore", // address details
                        lat: "1.264553", // latitude of the location marker
                        long: "103.819304" // longitute of the location marker
                    },
                    {
                        title: "Bukit Panjang Plaza", // name of the location
                        address: "1 Jelebu Road, Singapore", // address details
                        lat: "1.379962", // latitude of the location marker
                        long: "103.764153" // longitute of the location marker
                    },
                    {
                        title: "Admiralty Place", // name of the location
                        address: "678A Woodlands Avenue 6, Singapore", // address details
                        lat: "1.440493", // latitude of the location marker
                        long: "103.801801" // longitute of the location marker
                    },
                    {
                        title: "Causeway Point", // name of the location
                        address: "1 Woodlands Square, Singapore", // address details
                        lat: "1.435855", // latitude of the location marker
                        long: "103.786222" // longitute of the location marker
                    },
                    {
                        title: "Fuchun Community Club", // name of the location
                        address: "1 Woodlands Street 31, Singapore", // address details
                        lat: "1.429581", // latitude of the location marker
                        long: "103.775149" // longitute of the location marker
                    },
                    {
                        title: "Jurong Spring Community Club", // name of the location
                        address: "501 Jurong West Street 51, Singapore", // address details
                        lat: "1.350092", // latitude of the location marker
                        long: "103.719126" // longitute of the location marker
                    },
                    {
                        title: "Clementi Mall", // name of the location
                        address: "3155 Commonwealth Avenue West, Singapore", // address details
                        lat: "1.315011", // latitude of the location marker
                        long: "103.764356" // longitute of the location marker
                    },
                    {
                        title: "Valley Point", // name of the location
                        address: "491 River Valley Road, Singapore", // address details
                        lat: "1.293043", // latitude of the location marker
                        long: "103.826933" // longitute of the location marker
                    },
                    {
                        title: "Takashimaya", // name of the location
                        address: "391A Orchard Road. Ngee Ann City, Singapore", // address details
                        lat: "1.302707", // latitude of the location marker
                        long: "103.834289" // longitute of the location marker
                    },
                    {
                        title: "Plaza Singapura", // name of the location
                        address: "68 Orchard Road, Singapore", // address details
                        lat: "1.371969", // latitude of the location marker
                        long: "103.845946" // longitute of the location marker
                    },
                    {
                        title: "Marina Square", // name of the location
                        address: "6 Raffles Boulevard, Singapore", // address details
                        lat: "1.291442", // latitude of the location marker
                        long: "103.857647" // longitute of the location marker
                    },
                    {
                        title: "Orchard Cineleisure", // name of the location
                        address: "8 Grange Road, Singapore", // address details
                        lat: "1.301555", // latitude of the location marker
                        long: "103.83666" // longitute of the location marker
                    },
                    {
                        title: "Funan DigitaLife Mall", // name of the location
                        address: "109 North Bridge Road, Singapore", // address details
                        lat: "1.29133", // latitude of the location marker
                        long: "103.850074" // longitute of the location marker
                    },
                    {
                        title: "Parklane", // name of the location
                        address: "35 Selegie Road, Singapore", // address details
                        lat: "1.300626", // latitude of the location marker
                        long: "103.849458" // longitute of the location marker
                    },
                    {
                        title: "The Signature ", // name of the location
                        address: "51 Changi Business Park Central 2, Singapore", // address details
                        lat: "1.334908", // latitude of the location marker
                        long: "103.964995" // longitute of the location marker
                    },
                    {
                        title: "Tampines New Town", // name of the location
                        address: "139 Tampines Street 11, Singapore", // address details
                        lat: "1.346653", // latitude of the location marker
                        long: "103.944868" // longitute of the location marker
                    },
                    {
                        title: "Downtown East", // name of the location
                        address: "1 Pasir Ris Close, Singapore", // address details
                        lat: "1.379085", // latitude of the location marker
                        long: "103.955139" // longitute of the location marker
                    },
                    {
                        title: "Tampines Mart", // name of the location
                        address: "5 Tampines Street 32, Singapore", // address details
                        lat: "1.354349", // latitude of the location marker
                        long: "103.960259" // longitute of the location marker
                    },
                    {
                        title: "Bedok Reservoir", // name of the location
                        address: "632 Bedok Reservoir Road, Singapore", // address details
                        lat: "1.332034", // latitude of the location marker
                        long: "103.91397" // longitute of the location marker
                    },
                    {
                        title: "Heartland Mall", // name of the location
                        address: "205 Hougang Street 21, Singapore", // address details
                        lat: "1.359336", // latitude of the location marker
                        long: "103.885208" // longitute of the location marker
                    },
                    {
                        title: "Punggol East", // name of the location
                        address: "60 Punggol East, Singapore", // address details
                        lat: "1.394443", // latitude of the location marker
                        long: "103.916215" // longitute of the location marker
                    },
                    {
                        title: "Ang Mo Kio", // name of the location
                        address: "715 Ang Mo Kio Avenue 6, Singapore", // address details
                        lat: "1.370028", // latitude of the location marker
                        long: "103.848603" // longitute of the location marker
                    },
                    {
                        title: "Siglap Shopping Centre", // name of the location
                        address: "901 East Coast Road, Singapore", // address details
                        lat: "1.312699", // latitude of the location marker
                        long: "103.924046" // longitute of the location marker
                    },
                    {
                        title: "Thomson Plaza", // name of the location
                        address: "301 Upper Thomson Road, Singapore", // address details
                        lat: "1.354637", // latitude of the location marker
                        long: "103.830935" // longitute of the location marker
                    },
                    {
                        title: "Yishun", // name of the location
                        address: "701A Yishun Avenue 5 , Singapore", // address details
                        lat: "1.429952", // latitude of the location marker
                        long: "103.827832" // longitute of the location marker
                    },
                    {
                        title: "Far East Plaza", // name of the location
                        address: "14 Scotts  Road, Singapore", // address details
                        lat: "1.307249", // latitude of the location marker
                        long: "103.833358" // longitute of the location marker
                    },
                    {
                        title: "Serangoon Central", // name of the location
                        address: "261 Serangoon Central Drive, Singapore", // address details
                        lat: "1.354133", // latitude of the location marker
                        long: "103.872449" // longitute of the location marker
                    },
                    {
                        title: "Potong Pasir Community Club", // name of the location
                        address: "6 Potong Pasir Aveune 2, Singapore", // address details
                        lat: "1.332691", // latitude of the location marker
                        long: "103.867251" // longitute of the location marker
                    },
                    {
                        title: "Yung Ho", // name of the location
                        address: "18 Yung Ho Road, Singapore", // address details
                        lat: "1.326291", // latitude of the location marker
                        long: "103.723988" // longitute of the location marker
                    },
                    {
                        title: "Woodlands", // name of the location
                        address: "5A Woodlands Central, Singapore", // address details
                        lat: "1.439874", // latitude of the location marker
                        long: "103.769856" // longitute of the location marker
                    },
                    {
                        title: "Woodlands 888 ", // name of the location
                        address: "888 Woodlands Drive 50 , Singapore", // address details
                        lat: "1.437703", // latitude of the location marker
                        long: "103.79527" // longitute of the location marker
                    },
                    {
                        title: "Keypoint", // name of the location
                        address: "371 Beach Road, Singapore", // address details
                        lat: "1.302638", // latitude of the location marker
                        long: "103.86222" // longitute of the location marker
                    },
                    {
                        title: "Chinatown Point", // name of the location
                        address: "133 New Bridge Road, Singapore", // address details
                        lat: "1.285202", // latitude of the location marker
                        long: "103.84494" // longitute of the location marker
                    },
                    {
                        title: "Guthrie House", // name of the location
                        address: "1 Fifth Avenue, Singapore", // address details
                        lat: "1.330685", // latitude of the location marker
                        long: "103.795675" // longitute of the location marker
                    },
                    {
                        title: "Greenridge Shopping Centre", // name of the location
                        address: "524A Jelapang Road, Singapore", // address details
                        lat: "1.384839", // latitude of the location marker
                        long: "103.766361" // longitute of the location marker
                    },
                    {
                        title: "HomeTeamNS @ Bukit Batok", // name of the location
                        address: "2 Bukit Batok West Ave 7, Singapore", // address details
                        lat: "1.365784", // latitude of the location marker
                        long: "103.748504" // longitute of the location marker
                    },
                    {
                        title: "Jurong East SRC", // name of the location
                        address: "21 Jurong East Street 31, Singapore", // address details
                        lat: "1.346852", // latitude of the location marker
                        long: "103.729195" // longitute of the location marker
                    },
                    {
                        title: "Bukit Timah Plaza", // name of the location
                        address: "1 Jalan Anak Bukit , Singapore", // address details
                        lat: "1.339001", // latitude of the location marker
                        long: "103.778958" // longitute of the location marker
                    },
                    {
                        title: "Jalan Bukit Merah", // name of the location
                        address: "7 Jalan Bukit Merah, Singapore", // address details
                        lat: "1.287468", // latitude of the location marker
                        long: "103.807959" // longitute of the location marker
                    },
                    {
                        title: "Keat Hong", // name of the location
                        address: "253 Choa Chu Kang Ave 1, Singapore", // address details
                        lat: "1.377542", // latitude of the location marker
                        long: "103.744413" // longitute of the location marker
                    },
                    
                    {
                        title: "Jalan Mas Puteh", // name of the location
                        address: "35 Jalan Mas Puteh, Singapore", // address details
                        lat: "1.308416", // latitude of the location marker
                        long: "103.762366" // longitute of the location marker
                    }


                ],
                zoom: 6, // map zoom level (0 - zoom out to show all addresses (default if user's current location not available), numeric value to determine km to zoom in according to user's current location)
                mapType: 'TERRAIN', // ROADMAP, SATELLITE, HYBRID, TERRAIN
                customLocImg: 'http://korzh.dengo-systems.com/banner/img/kfc_icon.png', // custom location pointer image
            }
        });
    };