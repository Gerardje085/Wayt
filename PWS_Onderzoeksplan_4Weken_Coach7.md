# Profielwerkstuk Onderzoeksplan – Wayt (NLT & Natuurkunde)

**Titel:** Progressive Overload op Gevoel versus Algoritme: Krachtontwikkeling, Mechanische Arbeid en Biomechanische Video-analyse met Coach 7  
**Vakken:** Natuur, Leven en Technologie (NLT) & Natuurkunde  
**Onderzoekers:** Zwen & Fiebe  
**Looptijd praktijkonderzoek:** 4 weken (12 trainingssessies & 5 Coach 7-meetmomenten, t/m eind december)  
**Instrumenten:** Wayt PWA (web-app + Progressive Overload Simulator) & Coach 7 (video-analyse)

---

## 1. Hoofdvraag

> **Wat is het verschil in krachtontwikkeling (geschatte 1RM), trainingsvolume en mechanische arbeid na 4 weken tussen trainen op gevoel en een algoritmisch progressive-overload model, en hoe veranderen de gewrichtshoek en hoeksnelheid tijdens de uitvoering?**

---

## 2. Deelvragen

1. **Krachtontwikkeling & trainingsvolume (Wayt-app vs. algoritme):**  
   Hoe ontwikkelt de kracht (geschatte 1RM) en het trainingsvolume zich over 4 weken (12 trainingen) bij sporters die op gevoel trainen vergeleken met het progressive-overload algoritme van Wayt?

2. **Kinematica & mechanische arbeid (Coach 7):**  
   Hoe veranderen de gewrichtshoek $\alpha(t)$ en hoeksnelheid $\omega(t)$ gedurende één set (vermoeidheid) en over 5 meetmomenten in Coach 7, en wat betekent dit voor de nauwkeurigheid van de berekende mechanische arbeid ($W = m \cdot g \cdot s$)?

3. **Biomechanica & krachtmoment:**  
   Welke rol speelt het krachtmoment ($M = F \cdot r$) bij wisselende gewrichtshoeken tijdens een krachtoefening zoals de Leg Extension?

---

## 3. Natuurkundig & Biomechanisch Kader

| Grootheid | Symbool / Formule | Eenheid | Toepassing in het onderzoek |
| :--- | :--- | :--- | :--- |
| **Geschatte 1RM (Epley)** | $\text{1RM} = m \cdot \left(1 + \frac{\text{reps}}{30}\right)$ | $\text{kg}$ | Vergelijking maximale krachtontwikkeling tussen praktijk en simulatie |
| **Trainingsvolume** | $V = \text{sets} \times \text{reps} \times m$ | $\text{kg}$ | Totale verplaatste massa per sessie en over 4 weken |
| **Mechanische arbeid** | $W = m \cdot g \cdot s \cdot \text{reps}$ ($g = 9{,}81\text{ m/s}^2$) | $\text{J}$ | Vergelijking tussen standaard-ROM en in Coach 7 gemeten slaglengte $s$ |
| **Gewrichtshoek** | $\alpha(t)$ | $^{\circ}$ of $\text{rad}$ | Range of Motion (ROM) en bewegingsuitslag per herhaling in Coach 7 |
| **Hoeksnelheid** | $\omega(t) = \frac{d\alpha}{dt}$ | $\text{rad/s}$ | Maat voor concentrische snelheid en vermoeidheidsverval binnen een set |
| **Krachtmoment** | $M = F \cdot r = F \cdot L \cdot \sin(\theta)$ | $\text{N}\cdot\text{m}$ | Invloed van de momentarm $r$ op de benodigde spierkracht bij verschillende kniehoeken (o.a. Leg Extension) |

---

## 4. Methode & Praktijkopzet (4 weken)

### 4.1 Praktijkgroep ("Trainen op gevoel")
- **Proefpersonen:** 3 deelnemers (**Fiebe + 2 vrienden**).
- **Duur en frequentie:** **4 weken**, **3 trainingen per week** (**12 sessies** per proefpersoon).
- **Oefeningen & standaard slaglengte ($s$):**
  - **Bench Press** (standaard $s = 0{,}40\text{ m}$)
  - **Lat Pulldown** (standaard $s = 0{,}60\text{ m}$)
  - **Leg Extension** (standaard $s = 0{,}50\text{ m}$)
