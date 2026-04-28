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

Gemeenten met een `origin`-vermelding in deze dataset:

| Gemeente | Jaar | Voorgaande gemeenten |
|---|---|---|
| Meierijstad | 2017 | Schijndel, Sint-Oedenrode, Veghel |
| Leeuwarden | 2018 | Leeuwarden, Leeuwarderadeel |
| Midden-Groningen | 2018 | Hoogezand-Sappemeer, Menterwolde, Slochteren |
| Súdwest-Fryslân | 2018 | Súdwest-Fryslân, Littenseradiel |
| Waadhoeke | 2018 | Franekeradeel, het Bildt, Menameradiel |
| Westerwolde | 2018 | Bellingwedde, Vlagtwedde |
| Zevenaar | 2018 | Zevenaar, Rijnwaarden |
| Altena | 2019 | Aalburg, Werkendam, Woudrichem |
| Beekdaelen | 2019 | Onderbanken, Nuth, Schinnen |
| Groningen | 2019 | Groningen, Ten Boer, Haren |
| Haarlemmermeer | 2019 | Haarlemmermeer, Haarlemmerliede en Spaarnwoude |
| Het Hogeland | 2019 | Bedum, Eemsmond, De Marne, Winsum |
| Hoeksche Waard | 2019 | Oud-Beijerland, Korendijk, Strijen, Cromstrijen, Binnenmaas |
| Molenlanden | 2019 | Molenwaard, Giessenlanden |
| Noardeast-Fryslân | 2019 | Dongeradeel, Ferwerderadiel, Kollumerland en Nieuwkruisland |
| Noordwijk | 2019 | Noordwijk, Noordwijkerhout |
| Vijfheerenlanden | 2019 | Leerdam, Vianen, Zederik |
| West Betuwe | 2019 | Geldermalsen, Neerijnen, Lingewaal |
| Westerkwartier | 2019 | Grootegast, Leek, Marum, Zuidhorn |
| Eemsdelta | 2021 | Appingedam, Delfzijl, Loppersum |
| Amsterdam | 2022 | Amsterdam, Weesp |
| Dijk en Waard | 2022 | Heerhugowaard, Langedijk |
| Land van Cuijk | 2022 | Boxmeer, Cuijk, Sint Anthonis, Mill en Sint Hubert, Grave |
| Maashorst | 2022 | Landerd, Uden |
| Purmerend | 2022 | Purmerend, Beemster |
| Voorne aan Zee | 2023 | Brielle, Hellevoetsluis, Westvoorne |
