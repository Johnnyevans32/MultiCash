import{_ as d}from"./Cu3int81.js";import{f as i}from"./BIfFRkhF.js";import{e as c,r as f,B as y,_ as b,o as r,c as s,t as a,G as l,a as m,b as _,n as g,E as V}from"./CDC5foPa.js";const h=c({props:{title:{type:String,required:!1},modelValue:{},placeholder:{type:String,required:!1},currency:{type:String},balance:{type:Number},min:{type:Number},max:{type:Number}},emits:["update:modelValue"],setup(e,n){const o=f(0);y(o,()=>{t()});const t=()=>n.emit("update:modelValue",Number(o.value));return{handleModelValueChangeAction:t,amount:o}}}),N={key:0,class:"text-sm"},B={class:"flex items-center"},C={class:"bg-lightbase rounded-lg pl-5 pr-2 py-2 border-[1px] border-r-0 border-base rounded-r-none"};function k(e,n,o,t,v,M){const u=d;return r(),s("div",null,[e.title?(r(),s("span",N,a(e.title)+":",1)):l("",!0),m("div",B,[m("span",C,a(e.currency),1),_(u,{modelValue:e.amount,"onUpdate:modelValue":n[0]||(n[0]=p=>e.amount=p),inputType:"number",class:"w-full","custom-css":"pl-0 border-l-0 rounded-l-none",placeholder:"Enter amount (e.g., 100)",min:e.min,max:e.max},null,8,["modelValue","min","max"])]),e.balance!==void 0?(r(),s("span",{key:1,class:g(["text-tiny",e.amount>e.balance?"text-red-600":"text-green-600"])},"Wallet Balance: "+a(e.currency)+" "+a(("formatMoney"in e?e.formatMoney:V(i))(e.balance,10)),3)):l("",!0)])}const q=b(h,[["render",k]]);export{q as _};