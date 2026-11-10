export class DocumentHistory{
 constructor({getModel,setModel,validate,prepareMutation=()=>{},afterMutation=()=>{},afterRollback=()=>{},afterRestore=()=>{},limit=75}){
  this.getModel=getModel;
  this.setModel=setModel;
  this.validate=validate;
  this.prepareMutation=prepareMutation;
  this.afterMutation=afterMutation;
  this.afterRollback=afterRollback;
  this.afterRestore=afterRestore;
  this.limit=limit;
  this.past=[];
  this.future=[];
 }
 snapshot(){return JSON.stringify(this.getModel())}
 restore(snapshot){
  let prior=JSON.parse(snapshot),current=this.getModel();
  for(let key of ['entities','layers']){
   let existing=new Map(current[key].map(value=>[value.id,value]));
   prior[key]=prior[key].map(value=>{
    let ref=existing.get(value.id);
    if(!ref)return value;
    Object.keys(ref).forEach(key=>delete ref[key]);
    return Object.assign(ref,value);
   });
  }
  this.setModel(prior);
 }
 record(snapshot){
  this.past.push(snapshot);
  if(this.past.length>this.limit)this.past.shift();
  this.future=[];
 }
 mutate(action,options={}){
  let before=this.snapshot(),beforeModel=JSON.parse(before);
  try{
   action();
   this.prepareMutation(beforeModel,this.getModel(),options);
   this.validate(this.getModel());
  }catch(error){
   this.restore(before);
   this.afterRollback();
   throw error;
  }
  this.record(before);
  this.afterMutation();
 }
 undo(){
  if(!this.past.length)return false;
  this.future.push(this.snapshot());
  this.restore(this.past.pop());
  this.afterRestore();
  return true;
 }
 redo(){
  if(!this.future.length)return false;
  this.past.push(this.snapshot());
  this.restore(this.future.pop());
  this.afterRestore();
  return true;
 }
}
