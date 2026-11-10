import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultTextStyles,textStyleFor,validateTextStyles} from '../ui/text-styles.js';

test('default named text styles cover general, title, notes and dimension drafting',()=>{
 let styles=defaultTextStyles();
 assert.deepEqual(styles.map(style=>style.name),['General','Drawing title','General notes','Dimensions and callouts']);
 assert.equal(validateTextStyles(styles,styles[0].id),undefined);
 assert.equal(textStyleFor({textStyles:styles},'missing'),styles[0]);
});

test('text styles reject invalid IDs, names, heights, colors and fonts',()=>{
 let styles=defaultTextStyles();
 for(let invalid of [
  {...styles[0],textHeight:0},
  {...styles[0],color:'red'},
  {...styles[0],fontFamily:'Comic Sans'},
  {...styles[0],name:styles[1].name},
  {...styles[0],extra:true}
 ])assert.throws(()=>validateTextStyles([invalid,styles[1]],styles[0].id),/text style/i);
 assert.throws(()=>validateTextStyles(styles,'missing'),/active text style/i);
});
