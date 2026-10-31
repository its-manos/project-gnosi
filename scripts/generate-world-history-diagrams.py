#!/usr/bin/env python3
"""Rebuild original world-history diagrams. Requires Pillow and DejaVu Sans."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path(__file__).resolve().parents[1]
diagrams=json.loads((root/'scripts/fixtures/world-history-diagrams.json').read_text())
assetdir=root/'assets/lesson-images'
assetdir.mkdir(parents=True,exist_ok=True)
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
boldpath='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(size,bold=False):return ImageFont.truetype(boldpath if bold else fontpath,size)
def wrap(text,f,maxwidth,draw):
    lines=[];line=''
    for word in text.split():
        trial=(line+' '+word).strip()
        if draw.textlength(trial,font=f)>maxwidth and line:lines.append(line);line=word
        else:line=trial
    if line:lines.append(line)
    return lines

for i,d in enumerate(diagrams):
    im=Image.new('RGB',(1200,1080),'#101c2a');dr=ImageDraw.Draw(im)
    dr.rounded_rectangle((52,48,1148,1032),radius=35,fill='#162638',outline='#32455b',width=2)
    dr.text((96,80),f'ΓΝΩΣΗ  /  ΠΑΓΚΟΣΜΙΑ ΙΣΤΟΡΙΑ  /  {i+1:02d}',font=font(24,True),fill='#d8b986')
    titlelines=wrap(d['title'],font(49,True),1000,dr)
    assert len(titlelines)<=2,d['id']
    for j,line in enumerate(titlelines):dr.text((96,140+j*63),line,font=font(49,True),fill='#f4eee3')
    for j,(label,detail) in enumerate(d['rows']):
        y=300+j*194
        dr.rounded_rectangle((94,y,1106,y+164),radius=20,fill='#20344a')
        dr.rounded_rectangle((94,y,103,y+164),radius=3,fill=['#d8b986','#79c6bd','#9fb8e7'][j])
        labels=wrap(label,font(36,True),925,dr)
        assert len(labels)==1,(d['id'],label)
        dr.text((132,y+21),label,font=font(36,True),fill='#f4eee3')
        details=wrap(detail,font(33),925,dr)
        assert len(details)<=2,(d['id'],detail)
        for k,line in enumerate(details):dr.text((132,y+77+k*42),line,font=font(33),fill='#d7e1eb')
    footlines=wrap(d['foot'],font(25),996,dr)
    assert len(footlines)<=2,d['id']
    for j,line in enumerate(footlines):dr.text((96,906+j*36),line,font=font(25),fill='#bdcbd8')
    dr.text((96,996),'ΠΡΩΤΟΤΥΠΟ ΔΙΑΓΡΑΜΜΑ · ΟΧΙ ΙΣΤΟΡΙΚΟ ΤΕΚΜΗΡΙΟ',font=font(19),fill='#8b9fb3')
    file=d['id']+'-diagram.png'
    temp=assetdir/(file+'.tmp')
    im.save(temp,format='PNG',optimize=True)
    temp.replace(assetdir/file)
print('Generated',len(diagrams),'diagrams')
