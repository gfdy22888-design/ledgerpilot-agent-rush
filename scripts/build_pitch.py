"""Generate a preparation pitch PDF; no cloud deployment is implied."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
import pypdfium2 as pdfium

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'; OUT.mkdir(exist_ok=True)
font=Path('C:/Windows/Fonts/segoeui.ttf')
bold=Path('C:/Windows/Fonts/segoeuib.ttf')
pdfmetrics.registerFont(TTFont('Segoe',str(font)))
pdfmetrics.registerFont(TTFont('SegoeBold',str(bold)))
W,H=960,540
INK='#203C31'; MUTED='#6F7F70'; BG='#F5F7F0'; ACCENT='#C8DEA5'
output=OUT/'LedgerPilot_pitch_draft.pdf'
c=canvas.Canvas(str(output),pagesize=(W,H))
c.setTitle('LedgerPilot | Agent Rush preparation pitch')
c.setAuthor('LedgerPilot contributors')
def text(x,y,value,size=18,color=INK,bold=False):
    c.setFillColor(HexColor(color));c.setFont('SegoeBold' if bold else 'Segoe',size);c.drawString(x,H-y,value)
def para(x,y,value,width=820,size=20,color=MUTED):
    st=ParagraphStyle('body',fontName='Segoe',fontSize=size,leading=size*1.45,textColor=HexColor(color))
    p=Paragraph(value,st);_,h=p.wrap(width,350);p.drawOn(c,x,H-y-h);return h
def page(n,title,sub=None):
    c.setFillColor(HexColor(BG));c.rect(0,0,W,H,fill=1,stroke=0)
    text(54,42,'LedgerPilot / Agent Rush',11,MUTED)
    text(54,110,title,34,bold=True)
    if sub:para(54,128,sub,size=15)
    text(54,511,'Preparation draft - local prototype; Vultr deployment and live AI unverified',10,MUTED)
    text(882,511,f'{n:02}',11,MUTED)
def end():c.showPage()

page(1,'LedgerPilot')
text(54,203,'Procurement reconciliation',38,bold=True)
text(54,256,'with evidence for every decision',32)
para(54,310,'Purchase orders, receipts and invoices enter one review workflow.<br/>The reviewer controls the final export.',size=22)
text(54,443,'Challenge 2 / Powering the Future of Work',16,MUTED)
end()

page(2,'The procurement review problem')
para(54,158,'An invoice can look correct while its receipt is incomplete.<br/>A convincing explanation does not establish that goods arrived.',size=24)
text(54,292,'The reviewer needs the underlying comparison',23,bold=True)
para(54,321,'LedgerPilot checks the ordered quantity and price against received goods and the invoice. Exceptions retain source references, so a reviewer can inspect the reason before deciding.',size=21)
end()

page(3,'A working review queue')
shot=OUT/'dashboard.png'
if shot.exists():
    img=Image.open(shot);iw,ih=img.size;dw=700;dh=dw*ih/iw
    c.drawImage(ImageReader(img),54,H-148-dh,width=dw,height=dh)
    para(780,164,'Actual local run<br/><br/>Rules mode<br/><br/>Synthetic data',width=135,size=16)
else:para(54,170,'Run a batch, inspect an exception, approve a clean match, and download the reviewed CSV.',size=24)
end()

page(4,'The sample result is reproducible','All records are synthetic. These are invoice face values, not savings.')
rows=[('Total invoice value','8 invoices','$11,050'),('Ready for review','3 invoices','$4,780'),('Held for clarification','5 invoices','$6,270')]
for i,(label,count,amount) in enumerate(rows):
    y=218+i*70;text(54,y,label,21);text(473,y,count,19,MUTED);text(700,y,amount,27,bold=True)
para(54,425,'Example: INV-1002 bills 100 units, while receipt GR-402 records 80. The invoice stays on hold until its source evidence is corrected.',size=17)
end()

page(5,'Vultr operates the intended backend')
text(54,177,'Browser review interface',24,bold=True)
para(54,194,'Same-origin requests to the application backend',size=17)
text(54,276,'Vultr VM: validation, matching and review state',24,bold=True)
para(54,293,'Node.js backend, persistent session files, HTTPS proxy and Docker configuration',size=17)
text(54,376,'Optional Vultr Serverless Inference',24,bold=True)
para(54,393,'Explanations and email drafts use verified findings. The model cannot modify amounts or approve invoices. Cloud deployment remains pending.',size=17)
end()

page(6,'The boundary around each decision')
para(54,163,'Held invoices cannot enter the CSV export.<br/>Clean matches require an explicit review action.<br/>An additional confirmation precedes the download.',size=24)
para(54,326,'Supplier drafts remain unsent. No payment adapter exists. The evidence packet has a checkable hash chain, but it is not independently notarized. AI explanations remain advisory.',size=21)
end()

page(7,'A focused business hypothesis')
text(54,176,'Initial audience',22,bold=True)
para(54,195,'Small procurement teams working from structured document exports.',size=20)
text(54,280,'Proposed validation',22,bold=True)
para(54,299,'Compare manual and assisted review on the same batches: review time, exception false positives and evidence usefulness. Customer demand and pricing remain unvalidated.',size=20)
para(54,421,'Preparation began 2 November 2026, before the advertised build window. Disclose the history and confirm eligibility before entering.',size=15)
end();c.save()
reader=PdfReader(str(output));assert len(reader.pages)==7
doc=pdfium.PdfDocument(str(output));thumbs=[]
for i in range(len(doc)):
    img=doc[i].render(scale=1.2).to_pil().convert('RGB');img.save(OUT/f'pitch-page-{i+1}.png')
    thumbs.append(ImageOps.contain(img,(480,270)))
sheet=Image.new('RGB',(960,1080),'#dce1d5')
for i,im in enumerate(thumbs):sheet.paste(im,((i%2)*480,(i//2)*270))
sheet.save(OUT/'pitch-contact-sheet.png')
print(f'Created {output.name}: {len(reader.pages)} pages')
