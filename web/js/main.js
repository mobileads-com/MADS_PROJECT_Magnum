/*
 *
 * mads - version 2  
 * Copyright (c) 2015, Ninjoe
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * https://en.wikipedia.org/wiki/MIT_License
 * https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html
 *
 */
var mads = function() {
    /* Get Tracker */
    if (typeof custTracker == 'undefined' && typeof rma != 'undefined') {
        this.custTracker = rma.customize.custTracker;
    } else if (typeof custTracker != 'undefined') {
        this.custTracker = custTracker;
    } else {
        this.custTracker = [];
    }

    /* Unique ID on each initialise */
    this.id = this.uniqId();

    /* Tracked tracker */
    this.tracked = [];

    /* Body Tag */
    this.bodyTag = document.getElementsByTagName('body')[0];

    /* Head Tag */
    this.headTag = document.getElementsByTagName('head')[0];

    /* RMA Widget - Content Area */
    this.contentTag = document.getElementById('rma-widget');

    /* URL Path */
    this.path = typeof rma != 'undefined' ? rma.customize.src : '';
};

/* Generate unique ID */
mads.prototype.uniqId = function() {
    return new Date().getTime();
}

/* Link Opner */
mads.prototype.linkOpener = function(url) {

    if (typeof url != "undefined" && url != "") {
        if (typeof mraid !== 'undefined') {
            mraid.open(url);
        } else {
            window.open(url);
        }
    }
}

/* tracker */
mads.prototype.tracker = function(type, name) { console.log(type);

    /* 
     * name is used to make sure that particular tracker is tracked for only once 
     * there might have the same type in different location, so it will need the name to differentiate them
     */
    name = name || type;

    if (typeof this.custTracker != 'undefined' && this.custTracker != '' && this.tracked.indexOf(name) == -1) {
        for (var i = 0; i < this.custTracker.length; i++) {
            var img = document.createElement('img');
            img.src = this.custTracker[i] + type + '&' + this.id;
            img.style.display = 'none';
            this.bodyTag.appendChild(img);

            this.tracked.push(name);
        }
    }
};

/* Load JS File */
mads.prototype.loadJs = function(js, callback) {
    var script = document.createElement('script');
    script.src = js;

    if (typeof callback != 'undefined') {
        script.onload = callback;
    }

    this.headTag.appendChild(script);
}

/* Load CSS File */
mads.prototype.loadCss = function(href) {
    var link = document.createElement('link');
    link.href = href;
    link.setAttribute('type', 'text/css');
    link.setAttribute('rel', 'stylesheet');

    this.headTag.appendChild(link);
}

/*
 *
 * Unit Testing for mads 
 *
 */
