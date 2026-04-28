# history/

Deze map bevat gecachte publicatiegegevens opgehaald van de API van de officiële bekendmakingen van de Nederlandse overheid ([officielebekendmakingen.nl](https://zoek.officielebekendmakingen.nl)).

## Mapstructuur

Bestanden zijn georganiseerd per jaar, en daarbinnen per gemeente en maand:

```
history/
  2017/
    amsterdam-2017-01.json
    amsterdam-2017-02.json
    ...
  2018/
  ...
  2026/
```

Beschikbare jaren: **2017 – 2026**.

## Bestandsformaat

Elk bestand heeft de naam `<gemeente-slug>-<jaar>-<maand>.json` en bevat één JSON-object:

```json
{
  "publications": [
    {
      "date": "2017-01-02T00:00:00.000Z",
      "urlDoc": "https://zoek.officielebekendmakingen.nl/gmb-2017-1152.html",
      "urlApi": "https://repository.overheid.nl/frbr/officielepublicaties/gmb/2017/gmb-2017-1152/1/xml/gmb-2017-1152.xml",
      "type": "Overige besluiten van algemene strekking",
      "title": "...",
      "description": "...",
      "location": ["52.379 4.799"]
    }
  ]
}
```

| Veld | Omschrijving |
|------|-------------|
| `date` | Publicatiedatum (ISO 8601) |
| `urlDoc` | Leesbare pagina op officielebekendmakingen.nl |
| `urlApi` | Machine-leesbare XML of PDF op repository.overheid.nl |
| `type` | Publicatiecategorie (bijv. `Verordeningen`, `Verkeersbesluiten`, `Vergunningen`) |
| `title` | Titel van de publicatie |
| `description` | Omschrijving van de publicatie (vaak gelijk aan `title`) |
| `location` | Array van `"lat lng"`-strings; lege array als er geen locatie beschikbaar is |

## Gemeenteslugs

Gemeenteslugs zijn afgeleid van `municipalities.json` in de hoofdmap van deze repository. De slug is de gemeentenaam in kleine letters, waarbij spaties zijn vervangen door koppeltekens en bijzondere tekens zijn genormaliseerd (bijv. `'s-Gravenhage` → `'s-gravenhage`, `IJsselstein` → `ijsselstein`).

Sommige gemeenten hebben een `lookupName` in `municipalities.json` om te verwijzen naar de juiste slug die de publicatie-API gebruikt. Bijvoorbeeld:

| Sleutel in municipalities.json | lookupName (slug in bestandsnamen) |
|-------------------------------|-------------------------------------|
| Den Haag | 's-Gravenhage → `'s-gravenhage` |
| Den Bosch | 's-Hertogenbosch → `'s-hertogenbosch` |
| Bergen (Limburg) | Bergen → `bergen` |
| Bergen (Noord-Holland) | Bergen NH → `bergen-nh` |

## Bron gemeentelijst

De lijst van gemeenten in `municipalities.json` is gecontroleerd aan de hand van de gemeentelijke indelingen van het CBS (Centraal Bureau voor de Statistiek). Het uitgangspunt voor de indeling van 2017 is:

> https://www.cbs.nl/nl-nl/onze-diensten/methoden/classificaties/overig/gemeentelijke-indelingen-per-jaar/indeling-per-jaar/gemeentelijke-indeling-op-1-januari-2017

Gemeenten die na 2017 zijn ontstaan door een herindeling hebben een `origin`-veld in `municipalities.json` met het jaar van de herindeling en de voorgangers. Bijvoorbeeld:

```json
"Altena": {
    "center": { "lat": 51.77181134, "lng": 4.96046594 },
    "origin": {
        "year": 2019,
        "municipalities": ["Aalburg", "Werkendam", "Woudrichem"]
    }
}
```

Gemeenten met een `origin`-vermelding in deze dataset.

| Gemeente | Jaar | Voorgaande gemeenten |
|---|---|---|
| Midden-Drenthe | 2000 | Beilen, Smilde, Westerbork |
| Nijkerk | 2000 | Nijkerk, Hoevelaken |
| Bergen (Noord-Holland) | 2001 | Bergen, Egmond, Schoorl |
| Dalfsen | 2001 | Dalfsen, Nieuwleusen |
| De Bilt | 2001 | De Bilt, Maartensdijk |
| Dinkelland | 2001 | Denekamp, Ootmarsum, Weerselo |
| Hardenberg | 2001 | Avereest, Gramsbergen, Stad Hardenberg |
| Hof van Twente | 2001 | Ambt Delden, Diepenheim, Goor, Markelo, Stad Delden |
| Kampen | 2001 | Kampen, IJsselmuiden |
| Lingewaard | 2001 | Bemmel, Gendt, Huissen |
| Olst-Wijhe | 2001 | Olst, Wijhe |
| Overbetuwe | 2001 | Elst, Gendt, Herveld, Huissen, Valburg |
| Raalte | 2001 | Raalte, Heino |
| Sittard-Geleen | 2001 | Born, Geleen, Sittard |
| Steenwijkerland | 2001 | Blankenham, Blokzijl, Brederwiede, Giethoorn, Kuinre, Oldemarkt, Vollenhove, Wanneperveen |
| Twenterand | 2001 | Den Ham, Vriezenveen, Wierden |
| Utrecht | 2001 | Utrecht, Haarzuilens, Vleuten-De Meern |
| Venlo | 2001 | Venlo, Belfeld, Tegelen |
| Woerden | 2001 | Woerden, Harmelen |
| Zwartewaterland | 2001 | Genemuiden, Hasselt, Zwartsluis |
| Castricum | 2002 | Castricum, Akersloot |
| Leidschendam-Voorburg | 2002 | Stompwijk, Veur, Voorburg |
| Neder-Betuwe | 2002 | Dodewaard, Echteld, Kesteren |
| Pijnacker-Nootdorp | 2002 | Nootdorp, Pijnacker |
| Wijdemeren | 2002 | 's-Graveland, Loosdrecht, Nederhorst den Berg |
| Echt-Susteren | 2003 | Echt, Susteren |
| Hulst | 2003 | Hulst, Hontenisse |
| Rijssen-Holten | 2003 | Holten, Rijssen |
| Sluis | 2003 | Aardenburg, Oostburg, Sluis-Aardenburg |
| Terneuzen | 2003 | Terneuzen, Axel, Sas van Gent, Zaamslag |
| Zwijndrecht | 2003 | Zwijndrecht, Heerjansdam |
| Geldrop-Mierlo | 2004 | Geldrop, Mierlo |
| Midden-Delfland | 2004 | Maasland, Schipluiden |
| Westland | 2004 | 's-Gravenzande, De Lier, Monster, Naaldwijk, Wateringen |
| Aalten | 2005 | Aalten, Dinxperlo |
| Berkelland | 2005 | Borculo, Eibergen, Neede, Ruurlo |
| Bronckhorst | 2005 | Hengelo (Gld), Hummelo en Keppel, Steenderen, Vorden, Zelhem |
| Deventer | 2005 | Deventer, Bathmen |
| Doetinchem | 2005 | Doetinchem, Wehl |
| Lochem | 2005 | Lochem, Gorssel |
| Montferland | 2005 | Didam, 's-Heerenberg, Netterden, Zeddam |
| Oost Gelre | 2005 | Groenlo, Lichtenvoorde |
| Oude IJsselstreek | 2005 | Gendringen, Terborg, Varsseveld |
| Zutphen | 2005 | Zutphen, Warnsveld |
| Drechterland | 2006 | Drechterland, Venhuizen |
| Katwijk | 2006 | Katwijk, Rijnsburg, Valkenburg |
| Teylingen | 2006 | Sassenheim, Voorhout, Warmond |
| Utrechtse Heuvelrug | 2006 | Amerongen, Doorn, Driebergen-Rijsenburg, Leersum, Maarn |
| Koggenland | 2007 | Avenhorn, Berkhout, Obdam, Oudendijk, Ursem |
| Lansingerland | 2007 | Bergschenhoek, Berkel en Rodenrijs, Bleiswijk |
| Leudal | 2007 | Haelen, Heythuysen, Hunsel, Neer, Roggel, Roggel en Neer |
| Maasgouw | 2007 | Beegden, Heel, Maasbracht, Thorn, Wessem |
| Nieuwkoop | 2007 | Nieuwkoop, Nieuwveen, Ter Aar |
| Roerdalen | 2007 | Ambt Montfort, Sint Odiliënberg |
| Roermond | 2007 | Roermond, Swalmen |
| Bloemendaal | 2009 | Bloemendaal, Bennebroek |
| Kaag en Braassem | 2009 | Alkemade, Jacobswoude, Leimuiden, Rijnsaterwoude, Woubrugge |
| Horst aan de Maas | 2010 | Broekhuizen, Grubbenvorst, Horst, Sevenum, Arcen en Velden, Meerlo-Wanssum |
| Oldambt | 2010 | Reiderland, Scheemda, Winschoten |
| Peel en Maas | 2010 | Helden, Kessel, Maasbree, Meijel |
| Rotterdam | 2010 | Rotterdam, Rozenburg |
| Venray | 2010 | Venray, Wanssum, Geijsteren, Blitterswijck |
| Zuidplas | 2010 | Moordrecht, Nieuwerkerk aan den IJssel, Zevenhuizen-Moerkapelle, Moerkapelle, Zevenhuizen |
| Bodegraven-Reeuwijk | 2011 | Bodegraven, Reeuwijk |
| De Ronde Venen | 2011 | De Ronde Venen, Abcoude |
| Eijsden-Margraten | 2011 | Eijsden, Margraten |
| Medemblik | 2011 | Medemblik, Noorder-Koggenland, Nibbixwoud, Wognum, Andijk, Wervershoof |
| Oss | 2011 | Oss, Ravenstein, Lith |
| Stichtse Vecht | 2011 | Breukelen, Loenen, Maarssen |
| Súdwest-Fryslân | 2018 | Bolsward, Nijefurd, Sneek, Wûnseradiel, Wymbritseradiel, Súdwest-Fryslân, Littenseradiel |
| Hollands Kroon | 2012 | Anna Paulowna, Niedorp, Wieringen, Wieringermeer |
| Goeree-Overflakkee | 2013 | Dirksland, Goedereede, Middelharnis, Oostflakkee |
| Schagen | 2013 | Schagen, Harenkarspel, Zijpe |
| Alphen aan den Rijn | 2014 | Alphen aan den Rijn, Boskoop, Rijnwoude |
| De Fryske Marren | 2014 | Boarnsterhim, Gaasterlân-Sleat, Lemsterland, Skasterlân |
| Heerenveen | 2014 | Heerenveen, Boarnsterhim |
| Leeuwarden | 2018 | Leeuwarden, Leeuwarderadeel, Boarnsterhim |
| Alkmaar | 2015 | Alkmaar, Graft-De Rijp, Schermer |
| Berg en Dal | 2015 | Groesbeek, Millingen aan de Rijn, Ubbergen |
| Krimpenerwaard | 2015 | Bergambacht, Nederlek, Ouderkerk, Schoonhoven, Vlist |
| Nissewaard | 2015 | Bernisse, Spijkenisse |
| Edam-Volendam | 2016 | Edam-Volendam, Zeevang |
| Gooise Meren | 2016 | Bussum, Muiden, Naarden |
| Meierijstad | 2017 | Schijndel, Sint-Oedenrode, Veghel |
| Midden-Groningen | 2018 | Hoogezand-Sappemeer, Menterwolde, Slochteren |
| Waadhoeke | 2018 | Franekeradeel, het Bildt, Menameradiel |
| Westerwolde | 2018 | Bellingwedde, Vlagtwedde |
| Zevenaar | 2018 | Zevenaar, Angerlo, Rijnwaarden |
| Altena | 2019 | Aalburg, Werkendam, Woudrichem |
| Beekdaelen | 2019 | Onderbanken, Nuth, Schinnen |
| Groningen | 2019 | Groningen, Ten Boer, Haren |
| Haarlemmermeer | 2019 | Haarlemmermeer, Haarlemmerliede en Spaarnwoude |
| Het Hogeland | 2019 | Bedum, Eemsmond, De Marne, Winsum |
| Hoeksche Waard | 2019 | Oud-Beijerland, Korendijk, Strijen, Cromstrijen, Binnenmaas |
| Molenlanden | 2019 | Giessenlanden, Molenwaard, Graafstroom, Liesveld, Nieuw-Lekkerland |
| Noardeast-Fryslân | 2019 | Dongeradeel, Ferwerderadiel, Kollumerland en Nieuwkruisland |
| Noordwijk | 2019 | Noordwijk, Noordwijkerhout |
| Vijfheerenlanden | 2019 | Leerdam, Vianen, Zederik |
| West Betuwe | 2019 | Geldermalsen, Neerijnen, Lingewaal |
| Westerkwartier | 2019 | Grootegast, Leek, Marum, Zuidhorn |
| Eemsdelta | 2021 | Appingedam, Delfzijl, Loppersum |
| Amsterdam | 2022 | Amsterdam, Weesp |
| Dijk en Waard | 2022 | Heerhugowaard, Langedijk |
| Land van Cuijk | 2022 | Boxmeer, Cuijk, Sint Anthonis, Mill en Sint Hubert, Grave |
| Maashorst | 2022 | Landerd, Uden, Schaijk, Zeeland |
| Purmerend | 2022 | Purmerend, Beemster |
| Voorne aan Zee | 2023 | Brielle, Hellevoetsluis, Westvoorne |
