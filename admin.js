(() => {
  const $ = id => document.getElementById(id);
  let db = null;
  const money = n => '৳' + Number(n || 0).toLocaleString('en-US', {maximumFractionDigits:2});
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const say = (msg, bad=false) => { $('message').textContent = msg; $('message').style.background = bad ? '#ffe8e8' : '#e5f5ec'; };
  function configured() { return window.LIMON_SUPABASE_URL && !window.LIMON_SUPABASE_URL.includes('PASTE_') && window.LIMON_SUPABASE_KEY && !window.LIMON_SUPABASE_KEY.includes('PASTE_') && window.supabase?.createClient; }
  function showLogin() { $('loginPanel').classList.remove('hidden'); $('dashboard').classList.add('hidden'); $('logoutBtn').classList.add('hidden'); }
  function showDashboard() { $('loginPanel').classList.add('hidden'); $('dashboard').classList.remove('hidden'); $('logoutBtn').classList.remove('hidden'); }
  async function checkAdmin() {
    const {data:{session}} = await db.auth.getSession();
    if (!session) { showLogin(); say('অ্যাডমিন ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।'); return; }
    const {data, error} = await db.rpc('is_limon_admin');
    if (error || data !== true) { await db.auth.signOut(); showLogin(); say('এই অ্যাকাউন্ট অ্যাডমিন হিসেবে অনুমোদিত নয়। Supabase admin_users তালিকা পরীক্ষা করুন।', true); return; }
    showDashboard(); say('অ্যাডমিন লগইন সফল।'); await Promise.all([loadProducts(), loadOrders()]);
  }
  async function loadProducts() {
    const root = $('productsAdmin'); root.textContent = 'পণ্য লোড হচ্ছে…';
    const {data,error} = await db.from('products').select('*').order('id', {ascending:false});
    if (error) { root.textContent = 'পণ্য লোড হয়নি: ' + error.message; return; }
    if (!data?.length) { root.textContent = 'এখনো পণ্য নেই। উপরের ফর্মে নতুন পণ্য যোগ করুন।'; return; }
    root.innerHTML = data.map(p => `<div class="product-admin"><div><strong>${esc(p.name)}</strong><p class="muted">ID: ${p.id} · ${esc(p.category)} · ${p.active?'সক্রিয়':'লুকানো'}</p><p>${money(p.price)} ${p.compare_price?`<del>${money(p.compare_price)}</del>`:''} · স্টক ${p.stock}</p></div><div><button class="secondary" type="button" data-edit="${p.id}">সম্পাদনা</button> <button class="secondary danger" type="button" data-delete="${p.id}">মুছুন</button></div></div>`).join('');
  }
  async function loadOrders() {
    const root = $('ordersAdmin'); root.textContent = 'অর্ডার লোড হচ্ছে…';
    const {data,error} = await db.from('orders').select('*').order('created_at', {ascending:false}).limit(100);
    if (error) { root.textContent = 'অর্ডার লোড হয়নি: ' + error.message; return; }
    if (!data?.length) { root.textContent = 'এখনো কোনো অর্ডার আসেনি।'; return; }
    root.innerHTML = `<table><thead><tr><th>অর্ডার</th><th>কাস্টমার</th><th>পণ্য</th><th>মোট</th><th>পেমেন্ট</th><th>স্ট্যাটাস</th><th>তারিখ</th></tr></thead><tbody>${data.map(o => {
      const items = Array.isArray(o.items) ? o.items.map(i => `${esc(i.name)} × ${Number(i.qty)}`).join('<br>') : '';
      const date = new Date(o.created_at).toLocaleString('bn-BD');
      const statuses = [['pending','নতুন'],['confirmed','নিশ্চিত'],['shipped','পাঠানো হয়েছে'],['completed','সম্পন্ন'],['cancelled','বাতিল']];
      return `<tr><td>#${o.id}<br><button class="secondary" type="button" data-details="${o.id}">বিস্তারিত</button></td><td>${esc(o.customer_name)}<br>${esc(o.phone)}<br>${esc(o.address)}</td><td>${items}</td><td>${money(o.total)}</td><td>${esc(o.payment_method)}</td><td><select data-status="${o.id}">${statuses.map(([v,l])=>`<option value="${v}" ${o.status===v?'selected':''}>${l}</option>`).join('')}</select></td><td>${esc(date)}</td></tr><tr id="detail-${o.id}" class="hidden"><td colspan="7"><pre style="white-space:pre-wrap">${esc(JSON.stringify(o.items,null,2))}</pre></td></tr>`;
    }).join('')}</tbody></table>`;
  }
  function clearProduct() { $('productForm').reset(); $('productForm').elements.id.value=''; $('productForm').elements.stock.value='0'; $('productForm').elements.active.checked=true; }
  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.currentTarget); const btn=e.currentTarget.querySelector('button'); btn.disabled=true;
    const {error} = await db.auth.signInWithPassword({email:String(f.get('email')).trim(),password:String(f.get('password'))});
    btn.disabled=false;
    if(error){say('লগইন হয়নি। ইমেইল/পাসওয়ার্ড যাচাই করুন।',true);return;}
    await checkAdmin();
  });
  $('logoutBtn').addEventListener('click', async () => { await db.auth.signOut(); showLogin(); say('লগআউট হয়েছে।'); });
  $('productForm').addEventListener('submit', async e => {
    e.preventDefault(); const f=new FormData(e.currentTarget); const id=String(f.get('id')||'').trim();
    const price=Number(f.get('price')); const compareRaw=String(f.get('compare_price')||'').trim(); const compare=compareRaw===''?null:Number(compareRaw);
    const image=String(f.get('image_url')||'').trim();
    if(!Number.isFinite(price)||price<0){say('দাম সঠিকভাবে দিন।',true);return;}
    if(compare!==null&&(!Number.isFinite(compare)||compare<price)){say('আগের দাম বিক্রির দামের সমান বা বেশি হতে হবে।',true);return;}
    if(!/^https:\/\//i.test(image)){say('ছবির লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে।',true);return;}
    const row={name:String(f.get('name')).trim(),category:String(f.get('category')).trim(),price,compare_price:compare,image_url:image,stock:Number(f.get('stock')),active:$('productForm').elements.active.checked};
    if(!Number.isInteger(row.stock)||row.stock<0){say('স্টক শূন্য বা তার বেশি পূর্ণসংখ্যা হতে হবে।',true);return;}
    let result;
    if(id) result=await db.from('products').update(row).eq('id',Number(id));
    else result=await db.from('products').insert(row);
    if(result.error){say('সংরক্ষণ হয়নি: '+result.error.message,true);return;}
    say(id?'পণ্য আপডেট হয়েছে।':'নতুন পণ্য যোগ হয়েছে।'); clearProduct(); await loadProducts();
  });
  $('clearProduct').addEventListener('click',clearProduct);
  $('productsAdmin').addEventListener('click',async e=>{
    const edit=e.target.closest('[data-edit]'); const del=e.target.closest('[data-delete]');
    if(edit){const {data,error}=await db.from('products').select('*').eq('id',Number(edit.dataset.edit)).single();if(error){say(error.message,true);return;}
      const f=$('productForm').elements;f.id.value=data.id;f.name.value=data.name;f.category.value=data.category;f.price.value=data.price;f.compare_price.value=data.compare_price??'';f.stock.value=data.stock;f.image_url.value=data.image_url;f.active.checked=data.active;$('productForm').scrollIntoView({behavior:'smooth'});say('পণ্য সম্পাদনার জন্য ফর্মে এসেছে।');}
    if(del&&confirm('এই পণ্যটি মুছে ফেলবেন?')){const {error}=await db.from('products').delete().eq('id',Number(del.dataset.delete));if(error)say('মুছতে পারেনি: '+error.message,true);else{say('পণ্য মুছে ফেলা হয়েছে।');await loadProducts();}}
  });
  $('refreshOrders').addEventListener('click',loadOrders);
  $('ordersAdmin').addEventListener('change',async e=>{const s=e.target.closest('[data-status]');if(!s)return;const {error}=await db.from('orders').update({status:s.value}).eq('id',Number(s.dataset.status));if(error){say('স্ট্যাটাস পরিবর্তন হয়নি: '+error.message,true);await loadOrders();}else say('অর্ডারের স্ট্যাটাস আপডেট হয়েছে।');});
  $('ordersAdmin').addEventListener('click',e=>{const b=e.target.closest('[data-details]');if(!b)return;$('detail-'+b.dataset.details)?.classList.toggle('hidden');});
  if(!configured()){say('সেটআপ বাকি: supabase-config.js-এ Project URL ও publishable/anon key বসান।',true);showLogin();return;}
  db=window.supabase.createClient(window.LIMON_SUPABASE_URL,window.LIMON_SUPABASE_KEY);
  checkAdmin();
  db.auth.onAuthStateChange((_event,session)=>{if(!session)showLogin();});
})();
