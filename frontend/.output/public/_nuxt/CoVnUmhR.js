import{e as a,s as r,R as c,g as s,_ as l,o as i,c as u,a as t,n as p}from"./CDC5foPa.js";const d=a({setup(){const{appThemeColor:e}=r(c()),o=s(()=>["dark","midnight"].includes(e.value));return{logoSource:s(()=>o.value?"./whitelogo.png":"./logo.png"),isDarkThemed:o}}}),_={class:"flex items-end justify-self-center gap-1"},g=["src"];function m(e,o,n,f,h,x){return i(),u("div",_,[t("img",{src:e.logoSource,alt:"logo",class:"w-14 h-14"},null,8,g),t("h1",{class:p(["text-3xl leading-none",e.isDarkThemed?"text-white":"text-black"])}," MultiCash ",2)])}const C=l(d,[["render",m]]);export{C as _};