var testunit = function() {
    var app = new mads();



    app.loadCss(app.path + 'css/style.css');

    var contentHtml = function() {
        app.contentTag.innerHTML = '<div class="firstBg"></div> \
        <div class="secondBg"></div> \
        <div class="confeti2"></div> \
        <div class="logo"> \
            <img src="' + app.path + 'img/logo.png" alt="q"> \
        </div> \
        <div class="punctir2"> \
       <img id="robot" style=" position: absolute; z-index: 0; pointer-events: none; top: 16px; left: 6px; width: 91px;" src="' + app.path + 'img/icecream.png" /> \
        <img id="redux" style="width: 98px; height: 271px; position: absolute; z-index: 1;" src="' + app.path + 'img/ice.png" /> \
        </div> \
        <div class="textOnPunctir"> \
            <img src="' + app.path + 'img/textWipe.png" alt="hashtag" class="textWipe"> \
            <img src="' + app.path + 'img/finger.png" alt="finger" class="finger"> \
        </div> \
        <div class="hashtag"> \
            <img src="' + app.path + 'img/hashtag.png" alt="hashtag"> \
        </div> \
        <div class="bubble"> \
            <div class="b1"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b2"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b3"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b4"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b5"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b6"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b7"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b8"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b9"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b10"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b11"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b12"><img src="' + app.path + 'img/b.png" alt=""></div> \
            <div class="b13"><img src="' + app.path + 'img/b.png" alt=""></div> \
        </div> \
        <div class="button"> \
          <img class="storeBtn" src="' + app.path + 'img/storeBTN.png" alt="q"> \
          <img class="findBtn" src="' + app.path + 'img/findBTN.png" alt="q"> \
        </div> \
        <div class="newMagnum"> \
            <img src="' + app.path + 'img/newMagnum.png" alt=""> \
        </div> \
        <div class="belgianChocolate"> \
            <img src="' + app.path + 'img/belgianChocolate.png" alt=""> \
        </div> \
        <div class="toogleForMap overlayMap"></div> \
        <div class="toogleForMap popUpMap"> \
        <div id="container1"></div> \
        <span class="cancelModal"> \
            <img class="" src="' + app.path + 'img/CloseBTN.png" alt="q"> \
        </span> \
        </div> '
        ;
    };
    var animation = function() {
        var wipeLoad = function() {
            var animationWithCont = function() {
                var tl = TweenMax;
                tl.to(".finger", 0.5, {
                    delay: 0.3,
                    left: "30%"
                });
                tl.to(".finger", 0.5, {
                    delay: 0.7,
                    left: "70%"
                });
                tl.to(".finger", 0.5, {
                    delay: 1.2,
                    left: "30%"
                });
                tl.to(".finger", 0.5, {
                    delay: 1.7,
                    left: "70%"
                });
                tl.to(".finger", 0.5, {
                    delay: 2.2,
                    left: "50%"
                });
                var w = function opac() {
                    tl.to(".textOnPunctir", 0.5, {
                        delay: 0,
                        opacity: "0"
                    });
                    app.tracker('wipe');
                };
                var q = function explosion() {
                    
                    tl.to(".secondBg", 0.5, {
                        delay: 0.3,
                        opacity: "1"
                    });
                    tl.to(".punctir2", 0.5, {
                        delay: 0.3,
                        background: "none"
                    });
                    tl.to(".hashtag", 0.4, {
                        delay: 0.3,
                        opacity: "0"
                    });
                    tl.to(".confeti", 0.4, {
                        delay: 0.7,
                        opacity: "1"
                    });
                    /*bubble*/
                    tl.to(".bubble", 1.8, {
                        delay: 1.9,
                        opacity: "1"
                    });
                    tl.to(".b1", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        y: "-150px",
                        x: "78px",
                        width: "53px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b2", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        zIndex: "3",
                        x: "-14px",
                        y: "-135px",
                        width: "47px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b3", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-45px",
                        y: "-210px",
                        width: "42px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b4", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-40px",
                        y: "-220px",
                        width: "22px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b5", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-15px",
                        y: "-120px",
                        width: "41px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b6", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-40px",
                        y: "-255px",
                        width: "26px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b7", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-40px",
                        y: "-75px",
                        width: "26px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b8", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-20px",
                        y: "-200px",
                        width: "52px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b9", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-80px",
                        y: "-140px",
                        width: "34px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b10", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "35px",
                        y: "-160px",
                        width: "27px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b11", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "25px",
                        y: "-195px",
                        width: "23px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b12", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "-10px",
                        y: "-250px",
                        width: "19px",
                        ease: Power0.easeNone
                    });
                    tl.to(".b13", 7.0, {
                        delay: 0.5,
                        opacity: "1",
                        x: "14px",
                        y: "-230px",
                        width: "13px",
                        ease: Power0.easeNone
                    });
                    tl.to(".confeti2", 3.9, {
                        delay: 0.7,
                        opacity: "1"
                    });
                    tl.to(".button", 3.5, {
                        delay: 1.5,
                        opacity: "1"
                    });
                    // tl.to(".findBtn", 0.5, {delay:1.5, width:"144px", marginTop:"-4px", marginLeft:"-73px",  height:"47px"});
                    tl.to(".findBtn", 0.3, {
                        delay: 2.0,
                        width: "134px",
                        marginTop: "0px",
                        marginLeft: "5px",
                        height: "37px"
                    });
                    tl.to(".logo", 1, {
                        delay: 0.5,
                        top: "20px",
                        width: "100px",
                        marginLeft: "-50px"
                    });
                    tl.to(".newMagnum, .belgianChocolate", 1.3, {
                        delay: 1.7,
                        opacity: "1"
                    });

                    function clickVes() {
                        /* @NOTE disable click ad to landing page */
                        /*
                        $("#rma-widget").attr("class", "sssq");
                        $(".sssq").css("cursor", "pointer")
                        $(".sssq").click(function() {
                            app.linkOpener('https://www.facebook.com/MagnumMalaysia');
                            app.tracker("site")
                        })
                        */
                        /* @NOTE find btn */
                        $('.findBtn').on('click', function (e) {
                            app.linkOpener('https://www.facebook.com/MagnumMalaysia');
                            app.tracker("site")
                        });
                        
                        /* @NOTE store btn */
                        $('.storeBtn').on('click', function (e) {qqqq();
                            $(".popUpMap").css("display","block");
                            $(".overlayMap").css("display","block");
                            $('.popUpMap').addClass('cur');   
                        });
                        
                        $(".cancelModal, .overlayMap").click(function() {
                            $(".popUpMap").css("display","none");
                            $(".overlayMap").css("display","none");
                        });
                    }
                    setTimeout(clickVes, 2000);
                }
                $(".punctir2").click(function() {
                    w();
                })
                $(".punctir2").on("touchstart", function() {
                    w();
                })
                $(".punctir2").mousedown(function() {
                    w();
                })

                $("#redux").eraser({
                    completeRatio: .8,
                    completeFunction: function() {
                        $("#redux").css("opacity", "0");
                        w();
                        q();
                    }
                });

            }; /*-----*/
            contentHtml();
            app.loadJs(app.path + 'js/gmap.js');
            app.loadJs(app.path + 'js/wipe.js', animationWithCont);
        };
        app.loadJs(app.path + 'js/tweenmax.js', wipeLoad)
    };


    app.loadJs(app.path + 'js/jquery.js', animation);
    app.loadJs('https://maps.googleapis.com/maps/api/js?v=3.exp&signed_in=true&libraries=geometry&async=2&callback=MapApiLoaded');
    

}

function MapApiLoaded() {
   
}

testunit();