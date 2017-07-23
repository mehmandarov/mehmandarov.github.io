---
title: "Hvordan lære opp ditt eget kamera"
layout: post
date: 2017-05-07 20:46 +0200
image: '/assets/images/posts-images/bird_hd.jpg'
description: Bildegjenkjenning gjort enkelt. Slik gjenkjenner du en bestemt gjenstand ved hjelp av et kamera og OpenCV eller TensorFlow
tag:
- iot
- machine learning
- norwegian
category: blog
star: false
author: rustam.mehmandarov
---
[\[English version – Engelsk versjon\]][16]

_Bildegjenkjenning gjort enkelt. Slik gjenkjenner du en bestemt gjenstand ved hjelp av et kamera._

- [Utfordringen](#utfordringen)
- [Litt teori](#litt-teori)
- [Hvor starter jeg?](#hvor-starter-jeg)
- [La oss kjøre bildegjenkjenning](#la-oss-kjøre-bildegjenkjenning)
- [Bonus: Video](#bonus-video)

---

## Utfordringen

Denne uken har jeg fått utfordringen å foreslå en løsning på følgende problem:

> *"Med en enkel datamaskin, som en Raspberry Pi, et kamera og et fuglebrett, lag et program som kan artsbestemme hvilke fugler som er innom brettet og spiser i løpet av en dag."*

Siden spørsmålet var av mer teoretisk art, bestemte jeg meg for å begrense dette innlegget til å introdusere byggeblokkene og gi en forklaring på hvordan du typisk kan bygge et slikt system.

Å gjenkjenne gjenstander er en ganske vanlig oppgave nå for tiden, og den har blitt løst på flere forskjellige måter, og med forskjellige tilnærminger. La oss se på hvordan dette virker.

> _**TL;DR**_ Det fins noen tradisjonelle måter å lage bilde- og gjenstandsgjenkjenning på, som i OpenCV, og det fins noen teknikker basert på Deep Learning, som i TensorFlow. Vil du vite mer? Fortsett å lese.

---

## Litt teori
De mer tradisjonelle prinsippene bak OpenCV for å oppdage er godt beskrevet i [dette blogginnlegget][1]{:target="_blank"}, så vel som i denne veiledningen for å gjenkjenne (hold dere fast!) [katter på bilder][2]{:target="_blank"}.

Mens [dette innlegget][4]{:target="_blank"} forklarer hvordan bildegjenkjenning virker i TensorFlow, som bruker en modell kalt dypt konvolverende nevrale nettverk, vil det også la deg [trene opp din egen bildeklassifiserer][3]{:target="_blank"}, slik som OpenCV.

![Training your own model][11]{: class="bigger-image" }
<figcaption class = "caption">Noen må lære opp modellen som du skal bruke til bildeklassifisering (-gjenkjenning).</figcaption>

---

## Hvor starter jeg?

I utgangspunktet har du to valg – du bør enten lære opp din egen modell eller finne en modell som har blitt lært opp av noen andre, og du vil kanskje alltid starte med å se etter en forhåndsopplært modell. Men jo mer spesifiserte bildeklassifiseringskravene dine er, jo høyere er sjansen for at du må lære opp din egen modell. Dette vil være det samme enten du velger OpenCV eller TensorFlow.

Siden vi vil kjøre modellen på en relativt enkel datamaskin, kan du vurdere å gjøre prosesseringen i skyen. Det bør imidlertid også være mulig å kjøre [OpenCV][5]{:target="_blank"} og [TensorFlow][6]{:target="_blank"} på den nyeste Raspberry Pi.

---

## La oss kjøre bildegjenkjenning

Nå vet du litt om teorien. La oss så ta en rask titt på hvordan vi kan lære opp modellene i våre behov.

> _**TL;DR**_ Måten dette virker på, er at du viser modellen ganske mange bilder av en gjenstand, og en tilsvarende mengde bilder uten gjenstanden på.


La oss si at du vil bruke modellen til å gjenkjenne fugler utenfor huset ditt i Norge. Et godt utgangspunkt vil da være å få en liste over de typiske artene som du mest sannsynlig ser i hagen din, og samle så mange bilder av hver art som mulig.

![Your own model in action][12]{: class="bigger-image" }
<figcaption class = "caption">Din opplærte modell i aksjon.</figcaption>

Her er hva du kan gjøre:

1. Start med å finne en liste over norske fugler på [Wikipedia][7]{:target="_blank"}, eller [Store Norske Leksikon][8]{:target="_blank"}.
2. Søk på nettet etter bilder av hver fugleart. Det kan være du vil automatisere dette arbeidet, og sørg for at du plukker ut bilder med de riktige opphavsrettstillatelsene.
3. Bruk disse bildene i opplæringen av din modell.
4. Sett opp din Raspberry Pi med et kamera og fuglebrett, og gjør deg klar til å identifisere fuglearter. Du bør optimalisere programvaren slik at bildeklassifiseringen ikke skjer hele tiden, men kun når man ser en bevegelse.

*Pro tip:* Det kan også være litt utfordrende å ta gode bilder av våre fjærkledde venner, så sørg for at kameraet ditt er godt plassert, og materen er på et godt opplyst sted. Uten å forstyrre dyrelivet, så klart.

Lurer du på om lignende systemer har blitt implementert eller om det er mulig? Svaret er ja. Her er det noen lenker til inspirasjon for videre lesning:

* [En fugleklassifiserer med tensorflow][15]{:target="_blank"}
* [Trene opp en fugleklassifiserer med Tensorflow og TFLearn][14]{:target="_blank"}
* [Kjøretøyklassifisering og -telling med OpenCV][9]{:target="_blank"}
* [Blomstergjenkjenning i naturen][10]{:target="_blank"} (på dansk)
* [Maskinlæring er morsomt! Del 3: Dypt konvolverende nevrale nettverk][13]{:target="_blank"}. (Ta også gjerne en titt på de andre delene i denne artikkelserien.)

Prøv nå å sette alt dette sammen, og fortell meg gjerne hvordan det går!

*Lykke til!*

---

## Bonus: Video

En video vi har laget av mine tegninger og en kort forklaring på hvordan dette virker.

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/kOXBCWvmtD4?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>

---

[1]: http://www.learnopencv.com/image-recognition-and-object-detection-part1/
[2]: http://www.pyimagesearch.com/2016/06/20/detecting-cats-in-images-with-opencv/
[3]: https://research.googleblog.com/2016/03/train-your-own-image-classifier-with.html
[4]: https://www.tensorflow.org/tutorials/image_recognition
[5]: http://www.pyimagesearch.com/2016/04/18/install-guide-raspberry-pi-3-raspbian-jessie-opencv-3/
[6]: https://svds.com/tensorflow-image-recognition-raspberry-pi/
[7]: https://en.wikipedia.org/wiki/List_of_birds_of_Norway
[8]: https://snl.no/Fugler_i_Norge
[9]: https://www.youtube.com/watch?v=S-W9tMZu8PU
[10]: http://www.fyens.dk/article/3141726?fbrefresh=true
[11]: {{ site.url }}/assets/images/posts-images/2017-04-29-cartoon_image_processing_1.png
[12]: {{ site.url }}/assets/images/posts-images/2017-04-29-cartoon_image_processing_2.png
[13]: https://medium.com/@ageitgey/machine-learning-is-fun-part-3-deep-learning-and-convolutional-neural-networks-f40359318721
[14]: http://www.bitfusion.io/2016/08/31/training-a-bird-classifier-with-tensorflow-and-tflearn/
[15]: https://www.oreilly.com/learning/dive-into-tensorflow-with-linux
[16]: {{ site.url }}/how-to-train-your-camera/
