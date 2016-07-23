---
title: "Hva skjer med koden din etter at du har skrevet den ferdig?"
layout: post
date: 2016-05-16 9:45
tag:
- automation
- deploy
- continuous delivery
- build
- testing
- norwegian
blog: true
star: false
author: rustam.mehmandarov
---

_**Update 21.05.2016:** [English version][3] of this article._

_Jeg har skrevet en artikkel for studentmagasinet INDEX som utgis ved Institutt for Informatikk (Ifi), Universitetet i Oslo. Den ble publisert 30.04.2016, og er tilgjengelig for alle studenter på Ifi. Nå vil jeg også å dele den med alle dere andre som ikke kunne sikre dere en utgave av INDEX på fredag. Enjoy!_

- [Automatiser](#automatiser)
- [Automatiske tester og sjekk av kodekvalitet](#automatiske-tester-og-sjekk-av-kodekvalitet)
- [Miljøer](#miljer)
- [Versjoner](#versjoner)
- [Veien videre](#veien-videre)

![The Screenshot of the Article] [1]

---

Tenk deg følgende scenario: Du er en student og har fått i oppgave om å skrive enten et helt nytt program, eller gjøre noen endringer i noe kode som finnes fra før av. Så, hvordan går du fram? Du begynner å skrive kode, du kompilerer og kjører den med jevne mellomrom for å teste at den fungerer og gjør det den skal. Du skriver mer, du kjører den igjen. Slik fortsetter du til du er fornøyd og koden skal leveres. Etter det pakker du koden din pent i en arkiv med litt dokumentasjon, laster den opp på en side hvor det skal leveres og venter på tilbakemelding. Høres det kjent ut?

Prosessen er vel ikke så langt unna det du vil oppleve i arbeidslivet, bare i miniatyrform. Du har noen som bestiller en type funksjonalitet – i dette tilfelle din lærer, men senere en kunde eller produkteier – og du har en eller flere leveranser som skal leveres til den som har bestilt jobben. Fra et funksjonelt perspektiv vil du være sikker på tre ting – at den bestilte funksjonaliteten er med, at den ikke ødelegger for noe annet og at koden vil oppføre seg på samme måte når bestilleren kjører det hos seg.

Den enkle «kode-teste-kode»-metoden fungerer fint for små oppgaver, men hva ville du gjort hvis du skulle jobbe på et stort prosjekt hvor flere jobber på forskjellige deler av koden? Hvordan kan du sjekke at koden din fortsatt fungerer når du har gjort dine endringer? Hvordan kan du være sikker på at dine endringer ikke har ødelagt andres kode?

Og, hvordan kan du sjekke at koden som fungerer på din maskin fortsatt fungerer når du leverer den fra deg?

Velkommen til min arbeidshverdag. Jeg jobber ofte med store datasystemer som består av mange hundre tusener kodelinjer og med flere titalls utviklere som jobber med forskjellige deler av den koden. I tillegg til å være teknisk prosjektleder med overordnet ansvar for blant annet applikasjonsarkitektur, bygg, og miljøer den kjører på, har jeg samtidig hatt rollen som leveranseansvarlig. Sistnevnte har ansvaret med å til slutt pakke all koden og levere den til kunden. Ved hver leveranse må man passe på at alle biter er med, at de fungerer som de skal og at mottakeren av pakken vil kunne installere det på sitt system uten noen overraskelser.

---

## Automatiser

En prosess med å bygge, deploye og levere et system består ofte av flere steg og de kan som regel automatiseres. Det er mange årsaker til at man ønsker automatisering. Den ene årsaken er at det skal være enklere for deg og alle andre å bygge systemet – det korter ned tiden det tar å gjøre det, ergo å teste en endring du har gjort i koden. Den andre årsaken er at det kan gjøre det lettere for andre å ta over eller hjelpe til på et prosjekt uten å måtte sette seg inn i hele byggeprosessen. Det vil også gjøre det lettere å bygge med forskjellige konfigurasjoner dersom man ønsker det. I tillegg til alt dette, vil det også eliminere den menneskelige faktoren i hele prosessen. Vi mennesker kan gjøre feil, og ved å automatisere manuelt arbeid fjerner vi en kilde for en del feil.

Automatisering kan oppnås ved hjelp av forskjellige verktøy. Alt fra enkle make- og shell-skript til ganske avanserte byggeverktøy som Apache Maven og Gradle kan hjelpe deg, litt avhengig av oppgaven som skal gjøres. Oftest blir det en kombinasjon av noen ovennevnte verktøy. Disse kan hjelpe deg både med generell automatisering av bygge- og deploy-prosessen, og med automatisering av punktene under.

![CI to the Rescue][2]
<figcaption class="caption">Illustrasjon laget etter mine tegninger, og for denne artikkelen av Mahasty Assi</figcaption>

---

## Automatiske tester og sjekk av kodekvalitet

Når koden din er skrevet og byggingen av den er et knappetrykk eller en skriptkjøring unna, kan du begynne å se på en annen viktig del av automatisering – kjøring av tester og sjekk av kodekvalitet. De automatiske testene kan være både på lavnivå – enhetstester – og på funksjonell nivå. Enhetstester sjekker at metodene dine fungerer som de skal, for eksempel å returnere riktig svar, gitt noen inputparametre. De funksjonelle testene vil teste systemet som en svart boks. Her vil du få svar om systemet ditt fortsatt kan utføre et sett med bestemte oppgaver. Det finnes også integrasjonstester som kan og bør automatiseres, og disse brukes for å sjekke at systemet snakker med og til andre systemer på den måten det var tiltenkt.

Uansett type tester kan disse, dersom de feiler, fortelle deg om at noe dramatisk har skjedd i ditt system og om at systemet har sluttet å oppføre seg som forventet. Det vil også gi deg en mulighet til å oppdage potensielle feil mye tidligere i utviklingsprosessen.

En annen måte å oppdage skjulte problemer er å kjøre statisk kodeanalyse som kan oppdage kjente mønstre for feil, sikkerhetssvakheter, uvaner eller unødvendig kompleksitet.

---

## Miljøer

Når du utvikler et system bør du vite hvilket miljø og oppsett dette vil kjøre på når systemet går live, dvs. legges ut i produksjonsmiljøet. Denne informasjonen kan du bruke til å sette opp tilsvarende miljøer for utvikling, og spesielt med tanke på testing. Dette er nødvendig for å være i stand til å oppdage feil som vil kunne oppstå kun med et bestemt oppsett, eller spesifikk hardware. Når disse miljøene er satt opp kan du automatisere utrulling av din kode til disse miljøene. Dette kan være veldig praktisk, og spare deg for mye tid. Tenk at du sjekker inn en endring (for du bruker vel et versjonskontrollsystem, ikke sant?), og vips, er det ute på et passende miljø, klar til å testes eller demonstreres.

---

## Versjoner

Versjonering av koden vil gjøre at du lett kan svare på to viktige spørsmål:

* Hvilken versjon av koden kjører her?
* Hvilken funksjonalitet er en del av bestemt versjon?

Begge disse spørsmålene er noe du kommer til å spørre deg selv og vil bli spurt om fra andre. Svarene på disse vil hjelpe deg når du skal jobbe med feil som blir fikset eller oppdaget, eller ny funksjonalitet som blir rullet ut. Dersom du lager et større produkt, vil du også få bruk for disse når du skal lage Release Notes for den nyeste versjonen. Versjoner vil også hjelpe deg å holde styr på en oppdatert dokumentasjon for ditt system.

---

## Veien videre

Automatisering av bygg og deploy er et veldig stort tema. Punktene som jeg nevner her kan brukes som et springbrett, en slags sjekkliste for et bedre system. Du trenger ikke gjøre alt på en gang, eller gå i dybden på alle punkter, men start et sted og jobb deg videre mot full automatisering.

Disse punktene – og litt mer – er en del av en kontinuerlig leveranseprosess som skal bidra til at det kun vil ta noen minutter fra du sjekker inn en endring til det er ute i produksjon. Så langt trenger du ikke å gå i første omgang, men det kan jo være noe å strekke seg etter? Men det disse punktene kan gjøre med en gang er å forenkle din hverdag så vel som hele prosessen rundt håndtering av et system, slik at du kan bruke mer tid på det du liker best, nemlig programmering!


_Denne artikkelen ble publisert i magasinet INDEX (2. utgave, 2016), Institutt for Informatikk, Universitetet i Oslo._

[1]: {{ site.url }}/assets/images/posts-images/2016-05-16-hva-skjer-med-koden-din etter-at-du-har-skrevet-den-ferdig_article-2016-04-27_full.png
[2]: {{ site.url }}/assets/images/posts-images/2016-05-16-hva-skjer-med-koden-din etter-at-du-har-skrevet-den-ferdig_ci-superhero.png
[3]: {{ site.url }}/what-happens-to-your-code-after-a-commit/