- **Werkwijze:** De 3 proefpersonen trainen vrij op gevoel (zelf gekozen gewichten, sets en herhalingen) en loggen elke uitgevoerde set direct in de **Wayt web-app (PWA)**. Hierdoor worden datum, sessie-ID, setnummer, set-type, gewicht, herhalingen, volume en arbeid zonder dataverlies opgeslagen in Supabase.

### 4.2 Algoritmische tegenhanger (Wayt-simulator)
- **Onderzoeker:** **Zwen** voert vanuit het onderzoekersportaal in Wayt (`admin.tsx`) simulaties uit die starten vanaf **exact dezelfde startgewichten** (Top Set van sessie 1) als de proefpersonen.
- **Basisregel Wayt-algoritme (`berekenVoorschrift`):**
  - Startschema: $3 \times 10$ herhalingen.
  - $\ge 3 \times 10$ gehaald $\rightarrow$ gewicht $+2{,}5\text{ kg}$, nieuw doel $3 \times 8$.
  - $\ge 3 \times 8$ of $3 \times 9$ gehaald $\rightarrow$ gewicht gelijk houden, doel $3 \times 10$.
  - Minder dan $3 \times 8$ $\rightarrow$ deload van $-2{,}5\text{ kg}$, doel $3 \times 10$.
- **3 gesimuleerde scenario's over 12 sessies:**
  1. **Optimaal:** haalt elke sessie exact het streefdoel.
  2. **Realistisch:** wisselt na gewichtsverhoging af tussen 8, 9 en 10 herhalingen voordat opnieuw wordt verhoogd.
  3. **Vermoeidheid (met deload):** valt in sessie 5 en sessie 9 terug naar 7 herhalingen, wat een automatische deload van $-2{,}5\text{ kg}$ triggert.
- **Coach 7-koppeling in de simulator:** De werkelijk gemeten slaglengte $s$ uit Coach 7 kan in de Wayt-simulator handmatig worden ingevoerd naast het startgewicht, zodat het effect op de totale mechanische arbeid (in Joules) direct wordt doorgerekend voor zowel het algoritme als de echte trainingsdata.

---

## 5. Practicumvoorschrift Coach 7 (5 Meetmomenten)

### 5.1 Meetmomenten
Zwen voert op **5 vaste meetmomenten** een video-analyse uit in **Coach 7** bij **Fiebe**, telkens gedurende **1 volledige werkset per oefening** (Bench Press, Lat Pulldown en Leg Extension):

| Meetmoment | Timing | Doel |
| :--- | :--- | :--- |
| **M0 (Nulmeting)** | Dag 0 (start onderzoek) | Vastleggen uitgangssituatie: start-ROM, slaglengte $s$, $\alpha(t)$ en $\omega(t)$ |
| **M1** | Eind Week 1 (na sessie 3) | Eerste gewenning, techniekstabiliteit en vermoeidheidsverloop |
| **M2** | Eind Week 2 (na sessie 6) | Halverwege-meting: controle op aanpassing in ROM en hoeksnelheid |
| **M3** | Eind Week 3 (na sessie 9) | Invloed van opgelopen trainingsbelasting op $\omega(t)$ en uitvoeringssnelheid |
| **M4 (Eindmeting)** | Eind Week 4 (na sessie 12) | Eindvergelijking over 4 weken en ijking totale arbeid $W = m \cdot g \cdot s$ |

### 5.2 Gestandaardiseerde meetopstelling
Om parallaxfouten en variatie tussen meetdagen te minimaliseren gelden bij elke opname de volgende vaste eisen:
- **Camerapositie:** Camera statisch op statief, **loodrecht ($90^{\circ}$)** op het zij-aanzicht van het bewegingsvlak, op gelijke afstand en hoogte per toestel.
- **Schaalijking:** Zichtbare **50 cm ($0{,}50\text{ m}$) ijkingsmarkering** (meetlat of contrasttape) in exact hetzelfde vlak als de beweging/gewichtsbaan.
- **Toestelinstelling:** Vaste stoelhoogte, rugleuning- en kussenstand worden bij M0 genoteerd en bij M1 t/m M4 identiek ingesteld.
- **Contrastpunten op de gewrichten:**
  - **Leg Extension:** heup (trochanter major) – knie (laterale epicondyl) – enkel (laterale malleolus).
  - **Bench Press & Lat Pulldown:** schouder (acromion) – elleboog (laterale epicondyl) – pols (processus styloideus).

