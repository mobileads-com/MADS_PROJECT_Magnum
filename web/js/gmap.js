var mapApp = new mads();
function directionClick (url) {
    mapApp.linkOpener(url);
    
    return false;
} 

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
        
        this.infoWindow = new google.maps.InfoWindow();

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
            
            /* Render Map */
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
            
        } else {
            console.log('Error: Your browser doesn\'t support geolocation.');
        }
    };

    /*
    * This method creates one marker
    * */
    GMap.prototype.createMarker = function(show, currentUserLatLon, markerLatLon, title, address, icon, map) {
        var marker;
        var _this = this;

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
                        '<a target="_blank" onclick="directionClick(\'' + link + '\')">' +
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
                        '<a target="_blank" onclick="directionClick(\'' + link + '\')">' +
                        '<div class="directions-icon"></div>' +
                        '<p class="directions-button">Directions</p>' +
                        '</a>' +
                        '</div>' +
                        '<div class="clear"></div>' +
                        '</div>';
                }

                // initializing popup
                _this.infoWindow.setContent(popupTemplate);
                _this.infoWindow.setPosition(markerLatLon);
                _this.infoWindow.open(map);
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
                 addresses: [
{"title":"GEMILANG PETROMART","address":"KAWASAN REHAT & RAWAT GELANG PATAH KM 4.6, ARAH SINGAPURA(SELATAN), LEBUHRAYA LINK KEDUA, GELANG PATAH, 81550 JOHOR BAHRU JOHOR","lat":"1.387492","long":"103.592767"},
{"title":"SUTRA BAKTI NIAGA","address":"LOT.PTD.71041 JLN SRI PELANGI TMN.PELANGI 012-7371480 80400 JOHOR BAHRU JOHOR","lat":"1.482685","long":"103.771902"},
{"title":"IBZI HOLDING SB","address":"STESEN MINYAK SHELL LOT 2128, JALAN YAHYA ALDATAR, (JALAN LINGKARAN DALAM) 80300 JOHOR BAHRU JOHOR","lat":"1.471301","long":"103.765538"},
{"title":"MENTARI RIA RESOURCES","address":"KM 396.3 HENTIAN SEBELAH TG.MALIM (ARAH UTARA) LEBUHRAYA U.SELATAN 35900 BATANG PADANG PERAK","lat":"3.677206","long":"101.499708"},
{"title":"DINAR FILLING STATION","address":"LOT PTD 8923 JLN KERIS TMN SRI TEBRAU JOHOR BAHRU 07-3314497/3314495 80050 JOHOR BAHRU JOHOR","lat":"1.497009","long":"103.700374"},
{"title":"AKKI NIAGA","address":"KM 1295 WEST BOUND LEBUH RAYA PANTAI FASA 1 28000 TEMERLOH PAHANG DARUL MAKMUR","lat":"3.511492","long":"102.439193"},
{"title":"SENG MOTORS SB","address":"61 JLN WONG AH FOOK 07-2247863 80000 JOHOR BAHRU JOHOR","lat":"1.464658","long":"103.761664"},
{"title":"OIL EHSAN STATION SDN BHD","address":"OWN BY:IRNIZA SULAIMAN KM 28.7 BERHAMPIRAN PLAZA TOLL JLN DUTA ARAH SG BULUH GST REG NO:001079279616 DAMANSARA KUALA LUMPUR","lat":"3.174996","long":"101.65406"},
{"title":"TEGUH PETROMART","address":"LOT 6322 KAW.R/R MACHAP(ARAS SELATAN) KM 75.6 SIMPANG RENGAM 07-7581130/012-7132002 86200 JOHOR BAHRU JOHOR","lat":"1.895322","long":"103.229007"},
{"title":"MADOS CITOH DAIKEN SB","address":"37 J.PASIR PELANGI 3310387/0127170787 JOHOR BAHRU JOHOR","lat":"1.490474","long":"103.786021"},
{"title":"DESADAMAI","address":"796, JALAN SULTAN MAHMUD,KUALA TERENGGANU,TRG 20200 K TRENGGANU TERENGGANU","lat":"5.309762","long":"103.157412"},
{"title":"DESA SUTRA NIAGA","address":"KM 129.5 (KTN BOUND) LEBUH RAYA TIMUR FASA 1 28400 TEMERLOH PAHANG DARUL MAKMUR","lat":"3.512224","long":"102.442049"},
{"title":"SM SERVICE STATION SDN BHD","address":"No. 1, JLN PJU 6A KG KAYU ARA VISTA DAMANSARA . 47400 DAMANSARA SELANGOR","lat":"3.13261","long":"101.61161"},
{"title":"AMILIA TRADE","address":"KAW R&R SBN (ARAH SELATAN), LEBUHRAYA KL SBAN, TEL: 06-7911208 70700 SEREMBAN NEGERI SEMBILAN","lat":"2.76405","long":"101.830432"},
{"title":"ERA EXCELLENT SERVICE STATION","address":"PTD.209631, HSM 5110 MKM PLENTONG-J TEBRAU PANDAN 014-3173211 81100 JOHOR BAHRU JOHOR","lat":"1.525211","long":"103.772671"},
{"title":"R & Z AKTIVITI ENTERPRISE","address":"STESYEN MINYAK SHELL KAWASAN R&R TAPAH LEBUHRAYA UTARA SELATAN (PLUS) 35000 BATANG PADANG PERAK","lat":"4.179716","long":"101.290595"},
{"title":"RCS PETROMART RESOURCES","address":"LOT 2140,MUKIM 02,SAMAGAGAH, LEBUHRAYA UTARA SELATAN ARAH UTARA, PERMATANG PAUH (CASH/RG) 13500 PULAU PINANG PULAU PINANG","lat":"5.418383","long":"100.409781"},
{"title":"STESEN MINYAK PRESINT LAPAN","address":"LOT PT 1809 PRESINT 8 PUTRAJAYA PUTRAJAYA SELANGOR","lat":"2.932764","long":"101.679297"},
{"title":"TERUS BERKAT ENTERPRISE","address":"KAWASAN REHAT SBAN (ARAH UTARA) KM271 LEBUHRAYA UTARA- SELATAN,71800SBAN,NS SEREMBAN NEGERI SEMBILAN","lat":"2.756947","long":"101.845537"},
{"title":"ISFA FILLING STATION","address":"KM141.8 LEBUHRAYA UTARA SELATAN HENTIAN JURU SELATAN (1M/RA&H) 4000 PULAU PINANG PULAU PINANG","lat":"5.352517","long":"100.421313"},
{"title":"MEGAH INDAH ENTERPRISE","address":"C/O JOHARI BIN ABU BAKAR PERSIARAN BDR UTAMA BANDAR UTAMA GST REG NO:0020070768641 47400 DAMANSARA SELANGOR","lat":"3.143748","long":"101.616074"},
{"title":"STESEN MINYAK DESA RELAU","address":"1007-D,MK,13,JLN RELAU,BAYAN LEPAS (1M/RC&F) 11900 PULAU PINANG PULAU PINANG","lat":"5.337175","long":"100.274435"},
{"title":"SINAR BESERI","address":"KAWASAN REHAT&RAWAT TAPAH LEBUHRAYA UTARA-SELATAN TAPAH,PERAK PETI SURAT NO 32 35000 BATANG PADANG PERAK","lat":"6.267439","long":"100.415743"},
{"title":"KOPERASI PEKERJA-PEKERJA SH MSIA BHD","address":"LOT PT 33659 & 33788 KM 15.8, (ARAH UTARA LR UTARA SELATAN PJU 1A 47301 PETALING JAYA SELANGOR","lat":"3.122856","long":"101.593615"},
{"title":"PETROSTATE ANM ENTERPRISE","address":"LOT 297 JLN KOTA TINGGI TMN JOHOR JAYA 3551070 81100 JOHOR BAHRU JOHOR","lat":"1.54346","long":"103.792251"},
{"title":"SMILE ONE ENTERPRISE","address":"LOT 1276 JLN BESAR KAMPUNG CACAR 23100 PAKA TERENGGANU 23100 DUNGUN TERENGGANU","lat":"4.625735","long":"103.440332"},
{"title":"IBUJAYA BERSATU","address":"03-8737911 LOT PT 24566 SG RAMAL KAJANG KAJANG SELANGOR","lat":"2.97962","long":"101.757889"},
{"title":"ALAF SEJATI STATION","address":"8,JLN 2/109F TMN DANAU DESA JLN KLANG LAMA A/C -723832 58100 JALAN KLANG LAMA KUALA LUMPUR","lat":"3.100621","long":"101.686007"},
{"title":"ALAF SINARAN ENTERPRISE","address":"TEL:03-89481859 KL SEREMBAN HIGHWAY PETALING JAYA PETALING JAYA SELANGOR","lat":"3.035212","long":"101.706386"},
{"title":"DE SUTERA","address":"LOT.147015 B.BARU PERMAS JAYA 3867110 (GST NO : 000368820224) JOHOR BAHRU JOHOR","lat":"1.492169","long":"103.804174"},
{"title":"JARI SYNERGY ENTERPRISE","address":"ABDUL GHOPA BIN TALIP LOT PT 25198P`SIARAN PERDANA SD7 BANDAR SRI DAMANSARA GST REG NO:001367752704 52200 DAMANSARA SELANGOR","lat":"3.189427","long":"101.616156"},
{"title":"STESYEN MINYAK NUSANTARA","address":"KM80.41, KWS REHAT&RAWAT LEBUHRAYA UTARA SELATAN,08300 GURUN KUALA MUDA KEDAH","lat":"5.830017","long":"100.489229"},
{"title":"ALAB STATION","address":"KM 146,LEBUHRAYA UTARA-SELATAN PAGOH,MUAR 84600 MUAR JOHOR","lat":"2.14829","long":"102.698448"},
{"title":"MAGZON TRADING","address":"2 PERSIARAN SETIA PRIMA SETIA ALAM SEKSYEN U13 SHAH ALA 40170 KLANG SELANGOR","lat":"3.098387","long":"101.462416"},
{"title":"SMART ENERGY SERVICES SDN BHD","address":"25 JLN AMPUAN (LOT LAMA 3299) BATU PAHAT 07-4384888 83000 JOHOR BAHRU JOHOR","lat":"1.840857","long":"102.931212"},
{"title":"ASM RETAIL SDN BHD","address":"TEL:03-91717313 NO 2,JLN 10/146 BDR TSK SELATAN KUALA LUMPUR CHERAS KUALA LUMPUR","lat":"3.073327","long":"101.710405"},
{"title":"ARIF MAKMUR ENTERPRISE","address":"STESEN MINYAK SHELL LOT 29016 JALAN SEMAMBU . 25350 KUANTAN PAHANG DARUL MAKMUR","lat":"3.84371","long":"103.339137"},
{"title":"MILYAR MUTIARA ENTERPRISE","address":"LOT PT 241,JELUTONG EXPRESSWAY, GEORGETOWN D.T.L (1M/RG) 11600 PULAU PINANG PULAU PINANG","lat":"5.394494","long":"100.323171"},
{"title":"WAJA RETAIL SERVICES","address":"2 JLN PERSIARAN SURIAN PJU 3, SUNWAY DAMANSARA 47410 DAMANSARA SELANGOR","lat":"3.149968","long":"101.600514"},
{"title":"M.J.K.S. ENTERPRISE","address":"LOT 29857,USJ 9/3 JLN BAKTI, SUBANG JAYA. GST REG NO:000524435456 47600 SUBANG JAYA SELANGOR","lat":"3.042938","long":"101.583134"},
{"title":"GREEN ISLAND SERVICE STATION","address":"4-A,JALAN MASJID NEGERI,PENANG (CASH/RG) 11600 PULAU PINANG PULAU PINANG","lat":"5.385361","long":"100.304876"},
{"title":"ALAF SALAK TINGGI","address":"KM 28-3 ARAH UTARA SELATAN EXPRESS WAY LINGKARAN TENGAH 43900 SEPANG SELANGOR","lat":"2.901779","long":"101.615868"},
{"title":"FAMYSYA ENTERPRISE","address":"1A, JALAN YAHYA AWAL,  80100 JOHOR BAHRU JOHOR","lat":"1.464065","long":"103.754634"},
{"title":"STESYEN MINYAK SHELL TAMAN UNIVERSITY SDN BHD","address":"JALAN SS 3/29 SG. WAY, SUBANG TEL:03-78763963 47300 SUBANG JAYA SELANGOR","lat":"3.094693","long":"101.611158"},
{"title":"DZIYALITE RECOURCES","address":"OWN BY:SURIATY BT ABD RAHMAN KAWASAN REHAT RAWAT KINRARA KM 46.60 ARAH KL KESAS HIGHWAY GST REG NO:0010957000480 58200 SERI PETAILING KUALA LUMPUR","lat":"3.066969","long":"101.653535"},
{"title":"TIRAM MUTIARA","address":"OWN BY:ROSNITA BT MISRON HENTIAN SEBELAH HICOM ARAH TIMUR (ARAH K.L.) KM 34.5,LEBURAYA KESAS GST REG NO:000689979392 47600 SUBANG JAYA SELANGOR","lat":"3.049701","long":"101.562388"},
{"title":"RIDZUAN BIN AHMAD","address":"RA TALANG ENTERPRISE (SHELL AIR KEROH) PT 3251 LEBOH AIR KEROH BANDAR AIR KEROH,MELAKA 75450 ALOR GAJAH [DAERAH] MELAKA","lat":"2.249066","long":"102.291793"},
{"title":"JASRI BIN RASMIN","address":"313 FELDA AIR TAWAR 5 KOTA TINGGI 07-8953027 (GST NO : 001302102016) 81900 JOHOR BAHRU JOHOR","lat":"1.606164","long":"104.089658"},
{"title":"TELIBONG FILLING STATION","address":"LOT NO. 5, BNT 5746 & 7355, KM35 JALAN TAMPARULI, KG. TELIBONG KOTA KINABALU SABAH","lat":"6.143835","long":"116.254953"},
{"title":"FUZI PETROL STATION","address":"LOT 1994, MK 02, SAMA GAGAH LEBUHRAYA PLUS ARAH SELATAN PERMATANG PAUH (1M/RG) 13500 SEBERANG PRAI SELATAN PULAU PINANG","lat":"5.422593","long":"100.413943"},
{"title":"TEZZ ENTERPRISE","address":"LOT 148 SEKSYEN 87 JLN TUN RAZAK KUALA LUMPUR TEL:012-3500902 50400 CITY CENTRE KUALA LUMPUR","lat":"3.172069","long":"101.708038"},
{"title":"LIA EDON ENTERPRISE","address":"LOT 32104, KMS 1.0 SHAH ALAM, LDP GST REG NO:002063654912 47100 PUCHONG SELANGOR","lat":"3.022049","long":"101.581708"},
{"title":"ZH JAYA ENTERPRISE","address":"TEL:012-2836664 STESEN MINYAK SKVE TMN SURIA TROPIKA, SERI KEMBANGAN 43300 SERI KEMBANGA SELANGOR","lat":"2.973734","long":"101.678468"},
{"title":"STESEN MINYAK TUJUAN JAYA","address":"SS 18 PERSIARAN TUJUAN SUBANG JAYA PETALING JAYA. 03-56312207 GST REG NO:001916354560 47500 PETALING JAYA SELANGOR","lat":"3.07152","long":"101.579938"},
{"title":"WNY RESOURCES","address":"LT 2677,KM 62, MUKIM TANJONG DUA BELAS,42700 OLAK LEMPIT SELNAGOR 42700 BANTING SELANGOR","lat":"2.834806","long":"101.59784"},
{"title":"MUZLINA TRADING","address":"SHELL LOT 33408/9 KUANTAN BYPASS PERMATANG BADAK 25150 KUANTAN PAHANG DARUL MAKMUR","lat":"3.794884","long":"103.251602"},
{"title":"RISE SA PRIMA","address":"STESEN MINYAK SHELL LOT 37167 JALAN BK 5 BANDAR KINRARA 47100 PUCHONG SELANGOR","lat":"3.037878","long":"101.642812"},
{"title":"ADAMONA ENTERPRISE","address":"KM.47.2 ARAH BARAT KAWASAN & RAWAT AWAN BESAR. LEBUHRAYA SHAH ALAM GST REG NO:001911324672 58200 SHAH ALAM SELANGOR","lat":"3.065296","long":"101.660874"},
{"title":"WRENTHAM AVENUE KIOSK","address":"HENTIAN SEBELAH HICOM (ARAH BARAT) KM 34.5 LRAYA KESAS TEL : 012-2755505 47600 SUBANG JAYA SELANGOR","lat":"3.048717","long":"101.562349"},
{"title":"MIKA ENTERPRISE","address":"LOT 343, JLN BKT CHANGGANG, B. B. SALAK TINGGI, SEPANG SELANGOR 43900 SEPANG SELANGOR","lat":"2.805428","long":"101.724138"},
{"title":"SENTRAL REKO AUTOGAS","address":"03-87336858 SEC 5,JLN RECO BDR BARU BANGI KAJANG SELANGOR","lat":"2.964333","long":"101.790646"},
{"title":"ILHAM ENTERPRISE","address":"SHELL FILLING STATION,KM 15,JLN KELANTAN TEPOH, KUALA TERENGGANU 21200 K TRENGGANU TERENGGANU","lat":"5.352495","long":"103.071399"},
{"title":"MUTIARA RIA PETROMART","address":"OWN BY:NORIYATI BINTI MOHAMAD YUNOS LOT. 23303 JLN CEMPAKA SD 12/1 OFF JLN PERDANA BDR SRI DAMANSARA GST REG NO:000318758912 52200 DAMANSARA SELANGOR","lat":"3.194239","long":"101.60717"},
{"title":"A M DYNAMIC SERVICE STATION","address":"C/O SHELL - A M DYNAMIC SERVICE STATION NO. 1 & 3,P`SIARAN PUTRA INDAH PUTRA BAHAGIA 8 GST REG NO:000687931392 47650 SUBANG JAYA SELANGOR","lat":"2.996958","long":"101.571294"},
{"title":"HAMRAB ENTERPRISE","address":"LOT 539 MUKIM MERANG 21010 SETIU TERENGGANU 21010 SETIU TERENGGANU","lat":"5.531873","long":"102.952387"},
{"title":"SENTRAL TIRAM PERMAI ENTERPRISE","address":"LOT PT 64, KM 13.1 ARAH UTARA, L.R. LDP KELANA JAYA GST REG NO:002015076352 47300 KELANA JAYA SELANGOR","lat":"3.102795","long":"101.596836"},
{"title":"AQUA SPLITZ SDN BHD (23/6/2011)","address":"LOT 1458, JALAN PERMATANG DUYUNG DUYUNG MELAKA. 75460 BANDAR MELAKA [DAERAH] MELAKA","lat":"2.203601","long":"102.304779"},
{"title":"PELANTAR TIMUR ENTERPRISE","address":"LOT 2781, PUTERA JAYA, PERMAISURI, TERENGGANU. 22100 SETIU TERENGGANU","lat":"5.44554","long":"102.831786"},
{"title":"UNITED SERVICE STATION SB","address":"NO.409,3 1/2 MILES, JALAN TEBRAU,  80250 JOHOR BAHRU JOHOR","lat":"1.501497","long":"103.764642"},
{"title":"MERDEKA JAYABUMI ENTERPRISE","address":"KM.29, TOLL JLN DUTA(ARAH KL)PLUS MUKIM BATU KUALA LUMPUR GST REG NO:001826037760 52100 CITY CENTRE KUALA LUMPUR","lat":"3.176637","long":"101.657331"},
{"title":"RS SEJATI PETROL STATION","address":"LOT PT 13591, TAMAN SEJATI INDAH, MUKIM SUNGAI PASIR, 08000 SG PETANI, KUALA MUDA KEDAH","lat":"5.606751","long":"100.483178"},
{"title":"PERNIAGAAN PROJEK CERGAS","address":"TEL:03-89480214 STSN MINYAK SHELL LOT PT 7906 JLN BALAKONG SERI KEMBANGA SELANGOR","lat":"3.027011","long":"101.723934"},
{"title":"LIM ENG HOOI TWO","address":"2676, JALAN SONG BAN KHENG BUKIT MERTAJAM (1B/RG) 14000 PULAU PINANG PULAU PINANG","lat":"5.350474","long":"100.459718"},
{"title":"Syarikat Hock Hin","address":"Kws Hentian Sebelah Kulai (arah Utara) Lehuhraya Utara Selatan. Kulai 81000 KULAI JOHOR","lat":"1.656846","long":"103.508025"},
{"title":"SHUZLAN VENTURE","address":"LOT PT2536 LBEUHRAYA TENGAH 2 MUKIM AMPANG 55000 AMPANG KUALA LUMPUR","lat":"3.151693","long":"101.745426"},
{"title":"DINAR FILLING STATION","address":"(STESEN MINYAK SHELL) BATU 6 1/4, JALAN SKUDAI, 81200 SKUDAI JOHOR","lat":"1.497009","long":"103.700374"},
{"title":"KOPERASI PEKERJA-PEKERJA SH MSIA BHD","address":"SHELL MALAYSIA BERHAD 3450, JLN TEKNOKRAT 3, GST REG NO:001730052096 63000 SEPANG SELANGOR","lat":"3.122856","long":"101.593615"},
{"title":"HALINI MAJU ENTERPRISE","address":"STESEN MINYAK SHELL LOT 590 & 591, JALAN PERSISIRAN PERLING TAMAN PERLING MUKIM PULAI 81200 JOHOR BAHRU JOHOR","lat":"1.496685","long":"103.682908"},
{"title":"SENTRAL ZZA FILLING STATION","address":"LOT 18769 BATU 23 JALAN SG BAKAU RAWANG GST REG NO:001616666624 48000 RAWANG SELANGOR","lat":"3.319769","long":"101.527629"},
{"title":"PETRO ENTERPRISE","address":"18, JALAN BESI SATU, TAMAN SRI PUTRI,  81300 SKUDAI JOHOR","lat":"1.544275","long":"103.657453"},
{"title":"LEONG HENG (SHELL) SERVICE STATION","address":"03-90805318 LOT 261515 BDR SG LONG BT 11 1/4 CHERAS KAJANG SELANGOR","lat":"3.041877","long":"101.789291"},
{"title":"DYNAMIC SYAZSANI ENTERPRISE","address":"STESEN SHELL LOT HSD 30603 JLN PERSISIRAN PERLING TMN PERLING JOHOR BAHRU 81200 JOHOR BAHRU JOHOR","lat":"1.479031","long":"103.682395"},
{"title":"TIRAM NOOR JAHAN ENTERPRISE","address":"LOT 1 , SEC 19 JLN NELAYAN 19/C SHAH ALAM SELANGOR GST REG NO:001650425856 40000 SHAH ALAM SELANGOR","lat":"3.050732","long":"101.534967"},
{"title":"HASAJAYA","address":"LOT 8339,JLN GELENG -GANG D?HEIGHTS A/C -723416 . 50490 DAMANSARA KUALA LUMPUR","lat":"3.152121","long":"101.663307"},
{"title":"STESYEN MINYAK CHANG YOONG SENG SDN BHD","address":"03-90191554 LOT21146 JLN SG LONG BDR SG LONG KAJANG SELANGOR","lat":"3.04009","long":"101.795314"},
{"title":"STESEN MYK SHELL JLN SULAMAN","address":"CL 015569285 JALAN SULAMAN LIKAS  88450 KOTA KINABALU SABAH","lat":"6.018044","long":"116.114999"},
{"title":"KOPERASI PENGGUNA PAHANG BHD","address":"JALAN BESAR . . . 25100 KUANTAN PAHANG DARUL MAKMUR","lat":"3.802307","long":"103.325351"},
{"title":"ZKZ PROPERTY SDN BHD","address":"LOT 3237,JALAN SULTAN TENGAH PETRA JAYA 93050 KUCHING SARAWAK","lat":"1.609498","long":"110.341252"},
{"title":"E SAF ENTERPRISE","address":"LOT PT 13106 HS (D) PUTRA POINT PHASE 2B PUTRA NILAI MUKIM LABU BB NILAI N.S 71800 NILAI NEGERI SEMBILAN","lat":"2.823818","long":"101.794541"},
{"title":"PELITA DAUR SDN BHD","address":"1 PERSIARAN WARISAN MAJU BB BANDAR BARU SALAK TINGGI SEPANG SELANGOR 43900 SEPANG SELANGOR","lat":"2.816832","long":"101.693678"},
{"title":"DOLI ENTERPRISE","address":"KM 18 , JALAN GAMBANG , KUANTAN . 26070 KUANTAN PAHANG DARUL MAKMUR","lat":"3.745039","long":"103.188454"},
{"title":"LEELY FILLING STATION","address":"LOT PTD 119600, JALAN MUTIARA EMAS UTAMA, TAMAN AUSTIN PERDANA, 81100 JOHOR BAHRU JOHOR","lat":"1.546953","long":"103.787633"},
{"title":"STESEN MINYAK ALISHA","address":"LOT 239246 FEDERAL HIGHWAY SUBANG GST REG. NO. : 002094039040 47500 PETALING JAYA SELANGOR","lat":"3.081152","long":"101.572554"},
{"title":"SEA PARK PETROL & SVC STN SDN BHD","address":"21,JLN 21/1 P.J A/C- 723594 . 46300 PETALING JAYA SELANGOR","lat":"3.109807","long":"101.623181"},
{"title":"DYNAMIC POWER ENTERPRISE","address":"OWN BY:AHMAD B KAMALLUDIN LOTPT5517,L`RAYA PHUNG SG BESI MUKIM PTLING K`LUMPUR GST REG NO:001339244544 SUNGAI BESI KUALA LUMPUR","lat":"3.048739","long":"101.680044"},    
{"title":"SHELL GIMYQ ENTERPRISE","address":"KM15 LEBUH RAYA LINGKARAN TENGAH O MEDAN DAMAI UKAY TEL:03-42569375 68000","lat":"3.190864","long":"101.762258"},
{"title":"TIRAM WAWASAN ENTERPRISE","address":"LOT 14986 PT13398, SGI BESI,LBHRAYA KL-SEREMBAN CHERAS KUALA LUMPUR","lat":"3.049211","long":"101.705537"},
{"title":"JUFIYUN ENTERPRISE","address":"LOT 14257, JLN 4, BANDAR KINRARA, GST REG. NO. : 000098181120 47100 PUCHONG SELANGOR","lat":"3.049583","long":"101.640463"},
{"title":"LIA AVENUE STATION","address":"LOT 46994, JALAN KEBUDAYAAN, TAMAN UNIVERSITI, 81300 SKUDAI JOHOR","lat":"1.539386","long":"103.627523"},
{"title":"NOORHAYATI BINTI KAMALUDIN","address":"STESEN MINYAK SHELL LOT 2789 MK BALAI PANJANG MELAKA 75250 BANDAR MELAKA [DAERAH] MELAKA","lat":"2.224346","long":"102.231453"}
],
                zoom: 6, // map zoom level (0 - zoom out to show all addresses (default if user's current location not available), numeric value to determine km to zoom in according to user's current location)
                customLocImg: 'https://rmarepo.richmediaads.com/2754/magnum/img/magnum-logo-02.jpg', // custom location pointer image
            }
        });
    };