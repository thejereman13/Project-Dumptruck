import{t as S,u as _,c as P,a as o,i as s,m as H,b as C,d as x,S as N,p as mt,e as G,o as pe,f as se,g as q,s as j,N as Ie,I as Nt,F as Y,h as It,j as le,k as Se,l as Lt,n as Et,q as Dt,r as Ut,v as At,T as ft,w as ht,x as Tt,B as Ye,y as gt,z as Qt,C as Ft,A as Bt,D as vt,E as qt,G as zt,H as Mt,J as Ot,K as jt,L as Jt,M as Ht,R as Le,O as Yt,P as Gt,Q as Wt}from"./vendor.cd761fae.js";const Kt=function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const l of r)if(l.type==="childList")for(const d of l.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&i(d)}).observe(document,{childList:!0,subtree:!0});function t(r){const l={};return r.integrity&&(l.integrity=r.integrity),r.referrerpolicy&&(l.referrerPolicy=r.referrerpolicy),r.crossorigin==="use-credentials"?l.credentials="include":r.crossorigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(r){if(r.ep)return;r.ep=!0;const l=t(r);fetch(r.href,l)}};Kt();const Zt="0.20.0",bt="907313861790-8u0up50k8acr0cqlt654lbi7dmo4aafc.apps.googleusercontent.com";const Xt=S('<div class="blockLoader"><div></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>'),en=S('<div class="dotLoader"><div class="bounce1"></div><div class="bounce2"></div><div></div></div>');function tn(){return Xt.cloneNode(!0)}function nn(){return en.cloneNode(!0)}const rn=S("<div><div></div></div>"),on=S("<div></div>"),we={notificationBackground:_`
        border-radius: 0.5rem;
        padding: 0.5rem;
        display: flex;
        max-width: 24rem;
        font-size: 1rem;
        transition: all 0.3s ease;
        position: absolute;
        right: 1rem;
        bottom: 1rem;
        z-index: 1024;
    `,notificationText:_`
        display: flex;
        align-items: center;
    `,notificationHide:_`
        opacity: 0;
    `,notificationError:_`
        background-color: var(--theme-error);
    `,notificationInfo:_`
        background-color: var(--theme-primary);
    `,notificationLoading:_`
        background-color: var(--theme-primary);
    `};let[it,Ge]=P([]);function ln(){Ge(e=>e.slice(1))}function $t(){setTimeout(ln,800),Ge(mt(e=>{let n=e[0];return n&&n.renderState++,e[0]=n,e}))}function B(e,n){const t=new Date;Ge(mt(i=>(i.push({id:t,text:e,type:n,timeout:n==="info"?2e3:5e3,renderState:0}),i)))}function yt(e){return B(e,"loading"),$t}function sn(e){switch(e.type){case"info":return we.notificationInfo;case"error":return we.notificationError;case"loading":return we.notificationLoading;default:return""}}function an(){const e=()=>it()[0],n=()=>{let t=`${we.notificationBackground} ${sn(e())}`;return e().renderState===0?(e().renderState++,e().type!=="loading"&&setTimeout($t,e().timeout)):e().renderState===2&&(t+=` ${we.notificationHide}`),t};return o(N,{get when(){return it().length>0},get fallback(){return on.cloneNode(!0)},get children(){const t=rn.cloneNode(!0),i=t.firstChild;return s(i,()=>e().text),s(t,(()=>{const r=H(()=>e().type==="loading",!0);return()=>r()&&o(tn,{})})(),null),C(r=>{const l=n(),d=we.notificationText;return l!==r._v$&&x(t,r._v$=l),d!==r._v$2&&x(i,r._v$2=d),r},{_v$:void 0,_v$2:void 0}),t}})}function oe(e){const n=document.createElement("textarea");n.innerHTML=e;const t=n.value;return n.parentElement?.removeChild(n),t}function dn(e){const t=RegExp(/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/gm).exec(e);if(t===null||t.length<9)return 0;const i=t[6]&&t[6].length>0?Number(t[6]):0,r=t[7]&&t[7].length>0?Number(t[7]):0,l=t[8]&&t[8].length>0?Number(t[8]):0;return Number.isNaN(i)||Number.isNaN(r)||Number.isNaN(l)?0:i*3600+r*60+l}function _t(e){if(e===void 0)return"";const n=Math.floor(e/3600);e-=n*3600;const t=Math.floor(e/60);e-=t*60;const i=Math.floor(e);return`${n>0?`${n.toLocaleString()}:`:""}${t.toLocaleString(void 0,{minimumIntegerDigits:2})}:${i.toLocaleString(void 0,{minimumIntegerDigits:2})}`}function wt(e){return{url:`https://i.ytimg.com/vi/${e}/mqdefault.jpg`,width:320,height:180}}function We(e){return e.medium??e.default}function xt(e){const n=/(youtu\S*)(watch\?.*v=|\/)([a-zA-Z0-9_-]*)/.exec(e);if(n&&n.length>=4&&n[3].length===11)return n[3]}function un(e){const n=/(youtu\S*)(playlist\?.*list=)([a-zA-Z0-9_-]*)/.exec(e);if(n&&n.length>=4&&n[3].length===34)return n[3]}function St(e){return{id:e.id,title:oe(e.snippet.localized?.title??e.snippet.title??""),description:oe(e.snippet.localized?.description??e.snippet.description??""),channel:oe(e.snippet.channelTitle),thumbnailMaxRes:e.snippet.thumbnails?We(e.snippet.thumbnails):wt(e.id),videoCount:e.contentDetails.itemCount}}function cn(e){return{id:e.snippet.resourceId.videoId,title:oe(e.snippet.title),channel:"",thumbnailMaxRes:We(e.snippet.thumbnails)}}function Te(e){return{id:e.id,title:oe(e.snippet.localized?.title??e.snippet.title??""),channel:oe(e.snippet.channelTitle),thumbnailMaxRes:e.snippet.thumbnails?We(e.snippet.thumbnails):wt(e.id),duration:e.contentDetails?dn(e.contentDetails.duration):0}}function mn(e,n){return{id:n,title:oe(e.title),channel:oe(e.author_name),thumbnailMaxRes:{height:e.thumbnail_height,width:e.thumbnail_width,url:e.thumbnail_url.replace("hqdefault","mqdefault")}}}async function pt(){try{const n=await(await fetch("/api/user")).json();if(n.id&&n.id.length>0)return n}catch(e){console.warn(e)}return null}async function fn(e,n){try{const i=await(await fetch(`/api/user/${n}`,{signal:e.signal})).json();if(i.id&&i.id.length>0)return i}catch(t){console.warn(t)}return null}async function hn(){try{return(await fetch("/api/user",{method:"DELETE"})).ok}catch(e){console.warn(e)}return!1}async function gn(){try{return(await fetch("/api/logout",{method:"POST"})).ok}catch(e){console.warn(e)}return!1}async function vn(){try{const e=await fetch("/api/room/0",{method:"POST"}),n=await e.json();if(e.ok&&n>0)return n}catch(e){console.warn(e)}return null}async function Qe(e,n){try{const i=await(await fetch(`/api/room/${n}`,{signal:e.signal})).json();if(i.roomID&&i.roomID>0)return i}catch(t){console.warn(t)}return null}async function bn(e,n){try{const t=await fetch(`/api/playing/${n}`,{signal:e.signal});if(!t.ok)return null;const i=await t.json();if(i)return i.currentVideo&&(i.currentVideo.queuedBy==="00000000-0000-0000-0000-000000000000"||i.currentVideo.youtubeID.length===0)?i.currentVideo=void 0:i.currentVideo=i.currentVideo??void 0,i}catch(t){console.warn(t)}return null}async function $n(e,n){try{const t=await fetch(`/api/history/${n}`,{signal:e.signal});if(!t.ok)return null;const i=await t.json();return Array.isArray(i)?i:null}catch(t){console.warn(t)}return null}async function yn(e){try{const n=await fetch("/api/rooms",{signal:e.signal});return n.ok?await n.json():[]}catch(n){console.warn(n)}return[]}async function Be(e,n){if(!n||n.length!==11)return null;try{const t=await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${n}&format=json`,{signal:e.signal}),i=await t.json();return!t.ok||i.error?null:mn(i,n)}catch(t){console.warn(t)}return null}async function _n(e){try{return(await fetch("/api/userHistory/"+e,{method:"DELETE"})).ok}catch(n){console.warn(n)}return!1}async function wn(e){try{return(await fetch("/api/room/"+e,{method:"DELETE"})).ok}catch(n){console.warn(n)}return!1}const xn=S('<div><h2>You are not currently signed in</h2><h3>Please Authenticate with Google</h3><h3>Or refresh the page</h3><div id="GoogleSignInButton"></div></div>'),Sn=S('<button class="btn btn-primary mr-2" id="g_id_logout">Sign Out</button>'),pn=S('<button class="btn btn-primary mr-2">Grant YouTube Access</button>'),kn=S('<button class="btn btn-primary mr-2">Revoke Youtube Access</button>'),Rn=S("<div></div>"),Cn=S("<div><h2>Logged in as </h2></div>"),Vn={profile:_`
        padding: 56px 20px;
        min-height: 100%;
        width: 100%;
        margin-top: var(--navbar-height);
    `};async function Pn(e){await fetch(`https://oauth2.googleapis.com/revoke?token=${e}`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"}})}const kt=10*60*1e3;function Nn(e){const n=new Date().getTime()+kt;return e.expiry_date<n}async function In(){try{const n=await(await fetch("/api/authRefresh")).json();if(n.id&&n.id.length>0)return n}catch(e){console.error("Failed to Refresh Token",e)}return null}async function Ln(e){try{const t=await(await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).json();if(t.id&&t.id.length>0)return t}catch(n){console.error("Failed to Refresh Token",n)}return null}const[E,xe]=P(null);function En(e){(!e.access_token||e.expiry_date===0)&&google.accounts.oauth2.initCodeClient({client_id:bt,scope:"https://www.googleapis.com/auth/youtube.readonly",ux_mode:"popup",callback:t=>{Ln(t).then(i=>{i?xe(i):B(`Failed to Grant Youtube Access.
Please Try Again.`,"error")})}}).requestCode()}async function rt(){google.accounts.id.disableAutoSelect(),await gn()?(console.log("Logged Out"),xe(null)):B("Failed to Log Out","error")}async function Dn(){pt().then(e=>{e&&e.googleID&&e.access_token&&xe(e)})}function Un(){const e=i=>{try{fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)}).then(async r=>{const l=await r.json();l!==void 0&&l.id!==void 0&&l.id.length>0&&(console.log("User is: ",l),xe(l))})}catch(r){console.warn("Failed to Login on Server",r),B("Failed to Login","error")}};google.accounts.id.initialize({client_id:bt,callback:e,auto_select:!0});const n=()=>pt().then(i=>{i&&i.googleID&&i.access_token?Nn(i)?In().then(xe):xe(i):google.accounts.id.prompt()});let t=null;pe(()=>{n(),t=setInterval(()=>{n()},kt)}),se(()=>{t&&clearInterval(t)})}function ot(){return pe(()=>{google.accounts.id.renderButton(document.getElementById("GoogleSignInButton"),{theme:"filled_blue",size:"large",type:"standard"})}),(()=>{const e=Rn.cloneNode(!0);return s(e,o(N,{get when(){return!E()},get fallback(){return(()=>{const n=Cn.cloneNode(!0),t=n.firstChild;return t.firstChild,s(t,()=>E().name,null),n})()},get children(){const n=xn.cloneNode(!0);return n.firstChild.nextSibling.nextSibling.nextSibling.style.setProperty("display","inline-flex"),n}}),null),s(e,o(N,{get when(){return E()},get children(){const n=Sn.cloneNode(!0);return n.$$click=rt,n}}),null),s(e,o(N,{get when(){return H(()=>!!E(),!0)()&&!E()?.access_token},get children(){const n=pn.cloneNode(!0);return n.$$click=()=>{E()&&En(E())},n}}),null),s(e,o(N,{get when(){return E()?.access_token},get children(){const n=kn.cloneNode(!0);return n.$$click=async()=>{await Pn(E()?.access_token??""),await rt(),hn()},n}}),null),C(()=>x(e,Vn.profile)),e})()}G(["click"]);const An=S('<img referrerpolicy="no-referrer">'),Tn=S('<header><img src="/assets/watch1.png"><h1>Krono</h1><nav></nav></header>'),ee={header:_`
        position: fixed;
        display: flex;
        left: 0;
        top: 0;
        height: var(--navbar-height);
        width: 100%;
        padding: 0;
        background: var(--dp2-surface);
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        z-index: 50;
        & h1 {
            float: left;
            margin: 0;
            padding: 0 1rem;
            font-size: 2rem;
            font-weight: 400;
            line-height: var(--navbar-height);
            color: var(--text-secondary);
        }
        & nav {
            flex: auto;
        }
    `,headerWatch:_`
        float: left;
        height: 100%;
        padding: 0.25rem 0 0.25rem 0.5rem;
    `,headerNav:_`
        display: inline-block;
        padding: 0 1rem;
        min-width: 3rem;
        height: var(--navbar-height);
        background: rgba(255, 255, 255, 0);
        text-decoration: none;
        font-weight: 600;
        color: var(--theme-primary-dark) !important;
        will-change: background-color;
        font-size: 1.5rem;
        cursor: pointer;
        line-height: var(--navbar-height);
        vertical-align: top;
        &:hover,
        &:active {
            background: rgba(0, 0, 0, 0.2);
            text-decoration: none;
        }
        &.active {
            background: rgba(0, 0, 0, 0.4);
        }
    `,headerRight:_`
        float: right;
        padding-right: 0.5rem;
        display: inline-flex;
    `,headerUserIcon:_`
        height: var(--navbar-height);
        border-radius: 50%;
        margin-left: 1rem;
        vertical-align: top;
        padding: 0.25rem 0;
    `,headerRoom:_`
        padding: 0 3rem;
        color: var(--theme-primary) !important;
        font-size: 1.75rem;
        font-weight: 500;
    `},[Ee,ze]=P("");function Qn(){return q(()=>{Ee().length>0?document.title="Krono: "+Ee():document.title="Krono",E()&&console.log(E()?.expiry_date)}),(()=>{const e=Tn.cloneNode(!0),n=e.firstChild,t=n.nextSibling,i=t.nextSibling;return j(t,"data-tip",`Version: ${Zt}`),s(i,o(Ie,{get class(){return ee.headerNav},href:"/",children:"Home"}),null),s(i,o(N,{get when(){return Ee().length>0},get children(){return o(Ie,{get class(){return[ee.headerRoom,ee.headerNav,"active"].join(" ")},href:"",children:Ee})}}),null),s(i,o(N,{get when(){return E()},get fallback(){return o(Ie,{get class(){return[ee.headerNav,ee.headerRight].join(" ")},href:"/login",children:"Login"})},get children(){return o(Ie,{get class(){return[ee.headerNav,ee.headerRight].join(" ")},href:"/profile",get children(){return["Profile",(()=>{const r=An.cloneNode(!0);return C(l=>{const d=ee.headerUserIcon,g=E()?.picture;return d!==l._v$&&x(r,l._v$=d),g!==l._v$2&&j(r,"src",l._v$2=g),l},{_v$:void 0,_v$2:void 0}),r})()]}})}}),null),C(r=>{const l=ee.header,d=ee.headerWatch;return l!==r._v$3&&x(e,r._v$3=l),d!==r._v$4&&x(n,r._v$4=d),r},{_v$3:void 0,_v$4:void 0}),e})()}function ie(){const e=new AbortController;return se(()=>{e.abort()}),e}const Fn=S('<span class="text-neutral-500 text-sm"> in Room</span>'),Bn=S('<button class="btn btn-circle btn-primary ml-auto btn-ghost inline-flex tooltip tooltip-bottom" data-tip="Remove"></button>'),qn=S('<a class="card m-2 cursor-pointer overflow-hidden max-w-sm"><div class="card-body bg-neutral-800 hover:bg-neutral-700 rounded-md p-6"><h2 class="card-title text-primary text-2xl font-medium"></h2></div></a>'),zn=S("<div><p>Nothing Currently Playing</p></div>"),Mn=S('<div><h4 class="font-semibold text-lg">Current Playing: </h4><img><p class="overflow-ellipsis overflow-hidden whitespace-nowrap"></p></div>'),On=S('<span class="text-neutral-500 text-sm">Room is Empty</span>');function Me(e){const[n,t]=P(null),[i,r]=P(0),l=ie();q(()=>{bn(l,e.roomID.toString()).then(g=>{g!==null&&(g.currentVideo&&Be(l,g.currentVideo.youtubeID).then(t),r(g.userCount))})});const d=g=>{g.preventDefault(),g.stopPropagation(),_n(e.roomID).then(Dn)};return(()=>{const g=qn.cloneNode(!0),b=g.firstChild,v=b.firstChild;return s(v,()=>e.name),s(b,o(N,{get when(){return n()},get fallback(){return zn.cloneNode(!0)},children:a=>(()=>{const $=Mn.cloneNode(!0),m=$.firstChild,u=m.nextSibling,f=u.nextSibling;return s(f,()=>a.title),C(()=>j(u,"src",a.thumbnailMaxRes.url.replace("hqdefault","mqdefault"))),$})()}),null),s(b,o(N,{get when(){return i()>0},get fallback(){return On.cloneNode(!0)},get children(){const a=Fn.cloneNode(!0),$=a.firstChild;return s(a,(()=>{const m=H(()=>i()>1,!0);return()=>m()?`${i()} Users`:"1 User"})(),$),a}}),null),s(b,o(N,{get when(){return e.showRemove},get children(){const a=Bn.cloneNode(!0);return a.$$click=d,s(a,o(Nt,{size:"1.5rem"})),a}}),null),C(()=>j(g,"href",e.href)),g})()}G(["click"]);const lt=S("<div></div>"),jn=S('<div class="m-2"><h2 class="text-2xl font-bold mt-4">Public Rooms</h2><div class="flex flex-row flex-wrap"></div></div>'),Jn=S('<button class="btn btn-primary mt-4 ml-4">Create New Room</button>'),Hn=S('<div class="flex flex-col"><h2 class="text-2xl font-bold mt-4">Your Rooms</h2><div class="flex flex-row flex-wrap"></div></div>'),Yn=S('<div class="m-2"><h2 class="text-2xl font-bold mt-4">Recent Rooms</h2><div class="flex flex-row flex-wrap"></div></div>'),Gn={home:_`
        padding: 0 20px;
        margin-top: var(--navbar-height);
        height: 100%;
        overflow-y: auto;
        width: 100%;
    `};function Wn(){const[e,n]=P([]),[t,i]=P([]),r=ie();pe(()=>{yn(r).then(v=>{Promise.all(v.map(async a=>await Qe(r,a.toString()))).then(a=>{r.signal.aborted||i(a.reduce(($,m)=>(m&&$.push(m),$),[]))})})}),q(()=>{const v=E();v&&Promise.all(v.recentRooms.map(async a=>await Qe(r,a.toString()))).then(a=>{r.signal.aborted||n(a.reduce(($,m)=>(m&&$.push(m),$),[]))})});const l=()=>E()!==null?e().filter(v=>v.admins.includes(E().id)).reverse():[],d=()=>E()!==null?E().recentRooms.map(v=>e().find(a=>a.roomID==v&&!a.admins.includes(E().id))).reduce((v,a)=>(a&&v.push(a),v),[]).reverse():[],g=()=>t().filter(v=>v.settings.publicVisibility&&!l().some(a=>a.roomID===v.roomID)&&!d().some(a=>a.roomID===v.roomID)),b=()=>{vn().then(v=>{v!==null?window.location.href=`/room/${v}`:B("Failed to Create Room","error")})};return(()=>{const v=lt.cloneNode(!0);return s(v,o(N,{get when(){return E()!==null},get children(){const a=lt.cloneNode(!0);return s(a,(()=>{const $=H(()=>l().length>0,!0);return()=>$()?(()=>{const m=Hn.cloneNode(!0),u=m.firstChild,f=u.nextSibling;return s(f,o(Y,{get each(){return l()},children:c=>o(Me,{get roomID(){return c.roomID},get name(){return c.settings.name},get href(){return`/room/${c.roomID}`}})})),m})():null})(),null),s(a,(()=>{const $=H(()=>d().length>0,!0);return()=>$()?(()=>{const m=Yn.cloneNode(!0),u=m.firstChild,f=u.nextSibling;return s(f,o(Y,{get each(){return d()},children:c=>o(Me,{showRemove:!0,get roomID(){return c.roomID},get name(){return c.settings.name},get href(){return`/room/${c.roomID}`}})})),m})():null})(),null),a}}),null),s(v,o(N,{get when(){return g().length>0},get children(){const a=jn.cloneNode(!0),$=a.firstChild,m=$.nextSibling;return s(m,o(Y,{get each(){return t()},children:u=>o(Me,{get roomID(){return u.roomID},get name(){return u.settings.name},get href(){return`/room/${u.roomID}`}})})),a}}),null),s(v,o(N,{get when(){return E()?.id},get children(){const a=Jn.cloneNode(!0);return a.$$click=b,a}}),null),C(()=>x(v,Gn.home)),v})()}G(["click"]);const O={textEllipsis:_`
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    `,centerTooltipChild:_`
        display: inline-flex !important;
        align-items: center;
    `,dropdownContainer:_`
        flex-flow: column;
        display: flex;
        z-index: 2048;
        background-color: var(--dp8-surface);
        padding: 0.5rem 0;
        border-radius: 0.5rem;
        box-shadow: 0.2rem 0.4rem 0.8rem 0px rgba(0, 0, 0, 0.5);
    `,dropdownOption:_`
        height: auto;
        color: var(--text-secondary) !important;
        margin: 0 !important;
    `,dropdownBackdrop:_`
        z-index: 1024;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    `,videoActionDiv:_`
        margin-left: auto;
        display: flex;
        & button {
            margin: 0.5rem;
        }
    `},Kn=S('<div class="dropdown dropdown-top"><label tabindex="0"></label><ul tabindex="0" class="dropdown-content menu w-[2rem] h-[24rem] relative ml-2 mb-2 bg-neutral-700 rounded-md"><div></div></ul></div>'),Zn={volumeBox:_`
        width: 2rem;
        height: 24rem;
        margin: 0 0.25rem;
        position: relative;
    `,volumeSlider:_`
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--theme-primary);
        border-radius: 0.25rem;
    `},Rt=1.5,Xn=e=>Math.pow(e/100,Rt)*100,ei=e=>Math.pow(10,Math.log10(e/100)/Rt)*100;function ti(e){let n=null,t=!1;const i=d=>{if(t&&n){const g=n.getBoundingClientRect().y,b=100-Math.round((d.clientY-g)/n.clientHeight*100);let v=Math.max(1,Math.min(b,100));v=Xn(v),e.setVolume(v)}},r=d=>{t=!0,i(d)},l=()=>{t=!1};return pe(()=>{window.addEventListener("mouseup",l)}),se(()=>{window.removeEventListener("mouseup",l)}),(()=>{const d=Kn.cloneNode(!0),g=d.firstChild,b=g.nextSibling,v=b.firstChild;return s(g,o(It,{size:"2rem"})),b.$$mousemove=i,b.$$mousedown=r,(a=>n=a)(b),C(a=>{const $={"btn btn-circle btn-primary":!0,"btn-disabled":e.disabled},m=Zn.volumeSlider,u=`${100-ei(e.volume)}%`;return a._v$=le(g,$,a._v$),m!==a._v$2&&x(v,a._v$2=m),u!==a._v$3&&v.style.setProperty("top",a._v$3=u),a},{_v$:void 0,_v$2:void 0,_v$3:void 0}),d})()}G(["mousedown","mousemove"]);const ni=S("<img>"),ii=S('<div><button class="btn btn-circle btn-primary"></button></div>'),ri=S('<div data-tip="Skip Current Video"><button class="btn btn-circle btn-primary"></button></div>'),oi=S('<div><div><div class="flex flex-col overflow-hidden"><div><div></div></div><div><div></div></div></div></div><div><div class="inline-flex items-center"></div></div></div>'),li=S("<div></div>"),si=S("<span>Queued By: </span>"),ge={bottomBar:_`
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        width: 100%;
        background-color: var(--dp2-surface);
        height: 5rem;
        min-height: 5rem;
        max-height: 5rem;
    `,bottomVideoInfo:_`
        display: flex;
        flex-direction: row;
        padding: 0.5rem;
        padding-right: 8rem;
        width: 50%;
        max-width: 50%;
    `,bottomVideoIcon:_`
        max-height: 4rem;
        padding-right: 1rem;
    `,bottomMiddleActions:_`
        width: 16rem;
        position: absolute;
        left: 50%;
        right: 50%;
        height: 5rem;
        transform: translate3d(-50%, 0, 0);
        display: flex;
        justify-content: space-evenly;
    `,bottomRightActions:_`
        display: flex;
        align-content: center;
        justify-content: flex-end;
        padding-left: 8rem;
        width: 50%;
        max-width: 50%;
    `,bottomQueueButton:_`
        height: 3rem;
        border-radius: 0.5rem;
        padding: 0.5rem;
        display: inline-flex;
        background-color: var(--theme-primary-dark);
        & p {
            line-height: 2rem;
            padding: 0 0.5rem;
            font-size: 1rem;
        }
    `,titleContainer:_`
        overflow: hidden;
    `,creditSeparator:_`
        border-left: 2px solid;
        margin-left: 1rem;
        padding-left: 1rem;
    `};function st(e,n){return e.find(t=>t.clientID===n.queuedBy)?.name}function ai(e){const[n,t]=P(null),[i,r]=P(e.currentVideo?st(e.userList,e.currentVideo):void 0),l=ie();q(()=>{e.currentVideo!==null?Be(l,e.currentVideo.youtubeID).then(t):t(null)});let d=null;return q(()=>{if(i===void 0||d!==e.currentVideo)if(e.currentVideo!==null){const g=st(e.userList,e.currentVideo);g&&r(g)}else r(void 0);d=e.currentVideo}),(()=>{const g=oi.cloneNode(!0),b=g.firstChild,v=b.firstChild,a=v.firstChild,$=a.firstChild,m=a.nextSibling,u=m.firstChild,f=b.nextSibling,c=f.firstChild;return s(b,o(N,{get when(){return n()},get fallback(){return(()=>{const h=li.cloneNode(!0);return C(()=>x(h,ge.bottomVideoIcon)),h})()},get children(){const h=ni.cloneNode(!0);return C(y=>{const w=ge.bottomVideoIcon,p=n()?.thumbnailMaxRes?.url??"";return w!==y._v$&&x(h,y._v$=w),p!==y._v$2&&j(h,"src",y._v$2=p),y},{_v$:void 0,_v$2:void 0}),h}}),v),s($,()=>n()?.title??"Nothing Currently Playing"),s(u,()=>n()?.channel??"",null),s(u,i?(()=>{const h=si.cloneNode(!0);return h.firstChild,s(h,i,null),C(()=>x(h,n()?.channel?ge.creditSeparator:void 0)),h})():null,null),s(c,o(ti,{get disabled(){return!e.hasVideo},get volume(){return e.playerVolume},get setVolume(){return e.setPlayerVolume}})),s(f,o(N,{get when(){return e.canPause},get children(){const h=ii.cloneNode(!0),y=h.firstChild;return Se(y,"click",e.togglePlay,!0),s(y,(()=>{const w=H(()=>!!e.playing,!0);return()=>w()?o(Lt,{size:"2rem"}):o(Et,{size:"2rem"})})()),C(w=>{const p=`${O.centerTooltipChild} tooltip`,k=`${e.playing?"Pause":"Resume"} Room Playback`,I=!e.hasVideo;return p!==w._v$3&&x(h,w._v$3=p),k!==w._v$4&&j(h,"data-tip",w._v$4=k),I!==w._v$5&&(y.disabled=w._v$5=I),w},{_v$3:void 0,_v$4:void 0,_v$5:void 0}),h}}),null),s(f,o(N,{get when(){return e.canSkip},get children(){const h=ri.cloneNode(!0),y=h.firstChild;return Se(y,"click",e.skipVideo,!0),s(y,o(Dt,{size:"2rem"})),C(w=>{const p=`${O.centerTooltipChild} tooltip`,k=!e.hasVideo;return p!==w._v$6&&x(h,w._v$6=p),k!==w._v$7&&(y.disabled=w._v$7=k),w},{_v$6:void 0,_v$7:void 0}),h}}),null),C(h=>{const y=ge.bottomBar,w=ge.bottomVideoInfo,p=`${O.textEllipsis} tooltip`,k=n()?.title??"",I=`text-lg text-left font-semibold ${O.textEllipsis}`,T=`${O.textEllipsis} tooltip`,F=(n()?.channel??"")+(i?` | Queued By: ${i}`:""),L=`${O.textEllipsis} text-base text-left`,R=ge.bottomMiddleActions;return y!==h._v$8&&x(g,h._v$8=y),w!==h._v$9&&x(b,h._v$9=w),p!==h._v$10&&x(a,h._v$10=p),k!==h._v$11&&j(a,"data-tip",h._v$11=k),I!==h._v$12&&x($,h._v$12=I),T!==h._v$13&&x(m,h._v$13=T),F!==h._v$14&&j(m,"data-ip",h._v$14=F),L!==h._v$15&&x(u,h._v$15=L),R!==h._v$16&&x(f,h._v$16=R),h},{_v$8:void 0,_v$9:void 0,_v$10:void 0,_v$11:void 0,_v$12:void 0,_v$13:void 0,_v$14:void 0,_v$15:void 0,_v$16:void 0}),g})()}G(["click"]);var U=(e=>(e.Sync="sync",e.Error="error",e.Ping="ping",e.UserJoin="userJoined",e.UserLeft="userLeft",e.UserList="userList",e.UserReady="userReady",e.UserError="userError",e.Play="play",e.Pause="pause",e.Skip="skip",e.Seek="seek",e.Video="video",e.Init="init",e.Room="room",e.QueueAddBack="addQueueBack",e.QueueAddFront="addQueueFront",e.QueueMultiple="allQueue",e.QueueRemove="removeQueue",e.QueueClear="clearQueue",e.QueueOrder="orderQueue",e.QueueReorder="reorderQueue",e.UserOrder="userQueue",e.RoomSettings="settings",e.AdminAdd="addAdmin",e.AdminRemove="removeAdmin",e))(U||{});function di(){return"wss://"+window.location.host}const ui=15;function ci(e,n){let t=null,i=null,r=0;const l=a=>{t?.close(),t=null,a&&delete a.returnValue},d=()=>{t?.readyState===t?.OPEN&&t?.send(JSON.stringify({t:"ping"}))},g=a=>{const $=JSON.parse(a.data);r=0,$.t===U.Ping&&(i=setTimeout(()=>d(),8e3)),n($)};let b=!0;const v=()=>{if(r+=1,r>ui){console.error("Failed to Open Websocket for Room ",e),B("Lost Connection to Server","error");return}!b||(t=new WebSocket(`${di()}/api/ws?room=${e}`),t.addEventListener("message",g),t.addEventListener("open",()=>{i=setTimeout(()=>d(),8e3)}),t.addEventListener("error",a=>console.warn("WS Error: ",a)),t.addEventListener("close",()=>{i&&clearTimeout(i),setTimeout(()=>v(),800)}))};return t===null&&v(),window.onbeforeunload=l,se(()=>{l(null),i&&clearTimeout(i),b=!1}),t}const te=()=>{B("Failed to Connect to Server","error")};function mi(e,n){const t=ci(e,n);return{ws:t,addAdmin:y=>{t?t.send(JSON.stringify({t:U.AdminAdd,d:y})):te()},removeAdmin:y=>{t?t.send(JSON.stringify({t:U.AdminRemove,d:y})):te()},removeAllVideos:y=>{t?t.send(JSON.stringify({t:U.QueueClear,d:y})):te()},removeVideo:y=>{t?t.send(JSON.stringify({t:U.QueueRemove,d:y})):te()},reorderQueue:(y,w)=>{t?t.send(JSON.stringify({t:U.QueueReorder,d:w,target:y})):te()},skipVideo:()=>{t&&t.send(JSON.stringify({t:U.Skip}))},seekVideo:y=>{t&&t.send(JSON.stringify({t:U.Seek,d:Math.floor(y)}))},submitAllVideos:(y,w)=>{t?(t.send(JSON.stringify({t:U.QueueMultiple,d:y})),B(`Queued All Videos from ${w.length>0?w:"Playlist"}`,"info")):te()},submitVideoBack:(y,w="")=>{t?(t.send(JSON.stringify({t:U.QueueAddBack,d:y})),B(`Queued ${w.length>0?w:"Video"}`,"info")):te()},submitVideoFront:(y,w="")=>{t?(t.send(JSON.stringify({t:U.QueueAddFront,d:y})),B(`Queued ${w.length>0?w:"Video"}`,"info")):te()},togglePlay:y=>{t?t.send(JSON.stringify({t:y?U.Pause:U.Play})):te()},updateSettings:y=>{t?t.send(JSON.stringify({t:U.RoomSettings,d:y})):te()},logError:y=>{t&&t.send(JSON.stringify({t:U.UserError,d:y}))},logReady:()=>{t&&t.send(JSON.stringify({t:U.UserReady}))}}}function Ke(e,n){const t=new Date;t.setTime(t.getTime()+1e3*24*3600*1e3),document.cookie=`${e}=${n};expires=${t.toUTCString()};path=/`}function Ze(e){const n=`${e}=`,t=document.cookie.split(";").reduce((i,r)=>{if(i.length>0)return i;const l=r.trimStart();return l.startsWith(n)?l.substring(n.length,l.length):""},"");return t.length>0?t:null}function fi(e){Ke("playerVolume",e)}function hi(){const e=Ze("playerVolume");return e!==null?Number.parseInt(e):-1}function gi(e){Ke("sidebarTab",e)}function at(){const e=Ze("sidebarTab");return e!==null?Number.parseInt(e):0}function vi(e){Ke("playlistSort",e)}function bi(){const e=Ze("playlistSort");return e!==null?Number.parseInt(e):0}const Fe={};let $i=1;function Oe(e,n){const t=Fe[e];t&&Object.values(t).forEach(i=>void i(n))}function yi(e,n){const t=Fe[e],i=$i++;return t?t[i]=n:Fe[e]={[i]:n},i}function _i(e,n){const t=Fe[e];t&&delete t[n]}function wi(e,n){const t=yi(e,n);se(()=>{_i(e,t)})}class xi{constructor(n,t=512){this.infoStore=null,this.infoStoreLRU=[],this.infoStoreLength=t,this.infoStoreID=n}getStore(){if(this.infoStore===null){const n=localStorage[this.infoStoreID];n?this.infoStore=JSON.parse(n)??{}:this.infoStore={};const t=localStorage[this.infoStoreID+"-lru"];t?this.infoStoreLRU=JSON.parse(t)??[]:this.infoStoreLRU=[],Object.keys(this.infoStore??{}).length>this.infoStoreLRU.length&&(this.infoStoreLRU=Object.keys(this.infoStore??{}))}return this.infoStore??{}}saveStore(n){this.infoStore=n,localStorage[this.infoStoreID]=JSON.stringify(this.infoStore),this.saveLRU()}saveLRU(){localStorage[this.infoStoreID+"-lru"]=JSON.stringify(this.infoStoreLRU)}pushInfoStore(n){const t=this.getStore();return t[n.id]||(t[n.id]=n,this.pushLRU(n.id),this.saveStore(t)),n}pushLRU(n){if(!this.infoStore)return;const t=this.infoStoreLRU.indexOf(n);if(t>=0&&this.infoStoreLRU.splice(t,1),this.infoStoreLRU.push(n),this.infoStoreLRU.length>this.infoStoreLength){const i=this.infoStoreLRU.splice(0,1);delete this.infoStore[i[0]],this.saveStore(this.infoStore)}else this.saveLRU()}queryInfoStore(n){const i=this.getStore()[n];return i?(this.pushLRU(i.id),i):null}}class Si{constructor(n){this.infoStoreLRU=[],this.infoStoreID=n}saveLRU(){localStorage[this.infoStoreID]=JSON.stringify(this.infoStoreLRU)}pushItem(n){const t=this.infoStoreLRU.indexOf(n);t>0&&this.infoStoreLRU.splice(t,1),t!==0&&(this.infoStoreLRU.unshift(n),this.saveLRU())}getList(){if(this.infoStoreLRU.length==0){const n=localStorage[this.infoStoreID];n?this.infoStoreLRU=JSON.parse(n)??[]:this.infoStoreLRU=[]}return this.infoStoreLRU}}function pi(e,n){let t=[];const i=r=>{const l=new URLSearchParams({part:"snippet,contentDetails",mine:"true",maxResults:"50",access_token:e});r&&l.set("pageToken",r),fetch(`https://www.googleapis.com/youtube/v3/playlists?${l.toString()}`).then(d=>d.json()).then(d=>{t=[...t,...d.items.map(St)],d.nextPageToken?(n(t,!1),i(d.nextPageToken)):n(t,!0)}).catch(()=>{B("Network Error: Failed to Retrieve Playlist Information","error"),n(void 0,!0)})};i()}function Je(e,n,t=!1){let i=[];const r=l=>{const d=new URLSearchParams({part:"snippet, contentDetails",myRating:"like",maxResults:t?"1":"50",access_token:e});l&&d.set("pageToken",l),fetch(`https://www.googleapis.com/youtube/v3/videos?${d.toString()}`).then(g=>g.json()).then(g=>{i=[...i,...g.items.map(Te)],!t&&g.nextPageToken?(n(i,!1),r(g.nextPageToken)):n(i,!0)}).catch(()=>{B("Network Error: Failed to Retrieve Playlist Information","error"),n(void 0,!0)})};r()}const Ve=new xi("VideoInfoCache",4096);function dt(e,n,t){let i=[];const r=d=>{if(d.length===0){t(i,!0);return}const g=Math.min(d.length,50),b=d.slice(0,g),v=new URLSearchParams({part:"snippet,contentDetails",id:b.map(a=>i[a].id).join(","),maxResults:"50",access_token:n});fetch(`https://www.googleapis.com/youtube/v3/videos?${v.toString()}`).then(a=>a.json()).then(a=>{if(a.items.length===g)a.items.forEach(($,m)=>{const u=Te($);i[b[m]]=u,Ve.pushInfoStore({id:u.id,title:u.title,channel:u.channel,duration:u.duration,thumbnailURL:u.thumbnailMaxRes.url})});else{let $=0;a.items.forEach(m=>{const u=Te(m);for(;i[b[$]].id!==u.id;)$++;i[b[$]]=u,Ve.pushInfoStore({id:u.id,title:u.title,channel:u.channel,duration:u.duration,thumbnailURL:u.thumbnailMaxRes.url}),$++})}g<d.length?(r(d.slice(g)),t(i,!1)):t(i,!0)}).catch(()=>{B("Network Error: Failed to Retrieve Playlist Information","error"),t(void 0,!0)})},l=d=>{const g=new URLSearchParams({part:"snippet",playlistId:e,maxResults:"50",access_token:n});d&&g.set("pageToken",d),fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${g.toString()}`).then(b=>b.json()).then(b=>{if(i=[...i,...b.items.map(cn)],b.nextPageToken)t(i,!1),l(b.nextPageToken);else{t(i,!1);const v=[];i.forEach((a,$)=>{const m=Ve.queryInfoStore(a.id);m&&m.duration?i[$]={...i[$],...m}:v.push($)}),r(v)}}).catch(()=>{B("Network Error: Failed to Retrieve Playlist Information","error"),t(void 0,!0)})};l()}function Pe(e,n,t){const i=new URLSearchParams({part:"snippet,contentDetails",id:e,access_token:n});fetch(`https://www.googleapis.com/youtube/v3/videos?${i.toString()}`).then(r=>r.json()).then(r=>{r.items.length===1&&t(Te(r.items[0]))}).catch(()=>{B("Network Error: Failed to Retrieve Video Information","error")})}function ki(e,n,t){const i=new URLSearchParams({part:"snippet,contentDetails",id:e,access_token:n});fetch(`https://www.googleapis.com/youtube/v3/playlists?${i.toString()}`).then(r=>r.json()).then(r=>{r.items.length===1&&t(St(r.items[0]))}).catch(()=>{B("Network Error: Failed to Retrieve Playlist Information","error")})}const Ri=S("<div><div></div></div>"),Ci=S("<div><div><div></div></div><div></div></div>"),He=S("<div></div>"),Vi=S("<div><img><div></div></div>"),Pi=S('<span class="tooltip"><div></div></span>'),Ni=S('<iframe height="240" width="426"></iframe>'),Ii=S("<button><div></div></button>"),Li=_`
    opacity: var(--iconPreviewOpacity, 0);
    position: absolute;
    color: var(--text-secondary);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 8;
    & svg {
        filter: drop-shadow(4px 4px 0.5rem black);
    }
`,Ei=_`
    font-weight: 500;
    position: absolute;
    top: 0;
    left: 0;
    background: var(--dp2-surface);
    padding: 0 0.4rem;
    border-radius: 0 0 0.25rem 0;
    display: var(--durationDisplay, none);
    z-index: 2;
`,ve={videoCard:_`
        display: flex;
        padding: 0.5rem;
        height: 5rem;
        width: 100%;
        position: relative;
        &:hover {
            --durationDisplay: block;
        }
    `,videoIcon:_`
        height: 100%;
        display: inline-block;
        position: relative;
        z-index: 1;
        &:hover {
            --iconPreviewOpacity: 1;
        }
        & > img {
            height: 100%;
        }
    `,videoInfo:_`
        height: 100%;
        display: inline-flex;
        flex-direction: column;
        padding-left: 1rem;
        text-align: start;
        overflow: hidden;
    `,videoCardButton:_`
        display: flex;
        height: unset;
        padding: 0 1rem;
        width: 100%;
        margin: 0 !important;
        flex-flow: column;
        &:hover {
            --durationDisplay: block;
        }
    `,videoPreview:_`
        z-index: 64;
        padding-left: 2rem;
        height: 0;
        transition: height 0.5s;
    `,videoPreviewOpen:_`
        height: 256px;
    `};function Xe(e){const[n,t]=P(!1),i=()=>{e.onClick?.(e.info.id),e.enablePreview&&(t(!1),Oe("preview",!1))},r=d=>{d.stopPropagation(),t(!n()),Oe("preview",n())};se(()=>{e.enablePreview&&Oe("preview",!1)});const l=(()=>{const d=Ci.cloneNode(!0),g=d.firstChild,b=g.firstChild,v=g.nextSibling;return s(d,(()=>{const a=H(()=>!!e.info.thumbnailURL,!0);return()=>a()&&(()=>{const $=Vi.cloneNode(!0),m=$.firstChild,u=m.nextSibling;return s($,o(N,{get when(){return e.enablePreview},get children(){const f=He.cloneNode(!0);return f.$$click=r,x(f,Li),s(f,o(N,{get when(){return n()},get fallback(){return o(Ut,{size:"3rem"})},get children(){return o(At,{size:"3rem"})}})),f}}),m),s(u,()=>_t(e.info.duration)),C(f=>{const c=ve.videoIcon,h=e.info.thumbnailURL.replace("hqdefault","mqdefault"),y=["text-base",Ei].join(" ");return c!==f._v$5&&x($,f._v$5=c),h!==f._v$6&&j(m,"src",f._v$6=h),y!==f._v$7&&x(u,f._v$7=y),f},{_v$5:void 0,_v$6:void 0,_v$7:void 0}),$})()})(),g),s(g,o(N,{get when(){return e.onClick},get fallback(){return(()=>{const a=Pi.cloneNode(!0),$=a.firstChild;return s($,()=>e.info.title),C(m=>{const u=e.info.title,f=`text-base normal-case font-medium ${O.textEllipsis}`;return u!==m._v$8&&j(a,"data-tip",m._v$8=u),f!==m._v$9&&x($,m._v$9=f),m},{_v$8:void 0,_v$9:void 0}),a})()},get children(){const a=Ri.cloneNode(!0),$=a.firstChild;return s($,()=>e.info.title),C(()=>x($,`text-base normal-case font-medium ${O.textEllipsis}`)),a}}),b),s(b,()=>e.info.channel?.length>0?e.info.channel:". . ."),s(v,()=>e.actionComponent),C(a=>{const $=ve.videoCard,m=ve.videoInfo,u=`text-sm normal-case font-medium ${O.textEllipsis}`,f=O.videoActionDiv;return $!==a._v$&&x(d,a._v$=$),m!==a._v$2&&x(g,a._v$2=m),u!==a._v$3&&x(b,a._v$3=u),f!==a._v$4&&x(v,a._v$4=f),a},{_v$:void 0,_v$2:void 0,_v$3:void 0,_v$4:void 0}),d})();return o(N,{get when(){return e.onClick},get fallback(){return(()=>{const d=He.cloneNode(!0);return s(d,l),d})()},get children(){const d=Ii.cloneNode(!0),g=d.firstChild;return d.$$click=i,s(d,l,g),s(g,o(N,{get when(){return n()},get children(){const b=Ni.cloneNode(!0);return C(()=>j(b,"src",`https://www.youtube-nocookie.com/embed/${e.info.id}?autoplay=1`)),b}})),C(b=>{const v=`btn btn-ghost no-animation ${ve.videoCardButton}`,a=[ve.videoPreview,n()?ve.videoPreviewOpen:""].join(" ");return v!==b._v$10&&x(d,b._v$10=v),a!==b._v$11&&x(g,b._v$11=a),b},{_v$10:void 0,_v$11:void 0}),d}})}function et(e){const[n,t]=P(null),i=ie();return q(()=>{if(e.videoID){const r=Ve.queryInfoStore(e.videoID);r?t({...r,duration:e.duration}):Be(i,e.videoID).then(l=>{l&&t(Ve.pushInfoStore({id:l.id,title:l.title,channel:l.channel,duration:e.duration,thumbnailURL:l.thumbnailMaxRes.url}))})}}),o(N,{get when(){return n()},get fallback(){return He.cloneNode(!0)},get children(){return o(Xe,{get info(){return n()},get onClick(){return e.onClick},get actionComponent(){return e.actionComponent},get enablePreview(){return e.enablePreview}})}})}G(["click"]);const qe={scrollBox:_`
        overflow-y: auto;
        overflow-x: hidden;
        width: 100%;
        h2 {
            margin-top: 0;
        }
    `},Di=S('<div><button class="btn btn-circle btn-ghost btn-primary tooltip tooltip-left inline-flex" data-tip="Edit Video Queue"></button></div>'),Ui=S("<div><div><div><div></div><div></div><div></div></div></div></div>"),Ai=S("<img>"),ce=S("<div></div>"),Ti=S("<button></button>"),Z={QueueVideos:_`
        margin-left: 2rem;
        height: 0;
        overflow-y: auto;
        transition: height 0.25s ease;
        background-color: var(--dp4-surface);
    `,QueueVideosExpanded:_`
        max-height: 20rem;
        height: unset;
    `,QueueActionDiv:_`
        margin-left: auto;
    `,QueueExpandedTitle:_`
        margin: 0.5rem 0.5rem 0 0.5rem;
        padding-left: 1rem;
        border-bottom: 2px solid var(--theme-primary-dark);
    `,VideoCardButton:_`
        display: flex;
        height: unset;
        padding: 0;
        width: 100%;
        margin: 0 !important;
        letter-spacing: 0.03em;
    `,VideoDuration:_`
        font-weight: 500;
    `,PlaylistCardButton:_`
        display: flex;
        height: unset;
        padding: 0;
        width: 100%;
        margin: 0 !important;
        flex-flow: column;
    `,QueueCard:_`
        display: flex;
        flex-flow: column;
        padding: 1rem;
        width: 100%;
    `,QueueIcon:_`
        height: 5rem;
    `,QueueInfo:_`
        height: 5rem;
        flex-direction: column;
        padding-left: 1rem;
        text-align: start;
        display: flex;
        overflow: hidden;
    `,QueueCardInfo:_`
        display: flex;
        flex-flow: row;
    `};function Qi(e){const[n,t]=P(null),[i,r]=P(!1),l=()=>{e.playlist&&e.playlist.length>1&&r(!0)},d=()=>r(!1);q(()=>{e.playlist.length<2&&r(!1)});const g=ie();q(()=>{e.playlist&&e.playlist.length>0&&Be(g,e.playlist[0].youtubeID).then($=>{$&&t({id:$.id,title:$.title,channel:$.channel,duration:e.playlist[0].duration,thumbnailURL:$.thumbnailMaxRes.url})})});const b=$=>{e.openEdit(e.user.clientID),$.stopPropagation()},v=o(N,{get when(){return n()},children:$=>(()=>{const m=Ui.cloneNode(!0),u=m.firstChild,f=u.firstChild,c=f.firstChild,h=c.nextSibling,y=h.nextSibling;return s(u,(()=>{const w=H(()=>!!$.thumbnailURL,!0);return()=>w()&&(()=>{const p=Ai.cloneNode(!0);return C(k=>{const I=Z.QueueIcon,T=$.thumbnailURL;return I!==k._v$7&&x(p,k._v$7=I),T!==k._v$8&&j(p,"src",k._v$8=T),k},{_v$7:void 0,_v$8:void 0}),p})()})(),f),s(c,()=>$.title),s(h,()=>`Queued By ${e.user.name}`),s(y,()=>_t($.duration)),s(u,o(N,{get when(){return e.allowRemoval},get children(){const w=Di.cloneNode(!0),p=w.firstChild;return p.$$click=b,s(p,o(ft,{size:"2rem"})),C(()=>x(w,Z.QueueActionDiv)),w}}),null),C(w=>{const p=Z.QueueCard,k=Z.QueueCardInfo,I=Z.QueueInfo,T=`text-base normal-case font-medium ${O.textEllipsis}`,F=`text-sm font-medium normal-case ${O.textEllipsis}`,L=`text-sm font-light ${Z.VideoDuration}`;return p!==w._v$&&x(m,w._v$=p),k!==w._v$2&&x(u,w._v$2=k),I!==w._v$3&&x(f,w._v$3=I),T!==w._v$4&&x(c,w._v$4=T),F!==w._v$5&&x(h,w._v$5=F),L!==w._v$6&&x(y,w._v$6=L),w},{_v$:void 0,_v$2:void 0,_v$3:void 0,_v$4:void 0,_v$5:void 0,_v$6:void 0}),m})()}),a=(()=>{const $=ce.cloneNode(!0);return s($,o(N,{get when(){return i()},get children(){const m=ce.cloneNode(!0);return s(m,()=>`${e.user.name}'s Upcoming Videos:`),C(()=>x(m,Z.QueueExpandedTitle)),m}}),null),s($,o(N,{get when(){return i()&&e.playlist},get children(){return o(Y,{get each(){return e.playlist},children:m=>o(et,{get videoID(){return m.youtubeID},get duration(){return m.duration},enablePreview:!1})})}}),null),C(m=>le($,{[Z.QueueVideos]:!0,[Z.QueueVideosExpanded]:i()&&e.playlist&&e.playlist.length>1},m)),$})();return o(N,{get when(){return n()},get fallback(){return ce.cloneNode(!0)},get children(){const $=ce.cloneNode(!0);return s($,o(N,{get when(){return e.playlist&&e.playlist.length>1},get fallback(){return(()=>{const m=ce.cloneNode(!0);return s(m,v),C(()=>x(m,Z.VideoCardButton)),m})()},get children(){const m=Ti.cloneNode(!0);return Se(m,"click",i()?d:l,!0),s(m,v),C(()=>x(m,`btn btn-ghost no-animation ${Z.VideoCardButton}`)),m}}),null),s($,a,null),$}})}function Fi(e){const n=()=>e.userQueue.map(t=>[t,e.videoPlaylist[t]]);return(()=>{const t=ce.cloneNode(!0);return s(t,o(Y,{get each(){return n()},children:([i,r])=>{const l=e.currentUsers.find(d=>d.clientID==i);return l===void 0||!r||r.length===0?ce.cloneNode(!0):o(Qi,{playlist:r,user:l,get openEdit(){return e.openEdit},get allowRemoval(){return e.allowRemoval||e.currentUser===i}})}})),C(()=>x(t,qe.scrollBox)),t})()}G(["click"]);const Bi=S("<img>"),qi=S('<div><div class="flex flex-row h-16"><div class="h-full pl-4 text-start overflow-hidden font-medium"><div></div><div></div></div><div><span class="tooltip" data-tip="Queue All"><button class="btn btn-primary btn-circle"></button></span><span class="tooltip" data-tip="Shuffle All"><button class="btn btn-primary btn-circle"></button></span></div></div></div>'),zi=S('<div class="ml-8 bg-neutral-800"></div>'),Mi=S('<button class="btn btn-circle btn-sm btn-ghost text-primary tooltip tooltip-left inline-flex" data-tip="Queue Front"></button>'),Oi=S("<div><button></button></div>"),De={playlistCardButton:_`
        display: flex;
        height: unset;
        padding: 0;
        width: 100%;
        margin: 0 !important;
        flex-flow: column;
    `,playlistButtonActive:_`
        position: sticky;
        top: 0;
        z-index: 128;
        background-color: var(--dp2-surface) !important;
        &:hover {
            background-color: var(--dp24-surface) !important;
        }
    `,playlistCard:_`
        display: flex;
        flex-flow: column;
        padding: 1rem;
        width: 100%;
    `,playlistIcon:_`
        height: 100%;
    `,playlistCardInfo:_`
        display: flex;
        flex-flow: row;
        height: 4rem;
    `,playlistVideos:_`
        margin-left: 2rem;
        height: 0;
        overflow-y: auto;
        transition: height 0.25s ease;
        background-color: var(--dp8-surface);
    `,playlistVideosExpanded:_`
        height: unset;
    `};function Ct(e){const n=()=>e.setExpanded(!0),t=()=>e.setExpanded(!1),i=(()=>{const l=qi.cloneNode(!0),d=l.firstChild,g=d.firstChild,b=g.firstChild,v=b.nextSibling,a=g.nextSibling,$=a.firstChild,m=$.firstChild,u=$.nextSibling,f=u.firstChild;return s(d,o(N,{get when(){return e.info.thumbnailMaxRes?.url},get children(){const c=Bi.cloneNode(!0);return C(h=>{const y=De.playlistIcon,w=e.info.thumbnailMaxRes.url;return y!==h._v$&&x(c,h._v$=y),w!==h._v$2&&j(c,"src",h._v$2=w),h},{_v$:void 0,_v$2:void 0}),c}}),g),s(b,()=>e.info.title),s(v,()=>e.info.channel),s(d,o(N,{get when(){return e.loading},get children(){return o(nn,{})}}),a),m.$$click=c=>{e.queueAll(),c.stopPropagation()},s(m,o(ht,{size:"2rem"})),f.$$click=c=>{e.shuffleQueue(),c.stopPropagation()},s(f,o(Tt,{size:"2rem"})),C(c=>{const h=De.playlistCard,y=`text-lg normal-case ${O.textEllipsis}`,w=`normal-case ${O.textEllipsis}`,p=O.videoActionDiv;return h!==c._v$3&&x(l,c._v$3=h),y!==c._v$4&&x(b,c._v$4=y),w!==c._v$5&&x(v,c._v$5=w),p!==c._v$6&&x(a,c._v$6=p),c},{_v$3:void 0,_v$4:void 0,_v$5:void 0,_v$6:void 0}),l})(),r=(()=>{const l=zi.cloneNode(!0);return s(l,o(N,{get when(){return e.expanded&&e.videoInfo.length},get children(){return o(Y,{get each(){return e.videoInfo},children:d=>{const g=()=>e.queueVideoFront(d,e.info.id);return o(Xe,{info:d,enablePreview:!0,onClick:()=>e.queueVideoEnd(d,e.info.id),get actionComponent(){return(()=>{const v=Mi.cloneNode(!0);return s(v,o(Ye,{size:"1.5rem",onClick:g})),v})()}})}})}})),l})();return o(N,{get when(){return e.videoInfo},get children(){const l=Oi.cloneNode(!0),d=l.firstChild;return Se(d,"click",e.expanded?t:n,!0),s(d,i),s(l,r,null),C(()=>x(d,["btn","btn-ghost","no-animation",De.playlistCardButton,e.expanded?De.playlistButtonActive:""].join(" "))),l}})}function ut(e){const[n,t]=P([]),[i,r]=P(!1),[l,d]=P(!1),[g,b]=P(!1);q(()=>{const f=E();f?.access_token&&e.info.id&&g()&&n().length===0&&(d(!0),dt(e.info.id,f.access_token,(c,h)=>{c&&t(c.map(y=>({id:y.id,title:y.title,channel:y.channel,thumbnailURL:y.thumbnailMaxRes?.url??"",duration:y.duration}))),r(h),h&&d(!1)}))});const v=f=>{if(!e.info.id)return;const c=E();if((!g()&&n().length===0||!i())&&c?.access_token){const h=yt("Requesting Playlist Information");dt(e.info.id,c.access_token,(y,w)=>{w&&(h(),y&&f?.(y.map(p=>({id:p.id,title:p.title,channel:p.channel,thumbnailURL:p.thumbnailMaxRes?.url??"",duration:p.duration})),e.info))})}else f?.(n(),e.info)},a=()=>{v(e.submitPlaylist)},$=()=>{v(f=>{for(let c=f.length-1;c>0;c--){const h=Math.floor(Math.random()*c),y=f[c];f[c]=f[h],f[h]=y}e.submitPlaylist?.(f,e.info)})},m=()=>e.searchText.length>0&&g()?n().filter(f=>f.title.toLocaleUpperCase().includes(e.searchText)||f.channel.toLocaleUpperCase().includes(e.searchText)):n(),u=()=>e.searchText.length>0&&(!g()||m().length===0)&&!e.info.title.toLocaleUpperCase().includes(e.searchText);return o(N,{get when(){return!u()},fallback:null,get children(){return o(Ct,{get expanded(){return g()},get info(){return e.info},get loading(){return l()},get queueVideoEnd(){return e.queueVideoEnd},get queueVideoFront(){return e.queueVideoFront},queueAll:a,setExpanded:b,shuffleQueue:$,get videoInfo(){return m()}})}})}function ji(e){const[n,t]=P([]),[i,r]=P(!1),[l,d]=P(!1),[g,b]=P(!1);q(()=>{const m=E();m?.access_token&&i()&&n().length===0&&(b(!0),Je(m.access_token,(u,f)=>{u&&t(u.map(c=>({id:c.id,title:c.title,channel:c.channel,thumbnailURL:c.thumbnailMaxRes?.url??"",duration:c.duration}))),d(f),f&&b(!1)}))});const v=m=>{const u=E();if((!i()&&n().length===0||!l())&&u?.access_token){const f=yt("Requesting Video Information");Je(u.access_token,(c,h)=>{h&&(f(),c&&m?.(c.map(y=>({id:y.id,title:y.title,channel:y.channel,thumbnailURL:y.thumbnailMaxRes?.url??"",duration:y.duration})),e.info))})}else m?.(n(),e.info)};return o(Ct,{get expanded(){return i()},get info(){return e.info},get loading(){return g()},get queueVideoEnd(){return e.queueVideoEnd},get queueVideoFront(){return e.queueVideoFront},queueAll:()=>{v(e.submitPlaylist)},setExpanded:r,shuffleQueue:()=>{v(m=>{for(let u=m.length-1;u>0;u--){const f=Math.floor(Math.random()*u),c=m[u];m[u]=m[f],m[f]=c}e.submitPlaylist?.(m,e.info)})},get videoInfo(){return n()}})}G(["click"]);const Ji=S("<button></button>"),Hi=S('<div><div><div><div><input class="input input-ghost w-full h-8" placeholder="Search"></div><div><label tabindex="0" class="btn btn-primary btn-ghost btn-circle btn-sm"></label><ul tabindex="0" class="dropdown-content menu shadow rounded-box bg-neutral-700 min-w-[8rem]"></ul></div></div><div></div></div></div>'),Yi=S("<li><a></a></li>"),Gi=S("<strong></strong>"),Wi=S('<button class="btn btn-circle btn-sm btn-ghost text-primary tooltip tooltip-left inline-flex" data-tip="Queue Front"></button>'),be={queueContainer:_`
        padding-top: 0.5rem;
        padding-right: 0.5rem;
        display: flex;
        overflow: hidden;
        width: 100%;
    `,queueTabBody:_`
        display: flex;
        flex-flow: column;
        overflow-y: hidden;
        width: 100%;
    `,searchDiv:_`
        width: 100%;
        padding: 0 1rem;
        display: flex;
        align-items: center;
        flex-direction: row;
        position: relative;
        & > div {
            flex: auto;
        }
    `,inputDiv:_`
        display: flex;
        position: relative;
        align-items: center;
        & > div {
            flex: auto;
        }
    `,searchClear:_`
        position: absolute;
        right: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 50%;
        color: var(--theme-primary);
        padding: 0.25rem;
        display: flex;
        &:hover {
            background: var(--dp16-surface);
        }
    `,sortDropdown:_`
        flex: none !important;
        margin-left: 1rem;
        & > button {
            color: var(--theme-primary);
        }
    `},_e=new Si("playlistLRU"),Ki=[{display:"Create Date (Dec)"},{display:"Create Date (Asc)"},{display:"Recently Queued"},{display:"A - Z (Dec)"},{display:"A - Z (Asc)"}];function Zi(e,n){switch(n){case 0:return e;case 1:return[...e].reverse();case 2:const t=_e.getList().map(i=>e.find(r=>r.id===i)).filter(i=>i!==void 0);return[...t,...e.filter(i=>!t.includes(i))];case 3:return[...e].sort((i,r)=>i.title.toLocaleUpperCase()>r.title.toLocaleUpperCase()?1:-1);case 4:return[...e].sort((i,r)=>i.title.toLocaleUpperCase()>r.title.toLocaleUpperCase()?-1:1);default:return e}}function Xi(e){const[n,t]=P(""),[i,r]=P([]),[l,d]=P(null),[g,b]=P([]),[v,a]=P(null),[$,m]=P(""),[u,f]=P(bi()),c=ie(),h=gt(L=>{const R=E();if(R&&R.access_token&&L.length>0){const A=xt(L),Q=un(L);A?Pe(A,R.access_token,M=>{c.signal.aborted||(r([M]),d(null))}):Q?ki(Q,R.access_token,M=>{c.signal.aborted||(d(M),r([]))}):m(L)}else r([]),m("")},200);q(()=>{const L=E();L?.access_token&&(pi(L.access_token,R=>{R&&b(R)}),Je(L.access_token,R=>{R&&R.length>0&&a(R[0])},!0))});const y=L=>{const R=L.currentTarget.value;t(R),h(R)},w=()=>{t(""),h("")},p=(L,R)=>{if(L.duration===void 0){const A=E();A?.access_token&&Pe(L.id,A.access_token,Q=>{e.submitNewVideoFront({videoID:Q.id,duration:Q.duration??0},L.title),R&&_e.pushItem(R)})}else e.submitNewVideoFront({videoID:L.id,duration:L.duration??0},L.title),R&&_e.pushItem(R)},k=(L,R)=>{if(L.duration===void 0){const A=E();A?.access_token&&Pe(L.id,A.access_token,Q=>{e.submitNewVideoEnd({videoID:Q.id,duration:Q.duration??0},L.title),R&&_e.pushItem(R)})}else e.submitNewVideoEnd({videoID:L.id,duration:L.duration??0},L.title),R&&_e.pushItem(R)},I=(L,R)=>{e.submitAllVideos(L.map(A=>({videoID:A.id,duration:A.duration??0})),R.title),_e.pushItem(R.id)},T=L=>{f(L),vi(L)},F=()=>Zi(g(),u());return(()=>{const L=Hi.cloneNode(!0),R=L.firstChild,A=R.firstChild,Q=A.firstChild,M=Q.firstChild,J=Q.nextSibling,Ne=J.firstChild,me=Ne.nextSibling,re=A.nextSibling;return M.addEventListener("change",y),s(Q,o(N,{get when(){return n.length>0},get children(){const D=Ji.cloneNode(!0);return D.$$click=w,s(D,o(Qt,{size:"1.5rem"})),C(()=>x(D,be.searchClear)),D}}),null),s(Ne,o(Ft,{size:"2rem"})),s(me,o(Y,{each:Ki,children:(D,ne)=>(()=>{const ae=Yi.cloneNode(!0),z=ae.firstChild;return z.$$click=()=>T(ne()),s(z,(()=>{const de=H(()=>u()===ne(),!0);return()=>de()?(()=>{const fe=Gi.cloneNode(!0);return s(fe,()=>D.display),fe})():D.display})()),ae})()})),s(re,o(N,{get when(){return l()},get children(){return o(ut,{get info(){return l()},queueVideoEnd:k,queueVideoFront:p,submitPlaylist:I,searchText:""})}}),null),s(re,o(Y,{get each(){return i()},children:D=>{const ne=()=>p(D,void 0);return o(Xe,{enablePreview:!0,get info(){return{...D,thumbnailURL:D.thumbnailMaxRes?.url??""}},onClick:()=>k(D,void 0),get actionComponent(){return(()=>{const z=Wi.cloneNode(!0);return s(z,o(Ye,{size:"1.5rem",onClick:ne})),z})()}})}}),null),s(re,o(N,{get when(){return H(()=>!!(v()&&$().length===0),!0)()&&i().length===0},get children(){return o(ji,{get info(){return{id:"",channel:"",description:"",title:"Liked Videos",videoCount:0,thumbnailMaxRes:v().thumbnailMaxRes}},queueVideoEnd:k,queueVideoFront:p,submitPlaylist:I,searchText:""})}}),null),s(re,o(N,{get when(){return i().length===0},get children(){return o(Y,{get each(){return F()},children:D=>o(ut,{info:D,queueVideoEnd:k,queueVideoFront:p,submitPlaylist:I,get searchText(){return $().toLocaleUpperCase()}})})}}),null),C(D=>{const ne=be.queueContainer,ae=be.queueTabBody,z=be.searchDiv,de=be.inputDiv,fe={[be.sortDropdown]:!0,"dropdown dropdown-end":!0},he=qe.scrollBox;return ne!==D._v$&&x(L,D._v$=ne),ae!==D._v$2&&x(R,D._v$2=ae),z!==D._v$3&&x(A,D._v$3=z),de!==D._v$4&&x(Q,D._v$4=de),D._v$5=le(J,fe,D._v$5),he!==D._v$6&&x(re,D._v$6=he),D},{_v$:void 0,_v$2:void 0,_v$3:void 0,_v$4:void 0,_v$5:void 0,_v$6:void 0}),C(()=>M.value=n()),L})()}G(["click"]);const er=S('<button class="btn btn-circle btn-ghost btn-secondary tooltip tooltip-left inline-flex" data-tip="Remove From Queue"></button>'),tr=S('<div class="p-2 flex flex-col w-full"><div class="px-2 overflow-hidden text-ellipsis whitespace-nowrap inline-block text-xl min-h-8"></div><section></section><div class="flex sticky bottom-0 bg-neutral-800 z-50"><button>Shuffle All</button><button>Remove All</button></div></div>'),nr=S('<div class="bg-neutral-800"></div>'),ir=Bt,ct={removeAllButton:_`
        float: right;
        color: var(--theme-secondary-light) !important;
        font-size: 1rem;
        margin: 0.5rem 1rem;
    `,editTitle:_`
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-height: 2.5rem;
        display: inline-block;
    `};function Ue(e){return e.filter((n,t)=>e.findIndex(i=>i.youtubeID===n.youtubeID)===t)}function rr(e){const n=()=>e.removeVideo(e.vid.youtubeID);return o(et,{get videoID(){return e.vid.youtubeID},get duration(){return e.vid.duration},enablePreview:!1,get actionComponent(){return(()=>{const t=er.cloneNode(!0);return t.$$click=n,s(t,o(vt,{size:"1.5rem"})),t})()}})}function or(e){const[n,t]=P([]);q(()=>{t(Ue(e.playlist.map(b=>({...b,id:b.youtubeID}))))});const i=gt(b=>{e.updatePlaylist(e.userID,Ue(b))},600),r=()=>{e.removeAll(e.userID)},l=()=>{const b=[...e.playlist];for(let v=b.length-1;v>0;v--){const a=Math.floor(Math.random()*v),$=b[v];b[v]=b[a],b[a]=$}e.updatePlaylist(e.userID,b)},d=b=>{const{items:v}=b.detail;t(Ue(v))},g=b=>{const{items:v}=b.detail;i(v),t(Ue(v))};return(()=>{const b=tr.cloneNode(!0),v=b.firstChild,a=v.nextSibling,$=a.nextSibling,m=$.firstChild,u=m.nextSibling;return s(v,()=>self?"Editing Queue":`Editing Queue for ${e.userName}`),ir(a,()=>({items:n,flipDurationMs:0})),a.addEventListener("consider",d),a.addEventListener("finalize",g),s(a,o(Y,{get each(){return n()},children:f=>(()=>{const c=nr.cloneNode(!0);return s(c,o(rr,{vid:f,get removeVideo(){return e.removeVideo}})),c})()})),m.$$click=l,u.$$click=r,C(f=>{const c={"btn btn-ghost btn-primary":!0,[ct.removeAllButton]:!0},h={"btn btn-ghost btn-primary":!0,[ct.removeAllButton]:!0};return f._v$=le(m,c,f._v$),f._v$2=le(u,h,f._v$2),f},{_v$:void 0,_v$2:void 0}),b})()}G(["click"]);const lr=S("<div></div>"),sr=S('<button class="btn btn-circle btn-sm btn-ghost text-primary tooltip tooltip-left inline-flex" data-tip="Queue Front"></button>');function ar(e){ie();const n=i=>{const r=E();r?.access_token&&Pe(i,r.access_token,l=>{e.submitNewVideoFront({videoID:l.id,duration:l.duration??0},l.title)})},t=i=>{const r=E();r?.access_token&&Pe(i,r.access_token,l=>{e.submitNewVideoEnd({videoID:l.id,duration:l.duration??0},l.title)})};return(()=>{const i=lr.cloneNode(!0);return s(i,o(Y,{get each(){return e.history},children:r=>{const l=()=>n(r);return o(et,{videoID:r,enablePreview:!0,onClick:()=>t(r),get actionComponent(){return(()=>{const g=sr.cloneNode(!0);return s(g,o(Ye,{size:"1.5rem",onClick:l})),g})()}})}})),C(()=>x(i,qe.scrollBox)),i})()}const dr=S("<div><h2>Current Users:</h2></div>"),ur=S('<div class="dropdown dropdown-end"><label tabindex="0" class="btn btn-circle btn-sm btn-ghost btn-secondary"></label><ul tabindex="0" class="dropdown-content menu rounded-lg"><li class="text-sm"><a></a></li></ul></div>'),cr=S("<div><div></div></div>"),je={AdminName:_`
        color: var(--theme-secondary-light) !important;
    `,UserRow:_`
        display: flex;
        justify-content: space-between;
    `,userContainer:_`
        padding: 1rem;
    `};function mr(e){return(()=>{const n=dr.cloneNode(!0);return n.firstChild,s(n,o(Y,{get each(){return e.currentUsers},children:t=>{const i=()=>e.adminList.includes(t.clientID);return(()=>{const r=cr.cloneNode(!0),l=r.firstChild;return s(l,()=>t.name),s(r,o(N,{get when(){return e.isAdmin&&t.userCount!==0},get children(){const d=ur.cloneNode(!0),g=d.firstChild,b=g.nextSibling,v=b.firstChild,a=v.firstChild;return s(g,o(qt,{size:"1.5rem"})),a.$$click=()=>{i()?e.removeAdmin(t.clientID):e.addAdmin(t.clientID)},s(a,o(N,{get when(){return i()},fallback:"Make Admin",children:"Remove Admin"})),d}}),null),C(d=>{const g=je.UserRow,b={"leading-9":!0,[je.AdminName]:i()};return g!==d._v$&&x(r,d._v$=g),d._v$2=le(l,b,d._v$2),d},{_v$:void 0,_v$2:void 0}),r})()}}),null),C(()=>x(n,[je.userContainer,qe.scrollBox].join(" "))),n})()}G(["click"]);const fr=S('<label class="label cursor-pointer"><span class="label-text"></span><input type="checkbox" class="checkbox checkbox-primary no-animation"></label>'),hr=S('<div><button class="btn btn-secondary mt-auto"></button></div>'),gr=S('<div><div>Room name:</div><div><input class="input"></div><div>Trim:</div><div><input class="input w-full" type="number"></div><div class="font-semibold mt-3">Room Admins:</div><button class="btn btn-primary mt-4">Save</button></div>'),vr=S('<div><div></div><button class="btn btn-circle btn-ghost btn-sm inline-flex tooltip" data-tip="Remove Admin"></button></div>'),ue={settingContainer:_`
        padding: 1rem;
        display: flex;
        flex-direction: column;
        width: 32rem;
        margin: 0 auto;
    `,settingFullWidth:_`
        width: 100%;
        display: flex;
        flex-direction: column;
    `,settingTrimField:_`
        display: inline-flex;
        & > div {
            padding: 0;
            margin-bottom: 0;
            width: 8rem;
        }
    `,settingTrimLabel:_`
        display: inline-flex;
        margin-right: 1rem;
    `,settingRemoveIcon:_`
        font-size: 1.5rem;
        color: var(--theme-secondary);
    `,settingUserRow:_`
        display: flex;
        margin: 0.25rem 0;
        justify-content: space-between;
        & div:first-child {
            line-height: 2rem;
        }
    `,deleteButton:_`
        margin-top: auto;
        background-color: var(--theme-primary-dark);
    `};function Ae(e){return(()=>{const n=fr.cloneNode(!0),t=n.firstChild,i=t.nextSibling;return s(t,()=>e.label),Se(i,"change",e.onChange),C(()=>i.checked=e.checked),n})()}function br(e){const[n,t]=P([]),[i,r]=P(!1),l=ie();q(()=>{e.roomSettings&&e.roomSettings.admins.length!==n().length&&Promise.all(e.roomSettings.admins.map(async u=>await fn(l,u))).then(u=>{u.some(f=>f===null)||t(u.reduce((f,c)=>(c&&f.push(c),f),[]))})});const d=u=>{if(e.roomSettings===null)return;const f={...e.roomSettings};u.currentTarget.value.length>0&&(f.settings.name=u.currentTarget.value,e.setRoomSettings(f))},g=u=>{if(e.roomSettings===null)return;const f={...e.roomSettings},c=Number(u.currentTarget.value);Number.isNaN(c)||(f.settings.trim=Math.floor(c),e.setRoomSettings(f))},b=()=>{if(e.roomSettings===null)return;const u={...e.roomSettings};u.settings.guestControls=!u.settings.guestControls,e.setRoomSettings(u)},v=()=>{if(e.roomSettings===null)return;const u={...e.roomSettings};u.settings.publicVisibility=!u.settings.publicVisibility,e.setRoomSettings(u)},a=()=>{if(e.roomSettings===null)return;const u={...e.roomSettings};u.settings.hifiTiming=!u.settings.hifiTiming,e.setRoomSettings(u)},$=()=>{if(e.roomSettings===null)return;const u={...e.roomSettings};u.settings.skipErrors=!u.settings.skipErrors,e.setRoomSettings(u)},m=()=>{i()?e.removeRoom():r(!0)};return(()=>{const u=hr.cloneNode(!0),f=u.firstChild;return u.$$click=c=>c.stopPropagation(),s(u,o(N,{get when(){return e.roomSettings},children:c=>(()=>{const h=gr.cloneNode(!0),y=h.firstChild,w=y.nextSibling,p=w.firstChild,k=w.nextSibling,I=k.nextSibling,T=I.firstChild,F=I.nextSibling,L=F.nextSibling;return p.addEventListener("change",d),T.addEventListener("change",g),s(h,o(Ae,{label:"Guest Controls",get checked(){return c.settings.guestControls},onChange:b}),F),s(h,o(Ae,{label:"Public Visibility",get checked(){return c.settings.publicVisibility},onChange:v}),F),s(h,o(Ae,{label:"Higher Fidelity Timing",get checked(){return c.settings.hifiTiming},onChange:a}),F),s(h,o(Ae,{label:"Skip Errored Videos",get checked(){return c.settings.skipErrors},onChange:$}),F),s(h,o(Y,{get each(){return n()},children:R=>(()=>{const A=vr.cloneNode(!0),Q=A.firstChild,M=Q.nextSibling;return s(Q,()=>R.name),M.$$click=()=>e.removeAdmin(R.id),s(M,o(vt,{get class(){return ue.settingRemoveIcon}})),C(()=>x(A,ue.settingUserRow)),A})()}),L),Se(L,"click",e.submitSettings,!0),C(R=>{const A=["font-semibold",ue.settingTrimLabel].join(" "),Q=ue.settingFullWidth,M=["font-semibold mt-3",ue.settingTrimLabel].join(" "),J=ue.settingTrimField+" form-control w-full";return A!==R._v$&&x(y,R._v$=A),Q!==R._v$2&&x(w,R._v$2=Q),M!==R._v$3&&x(k,R._v$3=M),J!==R._v$4&&x(I,R._v$4=J),R},{_v$:void 0,_v$2:void 0,_v$3:void 0,_v$4:void 0}),C(()=>p.value=c.settings.name),C(()=>T.value=c.settings.trim),h})()}),f),f.$$click=m,s(f,o(N,{get when(){return i()},fallback:"Delete Room",children:"Confirm Room Deletion?"})),C(()=>x(u,ue.settingContainer)),u})()}G(["click"]);const $r=S("<div></div>"),yr=S("<div><div></div></div>"),_r=S('<div dat-tip="Minimize"><div></div></div>'),wr=S("<div><div></div><div></div></div>"),X={sidebarContainer:_`
        width: 4.5rem;
        background-color: var(--dp4-surface);
        padding-top: 0.5rem;
        transition: width 0.2s;
        overflow: hidden;
        display: flex;
        flex-flow: column;
        @media (max-width: 960px) {
            width: 100%;
        }
    `,sidebarContainerExpanded:_`
        width: 40rem;
        max-width: 40rem;
        min-width: 40rem;
        @media (max-width: 960px) {
            max-width: unset;
            width: 100%;
        }
    `,sidebarTabs:_`
        display: flex;
        flex-flow: wrap;
    `,sidebarTabsExpanded:_`
        padding: 0 0.5rem;
        border-bottom: 2px solid var(--theme-secondary-dark);
        padding-bottom: 0.25rem;
        margin: var(--expandedMargin, unset);
        --expandedMargin: 0 0.5rem;
        --expandedHeight: 100%;
    `,sidebarTabIcon:_`
        color: var(--theme-secondary);
        padding: 0.75rem;
        margin: var(--expandedMargin, 0.25rem 0.125rem);
        height: var(--expandedHeight, unset);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        &:hover {
            background: rgba(0, 0, 0, 0.2);
            color: var(--theme-secondary-light);
        }
    `,sidebarTabIconDiv:_`
        display: flex;
    `,sidebarTabSelected:_`
        color: var(--theme-primary-dark);
        &:hover {
            color: var(--theme-primary-dark);
        }
    `,sidebarTabClose:_`
        margin-left: auto;
        @media (max-width: 960px) {
            transform: rotate(90deg);
        }
    `,sidebarBody:_`
        display: flex;
        overflow: hidden;
        height: 100%;
        width: 100%;
    `,sidebarTabBody:_`
        width: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    `};function $e(e){return(()=>{const n=$r.cloneNode(!0);return s(n,()=>e.children),C(t=>{const i=X.sidebarTabBody,r=e.current===e.index?"flex":"none";return i!==t._v$&&x(n,t._v$=i),r!==t._v$2&&n.style.setProperty("display",t._v$2=r),t},{_v$:void 0,_v$2:void 0}),n})()}function ye(e){return(()=>{const n=yr.cloneNode(!0),t=n.firstChild;return n.$$click=()=>e.selectTab(e.index),s(t,()=>e.children),C(i=>{const r=e.title,l={[X.sidebarTabIcon]:!0,"tooltip tooltip-bottom z-10":!0,[X.sidebarTabSelected]:e.expanded&&e.current===e.index},d=X.sidebarTabIconDiv;return r!==i._v$3&&j(n,"data-tip",i._v$3=r),i._v$4=le(n,l,i._v$4),d!==i._v$5&&x(t,i._v$5=d),i},{_v$3:void 0,_v$4:void 0,_v$5:void 0}),n})()}function xr(e){const[n,t]=P(!!at()),[i,r]=P(at()),[l,d]=P("");q(()=>{d(e.userID)});const g=h=>{r(h),gi(h),t(!0),d(e.userID)},b=()=>{r(0),t(!1)},v="2.5rem",a=()=>{if(e.roomSettings!==null){const h={...e.roomSettings.settings};h.name=h.name.trim(),h.name.length>0&&e.wsCallbacks.updateSettings(h)}},$=()=>{wn(e.roomSettings?.roomID??0).then(h=>{h&&(document.location.href="/")})},m=h=>{d(h),r(3)};let u=null;wi("preview",h=>{if(h&&u===null&&e.playing){u=e.playerVolume;const y=u/4,w=5;e.setPlayerVolume(y<w?y:w)}else!h&&u!==null&&(e.setPlayerVolume(u),u=null)});const c=()=>e.videoPlaylist[l()]?.length>0;return q(()=>{!c()&&i()===3&&(e.allowQueuing?r(2):r(1))}),(()=>{const h=wr.cloneNode(!0),y=h.firstChild,w=y.nextSibling;return s(y,o(ye,{index:1,title:"Video Queue",get current(){return i()},selectTab:g,get expanded(){return n()},get children(){return o(zt,{size:v})}}),null),s(y,o(N,{get when(){return e.allowQueuing},get children(){return o(ye,{index:2,title:"Add Videos to Queue",get current(){return i()},selectTab:g,get expanded(){return n()},get children(){return o(ht,{size:v})}})}}),null),s(y,o(N,{get when(){return c()},get children(){return o(ye,{index:3,title:"Edit Queue",get current(){return i()},selectTab:g,get expanded(){return n()},get children(){return o(ft,{size:v})}})}}),null),s(y,o(N,{get when(){return e.history.length>0},get children(){return o(ye,{index:4,title:"History",get current(){return i()},selectTab:g,get expanded(){return n()},get children(){return o(Mt,{size:v})}})}}),null),s(y,o(ye,{index:5,title:"Users",get current(){return i()},selectTab:g,get expanded(){return n()},get children(){return o(Ot,{size:v})}}),null),s(y,o(N,{get when(){return e.adminPermissions},get children(){return o(ye,{index:6,title:"Room Settings",get current(){return i()},selectTab:g,get expanded(){return n()},get children(){return o(jt,{size:v})}})}}),null),s(y,o(N,{get when(){return n()},get children(){const p=_r.cloneNode(!0),k=p.firstChild;return p.$$click=b,s(k,o(Jt,{size:v})),C(I=>{const T={"tooltip tooltip-bottom":!0,[X.sidebarTabClose]:!0},F=X.sidebarTabIcon;return I._v$6=le(p,T,I._v$6),F!==I._v$7&&x(k,I._v$7=F),I},{_v$6:void 0,_v$7:void 0}),p}}),null),s(w,o($e,{index:1,get current(){return i()},get children(){return o(Fi,{get allowRemoval(){return e.adminPermissions},get currentUser(){return e.userID},get currentUsers(){return e.currentUsers},openEdit:m,get userQueue(){return e.userQueue},get videoPlaylist(){return e.videoPlaylist}})}}),null),s(w,o($e,{index:2,get current(){return H(()=>!!e.allowQueuing,!0)()?i():0},get children(){return o(Xi,{get submitAllVideos(){return e.wsCallbacks.submitAllVideos},get submitNewVideoEnd(){return e.wsCallbacks.submitVideoBack},get submitNewVideoFront(){return e.wsCallbacks.submitVideoFront}})}}),null),s(w,o($e,{index:3,get current(){return H(()=>!!e.allowQueuing,!0)()?i():0},get children(){return o(or,{get userID(){return l()},get playlist(){return e.videoPlaylist[l()]??[]},get userName(){return e.currentUsers.find(p=>p.clientID===l())?.name??""},get self(){return l()===e.userID},get removeVideo(){return e.wsCallbacks.removeVideo},get removeAll(){return e.wsCallbacks.removeAllVideos},updatePlaylist:(p,k)=>e.wsCallbacks.reorderQueue(p,k.map(I=>({videoID:I.youtubeID,duration:I.duration})))})}}),null),s(w,o($e,{index:4,get current(){return i()},get children(){return o(ar,{get history(){return e.history},get submitNewVideoFront(){return e.wsCallbacks.submitVideoFront},get submitNewVideoEnd(){return e.wsCallbacks.submitVideoBack}})}}),null),s(w,o($e,{index:5,get current(){return i()},get children(){return o(mr,{get addAdmin(){return e.wsCallbacks.addAdmin},get adminList(){return e.adminUsers},get currentUsers(){return e.currentUsers},get isAdmin(){return e.adminPermissions},get removeAdmin(){return e.wsCallbacks.removeAdmin},get userID(){return e.userID}})}}),null),s(w,o($e,{index:6,get current(){return H(()=>!!e.adminPermissions,!0)()?i():0},get children(){return o(br,{get removeAdmin(){return e.wsCallbacks.removeAdmin},get roomSettings(){return e.roomSettings},get setRoomSettings(){return e.setRoomSettings},submitSettings:a,removeRoom:$})}}),null),C(p=>{const k=[X.sidebarContainer,n()?X.sidebarContainerExpanded:""].join(" "),I=[X.sidebarTabs,n()?X.sidebarTabsExpanded:""].join(" "),T=X.sidebarBody;return k!==p._v$8&&x(h,p._v$8=k),I!==p._v$9&&x(y,p._v$9=I),T!==p._v$10&&x(w,p._v$10=T),p},{_v$8:void 0,_v$9:void 0,_v$10:void 0}),h})()}G(["click"]);const Sr=S('<div><div id="youtube-player"></div></div>');var K;(function(e){e[e.Reset=0]="Reset",e[e.Playing=1]="Playing",e[e.Paused=2]="Paused",e[e.Finished=3]="Finished"})(K||(K={}));function pr(){let e=!1,n,t,i=K.Reset,r=null,l=0,d=0,g=0;const[b,v]=P(!1),a=f=>{if(!t||!b())return 0;const c=Math.max(0,Math.min(f,100));return t.setVolume(c),c},$=()=>!t||!b()?0:t.getVolume(),m=(f,c)=>{if(!(!t||!b()))switch(i){case K.Reset:c?(i=K.Playing,m(f,c)):t.stopVideo();break;case K.Playing:Math.abs(t.getCurrentTime()-f)>1&&(t.seekTo(f,!0),l=f),t.getPlayerState()===0?i=K.Finished:t.getPlayerState()!==1&&(t.playVideo(),t.playVideo()),c||(i=K.Paused,m(f,c));break;case K.Paused:Math.abs(t.getCurrentTime()-f)>1&&(t.seekTo(f,!0),l=f),t.getPlayerState()!==2&&t.pauseVideo(),c&&(i=K.Playing,m(f,c));break;case K.Finished:c&&(i=K.Playing,m(f,c));break}};return{component:function(c){const h=()=>{if(!e||!b()||!t)return;const k=t.getCurrentTime(),I=Math.floor(k),T=new Date().getTime();l>0&&T-d<1500&&Math.abs(k-l)>2.5&&I!==g&&(console.log("Player Seek to ",k," from ",l),c.seekTo(I),t.seekTo(I,!0),g=I),l=k,d=T};q(()=>{if(c.id!==n){const k=document.getElementById(`youtube-player-${n}`);k&&k?.parentElement?.removeChild(k),window.YT&&w()}}),se(()=>{r&&clearInterval(r)});const y=()=>{e=!0,w()},w=()=>{n=c.id,e&&(!b()&&n?t=new window.YT.Player("youtube-player",{host:"https://www.youtube-nocookie.com",videoId:n,events:{onReady:p,onError:k=>{const I=xt(k.target.getVideoUrl());B("Youtube Player Encountered Error","error"),I&&c.playerError(I)}},playerVars:{fs:1,disablekb:1,playsinline:1,origin:"https://www.youtube.com"}}):n?(l=0,g=0,t?.loadVideoById(n),t?.pauseVideo()):(t?.destroy(),v(!1)))},p=()=>{v(!0),l=0,d=new Date().getTime(),g=0,c.playerMount()};return pe(()=>{if(window.YT)e=!0,w();else{const k=document.createElement("script");k.src="https://www.youtube.com/iframe_api",window.onYouTubeIframeAPIReady=y;const I=document.getElementsByTagName("script")[0];I.parentNode?.insertBefore(k,I)}r=setInterval(h,250)}),(()=>{const k=Sr.cloneNode(!0);return k.firstChild,C(()=>x(k,c.className)),k})()},setVolume:a,getVolume:$,isPlayerMounted:b,synchronizeYoutube:m}}const kr=S("<div><div></div></div>"),Rr=S("<div></div>"),Cr=S("<div><h1>Room Does not Exist</h1></div>"),Ce={pageRoot:_`
        padding-top: var(--navbar-height);
        min-height: 100%;
        width: 100%;
        max-height: 100%;
        display: flex;
        flex-flow: column;
    `,nonexistantRoom:_`
        display: flex;
        justify-content: center;
        margin-top: 4rem;
    `,splitPane:_`
        display: flex;
        flex-direction: row;
        flex: auto;
        overflow-y: hidden;
        @media (max-width: 960px) {
            flex-direction: column;
        }
    `,videoPanel:_`
        width: 100%;
        display: flex;
        flex-flow: column;
        padding: 1rem;
        flex: auto;
        min-height: 33vh;
    `,videoDiv:_`
        height: 100%;
        display: flex;
        flex: auto;
        & iframe {
            width: 100%;
            height: auto;
        }
    `};function Vr(){const{roomID:e}=Ht(),[n,t]=P(""),[i,r]=P([]),[l,d]=P([]),[g,b]=P({}),[v,a]=P([]),[$,m]=P([]),[u,f]=P(!1),[c,h]=P(null),[y,w]=P(0),[p,k]=P(null),[I,T]=P(!1),[F,L]=P(0),[R,A]=P(!1);let Q=0,M=null;M=c();const J=pr(),Ne=J.component,me=ie();let re;pe(()=>{Qe(me,e).then(V=>{V===null&&T(!0)}),$n(me,e).then(V=>{V!==null&&m(V)}),re=setInterval(()=>{const V=new Date().getTime();M===null&&Q&&V-Q>30*60*1e3&&(document.location.href="/")},60*1e3)}),se(()=>{ze(""),clearInterval(re)}),q(()=>{Qe(me,e).then(V=>{me.signal.aborted||k(V),V===null&&B("Failed to Retrieve Room Settings","error")})});const D=V=>{h(V),V&&(L(V.timeStamp),A(V.playing))},ne=()=>{J.synchronizeYoutube(F(),R());const V=hi();V<0?w(J.getVolume()):w(J.setVolume(V))};q(()=>{J.synchronizeYoutube(F(),R())});const z=mi(e,V=>{switch(V.t!==U.Ping&&(Q=new Date().getTime()),V.t){case U.Ping:break;case U.Init:t(V.ID??""),V.Room&&(ze(V.Room.roomName),r(V.Room.userList),d(V.Room.adminList),D(V.Room.video??null),b(V.Room.playlist),a(V.Room.userQueue),f(V.Room.guestControls),A(V.Room.video?.playing??!1));break;case U.Room:V.Room&&(ze(V.Room.roomName),f(V.Room.guestControls),d(V.Room.adminList));break;case U.Video:V.Video&&m(W=>{const ke=V.Video;return ke&&(W=W.slice(0,248),W.unshift(ke.youtubeID)),W}),D(V.Video??null);break;case U.Play:A(!0);break;case U.Pause:A(!1);break;case U.Sync:L(Number(V.d));break;case U.UserList:r(V.d);break;case U.QueueOrder:b(V.d);break;case U.UserOrder:a(V.d);break;case U.Error:B(V.error??"Room Error","error");break;default:console.warn("Invalid Websocket Type Received");return}});P(()=>{E()&&E().id!==n()&&(z.ws?.close(),t(E().id))});const de=V=>{w(J.setVolume(V)),fi(V)},fe=()=>{z.togglePlay(R())},he=()=>n().length>0&&l().includes(n()),Vt=()=>(E()&&E().access_token.length>0)??!1,Pt=()=>J.isPlayerMounted();return(()=>{const V=Rr.cloneNode(!0);return s(V,o(N,{get when(){return!I()},get fallback(){return(()=>{const W=Cr.cloneNode(!0);return C(()=>x(W,Ce.nonexistantRoom)),W})()},get children(){const W=kr.cloneNode(!0),ke=W.firstChild;return s(ke,o(Ne,{get className(){return Ce.videoDiv},get id(){return c()?.youtubeID??""},playerMount:ne,get playerError(){return z.logError},get playerReady(){return z.logReady},get seekTo(){return z.seekVideo}})),s(W,o(xr,{get playing(){return R()},get playerVolume(){return y()},setPlayerVolume:de,get adminPermissions(){return he()},get adminUsers(){return l()},get history(){return $()},get currentUsers(){return i()},get roomSettings(){return p()},setRoomSettings:k,get userID(){return n()},get userQueue(){return v()},get videoPlaylist(){return g()},wsCallbacks:z,get allowQueuing(){return Vt()}}),null),C(Re=>{const tt=Ce.splitPane,nt=Ce.videoPanel;return tt!==Re._v$&&x(W,Re._v$=tt),nt!==Re._v$2&&x(ke,Re._v$2=nt),Re},{_v$:void 0,_v$2:void 0}),W}}),null),s(V,o(N,{get when(){return!I()},get children(){return o(ai,{get hasVideo(){return Pt()},get playing(){return R()},get currentVideo(){return c()},get userList(){return i()},togglePlay:fe,get skipVideo(){return z.skipVideo},get canPause(){return u()||he()},get canSkip(){return u()||he()||c()?.queuedBy===n()},get playerVolume(){return y()},setPlayerVolume:de})}}),null),C(()=>x(V,Ce.pageRoot)),V})()}const Pr=S('<div id="app"></div>'),Nr=()=>(Un(),(()=>{const e=Pr.cloneNode(!0);return s(e,o(Qn,{}),null),s(e,o(an,{}),null),s(e,o(Yt,{get children(){return[o(Le,{path:"/",component:Wn}),o(Le,{path:"/profile",component:ot}),o(Le,{path:"/login",component:ot}),o(Le,{path:"room/:roomID",component:Vr})]}}),null),e})());Gt(()=>o(Wt,{get children(){return o(Nr,{})}}),document.getElementById("root"));
