// Source: https://organisaties.overheid.nl/Gemeenten/

const municipalities = {
    "Aa en Hunze": {
        "center": {
            "lat": 52.93517488,
            "lng": 6.67283615
        }
    },
    "Aalsmeer": {
        "center": {
            "lat": 52.263622347,
            "lng": 4.75970643
        }
    },
    "Aalten": {
        "center": {
            "lat": 51.926752636,
            "lng": 6.58120956
        }
    },
    "Achtkarspelen": {
        "center": {
            "lat": 53.21665192,
            "lng": 6.14134481
        }
    },
    "Alblasserdam": {
        "center": {
            "lat": 51.864005231,
            "lng": 4.65804994
        }
    },
    "Albrandswaard": {
        "center": {
            "lat": 51.85656801,
            "lng": 4.4002730
        }
    },
    "Alkmaar": {
        "center": {
            "lat": 52.632537715,
            "lng": 4.744034446
        }
    },
    "Almelo": {
        "center": {
            "lat": 52.35639583,
            "lng": 6.66364717
        }
    },
    "Almere": {
        "center": {
            "lat": 52.37512849,
            "lng": 5.215380253
        }
    },
    "Alphen aan den Rijn": {
        "center": {
            "lat": 52.1288118,
            "lng": 4.66263953
        }
    },
    "Alphen-Chaam": {
        "center": {
            "lat": 51.50391203,
            "lng": 4.86489698
        }
    },
    "Altena": {
        "center": {
            "lat": 51.77181134,
            "lng": 4.96046594
        }
    },
    "Ameland": {
        "center": {
            "lat": 53.44646072,
            "lng": 5.76963493
        }
    },
    "Amersfoort": {
        "center": {
            "lat": 52.15636667,
            "lng": 5.38970399
        }
    },
    "Amstelveen": {
        "center": {
            "lat": 52.302914505,
            "lng": 4.86035105
        }
    },
    "Amsterdam": {
        "center": {
            "lat": 52.37316382,
            "lng": 4.89166806
        }
    },
    "Apeldoorn": {
        "center": {
            "lat": 52.212608880,
            "lng": 5.96148455
        }
    },
    "Arnhem": {
        "center": {
            "lat": 51.9817103,
            "lng": 5.90798787
        }
    },
    "Assen": {
        "center": {
            "lat": 52.995627196,
            "lng": 6.56131166
        }
    },
    "Asten": {
        "center": {
            "lat": 51.403636309,
            "lng": 5.74575077
        }
    },
    "Baarle-Nassau": {
        "center": {
            "lat": 51.44318741,
            "lng": 4.9305039
        }
    },
    "Baarn": {
        "center": {
            "lat": 52.211281048,
            "lng": 5.28648938
        }
    },
    "Barendrecht": {
        "center": {
            "lat": 51.854827582,
            "lng": 4.53966494
        }
    },
    "Barneveld": {
        "center": {
            "lat": 52.13977529,
            "lng": 5.5867349
        }
    },
    "Beek": {
        "center": {
            "lat": 50.93989592,
            "lng": 5.79563162
        }
    },
    "Beekdaelen": {
        "center": {
            "lat": 50.91941187,
            "lng": 5.88674438
        }
    },
    "Beesel": {
        "center": {
            "lat": 51.28380191,
            "lng": 6.07770383
        }
    },
    "Berg en Dal": {
        "center": {
            "lat": 51.777576820,
            "lng": 5.93281142
        }
    },
    "Bergeijk": {
        "center": {
            "lat": 51.32227019,
            "lng": 5.358136156
        }
    },
    "Bergen (Limburg)": {
        "lookupName": "Bergen",
        "center": {
            "lat": 51.60343148,
            "lng": 6.04958943
        }
    },
    "Bergen (Noord-Holland)": {
        "lookupName": "Bergen NH",
        "center": {
            "lat": 52.6693513,
            "lng": 4.70043109
        }
    },
    "Bergen op Zoom": {
        "center": {
            "lat": 51.4945343,
            "lng": 4.2870889
        }
    },
    "Berkelland": {
        "center": {
            "lat": 52.11623523,
            "lng": 6.52474167
        }
    },
    "Bernheze": {
        "center": {
            "lat": 51.67832344,
            "lng": 5.50810638
        }
    },
    "Best": {
        "center": {
            "lat": 51.512130547,
            "lng": 5.394268866
        }
    },
    "Beuningen": {
        "center": {
            "lat": 51.861742621,
            "lng": 5.76936259
        }
    },
    "Beverwijk": {
        "center": {
            "lat": 52.47852156,
            "lng": 4.65458712
        }
    },
    "Bladel": {
        "center": {
            "lat": 51.3664926,
            "lng": 5.21520474
        }
    },
    "Blaricum": {
        "center": {
            "lat": 52.27265920,
            "lng": 5.24312064
        }
    },
    "Bloemendaal": {
        "center": {
            "lat": 52.405058603,
            "lng": 4.618654776
        }
    },
    "Bodegraven-Reeuwijk": {
        "center": {
            "lat": 52.0848836,
            "lng": 4.74713178
        }
    },
    "Boekel": {
        "center": {
            "lat": 51.60289173,
            "lng": 5.6739877
        }
    },
    "Borger-Odoorn": {
        "center": {
            "lat": 52.92399600,
            "lng": 6.79139942
        }
    },
    "Borne": {
        "center": {
            "lat": 52.300275131,
            "lng": 6.75713344
        }
    },
    "Borsele": {
        "center": {
            "lat": 51.4489473,
            "lng": 3.81937544
        }
    },
    "Boxtel": {
        "center": {
            "lat": 51.58869421,
            "lng": 5.32627354
        }
    },
    "Breda": {
        "center": {
            "lat": 51.595394367,
            "lng": 4.77962920
        }
    },
    "Bronckhorst": {
        "center": {
            "lat": 52.05224731,
            "lng": 6.31070646
        }
    },
    "Brummen": {
        "center": {
            "lat": 52.09319985,
            "lng": 6.15438454
        }
    },
    "Brunssum": {
        "center": {
            "lat": 50.94563860,
            "lng": 5.97141001
        }
    },
    "Bunnik": {
        "center": {
            "lat": 52.06714285,
            "lng": 5.2001120
        }
    },
    "Bunschoten": {
        "center": {
            "lat": 52.24380134,
            "lng": 5.37501109
        }
    },
    "Buren": {
        "center": {
            "lat": 51.912415613,
            "lng": 5.33411789
        }
    },
    "Capelle aan den IJssel": {
        "center": {
            "lat": 51.93125354,
            "lng": 4.58905250
        }
    },
    "Castricum": {
        "center": {
            "lat": 52.54650943,
            "lng": 4.66217873
        }
    },
    "Coevorden": {
        "center": {
            "lat": 52.66111429,
            "lng": 6.74079953
        }
    },
    "Cranendonck": {
        "center": {
            "lat": 51.274564849,
            "lng": 5.57496660
        }
    },
    "Culemborg": {
        "center": {
            "lat": 51.958225074,
            "lng": 5.22483243
        }
    },
    "Dalfsen": {
        "center": {
            "lat": 52.504800988,
            "lng": 6.26133877
        }
    },
    "Dantumadiel": {
        "center": {
            "lat": 53.285811274,
            "lng": 5.99070224
        }
    },
    "De Bilt": {
        "center": {
            "lat": 52.10924978,
            "lng": 5.18079826
        }
    },
    "De Fryske Marren": {
        "center": {
            "lat": 52.96777251,
            "lng": 5.79687896
        }
    },
    "De Ronde Venen": {
        "center": {
            "lat": 52.206689073,
            "lng": 4.8685827
        }
    },
    "De Wolden": {
        "center": {
            "lat": 52.67673440,
            "lng": 6.42172806
        }
    },
    "Delft": {
        "center": {
            "lat": 52.01143263,
            "lng": 4.35834421
        }
    },
    "Den Bosch": {
        "lookupName": "'s-Hertogenbosch",
        "center": {
            "lat": 51.69095639,
            "lng": 5.30417985
        }
    },
    "Den Haag": {
        "lookupName": "'s-Gravenhage",
        "center": {
            "lat": 52.08026322,
            "lng": 4.312297069
        }
    },
    "Den Helder": {
        "center": {
            "lat": 52.956547038,
            "lng": 4.76074517
        }
    },
    "Deurne": {
        "center": {
            "lat": 51.46237968,
            "lng": 5.7948054
        }
    },
    "Deventer": {
        "center": {
            "lat": 52.2530399,
            "lng": 6.160043617
        }
    },
    "Diemen": {
        "center": {
            "lat": 52.34099197,
            "lng": 4.96331720
        }
    },
    "Dijk en Waard": {
        "center": {
            "lat": 52.67968577,
            "lng": 4.80254660
        }
    },
    "Dinkelland": {
        "center": {
            "lat": 52.375873543,
            "lng": 7.00466643
        }
    },
    "Doesburg": {
        "center": {
            "lat": 52.01464687,
            "lng": 6.13457682
        }
    },
    "Doetinchem": {
        "center": {
            "lat": 51.965574,
            "lng": 6.28860378
        }
    },
    "Dongen": {
        "center": {
            "lat": 51.626103300,
            "lng": 4.94369636
        }
    },
    "Dordrecht": {
        "center": {
            "lat": 51.80269359,
            "lng": 4.71939585
        }
    },
    "Drechterland": {
        "center": {
            "lat": 52.66581122,
            "lng": 5.20480376
        }
    },
    "Drimmelen": {
        "center": {
            "lat": 51.7089126,
            "lng": 4.81068609
        }
    },
    "Dronten": {
        "center": {
            "lat": 52.52486333,
            "lng": 5.71797383
        }
    },
    "Druten": {
        "center": {
            "lat": 51.89078434,
            "lng": 5.6102196
        }
    },
    "Duiven": {
        "center": {
            "lat": 51.95007578,
            "lng": 6.02362064
        }
    },
    "Echt-Susteren": {
        "center": {
            "lat": 51.10658836,
            "lng": 5.867079802
        }
    },
    "Edam-Volendam": {
        "center": {
            "lat": 52.49500121,
            "lng": 5.07439154
        }
    },
    "Ede": {
        "center": {
            "lat": 52.043204871,
            "lng": 5.66808303
        }
    },
    "Eemnes": {
        "center": {
            "lat": 52.251431743,
            "lng": 5.25709498
        }
    },
    "Eemsdelta": {
        "center": {
            "lat": 53.334684806,
            "lng": 6.74613854
        }
    },
    "Eersel": {
        "center": {
            "lat": 51.35512290,
            "lng": 5.3070520
        }
    },
    "Eijsden-Margraten": {
        "center": {
            "lat": 50.79555178,
            "lng": 5.76445655
        }
    },
    "Eindhoven": {
        "center": {
            "lat": 51.43931079,
            "lng": 5.47844001
        }
    },
    "Elburg": {
        "center": {
            "lat": 52.44850767,
            "lng": 5.83385293
        }
    },
    "Emmen": {
        "center": {
            "lat": 52.78283737,
            "lng": 6.89450277
        }
    },
    "Enkhuizen": {
        "center": {
            "lat": 52.70377677,
            "lng": 5.29297750
        }
    },
    "Enschede": {
        "center": {
            "lat": 52.21975818,
            "lng": 6.8959356
        }
    },
    "Epe": {
        "center": {
            "lat": 52.34823153,
            "lng": 5.9833876
        }
    },
    "Ermelo": {
        "center": {
            "lat": 52.29923324,
            "lng": 5.62138291
        }
    },
    "Etten-Leur": {
        "center": {
            "lat": 51.568889456,
            "lng": 4.64066622
        }
    },
    "Geertruidenberg": {
        "center": {
            "lat": 51.700824040,
            "lng": 4.861246512
        }
    },
    "Geldrop-Mierlo": {
        "center": {
            "lat": 51.42241713,
            "lng": 5.5618016
        }
    },
    "Gemert-Bakel": {
        "center": {
            "lat": 51.557207258,
            "lng": 5.6821687
        }
    },
    "Gennep": {
        "center": {
            "lat": 51.699579260,
            "lng": 5.97100411
        }
    },
    "Gilze en Rijen": {
        "center": {
            "lat": 51.58835757,
            "lng": 4.91934535
        }
    },
    "Goeree-Overflakkee": {
        "center": {
            "lat": 51.75779416,
            "lng": 4.16518532
        }
    },
    "Goes": {
        "center": {
            "lat": 51.50238711,
            "lng": 3.8929121
        }
    },
    "Goirle": {
        "center": {
            "lat": 51.52013205,
            "lng": 5.06732074
        }
    },
    "Gooise Meren": {
        "center": {
            "lat": 52.295753098,
            "lng": 5.16274062
        }
    },
    "Gorinchem": {
        "center": {
            "lat": 51.83073686,
            "lng": 4.97445390
        }
    },
    "Gouda": {
        "center": {
            "lat": 52.011655057,
            "lng": 4.71047226
        }
    },
    "Groningen": {
        "center": {
            "lat": 53.21731778,
            "lng": 6.56719583
        }
    },
    "Gulpen-Wittem": {
        "center": {
            "lat": 50.81585626,
            "lng": 5.893291957
        }
    },
    "Haaksbergen": {
        "center": {
            "lat": 52.15596815,
            "lng": 6.74107857
        }
    },
    "Haarlem": {
        "center": {
            "lat": 52.38002361,
            "lng": 4.63596566
        }
    },
    "Haarlemmermeer": {
        "center": {
            "lat": 52.304320376,
            "lng": 4.69132708
        }
    },
    "Halderberge": {
        "center": {
            "lat": 51.58880868,
            "lng": 4.52730599
        }
    },
    "Hardenberg": {
        "center": {
            "lat": 52.575390,
            "lng": 6.62369501
        }
    },
    "Harderwijk": {
        "center": {
            "lat": 52.34907753,
            "lng": 5.61899519
        }
    },
    "Hardinxveld-Giessendam": {
        "center": {
            "lat": 51.827615331,
            "lng": 4.83476545
        }
    },
    "Harlingen": {
        "center": {
            "lat": 53.174514224,
            "lng": 5.41972869
        }
    },
    "Hattem": {
        "center": {
            "lat": 52.47470799,
            "lng": 6.06820668
        }
    },
    "Heemskerk": {
        "center": {
            "lat": 52.5106031,
            "lng": 4.67092291
        }
    },
    "Heemstede": {
        "center": {
            "lat": 52.349829790,
            "lng": 4.62124885
        }
    },
    "Heerde": {
        "center": {
            "lat": 52.38736686,
            "lng": 6.04134237
        }
    },
    "Heerenveen": {
        "center": {
            "lat": 52.960717366,
            "lng": 5.92582362
        }
    },
    "Heerlen": {
        "center": {
            "lat": 50.888888678,
            "lng": 5.97893161
        }
    },
    "Heeze-Leende": {
        "center": {
            "lat": 51.37981015,
            "lng": 5.5778712
        }
    },
    "Heiloo": {
        "center": {
            "lat": 52.600126781,
            "lng": 4.7035307
        }
    },
    "Hellendoorn": {
        "center": {
            "lat": 52.391326183,
            "lng": 6.44938932
        }
    },
    "Helmond": {
        "center": {
            "lat": 51.480193450,
            "lng": 5.65657114
        }
    },
    "Hendrik-Ido-Ambacht": {
        "center": {
            "lat": 51.842166838,
            "lng": 4.63344660
        }
    },
    "Hengelo": {
        "center": {
            "lat": 52.26713470,
            "lng": 6.79190047
        }
    },
    "Het Hogeland": {
        "center": {
            "lat": 53.33487495,
            "lng": 6.52760487
        }
    },
    "Heumen": {
        "center": {
            "lat": 51.76661935,
            "lng": 5.845033046
        }
    },
    "Heusden": {
        "center": {
            "lat": 51.734582,
            "lng": 5.13737514
        }
    },
    "Hillegom": {
        "center": {
            "lat": 52.293143147,
            "lng": 4.57940651
        }
    },
    "Hilvarenbeek": {
        "center": {
            "lat": 51.48423005,
            "lng": 5.13709806
        }
    },
    "Hilversum": {
        "center": {
            "lat": 52.2249705,
            "lng": 5.17314585
        }
    },
    "Hoeksche Waard": {
        "center": {
            "lat": 51.82621400,
            "lng": 4.41189526
        }
    },
    "Hof van Twente": {
        "center": {
            "lat": 52.23334269,
            "lng": 6.58702005
        }
    },
    "Hollands Kroon": {
        "center": {
            "lat": 52.81234709,
            "lng": 4.99821656
        }
    },
    "Hoogeveen": {
        "center": {
            "lat": 52.725771813,
            "lng": 6.47889063
        }
    },
    "Hoorn": {
        "center": {
            "lat": 52.63934466,
            "lng": 5.05924635
        }
    },
    "Horst aan de Maas": {
        "center": {
            "lat": 51.45180904,
            "lng": 6.05339240
        }
    },
    "Houten": {
        "center": {
            "lat": 52.034662997,
            "lng": 5.16962688
        }
    },
    "Huizen": {
        "center": {
            "lat": 52.297978855,
            "lng": 5.23549981
        }
    },
    "Hulst": {
        "center": {
            "lat": 51.28062433,
            "lng": 4.054087804
        }
    },
    "IJsselstein": {
        "center": {
            "lat": 52.019197068,
            "lng": 5.043623453
        }
    },
    "Kaag en Braassem": {
        "center": {
            "lat": 52.20409968,
            "lng": 4.63128310
        }
    },
    "Kampen": {
        "center": {
            "lat": 52.55529479,
            "lng": 5.91273429
        }
    },
    "Kapelle": {
        "center": {
            "lat": 51.486407586,
            "lng": 3.95796931
        }
    },
    "Katwijk": {
        "center": {
            "lat": 52.19929911,
            "lng": 4.41309727
        }
    },
    "Kerkrade": {
        "center": {
            "lat": 50.866239673,
            "lng": 6.06400938
        }
    },
    "Koggenland": {
        "center": {
            "lat": 52.62953380,
            "lng": 4.94708040
        }
    },
    "Krimpen aan den IJssel": {
        "center": {
            "lat": 51.91469245,
            "lng": 4.58777768
        }
    },
    "Krimpenerwaard": {
        "center": {
            "lat": 51.97239213,
            "lng": 4.7722134
        }
    },
    "Laarbeek": {
        "center": {
            "lat": 51.5293323,
            "lng": 5.64225305
        }
    },
    "Land van Cuijk": {
        "center": {
            "lat": 51.59628376,
            "lng": 6.01097477
        }
    },
    "Landgraaf": {
        "center": {
            "lat": 50.90683059,
            "lng": 6.025718805
        }
    },
    "Landsmeer": {
        "center": {
            "lat": 52.43279306,
            "lng": 4.91455076
        }
    },
    "Lansingerland": {
        "center": {
            "lat": 51.995646401,
            "lng": 4.487395380
        }
    },
    "Laren": {
        "center": {
            "lat": 52.256841608,
            "lng": 5.22407788
        }
    },
    "Leeuwarden": {
        "center": {
            "lat": 53.200683646,
            "lng": 5.79482161
        }
    },
    "Leiden": {
        "center": {
            "lat": 52.15897894,
            "lng": 4.49240437
        }
    },
    "Leiderdorp": {
        "center": {
            "lat": 52.16165884,
            "lng": 4.53167640
        }
    },
    "Leidschendam-Voorburg": {
        "center": {
            "lat": 52.08525765,
            "lng": 4.37916238
        }
    },
    "Lelystad": {
        "center": {
            "lat": 52.522711236,
            "lng": 5.44099084
        }
    },
    "Leudal": {
        "center": {
            "lat": 51.249889810,
            "lng": 5.89448036
        }
    },
    "Leusden": {
        "center": {
            "lat": 52.13177576,
            "lng": 5.42947763
        }
    },
    "Lingewaard": {
        "center": {
            "lat": 51.89214923,
            "lng": 5.89970857
        }
    },
    "Lisse": {
        "center": {
            "lat": 52.26332279,
            "lng": 4.556437472
        }
    },
    "Lochem": {
        "center": {
            "lat": 52.16141050,
            "lng": 6.4163454
        }
    },
    "Loon op Zand": {
        "center": {
            "lat": 51.627009533,
            "lng": 5.07388579
        }
    },
    "Lopik": {
        "center": {
            "lat": 51.9715480,
            "lng": 4.950865168
        }
    },
    "Losser": {
        "center": {
            "lat": 52.26392044,
            "lng": 7.00312930
        }
    },
    "Maasdriel": {
        "center": {
            "lat": 51.77308147,
            "lng": 5.339949825
        }
    },
    "Maasgouw": {
        "center": {
            "lat": 51.17755065,
            "lng": 5.90558496
        }
    },
    "Maashorst": {
        "center": {
            "lat": 51.659773966,
            "lng": 5.6178492
        }
    },
    "Maassluis": {
        "center": {
            "lat": 51.92153310,
            "lng": 4.253426169
        }
    },
    "Maastricht": {
        "center": {
            "lat": 50.85186888,
            "lng": 5.69592140
        }
    },
    "Medemblik": {
        "center": {
            "lat": 52.76690458,
            "lng": 5.10408672
        }
    },
    "Meerssen": {
        "center": {
            "lat": 50.883816951,
            "lng": 5.75416685
        }
    },
    "Meierijstad": {
        "center": {
            "lat": 51.61417965,
            "lng": 5.54576477
        }
    },
    "Meppel": {
        "center": {
            "lat": 52.697895429,
            "lng": 6.1912890
        }
    },
    "Middelburg": {
        "center": {
            "lat": 51.49847525,
            "lng": 3.611607018
        }
    },
    "Midden-Delfland": {
        "center": {
            "lat": 51.97553892,
            "lng": 4.31570509
        }
    },
    "Midden-Drenthe": {
        "center": {
            "lat": 52.85931906,
            "lng": 6.515408630
        }
    },
    "Midden-Groningen": {
        "center": {
            "lat": 53.15163665,
            "lng": 6.75532681
        }
    },
    "Moerdijk": {
        "center": {
            "lat": 51.662723683,
            "lng": 4.53509926
        }
    },
    "Molenlanden": {
        "center": {
            "lat": 51.870297220,
            "lng": 4.78967797
        }
    },
    "Montferland": {
        "center": {
            "lat": 51.93675008,
            "lng": 6.12934161
        }
    },
    "Montfoort": {
        "center": {
            "lat": 52.045380841,
            "lng": 4.94776388
        }
    },
    "Mook en Middelaar": {
        "center": {
            "lat": 51.75231842,
            "lng": 5.88366149
        }
    },
    "Neder-Betuwe": {
        "center": {
            "lat": 51.90953962,
            "lng": 5.569328
        }
    },
    "Nederweert": {
        "center": {
            "lat": 51.28529394,
            "lng": 5.74842350
        }
    },
    "Nieuwegein": {
        "center": {
            "lat": 52.029420349,
            "lng": 5.08424332
        }
    },
    "Nieuwkoop": {
        "center": {
            "lat": 52.149649024,
            "lng": 4.77997696
        }
    },
    "Nijkerk": {
        "center": {
            "lat": 52.223427994,
            "lng": 5.485580
        }
    },
    "Nijmegen": {
        "center": {
            "lat": 51.842118068,
            "lng": 5.85936950
        }
    },
    "Nissewaard": {
        "center": {
            "lat": 51.84891340,
            "lng": 4.33115521
        }
    },
    "Noardeast-Fryslân": {
        "center": {
            "lat": 53.32649414,
            "lng": 5.99877932
        }
    },
    "Noord-Beveland": {
        "center": {
            "lat": 51.57395731,
            "lng": 3.703777095
        }
    },
    "Noordenveld": {
        "center": {
            "lat": 53.13799618,
            "lng": 6.43333514
        }
    },
    "Noordoostpolder": {
        "center": {
            "lat": 52.71095911,
            "lng": 5.75854234
        }
    },
    "Noordwijk": {
        "center": {
            "lat": 52.241101985,
            "lng": 4.44618181
        }
    },
    "Nuenen, Gerwen en Nederwetten": {
        "center": {
            "lat": 51.47078314,
            "lng": 5.555014353
        }
    },
    "Nunspeet": {
        "center": {
            "lat": 52.375312396,
            "lng": 5.78244052
        }
    },
    "Oegstgeest": {
        "center": {
            "lat": 52.18261050,
            "lng": 4.4672176
        }
    },
    "Oirschot": {
        "center": {
            "lat": 51.50455881,
            "lng": 5.30753671
        }
    },
    "Oisterwijk": {
        "center": {
            "lat": 51.580623436,
            "lng": 5.19457147
        }
    },
    "Oldambt": {
        "center": {
            "lat": 53.146646994,
            "lng": 7.03311163
        }
    },
    "Oldebroek": {
        "center": {
            "lat": 52.44580274,
            "lng": 5.89928347
        }
    },
    "Oldenzaal": {
        "center": {
            "lat": 52.31239576,
            "lng": 6.92846911
        }
    },
    "Olst-Wijhe": {
        "center": {
            "lat": 52.38445112,
            "lng": 6.13576345
        }
    },
    "Ommen": {
        "center": {
            "lat": 52.51852207,
            "lng": 6.423372694
        }
    },
    "Oost Gelre": {
        "center": {
            "lat": 51.986954905,
            "lng": 6.5676184
        }
    },
    "Oosterhout": {
        "center": {
            "lat": 51.64418179,
            "lng": 4.85731962
        }
    },
    "Ooststellingwerf": {
        "center": {
            "lat": 52.99120666,
            "lng": 6.291792049
        }
    },
    "Oostzaan": {
        "center": {
            "lat": 52.44035601,
            "lng": 4.87545194
        }
    },
    "Opmeer": {
        "center": {
            "lat": 52.70543653,
            "lng": 4.94265979
        }
    },
    "Opsterland": {
        "center": {
            "lat": 53.00281802,
            "lng": 6.06402312
        }
    },
    "Oss": {
        "center": {
            "lat": 51.76810079,
            "lng": 5.523086211
        }
    },
    "Oude IJsselstreek": {
        "center": {
            "lat": 51.890042593,
            "lng": 6.3805536
        }
    },
    "Ouder-Amstel": {
        "center": {
            "lat": 52.29516398,
            "lng": 4.91612330
        }
    },
    "Oudewater": {
        "center": {
            "lat": 52.02283988,
            "lng": 4.870878981
        }
    },
    "Overbetuwe": {
        "center": {
            "lat": 51.91872060,
            "lng": 5.843634528
        }
    },
    "Papendrecht": {
        "center": {
            "lat": 51.82586242,
            "lng": 4.68332941
        }
    },
    "Peel en Maas": {
        "center": {
            "lat": 51.328672614,
            "lng": 5.97770168
        }
    },
    "Pekela": {
        "center": {
            "lat": 53.10405157,
            "lng": 7.00797328
        }
    },
    "Pijnacker-Nootdorp": {
        "center": {
            "lat": 52.01989597,
            "lng": 4.43364693
        }
    },
    "Purmerend": {
        "center": {
            "lat": 52.5102100,
            "lng": 4.95057323
        }
    },
    "Putten": {
        "center": {
            "lat": 52.2609744,
            "lng": 5.610245202
        }
    },
    "Raalte": {
        "center": {
            "lat": 52.38573942,
            "lng": 6.27514647
        }
    },
    "Reimerswaal": {
        "center": {
            "lat": 51.43062015,
            "lng": 4.11211672
        }
    },
    "Renkum": {
        "center": {
            "lat": 51.97272317,
            "lng": 5.73098669
        }
    },
    "Renswoude": {
        "center": {
            "lat": 52.074724485,
            "lng": 5.53773483
        }
    },
    "Reusel-De Mierden": {
        "center": {
            "lat": 51.36247477,
            "lng": 5.16263408
        }
    },
    "Rheden": {
        "center": {
            "lat": 52.010894958,
            "lng": 6.03064528
        }
    },
    "Rhenen": {
        "center": {
            "lat": 51.95730260,
            "lng": 5.569888
        }
    },
    "Ridderkerk": {
        "center": {
            "lat": 51.87065394,
            "lng": 4.60226568
        }
    },
    "Rijssen-Holten": {
        "center": {
            "lat": 52.28244987,
            "lng": 6.420603205
        }
    },
    "Rijswijk": {
        "center": {
            "lat": 52.03990594,
            "lng": 4.31396342
        }
    },
    "Roerdalen": {
        "center": {
            "lat": 51.14429269,
            "lng": 6.00138105
        }
    },
    "Roermond": {
        "center": {
            "lat": 51.19358596,
            "lng": 5.98869977
        }
    },
    "Roosendaal": {
        "center": {
            "lat": 51.53309139,
            "lng": 4.45624328
        }
    },
    "Rotterdam": {
        "center": {
            "lat": 51.924400273,
            "lng": 4.47775226
        }
    },
    "Rozendaal": {
        "center": {
            "lat": 52.0074856,
            "lng": 5.96343317
        }
    },
    "Rucphen": {
        "center": {
            "lat": 51.53285263,
            "lng": 4.55973054
        }
    },
    "Schagen": {
        "center": {
            "lat": 52.78668950,
            "lng": 4.79647059
        }
    },
    "Scherpenzeel": {
        "center": {
            "lat": 52.0796080,
            "lng": 5.48936259
        }
    },
    "Schiedam": {
        "center": {
            "lat": 51.918225687,
            "lng": 4.39682349
        }
    },
    "Schiermonnikoog": {
        "center": {
            "lat": 53.4791087,
            "lng": 6.16044001
        }
    },
    "Schouwen-Duiveland": {
        "center": {
            "lat": 51.6505518,
            "lng": 3.919660296
        }
    },
    "Simpelveld": {
        "center": {
            "lat": 50.835261921,
            "lng": 5.98221486
        }
    },
    "Sint-Michielsgestel": {
        "center": {
            "lat": 51.639456784,
            "lng": 5.35181168
        }
    },
    "Sittard-Geleen": {
        "center": {
            "lat": 50.99875131,
            "lng": 5.86811726
        }
    },
    "Sliedrecht": {
        "center": {
            "lat": 51.822132781,
            "lng": 4.77157469
        }
    },
    "Sluis": {
        "center": {
            "lat": 51.326388471,
            "lng": 3.489058816
        }
    },
    "Smallingerland": {
        "center": {
            "lat": 53.106632089,
            "lng": 6.09631997
        }
    },
    "Soest": {
        "center": {
            "lat": 52.16496471,
            "lng": 5.30621698
        }
    },
    "Someren": {
        "center": {
            "lat": 51.38586644,
            "lng": 5.71281066
        }
    },
    "Son en Breugel": {
        "center": {
            "lat": 51.5111893,
            "lng": 5.4935788
        }
    },
    "Stadskanaal": {
        "center": {
            "lat": 52.98730176,
            "lng": 6.95203048
        }
    },
    "Staphorst": {
        "center": {
            "lat": 52.64402391,
            "lng": 6.210743495
        }
    },
    "Stede Broec": {
        "center": {
            "lat": 52.69762305,
            "lng": 5.235275968
        }
    },
    "Steenbergen": {
        "center": {
            "lat": 51.587774424,
            "lng": 4.32156691
        }
    },
    "Steenwijkerland": {
        "center": {
            "lat": 52.78767577,
            "lng": 6.11504644
        }
    },
    "Stein": {
        "center": {
            "lat": 50.96769402,
            "lng": 5.76481681
        }
    },
    "Stichtse Vecht": {
        "center": {
            "lat": 52.144827245,
            "lng": 5.03321262
        }
    },
    "Súdwest-Fryslân": {
        "center": {
            "lat": 53.061736137,
            "lng": 5.522467207
        }
    },
    "Terneuzen": {
        "center": {
            "lat": 51.334531661,
            "lng": 3.82693177
        }
    },
    "Terschelling": {
        "center": {
            "lat": 53.382965002,
            "lng": 5.28506682
        }
    },
    "Texel": {
        "center": {
            "lat": 53.05430143,
            "lng": 4.79846293
        }
    },
    "Teylingen": {
        "center": {
            "lat": 52.225558704,
            "lng": 4.524120558
        }
    },
    "Tholen": {
        "center": {
            "lat": 51.54921848,
            "lng": 4.07736022
        }
    },
    "Tiel": {
        "center": {
            "lat": 51.88757032,
            "lng": 5.43079472
        }
    },
    "Tilburg": {
        "center": {
            "lat": 51.55850191,
            "lng": 5.088754398
        }
    },
    "Tubbergen": {
        "center": {
            "lat": 52.406045987,
            "lng": 6.78183059
        }
    },
    "Twenterand": {
        "center": {
            "lat": 52.46132355,
            "lng": 6.57319911
        }
    },
    "Tynaarlo": {
        "center": {
            "lat": 53.13733929,
            "lng": 6.56024329
        }
    },
    "Tytsjerksteradiel": {
        "center": {
            "lat": 53.18530100,
            "lng": 5.98885879
        }
    },
    "Uitgeest": {
        "center": {
            "lat": 52.528943833,
            "lng": 4.71507124
        }
    },
    "Uithoorn": {
        "center": {
            "lat": 52.245130800,
            "lng": 4.82647156
        }
    },
    "Urk": {
        "center": {
            "lat": 52.662129054,
            "lng": 5.59350754
        }
    },
    "Utrecht": {
        "center": {
            "lat": 52.090794732,
            "lng": 5.12139520
        }
    },
    "Utrechtse Heuvelrug": {
        "center": {
            "lat": 52.03320929,
            "lng": 5.34505406
        }
    },
    "Vaals": {
        "center": {
            "lat": 50.772969997,
            "lng": 6.0133680
        }
    },
    "Valkenburg aan de Geul": {
        "center": {
            "lat": 50.86451883,
            "lng": 5.83240567
        }
    },
    "Valkenswaard": {
        "center": {
            "lat": 51.34991843,
            "lng": 5.46061563
        }
    },
    "Veendam": {
        "center": {
            "lat": 53.10434889,
            "lng": 6.87488301
        }
    },
    "Veenendaal": {
        "center": {
            "lat": 52.02889215,
            "lng": 5.55756408
        }
    },
    "Veere": {
        "center": {
            "lat": 51.541958027,
            "lng": 3.66744304
        }
    },
    "Veldhoven": {
        "center": {
            "lat": 51.41997432,
            "lng": 5.4066527
        }
    },
    "Velsen": {
        "center": {
            "lat": 52.46757465,
            "lng": 4.6075924
        }
    },
    "Venlo": {
        "center": {
            "lat": 51.3703096,
            "lng": 6.16896773
        }
    },
    "Venray": {
        "center": {
            "lat": 51.52703108,
            "lng": 5.97537879
        }
    },
    "Vijfheerenlanden": {
        "center": {
            "lat": 51.978791025,
            "lng": 5.08466010
        }
    },
    "Vlaardingen": {
        "center": {
            "lat": 51.90797083,
            "lng": 4.34277344
        }
    },
    "Vlieland": {
        "center": {
            "lat": 53.295440125,
            "lng": 5.067185
        }
    },
    "Vlissingen": {
        "center": {
            "lat": 51.4415695,
            "lng": 3.576024703
        }
    },
    "Voerendaal": {
        "center": {
            "lat": 50.88202737,
            "lng": 5.92708097
        }
    },
    "Voorne aan Zee": {
        "center": {
            "lat": 51.87402635,
            "lng": 4.068982702
        }
    },
    "Voorschoten": {
        "center": {
            "lat": 52.12510355,
            "lng": 4.44688411
        }
    },
    "Voorst": {
        "center": {
            "lat": 52.236260232,
            "lng": 6.105044115
        }
    },
    "Vught": {
        "center": {
            "lat": 51.65844402,
            "lng": 5.29839583
        }
    },
    "Waadhoeke": {
        "center": {
            "lat": 53.18590876,
            "lng": 5.54215890
        }
    },
    "Waalre": {
        "center": {
            "lat": 51.386948507,
            "lng": 5.44742294
        }
    },
    "Waalwijk": {
        "center": {
            "lat": 51.68844030,
            "lng": 5.06188708
        }
    },
    "Waddinxveen": {
        "center": {
            "lat": 52.04501203,
            "lng": 4.64811686
        }
    },
    "Wageningen": {
        "center": {
            "lat": 51.964888861,
            "lng": 5.66273627
        }
    },
    "Wassenaar": {
        "center": {
            "lat": 52.14287083,
            "lng": 4.40109081
        }
    },
    "Waterland": {
        "center": {
            "lat": 52.44773174,
            "lng": 5.04028336
        }
    },
    "Weert": {
        "center": {
            "lat": 51.25342353,
            "lng": 5.70648149
        }
    },
    "West Betuwe": {
        "center": {
            "lat": 51.88792379,
            "lng": 5.19214884
        }
    },
    "West Maas en Waal": {
        "center": {
            "lat": 51.88213663,
            "lng": 5.51481347
        }
    },
    "Westerkwartier": {
        "center": {
            "lat": 53.213081037,
            "lng": 6.27360133
        }
    },
    "Westerveld": {
        "center": {
            "lat": 52.8332654,
            "lng": 6.36742893
        }
    },
    "Westervoort": {
        "center": {
            "lat": 51.955630208,
            "lng": 5.97290196
        }
    },
    "Westerwolde": {
        "center": {
            "lat": 53.02591,
            "lng": 7.10577040
        }
    },
    "Westland": {
        "center": {
            "lat": 52.02315971,
            "lng": 4.17013749
        }
    },
    "Weststellingwerf": {
        "center": {
            "lat": 52.87712812,
            "lng": 6.00455096
        }
    },
    "Wierden": {
        "center": {
            "lat": 52.359582245,
            "lng": 6.59237401
        }
    },
    "Wijchen": {
        "center": {
            "lat": 51.80722434,
            "lng": 5.72613161
        }
    },
    "Wijdemeren": {
        "center": {
            "lat": 52.241746,
            "lng": 5.10929747
        }
    },
    "Wijk bij Duurstede": {
        "center": {
            "lat": 51.97261239,
            "lng": 5.345905347
        }
    },
    "Winterswijk": {
        "center": {
            "lat": 51.97151894,
            "lng": 6.72137859
        }
    },
    "Woensdrecht": {
        "center": {
            "lat": 51.429672791,
            "lng": 4.30224800
        }
    },
    "Woerden": {
        "center": {
            "lat": 52.08570812,
            "lng": 4.88496639
        }
    },
    "Wormerland": {
        "center": {
            "lat": 52.49893009,
            "lng": 4.81185458
        }
    },
    "Woudenberg": {
        "center": {
            "lat": 52.081626117,
            "lng": 5.41413610
        }
    },
    "Zaanstad": {
        "center": {
            "lat": 52.438994120,
            "lng": 4.82422254
        }
    },
    "Zaltbommel": {
        "center": {
            "lat": 51.810305474,
            "lng": 5.25054876
        }
    },
    "Zandvoort": {
        "center": {
            "lat": 52.375814371,
            "lng": 4.5311883
        }
    },
    "Zeewolde": {
        "center": {
            "lat": 52.33039865,
            "lng": 5.54499665
        }
    },
    "Zeist": {
        "center": {
            "lat": 52.08465980,
            "lng": 5.2427043
        }
    },
    "Zevenaar": {
        "center": {
            "lat": 51.92825013,
            "lng": 6.07562526
        }
    },
    "Zoetermeer": {
        "center": {
            "lat": 52.06335678,
            "lng": 4.49033872
        }
    },
    "Zoeterwoude": {
        "center": {
            "lat": 52.118031264,
            "lng": 4.50080409
        }
    },
    "Zuidplas": {
        "center": {
            "lat": 51.9674232,
            "lng": 4.61694979
        }
    },
    "Zundert": {
        "center": {
            "lat": 51.46953482,
            "lng": 4.6583849
        }
    },
    "Zutphen": {
        "center": {
            "lat": 52.139957579,
            "lng": 6.195005874
        }
    },
    "Zwartewaterland": {
        "center": {
            "lat": 52.624784728,
            "lng": 6.04072457
        }
    },
    "Zwijndrecht": {
        "center": {
            "lat": 51.81272150,
            "lng": 4.63241197
        }
    },
    "Zwolle": {
        "center": {
            "lat": 52.5115265,
            "lng": 6.09229013
        }
    }
};
