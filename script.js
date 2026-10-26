
const products=[
 {id:1,name:"ওয়্যারলেস হেডফোন",price:1250,old:1600,cat:"ইলেকট্রনিক্স",img:"photo-1505740420928-5e560c06d30e"},
 {id:2,name:"স্মার্ট ঘড়ি",price:1850,old:2200,cat:"ইলেকট্রনিক্স",img:"photo-1523275335684-37898b6baf30"},
 {id:3,name:"স্পোর্টস জুতা",price:2200,old:2700,cat:"ফ্যাশন",img:"photo-1542291026-7eec264c27ff"},
 {id:4,name:"স্টাইলিশ ব্যাগ",price:1450,old:1800,cat:"ফ্যাশন",img:"photo-1548036328-c9fa89d128fa"},
 {id:5,name:"সানগ্লাস",price:650,old:850,cat:"ফ্যাশন",img:"photo-1511499767150-a48a237f0083"},
 {id:6,name:"ডেস্ক ল্যাম্প",price:950,old:1200,cat:"ঘর",img:"photo-1507473885765-e6ed057f782c"},
 {id:7,name:"ক্যামেরা",price:8500,old:9200,cat:"ইলেকট্রনিক্স",img:"photo-1516035069371-29a1b244cc32"},
 {id:8,name:"ব্যাকপ্যাক",price:1150,old:1450,cat:"লাইফস্টাইল",img:"photo-1553062407-98eeb64c6a62"}
];

let category="সব";
let cart=[];

const $=id=>document.getElementById(id);
const money=n=>"৳"+n.toLocaleString("en-US");

function render(){
 const q=$("search").value.trim().toLowerCase();
 const list=products.filter(p=>
  (category==="সব"||p.cat===category)&&p.name.toLowerCase().includes(q)
 );
 $("products").innerHTML=list.map(p=>`
  <article class="card">
   <img loading="lazy" src="https://images.unsplash.com/${p.img}?auto=format&fit=crop&w=400&q=80" alt="${p.name}">
   <div class="cat">${p.cat}</div>
   <h3>${p.name}</h3>
   <div class="price">${money(p.price)} <span class="old">${money(p.old)}</span></div>
   <button class="add" data-add="${p.id}">🛒 কার্টে যোগ করো</button>
  </article>
 `).join("");
 $("resultCount").textContent=list.length+"টি পণ্য";
}

function updateCart(){
 $("count").textContent=cart.reduce((s,p)=>s+p.qty,0);
 $("total").textContent=money(cart.reduce((s,p)=>s+p.price*p.qty,0));
 $("cartItems").innerHTML=cart.map(p=>`
  <div class="cart-row">
   <span>${p.name} × ${p.qty} — ${money(p.price*p.qty)}</span>
   <span>
    <button data-minus="${p.id}">−</button>
    <button data-plus="${p.id}">+</button>
    <button data-remove="${p.id}">বাদ দাও</button>
   </span>
  </div>
 `).join("")||"<p>কার্ট খালি আছে।</p>";
}

$("products").addEventListener("click",e=>{
 const b=e.target.closest("[data-add]");
 if(!b)return;
 const p=products.find(x=>x.id===Number(b.dataset.add));
 const found=cart.find(x=>x.id===p.id);
 if(found)found.qty++;
 else cart.push({...p,qty:1});
 updateCart();
});

$("cartItems").addEventListener("click",e=>{
 const b=e.target.closest("button");
 if(!b)return;
 const id=Number(b.dataset.minus||b.dataset.plus||b.dataset.remove);
 const p=cart.find(x=>x.id===id);
 if(!p)return;
 if(b.dataset.remove!==undefined||b.dataset.minus!==undefined&&p.qty===1)
  cart=cart.filter(x=>x.id!==id);
 else if(b.dataset.minus!==undefined)p.qty--;
 else if(b.dataset.plus!==undefined)p.qty++;
 updateCart();
});

$("categories").addEventListener("click",e=>{
 const b=e.target.closest("[data-cat]");
 if(!b)return;
 category=b.dataset.cat;
 document.querySelectorAll("#categories button").forEach(x=>x.classList.toggle("active",x===b));
 render();
});

$("searchForm").addEventListener("submit",e=>{e.preventDefault();render()});
$("search").addEventListener("input",render);
$("shopBtn").addEventListener("click",()=>$("shop").scrollIntoView({behavior:"smooth"}));

$("cartBtn").addEventListener("click",()=>{
 $("cartSection").hidden=false;
 $("cartSection").scrollIntoView({behavior:"smooth"});
});
$("checkoutBtn").addEventListener("click",()=>{
 if(!cart.length){alert("আগে কার্টে পণ্য যোগ করো।");return}
 $("checkout").hidden=false;
 $("checkout").scrollIntoView({behavior:"smooth"});
});

$("orderForm").addEventListener("submit",e=>{
 e.preventDefault();
 if(!cart.length){alert("কার্টে কোনো পণ্য নেই।");return}
 const f=new FormData(e.currentTarget);
 const lines=cart.map(p=>`${p.name} x ${p.qty} = ${money(p.price*p.qty)}`).join("\n");
 const total=cart.reduce((s,p)=>s+p.price*p.qty,0);
 const order={
  store:"LIMON COMPANY BD",
  name:f.get("name"),
  phone:f.get("phone"),
  address:f.get("address"),
  payment:f.get("payment"),
  items:lines,
  total:money(total),
  bkash:"01633145470"
 };
 $("orderSummary").innerHTML="";
 const box=document.createElement("div");
 box.className="payment";
 const title=document.createElement("h3");
 title.textContent="অর্ডারের খসড়া তৈরি হয়েছে";
 const details=document.createElement("pre");
 details.style.whiteSpace="pre-wrap";
 details.textContent=
  `${order.store}\nনাম: ${order.name}\nমোবাইল: ${order.phone}\nঠিকানা: ${order.address}\nপেমেন্ট: ${order.payment}\n\n${order.items}\nমোট: ${order.total}\nবিকাশ নম্বর: ${order.bkash}\n\nদোকানের কাছে অর্ডার পাঠাতে নিচের কপি বাটন ব্যবহার করো।`;
 const copy=document.createElement("button");
 copy.className="primary";
 copy.textContent="অর্ডারের বিবরণ কপি করো";
 copy.addEventListener("click",async()=>{
  try{
   await navigator.clipboard.writeText(details.textContent);
   copy.textContent="কপি হয়েছে";
  }catch{
   copy.textContent="কপি হয়নি — লেখা নির্বাচন করে কপি করো";
  }
 });
 box.append(title,details,copy);
 $("orderSummary").append(box);
});
render();
updateCart();
