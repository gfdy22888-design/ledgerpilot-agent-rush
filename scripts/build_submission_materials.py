"""Create a reviewable pre-deployment pitch and form text from verified project facts."""
from pathlib import Path
from html import escape
import json
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
OUT=ROOT/'artifacts'; TMP=ROOT/'tmp/pdfs/materials-v2'
OUT.mkdir(exist_ok=True); TMP.mkdir(parents=True,exist_ok=True)
REPO='https://github.com/gfdy22888-design/ledgerpilot-agent-rush'
CI=REPO+'/actions/runs/41432218040'
EVENT='https://lablab.ai/ai-hackathons/vultr-hackathon'
fields={
    'title':'LedgerPilot: Procurement Reconciled',
    'shortDescription':'LedgerPilot matches purchase orders, receipts and invoices, explains exceptions with source evidence, and prepares supplier follow-ups. Human review controls every export. Vultr deployment is prepared.',
    'longDescription':(
        'Procurement reviewers need to know whether an invoice agrees with the order and what actually arrived. LedgerPilot turns structured purchase orders, goods receipts and invoices into an inspectable review queue.\n\n'
        'The backend validates documents, checks supplier identity and agreed prices, flags missing orders and possible duplicates, and allocates receipt quantities across clean invoices. Integer-cent arithmetic determines the amounts. Every exception retains source references. Held invoices cannot enter the CSV export, even through direct API calls. Clean matches require a human approval and a separate export confirmation. Supplier follow-ups remain unsent drafts; the app never makes payments.\n\n'
        'Optional Vultr Serverless Inference can explain verified findings and draft clarification messages. The model cannot alter amounts or verdicts. Without credentials, the interface explicitly uses rules mode. The evidence packet includes source hashes and a checkable review chain, not an independently notarized ledger.\n\n'
        'The synthetic sample has eight invoices worth $11,050: three matches worth $4,780 and five holds worth $6,270. Held value is invoice face value, not claimed savings. Six automated tests pass; GitHub Actions also built the Docker image and exercised the container workflow.\n\n'
        'The intended frontend and real backend run together on a Vultr VM behind HTTPS. Deployment and a live model call are still pending. Intended users are small procurement teams working from structured exports; demand, pricing and time savings remain unvalidated. Preparation began 2 November 2026, before the advertised build window; eligibility must be confirmed.'
    ),
    'track':'Challenge 2 - Powering the Future of Work',
    'categories':['Procurement','Finance operations','Workflow automation'],
    'technologies':['JavaScript','Node.js','Docker','Caddy','Vultr Cloud Compute (deployment pending)','Vultr Serverless Inference (optional; unverified)'],
    'participationMode':'Online',
    'githubRepository':REPO,
    'demoApplicationPlatform':'Vultr VM (planned; not yet deployed)',
    'demoApplicationUrl':None,
    'slidePresentation':'artifacts/LedgerPilot_pitch_v2.pdf',
    'coverImage':'artifacts/LedgerPilot_cover_1600x900.png',
    'finalDemoVideo':None,
    'preparationDisclosure':'Preparation and code creation began 2 November 2026, before the advertised event build window. Disclose this history and confirm event-specific eligibility.',
    'notReadyForFinalSubmission':['Organizer approval and eligibility confirmation','Verified public Vultr application URL','Actual hosted-app recording','Refresh deployment statements after verification']
}
for key,lo,hi in [('title',5,50),('shortDescription',50,255),('longDescription',600,2000)]:
    assert lo<=len(fields[key])<=hi,(key,len(fields[key]))
