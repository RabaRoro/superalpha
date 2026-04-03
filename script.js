<script type="module">
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, orderBy, query, where, runTransaction } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import { firebaseConfig, BKASH_NUMBER, COD_NUMBER } from './config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const productsMap = new Map();

// Cart Functions
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId, qty = 1) {
  const product = productsMap.get(productId);
  if (!product) return;

  let cart = getCart();
  const existing = cart.find(i => i.id === productId);
  const finalPrice = Number(product.discount || 0) > 0 
    ? Number(product.price) - Number(product.discount) 
    : Number(product.price);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      color: product.color || '',
      price: finalPrice,
      image: product.images?.[0] || '',
      qty: qty
    });
  }
  saveCart(cart);
}

function updateCartUI() {
  const cart = getCart();
  document.getElementById('cart-count').textContent = cart.reduce((sum, i) => sum + i.qty, 0);

  const container = document.getElementById('cart-items');
  if (!container) return;

  container.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div style="flex:1">
        <h4>${item.name}</h4>
        <p class="muted">${item.color} × ${item.qty}</p>
      </div>
      <div style="text-align:right">
        ৳${(item.price * item.qty).toLocaleString()}
      </div>
    `;
    container.appendChild(div);
  });

  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.innerHTML = `<strong>Total: ৳${total.toLocaleString()}</strong>`;
}

// Load Products
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    productsMap.clear();
    products.forEach(p => productsMap.set(p.id, p));
    return products;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Render Product Cards (used in index & products)
function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'card product-card';
  card.innerHTML = `
    <img src="${p.images?.[0] || ''}" alt="${p.name}">
    <div class="badges">
      ${p.hotDeal ? '<span class="badge hot">HOT</span>' : ''}
    </div>
    <h3>${p.name}</h3>
    <div class="muted">${p.color || ''}</div>
    <div class="price">৳${Number(p.price).toLocaleString()}</div>
    <button class="add-to-cart-btn kinetic-gradient" data-id="${p.id}">Add to Cart</button>
  `;

  card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(p.id);
  });

  card.addEventListener('click', () => {
    window.location.href = `product.html?slug=${p.name.toLowerCase().replace(/\s+/g, '-')}`;
  });

  return card;
}

// Cart Slider Controls
document.addEventListener('DOMContentLoaded', async () => {
  // Cart open/close
  document.getElementById('cart-link')?.addEventListener('click', () => {
    document.getElementById('cart-slider').classList.add('open');
  });

  document.getElementById('close-cart')?.addEventListener('click', () => {
    document.getElementById('cart-slider').classList.remove('open');
  });

  // Initial load
  const products = await loadProducts();
  updateCartUI();

  // Render on homepage if exists
  const interestContainer = document.getElementById('interest-products');
  if (interestContainer) {
    interestContainer.innerHTML = '';
    products.slice(0, 8).forEach(p => interestContainer.appendChild(createProductCard(p)));
  }

  // Render on products page if exists
  const productList = document.getElementById('product-list');
  if (productList) {
    productList.innerHTML = '';
    products.forEach(p => productList.appendChild(createProductCard(p)));
  }
});
</script>