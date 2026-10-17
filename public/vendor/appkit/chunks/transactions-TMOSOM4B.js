import"./chunk-FD53VVJK.js";import"./chunk-KT7V2Q4W.js";import"./chunk-VR5VPGM6.js";import"./chunk-XJGBVDZY.js";import"./chunk-MRSIGAIS.js";import"./chunk-MFAXNECB.js";import"./chunk-XNJXARDC.js";import{C as a,M as p,t as c,w as m}from"./chunk-LQXT3KQ7.js";import"./chunk-7YSPBAD3.js";import"./chunk-EPUPAEBR.js";import"./chunk-BR6LWKVZ.js";import"./chunk-LM7YGHAN.js";import"./chunk-I6SR7HBW.js";import"./chunk-IONIGR6B.js";import"./chunk-V3I7JEPO.js";import"./chunk-775E65SU.js";var w=c`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;var u=function(o,e,i,r){var l=arguments.length,t=l<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,r);else for(var f=o.length-1;f>=0;f--)(n=o[f])&&(t=(l<3?n(t):l>3?n(e,i,t):n(e,i))||t);return l>3&&t&&Object.defineProperty(e,i,t),t},s=class extends a{render(){return m`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="3">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};s.styles=w;s=u([p("w3m-transactions-view")],s);export{s as W3mTransactionsView};
