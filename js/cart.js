const CART_KEY = 'museumCartV1';
const MEMBER_DISCOUNT_RATE = 0.15;
const TAX_RATE = 0.102;
const SHIPPING_RATE = 25.00;

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(n) {
  const sign = n < 0 ? -1 : 1;
  const s = '$' + Math.abs(n).toFixed(2);
  return sign < 0 ? '(' + s + ')' : s;
}

function volumeRate(total) {
  const tiers = [
    [0, 49.99, 0.00],
    [50, 99.99, 0.05],
    [100, 199.99, 0.10],
    [200, Infinity, 0.15]
  ];
  for (const [min, max, rate] of tiers) {
    if (total >= min && total <= max) return rate;
  }
  return 0;
}

function removeItem(id) {
  const cart = readCart().map(item => {
    if (item.id === id) item.qty = 0;
    return item;
  });
  writeCart(cart);
  render();
}

function render() {
  const itemsDiv   = document.getElementById('items');
  const summaryPre = document.getElementById('summary');
  const emptyMsg   = document.getElementById('emptyMsg');
  const isMember   = document.getElementById('memberToggle').checked;

  const cart = readCart().filter(it => it.qty > 0 && it.unitPrice > 0);

  if (cart.length === 0) {
    itemsDiv.hidden = true;
    summaryPre.hidden = true;
    emptyMsg.hidden = false;
    return;
  }

  itemsDiv.innerHTML = '';
  itemsDiv.hidden = false;
  emptyMsg.hidden = true;

  let subtotal = 0;

  cart.forEach(item => {
    const line = document.createElement('div');
    line.style.display = 'flex';
    line.style.justifyContent = 'space-between';
    line.style.alignItems = 'center';
    line.style.marginBottom = '10px';

    const leftGroup = document.createElement('span');
    leftGroup.style.display = 'flex';
    leftGroup.style.alignItems = 'center';

    const left = document.createElement('span');
    left.textContent = `${item.qty} × ${item.name}`;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginLeft = '10px';
    removeBtn.onclick = () => removeItem(item.id);

    leftGroup.appendChild(left);
    leftGroup.appendChild(removeBtn);

    const right = document.createElement('span');
    const itemTotal = item.unitPrice * item.qty;
    right.textContent = money(itemTotal);
    subtotal += itemTotal;

    line.appendChild(leftGroup);
    line.appendChild(right);
    itemsDiv.appendChild(line);
  });

  const volumeDiscountRate = volumeRate(subtotal);
  const volumeDiscount = subtotal * volumeDiscountRate;
  const memberDiscount = isMember ? subtotal * MEMBER_DISCOUNT_RATE : 0;

  let discountType = '';
  let discountAmount = 0;
  let volumeShown = 0;
  let memberShown = 0;

  if (isMember && volumeDiscount > 0) {
    const useMember = confirm(
      `Both Member and Volume discounts are available.\n` +
      `Member Discount: ${money(memberDiscount)}\n` +
      `Volume Discount: ${money(volumeDiscount)}\n\n` +
      `Would you like to apply the Member Discount instead of Volume Discount?`
    );
    if (useMember) {
      discountType = 'Member Discount';
      discountAmount = memberDiscount;
      memberShown = memberDiscount;
    } else {
      discountType = 'Volume Discount';
      discountAmount = volumeDiscount;
      volumeShown = volumeDiscount;
    }
  } else if (isMember) {
    discountType = 'Member Discount';
    discountAmount = memberDiscount;
    memberShown = memberDiscount;
  } else {
    discountType = 'Volume Discount';
    discountAmount = volumeDiscount;
    volumeShown = volumeDiscount;
  }

  const taxableSubtotal = subtotal - discountAmount + SHIPPING_RATE;
  const taxAmount = taxableSubtotal * TAX_RATE;
  const invoiceTotal = taxableSubtotal + taxAmount;

  let summary = `Hello Shopper, here is your Cart Summary.\n\n`;
  summary += `Subtotal of Items:   ${money(subtotal)}\n`;
  summary += `Volume Discount:     -${money(volumeShown)}\n`;
  summary += `Member Discount:     -${money(memberShown)}\n`;
  summary += `Shipping:            ${money(SHIPPING_RATE)}\n`;
  summary += `Subtotal (Taxable):  ${money(taxableSubtotal)}\n`;
  summary += `Tax Rate:            ${(TAX_RATE * 100).toFixed(1)}%\n`;
  summary += `Tax Amount:          ${money(taxAmount)}\n`;
  summary += `------------------------------\n`;
  summary += `Invoice Total:       ${money(invoiceTotal)}\n`;

  summaryPre.textContent = summary;
  summaryPre.hidden = false;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('memberToggle').addEventListener('change', render);
  document.getElementById('clearBtn').addEventListener('click', () => {
    writeCart([]);
    document.getElementById('memberToggle').checked = false;
    render();
  });

  render();
});