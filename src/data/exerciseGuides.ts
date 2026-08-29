// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Lokale Nederlandse Oefeningengids (100% Compleet & Accuraat)
// Bevat voor alle 94 oefeningen: Nederlandse instructies, doelspieren,
// apparatuur, aandachtspunten en geverifieerde animatie URLs.
// ─────────────────────────────────────────────────────────────────────────────

export interface OefeningGidsItem {
  naam: string;
  spiergroep: string;
  doelspier: string;
  secundaireSpieren: string[];
  apparaat: string;
  gifUrl: string;
  instructies: string[];
  aandachtspunten: string[];
}

export const OEFENING_GIDSEN: Record<string, OefeningGidsItem> = {
  "bench_press": {
    "naam": "Bench Press",
    "spiergroep": "Borst",
    "doelspier": "Grote borstspier (Pectoralis Major)",
    "secundaireSpieren": [
      "Triceps",
      "Voorste schouderkop"
    ],
    "apparaat": "Barbell & Vlakke Bank",
    "gifUrl": "https://static.exercisedb.dev/media/3TZduzM.gif",
    "instructies": [
      "Ga plat op de bank liggen met je ogen recht onder de stang en je voeten stevig op de grond.",
      "Pak de stang vast op iets breder dan schouderbreedte en knijp stevig.",
      "Trek je schouderbladen naar elkaar toe en duw ze omlaag in de bank (retractie en depressie).",
      "Til de stang uit het rek en laat deze gecontroleerd zakken naar het midden van je borstbeen.",
      "Druk de stang krachtig omhoog terwijl je uitblaast tot je armen gestrekt zijn."
    ],
    "aandachtspunten": [
      "Houd je polsen recht boven je onderarmen.",
      "Laat de stang niet stuiteren op je borst.",
      "Houd je billen te allen tijde op de bank."
    ]
  },
  "incline_bench_press": {
    "naam": "Incline Bench Press",
    "spiergroep": "Borst",
    "doelspier": "Bovenkant borst (Clavicular Pectoralis)",
    "secundaireSpieren": [
      "Voorste schouderkop",
      "Triceps"
    ],
    "apparaat": "Barbell & Schuin Bankje (30-45°)",
    "gifUrl": "https://static.exercisedb.dev/media/3TZduzM.gif",
    "instructies": [
      "Stel de bank in op een hoek van 30 tot 45 graden.",
      "Pak de stang op iets breder dan schouderbreedte vast met een stevige greep.",
      "Laat de stang gecontroleerd zakken naar de bovenkant van je borst (vlak onder de sleutelbenen).",
      "Druk de stang krachtig omhoog in een rechte lijn en knijp je borstspieren aan."
    ],
    "aandachtspunten": [
      "Zet de bank niet te steil (boven 45° wordt het vooral een schouderoefening)."
    ]
  },
  "decline_bench_press": {
    "naam": "Decline Bench Press",
    "spiergroep": "Borst",
    "doelspier": "Onderkant borst",
    "secundaireSpieren": [
      "Triceps"
    ],
    "apparaat": "Barbell & Decline Bank",
    "gifUrl": "https://static.exercisedb.dev/media/3QgteDK.gif",
    "instructies": [
      "Haak je benen stevig vast achter de kussens van de decline bank.",
      "Laat de stang rustig zakken naar de onderkant van je borst.",
      "Duw de stang krachtig omhoog en blaas uit."
    ],
    "aandachtspunten": [
      "Zorg voor een stabiele ligging en gecontroleerde neerwaartse beweging."
    ]
  },
  "dumbbell_press": {
    "naam": "Dumbbell Press",
    "spiergroep": "Borst",
    "doelspier": "Borstspieren (Pectoralis Major)",
    "secundaireSpieren": [
      "Triceps",
      "Schouders"
    ],
    "apparaat": "Dumbbells & Vlakke Bank",
    "gifUrl": "https://static.exercisedb.dev/media/3d7wHyd.gif",
    "instructies": [
      "Ga op de bank liggen met een dumbbell in elke hand ter hoogte van je borst.",
      "Druk de dumbbells recht omhoog tot je armen bijna gestrekt zijn.",
      "Laat de dumbbells rustig zakken tot je een diepe stretch in je borstspieren voelt."
    ],
    "aandachtspunten": [
      "Tik de dumbbells bovenin niet tegen elkaar aan om spanning te behouden."
    ]
  },
  "incline_dumbbell_press": {
    "naam": "Incline Dumbbell Press",
    "spiergroep": "Borst",
    "doelspier": "Bovenkant borst",
    "secundaireSpieren": [
      "Voorste schouderkop",
      "Triceps"
    ],
    "apparaat": "Dumbbells & Schuin Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/3d7wHyd.gif",
    "instructies": [
      "Ga op een schuine bank van 30-45 graden zitten.",
      "Druk de dumbbells schuin omhoog en breng ze bovenin iets naar elkaar toe.",
      "Laat de gewichten langzaam zakken naar de zijkanten van je borst."
    ],
    "aandachtspunten": [
      "Houd je polsen recht en je borst geopend."
    ]
  },
  "decline_dumbbell_press": {
    "naam": "Decline Dumbbell Press",
    "spiergroep": "Borst",
    "doelspier": "Onderkant borst",
    "secundaireSpieren": [
      "Triceps"
    ],
    "apparaat": "Dumbbells & Decline Bank",
    "gifUrl": "https://static.exercisedb.dev/media/3d7wHyd.gif",
    "instructies": [
      "Lig op de decline bank en druk de dumbbells omhoog boven je onderborst.",
      "Laat ze rustig zakken met ellebogen in een hoek van 45 graden."
    ],
    "aandachtspunten": [
      "Beheers het tempo tijdens de hele herhaling."
    ]
  },
  "dumbbell_flye": {
    "naam": "Dumbbell Flye",
    "spiergroep": "Borst",
    "doelspier": "Borstspieren (rek & isolatie)",
    "secundaireSpieren": [
      "Voorste schouderkop"
    ],
    "apparaat": "Dumbbells & Vlakke Bank",
    "gifUrl": "https://static.exercisedb.dev/media/1PLE8e9.gif",
    "instructies": [
      "Lig op een vlakke bank met dumbbells boven je borst en handpalmen naar elkaar toe.",
      "Houd een lichte, vaste buiging in je ellebogen.",
      "Open je armen zijwaarts in een boog tot je een comfortabele stretch voelt.",
      "Breng de gewichten via dezelfde boog weer omhoog alsof je een grote boom omhelst."
    ],
    "aandachtspunten": [
      "Verander de knik in je ellebogen niet tijdens de beweging."
    ]
  },
  "incline_dumbbell_flye": {
    "naam": "Incline Dumbbell Flye",
    "spiergroep": "Borst",
    "doelspier": "Bovenkant borst (isolatie)",
    "secundaireSpieren": [
      "Schouders"
    ],
    "apparaat": "Dumbbells & Schuin Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/1PLE8e9.gif",
    "instructies": [
      "Lig op een schuine bank en open je armen zijwaarts met licht gebogen ellebogen.",
      "Knijp vanuit de bovenkant van je borst de dumbbells weer omhoog samen."
    ],
    "aandachtspunten": [
      "Focus op de stretch onderin en knijp bovenin aan."
    ]
  },
  "cable_crossover": {
    "naam": "Cable Crossover",
    "spiergroep": "Borst",
    "doelspier": "Borstspieren (binnenkant & piekcontractie)",
    "secundaireSpieren": [
      "Voorste schouderkop"
    ],
    "apparaat": "Dubbel Kabelstation",
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "instructies": [
      "Plaats de katrollen op borsthoogte en pak beide handvatten.",
      "Stap een pas vooruit voor stabiliteit en leun licht voorover.",
      "Breng de handvatten in een vloeiende boog naar elkaar toe tot ze voor je borst kruisen.",
      "Knijp 1 seconde hard aan en laat rustig terugkomen."
    ],
    "aandachtspunten": [
      "Houd continue spanning op de kabels."
    ]
  },
  "cable_fly_high": {
    "naam": "Cable Fly High-to-Low",
    "spiergroep": "Borst",
    "doelspier": "Onderkant borst",
    "secundaireSpieren": [
      "Schouders"
    ],
    "apparaat": "Kabelstation (hoge stand)",
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "instructies": [
      "Zet de kabels hoog en trek ze diagonaal omlaag en naar voren.",
      "Knijp je onderborst stevig samen voor je heupen."
    ],
    "aandachtspunten": [
      "Houd je lichaam stil en span je buikspieren aan."
    ]
  },
  "cable_fly_low": {
    "naam": "Cable Fly Low-to-High",
    "spiergroep": "Borst",
    "doelspier": "Bovenkant borst",
    "secundaireSpieren": [
      "Schouders"
    ],
    "apparaat": "Kabelstation (lage stand)",
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "instructies": [
      "Zet de kabels laag bij de grond en trek ze in een boog omhoog naar borsthoogte.",
      "Span de bovenkant van je borstspieren bovenin goed aan."
    ],
    "aandachtspunten": [
      "Houd je schouders laag en naar achteren."
    ]
  },
  "pec_deck": {
    "naam": "Pec Deck Machine",
    "spiergroep": "Borst",
    "doelspier": "Borstspieren (isolatie)",
    "secundaireSpieren": [
      "Voorste schouderkop"
    ],
    "apparaat": "Pec Deck Machine",
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "instructies": [
      "Stel de zitting in zodat de handgrepen op borsthoogte vallen.",
      "Druk je rug tegen het kussen en breng je armen naar elkaar toe.",
      "Knijp je borstspieren kort aan en laat gecontroleerd terugkomen."
    ],
    "aandachtspunten": [
      "Laat je schouders niet naar voren rollen."
    ]
  },
  "chest_press_machine": {
    "naam": "Chest Press Machine",
    "spiergroep": "Borst",
    "doelspier": "Borstspieren",
    "secundaireSpieren": [
      "Triceps",
      "Schouders"
    ],
    "apparaat": "Chest Press Machine",
    "gifUrl": "https://static.exercisedb.dev/media/3TZduzM.gif",
    "instructies": [
      "Zit stevig tegen de rugleuning en duw de handgrepen naar voren.",
      "Laat de handgrepen rustig terugkomen tot goede rek op de borst."
    ],
    "aandachtspunten": [
      "Stel de stoelhoogte goed af op het midden van je borst."
    ]
  },
  "push_up": {
    "naam": "Push-Up",
    "spiergroep": "Borst",
    "doelspier": "Borstspieren & Core",
    "secundaireSpieren": [
      "Triceps",
      "Schouders",
      "Buikspieren"
    ],
    "apparaat": "Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/0br45wL.gif",
    "instructies": [
      "Plaats je handen op schouderbreedte en maak een rechte plank met je lichaam.",
      "Laat je borst zakken tot vlak boven de vloer met ellebogen in een hoek van 45 graden.",
      "Duw jezelf krachtig omhoog tot je beginpositie."
    ],
    "aandachtspunten": [
      "Laat je heupen niet doorhangen; span je billen en buik aan."
    ]
  },
  "wide_push_up": {
    "naam": "Wide Grip Push-Up",
    "spiergroep": "Borst",
    "doelspier": "Buitenkant borstspier",
    "secundaireSpieren": [
      "Schouders",
      "Triceps"
    ],
    "apparaat": "Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/0br45wL.gif",
    "instructies": [
      "Plaats je handen extra breed op de grond en voer gecontroleerde push-ups uit."
    ],
    "aandachtspunten": [
      "Behoud een strakke plankpositie."
    ]
  },
  "dips_chest": {
    "naam": "Dips (Borst)",
    "spiergroep": "Borst",
    "doelspier": "Onderkant borst & Triceps",
    "secundaireSpieren": [
      "Voorste schouderkop"
    ],
    "apparaat": "Dip Station",
    "gifUrl": "https://static.exercisedb.dev/media/9WTm7dq.gif",
    "instructies": [
      "Pak de stangen vast, leun met je bovenlichaam 30 graden naar voren.",
      "Laat jezelf zakken tot je ellebogen een hoek van 90 graden bereiken.",
      "Duw jezelf krachtig omhoog vanuit je borst en triceps."
    ],
    "aandachtspunten": [
      "Voorover leunen legt de nadruk op de borstspieren."
    ]
  },
  "dips_chest_weighted": {
    "naam": "Weighted Dips",
    "spiergroep": "Borst",
    "doelspier": "Borstspieren & Triceps",
    "secundaireSpieren": [
      "Schouders"
    ],
    "apparaat": "Dip Station & Dipriem",
    "gifUrl": "https://static.exercisedb.dev/media/9WTm7dq.gif",
    "instructies": [
      "Bevestig extra gewicht aan een dipriem en voer strikte borstdips uit."
    ],
    "aandachtspunten": [
      "Voorkom schommelen van het gewicht."
    ]
  },
  "deadlift": {
    "naam": "Deadlift",
    "spiergroep": "Rug",
    "doelspier": "Rugstrekkers, Glutes & Hamstrings",
    "secundaireSpieren": [
      "Trapezius",
      "Lats",
      "Grip",
      "Core"
    ],
    "apparaat": "Barbell & Gewichtsschijven",
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "instructies": [
      "Ga staan met je voeten op heupbreedte en de stang tegen je schenen.",
      "Buig door heupen en knieën en pak de stang net buiten je benen vast.",
      "Trek je borst omhoog, zet je rug kaarsrecht en span je lats aan.",
      "Duw de vloer weg met je benen en trek de stang langs je lichaam omhoog tot je rechtop staat."
    ],
    "aandachtspunten": [
      "Houd de stang altijd dicht tegen je lichaam.",
      "Laat je onderrug nooit bol trekken."
    ]
  },
  "sumo_deadlift": {
    "naam": "Sumo Deadlift",
    "spiergroep": "Rug",
    "doelspier": "Glutes, Adductoren & Onderrug",
    "secundaireSpieren": [
      "Quadriceps",
      "Trapezius"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "instructies": [
      "Plaats je voeten wijd uit elkaar met tenen naar buiten gericht.",
      "Zak met een rechtopstaand bovenlichaam naar beneden en pak de stang binnen je knieën vast.",
      "Duw je knieën naar buiten en duw jezelf omhoog via je hielen."
    ],
    "aandachtspunten": [
      "Houd je rug verticaal en heupen dicht bij de stang."
    ]
  },
  "rack_pull": {
    "naam": "Rack Pull",
    "spiergroep": "Rug",
    "doelspier": "Bovenrug, Trapezius & Rugstrekkers",
    "secundaireSpieren": [
      "Lats",
      "Grip"
    ],
    "apparaat": "Power Rack & Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "instructies": [
      "Stel de stang in het rack in op kniehoogte.",
      "Til de stang op vanuit een sterke heupextensie en knijp je bovenrug samen."
    ],
    "aandachtspunten": [
      "Focus op de bovenste lockout van de deadlift."
    ]
  },
  "pull_up": {
    "naam": "Pull-Up",
    "spiergroep": "Rug",
    "doelspier": "Brede rugspier (Latissimus Dorsi)",
    "secundaireSpieren": [
      "Biceps",
      "Rhomboids",
      "Trapezius"
    ],
    "apparaat": "Optrekstang",
    "gifUrl": "https://static.exercisedb.dev/media/7OeHptV.gif",
    "instructies": [
      "Pak de stang bovenhands vast (handpalmen van je af) breder dan schouderbreedte.",
      "Hang volledig uit en trek je schouderbladen omlaag.",
      "Trek je borst naar de stang door je ellebogen omlaag te trekken.",
      "Breng je kin over de stang en laat jezelf gecontroleerd zakken."
    ],
    "aandachtspunten": [
      "Voorkom zwaaien met je benen."
    ]
  },
  "chin_up": {
    "naam": "Chin-Up",
    "spiergroep": "Rug",
    "doelspier": "Lats & Biceps",
    "secundaireSpieren": [
      "Bovenrug"
    ],
    "apparaat": "Optrekstang",
    "gifUrl": "https://static.exercisedb.dev/media/7OeHptV.gif",
    "instructies": [
      "Pak de stang onderhands vast (handpalmen naar je toe) op schouderbreedte.",
      "Trek jezelf omhoog tot je kin over de stang is."
    ],
    "aandachtspunten": [
      "Onderhandse greep activeert de biceps extra zwaar."
    ]
  },
  "weighted_pull_up": {
    "naam": "Weighted Pull-Up",
    "spiergroep": "Rug",
    "doelspier": "Lats & Bovenrug",
    "secundaireSpieren": [
      "Biceps"
    ],
    "apparaat": "Optrekstang & Dipriem",
    "gifUrl": "https://static.exercisedb.dev/media/7OeHptV.gif",
    "instructies": [
      "Hang extra gewicht aan een dipriem en voer strikte pull-ups uit."
    ],
    "aandachtspunten": [
      "Zorg voor volledige bewegingsbaan."
    ]
  },
  "lat_pulldown": {
    "naam": "Lat Pulldown",
    "spiergroep": "Rug",
    "doelspier": "Brede rugspier (Latissimus Dorsi)",
    "secundaireSpieren": [
      "Biceps",
      "Achterste schouderkop"
    ],
    "apparaat": "Lat Pulldown Machine",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Ga zitten met je knieën stevig onder de kussens.",
      "Pak de brede stang bovenhands vast breder dan schouderbreedte.",
      "Leun licht achterover (10-15°) en trek de stang naar de bovenkant van je borst.",
      "Stuur met je ellebogen omlaag en knijp je rugspieren samen."
    ],
    "aandachtspunten": [
      "Trek de stang NOOIT achter je nek."
    ]
  },
  "lat_pulldown_neutral": {
    "naam": "Lat Pulldown Neutral Grip",
    "spiergroep": "Rug",
    "doelspier": "Lats (onderkant) & Biceps",
    "secundaireSpieren": [
      "Bovenrug"
    ],
    "apparaat": "Lat Pulldown Machine (V-Grip)",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Gebruik de V-greep en trek de hendel recht naar je borstbeen.",
      "Houd je ellebogen dicht bij je zij."
    ],
    "aandachtspunten": [
      "Focus op het naar beneden trekken van je schouderbladen."
    ]
  },
  "barbell_row": {
    "naam": "Barbell Row",
    "spiergroep": "Rug",
    "doelspier": "Middenrug (Rhomboids) & Lats",
    "secundaireSpieren": [
      "Biceps",
      "Onderrug"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Sta met voeten op heupbreedte en buig voorover vanuit je heupen met rechte rug (45°).",
      "Pak de stang op schouderbreedte vast.",
      "Trek de stang naar je navel met ellebogen langs je lichaam.",
      "Knijp je schouderbladen 1 seconde stevig samen."
    ],
    "aandachtspunten": [
      "Houd je rug kaarsrecht en wiebel niet met je benen."
    ]
  },
  "pendlay_row": {
    "naam": "Pendlay Row",
    "spiergroep": "Rug",
    "doelspier": "Bovenrug & Explosieve kracht",
    "secundaireSpieren": [
      "Onderrug",
      "Biceps"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Buig voorover tot je rug parallel is aan de vloer.",
      "Trek de stang explosief vanaf de grond naar je onderborst en leg hem na elke rep stil."
    ],
    "aandachtspunten": [
      "Start elke herhaling vanaf de vloer."
    ]
  },
  "dumbbell_row": {
    "naam": "Dumbbell Row",
    "spiergroep": "Rug",
    "doelspier": "Lats & Rhomboids (eenzijdig)",
    "secundaireSpieren": [
      "Biceps"
    ],
    "apparaat": "Dumbbell & Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Plaats één knie en hand op de bank.",
      "Trek de dumbbell met je andere arm omhoog naar je heup.",
      "Laat het gewicht rustig zakken met een lichte rek."
    ],
    "aandachtspunten": [
      "Houd je schouders parallel aan de vloer."
    ]
  },
  "seated_cable_row": {
    "naam": "Seated Cable Row",
    "spiergroep": "Rug",
    "doelspier": "Middenrug & Lats",
    "secundaireSpieren": [
      "Biceps",
      "Achterste schouderkop"
    ],
    "apparaat": "Kabelstation (Low Row)",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Zit rechtop met voeten tegen de steunen en lichte kniebuiging.",
      "Trek de handgreep naar je buik terwijl je borst fier vooruit blijft.",
      "Knijp je schouderbladen samen en keer rustig terug."
    ],
    "aandachtspunten": [
      "Beweeg vanuit je schouderbladen, niet door te schommelen."
    ]
  },
  "cable_row_wide": {
    "naam": "Wide Grip Cable Row",
    "spiergroep": "Rug",
    "doelspier": "Bovenrug & Achterkant schouders",
    "secundaireSpieren": [
      "Rhomboids"
    ],
    "apparaat": "Kabelstation & Brede stang",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Trek met een brede greep de stang naar je middenborst met hoge ellebogen."
    ],
    "aandachtspunten": [
      "Legt de focus op de dikte van de bovenrug."
    ]
  },
  "t_bar_row": {
    "naam": "T-Bar Row",
    "spiergroep": "Rug",
    "doelspier": "Middenrug & Lats",
    "secundaireSpieren": [
      "Biceps",
      "Onderrug"
    ],
    "apparaat": "T-Bar Toestel",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Ga over de stang staan, buig voorover met rechte rug en trek het gewicht naar je borstbeen."
    ],
    "aandachtspunten": [
      "Houd je onderrug stabiel en neutraal."
    ]
  },
  "face_pull": {
    "naam": "Face Pull",
    "spiergroep": "Rug",
    "doelspier": "Achterste schouderkop (Rear Delt) & Rotator Cuff",
    "secundaireSpieren": [
      "Trapezius",
      "Rhomboids"
    ],
    "apparaat": "Kabelstation & Touw",
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "instructies": [
      "Zet de kabel op ooghoogte en pak het touw met duimen naar achteren vast.",
      "Trek het touw naar je ogen terwijl je je handen uit elkaar trekt.",
      "Knijp de achterkant van je schouders 1 seconde stevig aan."
    ],
    "aandachtspunten": [
      "Kies een licht gewicht en focus op zuivere externe rotatie."
    ]
  },
  "hyperextension": {
    "naam": "Hyperextension",
    "spiergroep": "Rug",
    "doelspier": "Onderrug & Bilspieren",
    "secundaireSpieren": [
      "Hamstrings"
    ],
    "apparaat": "Hyperextension Bank",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Haak je enkels vast en buig rustig voorover vanuit je heupen.",
      "Kom omhoog tot je lichaam in één lijn is met je benen."
    ],
    "aandachtspunten": [
      "Overstrek je rug niet achterover."
    ]
  },
  "straight_arm_pulldown": {
    "naam": "Straight Arm Pulldown",
    "spiergroep": "Rug",
    "doelspier": "Lats (isolatie)",
    "secundaireSpieren": [
      "Buikspieren"
    ],
    "apparaat": "Kabelstation & Stang",
    "gifUrl": "https://static.exercisedb.dev/media/0MlxeMn.gif",
    "instructies": [
      "Houd de stang met gestrekte armen vast en duw hem in een boog omlaag naar je dijen."
    ],
    "aandachtspunten": [
      "Buig je ellebogen niet tijdens de beweging."
    ]
  },
  "squat": {
    "naam": "Back Squat",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps, Glutes & Hamstrings",
    "secundaireSpieren": [
      "Core",
      "Adductoren",
      "Onderrug"
    ],
    "apparaat": "Barbell & Squat Rack",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Leg de stang op je bovenrug en stap uit het rack.",
      "Plaats je voeten op schouderbreedte met tenen licht naar buiten.",
      "Haal diep adem in je buik en zet je core strak vast.",
      "Zak door je heupen naar achteren en knieën naar buiten te duwen tot parallel of dieper.",
      "Druk krachtig omhoog vanuit je hele voet."
    ],
    "aandachtspunten": [
      "Houd je borst fier omhoog en je rug neutraal.",
      "Laat je knieën niet naar binnen knikken."
    ]
  },
  "front_squat": {
    "naam": "Front Squat",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps & Core",
    "secundaireSpieren": [
      "Glutes"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Leg de stang op de voorkant van je schouders met hoge ellebogen.",
      "Squat diep met een verticaal bovenlichaam en duw jezelf omhoog."
    ],
    "aandachtspunten": [
      "Houd je ellebogen hoog."
    ]
  },
  "goblet_squat": {
    "naam": "Goblet Squat",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps & Glutes",
    "secundaireSpieren": [
      "Core"
    ],
    "apparaat": "Dumbbell of Kettlebell",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Houd een zware dumbbell verticaal tegen je borst.",
      "Squat diep tussen je benen en kom krachtig omhoog."
    ],
    "aandachtspunten": [
      "Ideale oefening voor perfecte squatdiepte."
    ]
  },
  "leg_press": {
    "naam": "Leg Press",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps & Glutes",
    "secundaireSpieren": [
      "Hamstrings"
    ],
    "apparaat": "Leg Press Machine",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Plaats je voeten op schouderbreedte op het platform.",
      "Laat het gewicht rustig zakken tot een hoek van 90 graden.",
      "Duw het platform krachtig weg zonder je knieën te overstrekken."
    ],
    "aandachtspunten": [
      "Houd je onderrug altijd stevig tegen de leuning.",
      "Zet je knieën bovenin nooit op slot."
    ]
  },
  "leg_press_narrow": {
    "naam": "Narrow Leg Press",
    "spiergroep": "Benen",
    "doelspier": "Buitenkant Quadriceps",
    "secundaireSpieren": [
      "Glutes"
    ],
    "apparaat": "Leg Press Machine",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Zet je voeten dicht bij elkaar onderaan het platform en voer de leg press uit."
    ],
    "aandachtspunten": [
      "Legt extra nadruk op de buitenste bovenbeenspier."
    ]
  },
  "bulgarian_split_squat": {
    "naam": "Bulgarian Split Squat",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps & Glutes (eenzijdig)",
    "secundaireSpieren": [
      "Hamstrings",
      "Core"
    ],
    "apparaat": "Dumbbells & Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Leg één voet achter je op een bankje en houd dumbbells in je handen.",
      "Zak recht omlaag tot je achterste knie bijna de grond raakt.",
      "Duw jezelf omhoog via de hiel van je voorste voet."
    ],
    "aandachtspunten": [
      "Houd 85% van je lichaamsgewicht op je voorste been."
    ]
  },
  "leg_extension": {
    "naam": "Leg Extension",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps (isolatie)",
    "secundaireSpieren": [],
    "apparaat": "Leg Extension Machine",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Plaats het rolkussen net boven je enkels.",
      "Strek je benen omhoog tot ze horizontaal zijn en knijp 1 seconde aan.",
      "Laat het gewicht beheerst zakken."
    ],
    "aandachtspunten": [
      "Schop het gewicht niet met een zwaai omhoog."
    ]
  },
  "leg_curl_lying": {
    "naam": "Leg Curl (liggend)",
    "spiergroep": "Benen",
    "doelspier": "Hamstrings (isolatie)",
    "secundaireSpieren": [
      "Kuiten"
    ],
    "apparaat": "Lying Leg Curl Machine",
    "gifUrl": "https://static.exercisedb.dev/media/17lJ1kr.gif",
    "instructies": [
      "Ga op je buik liggen met het kussen tegen je achillespees.",
      "Buig je benen en breng je hielen zo dicht mogelijk naar je billen.",
      "Knijp je hamstrings aan en laat rustig zakken."
    ],
    "aandachtspunten": [
      "Houd je heupen stevig tegen het bankje gedrukt."
    ]
  },
  "leg_curl_seated": {
    "naam": "Leg Curl (zittend)",
    "spiergroep": "Benen",
    "doelspier": "Hamstrings",
    "secundaireSpieren": [
      "Kuiten"
    ],
    "apparaat": "Seated Leg Curl Machine",
    "gifUrl": "https://static.exercisedb.dev/media/17lJ1kr.gif",
    "instructies": [
      "Zit in de machine met het dijbeenkussen strak vergrendeld.",
      "Buig je knieën en trek je hielen onder de zitting."
    ],
    "aandachtspunten": [
      "Zorgt voor een diepere rekpositie van de hamstrings."
    ]
  },
  "romanian_deadlift": {
    "naam": "Romanian Deadlift (RDL)",
    "spiergroep": "Benen",
    "doelspier": "Hamstrings & Glutes",
    "secundaireSpieren": [
      "Onderrug",
      "Grip"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "instructies": [
      "Sta rechtop met de stang in je handen.",
      "Houd een lichte knik in je knieën en duw je heupen maximaal naar achteren.",
      "Laat de stang langs je dijen zakken tot net onder de knieën.",
      "Duw je heupen naar voren om rechtop te komen en knijp je billen samen."
    ],
    "aandachtspunten": [
      "Dit is een heupscharnier; zak niet door je knieën zoals bij een squat."
    ]
  },
  "rdl_dumbbell": {
    "naam": "Dumbbell RDL",
    "spiergroep": "Benen",
    "doelspier": "Hamstrings & Glutes",
    "secundaireSpieren": [
      "Onderrug"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "instructies": [
      "Voer de heupscharnierbeweging uit met dumbbells dicht langs je schenen."
    ],
    "aandachtspunten": [
      "Houd je rug kaarsrecht."
    ]
  },
  "lunges": {
    "naam": "Lunges",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps & Glutes",
    "secundaireSpieren": [
      "Hamstrings"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Stap voorwaarts uit en buig beide knieën in een hoek van 90 graden.",
      "Duw jezelf krachtig terug via je voorste hiel."
    ],
    "aandachtspunten": [
      "Houd je bovenlichaam rechtop."
    ]
  },
  "walking_lunges": {
    "naam": "Walking Lunges",
    "spiergroep": "Benen",
    "doelspier": "Bovenbenen & Bilspieren",
    "secundaireSpieren": [
      "Core"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Loop continu in gecontroleerde lunges voorwaarts."
    ],
    "aandachtspunten": [
      "Zorg voor stabiliteit bij elke stap."
    ]
  },
  "calf_raise_standing": {
    "naam": "Standing Calf Raise",
    "spiergroep": "Benen",
    "doelspier": "Kuitspieren (Gastrocnemius)",
    "secundaireSpieren": [
      "Soleus"
    ],
    "apparaat": "Calf Machine / Verhoging",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Plaats de bal van je voeten op de rand en laat je hielen diep zakken.",
      "Druk jezelf zo hoog mogelijk op je tenen en houd 1 seconde vast."
    ],
    "aandachtspunten": [
      "Beweeg gecontroleerd en stuiter niet onderin."
    ]
  },
  "calf_raise_seated": {
    "naam": "Seated Calf Raise",
    "spiergroep": "Benen",
    "doelspier": "Diepe kuitspier (Soleus)",
    "secundaireSpieren": [],
    "apparaat": "Seated Calf Machine",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Duw vanuit een zittende positie je hielen maximaal omhoog."
    ],
    "aandachtspunten": [
      "Gebogen knieën isoleren de soleus spier."
    ]
  },
  "step_up": {
    "naam": "Step-Up",
    "spiergroep": "Benen",
    "doelspier": "Quadriceps & Glutes",
    "secundaireSpieren": [
      "Kuiten"
    ],
    "apparaat": "Verhoging & Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "instructies": [
      "Plaats je voet op de box en stap krachtig omhoog zonder af te zetten met je achterste been."
    ],
    "aandachtspunten": [
      "Laat het werk puur door het opstapbeen verrichten."
    ]
  },
  "hip_thrust": {
    "naam": "Hip Thrust",
    "spiergroep": "Benen",
    "doelspier": "Grote bilspier (Gluteus Maximus)",
    "secundaireSpieren": [
      "Hamstrings"
    ],
    "apparaat": "Barbell & Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "instructies": [
      "Zit met je bovenrug tegen een bank en de stang over je heupen.",
      "Duw je heupen explosief omhoog tot je bovenlichaam en dijen een rechte lijn vormen.",
      "Knijp je billen bovenin 2 seconden keihard samen."
    ],
    "aandachtspunten": [
      "Kijk naar voren met je kin op je borst."
    ]
  },
  "glute_bridge": {
    "naam": "Glute Bridge",
    "spiergroep": "Benen",
    "doelspier": "Bilspieren",
    "secundaireSpieren": [
      "Hamstrings"
    ],
    "apparaat": "Matje / Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "instructies": [
      "Lig op je rug met gebogen knieën en duw je heupen omhoog."
    ],
    "aandachtspunten": [
      "Knijp je bilspieren stevig samen bovenin."
    ]
  },
  "overhead_press": {
    "naam": "Overhead Press (Barbell)",
    "spiergroep": "Schouders",
    "doelspier": "Schouderspieren (Deltoids)",
    "secundaireSpieren": [
      "Triceps",
      "Bovenborst",
      "Core"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Sta rechtop met de stang rustend op je sleutelbenen.",
      "Span je billen en buik maximaal aan.",
      "Druk de stang in een rechte lijn omhoog boven je hoofd.",
      "Strek je armen uit en breng je hoofd iets naar voren bij de lockout."
    ],
    "aandachtspunten": [
      "Houd je onderrug recht; buig niet achterover."
    ]
  },
  "dumbbell_shoulder_press": {
    "naam": "Dumbbell Shoulder Press",
    "spiergroep": "Schouders",
    "doelspier": "Schouderspieren",
    "secundaireSpieren": [
      "Triceps"
    ],
    "apparaat": "Dumbbells & Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Zit op een bankje met rechte leuning en dumbbells ter hoogte van je oren.",
      "Druk de dumbbells omhoog tot bijna gestrekte armen en laat rustig zakken."
    ],
    "aandachtspunten": [
      "Houd je ellebogen licht naar voren gericht."
    ]
  },
  "arnold_press": {
    "naam": "Arnold Press",
    "spiergroep": "Schouders",
    "doelspier": "Voorste & Middelste schouderkop",
    "secundaireSpieren": [
      "Triceps"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Begin met dumbbells voor je borst met handpalmen naar je toe.",
      "Druk omhoog terwijl je je polsen naar buiten draait."
    ],
    "aandachtspunten": [
      "Draai in een vloeiende, gecontroleerde beweging."
    ]
  },
  "seated_shoulder_press": {
    "naam": "Seated Machine Shoulder Press",
    "spiergroep": "Schouders",
    "doelspier": "Schouders",
    "secundaireSpieren": [
      "Triceps"
    ],
    "apparaat": "Shoulder Press Machine",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Druk de handgrepen van de machine gecontroleerd omhoog."
    ],
    "aandachtspunten": [
      "Maximale stabiliteit voor zware belasting."
    ]
  },
  "lateral_raise": {
    "naam": "Lateral Raise (Dumbbell)",
    "spiergroep": "Schouders",
    "doelspier": "Zijkant schouders (Lateral Deltoid)",
    "secundaireSpieren": [
      "Trapezius"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Houd dumbbells langs je lichaam en hef je armen zijwaarts omhoog met een lichte knik in de ellebogen.",
      "Beweeg tot schouderhoogte en laat rustig zakken."
    ],
    "aandachtspunten": [
      "Gebruik geen zwaai vanuit je benen; til met je ellebogen."
    ]
  },
  "lateral_raise_cable": {
    "naam": "Lateral Raise (Kabel)",
    "spiergroep": "Schouders",
    "doelspier": "Zijkant schouders",
    "secundaireSpieren": [
      "Trapezius"
    ],
    "apparaat": "Kabelstation (Lage stand)",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Pak de kabel vast en hef je arm zijwaarts met constante spanning."
    ],
    "aandachtspunten": [
      "Biedt continue spanning over de hele bewegingsbaan."
    ]
  },
  "front_raise": {
    "naam": "Front Raise",
    "spiergroep": "Schouders",
    "doelspier": "Voorste schouderkop",
    "secundaireSpieren": [
      "Bovenborst"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Hef de dumbbells voorwaarts omhoog tot ooghoogte en laat beheerst zakken."
    ],
    "aandachtspunten": [
      "Houd je lichaam stil en rechtop."
    ]
  },
  "rear_delt_flye": {
    "naam": "Rear Delt Flye",
    "spiergroep": "Schouders",
    "doelspier": "Achterste schouderkop (Posterior Deltoid)",
    "secundaireSpieren": [
      "Rhomboids"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "instructies": [
      "Buig voorover vanuit je heupen en hef de dumbbells zijwaarts omhoog naar buiten."
    ],
    "aandachtspunten": [
      "Focus op het naar buiten duwen van je ellebogen."
    ]
  },
  "reverse_pec_deck": {
    "naam": "Reverse Pec Deck",
    "spiergroep": "Schouders",
    "doelspier": "Achterste schouderkop",
    "secundaireSpieren": [
      "Bovenrug"
    ],
    "apparaat": "Pec Deck Machine",
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "instructies": [
      "Zit met je borst tegen het kussen en duw de handgrepen naar achteren."
    ],
    "aandachtspunten": [
      "Houd je schouders laag."
    ]
  },
  "upright_row": {
    "naam": "Upright Row",
    "spiergroep": "Schouders",
    "doelspier": "Zijkant schouders & Trapezius",
    "secundaireSpieren": [
      "Biceps"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Trek de stang omhoog langs je lichaam door je ellebogen hoog te heffen."
    ],
    "aandachtspunten": [
      "Pak niet te smal vast om polspijn te voorkomen."
    ]
  },
  "shrugs": {
    "naam": "Shrugs",
    "spiergroep": "Schouders",
    "doelspier": "Bovenste Trapezius",
    "secundaireSpieren": [
      "Grip"
    ],
    "apparaat": "Dumbbells of Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Trek je schouders recht omhoog richting je oren en knijp 1 seconde samen."
    ],
    "aandachtspunten": [
      "Beweeg puur verticaal; draai je schouders niet rond."
    ]
  },
  "barbell_curl": {
    "naam": "Barbell Curl",
    "spiergroep": "Armen",
    "doelspier": "Biceps (Biceps Brachii)",
    "secundaireSpieren": [
      "Onderarmen"
    ],
    "apparaat": "Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Sta rechtop met de stang op schouderbreedte vast.",
      "Houd je ellebogen strak tegen je zij.",
      "Curl de stang omhoog naar schouderhoogte en knijp je biceps aan.",
      "Laat de stang in 2-3 seconden rustig zakken."
    ],
    "aandachtspunten": [
      "Zwaai niet met je heupen of onderrug."
    ]
  },
  "ez_bar_curl": {
    "naam": "EZ Bar Curl",
    "spiergroep": "Armen",
    "doelspier": "Biceps & Brachialis",
    "secundaireSpieren": [
      "Onderarmen"
    ],
    "apparaat": "EZ Bar",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Pak de gebogen grepen van de EZ-stang vast en curl gecontroleerd omhoog."
    ],
    "aandachtspunten": [
      "Ontlast de polsgewrichten."
    ]
  },
  "dumbbell_curl": {
    "naam": "Dumbbell Curl",
    "spiergroep": "Armen",
    "doelspier": "Biceps",
    "secundaireSpieren": [
      "Onderarmen"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Curl de dumbbells omhoog en draai je handpalmen naar buiten (supinatie)."
    ],
    "aandachtspunten": [
      "Draai je pink omhoog voor maximale contractie."
    ]
  },
  "hammer_curl": {
    "naam": "Hammer Curl",
    "spiergroep": "Armen",
    "doelspier": "Brachialis & Onderarm",
    "secundaireSpieren": [
      "Biceps"
    ],
    "apparaat": "Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Houd de dumbbells met neutrale greep (handpalmen naar elkaar toe) en curl omhoog."
    ],
    "aandachtspunten": [
      "Bouwt armdikte en onderarmkracht."
    ]
  },
  "incline_curl": {
    "naam": "Incline Dumbbell Curl",
    "spiergroep": "Armen",
    "doelspier": "Lange kop van de biceps",
    "secundaireSpieren": [
      "Onderarmen"
    ],
    "apparaat": "Schuin Bankje & Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Lig op een schuin bankje en curl omhoog vanuit een diepe stretchpositie."
    ],
    "aandachtspunten": [
      "Houd je ellebogen achter je lichaam."
    ]
  },
  "preacher_curl": {
    "naam": "Preacher Curl",
    "spiergroep": "Armen",
    "doelspier": "Korte kop van de biceps (isolatie)",
    "secundaireSpieren": [],
    "apparaat": "Preacher Bank & Stang",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Leg je bovenarmen op het kussen en curl het gewicht omhoog."
    ],
    "aandachtspunten": [
      "Sluit smokkelen volledig uit."
    ]
  },
  "cable_curl": {
    "naam": "Cable Curl",
    "spiergroep": "Armen",
    "doelspier": "Biceps",
    "secundaireSpieren": [
      "Onderarmen"
    ],
    "apparaat": "Kabelstation",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Curl met de kabel voor constante spanning in de hele beweging."
    ],
    "aandachtspunten": [
      "Houd je ellebogen stil."
    ]
  },
  "concentration_curl": {
    "naam": "Concentration Curl",
    "spiergroep": "Armen",
    "doelspier": "Biceps (piekcontractie)",
    "secundaireSpieren": [],
    "apparaat": "Dumbbell & Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Plaats je elleboog tegen de binnenkant van je dij en curl omhoog."
    ],
    "aandachtspunten": [
      "Beweeg puur vanuit het ellebooggewricht."
    ]
  },
  "spider_curl": {
    "naam": "Spider Curl",
    "spiergroep": "Armen",
    "doelspier": "Korte bicepkop",
    "secundaireSpieren": [],
    "apparaat": "Schuin Bankje & Dumbbells",
    "gifUrl": "https://static.exercisedb.dev/media/0IgNjSM.gif",
    "instructies": [
      "Lig met je borst op het bankje en curl met verticaal hangende armen."
    ],
    "aandachtspunten": [
      "Sterke piekcontractie bovenin."
    ]
  },
  "triceps_pushdown": {
    "naam": "Triceps Pushdown (touw)",
    "spiergroep": "Armen",
    "doelspier": "Triceps",
    "secundaireSpieren": [],
    "apparaat": "Kabelstation & Touw",
    "gifUrl": "https://static.exercisedb.dev/media/1PK5Uo3.gif",
    "instructies": [
      "Houd je ellebogen tegen je ribbenkast en duw het touw omlaag.",
      "Trek het touw onderin uit elkaar en knijp je triceps aan."
    ],
    "aandachtspunten": [
      "Laat je ellebogen niet naar voren en achteren zwaaien."
    ]
  },
  "triceps_pushdown_bar": {
    "naam": "Triceps Pushdown (rechte stang)",
    "spiergroep": "Armen",
    "doelspier": "Triceps",
    "secundaireSpieren": [],
    "apparaat": "Kabelstation & Korte Stang",
    "gifUrl": "https://static.exercisedb.dev/media/1PK5Uo3.gif",
    "instructies": [
      "Duw de rechte stang omlaag tot je armen gestrekt zijn."
    ],
    "aandachtspunten": [
      "Ideaal voor zwaardere overbelasting."
    ]
  },
  "skull_crusher": {
    "naam": "Skull Crusher (EZ bar)",
    "spiergroep": "Armen",
    "doelspier": "Lange kop van de triceps",
    "secundaireSpieren": [],
    "apparaat": "EZ Bar & Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/1PK5Uo3.gif",
    "instructies": [
      "Lig op de bank met de stang boven je borst.",
      "Houd je bovenarmen stil en buig je ellebogen om de stang naar je voorhoofd te laten zakken.",
      "Strek je armen krachtig uit vanuit je triceps."
    ],
    "aandachtspunten": [
      "Laat je ellebogen niet naar buiten wijken."
    ]
  },
  "overhead_tricep_ext": {
    "naam": "Overhead Tricep Extension",
    "spiergroep": "Armen",
    "doelspier": "Lange kop van de triceps (rekpositie)",
    "secundaireSpieren": [],
    "apparaat": "Dumbbell / Kabel",
    "gifUrl": "https://static.exercisedb.dev/media/1PK5Uo3.gif",
    "instructies": [
      "Houd het gewicht boven je hoofd en laat het achter je hoofd zakken.",
      "Strek je armen krachtig omhoog."
    ],
    "aandachtspunten": [
      "Houd je ellebogen dicht bij je hoofd."
    ]
  },
  "close_grip_bench": {
    "naam": "Close Grip Bench Press",
    "spiergroep": "Armen",
    "doelspier": "Triceps & Binnenkant borst",
    "secundaireSpieren": [
      "Schouders"
    ],
    "apparaat": "Barbell & Vlakke Bank",
    "gifUrl": "https://static.exercisedb.dev/media/3TZduzM.gif",
    "instructies": [
      "Pak de stang op schouderbreedte vast en laat hem zakken met ellebogen langs je zij.",
      "Druk krachtig uit vanuit je triceps."
    ],
    "aandachtspunten": [
      "Pak de stang niet té smal (minstens 30 cm) voor je polsen."
    ]
  },
  "dips_tricep": {
    "naam": "Dips (Tricep)",
    "spiergroep": "Armen",
    "doelspier": "Triceps",
    "secundaireSpieren": [
      "Borst",
      "Schouders"
    ],
    "apparaat": "Dip Station",
    "gifUrl": "https://static.exercisedb.dev/media/9WTm7dq.gif",
    "instructies": [
      "Blijf rechtop tijdens het zakken en duw jezelf omhoog met de focus op je triceps."
    ],
    "aandachtspunten": [
      "Rechtop blijven verplaatst spanning naar de triceps."
    ]
  },
  "diamond_push_up": {
    "naam": "Diamond Push-Up",
    "spiergroep": "Armen",
    "doelspier": "Triceps & Borst",
    "secundaireSpieren": [
      "Core"
    ],
    "apparaat": "Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/0br45wL.gif",
    "instructies": [
      "Plaats duimen en wijsvingers tegen elkaar in een ruitvorm en push up."
    ],
    "aandachtspunten": [
      "Houd je ellebogen dicht bij je lichaam."
    ]
  },
  "crunch": {
    "naam": "Crunch",
    "spiergroep": "Core",
    "doelspier": "Rechte buikspier (Rectus Abdominis)",
    "secundaireSpieren": [],
    "apparaat": "Matje / Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/03lzqwk.gif",
    "instructies": [
      "Lig op je rug met gebogen knieën en vingers bij je slapen.",
      "Rol je schouderbladen van de vloer door je ribben naar je bekken te trekken.",
      "Knijp 1 seconde aan en rol rustig terug."
    ],
    "aandachtspunten": [
      "Trek niet aan je nek."
    ]
  },
  "cable_crunch": {
    "naam": "Cable Crunch",
    "spiergroep": "Core",
    "doelspier": "Rechte buikspieren (met gewicht)",
    "secundaireSpieren": [],
    "apparaat": "Kabelstation & Touw",
    "gifUrl": "https://static.exercisedb.dev/media/03lzqwk.gif",
    "instructies": [
      "Kniel voor de kabel met het touw achter je nek.",
      "Rol je bovenlichaam naar beneden richting je knieën."
    ],
    "aandachtspunten": [
      "Beweeg vanuit je buikspieren, niet vanuit je heupen."
    ]
  },
  "plank": {
    "naam": "Plank",
    "spiergroep": "Core",
    "doelspier": "Diepe buikspieren & Core stabiliteit",
    "secundaireSpieren": [
      "Glutes",
      "Schouders"
    ],
    "apparaat": "Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Steun op onderarmen en tenen en houd je lichaam kaarsrecht als een plank."
    ],
    "aandachtspunten": [
      "Laat je heupen niet doorhangen."
    ]
  },
  "side_plank": {
    "naam": "Side Plank",
    "spiergroep": "Core",
    "doelspier": "Schuine buikspieren (Obliques)",
    "secundaireSpieren": [
      "Heupen"
    ],
    "apparaat": "Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Lig op je zij en duw je heupen omhoog in een rechte diagonale lijn."
    ],
    "aandachtspunten": [
      "Houd je heupen hoog."
    ]
  },
  "leg_raise": {
    "naam": "Hanging Leg Raise",
    "spiergroep": "Core",
    "doelspier": "Onderste buikspieren & Heupbuigers",
    "secundaireSpieren": [
      "Grip"
    ],
    "apparaat": "Optrekstang",
    "gifUrl": "https://static.exercisedb.dev/media/03lzqwk.gif",
    "instructies": [
      "Hang aan de stang en til je benen gestrekt omhoog tot horizontale positie.",
      "Laat gecontroleerd zakken zonder te zwaaien."
    ],
    "aandachtspunten": [
      "Kantel je bekken voor maximale buikspieractivatie."
    ]
  },
  "knee_raise": {
    "naam": "Knee Raise",
    "spiergroep": "Core",
    "doelspier": "Onderste buikspieren",
    "secundaireSpieren": [
      "Heupbuigers"
    ],
    "apparaat": "Optrekstang / Steun",
    "gifUrl": "https://static.exercisedb.dev/media/03lzqwk.gif",
    "instructies": [
      "Trek je knieën omhoog naar je borst en laat rustig zakken."
    ],
    "aandachtspunten": [
      "Toegankelijker alternatief voor de gestrekte leg raise."
    ]
  },
  "ab_rollout": {
    "naam": "Ab Rollout",
    "spiergroep": "Core",
    "doelspier": "Volledige buikwand",
    "secundaireSpieren": [
      "Lats",
      "Schouders"
    ],
    "apparaat": "Ab Wheel / Barbell",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Kniel en rol het buikspierwiel gecontroleerd naar voren met aangespannen core.",
      "Trek jezelf terug vanuit je buikspieren."
    ],
    "aandachtspunten": [
      "Houd je onderrug stabiel en trek hem niet hol."
    ]
  },
  "russian_twist": {
    "naam": "Russian Twist",
    "spiergroep": "Core",
    "doelspier": "Schuine buikspieren (Obliques)",
    "secundaireSpieren": [
      "Rechte buikspier"
    ],
    "apparaat": "Dumbbell / Gewicht",
    "gifUrl": "https://static.exercisedb.dev/media/03lzqwk.gif",
    "instructies": [
      "Zit met gebogen knieën, leun 45 graden achterover en draai je romp van links naar rechts."
    ],
    "aandachtspunten": [
      "Draai vanuit je schouders en ribbenkast."
    ]
  },
  "dead_bug": {
    "naam": "Dead Bug",
    "spiergroep": "Core",
    "doelspier": "Diepe core stabiliteit",
    "secundaireSpieren": [],
    "apparaat": "Matje / Lichaamsgewicht",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Lig op je rug met onderrug in de vloer gedrukt.",
      "Laat tegenovergestelde arm en been langzaam naar de grond zakken en wissel af."
    ],
    "aandachtspunten": [
      "Je onderrug blijft permanent op de vloer gedrukt."
    ]
  },
  "dragon_flag": {
    "naam": "Dragon Flag",
    "spiergroep": "Core",
    "doelspier": "Volledige Core (geavanceerd)",
    "secundaireSpieren": [
      "Lats"
    ],
    "apparaat": "Bankje",
    "gifUrl": "https://static.exercisedb.dev/media/03lzqwk.gif",
    "instructies": [
      "Lig op een bankje, grijp de rand achter je hoofd vast en til je hele lichaam als een stang omhoog."
    ],
    "aandachtspunten": [
      "Alleen op je schouderbladen steunen."
    ]
  },
  "treadmill": {
    "naam": "Loopband",
    "spiergroep": "Cardio",
    "doelspier": "Cardiovasculair & Benen",
    "secundaireSpieren": [
      "Kuiten",
      "Quadriceps"
    ],
    "apparaat": "Loopband",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Stel snelheid en helling in en loop of ren in een vloeiend ritme."
    ],
    "aandachtspunten": [
      "Houd een rechtopstaande houding aan."
    ]
  },
  "cycling": {
    "naam": "Stationaire Fiets",
    "spiergroep": "Cardio",
    "doelspier": "Cardiovasculair & Bovenbenen",
    "secundaireSpieren": [
      "Hamstrings"
    ],
    "apparaat": "Fiets",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Trap in een vloeiende cadans met constante trapweerstand."
    ],
    "aandachtspunten": [
      "Stel het zadel af op heuphoogte."
    ]
  },
  "rowing": {
    "naam": "Roeimachine",
    "spiergroep": "Cardio",
    "doelspier": "Volledig Lichaam (Benen, Rug & Cardio)",
    "secundaireSpieren": [
      "Armen",
      "Core"
    ],
    "apparaat": "Roeier",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Zet eerst af met je benen, leun licht naar achteren en trek de hendel naar je ribbenkast."
    ],
    "aandachtspunten": [
      "Volgorde: benen -> core -> armen."
    ]
  },
  "stair_climber": {
    "naam": "Stair Climber",
    "spiergroep": "Cardio",
    "doelspier": "Glutes, Quadriceps & Conditie",
    "secundaireSpieren": [
      "Kuiten"
    ],
    "apparaat": "Stairmaster",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Stap rechtop de treden op en vermijd leunen op de handsteunen."
    ],
    "aandachtspunten": [
      "Plaats je hele voet op de trede."
    ]
  },
  "jump_rope": {
    "naam": "Springtouw",
    "spiergroep": "Cardio",
    "doelspier": "Kuiten, Schouders & Conditie",
    "secundaireSpieren": [
      "Core"
    ],
    "apparaat": "Springtouw",
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "instructies": [
      "Spring licht op de bal van je voeten en draai het touw vanuit je polsen."
    ],
    "aandachtspunten": [
      "Spring slechts enkele centimeters van de grond."
    ]
  }
};
