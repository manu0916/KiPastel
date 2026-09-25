const products = [
  { id: "carne", name: "Carne", description: "Carne moída bem temperada, cebola e cheiro-verde.", price: 12, category: "tradicional", tag: "Clássico" },
  { id: "queijo", name: "Queijo", description: "Muçarela derretida do começo ao fim.", price: 12, category: "tradicional", tag: "Clássico" },
  { id: "pizza", name: "Pizza", description: "Muçarela, presunto, tomate e orégano.", price: 13, category: "tradicional", tag: "Tradicional" },
  { id: "frango", name: "Frango cremoso", description: "Frango desfiado e requeijão cremoso.", price: 14, category: "tradicional", tag: "Favorito" },
  { id: "carne-queijo", name: "Carne + queijo", description: "Carne bem temperada com muçarela puxando.", price: 14, category: "tradicional", tag: "Bem recheado" },
  { id: "calabresa", name: "Calabresa", description: "Calabresa, cebola e muçarela.", price: 13, category: "tradicional", tag: "Tradicional" },
  { id: "ki-completo", name: "Ki Completo", description: "Carne, frango, presunto, queijo, milho e azeitona.", price: 17, category: "especial", tag: "Da casa" },
  { id: "palmito", name: "Palmito cremoso", description: "Palmito, muçarela e requeijão cremoso.", price: 15, category: "especial", tag: "Especial" },
  { id: "moda", name: "À moda da casa", description: "Calabresa, bacon, muçarela e toque de orégano.", price: 16, category: "especial", tag: "Da casa" },
  { id: "banana", name: "Banana com canela", description: "Banana quentinha, açúcar e canela.", price: 12, category: "doce", tag: "Doce" },
  { id: "chocolate", name: "Chocolate + morango", description: "Chocolate cremoso com morangos fatiados.", price: 15, category: "doce", tag: "Doce" },
  { id: "doce-leite", name: "Doce de leite", description: "Doce de leite cremoso em massa crocante.", price: 13, category: "doce", tag: "Doce" }
];

const state = {
  filter: "todos",
  cart: new Map()
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const menuGrid = $("[data-menu-grid]");
const orderBar = $("[data-order-bar]");
const drawer = $("[data-drawer]");
const backdrop = $("[data-drawer-backdrop]");
let lastFocusedElement = null;

function visibleProducts() {
  return state.filter === "todos"
    ? products
    : products.filter((product) => product.category === state.filter);
}

function renderMenu() {
  menuGrid.innerHTML = visibleProducts()
    .map((product) => {
      const added = state.cart.has(product.id);
      return `
        <article class="menu-card" data-category="${product.category}">
          <h3>${product.name}</h3>
          <span class="menu-price">${money.format(product.price)}</span>
          <p>${product.description}</p>
          <span class="menu-tag">${product.tag}</span>
          <button class="add-item${added ? " is-added" : ""}" type="button" data-add-item="${product.id}" aria-label="Adicionar ${product.name} ao pedido">
            ${added ? "Adicionar +" : "Adicionar +"}
          </button>
        </article>`;
    })
    .join("");
}

function cartEntries() {
  return [...state.cart.entries()].map(([id, quantity]) => ({
    ...products.find((product) => product.id === id),
    quantity
  }));
}

function cartSummary() {
  return cartEntries().reduce(
    (summary, item) => {
      summary.count += item.quantity;
      summary.total += item.price * item.quantity;
      return summary;
    },
    { count: 0, total: 0 }
  );
}

function updateCart() {
  const entries = cartEntries();
  const { count, total } = cartSummary();
  const isEmpty = count === 0;

  orderBar.hidden = isEmpty;
  $("[data-order-count]").textContent = `${count} ${count === 1 ? "item" : "itens"}`;
  $("[data-order-total]").textContent = money.format(total);
  $("[data-drawer-total]").textContent = money.format(total);
  $("[data-drawer-empty]").hidden = !isEmpty;
  $("[data-drawer-footer]").hidden = isEmpty;

  $("[data-drawer-items]").innerHTML = entries
    .map((item) => `
      <article class="drawer-item">
        <div>
          <h3>${item.name}</h3>
          <p>${money.format(item.price * item.quantity)}</p>
        </div>
        <div class="quantity-control" aria-label="Quantidade de ${item.name}">
          <button type="button" data-decrease="${item.id}" aria-label="Diminuir ${item.name}">−</button>
          <span aria-live="polite">${item.quantity}</span>
          <button type="button" data-increase="${item.id}" aria-label="Aumentar ${item.name}">+</button>
        </div>
      </article>`)
    .join("");

  const lines = entries.map((item) => `• ${item.quantity}x ${item.name} — ${money.format(item.price * item.quantity)}`);
  const message = [
    "Olá! Gostaria de confirmar este pedido pelo site da Ki Pastel:",
    "",
    ...lines,
    "",
    `Total estimado: ${money.format(total)}`,
    "",
    "Podem confirmar os sabores, os valores e a disponibilidade?"
  ].join("\n");

  $("[data-send-order]").href = `https://wa.me/5535992510716?text=${encodeURIComponent(message)}`;
  renderMenu();
}

function addToCart(id) {
  state.cart.set(id, (state.cart.get(id) || 0) + 1);
  updateCart();
}

function changeQuantity(id, difference) {
  const next = (state.cart.get(id) || 0) + difference;
  if (next <= 0) state.cart.delete(id);
  else state.cart.set(id, next);
  updateCart();
}

function openDrawer() {
  lastFocusedElement = document.activeElement;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  document.body.classList.add("drawer-open");
  requestAnimationFrame(() => $("[data-close-drawer]").focus());
}

function closeDrawer() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  document.body.classList.remove("drawer-open");
  lastFocusedElement?.focus();
}

menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-item]");
  if (!button) return;
  addToCart(button.dataset.addItem);
  button.textContent = "Adicionado ✓";
  window.setTimeout(() => {
    if (button.isConnected) button.textContent = "Adicionar +";
  }, 900);
});

$("[data-filters]").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  $$("[data-filter]").forEach((filter) => {
    const active = filter === button;
    filter.classList.toggle("is-active", active);
    filter.setAttribute("aria-pressed", String(active));
  });
  renderMenu();
});

$("[data-drawer-items]").addEventListener("click", (event) => {
  const increase = event.target.closest("[data-increase]");
  const decrease = event.target.closest("[data-decrease]");
  if (increase) changeQuantity(increase.dataset.increase, 1);
  if (decrease) changeQuantity(decrease.dataset.decrease, -1);
});

$("[data-review-order]").addEventListener("click", openDrawer);
$("[data-close-drawer]").addEventListener("click", closeDrawer);
backdrop.addEventListener("click", closeDrawer);
$("[data-back-to-menu]").addEventListener("click", () => {
  closeDrawer();
  $("#cardapio").scrollIntoView({ behavior: "smooth" });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
});

const menuToggle = $("[data-menu-toggle]");
const nav = $("[data-nav]");

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  nav.classList.toggle("is-open", !isOpen);
});

nav.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  menuToggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-nav], [data-menu-toggle]")) return;
  menuToggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
});

const header = $("[data-header]");
const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

$("[data-year]").textContent = new Date().getFullYear();
renderMenu();
