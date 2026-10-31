#!/usr/bin/env python3
"""Rebuild 13 original diagrams. Requires Pillow and DejaVu Sans."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import math,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/lesson-images';OUT.mkdir(parents=True,exist_ok=True)
BG='#101c2a';PANEL='#20344a';FG='#f4eee3';MUTED='#b8c9d9';GOLD='#e6c28b';BLUE='#7dc4ef';GREEN='#86cdbc';RED='#f1a38e'
fontdir='/usr/share/fonts/truetype/dejavu/'
def f(n=32,b=False):return ImageFont.truetype(fontdir+('DejaVuSans-Bold.ttf' if b else 'DejaVuSans.ttf'),n)
def start(title,sub):
 im=Image.new('RGB',(1200,900),BG);d=ImageDraw.Draw(im);d.text((55,35),'ΓΝΩΣΗ  /  ΕΙΚΟΝΑ ΓΙΑ ΝΑ ΣΚΕΦΤΕΙΣ',font=f(22,True),fill=GOLD)
 size=43
 while d.textlength(title,font=f(size,True))>1090:size-=1
 d.text((55,92),title,font=f(size,True),fill=FG)
 size=26
 while d.textlength(sub,font=f(size))>1090:size-=1
 d.text((55,160),sub,font=f(size),fill=MUTED);return im,d
def txt(d,xy,s,size=31,color=FG,b=False):d.text(xy,s,font=f(size,b),fill=color)
def arrow(d,a,b,color=GOLD,w=6):
 d.line([a,b],fill=color,width=w);t=math.atan2(b[1]-a[1],b[0]-a[0]);p=[b,(b[0]-19*math.cos(t-.45),b[1]-19*math.sin(t-.45)),(b[0]-19*math.cos(t+.45),b[1]-19*math.sin(t+.45))];d.polygon(p,fill=color)
def box(d,xy,label,color=PANEL,size=30):
 d.rounded_rectangle(xy,radius=18,fill=color);lines=label.split('\n');lineh=size+12
 for i,line in enumerate(lines):
  x=(xy[0]+xy[2]-d.textlength(line,font=f(size,True)))/2;y=(xy[1]+xy[3]-len(lines)*lineh)/2+i*lineh;txt(d,(x,y),line,size,b=True)
def save(id,im,d,foot):
 lines=[];line=''
 for word in foot.split():
  test=(line+' '+word).strip()
  if d.textlength(test,font=f(22))>1090:lines.append(line);line=word
  else:line=test
 if line:lines.append(line)
 assert len(lines)<=3,(id,lines)
 for j,line in enumerate(lines):txt(d,(55,785+j*30),line,22,MUTED)
 p=OUT/(id+'-supplementary.png');tmp=p.with_suffix('.tmp');im.save(tmp,format='PNG',optimize=True);tmp.replace(p)

id='moon-phases-not-shadow';im,d=start('Ένα φωτισμένο μισό, πολλές όψεις','Σχηματική όψη του δίσκου από τη Γη')
for x,label,phase in [(235,'Νέα Σελήνη',0),(600,'Πρώτο τέταρτο',1),(965,'Πανσέληνος',2)]:
 d.ellipse((x-130,300,x+130,560),fill='#0a111b',outline=MUTED,width=3)
 if phase==1:d.pieslice((x-130,300,x+130,560),270,90,fill=FG)
 if phase==2:d.ellipse((x-130,300,x+130,560),fill=FG)
 txt(d,(x-d.textlength(label,font=f(32,True))/2,610),label,32,b=True)
box(d,(100,680,1100,750),'Αλλάζει ποιο μέρος του φωτισμένου μισού βλέπουμε.',size=28)
save(id,im,d,'Σχηματικό, όχι σε κλίμακα. Οι συνηθισμένες φάσεις δεν προκαλούνται από τη σκιά της Γης. Η οπτική φορά εξαρτάται από τη θέση παρατήρησης.')

id='orbit-continuous-fall';im,d=start('Η βαρύτητα καμπυλώνει την κίνηση','Σχηματική κυκλική τροχιά · Δεν υπάρχει ώθηση που ακυρώνει τη βαρύτητα')
c=(430,490);r=160;orb=260
d.ellipse((c[0]-orb,c[1]-orb,c[0]+orb,c[1]+orb),outline='#526d86',width=3)
d.ellipse((270,330,590,650),fill='#347da8',outline=BLUE,width=3);txt(d,(390,465),'Γη',39,b=True)
d.rounded_rectangle((674,472,708,506),radius=6,fill=FG)
arrow(d,(692,465),(692,265),GREEN);txt(d,(730,265),'Πλευρική',31,GREEN,b=True);txt(d,(730,310),'ταχύτητα',31,GREEN)
arrow(d,(674,490),(548,490),RED);txt(d,(750,455),'Βαρυτική έλξη',31,RED,b=True);txt(d,(750,500),'προς τη Γη',29,RED)
txt(d,(255,702),'Σταθμός και αστροναύτης πέφτουν μαζί.',30)
save(id,im,d,'Τα βέλη δείχνουν διαφορετικά μεγέθη: ταχύτητα και επιτάχυνση. Δεν προστίθενται ως δύο αντίθετες δυνάμεις. Μεγέθη και αποστάσεις δεν είναι σε κλίμακα.')

id='dna-cell-instructions';im,d=start('Κοινό DNA, διαφορετική έκφραση','Απλοποιημένο παράδειγμα δύο κυττάρων με πυρήνα')
for y,label,active in [(290,'Μυϊκό κύτταρο',0),(535,'Νευρικό κύτταρο',1)]:
 box(d,(70,y,350,y+155),label,size=28)
 arrow(d,(375,y+77),(455,y+77),BLUE)
 for j,color in enumerate([GREEN,RED,BLUE]):
  d.rounded_rectangle((485+j*82,y+42,545+j*82,y+112),radius=8,fill=color if j==active else '#435569')
 txt(d,(486,y+145),'Ενεργά / λιγότερο ενεργά',23,MUTED)
 arrow(d,(765,y+77),(835,y+77),GOLD)
 box(d,(855,y,1130,y+155),'Διαφορετικά\nπαραγόμενα μόρια',size=25)
txt(d,(475,242),'Ίδιες πληροφορίες DNA',27,b=True)
save(id,im,d,'Τα χρώματα είναι σχηματικά, όχι συγκεκριμένα γονίδια. Διαφορετικά κύτταρα χρησιμοποιούν διαφορετικούς συνδυασμούς γονιδίων· το DNA δεν αποτελεί έτοιμο πεπρωμένο.')

id='sound-to-brain';im,d=start('Συχνότητα και πλάτος δεν είναι το ίδιο','Σχηματικές μεταβολές πίεσης στο ίδιο χρονικό διάστημα')
for x,y,amp,cycles,label in [(80,295,25,3,'Ίδια συχνότητα'),(650,295,65,3,'Μεγαλύτερο πλάτος'),(80,585,45,2,'Χαμηλότερη συχνότητα'),(650,585,45,5,'Υψηλότερη συχνότητα')]:
 d.line((x,y,x+450,y),fill='#526d86',width=2)
 pts=[(x+t*450/300,y-amp*math.sin(cycles*2*math.pi*t/300)) for t in range(301)];d.line(pts,fill=BLUE,width=5)
 txt(d,(x,y+90),label,29,b=True)
 txt(d,(x+330,y+25),'χρόνος',22,MUTED)
save(id,im,d,'Επάνω: ίδιος τόνος, διαφορετικό πλάτος. Κάτω: ίδιο πλάτος, διαφορετικός τόνος. Η καμπύλη παριστάνει μεταβολή πίεσης, όχι το ταξίδι ενός μορίου αέρα.')

id='blue-sky-red-sunset';im,d=start('Το φως διασχίζει την ατμόσφαιρα','Μεγαλύτερη διαδρομή: περισσότερο μπλε φως σκεδάζεται εκτός της αρχικής πορείας')
for y,length,label in [(330,300,'Συντομότερη διαδρομή'),(610,720,'Μεγαλύτερη διαδρομή')]:
 txt(d,(80,y-95),label,32,b=True);d.rounded_rectangle((80,y-25,80+length,y+25),radius=18,fill=PANEL)
 arrow(d,(90,y),(80+length,y),FG if length<400 else RED)
 for j in range(length//180):
  xx=185+j*165;arrow(d,(xx,y),(xx+30,y-65),BLUE,4)
 txt(d,(850,y+45),'Προς το μάτι',27,RED if length>400 else FG)
 arrow(d,(100+length,y),(1050,y),RED if length>400 else FG)
save(id,im,d,'Το σχήμα δείχνει τον μηχανισμό, όχι πραγματικές γωνίες ή ποσότητες. Τα μικρότερα ορατά μήκη κύματος σκεδάζονται εντονότερα· το φως που συνεχίζει αλλάζει σύνθεση.')

id='dns-address-book';im,d=start('Η διεύθυνση και η σελίδα έρχονται χωριστά','Απλοποιημένη ροή · Αν δεν υπάρχει έγκυρη απάντηση στην κρυφή μνήμη')
box(d,(70,260,365,385),'Browser',size=32);box(d,(495,260,770,385),'DNS resolver',size=29);box(d,(900,260,1140,385),'DNS\nπηγές',size=28)
arrow(d,(375,295),(485,295),BLUE);arrow(d,(780,295),(890,295),BLUE)
arrow(d,(890,355),(780,355),GREEN);arrow(d,(485,355),(375,355),GREEN)
txt(d,(410,220),'ερώτημα για όνομα',25,BLUE);txt(d,(395,409),'απάντηση / διεύθυνση IP',27,GREEN)
box(d,(70,545,365,685),'Browser',size=32);box(d,(790,545,1140,685),'Web server',size=31)
arrow(d,(385,585),(770,585),GOLD);txt(d,(445,540),'ξεχωριστό αίτημα HTTPS',25,GOLD)
arrow(d,(770,645),(385,645),FG);txt(d,(480,695),'περιεχόμενο σελίδας',25)
save(id,im,d,'Το DNS δεν κατεβάζει το περιεχόμενο της σελίδας. Οι πραγματικές αναζητήσεις μπορεί να αξιοποιούν cache και περισσότερους ενδιάμεσους εξυπηρετητές.')

id='public-private-keys';im,d=start('Κρυπτογράφηση και υπογραφή','Δύο διαφορετικές λειτουργίες · Δεν τις υποστηρίζει κάθε αλγόριθμος')
for y,title,left,mid,right,col in [(270,'Μυστικότητα','Δημόσιο κλειδί\nπαραλήπτη','Κρυπτογράφηση','Ιδιωτικό κλειδί\nαποκρυπτογραφεί',BLUE),(535,'Υπογραφή','Ιδιωτικό κλειδί\nυπογράφοντος','Υπογραφή','Δημόσιο κλειδί\nεπαληθεύει',GREEN)]:
 txt(d,(70,y-55),title,30,col,b=True);box(d,(70,y,380,y+140),left,size=27);box(d,(475,y,720,y+140),mid,size=25);box(d,(820,y,1130,y+140),right,size=27);arrow(d,(390,y+70),(465,y+70),col);arrow(d,(730,y+70),(810,y+70),col)
save(id,im,d,'Η υπογραφή δεν κρύβει το μήνυμα. Η ταυτοποίηση του κατόχου χρειάζεται επιπλέον σχέση εμπιστοσύνης· η αυθεντικότητα δεν εγγυάται αλήθεια ή ασφάλεια περιεχομένου.')

id='ai-bias-context';im,d=start('Το 95% μπορεί να κρύβει μεγάλη διαφορά','Υποθετικό παράδειγμα του άρθρου · Σωστές απαντήσεις ανά ομάδα')
rows=[('Ομάδα Α',90,90),('Ομάδα Β',5,10),('Σύνολο',95,100)]
for j,(label,ok,n) in enumerate(rows):
 y=270+j*150;txt(d,(70,y+8),label,32,b=True);x=320;w=590;d.rounded_rectangle((x,y,x+w,y+65),radius=12,fill=PANEL);d.rounded_rectangle((x,y,x+w*ok/n,y+65),radius=12,fill=GREEN if j!=1 else GOLD);txt(d,(940,y+8),f'{100*ok//n}%',37,b=True);txt(d,(320,y+80),f'{ok} σωστές στις {n} περιπτώσεις',27,MUTED)
save(id,im,d,'Οι μπάρες ξεκινούν από 0 και τελειώνουν στο 100%. Η συνολική ακρίβεια σταθμίζει διαφορετικά τις ομάδες και δεν αποτυπώνει μόνη της το κόστος ή το είδος λαθών.')

id='city-boundaries-counting';im,d=start('Περισσότεροι κάτοικοι ≠ μεγαλύτερη πυκνότητα','Οι δύο υποθετικές περιοχές του άρθρου')
for x,label,people,area,density,col in [(70,'Περιοχή Α','100.000','10','10.000',BLUE),(650,'Περιοχή Β','150.000','100','1.500',GREEN)]:
 d.rounded_rectangle((x,260,x+480,710),radius=25,fill=PANEL)
 txt(d,(x+35,290),label,37,col,True)
 for yy,key,val in [(380,'κάτοικοι',people),(465,'έκταση (km²)',area),(570,'κάτοικοι / km²',density)]:
  txt(d,(x+35,yy),key,27,MUTED);txt(d,(x+35,yy+40),val,35,b=True)
save(id,im,d,'Πυκνότητα = πληθυσμός ÷ έκταση. Η Β έχει περισσότερους κατοίκους, η Α μεγαλύτερη πυκνότητα. Για πραγματικές συγκρίσεις χρειάζονται ίδιοι ορισμοί και συγκρίσιμα έτη.')

id='caves-water-carves';im,d=start('Το νερό μπορεί να αφαιρεί και να αποθέτει','Δύο διαφορετικές διεργασίες στον ασβεστόλιθο')
box(d,(70,260,565,410),'Διάλυση πετρώματος',size=31);box(d,(635,260,1130,410),'Απόθεση ασβεστίτη',size=31)
for j in range(6):
 d.line((120+j*65,465,155+j*65,575),fill='#6b8093',width=18)
arrow(d,(160,445),(270,620),BLUE);txt(d,(125,650),'Νερό με διαλυμένο CO₂',28,BLUE)
d.polygon([(850,455),(895,455),(872,620)],fill=GOLD);d.polygon([(820,725),(930,725),(875,610)],fill=GOLD)
d.ellipse((865,580,881,602),fill=BLUE);txt(d,(670,470),'οροφή',24,MUTED);txt(d,(670,690),'δάπεδο',24,MUTED)
save(id,im,d,'Σχηματικό, χωρίς κλίμακα ή χρόνο σχηματισμού. Το νερό μπορεί να διαλύει ασβεστόλιθο· σε κατάλληλες συνθήκες η απώλεια CO₂ ευνοεί την απόθεση ασβεστίτη.')

id='architecture-materials';im,d=start('Η επιφάνεια δεν αποκαλύπτει όλο τον τοίχο','Εννοιολογική τομή · Όχι κατασκευαστική οδηγία ή καθολική σειρά υλικών')
colors=['#beaa88','#6c8b9d','#e6c28b','#dfdfd7'];labels=['Εξωτερική\nστρώση','Φέρουσα\nκατασκευή','Θερμική\nμόνωση','Εσωτερική\nστρώση']
for i,(col,label) in enumerate(zip(colors,labels)):
 x=260+i*145;d.rectangle((x,290,x+120,610),fill=col);
 for j,line in enumerate(label.split('\n')):txt(d,(x+60-d.textlength(line,font=f(24))/2,655+j*35),line,24)
txt(d,(65,410),'ΕΞΩ',28,BLUE,True);txt(d,(965,410),'ΜΕΣΑ',28,RED,True)
arrow(d,(860,485),(180,485),RED);txt(d,(300,230),'Έλεγχος θερμικής ροής',29,RED)
save(id,im,d,'Οι λειτουργίες και οι ενώσεις εξετάζονται ως σύστημα. Οι στεγανώσεις και οι ειδικές λεπτομέρειες δεν απεικονίζονται· η πραγματική διάταξη απαιτεί μελέτη.')

id='architecture-climate';im,d=start('Το ίδιο σκίαστρο, διαφορετική γωνία ήλιου','Σχηματική τομή ανοίγματος · Ενδεικτικές ακτίνες, όχι μελέτη συγκεκριμένου τόπου')
for x,title,high in [(75,'Ψηλός ήλιος',True),(665,'Χαμηλός ήλιος',False)]:
 txt(d,(x,245),title,34,b=True)
 wall=x+360;d.rectangle((wall,330,wall+24,680),fill=MUTED);d.rectangle((wall-180,330,wall+24,350),fill=FG)
 d.rectangle((wall,410,wall+24,615),fill=BLUE)
 if high:
  arrow(d,(x+115,285),(wall-130,330),GOLD);txt(d,(x+15,715),'Η ακτίνα συναντά το σκίαστρο.',24,GOLD)
 else:
  arrow(d,(x+20,480),(wall+60,600),GOLD);txt(d,(x-5,715),'Χαμηλή ακτίνα περνά από κάτω.',24,GOLD)
save(id,im,d,'Το παράδειγμα εξηγεί τη γεωμετρία. Ανατολικές και δυτικές όψεις συχνά χρειάζονται διαφορετική σκίαση· προσανατολισμός, εποχή και χρήση ελέγχονται μαζί.')

id='astronomy-exoplanet-evidence';im,d=start('Τρεις βυθίσεις, μία ελέγξιμη πρόβλεψη','Υποθετικές μετρήσεις του άρθρου · Όχι παρατήρηση πραγματικού εξωπλανήτη')
x0,x1,y0,y1=140,1110,280,660
def xx(t):return x0+(x1-x0)*t/100
def yy(v):return y1-(v-98.5)/2*(y1-y0)
d.line((x0,y0,x0,y1,x1,y1),fill=MUTED,width=3)
for value in [99,100]:
 y=yy(value);d.line((x0,y,x1,y),fill='#334d63',width=2);txt(d,(55,y-18),str(value),29,MUTED)
pts=[]
for t in range(81):
 v=99 if any(abs(t-c)<=1 for c in [5,35,65]) else 100
 pts.append((xx(t),yy(v)))
d.line(pts,fill=BLUE,width=5)
for t in [5,35,65,95]:
 x=xx(t);d.line((x,y1,x,y1+10),fill=MUTED,width=2);txt(d,(x-15,y1+20),str(t),27)
d.line((xx(95),yy(100),xx(95),yy(99)),fill=GOLD,width=4);d.ellipse((xx(95)-7,yy(99)-7,xx(95)+7,yy(99)+7),fill=GOLD)
txt(d,(625,720),'Πρόβλεψη: γύρω στην ημέρα 95',28,GOLD)
txt(d,(150,220),'Σχετική φωτεινή ροή',27,MUTED);txt(d,(1010,744),'Ημέρα',25,MUTED)
save(id,im,d,'Οι καταγραφές 5, 35 και 65 απέχουν 30 ημέρες. Η κατακόρυφη κλίμακα έχει μεγεθυνθεί· η διάρκεια κάθε βύθισης είναι σχηματική. Η επανάληψη δεν αποδεικνύει μόνη της πλανήτη.')
print('Generated 13 exact teaching diagrams')