(ROOT/'submission/fields.json').write_text(json.dumps(fields,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=['# Form text - prepared, deployment pending','',f'Source checked: {EVENT}',
       'Event-specific form limits take priority. Null URL/video fields must be completed after actual deployment.','']
for key in ['title','shortDescription','longDescription','track','participationMode','githubRepository','demoApplicationPlatform']:
    count=f' ({len(fields[key])} characters)' if key in ['title','shortDescription','longDescription'] else ''
    lines.extend([f'## {key}{count}','',fields[key],''])
lines.extend(['## Categories','',', '.join(fields['categories']),'','## Technologies','',', '.join(fields['technologies']),'',
              '## Remaining before final submission','']+['- '+x for x in fields['notReadyForFinalSubmission']])
(ROOT/'submission/ready-to-paste.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')

pdfmetrics.registerFont(TTFont('Segoe','C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeBold','C:/Windows/Fonts/segoeuib.ttf'))
W,H=1280,720
INK='#203C31'; MUTED='#64776A'; BG='#F5F7F0'; GREEN='#C8DEA5'; LINE='#DDE5D8'; WHITE='#FFFFFF'
pdfpath=OUT/'LedgerPilot_pitch_v2.pdf'
c=canvas.Canvas(str(pdfpath),pagesize=(W,H))
c.setTitle('LedgerPilot | Evidence-led procurement review | Preparation v2')
c.setAuthor('LedgerPilot contributors')
page_no=0
def text(x,y,value,size=24,bold=False,color=INK):
    assert x>=0 and 0<=y<=H,(value,x,y)
    c.setFillColor(HexColor(color)); c.setFont('SegoeBold' if bold else 'Segoe',size)
    c.drawString(x,H-y,value)
def para(x,y,value,width=1120,size=25,color=INK,max_height=500):
    style=ParagraphStyle('p',fontName='Segoe',fontSize=size,leading=size*1.42,textColor=HexColor(color))
    p=Paragraph(value,style); _,height=p.wrap(width,max_height)
    assert height<=max_height and y+height<665,(value,y,height,max_height)
    p.drawOn(c,x,H-y-height); return height
def box(x,y,w,h,color=WHITE,r=16):
    c.setFillColor(HexColor(color));c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=0)
def page(title,sub=None):
    global page_no
    page_no+=1;c.setFillColor(HexColor(BG));c.rect(0,0,W,H,fill=1,stroke=0)
    text(64,40,'LEDGERPILOT / AGENT RUSH / CHALLENGE 2',13,color=MUTED)
    text(64,116,title,43,True)
    if sub:para(64,140,sub,size=19,color=MUTED,max_height=65)
    text(64,690,'Preparation v2 | Local rules mode verified | Vultr deployment and live inference pending',12,color=MUTED)
    text(1184,690,f'{page_no:02}',14,color=MUTED)
def end():c.showPage()
def screenshot(name,x,y,w,h):
    img=Image.open(OUT/name).convert('RGB');iw,ih=img.size
    ratio=min(w/iw,h/ih);dw,dh=iw*ratio,ih*ratio
    c.drawImage(ImageReader(img),x+(w-dw)/2,H-y-dh,width=dw,height=dh)
def bullets(x,y,items,width=520,size=23):
    for item in items:
        height=para(x,y,item,width,size,max_height=210);y+=height+24
    return y

page('LedgerPilot')
text(64,224,'Procurement, reconciled.',58,True)
para(64,264,'Source evidence behind every exception.<br/>A human decision before every export.',width=1000,size=33,max_height=150)
for x,label,value in [(64,'SYNTHETIC BATCH','$11,050'),(460,'READY FOR REVIEW','$4,780'),(856,'HELD FOR CLARIFICATION','$6,270')]:
    box(x,450,360,137);text(x+24,489,label,14,color=MUTED);text(x+24,546,value,41,True)
text(64,630,'8 invoices | 5 purchase orders | 5 receipts | No real transactions',19,color=MUTED)
end()

page('A plausible invoice can still be wrong.','Start with the source documents, then decide what needs clarification.')
for x,title,ref,qty in [(64,'Purchase order','PO-2402','100 units ordered'),(460,'Goods receipt','GR-402','80 units received'),(856,'Invoice','INV-1002','100 units billed')]:
    box(x,228,360,190);text(x+24,272,title,27,True);text(x+24,316,ref,20,color=MUTED);text(x+24,372,qty,28,True)
text(64,491,'The exception is inspectable.',30,True)
para(64,517,'The same SKU is billed for more units than the receipt supports. LedgerPilot keeps the quantities, agreed price and receipt reference together for review.',size=25,max_height=130)
end()

page('One review queue, with a clear next action.','Actual local prototype. All organizations and records are synthetic.')
screenshot('demo-overview.png',64,209,588,442)
bullets(698,224,[
    '<b>Validate</b> structured purchase orders, receipts and invoices.',
    '<b>Match</b> supplier identity, prices and available quantities.',
    '<b>Explain</b> the verified exception and stage an unsent follow-up.',
    '<b>Review</b> before exporting any clean invoice.'
],width=510,size=23)
end()

page('Show the evidence behind the hold.','INV-1002 stays on hold: 100 units invoiced, 80 received under GR-402.')
screenshot('review-exception.png',64,204,588,452)
bullets(698,221,[
    'The source table exposes the document reference, quantities and agreed price.',
    'The supplier clarification is an <b>unsent draft</b>. Marking follow-up sends nothing.',
    'Held invoices cannot be approved for export, including through direct API requests.'
],width=510,size=24)
end()

page('Approval and export are separate decisions.','Actual local confirmation UI; CSV contents verified through HTTP and container tests.')
screenshot('export-confirmation.png',64,209,588,442)
bullets(698,222,[
    '<b>First:</b> inspect the source evidence and approve a clean invoice.',
    '<b>Then:</b> explicitly confirm review before downloading the CSV.',
    'The tested export contains approved INV-1001 and excludes held INV-1002.',
    'No payment or email adapter exists.'
],width=510,size=22)
end()

page('Vultr powers the intended workflow backend.','Architecture is prepared; this is not evidence of a completed cloud deployment.')
for x,title,body in [(64,'Browser','Review queue\nSource evidence\nConfirmed exports'),(460,'Vultr VM','Node HTTP backend\nMatching engine\nPersistent review state'),(856,'Optional inference','Vultr model API\nExplanations and drafts\nNo action tools')]:
    box(x,228,360,216);text(x+24,271,title,28,True)
    para(x+24,296,escape(body).replace('\n','<br/>'),width=310,size=22,max_height=130)
for x in [429,825]:
    c.setStrokeColor(HexColor(MUTED));c.setLineWidth(2);c.line(x,H-335,x+22,H-335);c.line(x+22,H-335,x+14,H-329);c.line(x+22,H-335,x+14,H-341)
text(64,511,'The deterministic engine controls amounts and verdicts.',29,True)
para(64,542,'Caddy provides HTTPS in the planned VM deployment. The model may supply advisory text; it cannot change the matching result or approve an invoice.',size=24,max_height=105)
end()

page('What is already verified?','Evidence is separated from the work still waiting for cloud access.')
for i,(label,value) in enumerate([
    ('Accounting and allocation','Independent sample totals; cumulative receipt allocation'),
    ('Review boundaries','Held approvals blocked; export consent enforced'),
    ('State and AI boundaries','Session isolation and restart restore; atomic AI text validation'),
    ('Production container','Docker build, HTTP workflow and Compose config passed')
]):
    y=225+i*87;box(64,y,1152,71);text(86,y+43,label,23,True);text(452,y+43,value,21)
text(64,612,'Six automated tests passed; VM installer syntax was checked in GitHub Actions.',20,color=MUTED)
text(64,649,'Open the verification run',17,color=MUTED)
c.linkURL(CI,(64,H-655,330,H-630),relative=0)
end()

page('A focused business hypothesis.','Intended users: small procurement teams working from structured exports.')
for x,title,body in [
    (64,'Existing workflow','Spreadsheet comparisons require a reviewer to keep source references and follow-ups together.'),
    (460,'Product proposition','One queue combines receipt allocation, visible source evidence, drafts and an export gate.'),
    (856,'Pilot measurement','Compare manual and assisted review on identical batches: time, false-positive holds and evidence usefulness.')
]:
    box(x,226,360,310);text(x+24,274,title,25,True);para(x+24,300,body,width=310,size=23,max_height=215)
para(64,573,'Pricing concept: workspace subscription with batch limits. Customer demand, willingness to pay and time savings remain unvalidated. No market-size or revenue figures are claimed.',size=21,max_height=85,color=MUTED)
end()

page('From a local prototype to a reviewed entry.','Public source is available. Final hosting and submitted status remain pending.')
text(64,222,'Prepared now',28,True)
bullets(64,249,['Functional rules-mode application and public GitHub repository.','Docker and HTTPS configuration; guarded Ubuntu installer.','Form text, actual UI evidence, pitch and recording script.'],width=540,size=23)
text(700,222,'Before final submission',28,True)
bullets(700,249,['Confirm organizer approval and event eligibility.','Confirm hosting funds; deploy and verify a real Vultr URL.','Record the hosted app; update claims; submit on lablab.ai.'],width=510,size=23)
para(64,541,'Preparation and code creation began <b>2 November 2026</b>, before the advertised build window. Disclose this history and confirm event-specific eligibility. The current local video is a captioned screenshot walkthrough, not a hosted-app screencast.',size=20,max_height=95,color=MUTED)
text(64,648,REPO,16,color=MUTED);c.linkURL(REPO,(64,H-655,1180,H-630),relative=0)
end();c.save()

reader=PdfReader(str(pdfpath));assert len(reader.pages)==9
assert all(p.extract_text().strip() for p in reader.pages)
doc=pdfium.PdfDocument(str(pdfpath));thumbs=[]
for i in range(len(doc)):
    image=doc[i].render(scale=1.25).to_pil().convert('RGB')
    image.save(TMP/f'page-{i+1:02}.png')
    if i==0:image.save(OUT/'LedgerPilot_cover_1600x900.png')
    thumbs.append(ImageOps.contain(image,(640,360)))
sheet=Image.new('RGB',(1920,1080),'#DDE5D8')
for i,image in enumerate(thumbs):sheet.paste(image,((i%3)*640,(i//3)*360))
sheet.save(OUT/'LedgerPilot_pitch_v2_preview.png')

# Editable vector cover uses the same labels and source-derived figures as page 1.
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1280 720">',
     f'<rect width="1280" height="720" fill="{BG}"/>','<g font-family="Segoe UI,Arial,sans-serif">']
def svgtext(x,y,value,size,bold=False,color=INK):
    svg.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(value)}</text>')
svgtext(64,40,'LEDGERPILOT / AGENT RUSH / CHALLENGE 2',13,color=MUTED)
svgtext(64,116,'LedgerPilot',43,True)
svgtext(64,224,'Procurement, reconciled.',58,True)
svgtext(64,304,'Source evidence behind every exception.',33)
svgtext(64,351,'A human decision before every export.',33)
for x,label,value in [(64,'SYNTHETIC BATCH','$11,050'),(460,'READY FOR REVIEW','$4,780'),(856,'HELD FOR CLARIFICATION','$6,270')]:
    svg.append(f'<rect x="{x}" y="450" width="360" height="137" rx="16" fill="white"/>')
    svgtext(x+24,489,label,14,color=MUTED);svgtext(x+24,546,value,41,True)
svgtext(64,630,'8 invoices | 5 purchase orders | 5 receipts | No real transactions',19,color=MUTED)
svgtext(64,690,'Preparation v2 | Local rules mode verified | Vultr deployment and live inference pending',12,color=MUTED)
svg.extend(['</g>','</svg>'])
(OUT/'LedgerPilot_cover_editable.svg').write_text('\n'.join(svg),encoding='utf-8')
report={'pdfPages':9,'coverPixels':list(Image.open(OUT/'LedgerPilot_cover_1600x900.png').size),'fieldCharacterCounts':{k:len(fields[k]) for k in ['title','shortDescription','longDescription']},'publicDeploymentVerified':False,'finalSubmissionReady':False}
(ROOT/'submission/materials-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
