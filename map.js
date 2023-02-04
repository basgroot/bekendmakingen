/*jslint browser: true, for: true, long: true, unordered: true */
/*global window console google */

// Todo houtopstand
// todo oplaadplaats verkeersbesluit
// todo loading indicator
// todo link to source
// todo remember selected municipality in url

// This function is called by Google Maps API, after loading the library. Function name is sent as query parameter.
function initMap() {
    var map;
    var infoWindow;
    var inputData;
    var proxyHost = "https://basement.nl/";
    //var proxyHost = "http://localhost/";
    var markersArray = [];
    var delayedMarkersArray = [];
    var initialZoomLevel = 16;
    var zIndex = 2147483647;  // Some high number
    var activeMunicipality = "Zwolle";
    // Source: https://organisaties.overheid.nl/Gemeenten/
    var municipalities = {
        "Aa en Hunze": {
            "center": {
                "lat": 52.93517488613614,
                "lng": 6.672836150999303
            }
        },
        "Aalsmeer": {
            "center": {
                "lat": 52.263622347543134,
                "lng": 4.759706437128733
            }
        },
        "Aalten": {
            "center": {
                "lat": 51.926752636106386,
                "lng": 6.581209563579848
            }
        },
        "Achtkarspelen": {
            "center": {
                "lat": 53.21665192109842,
                "lng": 6.141344810156155
            }
        },
        "Alblasserdam": {
            "center": {
                "lat": 51.864005231162395,
                "lng": 4.658049948203779
            }
        },
        "Albrandswaard": {
            "center": {
                "lat": 51.85656801212763,
                "lng": 4.40027307440037
            }
        },
        "Alkmaar": {
            "center": {
                "lat": 52.632537715707635,
                "lng": 4.7440344469319635
            }
        },
        "Almelo": {
            "center": {
                "lat": 52.35639583829622,
                "lng": 6.663647177755004
            }
        },
        "Almere": {
            "center": {
                "lat": 52.37512849971353,
                "lng": 5.2153802530510465
            }
        },
        "Alphen aan den Rijn": {
            "center": {
                "lat": 52.1288118907967,
                "lng": 4.662639536147562
            }
        },
        "Alphen-Chaam": {
            "center": {
                "lat": 51.50391203175929,
                "lng": 4.864896987542891
            }
        },
        "Altena": {
            "center": {
                "lat": 51.77181134699592,
                "lng": 4.960465941572691
            }
        },
        "Ameland": {
            "center": {
                "lat": 53.44646072102737,
                "lng": 5.769634930107333
            }
        },
        "Amersfoort": {
            "center": {
                "lat": 52.15636667166561,
                "lng": 5.389703993008095
            }
        },
        "Amstelveen": {
            "center": {
                "lat": 52.302914505252744,
                "lng": 4.860351056914487
            }
        },
        "Amsterdam": {
            "center": {
                "lat": 52.37316382970684,
                "lng": 4.891668068639931
            }
        },
        "Apeldoorn": {
            "center": {
                "lat": 52.212608880286965,
                "lng": 5.961484557679505
            }
        },
        "Arnhem": {
            "center": {
                "lat": 51.9817103009172,
                "lng": 5.907987874509984
            }
        },
        "Assen": {
            "center": {
                "lat": 52.995627196170304,
                "lng": 6.561311667003485
            }
        },
        "Asten": {
            "center": {
                "lat": 51.403636309791054,
                "lng": 5.745750776538715
            }
        },
        "Baarle-Nassau": {
            "center": {
                "lat": 51.44318741009702,
                "lng": 4.93050396614348
            }
        },
        // "Baarn": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Barendrecht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Barneveld": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Beek": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Beekdaelen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Beesel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Berg en Dal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bergeijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bergen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bergen NH": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bergen op Zoom": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Berkelland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bernheze": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Best": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Beuningen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Beverwijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bladel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Blaricum": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bloemendaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bodegraven-Reeuwijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Boekel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Borger-Odoorn": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Borne": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Borsele": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Boxtel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Breda": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bronckhorst": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Brummen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Brunssum": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bunnik": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Bunschoten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Buren": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Capelle aan den IJssel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Castricum": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Coevorden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Cranendonck": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Culemborg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Dalfsen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Dantumadiel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "De Bilt": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "De Fryske Marren": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "De Ronde Venen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "De Wolden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Delft": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Den Haag": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Den Helder": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Deurne": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Deventer": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Diemen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Dijk en Waard": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Dinkelland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Doesburg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Doetinchem": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Dongen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Dordrecht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Drechterland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Drimmelen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Dronten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Druten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Duiven": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Echt-Susteren": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Edam-Volendam": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Ede": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Eemnes": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Eemsdelta": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Eersel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Eijsden-Margraten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Eindhoven": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Elburg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Emmen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        "Enkhuizen": {
            "center": {
                "lat": 52.70377677370959,
                "lng": 5.292977507978052
            }
        },
        // "Enschede": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Epe": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Ermelo": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Etten-Leur": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Geertruidenberg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Geldrop-Mierlo": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Gemert-Bakel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Gennep": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Gilze en Rijen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Goeree-Overflakkee": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Goes": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Goirle": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Gooise Meren": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Gorinchem": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Gouda": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Groningen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Gulpen-Wittem": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Haaksbergen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Haarlem": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Haarlemmermeer": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Halderberge": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hardenberg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Harderwijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hardinxveld-Giessendam": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Harlingen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hattem": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heemskerk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heemstede": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heerde": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heerenveen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heerlen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heeze-Leende": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heiloo": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hellendoorn": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Helmond": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hendrik-Ido-Ambacht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hengelo": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "'s-Hertogenbosch": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Het Hogeland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heumen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Heusden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hillegom": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hilvarenbeek": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hilversum": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hoeksche Waard": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hof van Twente": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hollands Kroon": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hoogeveen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        "Hoorn": {
            "center": {
                "lat": 52.63934466558749,
                "lng": 5.059246352878882
            }
        },
        // "Horst aan de Maas": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Houten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Huizen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Hulst": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "IJsselstein": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Kaag en Braassem": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Kampen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Kapelle": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Katwijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Kerkrade": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Koggenland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Krimpen aan den IJssel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Krimpenerwaard": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Laarbeek": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        "Land van Cuijk": {
            "center": {
                "lat": 51.59628376948155,
                "lng": 6.010974779479997
            }
        },
        // "Landgraaf": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Landsmeer": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Lansingerland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Laren": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Leeuwarden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Leiden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Leiderdorp": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Leidschendam-Voorburg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Lelystad": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Leudal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Leusden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Lingewaard": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Lisse": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Lochem": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Loon op Zand": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Lopik": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Losser": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Maasdriel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Maasgouw": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Maashorst": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Maassluis": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Maastricht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Medemblik": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Meerssen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Meierijstad": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Meppel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Middelburg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Midden-Delfland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Midden-Drenthe": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Midden-Groningen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Moerdijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Molenlanden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Montferland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Montfoort": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Mook en Middelaar": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Neder-Betuwe": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nederweert": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nieuwegein": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nieuwkoop": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nijkerk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nijmegen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nissewaard": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Noardeast-Fryslân": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Noord-Beveland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Noordenveld": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Noordoostpolder": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Noordwijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nuenen, Gerwen en Nederwetten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Nunspeet": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oegstgeest": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oirschot": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oisterwijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oldambt": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oldebroek": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oldenzaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Olst-Wijhe": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Ommen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oost Gelre": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oosterhout": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Ooststellingwerf": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oostzaan": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Opmeer": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Opsterland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oss": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oude IJsselstreek": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Ouder-Amstel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Oudewater": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Overbetuwe": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Papendrecht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Peel en Maas": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Pekela": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Pijnacker-Nootdorp": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Purmerend": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Putten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Raalte": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Reimerswaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Renkum": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Renswoude": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Reusel-De Mierden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Rheden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Rhenen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Ridderkerk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Rijssen-Holten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Rijswijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Roerdalen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Roermond": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Roosendaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Rotterdam": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Rozendaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Rucphen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Schagen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Scherpenzeel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Schiedam": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Schiermonnikoog": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Schouwen-Duiveland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Simpelveld": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Sint-Michielsgestel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Sittard-Geleen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Sliedrecht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Sluis": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Smallingerland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Soest": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Someren": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Son en Breugel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Stadskanaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Staphorst": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Stede Broec": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Steenbergen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Steenwijkerland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Stein": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Stichtse Vecht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Súdwest-Fryslân": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Terneuzen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Terschelling": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Texel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Teylingen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Tholen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Tiel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Tilburg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Tubbergen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Twenterand": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Tynaarlo": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Tytsjerksteradiel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Uitgeest": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Uithoorn": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Urk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        "Utrecht": {
            "center": {
                "lat": 52.090794732191675,
                "lng": 5.121395209571712
            }
        },
        // "Utrechtse Heuvelrug": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Vaals": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        "Valkenburg aan de Geul": {
            "center": {
                "lat": 50.86451883029209,
                "lng": 5.832405671987047
            }
        },
        // "Valkenswaard": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Veendam": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Veenendaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Veere": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Veldhoven": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Velsen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Venlo": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Venray": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Vijfheerenlanden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Vlaardingen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Vlieland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Vlissingen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Voerendaal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Voorne aan Zee": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Voorschoten": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Voorst": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Vught": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Waadhoeke": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Waalre": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Waalwijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Waddinxveen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Wageningen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Wassenaar": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Waterland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Weert": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "West Betuwe": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "West Maas en Waal": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Westerkwartier": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Westerveld": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Westervoort": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Westerwolde": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Westland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Weststellingwerf": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Wierden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Wijchen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Wijdemeren": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Wijk bij Duurstede": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Winterswijk": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Woensdrecht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Woerden": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Wormerland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Woudenberg": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        "Zaanstad": {
            "center": {
                "lat": 52.438994120373096,
                "lng": 4.824222540987905
            }
        },
        // "Zaltbommel": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zandvoort": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zeewolde": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zeist": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zevenaar": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zoetermeer": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zoeterwoude": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zuidplas": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zundert": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zutphen": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zwartewaterland": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        // "Zwijndrecht": {
        //     "center": {
        //         "lat": 
        //         "lng": 
        //     }
        // },
        "Zwolle": {
            "center": {
                "lat": 52.5115265857356,
                "lng": 6.092290132816391
            }
        }
    };

    function getInitialMapSettings() {
        var zoomLevel = initialZoomLevel;
        var center = municipalities[activeMunicipality].center;
        var urlParams;
        var zoomParam;
        var centerParam;
        var lat;
        var lng;
        // ?zoom=15&center=52.436606513567,4.844183950027
        if (window.URLSearchParams) {
            urlParams = new window.URLSearchParams(window.location.search);
            zoomParam = urlParams.get("zoom");
            centerParam = urlParams.get("center");
            if (zoomParam && centerParam) {
                zoomParam = parseFloat(zoomParam);
                if (zoomParam > 14 && zoomParam < 20) {
                    zoomLevel = zoomParam;
                    console.log("Adjusted zoom level from URL");
                }
                centerParam = centerParam.split(",");
                lat = parseFloat(centerParam[0]);
                lng = parseFloat(centerParam[1]);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    center.lat = lat;
                    center.lng = lng;
                    console.log("Adjusted center from URL");
                }
            }
            updateUrl(zoomLevel, new google.maps.LatLng(center.lat, center.lng));
        }
        return {
            "zoomLevel": zoomLevel,
            "center": center
        };
    }

    function showInfoWindow(marker, header, body) {
        infoWindow.setContent("<div class='info_window'><h2 class='info_window_heading'>" + header + "</h2><div class='info_window_body'><p>" + body + "</p></div></div>");
        infoWindow.open({
            "anchor": marker,
            "map": map,
            "shouldFocus": true
        });
    }

    function getAlineas(responseXml) {
        const parser = new window.DOMParser();
        const xmlDoc = parser.parseFromString(responseXml, "text/xml");
        // gemeenteblad / zakelijke-mededeling / zakelijke-mededeling-tekst / tekst / <al>Verzonden naar aanvrager op: 20-09-2022</al>
        const zakelijkeMededeling = xmlDoc.getElementsByTagName("zakelijke-mededeling-tekst");
        return (
            zakelijkeMededeling.length === 0
            ? []
            : zakelijkeMededeling[0].getElementsByTagName("al")
        );
    }

    function getDaysPassed(date) {
        const today = new Date(new Date().toDateString());  // Rounded date
        const dateFrom = new Date(date.toDateString());
        return Math.round((today.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    }

    function parseBekendmaking(responseXml, datumGepubliceerd, gmbNumber) {

        function parseDate(value) {
            var year = value.substr(35, 4);
            var month = value.substr(32, 2);
            var day = value.substr(29, 2);
            var datumBekendgemaakt;
            if (Number.isNaN(parseInt(year, 10)) || Number.isNaN(parseInt(month, 10)) || Number.isNaN(parseInt(day, 10))) {
                console.error("Error parsing date (" + value + ") of license " + gmbNumber);
                return false;
            }
            datumBekendgemaakt = new Date(year + "-" + month + "-" + day);
            return new Date(datumBekendgemaakt.toDateString());
        }

        const identifier = "Verzonden naar aanvrager op: ";
        const alineas = getAlineas(responseXml);
        const maxLooptijd = (6 * 7) + 1;  // 6 weken de tijd om bezwaar te maken
        const dateFormatOptions = {"weekday": "long", "year": "numeric", "month": "long", "day": "numeric"};
        var datumBekendgemaakt;  // Datum verzonden aan belanghebbende(n)
        var looptijd;
        var resterendAantalDagenBezwaartermijn;
        var i;
        var j;
        var alinea;
        var value;
        var textToShow = "";
        var isBezwaartermijnFound = false;
        datumGepubliceerd = new Date(datumGepubliceerd.toDateString());
        for (i = 0; i < alineas.length; i += 1) {
            alinea = alineas[i];
            if (alinea.childNodes.length > 0) {
                for (j = 0; j < alinea.childNodes.length; j += 1) {
                    if (alinea.childNodes[j].nodeName === "#text") {
                        value = alinea.childNodes[j].nodeValue;
                        value = value.replace("Besluit verzonden", "Verzonden naar aanvrager op");
                        // Fix "Verzonden naar aanvrager op :" (https://zoek.officielebekendmakingen.nl/gmb-2022-441976.html)
                        value = value.replace("op :", "op:");
                        if (value.substr(0, identifier.length) === identifier) {
                            // Verzonden naar aanvrager op: 02-09-2022
                            // Remove time from dates:
                            datumBekendgemaakt = parseDate(value);
                            if (datumBekendgemaakt !== false) {
                                isBezwaartermijnFound = true;
                                looptijd = getDaysPassed(datumBekendgemaakt);
                                resterendAantalDagenBezwaartermijn = maxLooptijd - looptijd;
                                textToShow = "Gepubliceerd: " + datumGepubliceerd.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br />Bekendgemaakt aan belanghebbende: " + datumBekendgemaakt.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br />" + (
                                    resterendAantalDagenBezwaartermijn > 0
                                    ? "Resterend aantal dagen voor bezwaar: " + resterendAantalDagenBezwaartermijn + "."
                                    : "<b>Geen bezwaar meer mogelijk.</b>"
                                ) + "<br /><br />";
                            }
                            break;
                        }
                    }
                }
            }
        }
        if (!isBezwaartermijnFound) {
            textToShow = "Gepubliceerd: " + datumGepubliceerd.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br /><br />";
        }
        document.getElementById(gmbNumber).innerHTML = textToShow;
    }

    function collectBezwaartermijn(gmbNumber, datumGepubliceerd) {

        function getYearFromGmbNumber() {
            return gmbNumber.substr(4, 4);
        }

        // URL: https://zoek.officielebekendmakingen.nl/gmb-2022-425209.html
        // Endpoint: https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-425209/1/xml/gmb-2022-425209.xml
        const year = getYearFromGmbNumber();
        const url = proxyHost + "proxy-server/index.php?number=" + gmbNumber + "&year=" + year;
        if (Number.isNaN(parseInt(year, 10))) {
            console.error("Unable to gat data for gmbNumber " + gmbNumber);
            return;
        }
        fetch(
            url,
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.text().then(function (xml) {
                    parseBekendmaking(xml, datumGepubliceerd, gmbNumber);
                });
            } else {
                console.error(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function addCenterControlStyle(elm) {
        elm.style.backgroundColor = "#fff";
        elm.style.border = "2px solid #fff";
        elm.style.borderRadius = "3px";
        elm.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
        elm.style.color = "rgb(25,25,25)";
        elm.style.cursor = "default";
        elm.style.fontFamily = "Roboto,Arial,sans-serif";
        elm.style.fontSize = "16px";
        elm.style.lineHeight = "38px";
        elm.style.height = "40px";
        elm.style.margin = "8px 0 22px";
        elm.style.padding = "0 5px";
        elm.style.textAlign = "center";
    }

    function createOption(value, displayValue, isSelected) {
        const option = document.createElement("option");
        option.text = displayValue;
        option.value = value;
        if (isSelected) {
            option.setAttribute("selected", true);
        }
        return option;
    }

    function createOptionEx(value) {
        return createOption(value, value, value === activeMunicipality);
    }

    function createCenterControlMunicipalities() {
        const centerControlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        const municipalityNames = Object.keys(municipalities);
        combobox.id = "idCbxMunicipality";
        municipalityNames.forEach(function (municipalityName) {
            combobox.add(createOptionEx(municipalityName));
        });
        combobox.addEventListener("change", loadData);
        addCenterControlStyle(combobox);
        centerControlDiv.appendChild(combobox);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
    }

    function createCenterControlPeriods() {
        const centerControlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        combobox.id = "idCbxPeriod";
        combobox.add(createOption("3d", "Publicaties van laatste drie dagen", false));
        combobox.add(createOption("7d", "Publicaties van laatste week", false));
        combobox.add(createOption("14d", "Publicaties van laatste twee weken", true));
        combobox.add(createOption("all", "Alle recente publicaties", false));
        combobox.addEventListener("change", updateDisplayLevel);
        addCenterControlStyle(combobox);
        centerControlDiv.appendChild(combobox);
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);
    }

    function createCenterControls() {
        createCenterControlMunicipalities();
        createCenterControlPeriods();
    }

    function getGmbNumberFromUrl(websiteUrl) {
        // gmb-2022-425209
        return websiteUrl.substr(40, websiteUrl.length - 45);
    }

    function getIcon(title) {
        // Images are converted to SVG using https://png2svg.com/
        // Resized to 35x45 using https://www.iloveimg.com/resize-image/resize-svg#resize-options,pixels
        // Optmized using https://svgoptimizer.com/
        const aanvraagFilters = [
            "verlenging",
            "aanvraag"
        ];
        var apvFilter = "besluit apv";
        var isAanvraag = false;
        title = title.toLowerCase();
        aanvraagFilters.forEach(function (filter) {
            if (title.substring(0, filter.length) === filter) {
                isAanvraag = true;
            }
        });
        if (isAanvraag) {
            return {
                "url": "img/aanvraag.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.substring(0, apvFilter.length) === apvFilter) {
            return {
                "url": "img/apv.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.indexOf("exploitatievergunning") >= 0 || title.indexOf("alcoholwetvergunning") >= 0) {
            return {
                "url": "img/bar.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.indexOf("evenement") >= 0) {
            return {
                "url": "img/evenement.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.indexOf("bed & breakfast") >= 0 || title.indexOf("vakantieverhuur") >= 0) {
            return {
                "url": "img/hotel.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        return {
            "url": "img/constructie.png",
            "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
        };
    }

    function findUniquePosition(proposedCoordinate, title) {

        function isCoordinateAvailable(coordinate) {
            var isAvailable = true;  // Be positive
            var i;
            var marker;
            for (i = 0; i < markersArray.length; i += 1) {
                // Don't use forEach, to gain some performance.
                marker = markersArray[i];
                if (marker.position.lat === coordinate.lat && marker.position.lng === coordinate.lng) {
                    isAvailable = false;
                    break;
                }
            }
            return isAvailable;
        }

        while (!isCoordinateAvailable(proposedCoordinate)) {
            proposedCoordinate.lat = proposedCoordinate.lat + 0.000017;
            proposedCoordinate.lng = proposedCoordinate.lng + 0.000016;
        }
        return proposedCoordinate;
    }

    function isMarkerVisible(age, periodToShow) {
        switch (periodToShow) {
        case "3d":
            return age <= 3;
        case "7d":
            return age <= 7;
        case "14d":
            return age <= 14;
        default:
            return true;
        }
    }

    function addMarker(feature, periodToShow, position) {
        // 2022-09-05T09:04:57.175Z;
        // https://zoek.officielebekendmakingen.nl/gmb-2022-396401.html;
        // "Besluit apv vergunning Verleend Monnikendammerweg 27";
        // "TVM- 7 PV reserveren - Monnikendammerweg 27-37 - 03-07/10/2022, Monnikendammerweg 27";
        // 125171;
        // 488983
        // https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions
        var datumGepubliceerd = new Date(feature.recordData.gzd.originalData.meta.tpmeta.geldigheidsperiode_startdatum);
        var age = getDaysPassed(datumGepubliceerd);
        var marker = new google.maps.Marker({
            "map": map,
            "position": position,
            "clickable": true,
            "optimized": true,
            //"scaleControl": true,
            "visible": isMarkerVisible(age, periodToShow),
            "icon": getIcon(feature.recordData.gzd.originalData.meta.owmskern.title),
            "zIndex": zIndex,
            "title": feature.recordData.gzd.originalData.meta.owmskern.title
        });
        var markerObject = {
            "age": age,
            "position": position,
            "isSvg": true,
            "marker": marker
        };
        zIndex -= 1;  // Input is sorted by modification date - newest are first. Give them a higher zIndex, so Besluit is in front of Verlenging (which is in front of Aanvraag)
        marker.addListener(
            "click",
            function () {
                var gmbNumber = getGmbNumberFromUrl(feature.recordData.gzd.originalData.meta.tpmeta.bronIdentifier);
                var description = feature.recordData.gzd.originalData.meta.owmsmantel.description + "<br /><br />Meer info: <a href=\"" + feature.recordData.gzd.originalData.meta.tpmeta.bronIdentifier + "\" target=\"blank\">" + feature.recordData.gzd.originalData.meta.tpmeta.bronIdentifier + "</a>.";
                showInfoWindow(marker, feature.recordData.gzd.originalData.meta.owmskern.title, "<div id=\"" + gmbNumber + "\"><br /><br /><br /></div>" + description);
                collectBezwaartermijn(gmbNumber, datumGepubliceerd);
            }
        );
        markersArray.push(markerObject);
        return markerObject;
    }

    function prepareToAddMarker(feature, periodToShow, position, bounds) {
        if (bounds.contains(position)) {
            addMarker(feature, periodToShow, position);
        } else {
            delayedMarkersArray.push({
                "feature": feature,
                "position": position
            });
        }
    }

    function getPeriodToShow() {
        const periodComboElm = document.getElementById("idCbxPeriod");
        return (
            periodComboElm === null
            ? "14d"
            : periodComboElm.value
        );
    }

    function createCoordinate(locatiepunt) {
        const coordinate = locatiepunt.split(" ");  // Example: "52.35933 4.893097"
        return {
            "lat": parseFloat(coordinate[0]),
            "lng": parseFloat(coordinate[1])
        };
    }

    function addMarkers(startRecord) {
        const periodToShow = getPeriodToShow();
        const bounds = map.getBounds();
        var position;
        var i;
        var feature;
        console.log("Adding markers " + startRecord + " to " + inputData.searchRetrieveResponse.records.record.length);
        for (i = startRecord - 1; i < inputData.searchRetrieveResponse.records.record.length; i += 1) {
            feature = inputData.searchRetrieveResponse.records.record[i];
            if (typeof feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt === "string") {
                position = findUniquePosition(createCoordinate(feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt), feature.recordData.gzd.originalData.meta.owmskern.title);
                prepareToAddMarker(feature, periodToShow, position, bounds);
            } else if (Array.isArray(feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt)) {
                feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt.forEach(function (locatiepunt) {
                    position = findUniquePosition(createCoordinate(locatiepunt), feature.recordData.gzd.originalData.meta.owmskern.title);
                    prepareToAddMarker(feature, periodToShow, position, bounds);
                });
            } else {
                console.error("Unsupported feature:");
                console.error(feature);
            }
        }
    }

    function updateDisplayLevel() {
        const periodToShow = getPeriodToShow();
        markersArray.forEach(function (markerObject) {
            markerObject.marker.setVisible(isMarkerVisible(markerObject.age, periodToShow));
        });
    }

    function updateUrl(zoom, center) {
        // Add to URL: /?zoom=15&center=52.43660651356703,4.84418395002761
        if (window.URLSearchParams) {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set("zoom", zoom);
            searchParams.set("center", center.toUrlValue(10));
            window.history.replaceState(null, "", window.location.pathname + "?" + searchParams.toString());
        }
    }

    function internalInitMap() {
        var containerElm = document.getElementById("map");
        var mapSettings = getInitialMapSettings();
        infoWindow = new google.maps.InfoWindow();
        // https://developers.google.com/maps/documentation/javascript/overview#MapOptions
        map = new google.maps.Map(
            containerElm,
            {
                "clickableIcons": false,
                // Paid feature - "mapId": "c2a918307d540be7",  // https://console.cloud.google.com/google/maps-apis/studio/styles?project=eddepijp
                "center": new google.maps.LatLng(mapSettings.center.lat, mapSettings.center.lng),
                "mapTypeId": google.maps.MapTypeId.ROADMAP,  // https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeId
                "gestureHandling": "greedy",  // When scrolling, keep scrolling
                "zoom": mapSettings.zoomLevel
            }
        );
        createCenterControls();
        map.addListener("zoom_changed", function () {
            // Add to URL: /?zoom=15&center=52.43660651356703,4.84418395002761
            var periodElm = document.getElementById("idCbxPeriod");
            var zoom = map.getZoom();
            // Iterate over markers and call setVisible
            if (zoom <= 13 && (periodElm.value === "7d" || periodElm.value === "14d" || periodElm.value === "all")) {
                // Set to 3 days
                periodElm.value = "3d";
                updateDisplayLevel();
            } else if (zoom <= 14 && (periodElm.value === "14d" || periodElm.value === "all")) {
                // Set to 7 days
                periodElm.value = "7d";
                updateDisplayLevel();
            } else if (zoom <= 15 && (periodElm.value === "all")) {
                // Set to 14 days
                periodElm.value = "14d";
                updateDisplayLevel();
            }
            infoWindow.close();
            console.log("Zoom changed to " + zoom);
        });
        map.addListener("idle", function () {
            // Time to display other markers..
            const bounds = map.getBounds();
            const periodToShow = getPeriodToShow();
            var delayedMarker;
            var i = delayedMarkersArray.length;
            while (i > 0) {
                i = i - 1;
                delayedMarker = delayedMarkersArray[i];
                if (bounds.contains(delayedMarker.position)) {
                    addMarker(delayedMarker.feature, periodToShow, delayedMarker.position);
                    delayedMarkersArray.splice(i, 1);
                }
            }
            updateUrl(map.getZoom(), map.getCenter());
            console.log("Remaining items to add to the map: " + delayedMarkersArray.length);
        });
    }

    function navigateTo(municipality) {
        const center = municipalities[municipality].center;
        map.setCenter(new google.maps.LatLng(center.lat, center.lng), initialZoomLevel);
    }

    function loadDataForMunicipality(municipality, startRecord) {
        fetch(
            proxyHost + "proxy-server/index.php?type=list&municipality=" + encodeURIComponent(municipality) + "&startRecord=" + startRecord,
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.json().then(function (responseJson) {
                    if (municipality !== activeMunicipality) {
                        // We are loading a different municipality, but user selected another one.
                        return;
                    }
                    if (startRecord === 1) {
                        inputData = responseJson;
                    } else {
                        Array.prototype.push.apply(inputData.searchRetrieveResponse.records.record, responseJson.searchRetrieveResponse.records.record);
                    }
                    console.log("Found " + inputData.searchRetrieveResponse.records.record.length + " bekendmakingen of " + inputData.searchRetrieveResponse.numberOfRecords + " in " + municipality);
                    if (responseJson.searchRetrieveResponse.hasOwnProperty("nextRecordPosition")) {
                        // Add next page:
                        loadDataForMunicipality(municipality, responseJson.searchRetrieveResponse.nextRecordPosition);
                    }
                    addMarkers(startRecord);
                });
            } else {
                console.error(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function clearMarkers() {
        // https://developers.google.com/maps/documentation/javascript/markers#remove
        markersArray.forEach(function (markerObject) {
            markerObject.marker.setMap(null);
        });
        markersArray = [];
        delayedMarkersArray = [];
    }

    function loadData() {
        const municipalityComboElm = document.getElementById("idCbxMunicipality");
        if (municipalityComboElm !== null) {
            activeMunicipality = municipalityComboElm.value;
            clearMarkers();
            navigateTo(activeMunicipality);
        }
        loadDataForMunicipality(activeMunicipality, 1);
    }

    internalInitMap();
    loadData();
}