### 5.3 Verwerking in Coach 7
1. Importeer de opname in Coach 7 en stel de schaal in met behulp van de $50\text{ cm}$ ijkingsmarkering.
2. Track de drie gewrichtspunten (en het bewegingspunt van de stang/gewichtsarm) over de volledige werkset.
3. Bepaal per herhaling de gewrichtshoek $\alpha(t)$, de hoeksnelheid $\omega(t)$ (eerste afgeleide van $\alpha(t)$) en de verticale verplaatsing/slaglengte $s$.
4. Vergelijk de eerste en laatste herhalingen binnen de set (vermoeidheidseffect: daling in $\omega_{\max}$ en/of verkorting van ROM) en voer de gemeten slaglengte $s$ in de Wayt-simulator in om het verschil met de vaste standaard-ROM te kwantificeren.

---

## 6. Taakverdeling & Tijdlijn (t/m eind december)

> **Aandachtspunt taakverdeling:** Rekening houdend met het herstel van Zwen's schouderblessure voert Zwen geen zware belastingstesten uit, maar neemt hij de volledige technische realisatie, video-opnames, Coach 7-analyses en simulaties op zich. Fiebe voert de trainingen tijdens de 5 Coach 7-meetmomenten uit en coördineert de dataverzameling met de 2 vrienden.

| Periode | Fase | Werkzaamheden Zwen | Werkzaamheden Fiebe | Concrete oplevering |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1 (start / eind nov)** | Voorbereiding, deployment & M0 | Wayt PWA deployen op Vercel, Supabase-database & export testen, meetopstelling voorbereiden, M0 filmen & ijken in Coach 7 | Accounts aanmaken met 2 vrienden, vaste toestelinstellingen noteren, nulmeting (M0) uitvoeren en Week 1-sessies loggen | Werkende Wayt PWA, M0 Coach 7-metingen, startgewichten vastgelegd |
| **Week 2 (begin dec)** | Trainingsweek 1–2 & M1/M2 | Datakwaliteit controleren in `admin.tsx`, M1 en M2 filmen en gewrichtspunten tracken in Coach 7 | 3×/week trainen op gevoel + loggen in Wayt, 2 vrienden herinneren aan compleet loggen, M1 & M2 uitvoeren | 6 sessies per deelnemer gelogd, Coach 7-grafieken $\alpha(t)$ en $\omega(t)$ M0–M2 |
| **Week 3 (midden dec)** | Trainingsweek 3 & M3 | M3 filmen & analyseren in Coach 7, eerste vergelijking standaard-ROM vs. gemeten slaglengte $s$ in Wayt-simulator | 3×/week trainen op gevoel + loggen, voortgang 2 vrienden bewaken, M3 uitvoeren | 9 sessies gelogd, tussentijdse arbeid- en 1RM-vergelijking |
| **Week 4 (voor kerst)** | Trainingsweek 4, M4 & CSV-export | M4 eindmeting filmen & afronden in Coach 7, volledige onderzoeksdata + simulaties exporteren naar CSV, grafieken genereren | Laatste trainingsweek afronden (sessie 10–12), M4 uitvoeren, controleren of alle data van de 2 vrienden compleet is | Volledige dataset (12 sessies × 3 deelnemers) + 5 Coach 7-meetmomenten |
| **Eind december (inleverfase)** | Analyse, discussie & evaluatie | Resultatenverwerking (1RM, volume, arbeid $W$, $\alpha(t)$, $\omega(t)$, krachtmoment $M$), foutendiscussie (parallax, standaard-ROM) & eindredactie | Medeschrijven methode, resultaten vanuit sportersperspectief, conclusie, reflectie en evaluatie van de samenwerking | Definitief PWS-verslag (NLT & Natuurkunde) klaar voor inlevering |
