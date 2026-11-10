import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 defaultActiveLabelStyles,defaultLabelStyles,applyLabelStyle,labelFamilyForEntity,
 labelStyleFor,labelStyleColor,formatAreaLabel,formatStation,formatLabelNumber,
 validateLabelStyles
} from '../ui/label-styles.js';
import {createContourLabels} from '../ui/contour-labels.js';

test('default civil label styles cover only the existing parcel, contour and alignment families',()=>{
 let styles=defaultLabelStyles(),active=defaultActiveLabelStyles(styles);
 assert.deepEqual(Object.keys(styles),['parcel','contour','alignment']);
 assert.equal(active.parcel,'parcel-standard');
 assert.equal(styles.parcel[0].color,'byLayer');
 assert.equal(validateLabelStyles(styles,active),undefined);
});

test('label style validation rejects invalid dimensions, colors, precision and family references',()=>{
 let styles=defaultLabelStyles(),active=defaultActiveLabelStyles(styles);
 for(let invalid of [
  {...styles.parcel[0],textHeight:0},
  {...styles.parcel[0],color:'red'},
  {...styles.parcel[0],areaPrecision:7},
  {...styles.parcel[0],alternateAreaPrecision:-1},
  {...styles.parcel[0],areaFormat:'unknown'},
  {...styles.parcel[0],family:'contour'},
  {...styles.parcel[0],extra:true}
 ])assert.throws(()=>validateLabelStyles({...styles,parcel:[invalid]},active));
 assert.throws(()=>validateLabelStyles(styles,{...active,parcel:'missing'}),/active label style/);
 assert.throws(()=>validateLabelStyles({...styles,parcel:[styles.parcel[0],{...styles.parcel[0],id:'another'}]},active),/Invalid label style/);
});

test('style application persists the family link and resolves its rendering properties',()=>{
 let styles=defaultLabelStyles(),project={labelStyles:styles,activeLabelStyles:defaultActiveLabelStyles(styles)};
 let parcel={type:'parcel'},parcelStyle={...styles.parcel[0],id:'parcel-custom',textHeight:3,color:'#112233'};
 styles.parcel.push(parcelStyle);applyLabelStyle(parcel,parcelStyle);
 assert.equal(labelFamilyForEntity(parcel),'parcel');
 assert.equal(labelStyleFor(project,'parcel',parcel.labelStyleId).textHeight,3);
 assert.equal(labelStyleColor(parcelStyle,'#aabbcc'),'#112233');
 let contour={type:'text',contourLabel:true,contourElevation:101.375,text:'101',size:1};
 let contourStyle={...styles.contour[0],id:'contour-custom',textHeight:2.5,elevationPrecision:2};
 applyLabelStyle(contour,contourStyle);
 assert.equal(contour.labelStyleId,contourStyle.id);
 assert.equal(contour.text,'101.38');
 assert.equal(contour.size,2.5);
 assert.throws(()=>applyLabelStyle(parcel,contourStyle),/matching civil label/);
});

test('parcel area and alignment station style formats honor precision and units',()=>{
 let parcel=defaultLabelStyles().parcel[0];
 assert.equal(formatAreaLabel(1234.56789,'ft',parcel),'1,234.57 ft² · 0.028 ac');
 assert.equal(formatAreaLabel(1234.56789,'ft',{...parcel,areaFormat:'drawing-units',areaPrecision:1}),'1,234.6 ft²');
 assert.equal(formatAreaLabel(10000,'m',{...parcel,areaFormat:'acres-hectares',alternateAreaPrecision:2}),'1.00 ha');
 let alignment=defaultLabelStyles().alignment[0];
 assert.equal(formatStation(1234.5,alignment),'12+34.50');
 assert.equal(formatStation(1234.5,{...alignment,stationPrecision:0}),'12+35');
 assert.equal(formatStation(1234.5,{...alignment,stationFormat:'decimal',stationPrecision:1}),'1,234.5');
 assert.equal(formatLabelNumber(9.876,1),'9.9');
});

test('contour label generation formats generated elevations to the selected precision',()=>{
 let source=[{z:102.25,a:{x:0,y:0},b:{x:10,y:0}}];
 assert.equal(createContourLabels(source,.25,1,0)[0].text,'102');
 assert.equal(createContourLabels(source,.25,1,2)[0].text,'102.25');
 assert.throws(()=>createContourLabels(source,1,1,7),/settings/);
});
