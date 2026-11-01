import { supplementaryArticleMedia } from "./supplementaryMedia";
import { worldHistoryArticleMedia } from "./worldHistoryMedia";
import { astronomyArticleMedia } from "./astronomyMedia";
import { architectureArticleMedia } from "./architectureMedia";

/**
 * Additional inline illustrations for ΓΝΩΣΗ lessons.
 * Images are served from Wikimedia Commons; each figure displays a credit
 * that links to the corresponding Commons file page and licence information.
 */
export type InlineArticleImage = {
  afterParagraphCount?: number;
  /** Stable optional anchor; preferable for editorially revised articles. */
  afterParagraphId?: string;
  url: string;
  caption: string;
  credit: string;
  creditUrl: string;
  resizeMode?: "cover" | "contain";
};

function commonsFileUrl(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`;
}

function commonsPageUrl(filename: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replace(/ /g, "_"))}`;
}

export const inlineArticleMedia: Record<string, InlineArticleImage[]> = {
  ...architectureArticleMedia,
  ...astronomyArticleMedia,
  ...worldHistoryArticleMedia,
  ...supplementaryArticleMedia,
  "perception-eyes-not-cameras": [{
    afterParagraphId: "retina-fovea",
    url: commonsFileUrl("Human photoreceptor distribution.svg"),
    resizeMode: "contain",
    caption: "Σχηματική κατανομή κωνίων (συνεχής γραμμή) και ραβδίων (διακεκομμένη) ως προς την απόσταση από το κέντρο του βλέμματος. Τα κενά στο γράφημα αντιστοιχούν στο φυσιολογικό τυφλό σημείο, το θέμα του επόμενου μαθήματος. Άγγιξε για μεγέθυνση.",
    credit: "Cmglee / Wikimedia Commons · CC BY-SA 3.0",
    creditUrl: commonsPageUrl("Human photoreceptor distribution.svg"),
  }],
  "peloponnesian-war": [
  {
    "afterParagraphId": "war-12",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Pylos%20Sphacteria%2020230925%20113521.jpg?width=1200",
    "resizeMode": "contain",
    "caption": "Η ανατολική ακτή της Σφακτηρίας στον κόλπο του Ναυαρίνου (σύγχρονη φωτογραφία). Η γεωγραφία βοηθά να κατανοήσουμε τον περιορισμένο χώρο των επιχειρήσεων του 425 π.Χ., όχι να ανασυνθέσουμε ακριβώς κάθε θέση στρατιωτών. Άγγιξε για μεγέθυνση.",
    "credit": "Rigorius / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2023",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Pylos_Sphacteria_20230925_113521.jpg"
  },
  {
    "afterParagraphId": "war-23",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Piazza%20Duomo%2C%20center%20of%20Ortigia%2C%20Syracuse%2C%2012M1791.jpg?width=1200",
    "resizeMode": "contain",
    "caption": "Στην Ορτυγία των Συρακουσών, το αρχαίο ιερό της Αθηνάς ενσωματώθηκε αργότερα στον χριστιανικό ναό. Η φωτογραφία του σημερινού χώρου δεν είναι εικόνα της πολιορκίας του 415–413 π.Χ. Άγγιξε για μεγέθυνση.",
    "credit": "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2012",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Piazza_Duomo,_center_of_Ortigia,_Syracuse,_12M1791.jpg"
  }
],
  "athenian-empire": [
  {
    "afterParagraphId": "empire-04",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Plan%20Delos%20Sacred%20Area%20colored.svg?width=1200",
    "resizeMode": "contain",
    "caption": "Σύγχρονη σχεδιαστική αποτύπωση του αρχαιολογικού ιερού χώρου της Δήλου, με μνημεία διαφορετικών περιόδων. Δεν είναι σχέδιο του 478 π.Χ. ούτε τόπος ταυτοποιημένης ιδρυτικής συνεδρίασης. Άγγιξε για μεγέθυνση.",
    "credit": "Tomisti / Wikimedia Commons · CC BY-SA 4.0 · 2016 (ενημέρωση 2024)",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Plan_Delos_Sacred_Area_colored.svg"
  },
  {
    "afterParagraphId": "empire-16",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/EPMA-IGI%283%29273-280-Tribute%20list%202-2.JPG?width=1200",
    "resizeMode": "contain",
    "caption": "Δεύτερη μεγάλη ομάδα καταλόγων απαρχών για τα έτη 439/8–432/1 π.Χ., IG I³ 273–280, Επιγραφικό Μουσείο (EM 6857+6648). Το καταγεγραμμένο ένα εξηκοστό δεν αποτελεί πλήρη ισολογισμό της αθηναϊκής πολιτείας. Άγγιξε για μεγέθυνση.",
    "credit": "Marsyas / Επιγραφικό Μουσείο / Wikimedia Commons · CC BY-SA 3.0 · φωτογραφία 2007",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:EPMA-IGI(3)273-280-Tribute_list_2-2.JPG"
  }
],
  "persian-wars-greek-world": [
    {
      "afterParagraphId": "persian-03",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Behistun%20inscription.jpg?width=1200",
      "resizeMode": "contain",
      "caption": "Το πολύγλωσσο ανάγλυφο και επιγραφή του Δαρείου Α΄ στο Μπεχιστούν (φωτογραφία 2018). Μαρτυρεί βασιλική ιδεολογία, όχι κάποια από τις ελληνικές μάχες. Άγγιξε για μεγέθυνση.",
      "credit": "Mahdimanavimvi / Wikimedia Commons · CC BY-SA 4.0 · 2018",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:Behistun_inscription.jpg"
    },
    {
      "afterParagraphId": "persian-11",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/The%20tumulus%20(tomb)%20of%20the%20Athenians%20at%20Marathon.jpg?width=1200",
      "resizeMode": "contain",
      "caption": "Ο τύμβος των Αθηναίων στον Μαραθώνα (φωτογραφία 2019): τεκμήριο ταφής και μνημόνευσης, όχι πλήρης χάρτης των κινήσεων του 490 π.Χ. Άγγιξε για μεγέθυνση.",
      "credit": "George E. Koronaios / Wikimedia Commons · CC0 1.0 · 2019",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:The_tumulus_(tomb)_of_the_Athenians_at_Marathon.jpg"
    },
    {
      "afterParagraphId": "persian-16",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Strait%20of%20Salamis.jpg?width=1200",
      "resizeMode": "contain",
      "caption": "Τα στενά της Σαλαμίνας όπως φαίνονται σήμερα (φωτογραφία 2019). Η σύγχρονη ακτογραμμή δεν αποτυπώνει αυτολεξεί τις συνθήκες του 480 π.Χ. Άγγιξε για μεγέθυνση.",
      "credit": "Jona Lendering / Livius.org / Wikimedia Commons · CC0 1.0 · 2019",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:Strait_of_Salamis.jpg"
    },
    {
      "afterParagraphId": "persian-23",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Serpent%20Column%20Istanbul.jpg?width=1200",
      "resizeMode": "contain",
      "caption": "Η χάλκινη Στήλη των Όφεων, σήμερα στην Κωνσταντινούπολη (φωτογραφία 2014). Το πολεμικό ανάθημα στήθηκε αρχικά στους Δελφούς και μεταφέρθηκε αιώνες αργότερα. Άγγιξε για μεγέθυνση.",
      "credit": "Loriensong / Wikimedia Commons · CC BY-SA 4.0 · 2014",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:Serpent_Column_Istanbul.jpg"
    }
  ],
  "greek-sanctuaries-games": [
  {
    "afterParagraphId": "sanctuary-03",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Offerings%20Olympia.JPG?width=1200",
    "resizeMode": "contain",
    "caption": "Χάλκινα και πήλινα ζωόμορφα αναθήματα του 9ου–8ου αιώνα π.Χ., από τις στάχτες του βωμού του Δία στην Ολυμπία. Η ταυτότητα των αφιερωτών δεν είναι γνωστή. Άγγιξε για μεγέθυνση.",
    "credit": "Muriel Pécastaing-Boissière / Wikimedia Commons · CC BY-SA 3.0 · 2009",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Offerings_Olympia.JPG"
  },
  {
    "afterParagraphId": "sanctuary-09",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Sanctuary%20of%20Apollo%20at%20Delphi%20from%20the%20Phaedriades%2001.jpg?width=1200",
    "resizeMode": "contain",
    "caption": "Το ιερό του Απόλλωνα και το στάδιο από τις Φαιδριάδες (φωτογραφία 1990). Τα ορατά λείψανα δεν ανήκουν στην ίδια εποχή. Άγγιξε για μεγέθυνση.",
    "credit": "Mark Landon / Wikimedia Commons · CC BY-SA 4.0 · λήψη 1990, ψηφιοποίηση 2021",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Sanctuary_of_Apollo_at_Delphi_from_the_Phaedriades_01.jpg"
  },
  {
    "afterParagraphId": "sanctuary-14",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Treasury%20of%20the%20Athenians%20at%20Delphi.jpg?width=1200",
    "resizeMode": "contain",
    "caption": "Ο θησαυρός των Αθηναίων στους Δελφούς (2011), με σημαντικό τμήμα της σημερινής εμφάνισής του να οφείλεται σε νεότερη αναστήλωση. Άγγιξε για μεγέθυνση.",
    "credit": "Bernard Gagnon / Wikimedia Commons · CC BY-SA 4.0 · 2011",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Treasury_of_the_Athenians_at_Delphi.jpg"
  }
],
  "greek-war-hoplites": [
  {
    "afterParagraphId": "hoplite-07",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Britishmuseumbronzecorinthianhelmet.jpg?width=1200",
    "resizeMode": "contain",
    "caption": "Χάλκινο κράνος κορινθιακού τύπου, περ. 500 π.Χ., από την Κόρινθο. Βρετανικό Μουσείο, αρ. 1873,0910.1. Ο τύπος δεν αποδεικνύει την καταγωγή του κατόχου. Άγγιξε για μεγέθυνση.",
    "credit": "Ealdgyth / Wikimedia Commons · CC BY-SA 3.0 · 2010",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Britishmuseumbronzecorinthianhelmet.jpg"
  },
  {
    "afterParagraphId": "hoplite-10",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Detail%20from%20the%20Chigi-vase%20cropped%20better%20colors.png?width=1200",
    "resizeMode": "contain",
    "caption": "Λεπτομέρεια της κορινθιακής όλπης Chigi, περ. 650–640 π.Χ. Στη σύγχρονη ψηφιακή εκδοχή έχει γίνει περικοπή και χρωματική διόρθωση. Η ζωγραφική δεν είναι καταγραφή συγκεκριμένης μάχης. Άγγιξε για μεγέθυνση.",
    "credit": "Ζωγράφος Chigi · ψηφιακή επεξεργασία / Wikimedia Commons · CC0",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Detail_from_the_Chigi-vase_cropped_better_colors.png"
  }
],
  "athens-law-courts": [
    {
      afterParagraphId: "courts-14",
      url: commonsFileUrl("AGMA Kleroterion 2.jpg"),
      resizeMode: "contain",
      caption: "Λίθινο κληρωτήριο από την Αρχαία Αγορά, στο ομώνυμο μουσείο. Οι σειρές υποδοχών συνδέονται με την επιλογή κριτών· η ακριβής διαδικασία ερμηνεύεται μαζί με τα γραπτά τεκμήρια. Άγγιξε για μεγέθυνση.",
      credit: "Dorieo / Wikimedia Commons · CC BY-SA 3.0 · φωτογραφία 2007, επεξεργασία 2018",
      creditUrl: commonsPageUrl("AGMA Kleroterion 2.jpg"),
    },
    {
      afterParagraphId: "courts-21",
      url: commonsFileUrl("Athenian oficial secret ballots - AGMA.jpg"),
      resizeMode: "contain",
      caption: "Χάλκινα ψηφοδέλτια με συμπαγή ή διάτρητο άξονα, περίπου 300 π.Χ., Μουσείο Αρχαίας Αγοράς. Χρησίμευαν σε δικαστική ψηφοφορία και δεν είναι όστρακα εξοστρακισμού. Άγγιξε για μεγέθυνση.",
      credit: "Dorieo / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2007",
      creditUrl: commonsPageUrl("Athenian oficial secret ballots - AGMA.jpg"),
    },
  ],
  "athens-who-voted": [
    {
      "afterParagraphId": "athens-07",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Greece%20(ancient)%20Attica%20Demos%20II-el.svg?width=1200",
      "resizeMode": "contain",
      "caption": "Σύγχρονος ελληνόγλωσσος χάρτης πιθανών θέσεων των δήμων της Αττικής, με περιοχές αβέβαιου εντοπισμού. Δεν αποτελεί αρχαία απογραφή κατοίκων. Άγγιξε για μεγέθυνση.",
      "credit": "Fulvio314 · ελληνική απόδοση Gts-tg / Wikimedia Commons · CC BY-SA 4.0 (2016)",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:Greece_(ancient)_Attica_Demos_II-el.svg"
    },
    {
      "afterParagraphId": "athens-23",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Honorary%20stele%20depicting%20Athena%20and%20the%20Athenian%20Deme%20(4th%20cent.%20B.C.)%20at%20the%20National%20Archaeological%20Museum%20of%20Athens%20on%2022%20July%202018.jpg?width=1200",
      "resizeMode": "contain",
      "caption": "Τιμητική στήλη για τον Ευφρώνα (ψηφίσματα 323/322 και 318/317 π.Χ.), με τη θεά Αθηνά και προσωποποίηση του Δήμου. Αποδεικνύει ειδική πολιτογράφηση σε συγκεκριμένο χρόνο, όχι καθολική συμμετοχή. Εθνικό Αρχαιολογικό Μουσείο 1482. Άγγιξε για μεγέθυνση.",
      "credit": "George E. Koronaios / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2018, επεξεργασία 2021",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:Honorary_stele_depicting_Athena_and_the_Athenian_Deme_(4th_cent._B.C.)_at_the_National_Archaeological_Museum_of_Athens_on_22_July_2018.jpg"
    }
  ],
  "sparta-society": [
    {
      "afterParagraphId": "sparta-23",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Lead%20votive%20figurines%2C%20Sparta%2C%206th%20c%20BC%2C%20UCL%2C%20154813.jpg?width=1200",
      "resizeMode": "contain",
      "caption": "Μολύβδινα αφιερώματα του 6ου αιώνα π.Χ. από το ιερό της Ορθίας, σε μουσειακή συλλογή (UCL). Μαρτυρούν λατρευτική προσφορά, όχι τις λεπτομέρειες ύστερων αφηγήσεων για την αγωγή. Άγγιξε για μεγέθυνση.",
      "credit": "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2015",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:Lead_votive_figurines%2C_Sparta%2C_6th_c_BC%2C_UCL%2C_154813.jpg"
    },
    {
      "afterParagraphId": "sparta-24",
      "url": "https://commons.wikimedia.org/wiki/Special:FilePath/NAMA%20Art%C3%A9mis%20Orthia.jpg?width=1200",
      "resizeMode": "contain",
      "caption": "Ελεφαντοστέινο ανάθημα από το ιερό της Ορθίας (περ. 660 π.Χ.), με φτερωτή μορφή και πτηνά. Η ταύτισή της ειδικά με την Άρτεμη συζητείται. Εθνικό Αρχαιολογικό Μουσείο. Άγγιξε για μεγέθυνση.",
      "credit": "Marsyas / Wikimedia Commons · CC BY-SA 2.5 · φωτογραφία 2005, χρωματική επεξεργασία 2022",
      "creditUrl": "https://commons.wikimedia.org/wiki/File:NAMA_Art%C3%A9mis_Orthia.jpg"
    }
  ],
  "greek-settlements-networks": [
    {
      afterParagraphId: "settle-09",
      url: commonsFileUrl("Ortygia - Syracuse.jpg"),
      resizeMode: "contain",
      caption: "Η σημερινή Ορτυγία στις Συρακούσες. Η φωτογραφία δείχνει το φυσικό πλαίσιο της θέσης, όχι τα γεγονότα της αρχαϊκής εγκατάστασης. Άγγιξε για μεγέθυνση.",
      credit: "Andrea Schaffer / Wikimedia Commons · CC BY 2.0 · φωτογραφία 2017",
      creditUrl: commonsPageUrl("Ortygia - Syracuse.jpg"),
    },
    {
      afterParagraphId: "settle-18",
      url: commonsFileUrl("Березань розкопки 2.jpg"),
      resizeMode: "contain",
      caption: "Ανασκαφικός χώρος στο νησί Μπερεζάν, Ουκρανία (2018). Ο χώρος μαρτυρεί αρχαιολογική έρευνα· οι χρονολογήσεις χρειάζονται στρωματογραφικά και κινητά ευρήματα. Άγγιξε για μεγέθυνση.",
      credit: "PhotoDocumentalist / Wikimedia Commons · CC BY 4.0 · φωτογραφία 2018",
      creditUrl: commonsPageUrl("Березань розкопки 2.jpg"),
    },
  ],
  "rise-of-polis": [{ afterParagraphId: "polis-11", url: commonsFileUrl("Zagora, Andros, 224941x.jpg"), resizeMode: "contain", caption: "Το απόκρημνο ακρωτήριο της Ζαγοράς στην Άνδρο. Η γεωμετρική εγκατάσταση βρισκόταν στο πλάτωμα· η φωτογραφία δεν αποκαλύπτει τους αρχαίους θεσμούς. Άγγιξε για μεγέθυνση.", credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2022", creditUrl: commonsPageUrl("Zagora, Andros, 224941x.jpg") }],
  "geometric-greece": [{ afterParagraphId: "g3", url: commonsFileUrl("Protogeometric amphora BM A1124.jpg"), resizeMode: "contain", caption: "Πρωτογεωμετρικός αμφορέας με ομόκεντρους κύκλους, περ. 975–950 π.Χ. Άγγιξε για μεγέθυνση.", credit: "Marie-Lan Nguyen / Wikimedia Commons · CC BY 2.5", creditUrl: commonsPageUrl("Protogeometric amphora BM A1124.jpg") }, { afterParagraphId: "g12", url: commonsFileUrl("Coupe de Nestor - musée Archéologique de Pithecusae - inscription.jpg"), resizeMode: "contain", caption: "Αποσπασματική επιγραφή στο κύπελλο του Νέστορα, Πιθηκούσσα, περ. 730–720 π.Χ. Άγγιξε για μεγέθυνση.", credit: "Shonagon / Wikimedia Commons · CC0 1.0", creditUrl: commonsPageUrl("Coupe de Nestor - musée Archéologique de Pithecusae - inscription.jpg") }],
  "palace-collapse": [
    {
      afterParagraphId: "mycenae-after",
      url: commonsFileUrl("Megaron at the acropolis of Mycenae, 201518.jpg"),
      resizeMode: "contain",
      caption: "Τα σημερινά κατάλοιπα του μεγάρου στις Μυκήνες. Πρόκειται για κτίσμα της ανακτορικής περιόδου, όχι για φωτογραφία του στρώματος καταστροφής ή της μεταγενέστερης κατοίκησης. Άγγιξε για μεγέθυνση.",
      credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2020",
      creditUrl: commonsPageUrl("Megaron at the acropolis of Mycenae, 201518.jpg"),
    },
  ],
  "linear-b-decipherment": [
    {
      afterParagraphId: "pylos-test-1953",
      url: commonsFileUrl("Linear B tablet, Pylos, 13th century BC, NAMA, 191139.jpg"),
      resizeMode: "contain",
      caption: "Μουσειακή προθήκη με πινακίδες από την Πύλο, ανάμεσά τους η PY Ta 641. Η συλλαβική ανάγνωση ti-ri-po-de κοντά στο εικονόγραμμα τρίποδου υπήρξε ανεξάρτητη δοκιμή. Άγγιξε για μεγέθυνση.",
      credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2019",
      creditUrl: commonsPageUrl("Linear B tablet, Pylos, 13th century BC, NAMA, 191139.jpg"),
    },
  ],
  "mycenaean-palaces": [
    {
      afterParagraphId: "hides-tablet",
      url: commonsFileUrl("NAMA Linear B tablet of Pylos.jpg"),
      resizeMode: "contain",
      caption: "Η αυθεντική πινακίδα PY Ub 1318 από την Πύλο, στο Εθνικό Αρχαιολογικό Μουσείο. Καταγράφει διανομή δερμάτων σε τεχνίτες· η φωτογραφία δεν αποτελεί μεταγραφή του κειμένου. Άγγιξε για μεγέθυνση.",
      credit: "Sharon Mollerus / Wikimedia Commons · CC BY 2.0 · φωτογραφία 2009",
      creditUrl: commonsPageUrl("NAMA Linear B tablet of Pylos.jpg"),
    },
    {
      afterParagraphId: "tiryns-gate",
      url: commonsFileUrl("Palace of Tiryns, entrance.jpg"),
      resizeMode: "contain",
      caption: "Η είσοδος στην οχυρωμένη ακρόπολη της Τίρυνθας. Η μνημειακή πρόσβαση δηλώνει κατασκευή και προβολή ισχύος, όχι τον ακριβή χάρτη των εξαρτημένων κοινοτήτων.",
      credit: "Karelksir / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2015",
      creditUrl: commonsPageUrl("Palace of Tiryns, entrance.jpg"),
    },
  ],
  "minoan-crete": [
    {
      afterParagraphId: "mu-district",
      url: commonsFileUrl("The Palace in Malia Crete.jpg"),
      resizeMode: "contain",
      caption: "Η συνοικία Μ των Μαλίων, ένας ανασκαμμένος χώρος συνδεδεμένος με εργαστήρια και μεγάλα κτίρια έξω από το κυρίως ανάκτορο.",
      credit: "Moroder / Wikimedia Commons · CC BY-SA 3.0 · φωτογραφία 2015",
      creditUrl: commonsPageUrl("The Palace in Malia Crete.jpg"),
    },
    {
      afterParagraphId: "gournia-streets",
      url: commonsFileUrl("Gournia, Minoan Bronze Age Village.JPG"),
      resizeMode: "contain",
      caption: "Ανασκαμμένα κατάλοιπα στα Γουρνιά. Οι τοίχοι και τα περάσματα αποκαλύπτουν τον οικιστικό ιστό, όχι μία πλήρη αναπαράσταση των αρχαίων σπιτιών.",
      credit: "Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2013",
      creditUrl: commonsPageUrl("Gournia, Minoan Bronze Age Village.JPG"),
    },
  ],
  "aegean-bronze-age": [
    {
      afterParagraphId: "spindle-evidence",
      url: commonsFileUrl("Bronze Age Stone Spindle Whorls from Tiryns Acropolis (28356795022).jpg"),
      resizeMode: "contain",
      caption: "Λίθινα σφονδύλια της Εποχής του Χαλκού από την Τίρυνθα: τεκμήρια για το γνέσιμο, όχι για την ταυτότητα των ανθρώπων που εργάζονταν. Άγγιξε για μεγέθυνση.",
      credit: "Gary Todd / Wikimedia Commons · CC0 1.0 · φωτογραφία 2016",
      creditUrl: commonsPageUrl("Bronze Age Stone Spindle Whorls from Tiryns Acropolis (28356795022).jpg"),
    },
    {
      afterParagraphId: "lerna-seals",
      url: commonsFileUrl("Lerna SE fortification wall detail.jpg"),
      resizeMode: "contain",
      caption: "Τμήμα πρωτοελλαδικής οχύρωσης στη Λέρνα. Τα ορατά καλύμματα είναι σύγχρονα· στη φωτογραφία δεν απεικονίζονται τα πήλινα σφραγίσματα.",
      credit: "Mark Landon / Wikimedia Commons · CC BY-SA 4.0 · λήψη 1990",
      creditUrl: commonsPageUrl("Lerna SE fortification wall detail.jpg"),
    },
  ],
  "greek-geography-seas": [
    {
      afterParagraphId: "archipelago-mental-map",
      url: commonsFileUrl("Map of the Aegean Sea.svg"),
      resizeMode: "contain",
      caption: "Σύγχρονος τοπογραφικός χάρτης του Αιγαίου: ορεινή στεριά, ακτές και νησιά. Δεν αποτυπώνει τεκμηριωμένα αρχαία δρομολόγια. Άγγιξε για μεγέθυνση.",
      credit: "Goran tek-en / Wikimedia Commons · CC BY-SA 4.0 · χάρτης 2019",
      creditUrl: commonsPageUrl("Map of the Aegean Sea.svg"),
    },
  ],
  "greek-chronology": [
    {
      afterParagraphId: "mycenaean-overlap",
      url: commonsFileUrl("Stirrup jar, Mycenae, AM of Mycenae, 201608.jpg"),
      resizeMode: "contain",
      caption: "Μυκηναϊκό αγγείο με χαρακτηριστικές λαβές (stirrup jar) από τις Μυκήνες, περ. 1250–1180 π.Χ., στο Αρχαιολογικό Μουσείο Μυκηνών. Η παραγωγή του ανήκει σε εποχή πριν από τη διαμόρφωση των κλασικών πόλεων.",
      credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · Φωτογραφία 2020",
      creditUrl: commonsPageUrl("Stirrup jar, Mycenae, AM of Mycenae, 201608.jpg"),
    },
  ],
  "greek-history-through-evidence": [
    {
      afterParagraphId: "ostrakon-limits",
      url: commonsFileUrl("Ostracon with the name of Themistocles.jpg"),
      resizeMode: "contain",
      caption: "Όστρακο με το όνομα του Θεμιστοκλή, στο Μουσείο της Αρχαίας Αγοράς. Η γραφή δεν αποκαλύπτει από μόνη της κίνητρα ή τελικό αποτέλεσμα.",
      credit: "Marsyas / Wikimedia Commons · CC BY 4.0 · Φωτογραφία 2005",
      creditUrl: commonsPageUrl("Ostracon with the name of Themistocles.jpg"),
    },
    {
      afterParagraphId: "plangon-stele",
      url: commonsFileUrl("Funerary stele of Plangon (inscription ΡΛΑNΓΩΝ).jpg"),
      resizeMode: "contain",
      caption: "Ταφική στήλη της Πλαγγόνας, περ. 310 π.Χ., με πουλί και κούκλα. Το μνημείο δεν διασώζει τα προσωπικά της λόγια.",
      credit: "Yair-haklai / Wikimedia Commons · CC BY-SA 4.0 · Φωτογραφία 2024",
      creditUrl: commonsPageUrl("Funerary stele of Plangon (inscription ΡΛΑNΓΩΝ).jpg"),
    },
  ],
  "greek-world-not-a-country": [
    {
      afterParagraphId: "map-shores",
      url: commonsFileUrl("Greek Colonization Archaic Period.png"),
      resizeMode: "contain",
      caption: "Σύγχρονος σχηματικός χάρτης ελληνικών εγκαταστάσεων της αρχαϊκής εποχής. Τα σημεία δεν παριστάνουν ενιαίο κράτος ούτε αποτυπώνουν κάθε κοινότητα· άγγιξε για μεγέθυνση.",
      credit: "Regaliorum / Wikimedia Commons · CC0 1.0 · αρχική χαρτογραφική απόδοση",
      creditUrl: commonsPageUrl("Greek Colonization Archaic Period.png"),
    },
    {
      afterParagraphId: "sanctuaries",
      url: commonsFileUrl("Stadium at Olympia.jpg"),
      resizeMode: "cover",
      caption: "Το στάδιο της Ολυμπίας σήμερα. Ο κοινός τόπος αγώνων και λατρείας δεν ήταν πρωτεύουσα ενός ενιαίου ελληνικού κράτους.",
      credit: "Anna Tziaki / Wikimedia Commons · CC BY-SA 4.0 · Φωτογραφία 2016",
      creditUrl: commonsPageUrl("Stadium at Olympia.jpg"),
    },
  ],
  "ancient-athens": [
    {
      afterParagraphId: "theta-workshop",
      url: commonsFileUrl("Excavations under the Acropolis Museum 6.jpg"),
      resizeMode: "contain",
      caption: "Ανασκαμμένα κατάλοιπα κάτω από το Μουσείο της Ακρόπολης. Η φωτογραφία δείχνει το ανασκαφικό σύνολο, όχι αποκλειστικά την Οικία Θ.",
      credit: "Marcus Cyron / Wikimedia Commons · CC BY-SA 3.0",
      creditUrl: commonsPageUrl("Excavations under the Acropolis Museum 6.jpg"),
    },
    {
      afterParagraphId: "agora-evidence",
      url: commonsFileUrl("Ancient agora of Athens.jpg"),
      resizeMode: "cover",
      caption: "Η Αρχαία Αγορά σήμερα: ο χώρος όπου συνυπήρχαν συναλλαγές, δημόσιες λειτουργίες και καθημερινή δραστηριότητα.",
      credit: "SiaKou96 / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Ancient agora of Athens.jpg"),
    },
  ],
  "pompeii-everyday-life": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Thermopolium Pompei.jpg"),
      caption: "Πάγκος θερμοπωλείου στην Πομπηία, όπου σερβίρονταν ποτά και απλό φαγητό.",
      credit: "Photo2023 / Wikimedia Commons · CC BY 4.0",
      creditUrl: commonsPageUrl("Thermopolium Pompei.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Street of Pompeii.JPG"),
      caption: "Οι δρόμοι και τα κατώφλια των καταστημάτων βοηθούν τους αρχαιολόγους να ανασυνθέσουν την κίνηση στην πόλη.",
      credit: "Glmike523 / Wikimedia Commons · CC BY-SA",
      creditUrl: commonsPageUrl("Street of Pompeii.JPG"),
    },
  ],
  "why-mars-is-red": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Gravel-covered martian surface.jpg"),
      caption: "Η επιφάνεια του Άρη περιέχει σκόνη, άμμο και πετρώματα με διαφορετικές αποχρώσεις.",
      credit: "NASA/JPL-Caltech/MSSS / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Gravel-covered martian surface.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Curiosity on Mars.jpg"),
      caption: "Το Curiosity εξερευνά τον Άρη και βοηθά τους επιστήμονες να μελετήσουν τη γεωλογία του.",
      credit: "NASA / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Curiosity on Mars.jpg"),
    },
  ],
  "sleep-and-memory": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Sleep studies.jpg"),
      caption: "Μια μελέτη ύπνου καταγράφει φυσιολογικά σήματα που βοηθούν τους ειδικούς να ξεχωρίσουν τα στάδια του ύπνου.",
      credit: "National Heart, Lung, and Blood Institute / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Sleep studies.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Sleep EEG Stage 1.jpg"),
      caption: "Το ηλεκτροεγκεφαλογράφημα καταγράφει την ηλεκτρική δραστηριότητα του εγκεφάλου κατά τον ύπνο.",
      credit: "MrSandman / Wikimedia Commons · Public domain",
      creditUrl: commonsPageUrl("Sleep EEG Stage 1.jpg"),
    },
  ],
  "octopus-intelligence": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Octopus vulgaris close up.jpg"),
      caption: "Το χταπόδι μπορεί να αλλάξει χρώμα και υφή, συνδυάζοντας καμουφλάζ με εξερεύνηση του περιβάλλοντος.",
      credit: "Victor Micallef / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Octopus vulgaris close up.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Octopus vulgaris - Common octopus (7874091466).jpg"),
      caption: "Τα ευλύγιστα χέρια του χταποδιού έχουν μεγάλο ρόλο στην αφή και στον χειρισμό αντικειμένων.",
      credit: "Jean-Marc Kuffer / Wikimedia Commons · CC BY 4.0",
      creditUrl: commonsPageUrl("Octopus vulgaris - Common octopus (7874091466).jpg"),
    },
  ],
  "life-at-hydrothermal-vents": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Fauna on hydrothermal vents.jpg"),
      caption: "Γαρίδες, μικροί αστακοί και μύδια ζουν σε κοινότητες γύρω από υδροθερμικές πηγές.",
      credit: "NOAA Photo Library / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Fauna on hydrothermal vents.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("A mussel's life around deep-sea hydrothermal vents.jpg"),
      caption: "Ορισμένα μύδια επιβιώνουν χάρη σε συμβιωτικά μικρόβια που αξιοποιούν χημική ενέργεια.",
      credit: "Sébastien Duperron, Sylvie M. Gaudron & Sven R. Laming / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("A mussel's life around deep-sea hydrothermal vents.jpg"),
    },
  ],
  "how-language-models-generate-text": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("NeuralNetwork.png"),
      caption: "Ένα σχηματικό νευρωνικό δίκτυο. Τα πραγματικά γλωσσικά μοντέλα έχουν πολύ μεγαλύτερη και πιο σύνθετη αρχιτεκτονική.",
      credit: "Loxaxs / Wikimedia Commons · CC0",
      creditUrl: commonsPageUrl("NeuralNetwork.png"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Neural network with dark background.png"),
      caption: "Οι υπολογιστικοί κόμβοι και οι συνδέσεις τους αναπαριστούν αφαιρετικά τον τρόπο με τον οποίο ένα νευρωνικό δίκτυο συνδυάζει πληροφορίες.",
      credit: "DancingPhilosopher / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Neural network with dark background.png"),
    },
  ],
  "what-happens-when-you-open-a-website": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Internet access diagram.svg"),
      resizeMode: "contain",
      caption: "Ένα απλοποιημένο διάγραμμα της διαδρομής από μια οικιακή συσκευή προς μια υπηρεσία στο διαδίκτυο.",
      credit: "Ferran / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Internet access diagram.svg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Structure of the Internet.svg"),
      resizeMode: "contain",
      caption: "Το διαδίκτυο αποτελείται από πολλά αλληλοσυνδεδεμένα δίκτυα, παρόχους και σημεία ανταλλαγής δεδομένων.",
      credit: "BWenk / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Structure of the Internet.svg"),
    },
  ],
  "impressionism-and-light": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Monet - Impression, Sunrise.jpg"),
      caption: "Το έργο «Impression, Sunrise» έδωσε το όνομά του στον Ιμπρεσιονισμό.",
      credit: "Claude Monet / Wikimedia Commons · Public domain artwork",
      creditUrl: commonsPageUrl("Monet - Impression, Sunrise.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Claude Monet - Matin sur la Seine, le beau temps (1897).jpg"),
      caption: "Ο Monet επέστρεφε συχνά στα ίδια τοπία για να παρατηρήσει πώς άλλαζε η ατμόσφαιρα και το φως.",
      credit: "Claude Monet / Wikimedia Commons · Public domain artwork",
      creditUrl: commonsPageUrl("Claude Monet - Matin sur la Seine, le beau temps (1897).jpg"),
    },
  ],
  "iceland-two-plates": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Thingvellir National Park rift valley.jpg"),
      caption: "Στο Þingvellir, το ρήγμα κάνει ορατά τμήματα του ορίου ανάμεσα στην ευρασιατική και τη βορειοαμερικανική πλάκα.",
      credit: "Pi3.124 / Wikimedia Commons · CC BY-SA 3.0",
      creditUrl: commonsPageUrl("Thingvellir National Park rift valley.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Observation deck view Thingvellir Iceland 2026-02-06 06-08-21.jpg"),
      caption: "Η κοιλάδα του ρήγματος και η λίμνη Þingvallavatn φαίνονται από ψηλότερο σημείο του εθνικού πάρκου.",
      credit: "G. Edward Johnson / Wikimedia Commons · CC BY 4.0",
      creditUrl: commonsPageUrl("Observation deck view Thingvellir Iceland 2026-02-06 06-08-21.jpg"),
    },
  ],
};
