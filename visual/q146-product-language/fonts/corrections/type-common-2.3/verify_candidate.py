"""Independent post-serialization regression check against the exact reconstructed 2.2 base."""
import argparse,json,hashlib,sys
from pathlib import Path
from fontTools.ttLib import TTFont
import pathops
from rebuild import contour_areas, reconstructed_base, check_source

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def shape(font,name):
 p=pathops.Path();font.getGlyphSet()[name].draw(p.getPen());return pathops.simplify(p)
def compare(args):
 report={}
 for style in ['Text','Display']:
  a=TTFont(args.base_fonts/f'SGGPaperUI-{style}.woff2',recalcTimestamp=False);b=TTFont(args.candidate/'fonts'/f'SGGPaperUI-{style}.woff2',recalcTimestamp=False);target=a.getBestCmap()[ord('愿')];order=a.getGlyphOrder();changed=[g for g in order if a['glyf'][g].compile(a['glyf'])!=b['glyf'][g].compile(b['glyf'])];assert changed==[target];assert a.getBestCmap()==b.getBestCmap() and order==b.getGlyphOrder();assert a['hmtx'].metrics==b['hmtx'].metrics
  for table in ['OS/2','hhea','hmtx','cmap']:assert a[table].compile(a)==b[table].compile(b)
  removed=pathops.op(shape(a,target),shape(b,target),pathops.PathOp.DIFFERENCE).area;added=pathops.op(shape(b,target),shape(a,target),pathops.PathOp.DIFFERENCE).area;assert removed==0 and 0<added<2000
  old=contour_areas(a['glyf'][target]);new=contour_areas(b['glyf'][target]);assert sum(x<0 for x in old)==1 and sum(x<0 for x in new)==2;assert sorted(x for x in old if x>0)==sorted(x for x in new if x>0)
  report[style]={'glyphsCompared':len(order),'changedGlyphs':changed,'unchangedGlyphs':len(order)-1,'cmapEqual':True,'orderEqual':True,'allMetricsEqual':True,'removedSilhouetteArea':removed,'addedSilhouetteArea':added,'oldCounters':1,'newCounters':2,'outerContourAreasUnchanged':True,'unchangedPriorOpticalCorrections':['图','复'],'sha256':sha(args.candidate/'fonts'/f'SGGPaperUI-{style}.woff2')}
 assert sha(args.base_fonts/'SGGPaperLogo.woff2')==sha(args.candidate/'fonts/SGGPaperLogo.woff2');report['Logo']={'bytesUnchanged':True,'sha256':sha(args.candidate/'fonts/SGGPaperLogo.woff2')};args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--base-fonts',type=Path,help='Optional exact reconstructed 2.2 fonts; otherwise replay the immutable archive')
 parser.add_argument('--base-archive',type=Path,default=Path(__file__).resolve().parents[2]/'source-snapshot.zip')
 parser.add_argument('--candidate',type=Path,required=True)
 parser.add_argument('--report',type=Path,required=True)
 args=parser.parse_args();check_source();args.report.parent.mkdir(parents=True,exist_ok=True)
 if args.base_fonts:
  compare(args)
 else:
  with reconstructed_base(args.base_archive,args.report.parent) as (_,base,_log):
   args.base_fonts=base/'fonts';compare(args)
if __name__=='__main__':main()
