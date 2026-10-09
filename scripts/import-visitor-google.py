"""Rebuild the dated GA city snapshot from captured rows and a local GeoNames dump.
Usage: python3 scripts/import-visitor-google.py /path/to/geonames-directory
The directory must contain cities500.zip and countryInfo.txt from GeoNames.
No network requests or uploads are made by this script.
"""
import csv,json,zipfile,unicodedata,hashlib,collections,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
geo=Path(sys.argv[1])
manifest=json.loads((root/'data/analytics/geonames-source.json').read_text())
for name,source in manifest['files'].items():
 if hashlib.sha256((geo/name).read_bytes()).hexdigest()!=source['sha256']:
  raise SystemExit(f'{name}: source differs from the pinned 2026-10-09 dump. Review the new source and update provenance before rebuilding.')
raw=(root/'data/analytics/ga4-cities-2026-10-08.psv').read_text()
h=2166136261
for c in raw:h=((h^ord(c))*16777619)&0xffffffff
assert h==0x3c6372e5,hex(h)
rows=list(csv.DictReader(raw.splitlines(),delimiter='|'))
normalize=lambda s:''.join(c for c in unicodedata.normalize('NFD',s.casefold()) if unicodedata.category(c)!='Mn')
country={}
for l in (geo/'countryInfo.txt').read_text().splitlines():
 if not l.startswith('#') and l.strip():
  r=l.split('\t');country[r[4]]=r[0]
country['(not set)']=None
country['Netherlands']='NL'
wanted={(country[r['country']],normalize(r['city'])) for r in rows}
index=collections.defaultdict(dict)
z=zipfile.ZipFile(geo/'cities500.zip')
for l in z.read('cities500.txt').decode().splitlines():
 r=l.split('\t'); names={normalize(s) for s in [r[1],r[2],*r[3].split(',')] if s}
 for name in names:
  k=(r[8],name)
  if k in wanted:index[k][r[0]]={'geonameId':r[0],'name':r[1],'latitude':round(float(r[4]),1),'longitude':round(float(r[5]),1),'featureCode':r[7],'admin1':r[10]}
points=[];ambiguous=[]
for n,r in enumerate(rows):
 candidates=list(index[(country[r['country']],normalize(r['city']))].values())
 primary=[c for c in candidates if normalize(c['name'])==normalize(r['city'])]
 if primary:candidates=primary
 p={'id':f'ga4-city-{n+1}','city':r['city'],'country':country[r['country']],'activeUsers':int(r['activeUsers']),'engagedSessions':int(r['engagedSessions'])}
 if r['city']=='(not set)':p.update(latitude=None,longitude=None,locationStatus='unknown')
 elif len(candidates)==1:p.update(**candidates[0],locationStatus='matched')
 else:p.update(latitude=None,longitude=None,locationStatus='ambiguous' if candidates else 'unmatched');ambiguous.append({'city':r['city'],'country':r['country'],'candidates':candidates})
 points.append(p)
out={'schemaVersion':1,'source':'Google Analytics 4','mode':'google','available':True,'period':{'start':'2020-01-01','end':'2026-10-08'},'retrievedOn':'2026-10-09','reportedTotals':{'activeUsers':869,'engagedSessions':278},'filters':{'hostnameRegex':r'^(www\.)?gabrielgreco\.com$','streamId':'16056749338'},'rowCount':320,'sourceSha256':hashlib.sha256(raw.encode()).hexdigest(),'coordinateSource':{'name':'GeoNames cities500','url':'https://download.geonames.org/export/dump/','license':'CC BY 4.0','retrievedOn':'2026-10-09','sha256':hashlib.sha256(Path(geo/'cities500.zip').read_bytes()).hexdigest()},'points':points}
(root/'src/data').mkdir(exist_ok=True)
(root/'src/data/visitor-history.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(geo/'unresolved.json').write_text(json.dumps(ambiguous,ensure_ascii=False,indent=2))
print(collections.Counter(p['locationStatus'] for p in points))
print('countries',len(set(p['country'] for p in points if p['country'])))
print('Unresolved records kept without coordinates:',len(ambiguous))
