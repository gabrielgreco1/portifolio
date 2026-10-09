"""Rebuild the dated GA city snapshot from captured rows and a local GeoNames dump.
Usage: python3 scripts/import-visitor-google.py /path/to/geonames-directory
The directory must contain cities500.zip, countryInfo.txt and admin1CodesASCII.txt
matching the pinned GeoNames source manifest.
No network requests or uploads are made by this script.
"""
import csv,json,zipfile,unicodedata,hashlib,collections,sys,re
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
region_raw=(root/'data/analytics/ga4-city-regions-2026-10-08.psv').read_text()
h=2166136261
for c in region_raw:h=((h^ord(c))*16777619)&0xffffffff
assert h==0x0d0ac427,hex(h)
regions={}
for line in region_raw.splitlines():
 region,*cities=line.split('|')
 for city in cities:
  if city in regions:raise ValueError(f'Ambiguous regional join: {city}')
  regions[city]=region
named=[r['city'] for r in rows if r['city']!='(not set)']
assert len(named)==len(set(named))==len(regions)==311 and set(named)==set(regions)

normalize=lambda s:''.join(c for c in unicodedata.normalize('NFD',s.casefold()) if unicodedata.category(c)!='Mn').replace('-', ' ')
def region_key(value,iso):
 value=normalize(value)
 if iso=='BR':value=re.sub(r'^state of ','',value)
 if iso=='PT':value=re.sub(r' district$','',value)
 if iso=='AO':value=re.sub(r' province$','',value)
 if iso=='PY':value=re.sub(r' department$','',value)
 if iso=='CL':value=re.sub(r' region$','',value)
 return value
admin_regions=collections.defaultdict(set)
admin_display={}
for line in (geo/'admin1CodesASCII.txt').read_text().splitlines():
 code,name,ascii_name,_=line.split('\t');iso,admin=code.split('.',1)
 admin_display[(iso,admin)]=name
 for name in (name,ascii_name):admin_regions[(iso,region_key(name,iso))].add(admin)
country={}
for l in (geo/'countryInfo.txt').read_text().splitlines():
 if not l.startswith('#') and l.strip():
  r=l.split('\t');country[r[4]]=r[0]
country['(not set)']=None
country['Netherlands']='NL'
aliases={(a['country'],a['city'],a['region']):a for a in json.loads((root/'data/analytics/city-aliases.json').read_text())}
def city_lookup(row):
 alias=aliases.get((country[row['country']],row['city'],regions.get(row['city'])))
 return alias['canonicalName'] if alias else row['city']
wanted={(country[r['country']],normalize(city_lookup(r))) for r in rows}
index=collections.defaultdict(dict)
z=zipfile.ZipFile(geo/'cities500.zip')
for l in z.read('cities500.txt').decode().splitlines():
 r=l.split('\t'); names={normalize(s) for s in [r[1],r[2],*r[3].split(',')] if s}
 for name in names:
  k=(r[8],name)
  if k in wanted:index[k][r[0]]={'geonameId':r[0],'name':r[1],'latitude':round(float(r[4]),1),'longitude':round(float(r[5]),1),'featureCode':r[7],'admin1':r[10]}
points=[];ambiguous=[]
for n,r in enumerate(rows):
 candidates=list(index[(country[r['country']],normalize(city_lookup(r)))].values())
 region=regions.get(r['city'])
 admin_matches=admin_regions.get((country[r['country']],region_key(region,country[r['country']])),set()) if region else set()
 if len(admin_matches)==1:candidates=[c for c in candidates if c['admin1'] in admin_matches]
 primary=[c for c in candidates if normalize(c['name'])==normalize(city_lookup(r))]
 if primary:candidates=primary
 p={'id':f'ga4-city-{n+1}','city':r['city'],'country':country[r['country']],'activeUsers':int(r['activeUsers']),'engagedSessions':int(r['engagedSessions']),'region':region,'regionMatched':len(admin_matches)==1}
 if len(admin_matches)==1:p['regionDisplay']=admin_display[(country[r['country']],next(iter(admin_matches)))]
 alias=aliases.get((country[r['country']],r['city'],region))
 if alias:p['aliasSource']=alias['source']
 if r['city']=='(not set)':p.update(latitude=None,longitude=None,locationStatus='unknown')
 elif len(candidates)==1:p.update(**candidates[0],locationStatus='matched')
 elif candidates and len({(c['latitude'],c['longitude']) for c in candidates})==1:
  p.update(latitude=candidates[0]['latitude'],longitude=candidates[0]['longitude'],geonameIds=[c['geonameId'] for c in candidates],locationStatus='matched',locationMethod='same-rounded-city-center')
 else:p.update(latitude=None,longitude=None,locationStatus='ambiguous' if candidates else 'unmatched');ambiguous.append({'city':r['city'],'country':r['country'],'candidates':candidates})
 points.append(p)
out={'schemaVersion':1,'source':'Google Analytics 4','mode':'google','available':True,'period':{'start':'2020-01-01','end':'2026-10-08'},'retrievedOn':'2026-10-09','reportedTotals':{'activeUsers':869,'engagedSessions':278},'filters':{'hostnameRegex':r'^(www\.)?gabrielgreco\.com$','streamId':'16056749338'},'rowCount':320,'sourceSha256':hashlib.sha256(raw.encode()).hexdigest(),'regionSourceSha256':hashlib.sha256(region_raw.encode()).hexdigest(),'coordinateSource':{'name':'GeoNames cities500','url':'https://download.geonames.org/export/dump/','license':'CC BY 4.0','retrievedOn':'2026-10-09','sha256':hashlib.sha256(Path(geo/'cities500.zip').read_bytes()).hexdigest()},'points':points}
(root/'src/data').mkdir(exist_ok=True)
(root/'src/data/visitor-history.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(geo/'unresolved.json').write_text(json.dumps(ambiguous,ensure_ascii=False,indent=2))
print(collections.Counter(p['locationStatus'] for p in points))
print('countries',len(set(p['country'] for p in points if p['country'])))
print('Unresolved records kept without coordinates:',len(ambiguous))
